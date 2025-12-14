import { NextRequest, NextResponse } from "next/server";
import { verifyClaimToken } from "@/lib/data/vendor-claims";
import { sendEmail } from "@/lib/email";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "hello@scribeandstem.com";

/**
 * POST /api/vendors/claim/verify
 * Verify a claim token (email verification step)
 * After verification, notifies admin for review
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Verify the token
    const result = await verifyClaimToken(token);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Notify admin of new verified claim
    try {
      await sendEmail({
        to: ADMIN_EMAIL,
        template: "admin_claim_notification",
        data: {
          name: "Admin",
          vendorName: result.claim.vendor.name,
          claimEmail: result.claim.email,
        },
      });
    } catch (emailError) {
      // Log but don't fail the request if admin notification fails
      console.error("Failed to send admin notification:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully. Your claim is now pending admin review.",
      claim: {
        id: result.claim.id,
        status: result.claim.status,
        vendor: result.claim.vendor,
      },
    });
  } catch (error) {
    console.error("Error verifying claim token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
