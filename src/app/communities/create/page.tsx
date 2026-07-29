import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CreateCommunityForm from "@/components/community/create-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a community",
  description: "Start a club, chapter, or interest group.",
};

export default async function CreateCommunityPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-12">
        <Link
          href="/communities"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-12 uppercase tracking-wider font-semibold"
        >
          ← Back to Communities
        </Link>

        <div className="space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Create a community
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            We&apos;ll check for existing communities as you type, so you can
            join one instead of starting a duplicate.
          </p>
        </div>

        <CreateCommunityForm />
      </div>
    </div>
  );
}
