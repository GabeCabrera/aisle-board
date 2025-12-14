/**
 * Vendor Claims Data Layer
 *
 * Handles database operations for the vendor claim flow:
 * - Creating claim tokens
 * - Verifying email tokens
 * - Admin approval/rejection
 * - Vendor account creation
 */

import { db } from "@/lib/db";
import {
  vendorClaimTokens,
  vendorProfiles,
  tenants,
  users,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { calculateProfileCompleteness } from "@/lib/services/google-places";

// Types
export type ClaimStatus = "pending" | "verified" | "approved" | "rejected";

export interface CreateClaimInput {
  vendorId: string;
  email: string;
}

export interface ClaimWithVendor {
  id: string;
  vendorId: string;
  email: string;
  token: string;
  status: ClaimStatus;
  expiresAt: Date;
  verifiedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  adminNotes: string | null;
  createdAt: Date;
  vendor: {
    id: string;
    name: string;
    slug: string;
    category: string;
    city: string | null;
    state: string | null;
    email: string | null;
    website: string | null;
    profileImage: string | null;
  };
}

/**
 * Create a new claim token for a vendor
 */
export async function createClaimToken(
  input: CreateClaimInput
): Promise<{ token: string; expiresAt: Date } | { error: string }> {
  const { vendorId, email } = input;

  // Check if vendor exists and is unclaimed
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, vendorId),
  });

  if (!vendor) {
    return { error: "Vendor not found" };
  }

  if (vendor.claimedByTenantId) {
    return { error: "This vendor has already been claimed" };
  }

  if (vendor.claimStatus === "pending") {
    return { error: "A claim is already pending for this vendor" };
  }

  // Check for existing pending/verified claim with same email
  const existingClaim = await db.query.vendorClaimTokens.findFirst({
    where: and(
      eq(vendorClaimTokens.vendorId, vendorId),
      eq(vendorClaimTokens.email, email)
    ),
    orderBy: [desc(vendorClaimTokens.createdAt)],
  });

  if (existingClaim) {
    if (existingClaim.status === "pending" || existingClaim.status === "verified") {
      // Check if token is still valid
      if (new Date(existingClaim.expiresAt) > new Date()) {
        return { error: "A claim request is already pending for this email" };
      }
    }
  }

  // Generate token and expiry (24 hours)
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Create claim token
  await db.insert(vendorClaimTokens).values({
    vendorId,
    email: email.toLowerCase(),
    token,
    status: "pending",
    expiresAt,
  });

  // Update vendor claim status
  await db
    .update(vendorProfiles)
    .set({ claimStatus: "pending", updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendorId));

  return { token, expiresAt };
}

/**
 * Verify a claim token (email verification step)
 */
export async function verifyClaimToken(
  token: string
): Promise<{ claim: ClaimWithVendor } | { error: string }> {
  const claim = await db.query.vendorClaimTokens.findFirst({
    where: eq(vendorClaimTokens.token, token),
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          state: true,
          email: true,
          website: true,
          profileImage: true,
        },
      },
    },
  });

  if (!claim) {
    return { error: "Invalid or expired token" };
  }

  if (new Date(claim.expiresAt) < new Date()) {
    return { error: "This verification link has expired" };
  }

  if (claim.status !== "pending") {
    if (claim.status === "verified") {
      return { error: "This email has already been verified. Awaiting admin approval." };
    }
    if (claim.status === "approved") {
      return { error: "This claim has already been approved" };
    }
    if (claim.status === "rejected") {
      return { error: "This claim was rejected" };
    }
  }

  // Update claim to verified
  await db
    .update(vendorClaimTokens)
    .set({
      status: "verified",
      verifiedAt: new Date(),
    })
    .where(eq(vendorClaimTokens.id, claim.id));

  return {
    claim: {
      ...claim,
      status: "verified" as ClaimStatus,
      verifiedAt: new Date(),
    } as ClaimWithVendor,
  };
}

/**
 * Get all pending claims (for admin)
 */
export async function getPendingClaims(): Promise<ClaimWithVendor[]> {
  const claims = await db.query.vendorClaimTokens.findMany({
    where: eq(vendorClaimTokens.status, "verified"),
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          state: true,
          email: true,
          website: true,
          profileImage: true,
        },
      },
    },
    orderBy: [desc(vendorClaimTokens.verifiedAt)],
  });

  return claims as ClaimWithVendor[];
}

/**
 * Get all claims with filters (for admin)
 */
export async function getAllClaims(options?: {
  status?: ClaimStatus;
  limit?: number;
  offset?: number;
}): Promise<ClaimWithVendor[]> {
  const { status, limit = 50, offset = 0 } = options || {};

  const claims = await db.query.vendorClaimTokens.findMany({
    where: status ? eq(vendorClaimTokens.status, status) : undefined,
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          state: true,
          email: true,
          website: true,
          profileImage: true,
        },
      },
    },
    orderBy: [desc(vendorClaimTokens.createdAt)],
    limit,
    offset,
  });

  return claims as ClaimWithVendor[];
}

/**
 * Get claim by ID
 */
export async function getClaimById(
  claimId: string
): Promise<ClaimWithVendor | null> {
  const claim = await db.query.vendorClaimTokens.findFirst({
    where: eq(vendorClaimTokens.id, claimId),
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          state: true,
          email: true,
          website: true,
          profileImage: true,
        },
      },
    },
  });

  return claim as ClaimWithVendor | null;
}

/**
 * Get claim by token
 */
export async function getClaimByToken(
  token: string
): Promise<ClaimWithVendor | null> {
  const claim = await db.query.vendorClaimTokens.findFirst({
    where: eq(vendorClaimTokens.token, token),
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          state: true,
          email: true,
          website: true,
          profileImage: true,
        },
      },
    },
  });

  return claim as ClaimWithVendor | null;
}

/**
 * Approve a vendor claim (admin action)
 * This generates a registration token for the vendor
 */
export async function approveClaimRequest(
  claimId: string,
  adminUserId: string,
  notes?: string
): Promise<{ registrationToken: string } | { error: string }> {
  const claim = await db.query.vendorClaimTokens.findFirst({
    where: eq(vendorClaimTokens.id, claimId),
    with: { vendor: true },
  });

  if (!claim) {
    return { error: "Claim not found" };
  }

  if (claim.status !== "verified") {
    return { error: "Only verified claims can be approved" };
  }

  // Generate a new registration token
  const registrationToken = nanoid(32);

  // Update claim status
  await db
    .update(vendorClaimTokens)
    .set({
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
      adminNotes: notes,
      token: registrationToken, // Replace verification token with registration token
    })
    .where(eq(vendorClaimTokens.id, claimId));

  return { registrationToken };
}

/**
 * Reject a vendor claim (admin action)
 */
export async function rejectClaimRequest(
  claimId: string,
  adminUserId: string,
  notes?: string
): Promise<{ success: boolean } | { error: string }> {
  const claim = await db.query.vendorClaimTokens.findFirst({
    where: eq(vendorClaimTokens.id, claimId),
    with: { vendor: true },
  });

  if (!claim) {
    return { error: "Claim not found" };
  }

  if (claim.status !== "verified" && claim.status !== "pending") {
    return { error: "Only pending or verified claims can be rejected" };
  }

  // Update claim status
  await db
    .update(vendorClaimTokens)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
      adminNotes: notes,
    })
    .where(eq(vendorClaimTokens.id, claimId));

  // Reset vendor claim status
  await db
    .update(vendorProfiles)
    .set({ claimStatus: "unclaimed", updatedAt: new Date() })
    .where(eq(vendorProfiles.id, claim.vendorId));

  return { success: true };
}

/**
 * Complete vendor registration (after approval)
 * Creates tenant and user accounts, links to vendor profile
 */
export async function completeVendorRegistration(input: {
  token: string;
  password: string;
  displayName?: string;
}): Promise<{ tenantId: string; vendorId: string } | { error: string }> {
  const { token, password, displayName } = input;

  // Find the approved claim
  const claim = await db.query.vendorClaimTokens.findFirst({
    where: and(
      eq(vendorClaimTokens.token, token),
      eq(vendorClaimTokens.status, "approved")
    ),
    with: { vendor: true },
  });

  if (!claim) {
    return { error: "Invalid or expired registration link" };
  }

  // Check if vendor is already claimed
  if (claim.vendor.claimedByTenantId) {
    return { error: "This vendor has already been claimed" };
  }

  // Check if email is already in use
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, claim.email),
  });

  if (existingUser) {
    return { error: "An account with this email already exists" };
  }

  // Create tenant
  const tenantId = crypto.randomUUID();
  const vendorSlug = `vendor-${claim.vendor.slug}-${nanoid(6)}`;

  await db.insert(tenants).values({
    id: tenantId,
    slug: vendorSlug,
    displayName: displayName || claim.vendor.name,
    accountType: "vendor",
    plan: "free",
    onboardingComplete: false,
  });

  // Create user
  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const unsubscribeToken = nanoid(32);

  await db.insert(users).values({
    id: userId,
    tenantId,
    email: claim.email,
    name: displayName || claim.vendor.name,
    passwordHash,
    role: "owner",
    mustChangePassword: false,
    emailOptIn: true,
    unsubscribeToken,
  });

  // Update vendor profile
  const completeness = calculateProfileCompleteness(claim.vendor);

  await db
    .update(vendorProfiles)
    .set({
      claimedByTenantId: tenantId,
      claimStatus: "claimed",
      email: claim.email, // Update vendor email to claim email
      profileCompleteness: completeness,
      updatedAt: new Date(),
    })
    .where(eq(vendorProfiles.id, claim.vendorId));

  return { tenantId, vendorId: claim.vendorId };
}

/**
 * Get claim status for a vendor
 */
export async function getVendorClaimStatus(vendorId: string): Promise<{
  status: "unclaimed" | "pending" | "verified" | "claimed";
  claim?: ClaimWithVendor;
}> {
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, vendorId),
  });

  if (!vendor) {
    return { status: "unclaimed" };
  }

  if (vendor.claimedByTenantId) {
    return { status: "claimed" };
  }

  // Check for pending claims
  const claim = await db.query.vendorClaimTokens.findFirst({
    where: and(
      eq(vendorClaimTokens.vendorId, vendorId),
      eq(vendorClaimTokens.status, "pending")
    ),
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          state: true,
          email: true,
          website: true,
          profileImage: true,
        },
      },
    },
    orderBy: [desc(vendorClaimTokens.createdAt)],
  });

  if (claim) {
    return { status: "pending", claim: claim as ClaimWithVendor };
  }

  // Check for verified claims awaiting approval
  const verifiedClaim = await db.query.vendorClaimTokens.findFirst({
    where: and(
      eq(vendorClaimTokens.vendorId, vendorId),
      eq(vendorClaimTokens.status, "verified")
    ),
    with: {
      vendor: {
        columns: {
          id: true,
          name: true,
          slug: true,
          category: true,
          city: true,
          state: true,
          email: true,
          website: true,
          profileImage: true,
        },
      },
    },
    orderBy: [desc(vendorClaimTokens.createdAt)],
  });

  if (verifiedClaim) {
    return { status: "verified", claim: verifiedClaim as ClaimWithVendor };
  }

  return { status: "unclaimed" };
}

/**
 * Update vendor profile completeness score
 */
export async function updateVendorCompleteness(vendorId: string): Promise<number> {
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, vendorId),
  });

  if (!vendor) {
    return 0;
  }

  const completeness = calculateProfileCompleteness(vendor);

  await db
    .update(vendorProfiles)
    .set({ profileCompleteness: completeness, updatedAt: new Date() })
    .where(eq(vendorProfiles.id, vendorId));

  return completeness;
}
