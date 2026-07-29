import { db } from "@/lib/db";
import { communities, communityMembers, users } from "@/lib/db/schema";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { createSlug, normalizeNameKey, emailDomain } from "@/lib/utils";

export type Community = typeof communities.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;

/** `slug` is varchar(60) while `name` allows 100 chars, so derived slugs clamp. */
const MAX_SLUG_LENGTH = 60;

export type DerivedIdentity = {
  slug: string;
  nameKey: string;
};

/**
 * Derive the URL slug and the comparison key from a display name.
 * Returns null when the name has no alphanumeric content at all ("!!!"), which
 * would otherwise produce an empty slug and an unroutable community.
 */
export function deriveIdentity(name: string): DerivedIdentity | null {
  const slug = createSlug(name).slice(0, MAX_SLUG_LENGTH).replace(/-+$/, "");
  const nameKey = normalizeNameKey(name);

  if (!slug || !nameKey) return null;

  return { slug, nameKey };
}

/**
 * Find an existing community that would collide with `identity` inside the
 * given parent scope. This is the pre-flight check that lets the API answer
 * with "did you mean this one?" instead of leaning on a raw unique-violation.
 *
 * Pass `excludeId` when checking a rename so the row doesn't conflict with
 * itself.
 */
export async function findConflict(
  identity: DerivedIdentity,
  parentId: string | null,
  excludeId?: string
): Promise<Community | null> {
  const scope = parentId
    ? eq(communities.parentId, parentId)
    : isNull(communities.parentId);

  const conditions = [
    scope,
    sql`(${communities.slug} = ${identity.slug} OR ${communities.nameKey} = ${identity.nameKey})`,
  ];

  if (excludeId) {
    conditions.push(ne(communities.id, excludeId));
  }

  const rows = await db
    .select()
    .from(communities)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * A user can manage a community if they own it, hold an owner/admin membership
 * role, or are a site admin.
 */
export async function canManageCommunity(
  communityId: string,
  userId: string
): Promise<boolean> {
  const rows = await db
    .select({
      ownerId: communities.ownerId,
      role: communityMembers.role,
    })
    .from(communities)
    .leftJoin(
      communityMembers,
      and(
        eq(communityMembers.communityId, communities.id),
        eq(communityMembers.userId, userId)
      )
    )
    .where(eq(communities.id, communityId))
    .limit(1);

  const row = rows[0];
  if (!row) return false;

  if (
    row.ownerId === userId ||
    row.role === "owner" ||
    row.role === "admin"
  ) {
    return true;
  }

  const admin = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return admin[0]?.isAdmin === true;
}

/** Load a single membership row, or null if the user isn't a member. */
export async function getMembership(
  communityId: string,
  userId: string
): Promise<CommunityMember | null> {
  const rows = await db
    .select()
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * True when the user's account email sits on one of the community's declared
 * domains — the cheap proof that an @vit.ac.in address really is at VIT.
 */
export async function resolveVerification(
  userId: string,
  domains: string[]
): Promise<boolean> {
  if (domains.length === 0) return false;

  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const domain = emailDomain(rows[0]?.email ?? "");
  if (!domain) return false;

  return domains.some((d) => d.toLowerCase() === domain);
}

/** Look a community up by its materialized path ("vit-vellore/gdsc"). */
export async function getCommunityByPath(
  path: string
): Promise<Community | null> {
  const rows = await db
    .select()
    .from(communities)
    .where(eq(communities.path, path))
    .limit(1);

  return rows[0] ?? null;
}
