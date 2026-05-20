import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/dashboard", "/analyze", "/history", "/reports", "/settings"];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isLoggedIn = !!session?.user;

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/analyze/:path*",
    "/analyze",
    "/history/:path*",
    "/history",
    "/reports/:path*",
    "/reports",
    "/settings/:path*",
    "/settings",
    "/login",
    "/signup",
  ],
};
