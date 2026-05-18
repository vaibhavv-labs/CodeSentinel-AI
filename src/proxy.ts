import NextAuth from "next-auth";
import { authConfig } from "./auth.config"; 
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth((req: NextAuthRequest) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 1. ALWAYS allow NextAuth internal APIs
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 2. Public routes (Add any other public pages here, like /register)
  const isPublicRoute = pathname === "/login" || pathname === "/register" || pathname === "/";

  // 3. Redirect logic
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    // Protect dashboard: if not logged in, go to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isPublicRoute && isLoggedIn) {
    // If already logged in, don't let them stay on login page, send to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // This matcher ensures the middleware runs on almost all paths
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};