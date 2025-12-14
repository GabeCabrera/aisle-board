"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormError } from "@/components/ui/form-error";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  // Real-time validation
  const validation = useMemo(() => {
    const minLength = password.length >= 8;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const isValid = minLength && passwordsMatch;
    return { minLength, passwordsMatch, isValid };
  }, [password, confirmPassword]);

  if (!token) {
    return (
      <Alert variant="destructive" className="rounded-xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid or expired password reset link. Please request a new one.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="font-serif text-2xl mb-2">Password Reset</CardTitle>
        <CardDescription className="text-base mb-6">
          Your password has been successfully reset.
        </CardDescription>
        <Button asChild className="rounded-full shadow-soft">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <CardHeader className="text-center pb-2">
        <CardTitle className="font-serif text-2xl">Set a New Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4 rounded-xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              required
              disabled={isLoading}
              className={cn(
                "rounded-xl h-11",
                touched.password && !validation.minLength && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {/* Password requirements indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              <div
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  password.length === 0
                    ? "text-muted-foreground"
                    : validation.minLength
                    ? "text-green-600"
                    : "text-destructive"
                )}
              >
                {validation.minLength ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className="h-3 w-3 rounded-full border border-current" />
                )}
                At least 8 characters
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
              required
              disabled={isLoading}
              className={cn(
                "rounded-xl h-11",
                touched.confirmPassword && confirmPassword && !validation.passwordsMatch && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <FormError
              message={
                touched.confirmPassword && confirmPassword && !validation.passwordsMatch
                  ? "Passwords do not match"
                  : null
              }
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full h-11 shadow-soft mt-2"
            disabled={isLoading || !validation.isValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Link
        href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Link>

      <Card className="w-full max-w-md rounded-3xl shadow-lifted border-border">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </div>
  );
}
