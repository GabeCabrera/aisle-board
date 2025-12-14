import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { answerVendorQuestion } from "@/lib/data/stem";

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
    const { answer } = await request.json();

    if (!answer || answer.trim().length === 0) {
      return NextResponse.json(
        { error: "Answer is required" },
        { status: 400 }
      );
    }

    const updatedQuestion = await answerVendorQuestion(
      questionId,
      session.user.tenantId,
      answer.trim()
    );

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error("Error answering question:", error);
    const message = error instanceof Error ? error.message : "Failed to answer question";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
