"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PlannerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Planner error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-6 max-w-md">
        <h2 className="font-serif text-2xl font-medium text-foreground">
          Unable to load planner
        </h2>
        <p className="text-muted-foreground">
          There was a problem loading this page. Your data is safe.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => router.push("/planner")} variant="outline">
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
