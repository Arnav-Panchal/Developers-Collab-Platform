"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Pencil, Loader2, X } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Props = {
  communityId: string;
  initialInstructions: string;
  updatedAt: string | Date | null;
  updatedBy: { username: string } | null;
  canEdit: boolean;
};

export default function InstructionsPanel({
  communityId,
  initialInstructions,
  updatedAt,
  updatedBy,
  canEdit,
}: Props) {
  const router = useRouter();

  const [instructions, setInstructions] = useState(initialInstructions);
  const [draft, setDraft] = useState(initialInstructions);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | Date | null>(updatedAt);
  const [savedBy, setSavedBy] = useState(updatedBy);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/communities/${communityId}/instructions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: draft }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save instructions");
        return;
      }

      setInstructions(data.instructions);
      setSavedAt(data.instructionsUpdatedAt);
      // The server stamps the current user as the editor.
      setSavedBy({ username: "you" });
      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(instructions);
    setError(null);
    setEditing(false);
  };

  return (
    <div className="space-y-4 border-t border-zinc-900 pt-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-zinc-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Instructions
          </h2>
        </div>

        {canEdit && !editing && (
          <button
            onClick={() => {
              setDraft(instructions);
              setEditing(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            <Pencil className="h-3.5 w-3.5" />
            {instructions ? "Edit" : "Add instructions"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            maxLength={20000}
            autoFocus
            placeholder={
              "1. Introduce yourself in the intro thread\n2. Meetings are every Friday at 6pm in Lab 204\n3. Keep project posts in the projects channel"
            }
            className="input-field w-full resize-y font-mono text-sm leading-relaxed"
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-zinc-600">
              {draft.length.toLocaleString()} / 20,000
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="btn-secondary text-xs px-3 py-2"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-xs px-3 py-2 disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving…
                  </>
                ) : (
                  "Save instructions"
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      ) : instructions ? (
        <div className="space-y-3">
          <div className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-800">
            <p className="text-base text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {instructions}
            </p>
          </div>
          {savedAt && (
            <p className="text-xs text-zinc-600">
              Updated {timeAgo(savedAt)}
              {savedBy?.username ? ` by @${savedBy.username}` : ""}
            </p>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center">
          <p className="text-sm text-zinc-500">
            {canEdit
              ? "No instructions yet. Add the rules, meeting times, or onboarding steps new members should read."
              : "This community hasn't posted instructions yet."}
          </p>
        </div>
      )}
    </div>
  );
}
