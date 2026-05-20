import type { AuthConfig } from "@auth/core";

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const protectedRoutes = [
        "/dashboard",
        "/analyze",
        "/history",
        "/reports",
        "/settings",
      ];

      const isProtected = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );

      // Not logged in trying to access protected route → deny (middleware redirects to /login)
      if (isProtected && !isLoggedIn) return false;

      // Logged-in user visiting auth pages → redirect to dashboard
      if (
        isLoggedIn &&
        (nextUrl.pathname === "/login" || nextUrl.pathname === "/signup")
      ) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // FIX: Logged-in user visiting root → redirect to dashboard
      if (isLoggedIn && nextUrl.pathname === "/") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // On first sign-in, attach user fields to the token
      if (user) {
        token.id = user.id;
        const userBio = "bio" in user ? user.bio : undefined;
        token.bio = typeof userBio === "string" ? userBio : undefined;
      }

      // On session update (e.g. profile edit), merge new values
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
        const sessionBio = "bio" in session ? session.bio : undefined;
        if (typeof sessionBio === "string") token.bio = sessionBio;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as { bio?: string }).bio =
          token.bio as string | undefined;
      }
      return session;
    },

    // FIX: Correct redirect callback — only send to /dashboard as final fallback,
    // not for every relative URL (which would break API callbacks, sign-out, etc.)
    async redirect({ url, baseUrl }) {
      // Relative URL — allow it as-is
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Same origin — allow it
      if (new URL(url).origin === baseUrl) return url;
      // External URL — safe fallback to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  providers: [],
} satisfies AuthConfig;
