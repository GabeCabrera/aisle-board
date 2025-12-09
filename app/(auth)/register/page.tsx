"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as redditPixel from "@/lib/reddit-pixel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function RegisterForm() {
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
      redditPixel.trackSignUp();
      await signIn("google", { callbackUrl: "/welcome" });
    } catch {
      toast.error("Something went wrong with Google sign up.");
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
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      toast.success("Account created successfully!");
      redditPixel.trackSignUp();
      window.location.href = "/welcome";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">Create Account</h1>
        <p className="text-muted-foreground">Start planning your perfect wedding today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="name">
            Your Names
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Emma & James"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="emma@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading || isGoogleLoading}
          />
          <p className="text-xs text-muted-foreground">At least 8 characters</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <div className="flex items-center space-x-2 py-2">
          <input
            type="checkbox"
            id="emailOptIn"
            name="emailOptIn"
            checked={formData.emailOptIn}
            onChange={handleChange}
            disabled={isLoading || isGoogleLoading}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="emailOptIn" className="text-sm text-muted-foreground font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Send me helpful wedding planning tips and updates.
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full h-12 shadow-soft hover:shadow-lifted hover:-translate-y-0.5"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
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
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4 transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Editorial (Secondary Theme) */}
      <div className="hidden lg:flex w-1/2 bg-secondary relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 to-secondary" />
        
        <div className="relative z-10 max-w-lg text-white text-center space-y-6">
          <h2 className="font-serif text-5xl md:text-6xl leading-tight text-white">
            "A successful marriage requires falling in love many times, always with the same person."
          </h2>
          <p className="font-sans text-lg opacity-80 font-light tracking-wide uppercase">— Mignon McLaughlin</p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 relative overflow-y-auto">
        <Link 
          href="/" 
          className="absolute top-8 left-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group z-20"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md py-12"
        >
          <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <RegisterForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
