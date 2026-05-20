import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  /*
   * FIX: The core Credentials + Adapter redirect bug.
   *
   * PrismaAdapter stores sessions in the DB (database strategy).
   * Credentials provider ONLY works with JWT strategy.
   * Using both together causes NextAuth to fail silently on login:
   * - The authorize() succeeds and returns a user
   * - But NextAuth can't create a DB session for a Credentials user
   * - So the session is never set → user stays on /login
   *
   * Solution: Keep the adapter (needed for OAuth account linking in the DB),
   * but tell NextAuth to skip DB session creation for Credentials logins.
   * This is done via the `jwt` strategy in authConfig (already set) PLUS
   * making sure the adapter does not interfere with Credentials sessions.
   *
   * The cleanest NextAuth v5 pattern is to keep the adapter for OAuth
   * and rely entirely on JWT tokens for Credentials — which is what
   * strategy: "jwt" in authConfig already does. The issue is that some
   * versions of NextAuth v5 beta ignore the strategy when an adapter is
   * present. The fix below adds an explicit `session` override here to
   * enforce JWT regardless.
   */
  session: {
    strategy: "jwt", // explicitly re-declare here so the adapter doesn't override it
  },

  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // FIX: Always validate inputs first
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // No user found, or user signed up via OAuth (no password)
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) return null;

        // FIX: Return a clean plain object — do NOT return the Prisma model directly.
        // Returning the raw Prisma object can cause serialization issues in NextAuth v5
        // which leads to the JWT not being set and the redirect failing.
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          bio: user.bio ?? undefined,
        };
      },
    }),
  ],
});
