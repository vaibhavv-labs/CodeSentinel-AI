import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// KEY FIX: Use only authConfig here (no PrismaAdapter, no Credentials).
// This runs on the Edge runtime (Vercel middleware).
// PrismaAdapter and bcrypt are Node.js-only — they crash on Edge.
// authConfig has NO providers and NO adapter, so it's safe for Edge.
// The JWT cookie is read and verified here to check if user is logged in.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    // KEY FIX: Match both the route itself AND sub-paths.
    // "/dashboard/:path*" only matches /dashboard/something,
    // NOT /dashboard itself — leaving the root route unprotected.
    // This regex matches all routes except Next.js internals + static files.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
