"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ClaimInfo {
  email: string;
  vendor: {
    name: string;
    category: string;
    city: string | null;
    state: string | null;
  };
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "form" | "success" | "error">("loading");
  const [claimInfo, setClaimInfo] = useState<ClaimInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid registration link.");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/vendor-register?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Invalid or expired registration link.");
          return;
        }

        setClaimInfo(data);
        setFormData((prev) => ({
          ...prev,
          displayName: data.vendor.name,
        }));
        setStatus("form");
      } catch (error) {
        console.error("Token validation error:", error);
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/vendor-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
          displayName: formData.displayName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      setStatus("success");
      toast.success("Account created successfully!");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h1 className="font-serif text-3xl text-foreground">Loading...</h1>
        <p className="text-muted-foreground">Validating your registration link.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="font-serif text-3xl text-foreground">Registration Failed</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">{errorMessage}</p>
        <div className="pt-4">
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-3xl text-foreground">Welcome to Stem!</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your vendor account has been created. You can now sign in and manage your profile.
          </p>
        </div>
        <div className="pt-4">
          <Button asChild size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl text-foreground">Complete Registration</h1>
        <p className="text-muted-foreground">
          Create your account for{" "}
          <strong>{claimInfo?.vendor.name}</strong>
        </p>
      </div>

      {claimInfo && (
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Email:</span> {claimInfo.email}
          </p>
          {claimInfo.vendor.city && claimInfo.vendor.state && (
            <p className="text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Location:</span>{" "}
              {claimInfo.vendor.city}, {claimInfo.vendor.state}
            </p>
          )}
          <p className="text-muted-foreground mt-1">
            <span className="font-medium text-foreground">Category:</span>{" "}
            <span className="capitalize">{claimInfo.vendor.category}</span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Your business name"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground">
            This will be shown on your profile.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isSubmitting}
              required
              minLength={8}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            disabled={isSubmitting}
            required
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

export default function VendorRegisterPage() {
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
            <RegisterContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
