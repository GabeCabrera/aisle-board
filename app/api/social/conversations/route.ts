import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getConversations, getOrCreateConversation } from "@/lib/data/stem";

/**
 * GET /api/social/conversations
 * Get all conversations for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await getConversations(session.user.tenantId);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Conversations GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/social/conversations
 * Start a new conversation or get existing one
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { otherTenantId } = body;

    if (!otherTenantId) {
      return NextResponse.json(
        { error: "otherTenantId is required" },
        { status: 400 }
      );
    }

    if (otherTenantId === session.user.tenantId) {
      return NextResponse.json(
        { error: "Cannot start conversation with yourself" },
        { status: 400 }
      );
    }

    const conversation = await getOrCreateConversation(
      session.user.tenantId,
      otherTenantId
    );

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
