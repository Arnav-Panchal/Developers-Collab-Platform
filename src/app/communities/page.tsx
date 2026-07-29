import Link from "next/link";
import { auth } from "@/lib/auth";
import CommunityCatalog from "@/components/community/community-catalog";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Communities",
  description:
    "Find your college, company, club, or interest group — and see who else is in it.",
};

export default async function CommunitiesPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Communities
            </h1>
            <p className="text-base text-zinc-400 max-w-xl leading-relaxed">
              Colleges, companies, clubs and interest groups. Every club sits
              inside its institution, so two GDSCs at two colleges stay two
              different communities.
            </p>
          </div>

          {session && (
            <Link
              href="/communities/create"
              className="btn-primary shrink-0 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              New community
            </Link>
          )}
        </div>

        <CommunityCatalog />
      </div>
    </div>
  );
}
