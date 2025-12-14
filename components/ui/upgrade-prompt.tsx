"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type PromptVariant = "discovery" | "limit" | "reminder";

interface UpgradePromptProps {
  /** Type of prompt to show */
  variant: PromptVariant;
  /** Feature name that triggered this prompt */
  featureName: string;
  /** Description of the feature */
  description?: string;
  /** Whether the prompt is open (for dialog variant) */
  open?: boolean;
  /** Callback when closed */
  onClose?: () => void;
  /** Which plan is required */
  requiredPlan?: "stem" | "stemPlus";
  /** For limit variant: current usage */
  currentUsage?: number;
  /** For limit variant: limit amount */
  limit?: number;
  /** For limit variant: when it resets (optional) */
  resetsAt?: string;
}

/**
 * Discovery prompt - shown when user first clicks on a premium feature
 * "You've discovered Seating Charts - a Stem feature!"
 */
function DiscoveryPrompt({
  featureName,
  description,
  requiredPlan = "stem",
  onClose,
  onUpgrade,
}: {
  featureName: string;
  description?: string;
  requiredPlan?: "stem" | "stemPlus";
  onClose?: () => void;
  onUpgrade: () => void;
}) {
  const planName = requiredPlan === "stemPlus" ? "Stem+" : "Stem";

  return (
    <div className="text-center py-2">
      <div className="inline-flex items-center gap-2 text-primary font-medium mb-4">
        <Sparkles className="h-5 w-5" />
        You've discovered a {planName} feature!
      </div>

      <h3 className="font-serif text-2xl text-foreground mb-2">{featureName}</h3>

      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onUpgrade} className="rounded-full">
          Upgrade to {planName}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="ghost" onClick={onClose} className="rounded-full">
          Maybe Later
        </Button>
      </div>
    </div>
  );
}

/**
 * Limit prompt - shown when user hits their usage limit
 * "You've used your 5 AI messages for today"
 */
function LimitPrompt({
  featureName,
  currentUsage,
  limit,
  resetsAt,
  requiredPlan = "stem",
  onClose,
  onUpgrade,
}: {
  featureName: string;
  currentUsage?: number;
  limit?: number;
  resetsAt?: string;
  requiredPlan?: "stem" | "stemPlus";
  onClose?: () => void;
  onUpgrade: () => void;
}) {
  const planName = requiredPlan === "stemPlus" ? "Stem+" : "Stem";
  const planPrice = requiredPlan === "stemPlus" ? "$25/mo" : "$12/mo";

  return (
    <div className="text-center py-2">
      <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
        <Clock className="h-7 w-7 text-amber-600" />
      </div>

      <h3 className="font-serif text-2xl text-foreground mb-2">
        {limit !== undefined
          ? `You've reached your ${featureName} limit`
          : `${featureName} limit reached`}
      </h3>

      {limit !== undefined && currentUsage !== undefined && (
        <p className="text-muted-foreground mb-2">
          {currentUsage} of {limit} used today
        </p>
      )}

      {resetsAt && (
        <p className="text-sm text-muted-foreground mb-6">
          Resets {resetsAt}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onUpgrade} className="rounded-full">
          Upgrade to {planName} — {planPrice}
        </Button>
        <Button variant="ghost" onClick={onClose} className="rounded-full">
          I'll Wait
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Upgrade for unlimited access
      </p>
    </div>
  );
}

/**
 * Reminder prompt - non-blocking tip about premium features
 * "Tip: Stem members can sync their timeline with Google Calendar"
 */
export function UpgradeReminder({
  featureName,
  description,
  onLearnMore,
  onDismiss,
  className,
}: {
  featureName: string;
  description: string;
  onLearnMore?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        "relative bg-primary/5 border border-primary/20 rounded-xl p-4 pr-10",
        className
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-primary/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium mb-1">
            Tip: {description}
          </p>
          {onLearnMore && (
            <button
              onClick={onLearnMore}
              className="text-sm text-primary hover:underline font-medium"
            >
              Learn More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main upgrade prompt dialog component
 */
export function UpgradePrompt({
  variant,
  featureName,
  description,
  open = false,
  onClose,
  requiredPlan = "stem",
  currentUsage,
  limit,
  resetsAt,
}: UpgradePromptProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose?.();
    router.push("/choose-plan");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade to access {featureName}</DialogTitle>
          <DialogDescription>
            {description || `Unlock ${featureName} with a Stem subscription`}
          </DialogDescription>
        </DialogHeader>

        {variant === "discovery" && (
          <DiscoveryPrompt
            featureName={featureName}
            description={description}
            requiredPlan={requiredPlan}
            onClose={onClose}
            onUpgrade={handleUpgrade}
          />
        )}

        {variant === "limit" && (
          <LimitPrompt
            featureName={featureName}
            currentUsage={currentUsage}
            limit={limit}
            resetsAt={resetsAt}
            requiredPlan={requiredPlan}
            onClose={onClose}
            onUpgrade={handleUpgrade}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Usage indicator for showing remaining messages/capacity
 */
export function UsageIndicator({
  current,
  limit,
  label,
  className,
}: {
  current: number;
  limit: number | "unlimited";
  label: string;
  className?: string;
}) {
  if (limit === "unlimited") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Unlimited {label}</span>
      </div>
    );
  }

  const remaining = Math.max(0, limit - current);
  const percentage = (current / limit) * 100;
  const isLow = remaining <= 2;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isLow ? "text-amber-600" : "text-foreground")}>
          {remaining} left
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isLow ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}
