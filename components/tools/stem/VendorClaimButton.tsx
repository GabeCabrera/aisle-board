"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VendorClaimButtonProps {
  vendorId: string;
  vendorName: string;
  claimStatus?: "unclaimed" | "pending" | "verified" | "claimed";
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

type ClaimStep = "form" | "success";

export function VendorClaimButton({
  vendorId,
  vendorName,
  claimStatus = "unclaimed",
  size = "default",
  variant = "outline",
  className,
}: VendorClaimButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ClaimStep>("form");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Don't render if vendor is already claimed
  if (claimStatus === "claimed") {
    return null;
  }

  // Show pending status
  if (claimStatus === "pending" || claimStatus === "verified") {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        className={cn("text-muted-foreground cursor-not-allowed", className)}
      >
        <Mail className="h-4 w-4 mr-2" />
        Claim Pending
      </Button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/vendors/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit claim");
        return;
      }

      // Success - show confirmation
      setStep("success");
      toast.success("Verification email sent!");
    } catch (error) {
      console.error("Error submitting claim:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state when closing
      setTimeout(() => {
        setStep("form");
        setEmail("");
      }, 200);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Building2 className="h-4 w-4 mr-2" />
          Claim this business
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Claim {vendorName}</DialogTitle>
              <DialogDescription>
                Enter your business email to verify ownership. We&apos;ll send you a
                verification link to confirm your claim.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="claim-email">Business Email</Label>
                  <Input
                    id="claim-email"
                    type="email"
                    placeholder="you@yourbusiness.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    For verification, please use an email associated with this business
                    (e.g., your business domain email).
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Verification
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <DialogTitle className="text-center">Check Your Email</DialogTitle>
              <DialogDescription className="text-center">
                We&apos;ve sent a verification link to <strong>{email}</strong>. Click the
                link to verify your email and continue the claim process.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">What happens next?</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click the verification link in your email</li>
                  <li>Our team will review your claim (1-2 business days)</li>
                  <li>Once approved, you&apos;ll receive a link to create your account</li>
                </ol>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Got it
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
