"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as redditPixel from "@/lib/reddit-pixel";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    emailOptIn: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Track sign up conversion for Google sign ups
      redditPixel.trackSignUp();
      await signIn("google", { callbackUrl: "/choose-plan" });
    } catch {
      toast.error("Something went wrong with Google sign up");
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          emailOptIn: formData.emailOptIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      toast.success("Account created!");
      redditPixel.trackSignUp();
      window.location.href = "/choose-plan";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-2">
            Aisle
          </h1>
          <p className="text-xs tracking-[0.25em] uppercase text-warm-500">
            Create Your Account
          </p>
          <div className="w-12 h-px bg-warm-400 mx-auto mt-6" />
        </div>

        {/* Google Sign Up Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-3 py-5 border-warm-300 hover:bg-warm-50 mb-6"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
        >
          <GoogleIcon />
          <span>{isGoogleLoading ? "Signing up..." : "Sign up with Google"}</span>
        </Button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-warm-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-warm-400 tracking-wider">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Your Names</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your names (e.g., Emma & James)"
              required
              disabled={isLoading || isGoogleLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={isLoading || isGoogleLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading || isGoogleLoading}
            />
            <p className="text-xs text-warm-500">At least 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={isLoading || isGoogleLoading}
            />
          </div>

          <div className="flex items-start gap-3 pt-2">
            <input
              type="checkbox"
              id="emailOptIn"
              name="emailOptIn"
              checked={formData.emailOptIn}
              onChange={handleChange}
              disabled={isLoading || isGoogleLoading}
              className="mt-1 h-4 w-4 rounded border-warm-300 text-warm-600 focus:ring-warm-500"
            />
            <label htmlFor="emailOptIn" className="text-sm text-warm-600 leading-relaxed">
              Send me helpful wedding planning tips and updates. You can unsubscribe anytime.
            </label>
          </div>

          <Button
            type="submit"
            className="w-full mt-8 bg-warm-600 hover:bg-warm-700 text-white"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account with Email"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs tracking-wider text-warm-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="uppercase text-warm-600 hover:text-warm-700 transition-colors underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
