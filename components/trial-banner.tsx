"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrialStatus {
  plan: string;
  status: string;
  daysRemaining: number | null;
  isTrialing: boolean;
  needsUpgrade: boolean;
}

export function TrialBanner() {
  const [status, setStatus] = useState<TrialStatus | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem("trial-banner-dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }

    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setStatus(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("trial-banner-dismissed", "true");
  };

  // Don't show anything while loading or if dismissed
  if (isLoading || isDismissed) return null;

  // Don't show if no status data
  if (!status) return null;

  // Don't show for active subscriptions or free users who never had a trial
  if (status.status === "active" || status.status === "none") return null;

  // Trial ending soon (7 days or less)
  if (status.isTrialing && status.daysRemaining !== null && status.daysRemaining <= 7) {
    return (
      <div className={cn(
        "sticky top-0 z-50 w-full px-4 py-2 text-center text-sm",
        status.daysRemaining <= 3
          ? "bg-amber-100 text-amber-900 border-b border-amber-200"
          : "bg-blue-50 text-blue-900 border-b border-blue-100"
      )}>
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {status.daysRemaining === 0
              ? "Your trial ends today!"
              : status.daysRemaining === 1
                ? "Your trial ends tomorrow!"
                : `${status.daysRemaining} days left in your free trial`}
          </span>
          <Link href="/choose-plan">
            <Button
              size="sm"
              variant={status.daysRemaining <= 3 ? "default" : "outline"}
              className="h-7 text-xs ml-2"
            >
              Upgrade Now
            </Button>
          </Link>
          <button
            onClick={handleDismiss}
            className="ml-2 p-1 hover:bg-black/5 rounded"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Trial expired or past due
  if (status.needsUpgrade) {
    return (
      <div className="sticky top-0 z-50 w-full px-4 py-3 text-center bg-red-50 text-red-900 border-b border-red-200">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">
            {status.status === "past_due"
              ? "Payment failed. Please update your payment method."
              : "Your free trial has ended."}
          </span>
          <Link href="/choose-plan">
            <Button size="sm" className="h-7 text-xs ml-2">
              {status.status === "past_due" ? "Update Payment" : "Subscribe to Continue"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
