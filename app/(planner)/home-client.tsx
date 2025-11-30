"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface HomeClientProps {
  displayName: string;
  hasStartedPlanning: boolean;
}

export function HomeClient({ displayName, hasStartedPlanning }: HomeClientProps) {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-warm-200">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-serif tracking-widest uppercase">Aisle</h1>
          <span className="text-warm-400">|</span>
          <span className="text-sm text-warm-500">{displayName}</span>
        </div>
        <Link
          href="/settings"
          className="flex items-center gap-2 text-xs tracking-wider uppercase text-warm-500 hover:text-warm-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-px bg-warm-400 mx-auto mb-8" />
          
          <h2 className="text-3xl font-serif font-light tracking-wide mb-4">
            {hasStartedPlanning ? "Welcome Back" : "Let's Get Started"}
          </h2>
          
          <p className="text-warm-500 mb-12">
            {hasStartedPlanning
              ? "Continue where you left off, or add new pages to your planner."
              : "Choose templates to build your perfect wedding planner."}
          </p>

          <div className="w-16 h-px bg-warm-400 mx-auto mb-12" />

          <Link href={hasStartedPlanning ? "/planner" : "/templates"}>
            <Button variant="outline" size="lg">
              {hasStartedPlanning ? "Open Planner" : "Begin Planning"}
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
