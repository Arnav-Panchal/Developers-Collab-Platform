import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communities, communityMembers, users } from "@/lib/db/schema";
import { updateCommunitySchema } from "@/lib/validations";
import {
  canManageCommunity,
  deriveIdentity,
  findConflict,
} from "@/lib/communities";
import { buildCommunityPath } from "@/lib/utils";
import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const parents = alias(communities, "parents");

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/communities/[id]
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const rows = await db
      .select({
        community: communities,
        parent: {
          id: parents.id,
          name: parents.name,
          path: parents.path,
        },
      })
      .from(communities)
      .leftJoin(parents, eq(communities.parentId, parents.id))
      .where(eq(communities.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({ ...row.community, parent: row.parent });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      { error: "Failed to fetch community" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communities/[id]
 * Owner/admin edit. A name change re-derives the slug, the comparison key and
 * the materialized path — and rewrites every child's path to match.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingRows = await db
      .select()
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (!(await canManageCommunity(id, session.user.id))) {
      return NextResponse.json(
        { error: "You do not have permission to edit this community" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = updateCommunitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Only site admins may promote a community into a college/company, since
    // that is what the "real institution" badge hangs off.
    if (data.type && data.type !== existing.type) {
      if (
        (data.type === "college" || data.type === "company") &&
        existing.parentId === null
      ) {
        const userRows = await db
          .select({ isAdmin: users.isAdmin })
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1);

        if (!userRows[0]?.isAdmin) {
          return NextResponse.json(
            { error: "Only admins can change a community into a college or company" },
            { status: 403 }
          );
        }
      }
    }

    const updates: Partial<typeof communities.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.description !== undefined) updates.description = data.description;
    if (data.type !== undefined) updates.type = data.type;
    if (data.visibility !== undefined) updates.visibility = data.visibility;
    if (data.city !== undefined) updates.city = data.city;
    if (data.website !== undefined) updates.website = data.website || "";
    if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl || "";
    if (data.emailDomains !== undefined) updates.emailDomains = data.emailDomains;

    let newPath: string | null = null;

    if (data.name !== undefined && data.name.trim() !== existing.name) {
      const identity = deriveIdentity(data.name);
      if (!identity) {
        return NextResponse.json(
          { error: "Name must contain at least one letter or number" },
          { status: 400 }
        );
      }

      const conflict = await findConflict(identity, existing.parentId, existing.id);
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

      // The parent prefix is everything before the last "/" of the current path.
      const lastSlash = existing.path.lastIndexOf("/");
      const parentPath = lastSlash === -1 ? null : existing.path.slice(0, lastSlash);

      newPath = buildCommunityPath(identity.slug, parentPath);

      updates.name = data.name.trim();
      updates.slug = identity.slug;
      updates.nameKey = identity.nameKey;
      updates.path = newPath;
    }

    const updated = await db.transaction(async (tx) => {
      const rows = await tx
        .update(communities)
        .set(updates)
        .where(eq(communities.id, id))
        .returning();

      // Children store the full path, so a parent rename has to cascade.
      if (newPath) {
        await tx
          .update(communities)
          .set({
            path: sql`${newPath} || '/' || ${communities.slug}`,
            updatedAt: new Date(),
          })
          .where(eq(communities.parentId, id));
      }

      return rows[0];
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]
 * Owner or site admin only. Children and memberships cascade.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const rows = await db
      .select({ ownerId: communities.ownerId })
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    const community = rows[0];
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    let allowed = community.ownerId === session.user.id;

    if (!allowed) {
      const ownerMembership = await db
        .select({ role: communityMembers.role })
        .from(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, id),
            eq(communityMembers.userId, session.user.id),
            eq(communityMembers.role, "owner")
          )
        )
        .limit(1);
      allowed = ownerMembership.length > 0;
    }

    if (!allowed) {
      const userRows = await db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      allowed = userRows[0]?.isAdmin === true;
    }

    if (!allowed) {
      return NextResponse.json(
        { error: "Only the community owner can delete it" },
        { status: 403 }
      );
    }

    await db.delete(communities).where(eq(communities.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
