import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getConversations } from "@/lib/data/stem";
import { MessagesList } from "@/components/tools/stem/MessagesList";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const conversations = await getConversations(session.user.tenantId);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <MessagesList
          conversations={conversations}
          currentTenantId={session.user.tenantId}
        />
      </div>
    </div>
  );
}
