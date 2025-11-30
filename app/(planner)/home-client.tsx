"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { 
  Settings, BookOpen, Sparkles, Users, TrendingUp, 
  DollarSign, Calendar, Clock, Heart, Send, Plus,
  LayoutGrid, Mail, ExternalLink, ChevronRight,
  RefreshCw, Lightbulb, Palette, ArrowRight, LogOut, Menu,
  CheckCircle2, AlertCircle
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface WeddingStats {
  daysUntil: number | null;
  isToday: boolean;
  coupleNames: string | null;
  weddingDate: string | null;
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
  taskStats: {
    total: number;
    done: number;
    completionPercent: number;
  };
  vendorStats: {
    total: number;
    booked: number;
  };
  hasOverview: boolean;
}

interface InspirationData {
  displayName: string;
  daysUntil: number | null;
  phase: string;
  weddingDate: string | null;
  moodBoards: MoodBoard[];
  quickPrompts: string[];
  communityInsights: CommunityInsight[];
  nudges: PersonalizedNudge[];
  seasonal: {
    current: SeasonalIdea;
    weddingMonth: SeasonalIdea | null;
  };
  resources: Resource[];
}

interface MoodBoard {
  id: string;
  name: string;
  description: string;
  colors: string[];
  keywords: string[];
}

interface CommunityInsight {
  type: "stat" | "trend" | "tip";
  icon: string;
  title: string;
  description: string;
  source: "community";
}

interface PersonalizedNudge {
  type: "action" | "milestone" | "reminder";
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  priority: "high" | "medium" | "low";
}

interface SeasonalIdea {
  month: number;
  theme: string;
  ideas: string[];
  colorPalette: string[];
}

interface Resource {
  title: string;
  description: string;
  url: string;
  category: string;
}

interface HomeClientProps {
  displayName: string;
  hasStartedPlanning: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, TrendingUp, DollarSign, Calendar, Clock, Heart, Send, Plus, LayoutGrid, Mail, Sparkles, Lightbulb,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || Sparkles;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HomeClient({ displayName, hasStartedPlanning }: HomeClientProps) {
  const [stats, setStats] = useState<WeddingStats | null>(null);
  const [data, setData] = useState<InspirationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, inspirationsRes] = await Promise.all([
        fetch("/api/wedding-stats"),
        fetch("/api/inspirations"),
      ]);
      
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson);
      }
      
      if (inspirationsRes.ok) {
        const inspirationsJson = await inspirationsRes.json();
        setData(inspirationsJson);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Determine if we have meaningful data to show
  const hasData = stats && (
    stats.guestStats.total > 0 ||
    stats.budgetStats.totalBudget > 0 ||
    stats.taskStats.total > 0 ||
    stats.vendorStats.total > 0
  );

  return (
    <main className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="bg-white border-b border-warm-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <Link href="/" className="text-lg md:text-xl font-serif tracking-widest uppercase">
              Aisle
            </Link>
            <span className="text-warm-300 hidden sm:inline">|</span>
            <span className="text-sm text-warm-500 hidden sm:inline">{displayName}</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/settings"
              className="flex items-center gap-2 text-xs tracking-wider uppercase text-warm-500 hover:text-warm-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-xs tracking-wider uppercase text-warm-500 hover:text-warm-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 -mr-2 hover:bg-warm-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-warm-600" />
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-warm-200 bg-white px-4 py-3 space-y-3">
            <p className="text-sm text-warm-500">{displayName}</p>
            <Link
              href="/settings"
              className="flex items-center gap-2 text-sm text-warm-600 py-2"
              onClick={() => setMenuOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-sm text-warm-600 py-2 w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-warm-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {/* Hero Section with Dashboard */}
            <section className="bg-white rounded-xl shadow-sm border border-warm-200 overflow-hidden">
              {/* Hero Header */}
              <div className="bg-gradient-to-br from-rose-50 via-warm-50 to-amber-50 p-6 md:p-8 border-b border-warm-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-light tracking-wide mb-1">
                      {stats?.coupleNames || "Welcome back"}
                    </h1>
                    {stats?.weddingDate && (
                      <p className="text-sm md:text-base text-warm-500">
                        {formatDate(stats.weddingDate)}
                      </p>
                    )}
                  </div>
                  <Link href={hasStartedPlanning ? "/planner" : "/templates"} className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-warm-700 hover:bg-warm-800 text-white">
                      <BookOpen className="w-4 h-4 mr-2" />
                      {hasStartedPlanning ? "Open Planner" : "Start Planning"}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Stats Grid */}
              {hasStartedPlanning && stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-warm-200">
                  {/* Days Until */}
                  <div className="p-4 md:p-6 text-center hover:bg-warm-50 transition-colors">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-rose-400" />
                    {stats.daysUntil !== null ? (
                      <>
                        <p className="text-2xl md:text-3xl font-light text-warm-800 tabular-nums">
                          {stats.daysUntil > 0 ? stats.daysUntil : stats.isToday ? "🎉" : "✓"}
                        </p>
                        <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mt-1">
                          {stats.daysUntil > 0 ? "Days to Go" : stats.isToday ? "Today!" : "Married!"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl md:text-2xl font-light text-warm-300">—</p>
                        <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-400 mt-1">Set Date</p>
                      </>
                    )}
                  </div>

                  {/* Guests */}
                  <div className="p-4 md:p-6 text-center hover:bg-warm-50 transition-colors">
                    <Users className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-2xl md:text-3xl font-light text-warm-800 tabular-nums">
                      {stats.guestStats.confirmed}
                      {stats.guestStats.total > 0 && (
                        <span className="text-lg md:text-xl text-warm-400">/{stats.guestStats.total}</span>
                      )}
                    </p>
                    <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mt-1">
                      Confirmed
                    </p>
                  </div>

                  {/* Budget */}
                  <div className="p-4 md:p-6 text-center hover:bg-warm-50 transition-colors">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl md:text-3xl font-light text-warm-800 tabular-nums">
                      {stats.budgetStats.totalBudget > 0 
                        ? formatCurrency(stats.budgetStats.totalPaid).replace("$", "")
                        : "—"
                      }
                    </p>
                    <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mt-1">
                      {stats.budgetStats.totalBudget > 0 
                        ? `of ${formatCurrency(stats.budgetStats.totalBudget)} Paid`
                        : "Set Budget"
                      }
                    </p>
                  </div>

                  {/* Tasks */}
                  <div className="p-4 md:p-6 text-center hover:bg-warm-50 transition-colors">
                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-2 text-purple-400" />
                    <p className="text-2xl md:text-3xl font-light text-warm-800 tabular-nums">
                      {stats.taskStats.total > 0 
                        ? `${stats.taskStats.done}`
                        : "—"
                      }
                      {stats.taskStats.total > 0 && (
                        <span className="text-lg md:text-xl text-warm-400">/{stats.taskStats.total}</span>
                      )}
                    </p>
                    <p className="text-[10px] md:text-xs tracking-wider uppercase text-warm-500 mt-1">
                      Tasks Done
                    </p>
                  </div>
                </div>
              )}

              {/* Alert Banner */}
              {hasStartedPlanning && stats && stats.guestStats.pending > 0 && stats.guestStats.total > 5 && (
                <div className="px-4 md:px-6 py-3 bg-amber-50 border-t border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    {stats.guestStats.pending} guest{stats.guestStats.pending !== 1 ? "s" : ""} awaiting RSVP
                  </p>
                </div>
              )}
            </section>

            {/* Personalized Nudges */}
            {data && data.nudges.length > 0 && data.nudges.some(n => n.priority === "high") && (
              <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base md:text-lg font-medium text-warm-700">For You</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {data.nudges.map((nudge, idx) => {
                    const Icon = getIcon(nudge.icon);
                    return (
                      <div
                        key={idx}
                        className={`p-4 md:p-5 rounded-lg border ${
                          nudge.priority === "high"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-white border-warm-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            nudge.priority === "high" ? "bg-amber-100" : "bg-warm-100"
                          }`}>
                            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${
                              nudge.priority === "high" ? "text-amber-600" : "text-warm-600"
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-warm-800 mb-1 text-sm md:text-base">{nudge.title}</h3>
                            <p className="text-xs md:text-sm text-warm-500 mb-2 md:mb-3">{nudge.description}</p>
                            {nudge.action && (
                              <Link
                                href={nudge.action.href}
                                className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-warm-700 hover:text-warm-900"
                              >
                                {nudge.action.label}
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Quick Prompts */}
            {data && (
              <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h2 className="text-base md:text-lg font-medium text-warm-700">Have you thought about...</h2>
                  <button
                    onClick={handleRefresh}
                    className="ml-auto p-1 hover:bg-warm-100 rounded transition-colors"
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 text-warm-400 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {data.quickPrompts.map((prompt, idx) => (
                    <div
                      key={idx}
                      className="p-4 md:p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100"
                    >
                      <p className="text-sm md:text-base text-warm-700 font-medium">{prompt}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mood Boards */}
            {data && (
              <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Palette className="w-5 h-5 text-pink-500" />
                  <h2 className="text-base md:text-lg font-medium text-warm-700">Style Inspiration</h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  {data.moodBoards.map((board) => (
                    <div
                      key={board.id}
                      className="bg-white rounded-lg border border-warm-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="flex h-16 md:h-20">
                        {board.colors.map((color, idx) => (
                          <div key={idx} className="flex-1" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                      <div className="p-3 md:p-4">
                        <h3 className="font-medium text-warm-800 mb-1 text-sm md:text-base">{board.name}</h3>
                        <p className="text-xs md:text-sm text-warm-500 line-clamp-2">{board.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Community Insights */}
            {data && data.communityInsights.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h2 className="text-base md:text-lg font-medium text-warm-700">From the Community</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {data.communityInsights.map((insight, idx) => {
                    const Icon = getIcon(insight.icon);
                    return (
                      <div key={idx} className="p-4 md:p-5 bg-white rounded-lg border border-warm-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                            <Icon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-warm-800 mb-1 text-sm md:text-base">{insight.title}</h3>
                            <p className="text-xs md:text-sm text-warm-500">{insight.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Seasonal Ideas */}
            {data && (
              <section className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100 p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    <h3 className="text-sm md:text-base font-medium text-green-800">Trending This Month</h3>
                  </div>
                  <h4 className="text-lg md:text-xl font-serif text-green-900 mb-2 md:mb-3">{data.seasonal.current.theme}</h4>
                  <div className="flex gap-2 mb-3 md:mb-4">
                    {data.seasonal.current.colorPalette.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <ul className="space-y-1 md:space-y-2">
                    {data.seasonal.current.ideas.map((idea, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs md:text-sm text-green-700">
                        <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                        {idea}
                      </li>
                    ))}
                  </ul>
                </div>

                {data.seasonal.weddingMonth && (
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-rose-100 p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <Heart className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
                      <h3 className="text-sm md:text-base font-medium text-rose-800">For Your Wedding Month</h3>
                    </div>
                    <h4 className="text-lg md:text-xl font-serif text-rose-900 mb-2 md:mb-3">{data.seasonal.weddingMonth.theme}</h4>
                    <div className="flex gap-2 mb-3 md:mb-4">
                      {data.seasonal.weddingMonth.colorPalette.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <ul className="space-y-1 md:space-y-2">
                      {data.seasonal.weddingMonth.ideas.map((idea, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs md:text-sm text-rose-700">
                          <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-rose-400 rounded-full flex-shrink-0" />
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Curated Resources */}
            {data && (
              <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <ExternalLink className="w-5 h-5 text-warm-500" />
                  <h2 className="text-base md:text-lg font-medium text-warm-700">Helpful Resources</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {data.resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 md:p-5 bg-white rounded-lg border border-warm-200 hover:border-warm-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-warm-800 mb-1 text-sm md:text-base group-hover:text-warm-900">
                            {resource.title}
                          </h3>
                          <p className="text-xs md:text-sm text-warm-500 line-clamp-2">{resource.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-warm-400 group-hover:text-warm-600 transition-colors flex-shrink-0 ml-2" />
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Lower Priority Nudges */}
            {data && data.nudges.length > 0 && !data.nudges.some(n => n.priority === "high") && (
              <section>
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Lightbulb className="w-5 h-5 text-warm-500" />
                  <h2 className="text-base md:text-lg font-medium text-warm-700">Suggestions</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {data.nudges.map((nudge, idx) => {
                    const Icon = getIcon(nudge.icon);
                    return (
                      <div key={idx} className="p-4 md:p-5 bg-white rounded-lg border border-warm-200">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-warm-100 rounded-lg flex-shrink-0">
                            <Icon className="w-4 h-4 md:w-5 md:h-5 text-warm-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-warm-800 mb-1 text-sm md:text-base">{nudge.title}</h3>
                            <p className="text-xs md:text-sm text-warm-500 mb-2 md:mb-3">{nudge.description}</p>
                            {nudge.action && (
                              <Link
                                href={nudge.action.href}
                                className="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-warm-700 hover:text-warm-900"
                              >
                                {nudge.action.label}
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
