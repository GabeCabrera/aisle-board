import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { tenants, users, vendorProfiles } from "@/lib/db/schema";
import { getUserByEmail } from "@/lib/db/queries";
import { nanoid } from "nanoid";
import { checkRateLimit, sanitizeString } from "@/lib/validation";
import { z } from "zod";

const vendorSignupSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters").max(100),
  category: z.string().min(1, "Category is required"),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Vendor categories
const VALID_CATEGORIES = [
  "photographer",
  "videographer",
  "venue",
  "catering",
  "florist",
  "dj",
  "band",
  "cake",
  "planner",
  "officiant",
  "hair",
  "makeup",
  "dress",
  "suits",
  "jewelry",
  "stationery",
  "rentals",
  "transportation",
  "other",
];

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (5 registrations per hour per IP)
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimitKey = `vendor-register:${ip}`;
    const { allowed } = checkRateLimit(rateLimitKey, 5, 3600000);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate input
    const result = vendorSignupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { businessName, category, city, state, email, password } = result.data;

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid vendor category" },
        { status: 400 }
      );
    }

    // Sanitize
    const sanitizedName = sanitizeString(businessName);
    const sanitizedCity = sanitizeString(city);
    const sanitizedState = sanitizeString(state);
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate unique slugs
    const baseSlug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const tenantSlug = `vendor-${baseSlug}-${nanoid(6)}`;
    const vendorSlug = `${baseSlug}-${nanoid(6)}`;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate IDs
    const tenantId = randomUUID();
    const userId = randomUUID();
    const vendorProfileId = randomUUID();
    const unsubscribeToken = nanoid(32);

    // Create tenant with accountType: "vendor"
    await db.insert(tenants).values({
      id: tenantId,
      slug: tenantSlug,
      displayName: sanitizedName,
      plan: "free",
      accountType: "vendor",
      onboardingComplete: false,
    });

    // Create user
    await db.insert(users).values({
      id: userId,
      tenantId,
      email: normalizedEmail,
      name: sanitizedName,
      passwordHash,
      role: "owner",
      mustChangePassword: false,
      emailOptIn: true,
      unsubscribeToken,
    });

    // Create vendor profile
    await db.insert(vendorProfiles).values({
      id: vendorProfileId,
      name: sanitizedName,
      slug: vendorSlug,
      category,
      city: sanitizedCity,
      state: sanitizedState,
      email: normalizedEmail,
      claimedByTenantId: tenantId,
      claimStatus: "claimed",
      profileCompleteness: 20, // Basic info filled
    });

    return NextResponse.json({
      success: true,
      message: "Vendor account created successfully",
    });
  } catch (error) {
    console.error("Vendor registration error:", error);
    return NextResponse.json(
      { error: "Failed to create vendor account" },
      { status: 500 }
    );
  }
}
