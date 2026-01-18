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
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/planner";
  const error = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error("Invalid email or password.");
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
          className="w-full h-12 shadow-soft hover:shadow-lifted hover:-translate-y-0.5"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
        </Button>
      </form>

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
