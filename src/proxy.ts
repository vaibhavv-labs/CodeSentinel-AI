import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

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
  ],
};
