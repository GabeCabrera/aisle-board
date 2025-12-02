"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/logo";
import { ConciergeChat, ConciergeTrigger } from "@/components/concierge-chat";
import { 
  BookOpen, Menu, Users, DollarSign, ArrowRight
} from "lucide-react";

interface WeddingStats {
  daysUntil: number | null;
  isToday: boolean;
  coupleNames: string | null;
  weddingDate: string | null;
  plannerName: string | null;
  guestStats: {
    total: number;
    confirmed: number;
    pending: number;
  };
  budgetStats: {
    totalBudget: number;
    totalPaid: number;
    totalRemaining: number;
  };
}

interface HomeClientProps {
  displayName: string;
  plannerName: string;
  hasStartedPlanning: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function HomeClient({ displayName, plannerName, hasStartedPlanning }: HomeClientProps) {
  const [stats, setStats] = useState<WeddingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/wedding-stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const firstName = displayName?.split("&")[0]?.trim() || "there";

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-warm-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="sm" href="/" />
          
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/planner"
              className="text-sm text-warm-600 hover:text-warm-800 transition-colors"
            >
              Planner
            </Link>
            <Link
              href="/settings"
              className="text-sm text-warm-600 hover:text-warm-800 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
            >
              Sign out
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -mr-2 hover:bg-warm-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-warm-600" />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-warm-100 bg-white px-6 py-4 space-y-4">
            <Link href="/planner" className="block text-sm text-warm-600" onClick={() => setMenuOpen(false)}>
              Planner
            </Link>
            <Link href="/settings" className="block text-sm text-warm-600" onClick={() => setMenuOpen(false)}>
              Settings
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="block text-sm text-warm-400">
              Sign out
            </button>
          </div>
        )}
      </header>

      {/* Main Content - Simple & Focused */}
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-warm-200 border-t-warm-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Greeting */}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-warm-800 mb-3">
                Hey, {firstName}
              </h1>
              {stats?.daysUntil && stats.daysUntil > 0 ? (
                <p className="text-lg text-warm-500">
                  {stats.daysUntil} days until your wedding
                </p>
              ) : stats?.isToday ? (
                <p className="text-lg text-warm-500">
                  Today's the day! 🎉
                </p>
              ) : (
                <p className="text-lg text-warm-500">
                  Let's make some progress today
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4">
              <Link
                href="/planner"
                className="group flex items-center justify-between p-6 bg-white rounded-2xl border border-warm-200 hover:border-warm-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-warm-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-warm-800">Open your planner</h3>
                    <p className="text-sm text-warm-500">Budget, guests, timeline, and more</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-warm-400 group-hover:text-warm-600 transition-colors" />
              </Link>

              <button
                onClick={() => setConciergeOpen(true)}
                className="group flex items-center justify-between p-6 bg-gradient-to-br from-purple-50 to-rose-50 rounded-2xl border border-purple-100 hover:border-purple-200 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-warm-800">Chat with {plannerName}</h3>
                    <p className="text-sm text-warm-500">Ask anything about your wedding</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-warm-400 group-hover:text-warm-600 transition-colors" />
              </button>
            </div>

            {/* At a Glance - Only if they have data */}
            {stats && (stats.guestStats.total > 0 || stats.budgetStats.totalBudget > 0) && (
              <div>
                <h2 className="text-sm font-medium text-warm-400 uppercase tracking-wider mb-4">
                  At a glance
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {stats.budgetStats.totalBudget > 0 && (
                    <Link
                      href="/planner/budget"
                      className="p-5 bg-white rounded-xl border border-warm-200 hover:border-warm-300 transition-colors"
                    >
                      <DollarSign className="w-5 h-5 text-green-500 mb-3" />
                      <p className="text-2xl font-light text-warm-800">
                        {formatCurrency(stats.budgetStats.totalRemaining)}
                      </p>
                      <p className="text-sm text-warm-500">remaining</p>
                    </Link>
                  )}
                  {stats.guestStats.total > 0 && (
                    <Link
                      href="/planner/guest-list"
                      className="p-5 bg-white rounded-xl border border-warm-200 hover:border-warm-300 transition-colors"
                    >
                      <Users className="w-5 h-5 text-blue-500 mb-3" />
                      <p className="text-2xl font-light text-warm-800">
                        {stats.guestStats.confirmed}
                        <span className="text-lg text-warm-400">/{stats.guestStats.total}</span>
                      </p>
                      <p className="text-sm text-warm-500">confirmed</p>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Gentle prompt if they haven't started */}
            {!hasStartedPlanning && (
              <div className="text-center py-8">
                <p className="text-warm-500 mb-4">
                  Not sure where to begin?
                </p>
                <button
                  onClick={() => setConciergeOpen(true)}
                  className="text-warm-700 hover:text-warm-900 underline underline-offset-4"
                >
                  Just ask {plannerName}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat */}
      <ConciergeChat
        isOpen={conciergeOpen}
        onClose={() => setConciergeOpen(false)}
        coupleNames={displayName}
        plannerName={plannerName}
      />
      {!conciergeOpen && (
        <ConciergeTrigger onClick={() => setConciergeOpen(true)} plannerName={plannerName} />
      )}
    </main>
  );
}
