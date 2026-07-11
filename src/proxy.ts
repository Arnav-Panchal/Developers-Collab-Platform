export { auth as proxy } from "@/lib/auth";

export const config = {
  // Protect these routes — redirect to sign-in if not authenticated
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/notifications/:path*",
    "/projects/create",
  ],
};
