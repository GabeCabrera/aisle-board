"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormError } from "@/components/ui/form-error";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const VENDOR_CATEGORIES = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "florist", label: "Florist" },
  { value: "dj", label: "DJ" },
  { value: "band", label: "Band/Musician" },
  { value: "cake", label: "Cake/Bakery" },
  { value: "planner", label: "Wedding Planner" },
  { value: "officiant", label: "Officiant" },
  { value: "hair", label: "Hair Stylist" },
  { value: "makeup", label: "Makeup Artist" },
  { value: "dress", label: "Bridal/Dress Shop" },
  { value: "suits", label: "Suits/Formalwear" },
  { value: "jewelry", label: "Jewelry" },
  { value: "stationery", label: "Stationery/Invitations" },
  { value: "rentals", label: "Rentals" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

export default function VendorSignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [touched, setTouched] = useState({
    businessName: false,
    category: false,
    city: false,
    state: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Validation
  const validation = useMemo(() => {
    const businessNameValid = businessName.trim().length >= 2;
    const categoryValid = category.length > 0;
    const cityValid = city.trim().length > 0;
    const stateValid = state.length > 0;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordValid = password.length >= 8;
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    const isValid =
      businessNameValid &&
      categoryValid &&
      cityValid &&
      stateValid &&
      emailValid &&
      passwordValid &&
      passwordsMatch;

    return {
      businessNameValid,
      categoryValid,
      cityValid,
      stateValid,
      emailValid,
      passwordValid,
      passwordsMatch,
      isValid,
    };
  }, [businessName, category, city, state, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/vendor-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          category,
          city: city.trim(),
          state,
          email: email.toLowerCase().trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Sign in the new user
      const signInResult = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Account created but sign in failed - redirect to login
        toast.success("Account created! Please sign in.");
        router.push("/login");
        return;
      }

      toast.success("Welcome to Stem!");
      router.push("/vendor/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <Card className="w-full max-w-lg rounded-3xl shadow-lifted border-border">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl">Create Your Vendor Account</CardTitle>
          <CardDescription>
            Join Stem to showcase your services and connect with engaged couples.
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
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, businessName: true }))}
                required
                disabled={isLoading}
                className={cn(
                  "rounded-xl h-11",
                  touched.businessName &&
                    !validation.businessNameValid &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <FormError
                message={
                  touched.businessName && !validation.businessNameValid
                    ? "Business name must be at least 2 characters"
                    : null
                }
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setTouched((t) => ({ ...t, category: true }));
                }}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="category"
                  className={cn(
                    "rounded-xl h-11",
                    touched.category &&
                      !validation.categoryValid &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                >
                  <SelectValue placeholder="Select your category" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError
                message={
                  touched.category && !validation.categoryValid
                    ? "Please select a category"
                    : null
                }
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                  required
                  disabled={isLoading}
                  className={cn(
                    "rounded-xl h-11",
                    touched.city &&
                      !validation.cityValid &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={state}
                  onValueChange={(value) => {
                    setState(value);
                    setTouched((t) => ({ ...t, state: true }));
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    id="state"
                    className={cn(
                      "rounded-xl h-11",
                      touched.state &&
                        !validation.stateValid &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                  >
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                required
                disabled={isLoading}
                className={cn(
                  "rounded-xl h-11",
                  touched.email &&
                    !validation.emailValid &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <FormError
                message={
                  touched.email && !validation.emailValid
                    ? "Please enter a valid email address"
                    : null
                }
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
                  touched.password &&
                    !validation.passwordValid &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <div className="flex items-center gap-1.5 text-xs">
                <div
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    password.length === 0
                      ? "text-muted-foreground"
                      : validation.passwordValid
                      ? "text-green-600"
                      : "text-destructive"
                  )}
                >
                  {validation.passwordValid ? (
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
                  touched.confirmPassword &&
                    confirmPassword &&
                    !validation.passwordsMatch &&
                    "border-destructive focus-visible:ring-destructive"
                )}
              />
              <FormError
                message={
                  touched.confirmPassword &&
                  confirmPassword &&
                  !validation.passwordsMatch
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
                "Create Vendor Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="mt-2">
              Planning a wedding?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Create a couple account
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
