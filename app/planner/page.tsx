"use client";

import dynamic from 'next/dynamic';
import { useBrowser } from "@/components/layout/browser-context";
import { CircularProgress, Box } from "@mui/material";

// Loading fallback
const ToolLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </Box>
);

// Dynamic imports
const DashboardTool = dynamic(() => import("@/components/tools/DashboardTool"), { loading: () => <ToolLoading /> });
const BudgetTool = dynamic(() => import("@/components/tools/BudgetTool"), { loading: () => <ToolLoading /> });
const ChecklistTool = dynamic(() => import("@/components/tools/ChecklistTool"), { loading: () => <ToolLoading /> });
const GuestsTool = dynamic(() => import("@/components/tools/GuestsTool"), { loading: () => <ToolLoading /> });
const VendorsTool = dynamic(() => import("@/components/tools/VendorsTool"), { loading: () => <ToolLoading /> });
const InspoTool = dynamic(() => import("@/components/tools/InspoTool"), { loading: () => <ToolLoading /> });
const TimelineTool = dynamic(() => import("@/components/tools/TimelineTool"), { loading: () => <ToolLoading /> });
const SettingsTool = dynamic(() => import("@/components/tools/SettingsTool"), { loading: () => <ToolLoading /> });
const ScribeChatTool = dynamic(() => import("@/components/tools/ScribeChatTool"), { loading: () => <ToolLoading /> });
const CalendarTool = dynamic(() => import("@/components/tools/CalendarTool"), { loading: () => <ToolLoading /> });
const SeatingTool = dynamic(() => import("@/components/tools/SeatingTool"), { loading: () => <ToolLoading /> });

export default function ChatPage() {
  const { tabs, activeTabId } = useBrowser();
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  console.log("Current activeTabId:", activeTabId);
  console.log("Active Tab:", activeTab);
  console.log("Active Tab Title:", activeTab?.title);

  // Map titles to components
  // Note: These keys must match the 'label' in browser-context.tsx tools definition
  // or the title set when opening a tab.
  // The tool definition uses labels like "Dashboard", "Budget", "Inspo".
  const toolComponents: { [key: string]: React.ComponentType } = {
    Dashboard: DashboardTool,
    Budget: BudgetTool,
    Checklist: ChecklistTool,
    Guests: GuestsTool,
    Vendors: VendorsTool,
    Inspo: InspoTool,
    Inspiration: InspoTool, // Handle both potential names
    Timeline: TimelineTool,
    Calendar: CalendarTool,
    Seating: SeatingTool,
    Settings: SettingsTool,
    Chat: ScribeChatTool,
    Scribe: ScribeChatTool,
  };

  const ResolvedComponent = activeTab?.title ? toolComponents[activeTab.title] : null;
  console.log("Resolved Component from map:", ResolvedComponent);

  // Fallback to Dashboard if tool not found
  const ActiveTool = ResolvedComponent || DashboardTool;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ActiveTool />
      </div>
    </div>
  );
}