"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain } from "lucide-react";

type Recommendation = {
  id: string;
  username: string;
  profilePicture: string;
  skills: string[];
  matchingSkills: string[];
  reason: string;
};

type AIMatchmakerProps = {
  projectId: string;
};

export default function AIMatchmaker({ projectId }: AIMatchmakerProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/ai/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });

        if (!res.ok) {
          throw new Error("Failed to load matchmaker recommendations");
        }

        const data = await res.json();
        setRecommendations(data);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Matchmaker is currently unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [projectId]);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <h3 className="font-bold text-base text-white">Finding ideal teammates...</h3>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-14 w-full rounded-xl" />
          <div className="skeleton h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show anything if there are no matching users or an error occurs
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2 text-indigo-400">
        <Sparkles className="h-5 w-5" />
        <h3 className="font-bold text-base text-white">AI-Recommended Teammates</h3>
      </div>
      <p className="text-xs text-gray-400">
        These developers possess skills that complement your project requirements.
      </p>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rec.profilePicture}
                alt={rec.username}
                className="w-9 h-9 rounded-full object-cover border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-200">@{rec.username}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {rec.matchingSkills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="bg-indigo-500/10 text-indigo-400 text-[9px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                  {rec.matchingSkills.length > 3 && (
                    <span className="text-[9px] text-gray-500 self-center">
                      +{rec.matchingSkills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Reasoning Block */}
            <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-xl p-3 flex items-start gap-2">
              <Brain className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-300 leading-relaxed italic">
                &quot;{rec.reason}&quot;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
