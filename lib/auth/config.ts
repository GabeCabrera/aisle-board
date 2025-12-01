import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getUserByEmail, getTenantById } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
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

        // If user signed up with Google and has no password, they need to use Google login
        if (!user.passwordHash) {
          throw new Error("Please sign in with Google");
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
    async signIn({ user, account }) {
      // For credentials login, just return true (already handled in authorize)
      if (account?.provider === "credentials") {
        return true;
      }

      // For Google login
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user already exists
          const existingUser = await getUserByEmail(user.email);

          if (existingUser) {
            // User exists - update their Google ID if not set
            if (!existingUser.googleId) {
              await db
                .update(users)
                .set({
                  googleId: account.providerAccountId,
                  name: existingUser.name || user.name, // Keep existing name or use Google name
                  updatedAt: new Date(),
                })
                .where(eq(users.id, existingUser.id));
            }
            return true;
          }

          // New user - create account
          const slug = `wedding-${nanoid(8)}`;
          const unsubscribeToken = nanoid(32);
          const displayName = user.name || "";

          // Create tenant
          const [tenant] = await db
            .insert(tenants)
            .values({
              slug,
              displayName,
              plan: "free",
              onboardingComplete: false,
            })
            .returning();

          // Create user linked to tenant
          await db.insert(users).values({
            email: user.email.toLowerCase(),
            name: user.name,
            passwordHash: "", // No password for Google-only users
            tenantId: tenant.id,
            role: "owner",
            googleId: account.providerAccountId,
            emailOptIn: true, // Default opt-in for Google signups
            unsubscribeToken,
          });

          return true;
        } catch (error) {
          console.error("Error during Google sign in:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (account && user) {
        // For Google login, we need to fetch the user from our database
        if (account.provider === "google" && token.email) {
          const dbUser = await getUserByEmail(token.email);
          if (dbUser) {
            const tenant = await getTenantById(dbUser.tenantId);
            token.id = dbUser.id;
            token.tenantId = dbUser.tenantId;
            token.tenantSlug = tenant?.slug ?? "";
            token.mustChangePassword = false; // Google users don't need to change password
          }
        } else {
          // Credentials login
          token.id = user.id;
          token.tenantId = user.tenantId;
          token.tenantSlug = user.tenantSlug;
          token.mustChangePassword = user.mustChangePassword;
        }
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
