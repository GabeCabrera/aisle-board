"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Home,
  LayoutGrid,
  MessageCircle,
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
  User
} from "lucide-react";

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
    description: "Your wedding overview",
    icon: LayoutDashboard,
    gradient: "linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)",
    shadow: "rgba(244, 63, 94, 0.4)",
  },
  { 
    id: "budget", 
    label: "Budget", 
    description: "Track expenses",
    icon: DollarSign,
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    shadow: "rgba(16, 185, 129, 0.4)",
  },
  { 
    id: "guests", 
    label: "Guests", 
    description: "Manage RSVPs",
    icon: Users,
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    shadow: "rgba(59, 130, 246, 0.4)",
  },
  { 
    id: "vendors", 
    label: "Vendors", 
    description: "Your team",
    icon: Store,
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    shadow: "rgba(139, 92, 246, 0.4)",
  },
  { 
    id: "timeline", 
    label: "Timeline", 
    description: "Day-of schedule",
    icon: Calendar,
    gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    shadow: "rgba(245, 158, 11, 0.4)",
  },
  { 
    id: "checklist", 
    label: "Checklist", 
    description: "To-do list",
    icon: CheckCircle,
    gradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
    shadow: "rgba(20, 184, 166, 0.4)",
  },
  { 
    id: "inspo", 
    label: "Inspo", 
    description: "Save ideas",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    shadow: "rgba(236, 72, 153, 0.4)",
  },
  { 
    id: "settings", 
    label: "Settings", 
    description: "Preferences",
    icon: Settings,
    gradient: "linear-gradient(135deg, #64748B 0%, #475569 100%)",
    shadow: "rgba(100, 116, 139, 0.4)",
  },
];

// =============================================================================
// BOTTOM SHEET (Pinterest-style slide up)
// =============================================================================

function BottomSheet({ 
  isOpen, 
  onClose, 
  children,
  title
}: { 
  isOpen: boolean; 
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: 'rgba(61, 56, 51, 0.4)' }}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`absolute inset-x-0 bottom-0 rounded-t-3xl transition-transform duration-300 ease-out ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ 
          maxHeight: "85vh",
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFCFA 100%)',
          boxShadow: '0 -12px 48px -12px rgba(61, 56, 51, 0.25), 0 -4px 16px -4px rgba(61, 56, 51, 0.1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div 
            className="w-10 h-1.5 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #DDD8CF 0%, #CEC7BC 100%)',
              boxShadow: 'inset 0 1px 2px rgba(61, 56, 51, 0.1)',
            }}
          />
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-6 pb-4">
            <h2 className="font-serif text-xl text-stone-800">{title}</h2>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 60px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FULL SCREEN MODAL (for tools)
// =============================================================================

function FullScreenModal({ 
  isOpen, 
  onClose, 
  toolId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  toolId: string;
}) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const tool = tools.find(t => t.id === toolId);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsAnimating(true));
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
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
  }, [isOpen, toolId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Modal slides up from bottom on mobile, fades in on desktop */}
      <div 
        className={`
          absolute inset-0
          transition-all duration-300 ease-out
          md:inset-4 md:rounded-3xl
          ${isAnimating 
            ? "translate-y-0 opacity-100" 
            : "translate-y-full md:translate-y-0 md:opacity-0 md:scale-95"
          }
        `}
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFCFA 100%)',
          boxShadow: '0 24px 64px -16px rgba(61, 56, 51, 0.25), 0 8px 24px -8px rgba(61, 56, 51, 0.1)',
        }}
      >
        {/* Header */}
        <div 
          className="sticky top-0 z-10 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(253,252,250,0.9) 100%)',
            borderBottom: '1px solid rgba(61, 56, 51, 0.06)',
          }}
        >
          <div className="flex items-center justify-between px-4 h-14 md:h-16">
            {/* Back/Close button */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 -ml-2 p-2 rounded-xl transition-all duration-200 hover:-translate-x-0.5"
              style={{
                color: '#6B6560',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(61, 56, 51, 0.05)';
                e.currentTarget.style.color = '#3D3833';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6B6560';
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="text-sm font-medium hidden sm:inline">Back</span>
            </button>
            
            {/* Title */}
            <div className="flex items-center gap-2.5">
              {tool && (
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: tool.gradient,
                    boxShadow: `0 4px 12px -2px ${tool.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}
                >
                  <tool.icon className="w-5 h-5 text-white drop-shadow-sm" />
                </div>
              )}
              <h2 className="font-serif text-lg text-stone-800">{tool?.label}</h2>
            </div>
            
            {/* Spacer */}
            <div className="w-16" />
          </div>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-3.5rem)] md:h-[calc(100%-4rem)]">
          {loading ? (
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
          ) : Component ? (
            <Component />
          ) : (
            <div className="p-8 text-center text-stone-500">Could not load content</div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TOOLS GRID (Pinterest board-style)
// =============================================================================

function ToolsGrid({ onSelectTool }: { onSelectTool: (id: string) => void }) {
  return (
    <div className="p-4 pb-8">
      <div className="grid grid-cols-4 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className="flex flex-col items-center p-3 rounded-2xl transition-all duration-300 group hover:-translate-y-1"
            style={{
              background: 'transparent',
            }}
          >
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110 group-active:scale-95"
              style={{
                background: tool.gradient,
                boxShadow: `0 6px 16px -4px ${tool.shadow}, 0 2px 4px -1px ${tool.shadow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              }}
            >
              <tool.icon className="w-7 h-7 text-white drop-shadow-sm" />
            </div>
            <span className="text-xs font-medium text-stone-700 text-center leading-tight">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PROFILE MENU
// =============================================================================

function ProfileMenu({ onSelectTool }: { onSelectTool: (id: string) => void }) {
  const { data: session } = useSession();
  
  const initials = session?.user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="p-4 pb-8">
      {/* User info card */}
      <div 
        className="flex items-center gap-4 p-4 rounded-2xl mb-4"
        style={{
          background: 'linear-gradient(135deg, #F8F6F3 0%, #F2EFEA 100%)',
          boxShadow: 'inset 0 1px 2px rgba(61, 56, 51, 0.05)',
        }}
      >
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-medium"
          style={{
            background: 'linear-gradient(135deg, #D4A69C 0%, #C4918A 100%)',
            boxShadow: '0 4px 12px -2px rgba(196, 145, 138, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-800 truncate">{session?.user?.name}</p>
          <p className="text-sm text-stone-500 truncate">{session?.user?.email}</p>
        </div>
      </div>
      
      {/* Menu items */}
      <div className="space-y-1">
        <button
          onClick={() => onSelectTool("settings")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          style={{ color: '#4A4540' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(61, 56, 51, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <User className="w-5 h-5 text-stone-500" />
          <span>Account Settings</span>
        </button>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-600"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// BOTTOM NAV (Pinterest-style with depth)
// =============================================================================

function BottomNav({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = [
    { id: "chat", icon: MessageCircle, label: "Chat" },
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "tools", icon: LayoutGrid, label: "Tools" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 pb-safe"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 -4px 24px -4px rgba(61, 56, 51, 0.1), 0 -1px 0 rgba(61, 56, 51, 0.05)',
      }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center w-16 h-full transition-all duration-200"
            >
              <div 
                className="p-2 rounded-2xl transition-all duration-300"
                style={{
                  background: isActive ? 'linear-gradient(135deg, #FAF0EE 0%, #F5E1DD 100%)' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px -2px rgba(212, 166, 156, 0.3), inset 0 1px 0 rgba(255,255,255,0.8)' : 'none',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                <tab.icon 
                  className="w-6 h-6 transition-all"
                  style={{ 
                    color: isActive ? '#C4918A' : '#9C9691',
                    strokeWidth: isActive ? 2.5 : 2,
                  }}
                />
              </div>
              <span 
                className="text-[10px] font-medium mt-0.5 transition-all"
                style={{ 
                  color: isActive ? '#C4918A' : '#9C9691',
                  opacity: isActive ? 1 : 0.8,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// =============================================================================
// DESKTOP HEADER
// =============================================================================

function DesktopHeader({ onOpenTool }: { onOpenTool: (id: string) => void }) {
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  
  const initials = session?.user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <header 
      className="hidden md:flex fixed top-0 left-0 right-0 h-16 z-40"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(253,252,250,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px -4px rgba(61, 56, 51, 0.08), 0 1px 0 rgba(61, 56, 51, 0.04)',
      }}
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div 
            className="p-1.5 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, #FAF0EE 0%, #F5E1DD 100%)',
              boxShadow: '0 2px 8px -2px rgba(212, 166, 156, 0.3)',
            }}
          >
            <AisleLogo size={28} className="text-rose-400" />
          </div>
          <span className="font-serif text-xl text-stone-800">Aisle</span>
        </div>

        {/* Center nav */}
        <div 
          className="flex items-center gap-1 p-1.5 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #F8F6F3 0%, #F2EFEA 100%)',
            boxShadow: 'inset 0 1px 2px rgba(61, 56, 51, 0.06)',
          }}
        >
          {tools.slice(0, 6).map((tool) => (
            <button
              key={tool.id}
              onClick={() => onOpenTool(tool.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{ color: '#6B6560' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #FDFCFA 100%)';
                e.currentTarget.style.color = '#3D3833';
                e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(61, 56, 51, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6B6560';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <tool.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-full transition-all duration-200"
            style={{
              background: profileOpen ? 'rgba(61, 56, 51, 0.05)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!profileOpen) e.currentTarget.style.background = 'rgba(61, 56, 51, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!profileOpen) e.currentTarget.style.background = 'transparent';
            }}
          >
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #D4A69C 0%, #C4918A 100%)',
                boxShadow: '0 2px 8px -2px rgba(196, 145, 138, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {initials}
            </div>
            <ChevronDown 
              className="w-4 h-4 text-stone-500 transition-transform duration-200"
              style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div 
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl py-2 z-50"
                style={{
                  background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFCFA 100%)',
                  boxShadow: '0 12px 32px -8px rgba(61, 56, 51, 0.2), 0 4px 12px -4px rgba(61, 56, 51, 0.1)',
                  border: '1px solid rgba(61, 56, 51, 0.06)',
                  animation: 'fadeInScale 0.2s ease-out',
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(61, 56, 51, 0.06)' }}>
                  <p className="font-medium text-stone-800 truncate">{session?.user?.name}</p>
                  <p className="text-sm text-stone-500 truncate">{session?.user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      onOpenTool("settings");
                      setProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors"
                    style={{ color: '#6B6560' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(61, 56, 51, 0.05)';
                      e.currentTarget.style.color = '#3D3833';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#6B6560';
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// MAIN APP SHELL
// =============================================================================

export function AppShell({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("chat");
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "tools") {
      setToolsSheetOpen(true);
    } else if (tab === "profile") {
      setProfileSheetOpen(true);
    } else if (tab === "dashboard") {
      setActiveModal("dashboard");
      setActiveTab("chat");
    } else {
      setActiveTab(tab);
    }
  }, []);

  const handleSelectTool = useCallback((toolId: string) => {
    setToolsSheetOpen(false);
    setProfileSheetOpen(false);
    setActiveModal(toolId);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Desktop header */}
      <DesktopHeader onOpenTool={handleSelectTool} />
      
      {/* Main content */}
      <main className="pb-20 md:pb-0 md:pt-16">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Tools bottom sheet (mobile) */}
      <BottomSheet 
        isOpen={toolsSheetOpen} 
        onClose={() => setToolsSheetOpen(false)}
        title="Tools"
      >
        <ToolsGrid onSelectTool={handleSelectTool} />
      </BottomSheet>

      {/* Profile bottom sheet (mobile) */}
      <BottomSheet 
        isOpen={profileSheetOpen} 
        onClose={() => setProfileSheetOpen(false)}
        title="Profile"
      >
        <ProfileMenu onSelectTool={handleSelectTool} />
      </BottomSheet>

      {/* Tool modal */}
      {activeModal && (
        <FullScreenModal 
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          toolId={activeModal}
        />
      )}

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default AppShell;
