"use client";

import { ConciergeChat } from "@/components/concierge-chat";
import { useBrowser } from "@/components/layout/browser-context";
import { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params }: { params: { tool?: string } }, // Assuming the tool name might be passed as a param
  parent: ResolvingMetadata
): Promise<Metadata> {
  const toolName = params.tool || "Dashboard";
  const capitalizedToolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
  
  return {
    title: `${capitalizedToolName} - Aisle`,
    description: 'Your personal AI wedding planner',
  };
}

export default function ChatPage() {
  const { activeTab } = useBrowser();

  const toolComponents: { [key: string]: React.ComponentType } = {
    Dashboard: require("@/components/tools/DashboardTool").default,
    Budget: require("@/components/tools/BudgetTool").default,
    Checklist: require("@/components/tools/ChecklistTool").default,
    Guests: require("@/components/tools/GuestsTool").default,
    Vendors: require("@/components/tools/VendorsTool").default,
    Inspiration: require("@/components/tools/InspoTool").default,
    Timeline: require("@/components/tools/TimelineTool").default,
    Settings: require("@/components/tools/SettingsTool").default,
    Chat: ConciergeChat,
  };

  const ActiveTool = toolComponents[activeTab?.title || "Dashboard"];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ActiveTool />
      </div>
    </div>
  );
}