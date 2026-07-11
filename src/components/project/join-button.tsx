"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Check } from "lucide-react";

type JoinProjectButtonProps = {
  projectSlug: string;
  isPending: boolean;
};

export default function JoinProjectButton({
  projectSlug,
  isPending: initialPending,
}: JoinProjectButtonProps) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(initialPending);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectSlug}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess(true);
      setOpenModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold rounded-xl py-3 px-4 text-center flex items-center justify-center gap-2">
        <Check className="h-4 w-4" />
        Join Request Pending
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpenModal(true)}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 px-4 transition-all text-center flex items-center justify-center gap-2 group"
      >
        <Send className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        Request to Join Team
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass max-w-md w-full rounded-2xl p-6 space-y-4 relative">
            <h3 className="text-lg font-bold text-white">Join Collaboration Team</h3>
            <p className="text-xs text-gray-400">
              Introduce yourself and explain why you&apos;re interested in joining this project.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Hi! I'm a fullstack developer with experience in Next.js and PostgreSQL. I'd love to help out with database structure and backend routing..."
                rows={4}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  disabled={loading}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
