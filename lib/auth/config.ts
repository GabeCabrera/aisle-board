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
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    tenantId: string;
    tenantSlug: string;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    tenantSlug: string;
    mustChangePassword: boolean;
  }
}

export const authOptions: NextAuthOptions = {
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.tenantSlug = user.tenantSlug;
        token.mustChangePassword = user.mustChangePassword;
      }

      // Handle session updates (e.g., after password change)
      if (trigger === "update" && session) {
        token.mustChangePassword = session.mustChangePassword ?? token.mustChangePassword;
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
      };
      return session;
    },
  },
};
