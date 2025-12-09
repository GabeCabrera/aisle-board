import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      tenantSlug: string;
      email: string;
      name?: string | null;
      bio?: string | null;
      socialLinks?: {
        instagram?: string;
        tiktok?: string;
        website?: string;
      } | null;
      profileImage?: string | null;
      mustChangePassword: boolean;
      onboardingComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    tenantId: string;
    tenantSlug: string;
    email: string;
    name?: string | null;
    bio?: string | null;
    socialLinks?: {
      instagram?: string;
      tiktok?: string;
      website?: string;
    } | null;
    profileImage?: string | null;
    mustChangePassword: boolean;
    onboardingComplete: boolean;
  }
}
