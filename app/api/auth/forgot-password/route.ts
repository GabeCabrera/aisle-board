import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, createPasswordResetToken } from "@/lib/db/queries";
import { generateResetToken } from "@/lib/utils";
import { checkRateLimit, authRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // Rate limit to prevent abuse
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = await checkRateLimit(
      `forgot-password:${identifier}`,
      authRateLimiter,
      5, // 5 attempts per minute (fallback)
      60000
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await createPasswordResetToken(user.id, token, expiresAt);

    // Send password reset email
    const baseUrl = process.env.NEXTAUTH_URL || "https://scribeandstem.com";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      template: "password_reset",
      data: {
        name: user.name || user.email.split("@")[0],
        resetUrl,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Forgot password error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
