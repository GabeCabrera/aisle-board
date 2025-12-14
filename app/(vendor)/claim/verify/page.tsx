"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [vendorName, setVendorName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid verification link.");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch("/api/vendors/claim/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Verification failed.");
          return;
        }

        setStatus("success");
        setVendorName(data.claim?.vendor?.name || "your business");
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    };

    verifyToken();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h1 className="font-serif text-3xl text-foreground">Verifying...</h1>
        <p className="text-muted-foreground">Please wait while we verify your email.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="font-serif text-3xl text-foreground">Verification Failed</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">{errorMessage}</p>
        <div className="pt-4">
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-foreground">Email Verified!</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your claim for <strong>{vendorName}</strong> has been submitted for review.
        </p>
      </div>

      <div className="bg-muted/50 rounded-xl p-6 text-left max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">What happens next?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Our team will review your claim within 1-2 business days. Once approved,
              you&apos;ll receive an email with a link to complete your registration.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline">
          <Link href="/">Go to Home</Link>
        </Button>
        <Button asChild>
          <Link href="/planner/stem/vendors">Browse Vendors</Link>
        </Button>
      </div>
    </div>
  );
}

export default function VerifyClaimPage() {
  return (
    <main className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" href="/" />
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-soft border border-warm-100">
          <Suspense
            fallback={
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              </div>
            }
          >
            <VerifyContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
