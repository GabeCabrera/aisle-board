"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, Sparkles, Calendar, Heart, ArrowLeft, Tag, Crown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { toast } from "sonner";
import * as redditPixel from "@/lib/reddit-pixel";

const PLAN_FEATURES = [
  "Budget tracking & expense management",
  "Unlimited budget items",
  "Category breakdowns & progress tracking",
  "Mobile-friendly interface",
  "Real-time sync across devices",
  "Export your data anytime",
];

// Pricing constants
const PRICING = {
  monthly: 9.99,
  yearly: 79,
};

function ChoosePlanContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [isLoading, setIsLoading] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    type?: "free" | "percentage" | "fixed";
    value?: number;
    description?: string;
  } | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  // Redirect if already onboarded
  useEffect(() => {
    if (session?.user?.onboardingComplete) {
      router.push("/planner");
    }
  }, [session, router]);

  // Clear promo result when billing cycle changes
  useEffect(() => {
    setPromoResult(null);
    setPromoCode("");
  }, [billingCycle]);

  // Calculate savings
  const monthlyCost = PRICING.monthly * 12;
  const yearlySavings = Math.round(monthlyCost - PRICING.yearly);

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin" />
      </main>
    );
  }

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setIsCheckingPromo(true);
    try {
      const response = await fetch("/api/stripe/check-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: promoCode.trim() }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        setPromoResult(null);
        return;
      }

      if (data.valid) {
        setPromoResult(data);
        if (data.type === "free") {
          toast.success("Free membership code applied!");
        } else {
          toast.success(`${data.description} applied!`);
        }
      } else {
        toast.error("Invalid promo code");
        setPromoResult(null);
      }
    } catch {
      toast.error("Failed to check promo code");
      setPromoResult(null);
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleClearPromoCode = () => {
    setPromoCode("");
    setPromoResult(null);
  };

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      // If it's a FREE promo code, apply it directly
      if (promoResult?.type === "free") {
        const response = await fetch("/api/stripe/apply-free-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promoCode: promoCode.trim() }),
        });

        const data = await response.json();

        if (data.success) {
          await fetch("/api/settings/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ onboardingComplete: true }),
          });

          toast.success(data.message);
          redditPixel.trackPurchase(0);
          router.push("/welcome");
          return;
        } else {
          throw new Error("Failed to apply free membership");
        }
      }

      // Go to Stripe subscription checkout with trial
      const response = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle,
          promoCode: promoCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  // Calculate display price with promo
  const getDisplayPrice = (basePrice: number) => {
    if (promoResult?.valid && promoResult.type !== "free") {
      if (promoResult.type === "percentage" && promoResult.value) {
        return basePrice * (1 - promoResult.value / 100);
      } else if (promoResult.type === "fixed" && promoResult.value) {
        return Math.max(0, basePrice - promoResult.value / 100);
      }
    }
    return basePrice;
  };

  const basePrice = billingCycle === "monthly" ? PRICING.monthly : PRICING.yearly;
  const displayPrice = getDisplayPrice(basePrice);

  return (
    <main className="min-h-screen py-16 px-4 sm:px-8 relative bg-gradient-to-b from-warm-50 to-white">
      {/* Back to Home */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-warm-500 hover:text-warm-700 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size="lg" href="/" />
          </div>
          <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
          
          {/* Trial Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full mb-6">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">14-day free trial • No credit card required to start</span>
          </div>
          
          <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-4">
            Start Your Free Trial
          </h1>
          <p className="text-warm-600 max-w-md mx-auto">
            Try Scribe & Stem free for 14 days. Plan your wedding budget with ease.
          </p>
        </div>

        {/* Single Plan Card */}
        <div className="relative p-8 border-2 border-rose-200 rounded-2xl bg-white shadow-lg mb-8">
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs tracking-widest uppercase rounded-full whitespace-nowrap flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Full Access
            </span>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8 mt-2">
            <div className="inline-flex items-center gap-2 p-1 bg-warm-100 rounded-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-warm-800 shadow-sm"
                    : "text-warm-500 hover:text-warm-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-white text-warm-800 shadow-sm"
                    : "text-warm-500 hover:text-warm-700"
                }`}
              >
                Yearly
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  Save ${yearlySavings}
                </span>
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-8">
            {promoResult?.type === "free" ? (
              <div>
                <p className="text-4xl font-light text-green-600">Free</p>
                <p className="text-sm text-green-600">with promo code</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-warm-500 mb-1">After your free trial</p>
                {promoResult?.valid ? (
                  <div className="flex items-baseline justify-center gap-2">
                    <p className="text-4xl font-light text-green-600">
                      ${displayPrice.toFixed(2)}
                    </p>
                    <p className="text-xl text-warm-400 line-through">
                      ${basePrice}
                    </p>
                  </div>
                ) : (
                  <p className="text-4xl font-light text-warm-700">
                    ${basePrice}
                  </p>
                )}
                <p className="text-sm text-warm-500 mt-1">
                  {billingCycle === "monthly" ? "per month" : "per year"}
                </p>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {PLAN_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-warm-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                <Input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Have a promo code?"
                  className="pl-10 uppercase"
                  disabled={isCheckingPromo || !!promoResult}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !promoResult) {
                      handleApplyPromoCode();
                    }
                  }}
                />
              </div>
              {promoResult ? (
                <Button
                  variant="outline"
                  onClick={handleClearPromoCode}
                  className="text-warm-500"
                >
                  Clear
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleApplyPromoCode}
                  disabled={isCheckingPromo || !promoCode.trim()}
                >
                  {isCheckingPromo ? "Checking..." : "Apply"}
                </Button>
              )}
            </div>
            {promoResult?.valid && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <Check className="w-4 h-4" /> 
                {promoResult.type === "free" ? "Free membership code applied!" : `${promoResult.description} applied!`}
              </p>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleStartTrial}
            size="lg"
            disabled={isLoading}
            className="w-full py-6 text-lg bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl"
          >
            {isLoading
              ? "Loading..."
              : promoResult?.type === "free"
                ? "Claim Free Access"
                : "Start 14-Day Free Trial"
            }
          </Button>

          <p className="mt-4 text-center text-sm text-warm-500">
            {promoResult?.type === "free"
              ? "No payment required"
              : "Cancel anytime during your trial. You won't be charged."}
          </p>
        </div>

        {/* Trust indicators */}
        <div className="pt-8 border-t border-warm-200">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-warm-500">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Made for couples</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Plan at your own pace</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Track every expense</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ChoosePlanPage() {
  return <ChoosePlanContent />;
}
