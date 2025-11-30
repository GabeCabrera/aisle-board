"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as redditPixel from "@/lib/reddit-pixel";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        router.push("/choose-plan");
        return;
      }

      try {
        // Verify the payment was successful
        const response = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setVerified(true);
          
          // Track purchase conversion
          // $29 is the Complete plan price
          redditPixel.trackPurchase(29, "USD", 1);
        } else {
          router.push("/choose-plan");
        }
      } catch (error) {
        console.error("Verification error:", error);
        router.push("/choose-plan");
      } finally {
        setIsVerifying(false);
      }
    };

    // Small delay to allow webhook to process
    const timer = setTimeout(verifyPayment, 1500);
    return () => clearTimeout(timer);
  }, [sessionId, router]);

  const handleContinue = () => {
    router.push("/welcome");
  };

  if (isVerifying) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin mx-auto mb-8" />
          <p className="text-warm-600 tracking-wider uppercase text-sm">
            Confirming your purchase...
          </p>
        </div>
      </main>
    );
  }

  if (!verified) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <p className="text-warm-600">
            Something went wrong. Please contact support.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/choose-plan")}
          >
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Success animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-warm-100 mx-auto flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-warm-500 flex items-center justify-center animate-in zoom-in duration-500">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
          <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-warm-400 animate-pulse" />
          <Sparkles className="absolute bottom-0 left-1/4 w-4 h-4 text-warm-300 animate-pulse delay-150" />
        </div>

        <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
        
        <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-4">
          Welcome to Aisle
        </h1>
        
        <p className="text-warm-600 mb-2">
          Your purchase is complete.
        </p>
        <p className="text-warm-500 text-sm mb-8">
          You now have lifetime access to the complete wedding planner.
        </p>

        <div className="w-12 h-px bg-warm-400 mx-auto mb-8" />

        <Button
          onClick={handleContinue}
          className="bg-warm-600 hover:bg-warm-700 text-white px-12"
          size="lg"
        >
          Begin Planning
        </Button>

        <p className="mt-6 text-xs text-warm-400">
          A receipt has been sent to your email
        </p>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin" />
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
