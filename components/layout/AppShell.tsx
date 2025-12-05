"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  ChevronLeft,
  ChevronRight,
  Home,
  X,
  Plus,
  Star,
  Settings,
  DollarSign,
  Users,
  Store,
  Calendar,
  CheckCircle,
  Sparkles,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  User,
  Code,
  Maximize2,
  Minimize2,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface Tab {
  id: string;
  type: "chat" | "tool" | "artifact";
  toolId?: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  closable: boolean;
  artifactData?: {
    code: string;
    title: string;
  };
}

interface BrowserContextType {
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
  createArtifactTab: (title: string, code: string) => string;
}

const BrowserContext = createContext<BrowserContextType | null>(null);

export function useBrowser() {
  const context = useContext(BrowserContext);
  if (!context) throw new Error("useBrowser must be used within BrowserProvider");
  return context;
}

// =============================================================================
// AISLE LOGO
// =============================================================================

export function AisleLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

const tools = [
  { 
    id: "dashboard", 
    label: "Dashboard", 
    icon: LayoutDashboard,
    gradient: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
    shadow: "rgba(244, 63, 94, 0.4)",
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
    id: "timeline", 
    label: "Timeline", 
    icon: Calendar,
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    shadow: "rgba(245, 158, 11, 0.4)",
  },
  { 
    id: "checklist", 
    label: "Checklist", 
    icon: CheckCircle,
    gradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
    shadow: "rgba(20, 184, 166, 0.4)",
  },
  { 
    id: "inspo", 
    label: "Inspo", 
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    shadow: "rgba(236, 72, 153, 0.4)",
  },
  { 
    id: "settings", 
    label: "Settings", 
    icon: Settings,
    gradient: "linear-gradient(135deg, #64748B 0%, #475569 100%)",
    shadow: "rgba(100, 116, 139, 0.4)",
  },
];

const getToolById = (id: string) => tools.find(t => t.id === id);

// =============================================================================
// TAB COMPONENT
// =============================================================================

function TabItem({ 
  tab, 
  isActive, 
  onSelect, 
  onClose 
}: { 
  tab: Tab; 
  isActive: boolean; 
  onSelect: () => void; 
  onClose?: () => void;
}) {
  const tool = tab.toolId ? getToolById(tab.toolId) : null;
  const Icon = tab.icon || tool?.icon || Code;

  return (
    <button
      onClick={onSelect}
      className={`
        group flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg
        transition-all duration-200 relative min-w-[120px] max-w-[200px]
        ${isActive 
          ? "bg-white text-stone-800 shadow-sm" 
          : "bg-stone-100/50 text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        }
      `}
      style={{
        borderBottom: isActive ? '2px solid white' : '2px solid transparent',
        marginBottom: isActive ? '-2px' : '0',
      }}
    >
      {/* Icon */}
      <div 
        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
        style={tool ? {
          background: tool.gradient,
          boxShadow: `0 2px 4px -1px ${tool.shadow}`,
        } : {
          background: tab.type === 'chat' 
            ? 'linear-gradient(135deg, #D4A69C 0%, #C4918A 100%)'
            : 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
        }}
      >
        <Icon className="w-3 h-3 text-white" />
      </div>
      
      {/* Title */}
      <span className="truncate">{tab.title}</span>
      
      {/* Close button */}
      {tab.closable && onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={`
            ml-auto p-0.5 rounded transition-all
            ${isActive 
              ? "opacity-60 hover:opacity-100 hover:bg-stone-200" 
              : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-stone-200"
            }
          `}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </button>
  );
}

// =============================================================================
// FAVORITES BAR
// =============================================================================

function FavoritesBar({ 
  favorites, 
  onOpenTool 
}: { 
  favorites: string[]; 
  onOpenTool: (toolId: string) => void;
}) {
  if (favorites.length === 0) return null;

  return (
    <div 
      className="flex items-center gap-1 px-3 py-1.5 border-b"
      style={{ 
        background: 'linear-gradient(180deg, #FAFAF9 0%, #F5F5F4 100%)',
        borderColor: 'rgba(61, 56, 51, 0.06)',
      }}
    >
      {favorites.map(toolId => {
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
// TOOL CONTENT RENDERER
// =============================================================================

function ToolContent({ toolId }: { toolId: string }) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const loadComponent = async () => {
      try {
        let mod;
        switch (toolId) {
          case "dashboard":
            mod = await import("@/components/tools/DashboardTool");
            break;
          case "budget":
            mod = await import("@/components/tools/BudgetTool");
            break;
          case "guests":
            mod = await import("@/components/tools/GuestsTool");
            break;
          case "vendors":
            mod = await import("@/components/tools/VendorsTool");
            break;
          case "timeline":
            mod = await import("@/components/tools/TimelineTool");
            break;
          case "checklist":
            mod = await import("@/components/tools/ChecklistTool");
            break;
          case "inspo":
            mod = await import("@/components/tools/InspoTool");
            break;
          case "settings":
            mod = await import("@/components/tools/SettingsTool");
            break;
        }
        if (mod?.default) {
          setComponent(() => mod.default);
        }
      } catch (err) {
        console.error("Failed to load component:", err);
      } finally {
        setLoading(false);
      }
    };
    loadComponent();
  }, [toolId]);

  const tool = getToolById(toolId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div 
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: tool?.gradient || '#D4A69C', animationDelay: '0ms' }}
          />
          <div 
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: tool?.gradient || '#D4A69C', animationDelay: '150ms' }}
          />
          <div 
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: tool?.gradient || '#D4A69C', animationDelay: '300ms' }}
          />
        </div>
      </div>
    );
  }

  if (!Component) {
    return <div className="p-8 text-center text-stone-500">Could not load content</div>;
  }

  return <Component />;
}

// =============================================================================
// ARTIFACT RUNNER (for dynamic code widgets)
// =============================================================================

function ArtifactRunner({ code, title }: { code: string; title: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // For now, display the code. In production, this would render the component.
  // The artifact system already handles React component rendering.
  
  return (
    <div className="h-full flex flex-col bg-stone-900 text-stone-100">
      {/* Artifact header */}
      <div className="flex items-center justify-between px-4 py-2 bg-stone-800 border-b border-stone-700">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-stone-700 transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* Code display / runner */}
      <div className="flex-1 overflow-auto p-4">
        {error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <pre className="text-sm text-emerald-300 font-mono whitespace-pre-wrap">
            {code}
          </pre>
        )}
      </div>
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
  
  const initials = session?.user?.name
    ?.split(" ")
    .map(n => n[0])
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
            background: 'linear-gradient(135deg, #D4A69C 0%, #C4918A 100%)',
            boxShadow: '0 2px 6px -1px rgba(196, 145, 138, 0.4)',
          }}
        >
          {initials}
        </div>
        <ChevronDown 
          className="w-3.5 h-3.5 text-stone-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            className="absolute right-0 top-full mt-2 w-56 rounded-xl py-1 z-50"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFCFA 100%)',
              boxShadow: '0 12px 32px -8px rgba(61, 56, 51, 0.2), 0 4px 12px -4px rgba(61, 56, 51, 0.1)',
              border: '1px solid rgba(61, 56, 51, 0.06)',
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(61, 56, 51, 0.06)' }}>
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
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFCFA 100%)',
              boxShadow: '0 12px 32px -8px rgba(61, 56, 51, 0.2), 0 4px 12px -4px rgba(61, 56, 51, 0.1)',
              border: '1px solid rgba(61, 56, 51, 0.06)',
            }}
          >
            {tools.map(tool => (
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
// BROWSER CHROME (the shell)
// =============================================================================

function BrowserChrome({ children }: { children: React.ReactNode }) {
  const browser = useBrowser();
  const activeTab = browser.tabs.find(t => t.id === browser.activeTabId);
  const canGoBack = browser.historyIndex > 0;
  const canGoForward = browser.historyIndex < browser.history.length - 1;

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      {/* Title bar / Tab bar */}
      <div 
        className="flex items-end gap-1 px-2 pt-2"
        style={{
          background: 'linear-gradient(180deg, #E7E5E4 0%, #D6D3D1 100%)',
        }}
      >
        {/* Tabs */}
        <div className="flex items-end gap-0.5 flex-1 overflow-x-auto pb-0">
          {browser.tabs.map(tab => (
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
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%)',
          borderColor: 'rgba(61, 56, 51, 0.08)',
        }}
      >
        {/* Nav buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={browser.goBack}
            disabled={!canGoBack}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{ color: canGoBack ? '#57534e' : '#a8a29e' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={browser.goForward}
            disabled={!canGoForward}
            className="p-1.5 rounded-lg transition-all disabled:opacity-30"
            style={{ color: canGoForward ? '#57534e' : '#a8a29e' }}
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
            background: 'linear-gradient(135deg, #F5F5F4 0%, #E7E5E4 100%)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
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
          {activeTab?.type === 'chat' && (
            <AisleLogo size={16} className="text-rose-400 flex-shrink-0" />
          )}
          {activeTab?.type === 'artifact' && (
            <Code className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          )}
          <span className="text-sm text-stone-600 truncate">
            {activeTab?.type === 'chat' && 'aisle://chat'}
            {activeTab?.type === 'tool' && `aisle://${activeTab.toolId}`}
            {activeTab?.type === 'artifact' && `aisle://artifact/${activeTab.title.toLowerCase().replace(/\s+/g, '-')}`}
          </span>
          
          {/* Favorite button for tools */}
          {activeTab?.toolId && (
            <button
              onClick={() => browser.toggleFavorite(activeTab.toolId!)}
              className="ml-auto p-1 rounded hover:bg-stone-200 transition-colors"
            >
              <Star 
                className={`w-4 h-4 ${browser.favorites.includes(activeTab.toolId) ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Favorites bar */}
      <FavoritesBar favorites={browser.favorites} onOpenTool={browser.openTool} />

      {/* Content area */}
      <div className="flex-1 overflow-hidden bg-white">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN APP SHELL WITH BROWSER PROVIDER
// =============================================================================

export function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize with chat tab
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "chat",
      type: "chat",
      title: "Chat",
      icon: AisleLogo as unknown as React.ComponentType<{ className?: string }>,
      closable: false,
    }
  ]);
  const [activeTabId, setActiveTabId] = useState("chat");
  const [history, setHistory] = useState<string[]>(["chat"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aisle-favorites');
      return saved ? JSON.parse(saved) : ['dashboard', 'budget'];
    }
    return ['dashboard', 'budget'];
  });

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('aisle-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const openTab = useCallback((tabData: Omit<Tab, "id">) => {
    const id = `tab-${Date.now()}`;
    const newTab: Tab = { ...tabData, id };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(id);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), id]);
    setHistoryIndex(prev => prev + 1);
    return id;
  }, [historyIndex]);

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (tabId === activeTabId && newTabs.length > 0) {
        // Switch to the tab before this one, or the first tab
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newIndex = Math.max(0, closedIndex - 1);
        setActiveTabId(newTabs[newIndex].id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  const switchTab = useCallback((tabId: string) => {
    if (tabId !== activeTabId) {
      setActiveTabId(tabId);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), tabId]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [activeTabId, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const tabId = history[newIndex];
      // Check if tab still exists
      if (tabs.find(t => t.id === tabId)) {
        setHistoryIndex(newIndex);
        setActiveTabId(tabId);
      }
    }
  }, [historyIndex, history, tabs]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const tabId = history[newIndex];
      if (tabs.find(t => t.id === tabId)) {
        setHistoryIndex(newIndex);
        setActiveTabId(tabId);
      }
    }
  }, [historyIndex, history, tabs]);

  const goHome = useCallback(() => {
    switchTab("chat");
  }, [switchTab]);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  const openTool = useCallback((toolId: string) => {
    // Check if tool is already open
    const existingTab = tabs.find(t => t.type === 'tool' && t.toolId === toolId);
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
  }, [tabs, switchTab, openTab]);

  const createArtifactTab = useCallback((title: string, code: string) => {
    return openTab({
      type: "artifact",
      title,
      icon: Code,
      closable: true,
      artifactData: { code, title },
    });
  }, [openTab]);

  const browserContext: BrowserContextType = {
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
    createArtifactTab,
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <BrowserContext.Provider value={browserContext}>
      <BrowserChrome>
        {/* Render content based on active tab */}
        <div className="h-full overflow-auto">
          {activeTab?.type === 'chat' && children}
          {activeTab?.type === 'tool' && activeTab.toolId && (
            <ToolContent toolId={activeTab.toolId} />
          )}
          {activeTab?.type === 'artifact' && activeTab.artifactData && (
            <ArtifactRunner 
              code={activeTab.artifactData.code} 
              title={activeTab.artifactData.title} 
            />
          )}
        </div>
      </BrowserChrome>
    </BrowserContext.Provider>
  );
}

export default AppShell;
