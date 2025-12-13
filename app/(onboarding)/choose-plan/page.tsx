"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, Sparkles, Calendar, Heart, ArrowLeft, Tag, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { toast } from "sonner";
import * as redditPixel from "@/lib/reddit-pixel";

const FREE_FEATURES = [
  "3 essential templates",
  "10 AI planner messages",
  "Day-of schedule",
  "Budget tracker",
  "Guest list",
];

const SCRIBE_FEATURES = [
  "All 10+ planning templates",
  "Unlimited AI planner",
  "Vibe discovery & matching",
  "Vendor contact tracking",
  "Seating chart builder",
  "Wedding party management",
  "Timeline & checklists",
  "Export to PDF",
];

const SCRIBE_PLUS_FEATURES = [
  "Everything in Scribe",
  "Priority AI responses",
  "Curated vendor recommendations",
  "1:1 planning consultation call",
  "Premium export templates",
  "Early access to new features",
];

// Pricing constants
const PRICING = {
  scribe: {
    monthly: 11.99,
    yearly: 119,
  },
  plus: {
    monthly: 24.99,
    yearly: 249,
  },
};

type PlanSelection = "free" | "scribe" | "plus";

function ChoosePlanContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<PlanSelection | null>(null);
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

  // Clear promo result when billing cycle changes (promo may not apply to both cycles)
  useEffect(() => {
    setPromoResult(null);
    setPromoCode("");
  }, [billingCycle]);

  // Calculate savings
  const scribeMonthlyCost = PRICING.scribe.monthly * 12;
  const scribeYearlySavings = Math.round(scribeMonthlyCost - PRICING.scribe.yearly);

  const plusMonthlyCost = PRICING.plus.monthly * 12;
  const plusYearlySavings = Math.round(plusMonthlyCost - PRICING.plus.yearly);

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
    } catch (error) {
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

  const handleContinueWithFree = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/plan/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "free" }),
      });

      await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });

      redditPixel.trackLead();
      router.push("/welcome");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (plan: "scribe" | "plus") => {
    setIsLoading(true);
    try {
      // If it's a FREE promo code, apply it directly (only for scribe plan)
      if (promoResult?.type === "free" && plan === "scribe") {
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

      // Determine the billing cycle key for the API
      const planKey = plan === "plus"
        ? (billingCycle === "monthly" ? "premium_monthly" : "premium_yearly")
        : billingCycle;

      // Go to Stripe subscription checkout
      const response = await fetch("/api/stripe/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle: planKey,
          promoCode: promoCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error) {
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  // Calculate display price with promo for a given base price
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

  const scribeBasePrice = billingCycle === "monthly" ? PRICING.scribe.monthly : PRICING.scribe.yearly;
  const scribeDisplayPrice = getDisplayPrice(scribeBasePrice);

  const plusBasePrice = billingCycle === "monthly" ? PRICING.plus.monthly : PRICING.plus.yearly;
  const plusDisplayPrice = getDisplayPrice(plusBasePrice);

  return (
    <main className="min-h-screen py-16 px-4 sm:px-8 relative">
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

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size="lg" href="/" />
          </div>
          <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-4">
            Choose Your Plan
          </h1>
          <p className="text-warm-600 max-w-md mx-auto">
            Start planning with Scribe, your AI wedding planner
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
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
                Save up to ${plusYearlySavings}
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards - 3 columns */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Free Plan */}
          <div
            onClick={() => setSelectedPlan("free")}
            className={`
              relative p-6 lg:p-8 border rounded-xl cursor-pointer transition-all duration-300
              ${selectedPlan === "free"
                ? "border-warm-500 bg-warm-50/50 shadow-lg"
                : "border-warm-200 hover:border-warm-300 hover:shadow-md"
              }
            `}
          >
            <div className="mb-6">
              <h2 className="text-xl font-serif tracking-wider uppercase mb-2">
                Free
              </h2>
              <p className="text-3xl font-light text-warm-700">$0</p>
              <p className="text-sm text-warm-500">forever</p>
            </div>

            <p className="text-warm-600 mb-6 text-sm">
              Get started with essential planning tools and try your AI planner.
            </p>

            <div className="space-y-3 mb-6">
              {FREE_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-warm-400 flex-shrink-0" />
                  <span className="text-warm-600 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {selectedPlan === "free" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-warm-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Scribe Plan - Most Popular */}
          <div
            onClick={() => setSelectedPlan("scribe")}
            className={`
              relative p-6 lg:p-8 border-2 rounded-xl cursor-pointer transition-all duration-300
              ${selectedPlan === "scribe"
                ? "border-rose-400 bg-gradient-to-br from-rose-50/50 to-amber-50/50 shadow-lg"
                : "border-rose-200 hover:border-rose-300 hover:shadow-md bg-gradient-to-br from-rose-50/30 to-amber-50/30"
              }
            `}
          >
            {/* Most Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs tracking-widest uppercase rounded-full whitespace-nowrap">
                Most Popular
              </span>
            </div>

            <div className="mb-6 mt-2">
              <h2 className="text-xl font-serif tracking-wider uppercase mb-2 flex items-center gap-2">
                Scribe
                <Crown className="w-5 h-5 text-amber-500" />
              </h2>

              {/* Price display */}
              {promoResult?.type === "free" ? (
                <div>
                  <p className="text-3xl font-light text-green-600">Free</p>
                  <p className="text-sm text-green-600">with promo code</p>
                </div>
              ) : (
                <div>
                  {promoResult?.valid ? (
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-light text-green-600">
                        ${scribeDisplayPrice.toFixed(2)}
                      </p>
                      <p className="text-lg text-warm-400 line-through">
                        ${scribeBasePrice}
                      </p>
                    </div>
                  ) : (
                    <p className="text-3xl font-light text-warm-700">
                      ${scribeBasePrice}
                    </p>
                  )}
                  <p className="text-sm text-warm-500">
                    {billingCycle === "monthly" ? "per month" : "per year"}
                    {billingCycle === "yearly" && (
                      <span className="text-green-600 ml-1">(save ${scribeYearlySavings})</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <p className="text-warm-600 mb-6 text-sm">
              The full Scribe experience with unlimited AI planning help.
            </p>

            <div className="space-y-3 mb-6">
              {SCRIBE_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-warm-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {selectedPlan === "scribe" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Scribe+ Plan - Premium */}
          <div
            onClick={() => setSelectedPlan("plus")}
            className={`
              relative p-6 lg:p-8 border rounded-xl cursor-pointer transition-all duration-300
              ${selectedPlan === "plus"
                ? "border-purple-400 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 shadow-lg"
                : "border-warm-200 hover:border-purple-200 hover:shadow-md"
              }
            `}
          >
            {/* Premium badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs tracking-widest uppercase rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                Premium
              </span>
            </div>

            <div className="mb-6 mt-2">
              <h2 className="text-xl font-serif tracking-wider uppercase mb-2 flex items-center gap-2">
                Scribe+
                <Star className="w-5 h-5 text-purple-500" />
              </h2>

              {/* Price display */}
              <div>
                {promoResult?.valid && promoResult.type !== "free" ? (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-light text-green-600">
                      ${plusDisplayPrice.toFixed(2)}
                    </p>
                    <p className="text-lg text-warm-400 line-through">
                      ${plusBasePrice}
                    </p>
                  </div>
                ) : (
                  <p className="text-3xl font-light text-warm-700">
                    ${plusBasePrice}
                  </p>
                )}
                <p className="text-sm text-warm-500">
                  {billingCycle === "monthly" ? "per month" : "per year"}
                  {billingCycle === "yearly" && (
                    <span className="text-green-600 ml-1">(save ${plusYearlySavings})</span>
                  )}
                </p>
              </div>
            </div>

            <p className="text-warm-600 mb-6 text-sm">
              White-glove planning with personalized guidance and premium perks.
            </p>

            <div className="space-y-3 mb-6">
              {SCRIBE_PLUS_FEATURES.map((feature, index) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className={`w-4 h-4 flex-shrink-0 ${index === 0 ? "text-rose-400" : "text-purple-400"}`} />
                  <span className={`text-sm ${index === 0 ? "text-warm-600 font-medium" : "text-warm-700"}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {selectedPlan === "plus" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Promo Code Input */}
        <div className="max-w-md mx-auto mb-8">
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
            <p className="text-sm text-green-600 mt-2 text-center flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> {promoResult.type === "free" ? "Free membership code applied!" : `${promoResult.description} applied!`}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {selectedPlan && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            {selectedPlan === "free" ? (
              <Button
                onClick={handleContinueWithFree}
                variant="outline"
                size="lg"
                disabled={isLoading}
                className="px-12"
              >
                {isLoading ? "Loading..." : "Start with Free"}
              </Button>
            ) : selectedPlan === "scribe" ? (
              <Button
                onClick={() => handleSubscribe("scribe")}
                size="lg"
                disabled={isLoading}
                className="px-12 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
              >
                {isLoading
                  ? "Loading..."
                  : promoResult?.type === "free"
                    ? "Claim Free Access"
                    : `Subscribe — $${scribeDisplayPrice.toFixed(2)}/${billingCycle === "monthly" ? "mo" : "yr"}`
                }
              </Button>
            ) : (
              <Button
                onClick={() => handleSubscribe("plus")}
                size="lg"
                disabled={isLoading}
                className="px-12 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
              >
                {isLoading
                  ? "Loading..."
                  : `Subscribe — $${plusDisplayPrice.toFixed(2)}/${billingCycle === "monthly" ? "mo" : "yr"}`
                }
              </Button>
            )}

            <p className="mt-4 text-sm text-warm-500">
              {selectedPlan === "free"
                ? "Upgrade anytime to unlock everything"
                : promoResult?.type === "free" && selectedPlan === "scribe"
                  ? "No payment required"
                  : "Cancel anytime. Secure checkout powered by Stripe."
              }
            </p>
          </div>
        )}

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-warm-200">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-warm-500">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Made for couples, by couples</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Plan at your own pace</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Powered by AI</span>
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