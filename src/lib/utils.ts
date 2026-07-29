import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS classes with proper conflict resolution.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable relative time string.
 * e.g., "2 hours ago", "3 days ago", "just now"
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: then.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Create a URL-safe slug from a string.
 */
export function createSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Leading words that carry no identity, so "The GDSC" collides with "GDSC". */
const NAME_KEY_STOP_WORDS = ["the", "a", "an"];

/**
 * Reduce a community name to a comparison key: lowercase, accent-folded, with
 * punctuation and spacing stripped. "GDSC", "G.D.S.C." and "The  gdsc " all
 * collapse to `gdsc`, so a unique index on this column catches the near-misses
 * a slug comparison would wave through.
 */
export function normalizeNameKey(str: string): string {
  const stripped = str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Only drop a stop word if something else survives — a community literally
  // called "The" should still key to something.
  const meaningful = stripped.filter((w) => !NAME_KEY_STOP_WORDS.includes(w));
  const words = meaningful.length > 0 ? meaningful : stripped;

  return words.join("");
}

/**
 * Materialized URL path for a community: "vit-vellore" at the root,
 * "vit-vellore/gdsc" for a child.
 */
export function buildCommunityPath(
  slug: string,
  parentPath?: string | null
): string {
  return parentPath ? `${parentPath}/${slug}` : slug;
}

/**
 * Extract the lowercased domain from an email address, or "" if malformed.
 */
export function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return "";
  return email.slice(at + 1).toLowerCase().trim();
}
