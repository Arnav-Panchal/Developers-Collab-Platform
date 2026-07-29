import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communities, communityMembers, users } from "@/lib/db/schema";
import { getMembership, resolveVerification } from "@/lib/communities";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/communities/[id]/members?search=&page=&limit=
 * Private communities only expose their roster to members.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get("search") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "24") || 24)
    );

    const communityRows = await db
      .select({ id: communities.id, visibility: communities.visibility })
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    const community = communityRows[0];
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (community.visibility === "private") {
      const session = await auth();
      const viewerId = session?.user?.id;
      const membership = viewerId ? await getMembership(id, viewerId) : null;

      if (!membership) {
        return NextResponse.json(
          { error: "This community's members are private" },
          { status: 403 }
        );
      }
    }

    const conditions = [eq(communityMembers.communityId, id)];

    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.bio, `%${search}%`),
          sql`${search} = any(${users.skills})`
        )!
      );
    }

    const whereClause = and(...conditions);

    const members = await db
      .select({
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
        location: users.location,
        skills: users.skills,
        githubUsername: users.githubUsername,
        role: communityMembers.role,
        title: communityMembers.title,
        isVerified: communityMembers.isVerified,
        joinedAt: communityMembers.joinedAt,
      })
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(whereClause)
      // Owners and admins first, then verified members, then most recent.
      .orderBy(
        sql`CASE ${communityMembers.role} WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END`,
        desc(communityMembers.isVerified),
        desc(communityMembers.joinedAt)
      )
      .limit(limit)
      .offset((page - 1) * limit);

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(whereClause);

    const totalCount = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      members,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching community members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communities/[id]/members
 * Join the community. Membership is auto-verified when the user's email domain
 * matches one the community declared.
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const communityRows = await db
      .select({
        id: communities.id,
        emailDomains: communities.emailDomains,
      })
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    const community = communityRows[0];
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const existing = await getMembership(id, userId);
    if (existing) {
      return NextResponse.json(
        { error: "You are already a member of this community" },
        { status: 409 }
      );
    }

    const isVerified = await resolveVerification(userId, community.emailDomains);

    const membership = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(communityMembers)
        .values({
          communityId: id,
          userId,
          role: "member",
          isVerified,
        })
        .returning();

      await tx
        .update(communities)
        .set({ memberCount: sql`${communities.memberCount} + 1` })
        .where(eq(communities.id, id));

      return inserted[0];
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Error joining community:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]/members
 * Leave the community. The owner has to hand ownership over first, otherwise
 * the community would be left with nobody able to edit it.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const membership = await getMembership(id, userId);
    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this community" },
        { status: 404 }
      );
    }

    if (membership.role === "owner") {
      return NextResponse.json(
        {
          error:
            "Transfer ownership to another member before leaving this community",
        },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(communityMembers)
        .where(
          and(
            eq(communityMembers.communityId, id),
            eq(communityMembers.userId, userId)
          )
        );

      await tx
        .update(communities)
        .set({ memberCount: sql`GREATEST(${communities.memberCount} - 1, 0)` })
        .where(eq(communities.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving community:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
