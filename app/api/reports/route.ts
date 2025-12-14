import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { createContentReport } from "@/lib/data/stem";

/**
 * POST /api/reports
 * Report content for moderation
 * Body: { targetType, targetId, reason, details? }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, reason, details } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "targetType, targetId, and reason are required" },
        { status: 400 }
      );
    }

    const report = await createContentReport({
      reporterTenantId: session.user.tenantId,
      targetType,
      targetId,
      reason,
      details,
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted. Thank you for helping keep our community safe.",
      reportId: report.id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid report reason" || error.message === "Invalid target type") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
