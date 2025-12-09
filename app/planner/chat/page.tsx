"use client";

import ScribeChatTool from "@/components/tools/ScribeChatTool";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ScribeChatTool />
      </div>
    </div>
  );
}
