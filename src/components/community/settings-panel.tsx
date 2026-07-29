"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Loader2, X, AlertTriangle } from "lucide-react";

type Community = {
  id: string;
  name: string;
  description: string;
  type: string;
  visibility: string;
  city: string;
  website: string;
  logoUrl: string;
  emailDomains: string[];
  path: string;
};

type Props = {
  community: Community;
  canDelete: boolean;
};

export default function CommunitySettingsPanel({ community, canDelete }: Props) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [visibility, setVisibility] = useState(community.visibility);
  const [city, setCity] = useState(community.city);
  const [website, setWebsite] = useState(community.website);
  const [logoUrl, setLogoUrl] = useState(community.logoUrl);
  const [emailDomains, setEmailDomains] = useState<string[]>(
    community.emailDomains
  );
  const [domainInput, setDomainInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const addDomain = () => {
    const value = domainInput.trim().toLowerCase().replace(/^@/, "");
    if (!value || emailDomains.includes(value) || emailDomains.length >= 10) {
      setDomainInput("");
      return;
    }
    setEmailDomains([...emailDomains, value]);
    setDomainInput("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          visibility,
          city,
          website,
          logoUrl,
          emailDomains,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save changes");
        return;
      }

      setOpen(false);

      // A rename changes the URL, so navigate rather than just refreshing.
      if (data.path !== community.path) {
        router.push(`/communities/${data.path}`);
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete community");
        return;
      }

      router.push("/communities");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary w-full rounded-xl py-3"
      >
        <Settings className="h-4 w-4 mr-2" />
        Community settings
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 my-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Community settings
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="input-field w-full"
            />
            <p className="text-xs text-zinc-600">
              Renaming changes this community&apos;s URL.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="input-field w-full resize-y"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                className="input-field w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Logo URL
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Verified email domains
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDomain();
                  }
                }}
                placeholder="vit.ac.in"
                className="input-field flex-1"
              />
              <button
                type="button"
                onClick={addDomain}
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
            <p className="text-xs text-zinc-600">
              Existing members keep the badge they joined with; this affects who
              gets verified from now on.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="input-field w-full"
            >
              <option value="public">Public — anyone can see members</option>
              <option value="private">Private — members only</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/25">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-zinc-900">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
          <button onClick={() => setOpen(false)} className="btn-secondary">
            Cancel
          </button>
        </div>

        {canDelete && (
          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Danger zone
              </span>
            </div>
            {confirmDelete ? (
              <div className="space-y-3">
                <p className="text-sm text-zinc-300">
                  Deleting removes every membership and every club nested inside
                  this community. This cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-sm font-semibold text-red-300 hover:bg-red-500/25 transition-colors disabled:opacity-40"
                  >
                    Yes, delete permanently
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn-secondary text-xs"
                  >
                    Keep it
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Delete this community
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
