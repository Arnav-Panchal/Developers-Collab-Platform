import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communities, users } from "@/lib/db/schema";
import { updateInstructionsSchema } from "@/lib/validations";
import { canManageCommunity } from "@/lib/communities";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const editors = alias(users, "editors");

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/communities/[id]/instructions
 * Returns the instructions text plus who last touched it and when.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const rows = await db
      .select({
        instructions: communities.instructions,
        instructionsUpdatedAt: communities.instructionsUpdatedAt,
        updatedBy: {
          id: editors.id,
          username: editors.username,
          profilePicture: editors.profilePicture,
        },
      })
      .from(communities)
      .leftJoin(editors, eq(communities.instructionsUpdatedBy, editors.id))
      .where(eq(communities.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Error fetching instructions:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructions" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/communities/[id]/instructions
 * Replace the community's instructions. Owner/admin only. Stamps the editor so
 * members can see the rules changed and who changed them.
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await db
      .select({ id: communities.id })
      .from(communities)
      .where(eq(communities.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    if (!(await canManageCommunity(id, session.user.id))) {
      return NextResponse.json(
        { error: "You do not have permission to edit these instructions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = updateInstructionsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const updated = await db
      .update(communities)
      .set({
        instructions: result.data.instructions,
        instructionsUpdatedAt: new Date(),
        instructionsUpdatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(communities.id, id))
      .returning({
        instructions: communities.instructions,
        instructionsUpdatedAt: communities.instructionsUpdatedAt,
      });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating instructions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
