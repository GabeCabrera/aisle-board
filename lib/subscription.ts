import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// =============================================================================
// FEATURE GATING
// =============================================================================

// Features that can be gated by plan
export type FeatureKey =
  | "seating_chart"
  | "calendar_sync"
  | "pdf_export"
  | "unlimited_guests"
  | "unlimited_vendors"
  | "multiple_rsvp"
  | "premium_templates"
  | "vendor_contact_reveal"
  | "consultation"
  | "curated_vendors";

// Plan limits for free tier
export const PLAN_LIMITS = {
  free: {
    guests: 50,
    vendors: 10,
    rsvpForms: 1,
  },
  stem: {
    guests: Infinity,
    vendors: Infinity,
    rsvpForms: Infinity,
  },
  stemPlus: {
    guests: Infinity,
    vendors: Infinity,
    rsvpForms: Infinity,
  },
} as const;

// Features available per plan tier
const FEATURE_ACCESS: Record<FeatureKey, ("free" | "stem" | "stemPlus")[]> = {
  // Free tier features (empty means paid only)
  seating_chart: ["stem", "stemPlus"],
  calendar_sync: ["stem", "stemPlus"],
  pdf_export: ["stem", "stemPlus"],
  unlimited_guests: ["stem", "stemPlus"],
  unlimited_vendors: ["stem", "stemPlus"],
  multiple_rsvp: ["stem", "stemPlus"],
  premium_templates: ["stem", "stemPlus"],
  vendor_contact_reveal: ["stem", "stemPlus"],
  // Premium-only features
  consultation: ["stemPlus"],
  curated_vendors: ["stemPlus"],
};

/**
 * Map database plan types to tier names for feature checking
 */
function getPlanTier(plan: PlanType): "free" | "stem" | "stemPlus" {
  if (plan === "premium_monthly" || plan === "premium_yearly") return "stemPlus";
  if (plan === "monthly" || plan === "yearly") return "stem";
  return "free";
}

/**
 * Check if a plan has access to a specific feature
 */
export function canAccessFeature(plan: PlanType, feature: FeatureKey, hasLegacyAccess = false): boolean {
  // Legacy users have full access to everything
  if (hasLegacyAccess) return true;

  const tier = getPlanTier(plan);
  return FEATURE_ACCESS[feature].includes(tier);
}

/**
 * Get the limit for a specific resource based on plan
 */
export function getPlanLimit(plan: PlanType, resource: keyof typeof PLAN_LIMITS.free, hasLegacyAccess = false): number {
  if (hasLegacyAccess) return Infinity;

  const tier = getPlanTier(plan);
  return PLAN_LIMITS[tier][resource];
}

/**
 * Check if a user is within their limit for a resource
 */
export function isWithinLimit(plan: PlanType, resource: keyof typeof PLAN_LIMITS.free, currentCount: number, hasLegacyAccess = false): boolean {
  const limit = getPlanLimit(plan, resource, hasLegacyAccess);
  return currentCount < limit;
}

/**
 * Get remaining capacity for a resource
 */
export function getRemainingCapacity(plan: PlanType, resource: keyof typeof PLAN_LIMITS.free, currentCount: number, hasLegacyAccess = false): number | "unlimited" {
  const limit = getPlanLimit(plan, resource, hasLegacyAccess);
  if (limit === Infinity) return "unlimited";
  return Math.max(0, limit - currentCount);
}

// Subscription prices (set these in Stripe dashboard and copy the IDs here)
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
};

/**
 * Validate that required Stripe env vars are set
 * Call this before initiating checkout
 */
export function validateStripePrices(): { valid: boolean; missing: string[] } {
  const required = ["monthly", "yearly"] as const;
  const missing: string[] = [];

  for (const key of required) {
    if (!STRIPE_PRICES[key]) {
      missing.push(`STRIPE_PRICE_${key.toUpperCase()}`);
    }
  }

  return { valid: missing.length === 0, missing };
}

// Plan types - includes both standard and premium tiers
export type PlanType = "free" | "monthly" | "yearly" | "premium_monthly" | "premium_yearly";

/**
 * Get plan type from Stripe price ID
 * This is the source of truth - derive plan from price, not metadata
 */
export function getPlanFromPriceId(priceId: string): PlanType {
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_YEARLY) return "yearly";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_MONTHLY) return "premium_monthly";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM_YEARLY) return "premium_yearly";
  // Default to free if unknown price (shouldn't happen in production)
  return "free";
}

// Helper to check if a plan is a premium tier
export function isPremiumPlan(plan: PlanType): boolean {
  return plan === "premium_monthly" || plan === "premium_yearly";
}

// Helper to check if a plan is any paid tier
export function isPaidPlan(plan: PlanType): boolean {
  return plan !== "free";
}

export interface PlanAccess {
  plan: PlanType;
  hasFullAccess: boolean;
  isLegacy: boolean;
  subscriptionStatus: string | null;
  subscriptionEndsAt: Date | null;
}

/**
 * Check what access a tenant has based on their plan
 */
export async function getTenantAccess(tenantId: string): Promise<PlanAccess | null> {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) return null;

  const plan = tenant.plan as PlanType;
  const isSubscribed = tenant.subscriptionStatus === "active" || tenant.subscriptionStatus === "trialing";
  const isLegacy = tenant.hasLegacyAccess;
  
  // Full access if: subscribed, or legacy complete purchaser
  const hasFullAccess = isSubscribed || isLegacy;
  
  return {
    plan,
    hasFullAccess,
    isLegacy,
    subscriptionStatus: tenant.subscriptionStatus,
    subscriptionEndsAt: tenant.subscriptionEndsAt,
  };
}

/**
 * Check if a tenant can access a premium template
 */
export function canAccessTemplate(access: PlanAccess, templateIsFree: boolean): boolean {
  if (templateIsFree) return true;
  return access.hasFullAccess;
}

/**
 * Get display name for plan
 */
export function getPlanDisplayName(plan: PlanType, isLegacy: boolean): string {
  if (isLegacy) return "Complete (Legacy)";
  switch (plan) {
    case "monthly": return "Scribe Monthly";
    case "yearly": return "Scribe Yearly";
    case "premium_monthly": return "Scribe+ Monthly";
    case "premium_yearly": return "Scribe+ Yearly";
    default: return "Free";
  }
}
