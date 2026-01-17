"use client";

import { useBrowser, getToolById } from "./browser-context";
import { X, Plus, Code } from "lucide-react";

// =============================================================================
// TAB CARD (individual tab preview in grid)
// =============================================================================

interface TabCardProps {
  tab: {
    id: string;
    type: "tool" | "artifact";
    toolId?: string;
    title: string;
    closable: boolean;
  };
  isActive: boolean;
  onSelect: () => void;
  onClose?: () => void;
}

function TabCard({ tab, isActive, onSelect, onClose }: TabCardProps) {
  const tool = tab.toolId ? getToolById(tab.toolId) : null;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-200 active:scale-95 ${
        isActive ? "ring-2 ring-rose-400 ring-offset-2" : ""
      }`}
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8F6F3 100%)",
        boxShadow: "0 4px 16px -4px rgba(0, 0, 0, 0.15), 0 2px 4px -2px rgba(0, 0, 0, 0.08)",
        aspectRatio: "3/4",
      }}
    >
      {/* Close button */}
      {tab.closable && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-stone-800/80 flex items-center justify-center active:scale-90 transition-transform"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      )}

      {/* Card content */}
      <button onClick={onSelect} className="w-full h-full flex flex-col">
        {/* Preview header */}
        <div
          className="h-8 flex items-center gap-2 px-3"
          style={{
            background:
              tab.type === "artifact"
                ? "linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)"
                : tool
                  ? tool.gradient
                  : "linear-gradient(135deg, #F5F5F4 0%, #E7E5E4 100%)",
          }}
        >
          {tab.type === "tool" && tool && <tool.icon className="w-3.5 h-3.5 text-white" />}
          {tab.type === "artifact" && <Code className="w-3.5 h-3.5 text-emerald-600" />}
          <span
            className={`text-xs font-medium truncate ${
              tab.type === "tool" ? "text-white" : "text-stone-700"
            }`}
          >
            {tab.title}
          </span>
        </div>

        {/* Preview content area */}
        <div className="flex-1 p-3 flex items-center justify-center">
          {tab.type === "tool" && tool && (
            <div className="text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{
                  background: tool.gradient,
                  boxShadow: `0 4px 8px -2px ${tool.shadow}`,
                }}
              >
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs text-stone-400">{tool.label}</p>
            </div>
          )}
          {tab.type === "artifact" && (
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 bg-emerald-100">
                <Code className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-xs text-stone-400">Widget</p>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// =============================================================================
// NEW TAB CARD
// =============================================================================

function NewTabCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-rose-300 hover:bg-rose-50/50"
      style={{ aspectRatio: "3/4" }}
    >
      <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
        <Plus className="w-5 h-5 text-stone-400" />
      </div>
      <span className="text-sm text-stone-400">New Tab</span>
    </button>
  );
}

// =============================================================================
// MOBILE TAB SWITCHER
// =============================================================================

export function MobileTabSwitcher() {
  const browser = useBrowser();

  if (!browser.isTabSwitcherOpen) return null;

  const handleNewTab = () => {
    // For now, open dashboard as default new tab
    browser.openTool("dashboard");
    browser.setTabSwitcherOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#1c1917" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <h2 className="text-lg font-medium text-white">
          {browser.tabs.length} {browser.tabs.length === 1 ? "Tab" : "Tabs"}
        </h2>
        <button
          onClick={() => browser.setTabSwitcherOpen(false)}
          className="px-4 py-2 rounded-full text-sm font-medium text-rose-400 active:bg-rose-400/10 transition-colors"
        >
          Done
        </button>
      </div>

      {/* Tab Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="grid grid-cols-2 gap-4">
          {browser.tabs.map((tab) => (
            <TabCard
              key={tab.id}
              tab={tab}
              isActive={tab.id === browser.activeTabId}
              onSelect={() => {
                browser.switchTab(tab.id);
                browser.setTabSwitcherOpen(false);
              }}
              onClose={tab.closable ? () => browser.closeTab(tab.id) : undefined}
            />
          ))}
          <NewTabCard onClick={handleNewTab} />
        </div>
      </div>

      {/* Bottom safe area */}
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}

export default MobileTabSwitcher;
