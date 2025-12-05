"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Plus,
  Star,
  Settings,
  ChevronDown,
  LogOut,
  Code,
} from "lucide-react";

// Import from shared modules
import {
  BrowserProvider,
  useBrowser,
  tools,
  getToolById,
  AisleLogo,
} from "./browser-context";
import { ToolContent, ArtifactRunner, TabItem } from "./shared-components";

// Re-export for backwards compatibility
export { useBrowser, AisleLogo };

// =============================================================================
// FAVORITES BAR
// =============================================================================

function FavoritesBar({
  favorites,
  onOpenTool,
}: {
  favorites: string[];
  onOpenTool: (toolId: string) => void;
}) {
  if (favorites.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-3 py-1.5 border-b"
      style={{
        background: "linear-gradient(180deg, #FAFAF9 0%, #F5F5F4 100%)",
        borderColor: "rgba(61, 56, 51, 0.06)",
      }}
    >
      {favorites.map((toolId) => {
        const tool = getToolById(toolId);
        if (!tool) return null;
        return (
          <button
            key={toolId}
            onClick={() => onOpenTool(toolId)}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-stone-600 hover:bg-white hover:shadow-sm transition-all"
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center"
              style={{
                background: tool.gradient,
                boxShadow: `0 1px 2px -1px ${tool.shadow}`,
              }}
            >
              <tool.icon className="w-2.5 h-2.5 text-white" />
            </div>
            <span>{tool.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// PROFILE DROPDOWN
// =============================================================================

function ProfileDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const browser = useBrowser();

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-full transition-all duration-200 hover:bg-stone-100"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
          style={{
            background: "linear-gradient(135deg, #D4A69C 0%, #C4918A 100%)",
            boxShadow: "0 2px 6px -1px rgba(196, 145, 138, 0.4)",
          }}
        >
          {initials}
        </div>
        <ChevronDown
          className="w-3.5 h-3.5 text-stone-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-xl py-1 z-50"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #FDFCFA 100%)",
              boxShadow:
                "0 12px 32px -8px rgba(61, 56, 51, 0.2), 0 4px 12px -4px rgba(61, 56, 51, 0.1)",
              border: "1px solid rgba(61, 56, 51, 0.06)",
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(61, 56, 51, 0.06)" }}>
              <p className="font-medium text-stone-800 text-sm truncate">{session?.user?.name}</p>
              <p className="text-xs text-stone-500 truncate">{session?.user?.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  browser.openTool("settings");
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// NEW TAB DROPDOWN
// =============================================================================

function NewTabDropdown() {
  const [open, setOpen] = useState(false);
  const browser = useBrowser();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all"
        title="New tab"
      >
        <Plus className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-2 w-48 rounded-xl py-1 z-50"
            style={{
              background: "linear-gradient(180deg, #FFFFFF 0%, #FDFCFA 100%)",
              boxShadow:
                "0 12px 32px -8px rgba(61, 56, 51, 0.2), 0 4px 12px -4px rgba(61, 56, 51, 0.1)",
              border: "1px solid rgba(61, 56, 51, 0.06)",
            }}
          >
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => {
                  browser.openTool(tool.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{
                    background: tool.gradient,
                    boxShadow: `0 2px 4px -1px ${tool.shadow}`,
                  }}
                >
                  <tool.icon className="w-3 h-3 text-white" />
                </div>
                {tool.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// BROWSER CHROME (Desktop Shell)
// =============================================================================

function BrowserChrome({ children }: { children: React.ReactNode }) {
  const browser = useBrowser();
  const activeTab = browser.tabs.find((t) => t.id === browser.activeTabId);
  const canGoBack = browser.historyIndex > 0;
  const canGoForward = browser.historyIndex < browser.history.length - 1;

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Title bar / Tab bar */}
      <div
        className="flex items-end gap-1 px-2 pt-2"
        style={{
          background: "linear-gradient(180deg, #E7E5E4 0%, #D6D3D1 100%)",
        }}
      >
        {/* Tabs */}
        <div className="flex items-end gap-0.5 flex-1 overflow-x-auto pb-0">
          {browser.tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === browser.activeTabId}
              onSelect={() => browser.switchTab(tab.id)}
              onClose={tab.closable ? () => browser.closeTab(tab.id) : undefined}
            />
          ))}

          {/* New tab button */}
          <NewTabDropdown />
        </div>

        {/* Profile */}
        <div className="pb-2">
          <ProfileDropdown />
        </div>
      </div>

      {/* Navigation bar */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%)",
          borderColor: "rgba(61, 56, 51, 0.08)",
        }}
      >
        {/* Nav buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={browser.goBack}
            disabled={!canGoBack}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{ color: canGoBack ? "#57534e" : "#a8a29e" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={browser.goForward}
            disabled={!canGoForward}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{ color: canGoForward ? "#57534e" : "#a8a29e" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={browser.goHome}
            className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-all"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Address bar */}
        <div
          className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "linear-gradient(135deg, #F5F5F4 0%, #E7E5E4 100%)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          {activeTab?.toolId && (
            <>
              {(() => {
                const tool = getToolById(activeTab.toolId);
                if (!tool) return null;
                return (
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: tool.gradient,
                    }}
                  >
                    <tool.icon className="w-2.5 h-2.5 text-white" />
                  </div>
                );
              })()}
            </>
          )}
          {activeTab?.type === "chat" && <AisleLogo size={16} className="text-rose-400 flex-shrink-0" />}
          {activeTab?.type === "artifact" && <Code className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
          <span className="text-sm text-stone-600 truncate">
            {activeTab?.type === "chat" && "aisle://chat"}
            {activeTab?.type === "tool" && `aisle://${activeTab.toolId}`}
            {activeTab?.type === "artifact" &&
              `aisle://widget/${activeTab.title.toLowerCase().replace(/\s+/g, "-")}`}
          </span>

          {/* Favorite button for tools */}
          {activeTab?.toolId && (
            <button
              onClick={() => browser.toggleFavorite(activeTab.toolId!)}
              className="ml-auto p-1 rounded hover:bg-stone-200 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  browser.favorites.includes(activeTab.toolId) ? "text-amber-500 fill-amber-500" : "text-stone-400"
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Favorites bar */}
      <FavoritesBar favorites={browser.favorites} onOpenTool={browser.openTool} />

      {/* Content area */}
      <div className="flex-1 overflow-hidden bg-white">{children}</div>
    </div>
  );
}

// =============================================================================
// DESKTOP SHELL (used by ResponsiveShell)
// =============================================================================

export function DesktopShell({ children }: { children: React.ReactNode }) {
  const browser = useBrowser();
  const activeTab = browser.tabs.find((t) => t.id === browser.activeTabId);

  return (
    <BrowserChrome>
      {/* Render content based on active tab */}
      <div className="h-full overflow-auto">
        {activeTab?.type === "chat" && children}
        {activeTab?.type === "tool" && activeTab.toolId && <ToolContent toolId={activeTab.toolId} />}
        {activeTab?.type === "artifact" && activeTab.artifactData && (
          <ArtifactRunner
            code={activeTab.artifactData.code}
            title={activeTab.artifactData.title}
            language={activeTab.artifactData.language}
          />
        )}
      </div>
    </BrowserChrome>
  );
}

// =============================================================================
// MAIN APP SHELL (Legacy - includes own BrowserProvider)
// =============================================================================

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BrowserProvider>
      <DesktopShell>{children}</DesktopShell>
    </BrowserProvider>
  );
}

export default AppShell;
