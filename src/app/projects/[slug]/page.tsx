import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, projectUsers, joinRequests, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import JoinProjectButton from "@/components/project/join-button";
import AIMatchmaker from "@/components/project/ai-matchmaker";
import { Calendar, Users, FolderGit2, Briefcase, Github, Brain, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata(
  { params }: PageParams
): Promise<Metadata> {
  const { slug } = await params;
  const projectResult = await db
    .select({ title: projects.title, description: projects.description })
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  const project = projectResult[0];

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: project.title,
    description: project.description.substring(0, 150),
  };
}

export default async function ProjectDetailPage(
  { params }: PageParams
) {
  const { slug } = await params;
  const session = await auth();

  // 1. Fetch project details
  const projectResult = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      description: projects.description,
      technologies: projects.technologies,
      requiredSkills: projects.requiredSkills,
      teamSize: projects.teamSize,
      responsibilities: projects.responsibilities,
      startDate: projects.startDate,
      endDate: projects.endDate,
      status: projects.status,
      ownerId: projects.ownerId,
      aiSummary: projects.aiSummary,
      githubRepoUrl: projects.githubRepoUrl,
      createdAt: projects.createdAt,
      owner: {
        id: users.id,
        username: users.username,
        profilePicture: users.profilePicture,
        bio: users.bio,
      },
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.slug, slug))
    .limit(1);

  const project = projectResult[0];

  if (!project) {
    notFound();
  }

  // 2. Fetch project members
  const members = await db
    .select({
      id: users.id,
      username: users.username,
      profilePicture: users.profilePicture,
      bio: users.bio,
    })
    .from(projectUsers)
    .innerJoin(users, eq(projectUsers.userId, users.id))
    .where(eq(projectUsers.projectId, project.id));

  // 3. User relationship checks
  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === project.ownerId;
  const isMember = members.some((member) => member.id === currentUserId);

  let hasPendingRequest = false;
  if (currentUserId && !isOwner && !isMember) {
    const pendingRequestResult = await db
      .select()
      .from(joinRequests)
      .where(
        and(
          eq(joinRequests.projectId, project.id),
          eq(joinRequests.userId, currentUserId),
          eq(joinRequests.status, "pending")
        )
      )
      .limit(1);
    hasPendingRequest = pendingRequestResult.length > 0;
  }

  const startDateStr = new Date(project.startDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const endDateStr = new Date(project.endDate).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Button */}
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        &larr; Back to Discover
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (Col span 2) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  project.status === "open"
                    ? "bg-green-500/10 text-green-400"
                    : project.status === "in-progress"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-indigo-500/10 text-indigo-400"
                }`}
              >
                {project.status.replace("-", " ")}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>
                  {startDateStr} &ndash; {endDateStr}
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
              {project.title}
            </h1>

            {/* Posted By */}
            <div className="flex items-center gap-3 pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.owner?.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                alt={project.owner?.username || "owner"}
                className="w-10 h-10 rounded-full border border-white/10 object-cover"
              />
              <div>
                <p className="text-xs text-gray-500">Project Creator</p>
                <p className="text-sm font-bold text-gray-300">
                  @{project.owner?.username || "anonymous"}
                </p>
              </div>
            </div>
          </div>

          {/* AI Summary Block */}
          {project.aiSummary && (
            <div className="glass bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <Brain className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">AI Co-Developer Summary</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed italic">
                &quot;{project.aiSummary}&quot;
              </p>
            </div>
          )}

          {/* Description */}
          <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-indigo-400" />
              Project Description
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="glass rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-violet-400" />
              Roles &amp; Responsibilities
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {project.responsibilities}
            </p>
          </div>
        </div>

        {/* Sidebar (Col span 1) */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base">Collaboration status</h3>
            {isOwner ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold rounded-xl py-3 px-4 text-center">
                You own this project
              </div>
            ) : isMember ? (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold rounded-xl py-3 px-4 text-center">
                You are a team member
              </div>
            ) : session ? (
              <JoinProjectButton
                projectSlug={project.slug}
                isPending={hasPendingRequest}
              />
            ) : (
              <Link
                href="/sign-in"
                className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 px-4 text-center transition-colors"
              >
                Sign in to join team
              </Link>
            )}

            {(isOwner || isMember) && (
              <Link
                href={`/projects/${project.slug}/chat`}
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 px-4 transition-colors text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Open Team Chatroom
              </Link>
            )}

            {project.githubRepoUrl && (
              <a
                href={project.githubRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl py-3 px-4 transition-colors text-sm font-medium"
              >
                <Github className="h-4 w-4" />
                View GitHub Repository
              </a>
            )}
          </div>

          {/* Requirements & Technologies */}
          <div className="glass rounded-2xl p-6 space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                Technologies
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="bg-white/5 border border-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-xl"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                Required Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1.5 rounded-xl"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Matchmaker Suggestions for Owner */}
          {isOwner && <AIMatchmaker projectId={project.id} />}

          {/* Project Team Members */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-400" />
              Team Members ({members.length} / {project.teamSize})
            </h3>
            <div className="divide-y divide-white/5">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.profilePicture}
                    alt={member.username}
                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-300 truncate">
                      @{member.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {member.id === project.ownerId ? "Project Owner" : "Collaborator"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
