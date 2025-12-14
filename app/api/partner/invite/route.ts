import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getUsersByTenantId,
  getUserByEmail,
  createPartnerInviteToken,
  getPendingPartnerInviteByTenant,
} from "@/lib/db/queries";
import { generateResetToken } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import logger from "@/lib/logger";

// GET - Check partner invite status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users in this tenant
    const users = await getUsersByTenantId(session.user.tenantId);

    // Check if there's already a partner (more than 1 user)
    const hasPartner = users.length > 1;
    const partner = hasPartner
      ? users.find((u) => u.id !== session.user.id)
      : null;

    // Check for pending invite
    const pendingInvite = await getPendingPartnerInviteByTenant(
      session.user.tenantId
    );

    return NextResponse.json({
      hasPartner,
      partner: partner
        ? {
            name: partner.name,
            email: partner.email,
          }
        : null,
      pendingInvite: pendingInvite
        ? {
            email: pendingInvite.email,
            createdAt: pendingInvite.createdAt,
            expiresAt: pendingInvite.expiresAt,
          }
        : null,
    });
  } catch (error) {
    logger.error(
      "Partner status check error",
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send partner invite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email is same as inviter
    if (email.toLowerCase() === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "You cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check if there's already a partner
    const users = await getUsersByTenantId(session.user.tenantId);
    if (users.length > 1) {
      return NextResponse.json(
        { error: "Your account already has a partner" },
        { status: 400 }
      );
    }

    // Check if email is already registered to another tenant
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "This email is already registered. They can join your account from their settings.",
        },
        { status: 400 }
      );
    }

    // Generate token and set expiry (7 days)
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create invite token
    await createPartnerInviteToken(
      session.user.tenantId,
      session.user.id,
      email,
      token,
      expiresAt
    );

    // Send invite email
    const baseUrl = process.env.NEXTAUTH_URL || "https://scribeandstem.com";
    const acceptUrl = `${baseUrl}/invite/accept?token=${token}`;

    await sendEmail({
      to: email,
      template: "partner_invite",
      data: {
        name: email.split("@")[0],
        inviterName: session.user.name || session.user.email || "Your partner",
        acceptUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    logger.error(
      "Partner invite error",
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
