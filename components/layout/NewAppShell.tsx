"use client";

import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  CreditCard,
  CheckSquare,
  Users,
  Store,
  Sparkles,
  Calendar,
  User,
  CalendarRange,
  Armchair
} from 'lucide-react';

import {
  BrowserProvider,
  useBrowser,
  tools,
} from "./browser-context";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { ScribeChat, ScribeTrigger } from "../scribe-chat";
import { cn } from "@/lib/utils";

// Map tool IDs to Lucide icons
const TOOL_ICONS: Record<string, React.ElementType> = {
  "dashboard": LayoutDashboard,
  "budget": CreditCard,
  "checklist": CheckSquare,
  "guests": Users,
  "vendors": Store,
  "stem": Sparkles,
  "timeline": Calendar,
  "calendar": CalendarRange,
  "seating": Armchair,
  "settings": Settings,
  "chat": MessageSquare,
};

function MainContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isMobileOpen, setMobileOpen] = React.useState(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = React.useState(false);
  const browser = useBrowser();

  const handleToolClick = (toolId: string) => {
    browser.openTool(toolId);
    setMobileOpen(false);
  };

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Determine if we should show the floating chat (active when NOT on chat or settings)
  const showFloatingChat = browser.activeTabId !== 'scribe' && browser.activeTabId !== 'settings';

  const SidebarContent = () => (
    <nav className="flex flex-col h-full bg-canvas/50 border-r border-border backdrop-blur-xl" aria-label="Main navigation">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <span className="font-serif text-2xl font-medium tracking-tight text-foreground">Scribe & Stem</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 mb-6 font-medium",
            browser.activeTabId === 'chat'
              ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
          onClick={() => browser.goHome()}
          aria-current={browser.activeTabId === 'chat' ? "page" : undefined}
        >
          <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
          Chat
        </Button>

        <div className="px-3 pb-2">
          <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Planning</p>
        </div>

        {tools.map((tool) => {
          const Icon = tool.icon || TOOL_ICONS[tool.id] || LayoutDashboard;
          const isActive = browser.activeTabId === tool.id || browser.tabs.find(t => t.id === browser.activeTabId)?.toolId === tool.id;

          return (
            <Button
              key={tool.id}
              variant="ghost"
              className={cn(
                "w-full justify-start h-10 font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary translate-x-1"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:translate-x-1"
              )}
              onClick={() => handleToolClick(tool.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
              {tool.label}
            </Button>
          );
        })}
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-border/50 bg-white/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-12 px-2 hover:bg-white">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 font-medium text-sm border border-primary/20">
                {initials}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-medium truncate text-foreground">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => browser.openTool("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 flex-shrink-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-background md:hidden shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden bg-white/50">
        {/* Mobile Header */}
        <div className="md:hidden h-16 flex items-center px-4 border-b border-border bg-background/80 backdrop-blur-md z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="-ml-2"
            aria-label="Open navigation menu"
            aria-expanded={isMobileOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
          <span className="ml-2 font-serif text-lg font-medium">Scribe & Stem</span>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </div>

        {/* Floating Chat Bubble */}
        {showFloatingChat && (
          <>
            <ScribeChat 
              isOpen={isFloatingChatOpen} 
              onClose={() => setIsFloatingChatOpen(false)} 
            />
            <AnimatePresence>
              {!isFloatingChatOpen && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="fixed bottom-6 right-6 z-50"
                >
                  <ScribeTrigger onClick={() => setIsFloatingChatOpen(true)} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}

export function NewAppShell({ children }: { children: React.ReactNode }) {
  return (
    <BrowserProvider>
      <MainContent>{children}</MainContent>
    </BrowserProvider>
  );
}

export default NewAppShell;