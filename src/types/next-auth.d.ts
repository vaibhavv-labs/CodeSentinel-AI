import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      bio?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    bio?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    bio?: string;
  }
}

export {};
