import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communities, communityMembers, users } from "@/lib/db/schema";
import { createCommunitySchema, communityFilterSchema } from "@/lib/validations";
import {
  deriveIdentity,
  findConflict,
  resolveVerification,
} from "@/lib/communities";
import { buildCommunityPath } from "@/lib/utils";
import { and, asc, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const parents = alias(communities, "parents");

/**
 * GET /api/communities
 * Browse communities with search, type filter, and pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filterResult = communityFilterSchema.safeParse({
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      parentId: searchParams.get("parentId") || undefined,
      scope: searchParams.get("scope") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      sort: searchParams.get("sort") || undefined,
    });

    if (!filterResult.success) {
      return NextResponse.json(
        { error: "Invalid search parameters", details: filterResult.error.format() },
        { status: 400 }
      );
    }

    const query = filterResult.data;
    const offset = (query.page - 1) * query.limit;

    const conditions = [];

    if (query.type) {
      conditions.push(eq(communities.type, query.type));
    }

    if (query.parentId) {
      conditions.push(eq(communities.parentId, query.parentId));
    } else if (query.scope === "root") {
      conditions.push(isNull(communities.parentId));
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(communities.name, `%${query.search}%`),
          ilike(communities.description, `%${query.search}%`),
          ilike(communities.city, `%${query.search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      query.sort === "newest"
        ? desc(communities.createdAt)
        : query.sort === "name"
        ? asc(communities.name)
        : desc(communities.memberCount);

    const data = await db
      .select({
        id: communities.id,
        name: communities.name,
        slug: communities.slug,
        path: communities.path,
        type: communities.type,
        description: communities.description,
        city: communities.city,
        logoUrl: communities.logoUrl,
        visibility: communities.visibility,
        isVerified: communities.isVerified,
        memberCount: communities.memberCount,
        createdAt: communities.createdAt,
        parent: {
          id: parents.id,
          name: parents.name,
          path: parents.path,
        },
      })
      .from(communities)
      .leftJoin(parents, eq(communities.parentId, parents.id))
      .where(whereClause)
      .limit(query.limit)
      .offset(offset)
      .orderBy(orderBy);

    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(communities)
      .where(whereClause);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    return NextResponse.json({
      communities: data,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / query.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities
 * Create a community. Rejects names that collide inside the same parent with a
 * 409 carrying the existing community, so the client can offer "join that one"
 * instead of minting a near-duplicate.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createCommunitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      type,
      visibility,
      city,
      website,
      logoUrl,
      emailDomains,
      instructions,
      parentId,
    } = result.data;

    const identity = deriveIdentity(name);
    if (!identity) {
      return NextResponse.json(
        { error: "Name must contain at least one letter or number" },
        { status: 400 }
      );
    }

    // Resolve the parent first — it decides both the uniqueness scope and the
    // path prefix.
    let parentPath: string | null = null;
    if (parentId) {
      const parentRows = await db
        .select({ id: communities.id, path: communities.path, parentId: communities.parentId })
        .from(communities)
        .where(eq(communities.id, parentId))
        .limit(1);

      const parent = parentRows[0];
      if (!parent) {
        return NextResponse.json(
          { error: "Parent community not found" },
          { status: 404 }
        );
      }

      // Two levels is the whole point of the model: an institution and the
      // clubs inside it. Deeper nesting makes paths and membership ambiguous.
      if (parent.parentId !== null) {
        return NextResponse.json(
          { error: "Communities can only nest one level deep" },
          { status: 400 }
        );
      }

      parentPath = parent.path;
    }

    // Colleges and companies name real-world institutions, so they can't be
    // spun up freely — there is exactly one VIT Vellore.
    if (!parentId && (type === "college" || type === "company")) {
      const userRows = await db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (!userRows[0]?.isAdmin) {
        return NextResponse.json(
          {
            error:
              "Colleges and companies are added by admins. Pick an existing one as the parent, or create a club or interest group instead.",
          },
          { status: 403 }
        );
      }
    }

    const conflict = await findConflict(identity, parentId ?? null);
    if (conflict) {
      return NextResponse.json(
        {
          error: `A community named "${conflict.name}" already exists here.`,
          conflict: {
            id: conflict.id,
            name: conflict.name,
            path: conflict.path,
            memberCount: conflict.memberCount,
          },
        },
        { status: 409 }
      );
    }

    const path = buildCommunityPath(identity.slug, parentPath);
    const isVerifiedMember = await resolveVerification(
      session.user.id,
      emailDomains
    );

    const created = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(communities)
        .values({
          name: name.trim(),
          slug: identity.slug,
          nameKey: identity.nameKey,
          path,
          type,
          parentId: parentId ?? null,
          description,
          instructions,
          instructionsUpdatedAt: instructions ? new Date() : null,
          instructionsUpdatedBy: instructions ? session.user!.id : null,
          visibility,
          city,
          website: website || "",
          logoUrl: logoUrl || "",
          emailDomains,
          ownerId: session.user!.id,
          memberCount: 1,
        })
        .returning();

      const community = inserted[0];

      await tx.insert(communityMembers).values({
        communityId: community.id,
        userId: session.user!.id,
        role: "owner",
        isVerified: isVerifiedMember,
      });

      return community;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
