import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";
const { auth } = NextAuth(authConfig);
export default auth((req: NextAuthRequest) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Homepage always accessible
  if (pathname === "/") {
    return NextResponse.next();
  }

  const isAuthRoute = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
  const isProtectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/analyze") || pathname.startsWith("/history") || pathname.startsWith("/reports") || pathname.startsWith("/settings") || pathname.startsWith("/support");

  // Logged in user — don't show login/signup
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Not logged in — protect dashboard etc
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
