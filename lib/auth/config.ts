import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail, getTenantById } from "@/lib/db/queries";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      tenantId: string;
      tenantSlug: string;
      mustChangePassword: boolean;
      onboardingComplete: boolean;
      accountType: "couple" | "vendor";
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    tenantId: string;
    tenantSlug: string;
    mustChangePassword: boolean;
    onboardingComplete: boolean;
    accountType: "couple" | "vendor";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    tenantSlug: string;
    mustChangePassword: boolean;
    onboardingComplete: boolean;
    accountType: "couple" | "vendor";
  }
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await getUserByEmail(credentials.email);
        if (!user) {
          throw new Error("Invalid email or password");
        }

        // User must have a password set
        if (!user.passwordHash) {
          throw new Error("Please reset your password to continue");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        const tenant = await getTenantById(user.tenantId);
        if (!tenant) {
          throw new Error("Account not properly configured");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          tenantSlug: tenant.slug,
          mustChangePassword: user.mustChangePassword,
          onboardingComplete: tenant.onboardingComplete ?? false,
          accountType: (tenant.accountType as "couple" | "vendor") || "couple",
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      // Credentials login is handled in authorize
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Initial sign in - populate token from user
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.mustChangePassword = user.mustChangePassword;
        token.onboardingComplete = user.onboardingComplete;
        token.accountType = user.accountType || "couple";
      }

      // Handle session updates (e.g., after password change or onboarding)
      if (trigger === "update" && session) {
        if (session.mustChangePassword !== undefined) {
          token.mustChangePassword = session.mustChangePassword;
        }
        if (session.onboardingComplete !== undefined) {
          token.onboardingComplete = session.onboardingComplete;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email ?? "",
        name: token.name,
        tenantId: token.tenantId,
        tenantSlug: token.tenantSlug,
        mustChangePassword: token.mustChangePassword,
        onboardingComplete: token.onboardingComplete,
        accountType: token.accountType || "couple",
      };
      return session;
    },
  },
};
