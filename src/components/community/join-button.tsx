"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, UserPlus } from "lucide-react";

type Props = {
  communityId: string;
  isMember: boolean;
  isOwner: boolean;
};

export default function JoinCommunityButton({
  communityId,
  isMember,
  isOwner,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const act = async (method: "POST" | "DELETE") => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isOwner) {
    return (
      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
        <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
          You own this community
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isMember ? (
        <button
          onClick={() => act("DELETE")}
          disabled={loading}
          className="btn-secondary w-full rounded-xl py-3 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4 mr-2" />
              Leave community
            </>
          )}
        </button>
      ) : (
        <button
          onClick={() => act("POST")}
          disabled={loading}
          className="btn-primary w-full rounded-xl py-3 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Join community
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
