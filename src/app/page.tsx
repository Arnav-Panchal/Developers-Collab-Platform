import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  Code2,
  Users,
  Sparkles,
  MessageSquare,
  Github,
  Target,
  Zap,
  ArrowRight,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Groq AI analyzes skills, project needs, and developer profiles to suggest the perfect teammates — beyond basic keyword matching.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Post project ideas, accept join requests, and manage your team. Built-in tools for seamless group coordination.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description:
      "Sign in with GitHub, sync your repos, and auto-detect your tech stack. Your profile builds itself.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description:
      "Per-project group chat with typing indicators. Discuss, decide, and ship — all in one place.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Target,
    title: "Smart Recommendations",
    description:
      "AI-curated project feed tailored to your skills. Discover projects that match your expertise and interests.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Zap,
    title: "Skill Analytics",
    description:
      "AI generates developer summaries, analyzes project complexity, and tracks your growth across collaborations.",
    gradient: "from-amber-500 to-orange-500",
  },
];

const stats = [
  { value: "AI", label: "Powered by Groq" },
  { value: "∞", label: "Collaboration Potential" },
  { value: "<1s", label: "AI Response Time" },
  { value: "100%", label: "Open Source" },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative overflow-hidden">
      {/* Background Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* ===== Hero Section ===== */}
      <section className="relative pt-20 pb-32 sm:pt-28 sm:pb-40" id="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-indigo-300 mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Groq AI — LLaMA 3.3</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            {session ? (
              <>
                Welcome back,{" "}
                <span className="gradient-text">
                  {session.user?.username || session.user?.name}
                </span>
              </>
            ) : (
              <>
                Find Your Perfect{" "}
                <span className="gradient-text">Dev Team</span>
                <br />
                <span className="text-gray-400 text-3xl sm:text-4xl md:text-5xl">
                  with AI-Powered Matching
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed">
            {session
              ? "Explore new projects, connect with developers, and let AI find your ideal collaborators."
              : "DevConnect uses Groq AI to analyze your skills and match you with the perfect projects and teammates. No more guesswork — just build."}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <>
                <Link
                  href="/discover"
                  className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  id="hero-discover-btn"
                >
                  <Compass className="w-5 h-5" />
                  Discover Projects
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl glass text-gray-200 font-semibold text-lg hover:text-white transition-all"
                  id="hero-dashboard-btn"
                >
                  My Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/api/auth/signin"
                  className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  id="hero-get-started-btn"
                >
                  <Github className="w-5 h-5" />
                  Get Started with GitHub
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/discover"
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl glass text-gray-200 font-semibold text-lg hover:text-white transition-all"
                  id="hero-explore-btn"
                >
                  <Globe className="w-5 h-5" />
                  Explore Projects
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== Stats Bar ===== */}
      <section className="relative py-12 border-y border-white/5" id="stats">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold gradient-text mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section className="relative py-24 sm:py-32" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="gradient-text">Collaborate</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From AI-powered skill analysis to real-time team chat — DevConnect
              is the complete toolkit for developer collaboration.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group glass rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
                id={`feature-card-${idx}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-100">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI Showcase ===== */}
      <section
        className="relative py-24 sm:py-32 border-t border-white/5"
        id="ai-showcase"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-6">
                <Zap className="w-3 h-3" />
                GROQ AI INTEGRATION
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                AI That{" "}
                <span className="gradient-text">Understands Developers</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Our Groq-powered AI doesn&apos;t just match keywords — it understands
                that a React developer might also excel with Vue, or that a
                Python ML engineer is perfect for a data science project even
                when &quot;Python&quot; isn&apos;t explicitly listed.
              </p>
              <ul className="space-y-4">
                {[
                  "Auto-generated developer profile summaries",
                  "Smart project-to-developer matching with reasoning",
                  "Project complexity analysis & tech stack extraction",
                  "Personalized project recommendations for your feed",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Demo Card */}
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI-Generated Developer Summary
              </div>
              <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                <p>
                  <span className="text-indigo-400 font-medium">Arnav</span> is
                  a full-stack developer with strong expertise in{" "}
                  <span className="tag">React</span>{" "}
                  <span className="tag">Node.js</span>{" "}
                  <span className="tag">MongoDB</span>. Based on 12 GitHub
                  repositories, they show particular strength in JavaScript (8
                  repos) and Python (3 repos).
                </p>
                <p>
                  Their DevConnect project history shows leadership in 2 team
                  projects focused on real-time applications and AI integration,
                  demonstrating strong skills in system design and team
                  coordination.
                </p>
                <p className="text-indigo-400/60 italic text-xs">
                  Generated in 0.8s by Groq LLaMA 3.3
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      {!session && (
        <section
          className="relative py-24 sm:py-32 border-t border-white/5"
          id="cta"
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Find Your{" "}
              <span className="gradient-text">Dream Team</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Join DevConnect and let AI match you with the perfect projects and
              collaborators. It&apos;s free, open source, and powered by the
              fastest AI inference on the planet.
            </p>
            <Link
              href="/api/auth/signin"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-lg transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
              id="cta-sign-up-btn"
            >
              <Github className="w-5 h-5" />
              Get Started — It&apos;s Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/5 py-8" id="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span className="text-sm text-gray-500">
                © {new Date().getFullYear()} DevConnect. Built with Next.js &
                Groq AI.
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="https://github.com/Arnav-Panchal/Developers-Collab-Platform"
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                target="_blank"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Lucide icon used in hero but imported at top
import { Compass } from "lucide-react";
