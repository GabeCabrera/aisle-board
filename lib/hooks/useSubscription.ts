"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { FeatureKey, PlanType } from "@/lib/subscription";

interface SubscriptionData {
  plan: PlanType;
  hasFullAccess: boolean;
  isLegacy: boolean;
  subscriptionStatus: string | null;
  limits: {
    guests: number;
    vendors: number;
    rsvpForms: number;
  };
  usage?: {
    guests: number;
    vendors: number;
    rsvpForms: number;
  };
}

interface UseSubscriptionReturn {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  canAccess: (feature: FeatureKey) => boolean;
  isWithinLimit: (resource: "guests" | "vendors" | "rsvpForms", currentCount?: number) => boolean;
  getRemaining: (resource: "guests" | "vendors" | "rsvpForms", currentCount?: number) => number | "unlimited";
  openUpgrade: () => void;
  refetch: () => Promise<void>;
}

/**
 * Hook to access subscription status and feature gating in components
 */
export function useSubscription(): UseSubscriptionReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (status === "loading") return;
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/subscription/status");
      if (!response.ok) {
        throw new Error("Failed to fetch subscription");
      }
      const data = await response.json();
      setSubscription(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setError("Failed to load subscription status");
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Check if user can access a specific feature
   */
  const canAccess = useCallback(
    (feature: FeatureKey): boolean => {
      if (!subscription) return false;
      if (subscription.isLegacy || subscription.hasFullAccess) return true;

      // Free tier features
      const freeFeatures: FeatureKey[] = [];
      const stemFeatures: FeatureKey[] = [
        "seating_chart",
        "calendar_sync",
        "pdf_export",
        "unlimited_guests",
        "unlimited_vendors",
        "multiple_rsvp",
        "premium_templates",
        "vendor_contact_reveal",
      ];
      const stemPlusFeatures: FeatureKey[] = [
        "consultation",
        "curated_vendors",
      ];

      const plan = subscription.plan;
      const isPaid = plan !== "free";
      const isPremium = plan === "premium_monthly" || plan === "premium_yearly";

      if (freeFeatures.includes(feature)) return true;
      if (isPaid && stemFeatures.includes(feature)) return true;
      if (isPremium && stemPlusFeatures.includes(feature)) return true;

      return false;
    },
    [subscription]
  );

  /**
   * Check if user is within their limit for a resource
   */
  const isWithinLimit = useCallback(
    (resource: "guests" | "vendors" | "rsvpForms", currentCount?: number): boolean => {
      if (!subscription) return false;
      if (subscription.hasFullAccess || subscription.isLegacy) return true;

      const limit = subscription.limits[resource];
      const count = currentCount ?? subscription.usage?.[resource] ?? 0;
      return count < limit;
    },
    [subscription]
  );

  /**
   * Get remaining capacity for a resource
   */
  const getRemaining = useCallback(
    (resource: "guests" | "vendors" | "rsvpForms", currentCount?: number): number | "unlimited" => {
      if (!subscription) return 0;
      if (subscription.hasFullAccess || subscription.isLegacy) return "unlimited";

      const limit = subscription.limits[resource];
      if (limit === Infinity) return "unlimited";

      const count = currentCount ?? subscription.usage?.[resource] ?? 0;
      return Math.max(0, limit - count);
    },
    [subscription]
  );

  /**
   * Navigate to upgrade page
   */
  const openUpgrade = useCallback(() => {
    router.push("/choose-plan");
  }, [router]);

  return {
    subscription,
    loading: loading || status === "loading",
    error,
    canAccess,
    isWithinLimit,
    getRemaining,
    openUpgrade,
    refetch: fetchSubscription,
  };
}
