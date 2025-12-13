import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { sendDirectEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// POST /api/manage-x7k9/email/direct - Send a direct email from GabeandSarah@scribeandstem.com
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, subject, content, replyTo } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: "Recipient, subject, and content are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const result = await sendDirectEmail({
      to,
      subject,
      content,
      replyTo,
    });

    if (result.success) {
      return NextResponse.json({ success: true, id: result.id });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Direct email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
