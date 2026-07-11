"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderGit2, Users, Bell, ArrowRight, Check, X, Loader2, GitPullRequest } from "lucide-react";
import GithubSyncCard from "@/components/dashboard/github-sync-card";
import ProfileSummaryCard from "@/components/dashboard/profile-summary-card";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  technologies: string[];
  requiredSkills: string[];
  teamSize: number;
  status: string;
  createdAt: string;
  owner?: {
    id: string;
    username: string;
    profilePicture: string;
  };
};

type JoinRequest = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    username: string;
    profilePicture: string;
    bio: string;
  };
};

type DashboardData = {
  owned: Project[];
  joined: Project[];
  incomingRequests: JoinRequest[];
  outgoingRequests: JoinRequest[];
};

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null); // Track which request is being processed

  const fetchDashboardData = async (): Promise<void> => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!ignore) {
        await fetchDashboardData();
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRequestAction = async (requestId: string, action: "accept" | "reject") => {
    setActionId(requestId);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to process request");
      }

      // Re-fetch data on success
      await fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-red-400 border border-red-500/20">
        {error}
      </div>
    );
  }

  const ownedCount = data?.owned.length || 0;
  const joinedCount = data?.joined.length || 0;
  const pendingRequestsCount = data?.incomingRequests.length || 0;

  const quickStats = [
    { label: "My Projects", value: ownedCount, icon: FolderGit2, color: "text-indigo-400" },
    { label: "Joined Teams", value: joinedCount, icon: Users, color: "text-violet-400" },
    { label: "Pending Invites", value: pendingRequestsCount, icon: GitPullRequest, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {quickStats.map((stat, idx) => (
          <div
            key={idx}
            className="glass rounded-xl p-5 flex items-center gap-4 hover:border-indigo-500/25 transition-all"
          >
            <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Projects & Teams (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Projects */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <FolderGit2 className="w-5 h-5 text-indigo-400" />
                Projects I Own ({ownedCount})
              </h2>
              <Link
                href="/projects/create"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + Create Project
              </Link>
            </div>

            {ownedCount === 0 ? (
              <div className="text-center py-8 rounded-xl bg-white/[0.01] border border-dashed border-white/5">
                <p className="text-sm text-gray-500">You haven&apos;t posted any projects yet.</p>
                <Link
                  href="/projects/create"
                  className="inline-block mt-3 text-sm text-indigo-400 font-semibold hover:underline"
                >
                  Create one now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.owned.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-white text-base">{project.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                      <div className="flex gap-1.5 mt-2.5">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <span key={tech} className="bg-white/5 text-gray-400 text-[10px] px-2 py-0.5 rounded-md">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-indigo-600 transition-all shrink-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Joined Teams */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-5">
              <Users className="w-5 h-5 text-violet-400" />
              Joined Collaboration Teams ({joinedCount})
            </h2>

            {joinedCount === 0 ? (
              <div className="text-center py-8 rounded-xl bg-white/[0.01] border border-dashed border-white/5">
                <p className="text-sm text-gray-500">You haven&apos;t joined any project teams yet.</p>
                <Link
                  href="/discover"
                  className="inline-block mt-3 text-sm text-violet-400 font-semibold hover:underline"
                >
                  Discover open projects
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data?.joined.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-bold text-white text-base">{project.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Owned by @{project.owner?.username || "anonymous"}
                      </p>
                      <div className="flex gap-1.5 mt-2.5">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <span key={tech} className="bg-white/5 text-gray-400 text-[10px] px-2 py-0.5 rounded-md">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/projects/${project.slug}`}
                      className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-violet-600 transition-all shrink-0"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invites & Requests (Takes 1 col) */}
        <div className="space-y-6">
          {/* Incoming Join Requests */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-bold flex items-center gap-2 text-white mb-4">
              <Bell className="w-4 h-4 text-cyan-400" />
              Incoming Requests
            </h2>

            {pendingRequestsCount === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500 bg-white/[0.01] rounded-xl border border-white/5">
                No active join requests for your projects.
              </div>
            ) : (
              <div className="space-y-3.5">
                {data?.incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-3.5"
                  >
                    <div className="flex items-start gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={req.user?.profilePicture}
                        className="w-8 h-8 rounded-full border border-white/10 object-cover mt-0.5"
                        alt="applicant"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-300">
                          @{req.user?.username}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          wants to join <span className="font-semibold text-indigo-400">{req.project.title}</span>
                        </p>
                      </div>
                    </div>

                    {req.message && (
                      <p className="text-xs text-gray-400 bg-white/5 p-2 rounded-lg italic">
                        &quot;{req.message}&quot;
                      </p>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleRequestAction(req.id, "reject")}
                        disabled={actionId !== null}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all disabled:opacity-50"
                        title="Decline"
                      >
                        {actionId === req.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, "accept")}
                        disabled={actionId !== null}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {actionId === req.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-base font-bold flex items-center gap-2 text-white mb-4">
              <GitPullRequest className="w-4 h-4 text-pink-400" />
              My Sent Requests
            </h2>

            {data?.outgoingRequests.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500 bg-white/[0.01] rounded-xl border border-white/5">
                You haven&apos;t requested to join any projects.
              </div>
            ) : (
              <div className="space-y-2.5">
                {data?.outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-gray-300 truncate">
                        {req.project.title}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Sent {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        req.status === "accepted"
                          ? "bg-green-500/10 text-green-400"
                          : req.status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Biography Card */}
          <ProfileSummaryCard />

          {/* GitHub Sync Card */}
          <GithubSyncCard />
        </div>
      </div>
    </div>
  );
}
