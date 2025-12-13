"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Check, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import * as redditPixel from "@/lib/reddit-pixel";
import { Suspense } from "react";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    
    if (!sessionId) {
      setError("No session ID found");
      setIsVerifying(false);
      return;
    }

    // Verify the session and mark onboarding complete
    const verifyAndComplete = async () => {
      try {
        // Verify the Stripe session - webhook handles plan updates, we just confirm success
        const verifyRes = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.success) {
          throw new Error(verifyData.error || "Failed to verify payment");
        }

        // Mark onboarding complete
        await fetch("/api/settings/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ onboardingComplete: true }),
        });

        // Track subscription
        redditPixel.trackPurchase(12); // Track monthly value

        setIsVerifying(false);
      } catch (err) {
        // Don't log to console in production - error is shown to user
        setError("Failed to verify subscription. Please contact support if this persists.");
        setIsVerifying(false);
      }
    };

    verifyAndComplete();
  }, [searchParams]);

  const handleContinue = () => {
    router.push("/welcome");
  };

  if (isVerifying) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-warm-300 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-warm-600">Setting up your account...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-serif text-warm-800 mb-2">Something went wrong</h1>
          <p className="text-warm-600 mb-6">{error}</p>
          <Button onClick={() => router.push("/choose-plan")} variant="outline">
            Back to plans
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-8">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center mx-auto mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-serif font-light tracking-wide text-warm-800 mb-3">
          Welcome to Stem
        </h1>
        <p className="text-warm-600 mb-8 leading-relaxed">
          Your subscription is active! You now have unlimited access to your AI wedding planner 
          and all premium planning templates.
        </p>

        {/* Features unlocked */}
        <div className="bg-warm-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-medium text-warm-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-400" />
            What&apos;s now available
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-warm-700">Unlimited AI planner conversations</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-warm-700">All 10+ planning templates</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-warm-700">Vibe discovery & matching</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-warm-700">Seating chart builder</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-warm-700">Export to PDF anytime</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button 
          onClick={handleContinue} 
          size="lg"
          className="px-8 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
        >
          Start Planning
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-warm-400 mt-6">
          You can manage your subscription in Settings anytime
        </p>
      </div>
    </main>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin" />
      </main>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
