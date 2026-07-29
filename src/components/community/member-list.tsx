"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  BadgeCheck,
  Loader2,
  Shield,
  Crown,
  MoreHorizontal,
  UserMinus,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

type Member = {
  id: string;
  username: string;
  profilePicture: string;
  bio: string;
  location: string;
  skills: string[];
  githubUsername: string;
  role: string;
  title: string;
  isVerified: boolean;
  joinedAt: string;
};

type Props = {
  communityId: string;
  canManage: boolean;
  isOwner: boolean;
  currentUserId?: string;
};

export default function CommunityMemberList({
  communityId,
  canManage,
  isOwner,
  currentUserId,
}: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Bumped after a role change or removal to re-run the fetch effect.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: "24" });
        if (activeSearch) params.set("search", activeSearch);

        const res = await fetch(
          `/api/communities/${communityId}/members?${params}`
        );
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load members");
          setMembers([]);
          return;
        }

        setMembers(data.members || []);
        setTotalCount(data.pagination?.totalCount ?? 0);
      } catch {
        setError("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [communityId, activeSearch, refreshKey]);

  const changeRole = async (userId: string, role: "admin" | "member") => {
    setBusyId(userId);
    setOpenMenu(null);

    try {
      const res = await fetch(
        `/api/communities/${communityId}/members/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        }
      );
      if (res.ok) setRefreshKey((k) => k + 1);
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update member");
      }
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (userId: string) => {
    setBusyId(userId);
    setOpenMenu(null);

    try {
      const res = await fetch(
        `/api/communities/${communityId}/members/${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) setRefreshKey((k) => k + 1);
      else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to remove member");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 border-t border-zinc-900 pt-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Members{totalCount > 0 ? ` (${totalCount})` : ""}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search.trim());
          }}
          className="relative sm:w-64"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or skill"
            className="input-field w-full pl-9 text-sm"
          />
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 text-zinc-600 animate-spin" />
        </div>
      ) : members.length === 0 ? (
        <div className="p-6 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
          <p className="text-sm text-zinc-500">
            {activeSearch
              ? `No members match "${activeSearch}".`
              : "No members yet — be the first to join."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="relative flex items-start gap-3 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <Link href={`/developers/${member.username}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.profilePicture}
                  alt={member.username}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-800"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/developers/${member.username}`}
                    className="text-sm font-semibold text-white hover:text-zinc-300 transition-colors truncate"
                  >
                    @{member.username}
                  </Link>
                  {member.isVerified && (
                    <span title="Verified by email domain">
                      <BadgeCheck className="h-3.5 w-3.5 text-sky-400" />
                    </span>
                  )}
                  {member.role === "owner" && (
                    <Crown className="h-3.5 w-3.5 text-amber-400" aria-label="Owner" />
                  )}
                  {member.role === "admin" && (
                    <Shield className="h-3.5 w-3.5 text-indigo-400" aria-label="Admin" />
                  )}
                </div>

                {member.title && (
                  <p className="text-xs text-zinc-400 mt-0.5">{member.title}</p>
                )}
                {member.bio && (
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {member.bio}
                  </p>
                )}

                {member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 text-[10px] font-medium bg-zinc-900 text-zinc-400 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {canManage &&
                member.role !== "owner" &&
                member.id !== currentUserId && (
                  <div className="shrink-0">
                    {busyId === member.id ? (
                      <Loader2 className="h-4 w-4 text-zinc-600 animate-spin" />
                    ) : (
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === member.id ? null : member.id)
                        }
                        className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                        aria-label={`Manage @${member.username}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}

                    {openMenu === member.id && (
                      <div className="absolute right-3 top-12 z-10 w-44 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden">
                        {member.role === "member" ? (
                          <button
                            onClick={() => changeRole(member.id, "admin")}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 transition-colors"
                          >
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            Make admin
                          </button>
                        ) : (
                          isOwner && (
                            <button
                              onClick={() => changeRole(member.id, "member")}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900 transition-colors"
                            >
                              <ArrowDownCircle className="h-3.5 w-3.5" />
                              Remove admin
                            </button>
                          )
                        )}
                        <button
                          onClick={() => removeMember(member.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors border-t border-zinc-900"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          Remove from community
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
