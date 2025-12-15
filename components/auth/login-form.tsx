"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize useRouter
  const callbackUrl = searchParams.get("callbackUrl") || "/planner";
  const error = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("[LOGIN] Attempting login for:", email);
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      console.log("[LOGIN] Result:", result);

      if (result?.error) {
        console.error("[LOGIN] Error:", result.error);
        toast.error("Invalid email or password.");
      } else if (result?.ok) {
        console.log("[LOGIN] Success. Redirecting to:", callbackUrl);
        router.push(callbackUrl); // Use router.push for navigation
      }
    } catch (e) {
      console.error("[LOGIN] Exception:", e);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      toast.error("Something went wrong with Google sign in.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in-up">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">Enter your details to access your planner.</p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-100">
          {error === "CredentialsSignin" ? "Invalid email or password." : "An error occurred during sign in."}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
              Password
            </label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full h-12 shadow-soft hover:shadow-lifted hover:-translate-y-0.5"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={isLoading || isGoogleLoading}
        className="w-full h-12"
      >
        {isGoogleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
        )}
        Google
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline underline-offset-4 transition-colors">
          Create one
        </Link>
      </div>

      <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
        Are you a wedding vendor?{" "}
        <Link href="/vendor/signup" className="text-primary font-medium hover:underline underline-offset-4 transition-colors">
          List your business
        </Link>
      </div>
    </div>
  );
}
