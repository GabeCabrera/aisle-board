import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getAuthUrl } from "@/lib/calendar/google-client";

export const dynamic = "force-dynamic";

// GET /api/calendar/google/connect - Initiate OAuth flow
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Google OAuth is configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing Google OAuth config:", {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
      });
      return NextResponse.json(
        { error: "Google Calendar is not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Create state with tenant ID for verification in callback
    const state = Buffer.from(
      JSON.stringify({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        timestamp: Date.now(),
      })
    ).toString("base64");

    const authUrl = getAuthUrl(state);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google connection", details: String(error) },
      { status: 500 }
    );
  }
}
