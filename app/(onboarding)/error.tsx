"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Onboarding error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-center space-y-6 max-w-md">
        <h2 className="font-serif text-2xl font-medium text-foreground">
          Something went wrong
        </h2>
        <p className="text-muted-foreground">
          We hit a snag during setup. Let&apos;s try that again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => router.push("/login")} variant="outline">
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
