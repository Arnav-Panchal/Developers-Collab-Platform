import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { updateMemberSchema } from "@/lib/validations";
import { canManageCommunity, getMembership } from "@/lib/communities";
import { and, eq, sql } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string; userId: string }> };

/**
 * PATCH /api/communities/[id]/members/[userId]
 * Promote/demote between admin and member, or set a display title
 * ("President", "Batch of 2027"). The owner row is untouchable here — ownership
 * moves through its own transfer step, not a role edit.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;

    if (!(await canManageCommunity(id, session.user.id))) {
      return NextResponse.json(
        { error: "You do not have permission to manage members" },
        { status: 403 }
      );
    }

    const target = await getMembership(id, userId);
    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (target.role === "owner") {
      return NextResponse.json(
        { error: "The owner's role cannot be changed here" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const result = updateMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const updates: Partial<typeof communityMembers.$inferInsert> = {};
    if (result.data.role !== undefined) updates.role = result.data.role;
    if (result.data.title !== undefined) updates.title = result.data.title;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await db
      .update(communityMembers)
      .set(updates)
      .where(
        and(
          eq(communityMembers.communityId, id),
          eq(communityMembers.userId, userId)
        )
      )
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating community member:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communities/[id]/members/[userId]
 * Remove a member. Admins can remove members; only the owner can remove another
 * admin, and nobody can remove the owner.
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, userId } = await params;

    if (!(await canManageCommunity(id, session.user.id))) {
      return NextResponse.json(
        { error: "You do not have permission to manage members" },
        { status: 403 }
      );
    }

    const target = await getMembership(id, userId);
    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (target.role === "owner") {
      return NextResponse.json(
        { error: "The community owner cannot be removed" },
        { status: 400 }
      );
    }

    if (target.role === "admin") {
      const actor = await getMembership(id, session.user.id);
      const ownerRows = await db
        .select({ ownerId: communities.ownerId })
        .from(communities)
        .where(eq(communities.id, id))
        .limit(1);

      const isOwner =
        actor?.role === "owner" || ownerRows[0]?.ownerId === session.user.id;

      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the owner can remove an admin" },
          { status: 403 }
        );
      }
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
    console.error("Error removing community member:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
