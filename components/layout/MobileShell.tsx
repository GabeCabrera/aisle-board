"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBrowser, getToolById, tools, AisleLogo } from "./browser-context";
import { ChevronLeft, ChevronRight, Home, Layers, MoreHorizontal, X, Plus, Code } from "lucide-react";
import { ToolContent } from "./shared-components";
import { MobileTabSwitcher } from "./MobileTabSwitcher";

// =============================================================================
// QUICK ACTIONS SHEET (App launcher)
// =============================================================================

function QuickActionsSheet() {
  const browser = useBrowser();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        browser.setQuickActionsOpen(false);
      }
    };
    if (browser.isQuickActionsOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [browser.isQuickActionsOpen, browser]);

  if (!browser.isQuickActionsOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F8F6F3 100%)",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          boxShadow: "0 -8px 32px -4px rgba(0, 0, 0, 0.15)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        {/* Title */}
        <div className="px-5 pb-3">
          <h3 className="font-serif text-lg text-stone-800">Quick Access</h3>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-4 gap-4 px-5 pb-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                browser.openTool(tool.id);
                browser.setQuickActionsOpen(false);
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl active:scale-95 transition-transform"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: tool.gradient,
                  boxShadow: `0 4px 12px -2px ${tool.shadow}`,
                }}
              >
                <tool.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs text-stone-600 font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// =============================================================================
// BOTTOM NAVIGATION BAR
// =============================================================================

function BottomNavBar() {
  const browser = useBrowser();
  const canGoBack = browser.historyIndex > 0;
  const canGoForward = browser.historyIndex < browser.history.length - 1;
  const activeTab = browser.tabs.find((t) => t.id === browser.activeTabId);

  return (
    <div
      className="flex items-center justify-around px-2"
      style={{
        height: 50,
        background: "linear-gradient(180deg, #FAFAF9 0%, #F5F5F4 100%)",
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Back */}
      <button
        onClick={browser.goBack}
        disabled={!canGoBack}
        className="p-3 rounded-xl transition-all active:scale-95 disabled:opacity-30"
      >
        <ChevronLeft className="w-6 h-6 text-stone-600" />
      </button>

      {/* Forward */}
      <button
        onClick={browser.goForward}
        disabled={!canGoForward}
        className="p-3 rounded-xl transition-all active:scale-95 disabled:opacity-30"
      >
        <ChevronRight className="w-6 h-6 text-stone-600" />
      </button>

      {/* Home (Chat) */}
      <button
        onClick={browser.goHome}
        className={`p-3 rounded-xl transition-all active:scale-95 ${
          activeTab?.type === "chat" ? "bg-rose-50" : ""
        }`}
      >
        {activeTab?.type === "chat" ? (
          <AisleLogo size={24} className="text-rose-500" />
        ) : (
          <Home className="w-6 h-6 text-stone-600" />
        )}
      </button>

      {/* Tab Switcher */}
      <button
        onClick={() => browser.setTabSwitcherOpen(true)}
        className="p-3 rounded-xl transition-all active:scale-95 relative"
      >
        <Layers className="w-6 h-6 text-stone-600" />
        {browser.tabs.length > 1 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{
              background: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
            }}
          >
            {browser.tabs.length}
          </span>
        )}
      </button>

      {/* Quick Actions */}
      <button
        onClick={() => browser.setQuickActionsOpen(true)}
        className="p-3 rounded-xl transition-all active:scale-95"
      >
        <MoreHorizontal className="w-6 h-6 text-stone-600" />
      </button>
    </div>
  );
}

// =============================================================================
// MOBILE ADDRESS BAR (simplified, shows current location)
// =============================================================================

function MobileAddressBar() {
  const browser = useBrowser();
  const activeTab = browser.tabs.find((t) => t.id === browser.activeTabId);
  const tool = activeTab?.toolId ? getToolById(activeTab.toolId) : null;

  return (
    <div
      className="flex items-center gap-2 mx-3 my-2 px-3 py-2 rounded-xl"
      style={{
        background: "linear-gradient(135deg, #F5F5F4 0%, #E7E5E4 100%)",
      }}
    >
      {activeTab?.type === "chat" && <AisleLogo size={16} className="text-rose-400" />}
      {activeTab?.type === "tool" && tool && (
        <div
          className="w-4 h-4 rounded flex items-center justify-center"
          style={{ background: tool.gradient }}
        >
          <tool.icon className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      {activeTab?.type === "artifact" && <Code className="w-4 h-4 text-emerald-500" />}
      <span className="text-sm text-stone-500 truncate flex-1">
        {activeTab?.type === "chat" && "aisle://chat"}
        {activeTab?.type === "tool" && `aisle://${activeTab.toolId}`}
        {activeTab?.type === "artifact" &&
          `aisle://widget/${activeTab.title.toLowerCase().replace(/\s+/g, "-")}`}
      </span>
    </div>
  );
}

// =============================================================================
// MOBILE SHELL
// =============================================================================

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const browser = useBrowser();
  const activeTab = browser.tabs.find((t) => t.id === browser.activeTabId);

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Address bar */}
      <div
        style={{
          paddingTop: "env(safe-area-inset-top)",
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <MobileAddressBar />
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden bg-white">
        {activeTab?.type === "chat" && children}
        {activeTab?.type === "tool" && activeTab.toolId && <ToolContent toolId={activeTab.toolId} />}
        {activeTab?.type === "artifact" && activeTab.artifactData && (
          <div className="h-full p-4">
            <p className="text-stone-500 text-sm">Widget: {activeTab.title}</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <BottomNavBar />

      {/* Overlays */}
      <QuickActionsSheet />
      <MobileTabSwitcher />
    </div>
  );
}

export default MobileShell;
