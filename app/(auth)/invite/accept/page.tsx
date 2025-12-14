"use client";

import { useState, Suspense, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormError } from "@/components/ui/form-error";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Check, Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InviteInfo {
  valid: boolean;
  email: string;
  inviterName: string;
  tenantName: string;
}

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, password: false, confirmPassword: false });

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidationError("No invitation token provided");
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/partner/accept?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setValidationError(data.error || "Invalid invitation");
          setIsValidating(false);
          return;
        }

        setInviteInfo(data);
        setIsValidating(false);
      } catch {
        setValidationError("Failed to validate invitation");
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  // Real-time validation
  const validation = useMemo(() => {
    const nameValid = name.trim().length >= 2;
    const minLength = password.length >= 8;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const isValid = nameValid && minLength && passwordsMatch;
    return { nameValid, minLength, passwordsMatch, isValid };
  }, [name, password, confirmPassword]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Validating invitation...</p>
      </div>
    );
  }

  // Show error if validation failed
  if (validationError || !inviteInfo) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationError || "Invalid invitation link. Please ask your partner to send a new invitation."}
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/partner/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4 px-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="font-serif text-2xl mb-2">You're All Set!</CardTitle>
        <CardDescription className="text-base mb-6">
          Your account has been created. You can now sign in and start planning together with {inviteInfo.inviterName}.
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
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="font-serif text-2xl">Join {inviteInfo.inviterName}</CardTitle>
        <CardDescription>
          Create your account to start planning {inviteInfo.tenantName} together.
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
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={inviteInfo.email}
              disabled
              className="rounded-xl h-11 bg-muted"
            />
            <p className="text-xs text-muted-foreground">This is the email your invitation was sent to</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              required
              disabled={isLoading}
              className={cn(
                "rounded-xl h-11",
                touched.name && !validation.nameValid && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <FormError
              message={touched.name && !validation.nameValid ? "Name must be at least 2 characters" : null}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
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
                Creating Account...
              </>
            ) : (
              "Create Account & Join"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <Card className="w-full max-w-md rounded-3xl shadow-lifted border-border">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <AcceptInviteForm />
        </Suspense>
      </Card>
    </div>
  );
}
