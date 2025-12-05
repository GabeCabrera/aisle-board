"use client";

import { useState, useEffect } from "react";
import { BrowserProvider } from "./browser-context";
import { MobileShell } from "./MobileShell";
import { DesktopShell } from "./AppShell";

// =============================================================================
// RESPONSIVE SHELL
// =============================================================================
// Detects screen size and renders appropriate shell:
// - Mobile (<768px): Safari/Chrome-style UI with bottom navigation
// - Desktop (≥768px): Browser-style tabs (renders children directly)

interface ResponsiveShellProps {
  children: React.ReactNode;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial state
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    // Listen for resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function ResponsiveShell({ children }: ResponsiveShellProps) {
  const isMobile = useIsMobile();

  // Show nothing while detecting (prevents flash)
  if (isMobile === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: "#D4A69C", animationDelay: "0ms" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: "#D4A69C", animationDelay: "150ms" }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full animate-bounce"
            style={{ background: "#D4A69C", animationDelay: "300ms" }}
          />
        </div>
      </div>
    );
  }

  return (
    <BrowserProvider>
      {isMobile ? (
        <MobileShell>{children}</MobileShell>
      ) : (
        <DesktopShell>{children}</DesktopShell>
      )}
    </BrowserProvider>
  );
}

export default ResponsiveShell;
