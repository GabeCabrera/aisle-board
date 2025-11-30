"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
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
      });

      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        toast.success("Signed in successfully!");
        window.location.href = callbackUrl;
      } else {
        toast.error("Something went wrong");
        setIsLoading(false);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-2">
            Aisle
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-warm-500">
            Welcome Back
          </p>
          <div className="w-12 h-px bg-warm-400 mx-auto mt-6" />
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 text-center space-y-3">
          <p className="text-xs tracking-wider text-warm-500">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="uppercase text-warm-600 hover:text-warm-700 transition-colors underline"
            >
              Create one
            </Link>
          </p>
          <Link
            href="/forgot-password"
            className="block text-xs tracking-wider uppercase text-warm-500 hover:text-warm-600 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>
      </div>
    </main>
  );
}
