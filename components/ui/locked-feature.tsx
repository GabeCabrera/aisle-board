"use client";

import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LockedFeatureProps {
  /** Whether the feature is locked */
  isLocked: boolean;
  /** Feature name for display */
  featureName: string;
  /** Description of what the feature does */
  description: string;
  /** Which plan unlocks this feature */
  requiredPlan?: "stem" | "stemPlus";
  /** Callback when upgrade button is clicked */
  onUpgrade?: () => void;
  /** The content to render (will be overlayed when locked) */
  children: ReactNode;
  /** Additional class names for the container */
  className?: string;
  /** Whether to show a preview of the content (greyed out) or completely block it */
  showPreview?: boolean;
}

export function LockedFeature({
  isLocked,
  featureName,
  description,
  requiredPlan = "stem",
  onUpgrade,
  children,
  className,
  showPreview = true,
}: LockedFeatureProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  const planName = requiredPlan === "stemPlus" ? "Stem+" : "Stem";
  const planPrice = requiredPlan === "stemPlus" ? "$25/mo" : "$12/mo";

  return (
    <div className={cn("relative", className)}>
      {/* Greyed out preview of the content */}
      {showPreview && (
        <div className="pointer-events-none select-none opacity-30 blur-[2px] saturate-0">
          {children}
        </div>
      )}

      {/* Overlay with upgrade prompt */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10",
          !showPreview && "relative min-h-[300px]"
        )}
      >
        <div className="text-center max-w-sm mx-auto p-8">
          {/* Lock icon with gradient background */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-soft">
            <Lock className="h-7 w-7 text-primary" />
          </div>

          {/* Feature name */}
          <h3 className="font-serif text-2xl text-foreground mb-2">
            {featureName}
          </h3>

          {/* Description */}
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {description}
          </p>

          {/* Plan badge */}
          <div className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-6 bg-primary/10 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            {planName} Feature
          </div>

          {/* Upgrade button */}
          <div className="space-y-3">
            <Button
              onClick={onUpgrade}
              className="w-full rounded-full shadow-soft"
              size="lg"
            >
              Upgrade to {planName} — {planPrice}
            </Button>
            <p className="text-xs text-muted-foreground">
              Cancel anytime • Instant access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * A simpler inline locked badge for smaller UI elements
 */
export function LockedBadge({
  requiredPlan = "stem",
  onClick,
}: {
  requiredPlan?: "stem" | "stemPlus";
  onClick?: () => void;
}) {
  const planName = requiredPlan === "stemPlus" ? "Stem+" : "Stem";

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full transition-colors"
    >
      <Lock className="h-3 w-3" />
      {planName}
    </button>
  );
}
