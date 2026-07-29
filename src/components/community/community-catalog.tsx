"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  BadgeCheck,
  Building2,
  Loader2,
  MapPin,
  Lock,
} from "lucide-react";

type Community = {
  id: string;
  name: string;
  slug: string;
  path: string;
  type: string;
  description: string;
  city: string;
  logoUrl: string;
  visibility: string;
  isVerified: boolean;
  memberCount: number;
  parent: { id: string; name: string; path: string } | null;
};

type Pagination = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "college", label: "Colleges" },
  { value: "company", label: "Companies" },
  { value: "club", label: "Clubs" },
  { value: "interest", label: "Interest groups" },
];

export default function CommunityCatalog() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("members");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchCommunities = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "12",
          sort,
        });
        if (activeSearch) params.set("search", activeSearch);
        if (type) params.set("type", type);

        const res = await fetch(`/api/communities?${params}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load communities");
          setCommunities([]);
          return;
        }

        setCommunities(data.communities || []);
        setPagination(data.pagination || null);
      } catch {
        setError("Failed to load communities");
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, [activeSearch, type, sort, page]);

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSearch(search.trim());
            setPage(1);
          }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities, colleges, clubs…"
            className="input-field w-full pl-11 py-3"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setType(filter.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                type === filter.value
                  ? "bg-white text-black"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {filter.label}
            </button>
          ))}

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="input-field ml-auto text-xs py-1.5"
          >
            <option value="members">Most members</option>
            <option value="newest">Newest</option>
            <option value="name">A–Z</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-600 animate-spin" />
        </div>
      ) : communities.length === 0 ? (
        <div className="p-12 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center space-y-3">
          <p className="text-sm text-zinc-400">
            {activeSearch
              ? `Nothing matches "${activeSearch}".`
              : "No communities yet."}
          </p>
          <Link
            href="/communities/create"
            className="inline-block text-sm font-semibold text-white hover:text-zinc-300 transition-colors"
          >
            Create the first one →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.path}`}
              className="group flex flex-col gap-3 p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950/70 transition-all"
            >
              <div className="flex items-start gap-3">
                {community.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={community.logoUrl}
                    alt={community.name}
                    className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-zinc-500" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                      {community.name}
                    </h3>
                    {community.isVerified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    )}
                    {community.visibility === "private" && (
                      <Lock className="h-3 w-3 text-zinc-600 shrink-0" />
                    )}
                  </div>

                  {/* The parent is what disambiguates two clubs sharing a name. */}
                  <p className="text-xs text-zinc-500 truncate">
                    {community.parent?.name ?? "Standalone"}
                  </p>
                </div>
              </div>

              {community.description && (
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {community.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-auto pt-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {community.memberCount}
                </span>
                {community.city && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {community.city}
                  </span>
                )}
                <span className="ml-auto capitalize text-zinc-600">
                  {community.type}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-xs disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="btn-secondary text-xs disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
