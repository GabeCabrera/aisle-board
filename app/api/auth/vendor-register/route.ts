import { NextRequest, NextResponse } from "next/server";
import { getClaimByToken, completeVendorRegistration } from "@/lib/data/vendor-claims";
import { checkRateLimit } from "@/lib/validation";
import { z } from "zod";

// Validation schema for vendor registration
const vendorRegisterSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  displayName: z.string().max(100, "Display name too long").optional(),
});

/**
 * POST /api/auth/vendor-register
 * Complete vendor registration after claim approval
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (5 registration attempts per hour per IP)
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
    const result = vendorRegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { token, password, displayName } = result.data;

    // Verify the token is valid and approved
    const claim = await getClaimByToken(token);
    if (!claim) {
      return NextResponse.json(
        { error: "Invalid or expired registration link" },
        { status: 400 }
      );
    }

    if (claim.status !== "approved") {
      return NextResponse.json(
        { error: "This registration link is no longer valid" },
        { status: 400 }
      );
    }

    // Complete registration
    const registrationResult = await completeVendorRegistration({
      token,
      password,
      displayName,
    });

    if ("error" in registrationResult) {
      return NextResponse.json(
        { error: registrationResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now log in.",
      vendorId: registrationResult.vendorId,
    });
  } catch (error) {
    console.error("Vendor registration error:", error);
    return NextResponse.json(
      { error: "Failed to complete registration" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/vendor-register?token=xxx
 * Validate a registration token and return claim info
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const claim = await getClaimByToken(token);

    if (!claim) {
      return NextResponse.json(
        { error: "Invalid or expired registration link" },
        { status: 400 }
      );
    }

    if (claim.status !== "approved") {
      return NextResponse.json(
        { error: "This registration link is no longer valid" },
        { status: 400 }
      );
    }

    // Return limited info for the registration form
    return NextResponse.json({
      valid: true,
      email: claim.email,
      vendor: {
        name: claim.vendor.name,
        category: claim.vendor.category,
        city: claim.vendor.city,
        state: claim.vendor.state,
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate token" },
      { status: 500 }
    );
  }
}
