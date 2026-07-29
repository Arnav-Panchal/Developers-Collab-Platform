import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { communities, users } from "@/lib/db/schema";
import { canManageCommunity, getMembership } from "@/lib/communities";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import InstructionsPanel from "@/components/community/instructions-panel";
import CommunityMemberList from "@/components/community/member-list";
import JoinCommunityButton from "@/components/community/join-button";
import CommunitySettingsPanel from "@/components/community/settings-panel";
import {
  Building2,
  BadgeCheck,
  Users,
  MapPin,
  Globe,
  Lock,
  Plus,
} from "lucide-react";
import type { Metadata } from "next";

const parents = alias(communities, "parents");
const editors = alias(users, "editors");

type PageParams = { params: Promise<{ slug: string[] }> };

/** URL segments map straight onto the materialized `path` column. */
function toPath(segments: string[]): string {
  return segments.join("/");
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;

  const rows = await db
    .select({ name: communities.name, description: communities.description })
    .from(communities)
    .where(eq(communities.path, toPath(slug)))
    .limit(1);

  const community = rows[0];
  if (!community) {
    return { title: "Community Not Found" };
  }

  return {
    title: community.name,
    description: community.description.substring(0, 150),
  };
}

export default async function CommunityDetailPage({ params }: PageParams) {
  const { slug } = await params;
  const path = toPath(slug);

  // Only two levels exist, so anything deeper is a bad URL.
  if (slug.length === 0 || slug.length > 2) {
    notFound();
  }

  const session = await auth();
  const currentUserId = session?.user?.id;

  const rows = await db
    .select({
      community: communities,
      parent: {
        id: parents.id,
        name: parents.name,
        path: parents.path,
      },
      instructionsEditor: {
        username: editors.username,
      },
    })
    .from(communities)
    .leftJoin(parents, eq(communities.parentId, parents.id))
    .leftJoin(editors, eq(communities.instructionsUpdatedBy, editors.id))
    .where(eq(communities.path, path))
    .limit(1);

  const row = rows[0];
  if (!row) {
    notFound();
  }

  const community = row.community;

  const membership = currentUserId
    ? await getMembership(community.id, currentUserId)
    : null;

  const canManage = currentUserId
    ? await canManageCommunity(community.id, currentUserId)
    : false;

  const isOwner =
    community.ownerId === currentUserId || membership?.role === "owner";

  // Clubs nested inside this community, shown only on root pages.
  const children =
    community.parentId === null
      ? await db
          .select({
            id: communities.id,
            name: communities.name,
            path: communities.path,
            type: communities.type,
            memberCount: communities.memberCount,
            logoUrl: communities.logoUrl,
          })
          .from(communities)
          .where(eq(communities.parentId, community.id))
          .orderBy(desc(communities.memberCount))
          .limit(24)
      : [];

  const ownerRows = community.ownerId
    ? await db
        .select({
          username: users.username,
          profilePicture: users.profilePicture,
        })
        .from(users)
        .where(eq(users.id, community.ownerId))
        .limit(1)
    : [];
  const owner = ownerRows[0] ?? null;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <Link
          href="/communities"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-12 uppercase tracking-wider font-semibold"
        >
          ← Back to Communities
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          <div className="flex-1 min-w-0 space-y-12">
            {/* Hero */}
            <div className="space-y-6">
              {/* Breadcrumb makes the disambiguating parent explicit. */}
              {row.parent?.path && (
                <Link
                  href={`/communities/${row.parent.path}`}
                  className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {row.parent.name}
                </Link>
              )}

              <div className="flex items-start gap-4">
                {community.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={community.logoUrl}
                    alt={community.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-zinc-600" />
                  </div>
                )}

                <div className="min-w-0 space-y-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {community.name}
                    </h1>
                    {community.isVerified && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        title="Verified institution"
                      >
                        <BadgeCheck className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                    <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {community.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap text-sm text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {community.memberCount}{" "}
                      {community.memberCount === 1 ? "member" : "members"}
                    </span>
                    {community.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {community.city}
                      </span>
                    )}
                    {community.visibility === "private" && (
                      <span className="flex items-center gap-1.5 text-zinc-500">
                        <Lock className="h-3.5 w-3.5" />
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {community.description && (
                <p className="text-base text-zinc-300 leading-relaxed whitespace-pre-wrap max-w-2xl">
                  {community.description}
                </p>
              )}
            </div>

            {/* Instructions — the editable rulebook */}
            <InstructionsPanel
              communityId={community.id}
              initialInstructions={community.instructions}
              updatedAt={community.instructionsUpdatedAt}
              updatedBy={row.instructionsEditor}
              canEdit={canManage}
            />

            {/* Nested clubs */}
            {community.parentId === null && (
              <div className="space-y-6 border-t border-zinc-900 pt-12">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Clubs & groups{children.length > 0 ? ` (${children.length})` : ""}
                  </h2>
                  {session && (
                    <Link
                      href="/communities/create"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add one
                    </Link>
                  )}
                </div>

                {children.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
                    <p className="text-sm text-zinc-500">
                      No clubs inside {community.name} yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/communities/${child.path}`}
                        className="flex items-center gap-3 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        {child.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={child.logoUrl}
                            alt={child.name}
                            className="w-9 h-9 rounded-lg object-cover border border-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-zinc-600" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">
                            {child.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {child.memberCount}{" "}
                            {child.memberCount === 1 ? "member" : "members"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Members */}
            <CommunityMemberList
              communityId={community.id}
              canManage={canManage}
              isOwner={isOwner}
              currentUserId={currentUserId}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-8 space-y-6">
              <div className="space-y-3">
                {session ? (
                  <JoinCommunityButton
                    communityId={community.id}
                    isMember={!!membership}
                    isOwner={isOwner}
                  />
                ) : (
                  <Link
                    href="/sign-in"
                    className="block w-full btn-primary font-semibold rounded-xl py-3 px-4 text-center text-sm"
                  >
                    Sign in to join
                  </Link>
                )}

                {canManage && (
                  <CommunitySettingsPanel
                    community={{
                      id: community.id,
                      name: community.name,
                      description: community.description,
                      type: community.type,
                      visibility: community.visibility,
                      city: community.city,
                      website: community.website,
                      logoUrl: community.logoUrl,
                      emailDomains: community.emailDomains,
                      path: community.path,
                    }}
                    canDelete={isOwner}
                  />
                )}
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-5">
                {membership && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Your membership
                    </h3>
                    <p className="text-sm text-zinc-300 capitalize">
                      {membership.role}
                      {membership.isVerified && (
                        <span className="inline-flex items-center gap-1 ml-2 text-xs text-sky-400">
                          <BadgeCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {community.emailDomains.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Verified domains
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {community.emailDomains.map((domain) => (
                        <span
                          key={domain}
                          className="px-2 py-0.5 text-xs bg-zinc-900 text-zinc-400 rounded border border-zinc-800"
                        >
                          @{domain}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                      Join with an email on these domains to get a verified
                      badge.
                    </p>
                  </div>
                )}

                {community.website && (
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Website
                    </h3>
                    <a
                      href={community.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-white transition-colors break-all"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      {community.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}

                {owner && (
                  <div className="pt-4 border-t border-zinc-900">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                      Created by
                    </h3>
                    <Link
                      href={`/developers/${owner.username}`}
                      className="flex items-center gap-2 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={owner.profilePicture}
                        alt={owner.username}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-800"
                      />
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">
                        @{owner.username}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
