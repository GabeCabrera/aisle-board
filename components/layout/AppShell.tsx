"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { X } from "lucide-react";

/**
 * Aisle App Shell - Modal-based navigation
 * Chat is the main view, everything else opens in modals
 */

export function AisleLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M 4 22 C 4 14, 8 12, 14 12 C 21 12, 24 15, 24 22 C 24 29, 20 32, 14 32 C 7 32, 4 28, 4 22" stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M 16 22 C 16 14, 20 12, 26 12 C 33 12, 36 15, 36 22 C 36 29, 32 32, 26 32 C 19 32, 16 28, 16 22" stroke="#D4A69C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Tool cards configuration
const tools = [
  { 
    id: "dashboard", 
    label: "Dashboard", 
    description: "Overview of your wedding",
    icon: "📊",
    color: "from-rose-500 to-pink-500"
  },
  { 
    id: "budget", 
    label: "Budget", 
    description: "Track spending & vendors",
    icon: "💰",
    color: "from-green-500 to-emerald-500"
  },
  { 
    id: "guests", 
    label: "Guests", 
    description: "Manage your guest list",
    icon: "👥",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "vendors", 
    label: "Vendors", 
    description: "Your vendor contacts",
    icon: "🏪",
    color: "from-purple-500 to-violet-500"
  },
  { 
    id: "timeline", 
    label: "Timeline", 
    description: "Day-of schedule",
    icon: "📅",
    color: "from-orange-500 to-amber-500"
  },
  { 
    id: "checklist", 
    label: "Checklist", 
    description: "Planning to-dos",
    icon: "✅",
    color: "from-teal-500 to-cyan-500"
  },
  { 
    id: "inspo", 
    label: "Inspo", 
    description: "Save your ideas",
    icon: "✨",
    color: "from-pink-500 to-rose-500"
  },
  { 
    id: "settings", 
    label: "Settings", 
    description: "Account & preferences",
    icon: "⚙️",
    color: "from-slate-500 to-gray-500"
  },
];

// Modal content components - we'll lazy load the actual content
function ModalContent({ toolId, onClose }: { toolId: string; onClose: () => void }) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Dynamic import based on tool
    const loadComponent = async () => {
      try {
        let mod;
        switch (toolId) {
          case "dashboard":
            mod = await import("@/app/(chat)/dashboard/page");
            break;
          case "budget":
            mod = await import("@/app/(chat)/budget/page");
            break;
          case "guests":
            mod = await import("@/app/(chat)/guests/page");
            break;
          case "vendors":
            mod = await import("@/app/(chat)/vendors/page");
            break;
          case "timeline":
            mod = await import("@/app/(chat)/timeline/page");
            break;
          case "checklist":
            mod = await import("@/app/(chat)/checklist/page");
            break;
          case "inspo":
            mod = await import("@/app/(chat)/inspo/page");
            break;
          case "settings":
            mod = await import("@/app/(chat)/settings/page");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-stone-400">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (!Component) {
    return <div className="p-8 text-center text-stone-500">Could not load content</div>;
  }

  return <Component />;
}

// Full screen modal
function ToolModal({ 
  toolId, 
  onClose 
}: { 
  toolId: string; 
  onClose: () => void;
}) {
  const tool = tools.find(t => t.id === toolId);
  
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] mt-[5vh] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tool?.icon}</span>
            <div>
              <h2 className="font-serif text-xl text-stone-800">{tool?.label}</h2>
              <p className="text-sm text-stone-500">{tool?.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <ModalContent toolId={toolId} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

// Tools dropdown menu
function ToolsMenu({ 
  isOpen, 
  onClose, 
  onSelectTool 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSelectTool: (id: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Menu */}
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                onSelectTool(tool.id);
                onClose();
              }}
              className="flex flex-col items-start p-3 rounded-lg hover:bg-stone-50 transition-all group text-left"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform`}>
                {tool.icon}
              </div>
              <span className="font-medium text-sm text-stone-800">{tool.label}</span>
              <span className="text-xs text-stone-500 line-clamp-1">{tool.description}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = session?.user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-stone-200 z-30 flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <AisleLogo size={32} />
          <span className="font-serif text-lg text-stone-800">Aisle</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Tools button */}
          <div className="relative">
            <button
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                ${toolsMenuOpen 
                  ? "bg-rose-100 text-rose-700" 
                  : "hover:bg-stone-100 text-stone-600"
                }
              `}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span className="text-sm font-medium">Tools</span>
            </button>
            
            <ToolsMenu 
              isOpen={toolsMenuOpen}
              onClose={() => setToolsMenuOpen(false)}
              onSelectTool={(id) => setActiveModal(id)}
            />
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-sm font-medium">
                {initials}
              </div>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <p className="text-sm font-medium text-stone-800 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-stone-500 truncate">{session?.user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModal("settings");
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => signOut()}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content area - full screen for chat */}
      <main className="pt-14">
        {children}
      </main>

      {/* Tool Modal */}
      {activeModal && (
        <ToolModal 
          toolId={activeModal} 
          onClose={() => setActiveModal(null)} 
        />
      )}
    </div>
  );
}

export default AppShell;
