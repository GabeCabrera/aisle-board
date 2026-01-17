"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface Tab {
  id: string;
  type: "tool" | "artifact";
  toolId?: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  closable: boolean;
  artifactData?: {
    code: string;
    title: string;
    language?: "jsx" | "html" | "markdown";
  };
}

export interface BrowserContextType {
  tabs: Tab[];
  activeTabId: string;
  history: string[];
  historyIndex: number;
  favorites: string[];
  openTab: (tab: Omit<Tab, "id">) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  goBack: () => void;
  goForward: () => void;
  goHome: () => void;
  toggleFavorite: (toolId: string) => void;
  openTool: (toolId: string) => void;
  // Mobile-specific
  isTabSwitcherOpen: boolean;
  setTabSwitcherOpen: (open: boolean) => void;
  isQuickActionsOpen: boolean;
  setQuickActionsOpen: (open: boolean) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const BrowserContext = createContext<BrowserContextType | null>(null);

export function useBrowser() {
  const context = useContext(BrowserContext);
  if (!context) throw new Error("useBrowser must be used within BrowserProvider");
  return context;
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

import {
  LayoutDashboard,
  DollarSign,
  Users,
  Store,
  Calendar,
  CalendarRange,
  CheckCircle,
  Sparkles,
  Settings,
  Armchair,
  BookOpen,
} from "lucide-react";

export interface ToolDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadow: string;
  // We can add more properties here as needed
}

export const tools: ToolDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    gradient: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
    shadow: "rgba(244, 63, 94, 0.4)",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarRange,
    gradient: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
    shadow: "rgba(99, 102, 241, 0.4)",
  },
  {
    id: "stem",
    label: "Stem",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    shadow: "rgba(236, 72, 153, 0.4)",
  },
  {
    id: "blog",
    label: "Learn",
    icon: BookOpen,
    gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    shadow: "rgba(249, 115, 22, 0.4)",
  },
  {
    id: "checklist",
    label: "Checklist",
    icon: CheckCircle,
    gradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
    shadow: "rgba(20, 184, 166, 0.4)",
  },
  {
    id: "timeline",
    label: "Timeline",
    icon: Calendar,
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    shadow: "rgba(245, 158, 11, 0.4)",
  },
  {
    id: "budget",
    label: "Budget",
    icon: DollarSign,
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    shadow: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "guests",
    label: "Guests",
    icon: Users,
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    shadow: "rgba(59, 130, 246, 0.4)",
  },
  {
    id: "vendors",
    label: "Vendors",
    icon: Store,
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    shadow: "rgba(139, 92, 246, 0.4)",
  },
  {
    id: "seating",
    label: "Seating",
    icon: Armchair,
    gradient: "linear-gradient(135deg, #A855F7 0%, #9333EA 100%)",
    shadow: "rgba(168, 85, 247, 0.4)",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    gradient: "linear-gradient(135deg, #64748B 0%, #475569 100%)",
    shadow: "rgba(100, 116, 139, 0.4)",
  },
];

export const getToolById = (id: string) => tools.find((t) => t.id === id);

// =============================================================================
// SCRIBE LOGO
// =============================================================================

export function ScribeLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// =============================================================================
// BROWSER PROVIDER
// =============================================================================

export function BrowserProvider({ children }: { children: React.ReactNode }) {
  const defaultTool = getToolById("dashboard");
  const defaultTabId = "home";
  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: defaultTabId,
      type: "tool",
      toolId: "dashboard",
      title: defaultTool?.label || "Dashboard",
      icon: defaultTool?.icon,
      closable: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState(defaultTabId);
  const [history, setHistory] = useState<string[]>([defaultTabId]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Mobile UI state
  const [isTabSwitcherOpen, setTabSwitcherOpen] = useState(false);
  const [isQuickActionsOpen, setQuickActionsOpen] = useState(false);

  // Favorites with localStorage persistence
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("scribe-favorites");
      return saved ? JSON.parse(saved) : ["dashboard", "budget"];
    }
    return ["dashboard", "budget"];
  });

  useEffect(() => {
    localStorage.setItem("scribe-favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Tab operations
  const openTab = useCallback(
    (tabData: Omit<Tab, "id">) => {
      const id = `tab-${Date.now()}`;
      const newTab: Tab = { ...tabData, id };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(id);
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), id]);
      setHistoryIndex((prev) => prev + 1);
      return id;
    },
    [historyIndex]
  );

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const newTabs = prev.filter((t) => t.id !== tabId);
        if (tabId === activeTabId && newTabs.length > 0) {
          const closedIndex = prev.findIndex((t) => t.id === tabId);
          const newIndex = Math.max(0, closedIndex - 1);
          setActiveTabId(newTabs[newIndex].id);
        }
        return newTabs;
      });
    },
    [activeTabId]
  );

  const switchTab = useCallback(
    (tabId: string) => {
      if (tabId !== activeTabId) {
        setActiveTabId(tabId);
        setHistory((prev) => [...prev.slice(0, historyIndex + 1), tabId]);
        setHistoryIndex((prev) => prev + 1);
      }
      // Close mobile UI when switching tabs
      setTabSwitcherOpen(false);
      setQuickActionsOpen(false);
    },
    [activeTabId, historyIndex]
  );

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const tabId = history[newIndex];
      if (tabs.find((t) => t.id === tabId)) {
        setHistoryIndex(newIndex);
        setActiveTabId(tabId);
      }
    }
  }, [historyIndex, history, tabs]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const tabId = history[newIndex];
      if (tabs.find((t) => t.id === tabId)) {
        setHistoryIndex(newIndex);
        setActiveTabId(tabId);
      }
    }
  }, [historyIndex, history, tabs]);

  const goHome = useCallback(() => {
    switchTab(defaultTabId);
  }, [switchTab, defaultTabId]);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  }, []);

  const openTool = useCallback(
    (toolId: string) => {
      // Check if tool is already open
      const existingTab = tabs.find((t) => t.type === "tool" && t.toolId === toolId);
      if (existingTab) {
        switchTab(existingTab.id);
        return existingTab.id;
      }

      const tool = getToolById(toolId);
      if (!tool) return "";

      return openTab({
        type: "tool",
        toolId,
        title: tool.label,
        icon: tool.icon,
        closable: true,
      });
    },
    [tabs, switchTab, openTab]
  );

  const contextValue: BrowserContextType = {
    tabs,
    activeTabId,
    history,
    historyIndex,
    favorites,
    openTab,
    closeTab,
    switchTab,
    goBack,
    goForward,
    goHome,
    toggleFavorite,
    openTool,
    isTabSwitcherOpen,
    setTabSwitcherOpen,
    isQuickActionsOpen,
    setQuickActionsOpen,
  };

  return <BrowserContext.Provider value={contextValue}>{children}</BrowserContext.Provider>;
}