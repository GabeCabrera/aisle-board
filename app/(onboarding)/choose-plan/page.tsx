"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Sparkles, Calendar, Users, Heart, Clock, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceDisplay, useDiscount } from "@/components/price-display";
import { toast } from "sonner";
import * as redditPixel from "@/lib/reddit-pixel";

const FREE_TEMPLATES = [
  {
    name: "Day-Of Schedule",
    description: "Hour-by-hour timeline for your big day",
    icon: Clock,
  },
  {
    name: "Budget Tracker",
    description: "Track estimated vs actual costs",
    icon: DollarSign,
  },
  {
    name: "Guest List",
    description: "RSVPs, meals, and contact info",
    icon: Users,
  },
];

const COMPLETE_BENEFITS = [
  "All 10+ templates included",
  "Vendor contact tracking",
  "Seating chart builder",
  "Wedding party management",
  "Planning timeline & checklists",
  "Wedding overview dashboard",
  "Notes & free-form pages",
  "Export to PDF anytime",
  "Lifetime access — no subscriptions",
];

function ChoosePlanContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<"free" | "complete" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { finalPrice, hasDiscount } = useDiscount();

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin" />
      </main>
    );
  }

  const handleSelectFree = () => {
    setSelectedPlan("free");
  };

  const handleSelectComplete = () => {
    setSelectedPlan("complete");
  };

  const handleContinueWithFree = async () => {
    setIsLoading(true);
    try {
      // Update plan to free and mark onboarding as complete
      await fetch("/api/plan/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "free" }),
      });

      // Mark onboarding complete
      await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingComplete: true }),
      });
      
      // Track lead conversion (free plan selection)
      redditPixel.trackLead();
      
      // Go to welcome flow
      router.push("/welcome");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseComplete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
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

  return (
    <main className="min-h-screen py-16 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-4">
            Choose Your Experience
          </h1>
          <p className="text-warm-600 max-w-md mx-auto">
            Start planning the wedding of your dreams. Select the option that works best for you.
          </p>
          <div className="w-12 h-px bg-warm-400 mx-auto mt-6" />
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan */}
          <div
            onClick={handleSelectFree}
            className={`
              relative p-8 border rounded-sm cursor-pointer transition-all duration-300
              ${selectedPlan === "free" 
                ? "border-warm-500 bg-warm-50/50" 
                : "border-warm-200 hover:border-warm-300"
              }
            `}
          >
            <div className="mb-6">
              <h2 className="text-xl font-serif tracking-wider uppercase mb-2">
                Essentials
              </h2>
              <p className="text-3xl font-light text-warm-700">Free</p>
            </div>

            <p className="text-warm-600 mb-6">
              Get started with the three most essential planning templates 
              in our full interactive planner.
            </p>

            <div className="space-y-4 mb-8">
              {FREE_TEMPLATES.map((template) => (
                <div key={template.name} className="flex items-start gap-3">
                  <template.icon className="w-5 h-5 text-warm-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-warm-700">{template.name}</p>
                    <p className="text-sm text-warm-500">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-warm-500">
              <Sparkles className="w-4 h-4" />
              <span>Full interactive planner</span>
            </div>

            {selectedPlan === "free" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-warm-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Complete Plan */}
          <div
            onClick={handleSelectComplete}
            className={`
              relative p-8 border rounded-sm cursor-pointer transition-all duration-300
              ${selectedPlan === "complete" 
                ? "border-warm-600 bg-warm-50/50" 
                : "border-warm-200 hover:border-warm-300"
              }
            `}
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-warm-600 text-white text-xs tracking-widest uppercase">
                Most Popular
              </span>
            </div>

            <div className="mb-6 mt-2">
              <h2 className="text-xl font-serif tracking-wider uppercase mb-2">
                Complete
              </h2>
              <PriceDisplay />
            </div>

            <p className="text-warm-600 mb-6">
              The full Aisle experience. Unlimited templates, powerful tools, 
              and lifetime access to everything.
            </p>

            <div className="space-y-3 mb-8">
              {COMPLETE_BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-warm-500 flex-shrink-0" />
                  <span className="text-warm-700">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-warm-600 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Everything you need</span>
            </div>

            {selectedPlan === "complete" && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-warm-600 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
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
                {isLoading ? "Loading..." : "Continue with Essentials"}
              </Button>
            ) : (
              <Button
                onClick={handlePurchaseComplete}
                size="lg"
                disabled={isLoading}
                className="px-12 bg-warm-600 hover:bg-warm-700 text-white"
              >
                {isLoading ? "Loading..." : `Get Complete Access — ${finalPrice.toFixed(0)}`}
              </Button>
            )}

            <p className="mt-4 text-sm text-warm-500">
              {selectedPlan === "free" 
                ? "You can upgrade anytime" 
                : "Secure checkout powered by Stripe"
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
              <span>No subscriptions, ever</span>
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
