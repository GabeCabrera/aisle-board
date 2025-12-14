import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getClaimById,
  approveClaimRequest,
  rejectClaimRequest,
} from "@/lib/data/vendor-claims";
import { sendEmail } from "@/lib/email";

const BASE_URL = process.env.NEXTAUTH_URL || "https://scribeandstem.com";

/**
 * GET /api/admin/vendors/claims/[claimId]
 * Get a specific claim by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email?.endsWith("@aisle.wedding")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId } = await params;
    const claim = await getClaimById(claimId);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Error fetching claim:", error);
    return NextResponse.json(
      { error: "Failed to fetch claim" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/vendors/claims/[claimId]
 * Approve or reject a claim
 *
 * Body:
 * - action: "approve" | "reject"
 * - notes: optional admin notes
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email?.endsWith("@aisle.wedding") || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId } = await params;
    const body = await request.json();
    const { action, notes } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the claim for email details
    const claim = await getClaimById(claimId);
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (action === "approve") {
      const result = await approveClaimRequest(claimId, session.user.id, notes);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Send approval email with registration link
      const registrationUrl = `${BASE_URL}/claim/register?token=${result.registrationToken}`;

      try {
        await sendEmail({
          to: claim.email,
          template: "vendor_claim_approved",
          data: {
            name: claim.email,
            vendorName: claim.vendor.name,
            registrationUrl,
          },
        });
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the request, claim is already approved
      }

      return NextResponse.json({
        success: true,
        message: "Claim approved. Registration email sent.",
        registrationToken: result.registrationToken,
      });
    } else {
      // Reject
      const result = await rejectClaimRequest(claimId, session.user.id, notes);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Send rejection email
      try {
        await sendEmail({
          to: claim.email,
          template: "vendor_claim_rejected",
          data: {
            name: claim.email,
            vendorName: claim.vendor.name,
            adminNotes: notes,
          },
        });
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      return NextResponse.json({
        success: true,
        message: "Claim rejected. Notification email sent.",
      });
    }
  } catch (error) {
    console.error("Error updating claim:", error);
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
}
