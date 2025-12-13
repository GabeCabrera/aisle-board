import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { getEmailStats, getSubscribedUsers } from "@/lib/db/queries";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/manage-x7k9/email - Get email stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getEmailStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Get email stats error:", error);
    return NextResponse.json(
      { error: "Failed to get email stats" },
      { status: 500 }
    );
  }
}

// POST /api/manage-x7k9/email - Send broadcast email to all subscribed users
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, content } = await request.json();

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Subject and content are required" },
        { status: 400 }
      );
    }

    // Get all subscribed users
    const subscribedUsers = await getSubscribedUsers();

    if (subscribedUsers.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails in batches to avoid rate limiting
    for (const user of subscribedUsers) {
      if (!user.unsubscribeToken) {
        failed++;
        errors.push(`${user.email}: No unsubscribe token`);
        continue;
      }

      try {
        const result = await sendEmail({
          to: user.email,
          template: "broadcast",
          data: {
            name: user.name || "there",
            unsubscribeToken: user.unsubscribeToken,
            subject,
            content,
          },
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${user.email}: ${result.error}`);
        }

        // Small delay to avoid rate limiting (Resend allows 10/sec on paid plans)
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        failed++;
        errors.push(`${user.email}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total: subscribedUsers.length,
      errors: errors.slice(0, 10), // Only return first 10 errors
    });
  } catch (error) {
    console.error("Broadcast email error:", error);
    return NextResponse.json(
      { error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
