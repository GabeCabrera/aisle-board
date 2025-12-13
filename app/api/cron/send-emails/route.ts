import { NextRequest, NextResponse } from "next/server";
import {
  getPendingScheduledEmails,
  markEmailAsSent,
  markEmailAsFailed,
} from "@/lib/db/queries";
import { sendEmail, type EmailTemplate } from "@/lib/email";

export const dynamic = "force-dynamic";

// This endpoint is called by Vercel Cron
// Configure in vercel.json: every 5 minutes
export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // SECURITY: Always require CRON_SECRET to be configured
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  // Validate the authorization header
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("Unauthorized cron request attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all pending emails that are due (only for opted-in users)
    const pendingEmails = await getPendingScheduledEmails();

    if (pendingEmails.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    let sent = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      // Skip if user doesn't have an unsubscribe token (shouldn't happen but safety check)
      if (!email.user.unsubscribeToken) {
        await markEmailAsFailed(email.id, "No unsubscribe token");
        failed++;
        continue;
      }

      try {
        const result = await sendEmail({
          to: email.user.email,
          template: email.emailType as EmailTemplate,
          data: {
            name: email.user.name || "there",
            unsubscribeToken: email.user.unsubscribeToken,
          },
        });

        if (result.success) {
          await markEmailAsSent(email.id);
          sent++;
        } else {
          await markEmailAsFailed(email.id, result.error || "Unknown error");
          failed++;
        }
      } catch (err) {
        await markEmailAsFailed(email.id, String(err));
        failed++;
      }
    }

    return NextResponse.json({
      processed: pendingEmails.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Cron email processing error:", error);
    return NextResponse.json(
      { error: "Failed to process emails" },
      { status: 500 }
    );
  }
}
