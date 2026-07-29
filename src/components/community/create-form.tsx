"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  BadgeCheck,
  AlertTriangle,
  Loader2,
  Building2,
  X,
} from "lucide-react";

type Match = {
  id: string;
  name: string;
  path: string;
  type: string;
  city: string;
  logoUrl: string;
  isVerified: boolean;
  memberCount: number;
  parent: { id: string; name: string; path: string } | null;
};

type Conflict = {
  id: string;
  name: string;
  path: string;
  memberCount: number;
};

type ParentOption = {
  id: string;
  name: string;
  path: string;
  city: string;
  isVerified: boolean;
};

const TYPE_OPTIONS = [
  { value: "club", label: "Club", hint: "A student club, chapter, or team inside an institution" },
  { value: "interest", label: "Interest group", hint: "A topic-based group open to anyone" },
] as const;

export default function CreateCommunityForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<string>("club");
  const [visibility, setVisibility] = useState("public");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [emailDomainInput, setEmailDomainInput] = useState("");
  const [emailDomains, setEmailDomains] = useState<string[]>([]);

  const [parent, setParent] = useState<ParentOption | null>(null);
  const [parentQuery, setParentQuery] = useState("");
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [parentOpen, setParentOpen] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [checking, setChecking] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against an older in-flight dedupe response overwriting a newer one.
  const searchSeq = useRef(0);

  // Live duplicate detection. This is the step that actually stops duplicate
  // communities — the DB constraint is just the backstop.
  useEffect(() => {
    const trimmed = name.trim();
    const seq = ++searchSeq.current;

    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setMatches([]);
        setConflict(null);
        setChecking(false);
        return;
      }

      setChecking(true);

      try {
        const params = new URLSearchParams({ q: trimmed });
        if (parent) params.set("parentId", parent.id);

        const res = await fetch(`/api/communities/search?${params}`);
        if (!res.ok) return;
        const data = await res.json();

        if (seq !== searchSeq.current) return;
        setMatches(data.matches || []);
        setConflict(data.exactConflict || null);
      } catch {
        // A failed dedupe check shouldn't block the form; the server rechecks.
      } finally {
        if (seq === searchSeq.current) setChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [name, parent]);

  // Parent institution picker — only root communities are eligible.
  useEffect(() => {
    if (!parentOpen) return;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ scope: "root", limit: "8" });
        if (parentQuery.trim()) params.set("search", parentQuery.trim());

        const res = await fetch(`/api/communities?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setParentOptions(data.communities || []);
      } catch {
        setParentOptions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [parentQuery, parentOpen]);

  const addEmailDomain = () => {
    const value = emailDomainInput.trim().toLowerCase().replace(/^@/, "");
    if (!value) return;
    if (emailDomains.includes(value)) {
      setEmailDomainInput("");
      return;
    }
    if (emailDomains.length >= 10) return;
    setEmailDomains([...emailDomains, value]);
    setEmailDomainInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflict) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description,
          instructions,
          type,
          visibility,
          city,
          website,
          emailDomains,
          parentId: parent?.id ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.conflict) {
          setConflict(data.conflict);
        }
        setError(data.error || "Failed to create community");
        return;
      }

      router.push(`/communities/${data.path}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    name.trim().length >= 2 && !conflict && !submitting && !checking;

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Step 1 — parent institution */}
      <section className="space-y-3">
        <div>
          <label className="text-sm font-semibold text-white">
            Where does this live?
          </label>
          <p className="text-xs text-zinc-500 mt-1">
            Attaching your community to a college or company is what keeps two
            groups with the same name apart.
          </p>
        </div>

        {parent ? (
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
            <div className="flex items-center gap-3 min-w-0">
              <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {parent.name}
                  {parent.isVerified && (
                    <BadgeCheck className="inline h-3.5 w-3.5 text-sky-400 ml-1.5 align-text-bottom" />
                  )}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  /communities/{parent.path}/
                  <span className="text-zinc-400">
                    {name.trim() ? slugPreview(name) : "your-community"}
                  </span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setParent(null);
                setParentQuery("");
              }}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
              aria-label="Clear parent community"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={parentQuery}
                onChange={(e) => setParentQuery(e.target.value)}
                onFocus={() => setParentOpen(true)}
                placeholder="Search for your college or company (optional)"
                className="input-field w-full pl-9"
              />
            </div>

            {parentOpen && parentOptions.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900 overflow-hidden">
                {parentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setParent(option);
                      setParentOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-900/60 transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-zinc-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {option.name}
                        {option.isVerified && (
                          <BadgeCheck className="inline h-3.5 w-3.5 text-sky-400 ml-1.5 align-text-bottom" />
                        )}
                      </p>
                      {option.city && (
                        <p className="text-xs text-zinc-500">{option.city}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-zinc-600">
              Leave this empty for a standalone interest group. Colleges and
              companies themselves are added by admins.
            </p>
          </div>
        )}
      </section>

      {/* Step 2 — name, with dedupe */}
      <section className="space-y-3 border-t border-zinc-900 pt-8">
        <label className="text-sm font-semibold text-white block">
          Community name
        </label>

        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GDSC, Robotics Club, Batch of 2027"
            maxLength={100}
            required
            className="input-field w-full pr-10"
          />
          {checking && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 animate-spin" />
          )}
        </div>

        {conflict && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/25 space-y-2">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Name already taken here
              </span>
            </div>
            <p className="text-sm text-zinc-300">
              <span className="font-semibold text-white">{conflict.name}</span>{" "}
              already exists {parent ? `inside ${parent.name}` : "at the top level"}{" "}
              with {conflict.memberCount}{" "}
              {conflict.memberCount === 1 ? "member" : "members"}.
            </p>
            <Link
              href={`/communities/${conflict.path}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-300 hover:text-red-200 transition-colors"
            >
              Go to that community →
            </Link>
          </div>
        )}

        {!conflict && matches.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-950/15 border border-amber-500/20 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              {matches.length} similar{" "}
              {matches.length === 1 ? "community" : "communities"} already exist
            </p>
            <div className="space-y-1.5">
              {matches.map((match) => (
                <Link
                  key={match.id}
                  href={`/communities/${match.path}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {match.name}
                      {match.isVerified && (
                        <BadgeCheck className="inline h-3.5 w-3.5 text-sky-400 ml-1.5 align-text-bottom" />
                      )}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {match.parent ? match.parent.name : "Standalone"}
                      {match.city ? ` · ${match.city}` : ""}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-zinc-400 shrink-0 group-hover:text-white transition-colors">
                    <Users className="h-3 w-3" />
                    {match.memberCount}
                  </span>
                </Link>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              Already one of these? Join it instead of starting a second one.
            </p>
          </div>
        )}
      </section>

      {/* Step 3 — details */}
      <section className="space-y-6 border-t border-zinc-900 pt-8">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-white block">
            Type
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  type === option.value
                    ? "bg-white/5 border-zinc-600"
                    : "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <p className="text-sm font-semibold text-white">{option.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{option.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white block">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What is this community for?"
            className="input-field w-full resize-y"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white block">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={100}
              placeholder="Vellore"
              className="input-field w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white block">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="input-field w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white block">
            Verified email domains
          </label>
          <p className="text-xs text-zinc-500">
            Anyone joining with an email on these domains gets a verified badge,
            so members can tell real affiliation from a self-claim.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={emailDomainInput}
              onChange={(e) => setEmailDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmailDomain();
                }
              }}
              placeholder="vit.ac.in"
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={addEmailDomain}
              className="btn-secondary shrink-0"
            >
              Add
            </button>
          </div>
          {emailDomains.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {emailDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                >
                  @{domain}
                  <button
                    type="button"
                    onClick={() =>
                      setEmailDomains(emailDomains.filter((d) => d !== domain))
                    }
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                    aria-label={`Remove ${domain}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-white block">
            Visibility
          </label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="input-field w-full"
          >
            <option value="public">Public — anyone can see the member list</option>
            <option value="private">Private — only members see who is in it</option>
          </select>
        </div>
      </section>

      {/* Step 4 — instructions */}
      <section className="space-y-3 border-t border-zinc-900 pt-8">
        <div>
          <label className="text-sm font-semibold text-white block">
            Instructions for members
          </label>
          <p className="text-xs text-zinc-500 mt-1">
            Rules, onboarding steps, meeting times — whatever new members should
            read first. You can edit this any time after creating.
          </p>
        </div>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          maxLength={20000}
          placeholder={
            "1. Introduce yourself in the intro thread\n2. Meetings are every Friday at 6pm in Lab 204\n3. Keep project posts in the projects channel"
          }
          className="input-field w-full resize-y font-mono text-sm leading-relaxed"
        />
        <p className="text-xs text-zinc-600 text-right">
          {instructions.length.toLocaleString()} / 20,000
        </p>
      </section>

      {error && !conflict && (
        <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/25">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-zinc-900 pt-8">
        <button type="submit" disabled={!canSubmit} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating…
            </>
          ) : (
            "Create community"
          )}
        </button>
        <Link href="/communities" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Mirrors createSlug() for the inline URL preview. */
function slugPreview(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
