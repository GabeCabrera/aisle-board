"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as redditPixel from "@/lib/reddit-pixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    emailOptIn: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    console.log("[REGISTER] Attempting registration for:", formData.email);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("[REGISTER] API Response:", response.status, data);

      if (!response.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      console.log("[REGISTER] Registration successful. Attempting auto-login...");
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("[REGISTER] Auto-login result:", signInResult);

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      toast.success("Account created successfully!");
      redditPixel.trackSignUp();
      router.push("/welcome");
    } catch (error) {
      console.error("[REGISTER] Error:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in-up">
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center space-x-2 py-2">
          <input
            type="checkbox"
            id="emailOptIn"
            name="emailOptIn"
            checked={formData.emailOptIn}
            onChange={handleChange}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="emailOptIn" className="text-sm text-muted-foreground font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Send me helpful wedding planning tips and updates.
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 shadow-soft hover:shadow-lifted hover:-translate-y-0.5"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4 transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
}
