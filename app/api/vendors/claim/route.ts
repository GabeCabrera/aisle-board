import { NextRequest, NextResponse } from "next/server";
import { createClaimToken, getVendorClaimStatus } from "@/lib/data/vendor-claims";
import { sendEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { vendorProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.NEXTAUTH_URL || "https://scribeandstem.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@scribeandstem.com";

/**
 * POST /api/vendors/claim
 * Initiate a vendor claim request by sending verification email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, email } = body;

    if (!vendorId || !email) {
      return NextResponse.json(
        { error: "Vendor ID and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Get vendor info for email
    const vendor = await db.query.vendorProfiles.findFirst({
      where: eq(vendorProfiles.id, vendorId),
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Create claim token
    const result = await createClaimToken({ vendorId, email });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send verification email
    const verifyUrl = `${BASE_URL}/claim/verify?token=${result.token}`;

    const emailResult = await sendEmail({
      to: email,
      template: "vendor_claim_verification",
      data: {
        name: email, // Use email as name since we don't know their name yet
        vendorName: vendor.name,
        verifyUrl,
      },
    });

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error("Error initiating vendor claim:", error);
    return NextResponse.json(
      { error: "Failed to initiate claim" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vendors/claim?vendorId=xxx
 * Get claim status for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const status = await getVendorClaimStatus(vendorId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting claim status:", error);
    return NextResponse.json(
      { error: "Failed to get claim status" },
      { status: 500 }
    );
  }
}
