import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { communities } from "@/lib/db/schema";
import { deriveIdentity } from "@/lib/communities";
import { and, eq, ilike, isNull, or, sql, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const parents = alias(communities, "parents");

/**
 * GET /api/communities/search?q=GDSC&parentId=<uuid>
 *
 * Powers the "did you mean one of these?" step in the create form. Returns
 * near-matches across the whole platform, flagging the ones that would be an
 * outright collision inside the chosen parent so the UI can block submission
 * before the user fills in the rest of the form.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const parentId = searchParams.get("parentId") || null;

    if (q.length < 2) {
      return NextResponse.json({ matches: [], exactConflict: null });
    }

    const identity = deriveIdentity(q);

    const matches = await db
      .select({
        id: communities.id,
        name: communities.name,
        nameKey: communities.nameKey,
        slug: communities.slug,
        path: communities.path,
        type: communities.type,
        city: communities.city,
        logoUrl: communities.logoUrl,
        isVerified: communities.isVerified,
        memberCount: communities.memberCount,
        parentId: communities.parentId,
        parent: {
          id: parents.id,
          name: parents.name,
          path: parents.path,
        },
      })
      .from(communities)
      .leftJoin(parents, eq(communities.parentId, parents.id))
      .where(
        or(
          ilike(communities.name, `%${q}%`),
          identity
            ? sql`${communities.nameKey} LIKE ${`%${identity.nameKey}%`}`
            : undefined
        )
      )
      .orderBy(desc(communities.memberCount))
      .limit(8);

    // A collision only matters inside the scope the user is about to create in.
    let exactConflict = null;
    if (identity) {
      const scope = parentId
        ? eq(communities.parentId, parentId)
        : isNull(communities.parentId);

      const conflictRows = await db
        .select({
          id: communities.id,
          name: communities.name,
          path: communities.path,
          memberCount: communities.memberCount,
        })
        .from(communities)
        .where(
          and(
            scope,
            or(
              eq(communities.slug, identity.slug),
              eq(communities.nameKey, identity.nameKey)
            )
          )
        )
        .limit(1);

      exactConflict = conflictRows[0] ?? null;
    }

    return NextResponse.json({ matches, exactConflict });
  } catch (error) {
    console.error("Error searching communities:", error);
    return NextResponse.json(
      { error: "Failed to search communities" },
      { status: 500 }
    );
  }
}
