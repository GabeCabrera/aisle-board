import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { markQuestionHelpful } from "@/lib/data/stem";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId } = await params;

    await markQuestionHelpful(questionId, session.user.tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking question helpful:", error);
    return NextResponse.json(
      { error: "Failed to mark question as helpful" },
      { status: 500 }
    );
  }
}
