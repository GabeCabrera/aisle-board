"use client";

import { ScribeChat } from "@/components/scribe-chat";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ScribeChatTool() {
  const { data: session } = useSession();
  const router = useRouter();

  // ScribeChat is designed as an overlay/modal, but when it's the active tool,
  // it means the user has navigated directly to it.
  // We'll treat it as always "open" when it's the active tool.
  // The onClose action will switch back to the dashboard.
  return (
    <ScribeChat
      isOpen={true} // Always open when ScribeChatTool is the active tab
      onClose={() => router.push("/planner")} // Go to dashboard if user tries to "close" it from within the tool view
      coupleNames={session?.user?.name || undefined}
      aiName="Scribe"
      variant="full"
    />
  );
}