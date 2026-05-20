import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * FIX: Match both the route itself AND all sub-paths.
     * The previous config used "/dashboard/:path*" which only matched
     * /dashboard/something — NOT /dashboard itself.
     *
     * This pattern matches:
     *   /dashboard
     *   /dashboard/anything
     *   /analyze
     *   /analyze/anything
     *   etc.
     *
     * It also excludes Next.js internals and static files.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
