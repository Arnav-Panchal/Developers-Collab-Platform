"use client";

import { signIn } from "next-auth/react";
import { Github, Code2, Sparkles } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glass rounded-2xl p-8 sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-center">
              Welcome to{" "}
              <span className="gradient-text">DevConnect</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 text-center">
              Sign in to find your perfect dev team
            </p>
          </div>

          {/* GitHub Sign In */}
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-base transition-all shadow-lg"
            id="github-sign-in-btn"
          >
            <Github className="w-5 h-5" />
            Continue with GitHub
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Why GitHub?
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Benefits */}
          <ul className="space-y-3">
            {[
              "Auto-sync your repos and tech stack",
              "AI generates your developer profile",
              "One-click sign in, no passwords",
            ].map((benefit, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-gray-400"
              >
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-gray-600 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
