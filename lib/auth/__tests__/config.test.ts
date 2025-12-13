import { authOptions } from "../config";
import { getUserByEmail, getTenantById } from "@/lib/db/queries";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Mock DB queries
jest.mock("@/lib/db/queries", () => ({
  getUserByEmail: jest.fn(),
  getTenantById: jest.fn(),
}));

// Mock DB
jest.mock("@/lib/db", () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(),
      })),
    })),
    query: {
      oauthAccounts: {
        findFirst: jest.fn(),
      },
    },
  },
}));

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

// Mock nanoid (implicitly used)
jest.mock("nanoid", () => ({
  nanoid: () => "test-id",
}));

// Mock NextAuth Providers to return raw options
jest.mock("next-auth/providers/credentials", () => {
  return (options: any) => ({
    id: "credentials",
    name: "credentials",
    type: "credentials",
    ...options,
  });
});

jest.mock("next-auth/providers/google", () => {
  return (options: any) => ({
    id: "google",
    name: "Google",
    type: "oauth",
    ...options,
  });
});

describe("Auth Config", () => {
  const credentialsProvider = authOptions.providers.find(
    (p: any) => p.id === "credentials"
  ) as any;

  console.log("Credentials Provider Keys:", Object.keys(credentialsProvider || {}));
  if (credentialsProvider) {
      console.log("Authorize type:", typeof credentialsProvider.authorize);
  }

  describe("Credentials Provider authorize", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return user on valid credentials", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hashed-password",
        tenantId: "tenant-1",
        mustChangePassword: false,
      };
      
      const mockTenant = {
        slug: "test-tenant",
        onboardingComplete: true,
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (getTenantById as jest.Mock).mockResolvedValue(mockTenant);

      const result = await credentialsProvider.authorize({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        tenantId: "tenant-1",
        tenantSlug: "test-tenant",
        mustChangePassword: false,
        onboardingComplete: true,
      });
    });

    it("should throw error on invalid password", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        passwordHash: "hashed-password",
        tenantId: "tenant-1",
      };

      (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Invalid password

      await expect(
        credentialsProvider.authorize({
          email: "test@example.com",
          password: "wrong",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error if user not found", async () => {
      (getUserByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        credentialsProvider.authorize({
          email: "unknown@example.com",
          password: "any",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("Google SignIn Callback", () => {
    const signInCallback = authOptions.callbacks?.signIn;

    if (!signInCallback) {
      throw new Error("SignIn callback not found");
    }

    it("should allow credentials sign in without checks", async () => {
      const result = await signInCallback({
        user: { id: "1" } as any,
        account: { provider: "credentials" } as any,
        profile: {} as any,
        email: { verificationRequest: false }
      });
      expect(result).toBe(true);
    });

    // NOTE: Testing the full Google flow (DB inserts) is complex due to the deep mocking of `db.insert().values().returning()`.
    // We will verify the user lookup part.
    
    it("should check for existing user during Google sign in", async () => {
        const mockUser = {
            id: "user-1",
            email: "google@example.com",
            tenantId: "tenant-1"
        };
        (getUserByEmail as jest.Mock).mockResolvedValue(mockUser);
        
        // Mock DB update for existing user (updating Google ID)
        const mockUpdate = jest.fn().mockReturnThis();
        const mockSet = jest.fn().mockReturnThis();
        const mockWhere = jest.fn().mockResolvedValue({});
        (db.update as jest.Mock).mockReturnValue({
            set: mockSet,
        });
        mockSet.mockReturnValue({ where: mockWhere });

        // Mock OAuth find
        (db.query.oauthAccounts.findFirst as jest.Mock).mockResolvedValue({ id: "oauth-1" });

        await signInCallback({
            user: { email: "google@example.com", name: "Google User" } as any,
            account: { provider: "google", providerAccountId: "g-123", access_token: "token" } as any,
            profile: {} as any,
            email: { verificationRequest: false }
        });

        expect(getUserByEmail).toHaveBeenCalledWith("google@example.com");
    });
  });
});
