import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communities, communityMembers } from "@/lib/db/schema";
import { getMembership } from "@/lib/communities";
import { and, eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

const transferSchema = z.object({
  newOwnerId: z.string().uuid("Invalid user"),
});

/**
 * POST /api/communities/[id]/transfer
 * Hand ownership to an existing member. This is the only way the owner role
 * moves, and it is what unblocks an owner who wants to leave.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const actorId = session.user.id;

    const communityRows = await db
      .select({ id: communities.id, ownerId: communities.ownerId })
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    const community = communityRows[0];
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const actorMembership = await getMembership(id, actorId);
    const isOwner =
      community.ownerId === actorId || actorMembership?.role === "owner";

    if (!isOwner) {
      return NextResponse.json(
        { error: "Only the current owner can transfer ownership" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = transferSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { newOwnerId } = result.data;

    if (newOwnerId === actorId) {
      return NextResponse.json(
        { error: "You already own this community" },
        { status: 400 }
      );
    }

    const target = await getMembership(id, newOwnerId);
    if (!target) {
      return NextResponse.json(
        { error: "The new owner must already be a member" },
        { status: 400 }
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(communityMembers)
        .set({ role: "owner" })
        .where(
          and(
            eq(communityMembers.communityId, id),
            eq(communityMembers.userId, newOwnerId)
          )
        );

      // The outgoing owner keeps management rights, just not ownership.
      await tx
        .update(communityMembers)
        .set({ role: "admin" })
        .where(
          and(
            eq(communityMembers.communityId, id),
            eq(communityMembers.userId, actorId)
          )
        );

      await tx
        .update(communities)
        .set({ ownerId: newOwnerId, updatedAt: new Date() })
        .where(eq(communities.id, id));
    });

    return NextResponse.json({ success: true, ownerId: newOwnerId });
  } catch (error) {
    console.error("Error transferring community ownership:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
