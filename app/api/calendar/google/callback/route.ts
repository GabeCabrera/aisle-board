import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  exchangeCodeForTokens,
  createWeddingCalendar,
} from "@/lib/calendar/google-client";
import {
  createGoogleCalendarConnection,
  getGoogleCalendarConnection,
  getTenantById,
} from "@/lib/db/queries";
import { google } from "googleapis";

// Force dynamic rendering since this route uses searchParams
export const dynamic = "force-dynamic";

// GET /api/calendar/google/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors from Google
    if (error) {
      console.error("Google callback: OAuth error from Google", { error });
      return NextResponse.redirect(
        new URL("/planner?error=google_auth_failed", baseUrl)
      );
    }

    if (!code) {
      console.error("Google callback: Missing authorization code");
      return NextResponse.redirect(
        new URL("/planner?error=missing_code", baseUrl)
      );
    }

    if (!state) {
      console.error("Google callback: Missing state parameter");
      return NextResponse.redirect(
        new URL("/planner?error=missing_state", baseUrl)
      );
    }

    // Decode and verify state
    let stateData: { tenantId: string; userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch (parseError) {
      console.error("Google callback: Failed to parse state", parseError);
      return NextResponse.redirect(
        new URL("/planner?error=invalid_state", baseUrl)
      );
    }

    // Validate state data
    if (!stateData.tenantId || !stateData.userId) {
      console.error("Google callback: State missing required fields", { stateData });
      return NextResponse.redirect(
        new URL("/planner?error=invalid_state", baseUrl)
      );
    }

    // Check if state is expired (1 hour)
    if (Date.now() - stateData.timestamp > 3600000) {
      console.error("Google callback: State expired");
      return NextResponse.redirect(
        new URL("/planner?error=state_expired", baseUrl)
      );
    }

    // Verify session matches state
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      console.error("Google callback: No session or tenantId");
      return NextResponse.redirect(
        new URL("/planner?error=session_expired", baseUrl)
      );
    }

    if (session.user.tenantId !== stateData.tenantId) {
      console.error("Google callback: Session/state mismatch", {
        sessionTenantId: session.user.tenantId,
        stateTenantId: stateData.tenantId,
      });
      return NextResponse.redirect(
        new URL("/planner?error=session_mismatch", baseUrl)
      );
    }

    // Check if already connected
    const existingConnection = await getGoogleCalendarConnection(stateData.tenantId);
    if (existingConnection) {
      console.log("Google callback: Already connected", { tenantId: stateData.tenantId });
      return NextResponse.redirect(
        new URL("/planner?message=already_connected", baseUrl)
      );
    }

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await exchangeCodeForTokens(code);
    } catch (tokenError) {
      console.error("Google callback: Failed to exchange code for tokens", tokenError);
      return NextResponse.redirect(
        new URL("/planner?error=token_exchange_failed", baseUrl)
      );
    }

    // Get tenant info for calendar name
    const tenant = await getTenantById(stateData.tenantId);
    const calendarName = tenant?.displayName
      ? `${tenant.displayName}'s Wedding`
      : "Wedding Planning";

    // Create dedicated wedding calendar in Google
    let calendarId;
    try {
      const result = await createWeddingCalendar(stateData.tenantId, calendarName);
      calendarId = result.calendarId;
    } catch (calendarError) {
      console.error("Google callback: Failed to create calendar", calendarError);
      return NextResponse.redirect(
        new URL("/planner?error=calendar_creation_failed", baseUrl)
      );
    }

    // Get user email using oauth2 API temporarily
    let userEmail = null;
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
      });
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();
      userEmail = userInfo.email || null;
    } catch (emailError) {
      console.error("Google callback: Failed to get user email (non-fatal)", emailError);
      // Non-fatal - continue without email
    }

    // Save connection to database
    try {
      await createGoogleCalendarConnection({
        tenantId: stateData.tenantId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        weddingCalendarId: calendarId,
        weddingCalendarName: calendarName,
        googleEmail: userEmail,
        connectedBy: stateData.userId,
      });
    } catch (dbError) {
      console.error("Google callback: Failed to save connection", dbError);
      return NextResponse.redirect(
        new URL("/planner?error=save_connection_failed", baseUrl)
      );
    }

    console.log("Google callback: Success", { tenantId: stateData.tenantId, calendarId });

    // Redirect back to planner with success message
    return NextResponse.redirect(
      new URL("/planner?message=google_connected", baseUrl)
    );
  } catch (error) {
    console.error("Google callback: Unexpected error", error);
    return NextResponse.redirect(
      new URL("/planner?error=connection_failed", baseUrl)
    );
  }
}
