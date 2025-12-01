import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getAuthUrl } from "@/lib/calendar/google-client";

export const dynamic = "force-dynamic";

// GET /api/calendar/google/connect - Initiate OAuth flow
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check session exists
    if (!session?.user) {
      console.error("Google connect: No session found");
      return NextResponse.json(
        { error: "Please log in to connect Google Calendar" },
        { status: 401 }
      );
    }

    // Check tenantId exists
    if (!session.user.tenantId) {
      console.error("Google connect: Session missing tenantId", {
        userId: session.user.id,
        email: session.user.email,
      });
      return NextResponse.json(
        { error: "Account setup incomplete. Please complete onboarding first." },
        { status: 401 }
      );
    }

    // Check if Google OAuth is configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Google connect: Missing OAuth config", {
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

    let authUrl: string;
    try {
      authUrl = getAuthUrl(state);
    } catch (authError) {
      console.error("Google connect: Failed to generate auth URL", authError);
      return NextResponse.json(
        { error: "Failed to initialize Google connection" },
        { status: 500 }
      );
    }

    // Get the origin for the redirect
    const url = new URL(request.url);
    const origin = url.origin;

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Google connect: Unexpected error", error);
    return NextResponse.json(
      { 
        error: "Failed to initiate Google connection", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
