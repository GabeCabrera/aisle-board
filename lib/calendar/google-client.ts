import { google, calendar_v3 } from "googleapis";
import {
  getGoogleCalendarConnection,
  updateGoogleCalendarConnection,
} from "@/lib/db/queries";

// ============================================================================
// TYPES
// ============================================================================

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
  location?: string;
}

// ============================================================================
// OAUTH CLIENT
// ============================================================================

export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth configuration");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(state: string): string {
  const oauth2Client = getOAuthClient();

  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // Force consent to get refresh token
    scope: scopes,
    state,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Failed to get tokens from Google");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
  };
}

// ============================================================================
// AUTHENTICATED CLIENT
// ============================================================================

export async function getAuthenticatedClient(tenantId: string) {
  const connection = await getGoogleCalendarConnection(tenantId);

  if (!connection) {
    throw new Error("No Google Calendar connection found");
  }

  const oauth2Client = getOAuthClient();

  // Set credentials
  oauth2Client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expiry_date: connection.tokenExpiresAt.getTime(),
  });

  // Check if token needs refresh
  if (connection.tokenExpiresAt <= new Date()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update stored tokens
      await updateGoogleCalendarConnection(tenantId, {
        accessToken: credentials.access_token!,
        tokenExpiresAt: new Date(credentials.expiry_date!),
      });

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw new Error("Failed to refresh Google token");
    }
  }

  return oauth2Client;
}

export async function getCalendarClient(tenantId: string): Promise<calendar_v3.Calendar> {
  const auth = await getAuthenticatedClient(tenantId);
  return google.calendar({ version: "v3", auth });
}

// ============================================================================
// USER INFO
// ============================================================================

export async function getGoogleUserEmail(tenantId: string): Promise<string> {
  const auth = await getAuthenticatedClient(tenantId);
  const oauth2 = google.oauth2({ version: "v2", auth });
  const { data } = await oauth2.userinfo.get();
  return data.email || "";
}

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

export async function createWeddingCalendar(
  tenantId: string,
  calendarName: string
): Promise<{ calendarId: string; shareLink: string }> {
  const calendar = await getCalendarClient(tenantId);

  // Create the calendar
  const { data: newCalendar } = await calendar.calendars.insert({
    requestBody: {
      summary: calendarName,
      description: "Wedding planning calendar created by Aisle",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  if (!newCalendar.id) {
    throw new Error("Failed to create calendar");
  }

  // Make it shareable (anyone with link can view)
  await calendar.acl.insert({
    calendarId: newCalendar.id,
    requestBody: {
      role: "reader",
      scope: {
        type: "default",
      },
    },
  });

  // Get the public URL
  const shareLink = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(newCalendar.id)}`;

  return {
    calendarId: newCalendar.id,
    shareLink,
  };
}

export async function deleteWeddingCalendar(
  tenantId: string,
  calendarId: string
): Promise<void> {
  const calendar = await getCalendarClient(tenantId);

  try {
    await calendar.calendars.delete({ calendarId });
  } catch (error) {
    console.error("Failed to delete calendar:", error);
    // Don't throw - calendar may already be deleted
  }
}

// ============================================================================
// EVENT OPERATIONS
// ============================================================================

export async function createGoogleEvent(
  tenantId: string,
  calendarId: string,
  event: CalendarEventInput
): Promise<{ googleEventId: string; etag: string }> {
  const calendar = await getCalendarClient(tenantId);

  const eventBody: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    location: event.location,
  };

  if (event.allDay) {
    eventBody.start = {
      date: event.startTime.toISOString().split("T")[0],
    };
    eventBody.end = {
      date: event.endTime
        ? event.endTime.toISOString().split("T")[0]
        : event.startTime.toISOString().split("T")[0],
    };
  } else {
    eventBody.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    eventBody.end = {
      dateTime: event.endTime?.toISOString() || event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: eventBody,
  });

  return {
    googleEventId: data.id!,
    etag: data.etag!,
  };
}

export async function updateGoogleEvent(
  tenantId: string,
  calendarId: string,
  googleEventId: string,
  event: CalendarEventInput
): Promise<{ etag: string }> {
  const calendar = await getCalendarClient(tenantId);

  const eventBody: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    location: event.location,
  };

  if (event.allDay) {
    eventBody.start = {
      date: event.startTime.toISOString().split("T")[0],
    };
    eventBody.end = {
      date: event.endTime
        ? event.endTime.toISOString().split("T")[0]
        : event.startTime.toISOString().split("T")[0],
    };
  } else {
    eventBody.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    eventBody.end = {
      dateTime: event.endTime?.toISOString() || event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  const { data } = await calendar.events.update({
    calendarId,
    eventId: googleEventId,
    requestBody: eventBody,
  });

  return { etag: data.etag! };
}

export async function deleteGoogleEvent(
  tenantId: string,
  calendarId: string,
  googleEventId: string
): Promise<void> {
  const calendar = await getCalendarClient(tenantId);

  await calendar.events.delete({
    calendarId,
    eventId: googleEventId,
  });
}

export async function listGoogleEvents(
  tenantId: string,
  calendarId: string,
  syncToken?: string
): Promise<{
  events: calendar_v3.Schema$Event[];
  nextSyncToken?: string;
}> {
  const calendar = await getCalendarClient(tenantId);

  const params: calendar_v3.Params$Resource$Events$List = {
    calendarId,
    maxResults: 2500,
    singleEvents: true,
    orderBy: "startTime",
  };

  if (syncToken) {
    params.syncToken = syncToken;
  } else {
    // Initial sync - get events from now onwards
    params.timeMin = new Date().toISOString();
  }

  try {
    const { data } = await calendar.events.list(params);

    return {
      events: data.items || [],
      nextSyncToken: data.nextSyncToken ?? undefined,
    };
  } catch (error: unknown) {
    // If sync token is invalid, do a full sync
    if (error && typeof error === "object" && "code" in error && error.code === 410) {
      const { data } = await calendar.events.list({
        ...params,
        syncToken: undefined,
        timeMin: new Date().toISOString(),
      });

      return {
        events: data.items || [],
        nextSyncToken: data.nextSyncToken ?? undefined,
      };
    }
    throw error;
  }
}

// ============================================================================
// SHARE CALENDAR
// ============================================================================

export async function shareCalendarWithEmail(
  tenantId: string,
  calendarId: string,
  email: string,
  role: "reader" | "writer" = "writer"
): Promise<void> {
  const calendar = await getCalendarClient(tenantId);

  await calendar.acl.insert({
    calendarId,
    requestBody: {
      role,
      scope: {
        type: "user",
        value: email,
      },
    },
  });
}

export async function getCalendarShareLink(calendarId: string): Promise<string> {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(calendarId)}`;
}
