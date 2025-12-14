"use client";

import * as React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
  CreditCard,
  CheckSquare,
  Users,
  Store,
  Sparkles,
  Calendar,
  CalendarRange,
  Armchair,
  ChevronDown,
  Compass,
  User,
  Mail,
  Activity
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

interface NavItemWithChildren extends NavItem {
  children?: NavItem[];
}

// Main nav items (before Stem)
const NAV_ITEMS_BEFORE_STEM: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/planner" },
  { id: "budget", label: "Budget", icon: CreditCard, href: "/planner/budget" },
  { id: "checklist", label: "Checklist", icon: CheckSquare, href: "/planner/checklist" },
  { id: "guests", label: "Guests", icon: Users, href: "/planner/guests" },
  { id: "vendors", label: "Vendors", icon: Store, href: "/planner/vendors" },
];

// Stem has its own expandable section
const STEM_NAV: NavItemWithChildren = {
  id: "stem",
  label: "Stem",
  icon: Sparkles,
  href: "/planner/stem",
  children: [
    { id: "stem-explore", label: "Explore", icon: Compass, href: "/planner/stem/explore" },
    { id: "stem-profile", label: "Profile", icon: User, href: "/planner/stem" },
    { id: "stem-messages", label: "Messages", icon: Mail, href: "/planner/stem/messages" },
    { id: "stem-activity", label: "Activity", icon: Activity, href: "/planner/stem/activity" },
  ],
};

// Nav items after Stem
const NAV_ITEMS_AFTER_STEM: NavItem[] = [
  { id: "timeline", label: "Timeline", icon: Calendar, href: "/planner/timeline" },
  { id: "calendar", label: "Calendar", icon: CalendarRange, href: "/planner/calendar" },
  { id: "seating", label: "Seating", icon: Armchair, href: "/planner/seating" },
];

function SidebarContent({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Stem expanded state with localStorage persistence
  const [stemExpanded, setStemExpanded] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stem-nav-expanded');
      return saved !== null ? saved === 'true' : true; // Default expanded
    }
    return true;
  });

  // Auto-expand if on a stem route
  React.useEffect(() => {
    if (pathname?.startsWith('/planner/stem')) {
      setStemExpanded(true);
    }
  }, [pathname]);

  // Persist expanded state
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stem-nav-expanded', String(stemExpanded));
    }
  }, [stemExpanded]);

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const isStemActive = pathname?.startsWith('/planner/stem');

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    return (
      <Link key={item.id} href={item.href} onClick={onClose}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 font-medium transition-all duration-200",
            isActive
              ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary translate-x-1"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:translate-x-1"
          )}
        >
          <item.icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
          {item.label}
        </Button>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-canvas/50 border-r border-border backdrop-blur-xl">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <span className="font-serif text-2xl font-medium tracking-tight text-foreground">Scribe & Stem</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <Link href="/planner/chat" onClick={onClose}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 mb-6 font-medium",
              pathname === '/planner/chat'
                ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
        </Link>

        <div className="px-3 pb-2">
          <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Planning</p>
        </div>

        {/* Nav items before Stem */}
        {NAV_ITEMS_BEFORE_STEM.map(renderNavItem)}

        {/* Stem expandable section */}
        <div className="py-1">
          <Button
            variant="ghost"
            onClick={() => setStemExpanded(!stemExpanded)}
            className={cn(
              "w-full justify-start h-10 font-medium transition-all duration-200",
              isStemActive
                ? "bg-white text-primary shadow-sm hover:bg-white hover:text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Sparkles className={cn("mr-2 h-4 w-4", isStemActive ? "text-primary" : "text-muted-foreground")} />
            <span className="flex-1 text-left">Stem</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                stemExpanded ? "rotate-180" : ""
              )}
            />
          </Button>

          {/* Stem sub-items */}
          <AnimatePresence initial={false}>
            {stemExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pl-4 pt-1 space-y-0.5">
                  {STEM_NAV.children?.map((child) => {
                    const isChildActive = pathname === child.href ||
                      (child.href === '/planner/stem' && pathname === '/planner/stem');
                    return (
                      <Link key={child.id} href={child.href} onClick={onClose}>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start h-9 font-medium text-sm transition-all duration-200",
                            isChildActive
                              ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <child.icon className={cn("mr-2 h-3.5 w-3.5", isChildActive ? "text-primary" : "text-muted-foreground")} />
                          {child.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items after Stem */}
        {NAV_ITEMS_AFTER_STEM.map(renderNavItem)}
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
            <Link href="/planner/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block md:w-64 lg:w-72 flex-shrink-0 z-30">
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
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-background md:hidden shadow-2xl"
            >
              <SidebarContent mobile onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden bg-white/50">
        {/* Mobile Header */}
        <div className="md:hidden h-16 flex items-center px-4 border-b border-border bg-background/80 backdrop-blur-md z-20">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="-ml-2">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-2 font-serif text-lg font-medium">Scribe & Stem</span>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
