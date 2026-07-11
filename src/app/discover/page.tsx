import type { Metadata } from "next";
import DiscoverCatalog from "@/components/project/discover-catalog";

export const metadata: Metadata = {
  title: "Discover Projects",
  description: "Browse and discover developer collaboration projects. Filter by technology, skills, and find your next team.",
};

export default function DiscoverPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Discover <span className="gradient-text">Projects</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Find open projects that match your skills and interests.
        </p>
      </div>

      <DiscoverCatalog />
    </div>
  );
}
