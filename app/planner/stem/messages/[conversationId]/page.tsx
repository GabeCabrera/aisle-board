import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getMessages, getConversations } from "@/lib/data/stem";
import { ConversationView } from "@/components/tools/stem/ConversationView";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  try {
    // Get conversation details
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        participant1: {
          columns: { id: true, displayName: true, profileImage: true, slug: true },
        },
        participant2: {
          columns: { id: true, displayName: true, profileImage: true, slug: true },
        },
      },
    });

    if (!conversation) {
      notFound();
    }

    // Verify user is a participant
    if (
      conversation.participant1Id !== session.user.tenantId &&
      conversation.participant2Id !== session.user.tenantId
    ) {
      notFound();
    }

    // Get messages
    const messages = await getMessages(conversationId, session.user.tenantId);

    // Determine other participant
    const otherParticipant =
      conversation.participant1Id === session.user.tenantId
        ? conversation.participant2
        : conversation.participant1;

    return (
      <div className="h-full flex flex-col">
        <ConversationView
          conversationId={conversationId}
          otherParticipant={otherParticipant}
          initialMessages={messages}
          currentTenantId={session.user.tenantId}
        />
      </div>
    );
  } catch (error) {
    console.error("Conversation error:", error);
    notFound();
  }
}
