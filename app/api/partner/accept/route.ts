import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getPartnerInviteByToken,
  markPartnerInviteAccepted,
  getUserById,
  getTenantById,
  getUserByEmail,
} from "@/lib/db/queries";
import { nanoid } from "nanoid";
import logger from "@/lib/logger";

// GET - Validate token and return invite info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const invite = await getPartnerInviteByToken(token);

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired. Please ask your partner to send a new one." },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invite.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 410 }
      );
    }

    // Get inviter info
    const inviter = await getUserById(invite.invitedByUserId);
    const tenant = await getTenantById(invite.tenantId);

    return NextResponse.json({
      valid: true,
      email: invite.email,
      inviterName: inviter?.name || "Your partner",
      tenantName: tenant?.displayName || "your wedding",
    });
  } catch (error) {
    logger.error(
      "Partner invite validation error",
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Accept invitation and create user account
export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json();

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Token, name, and password are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const invite = await getPartnerInviteByToken(token);

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired. Please ask your partner to send a new one." },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invite.status === "accepted") {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 410 }
      );
    }

    // Double check email isn't already registered
    const existingUser = await getUserByEmail(invite.email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomUUID();
    const unsubscribeToken = nanoid(32);

    // Create user in the same tenant as inviter
    await db.insert(users).values({
      id: userId,
      tenantId: invite.tenantId,
      email: invite.email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      role: "owner", // Partners have full access
      mustChangePassword: false,
      emailOptIn: true,
      unsubscribeToken,
    });

    // Mark invite as accepted
    await markPartnerInviteAccepted(token);

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now sign in.",
    });
  } catch (error) {
    logger.error(
      "Partner accept error",
      error instanceof Error ? error : undefined
    );
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
