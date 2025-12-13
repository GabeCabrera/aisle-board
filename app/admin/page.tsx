"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Crown,
  UserPlus,
  Calculator,
  BarChart3,
  Send,
  Lightbulb,
  FileText,
  CheckCircle,
  Target,
  MapPin,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStats {
  users: {
    total: number;
    totalTenants: number;
    newThisWeek: number;
    newThisMonth: number;
    newLastMonth: number;
    monthOverMonthGrowth: string;
  };
  plans: {
    free: number;
    complete: number;
    conversionRate: string;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    monthOverMonthGrowth: string;
    pricePerUnit: number;
  };
  taxes: {
    rate: number;
    estimatedThisYear: number;
    netRevenueThisYear: number;
  };
  engagement: {
    totalPages: number;
    totalPlanners: number;
    avgPagesPerPlanner: string;
    totalRsvpForms: number;
    totalRsvpResponses: number;
  };
  productInsights: {
    templateUsage: {
      rankings: Array<{ templateId: string; count: number }>;
      engagement: Array<{ templateId: string; avgCompletion: number; pageCount: number }>;
    };
    guestList: {
      avgGuestsPerWedding: number;
      avgRsvpRate: number;
      totalGuests: number;
      totalConfirmed: number;
      weddingsWithData: number;
    };
    budget: {
      avgBudget: number;
      avgAllocated: number;
      totalTracked: number;
      topCategories: Array<{ category: string; total: number }>;
      weddingsWithData: number;
    };
    vendors: {
      totalTracked: number;
      bookedRate: number;
      contractRate: number;
      topCategories: Array<{ category: string; count: number }>;
    };
    rsvpForms: {
      fieldPreferences: Array<{ field: string; count: number; percentage: number }>;
      avgResponseRate: number;
    };
    featureAdoption: {
      rsvp: number;
      budget: number;
      vendors: number;
      seating: number;
      ai: number;
    };
    aiPlanner: {
      totalConversations: number;
      totalMessages: number;
      tenantsUsingAI: number;
      aiAdoptionRate: number;
      avgMessagesPerConversation: number;
      topPlannerNames: Array<{ name: string; count: number }>;
      usageByPlan: {
        free: number;
        paid: number;
      };
    };
  };
  activity: {
    recentSignups: Array<{
      id: string;
      displayName: string;
      plan: string;
      createdAt: string;
    }>;
    recentUpgrades: Array<{
      id: string;
      displayName: string;
      updatedAt: string;
    }>;
  };
  trends: {
    monthly: Array<{
      month: string;
      signups: number;
      upgrades: number;
      revenue: number;
    }>;
  };
  generatedAt: string;
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
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateString);
}

function formatTemplateId(id: string): string {
  return id
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = "warm"
}: { 
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "warm" | "green" | "blue" | "purple" | "amber" | "rose";
}) {
  const colorClasses = {
    warm: "bg-warm-100 text-warm-600",
    green: "bg-green-100 text-green-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <Card className="hover:shadow-medium transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-warm-500"
            }`}>
              {trend === "up" ? <ArrowUpRight className="w-4 h-4" /> : 
               trend === "down" ? <ArrowDownRight className="w-4 h-4" /> : null}
              <span>{trendValue}%</span>
            </div>
          )}
        </div>
        <p className="text-3xl font-light text-foreground mb-1">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground/80 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function ProgressBar({ value, max = 100, color = "blue" }: { value: number; max?: number; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  
  return (
    <div className="w-full bg-warm-100 rounded-full h-2">
      <div 
        className={`h-2 rounded-full transition-all ${colorClasses[color] || colorClasses.blue}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"overview" | "insights">("overview");

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-warm-400 mx-auto mb-4" />
          <p className="text-warm-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchStats}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxRevenue = Math.max(...stats.trends.monthly.map(m => m.revenue), 1);
  const maxSignups = Math.max(...stats.trends.monthly.map(m => m.signups), 1);

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif tracking-wider uppercase text-warm-800">
            Dashboard
          </h1>
          <p className="text-warm-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex bg-warm-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === "overview" 
                  ? "bg-white text-warm-800 shadow-sm" 
                  : "text-warm-500 hover:text-warm-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === "insights" 
                  ? "bg-white text-warm-800 shadow-sm" 
                  : "text-warm-500 hover:text-warm-700"
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              Insights
            </button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStats}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* Revenue Hero Section */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 mb-8 rounded-lg">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="md:col-span-2">
                <p className="text-green-200 text-sm uppercase tracking-wider mb-2">Total Revenue</p>
                <p className="text-4xl font-light mb-2">{formatCurrency(stats.revenue.total)}</p>
                <p className="text-green-200 text-sm">
                  {stats.plans.complete} complete plans × {formatCurrency(stats.revenue.pricePerUnit)}
                </p>
              </div>
              <div>
                <p className="text-green-200 text-sm uppercase tracking-wider mb-2">This Month</p>
                <p className="text-2xl font-light mb-1">{formatCurrency(stats.revenue.thisMonth)}</p>
                <div className={`flex items-center gap-1 text-sm ${
                  parseFloat(stats.revenue.monthOverMonthGrowth) >= 0 ? "text-green-200" : "text-red-300"
                }`}>
                  {parseFloat(stats.revenue.monthOverMonthGrowth) >= 0 ? 
                    <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{stats.revenue.monthOverMonthGrowth}% vs last month</span>
                </div>
              </div>
              <div>
                <p className="text-green-200 text-sm uppercase tracking-wider mb-2">This Year</p>
                <p className="text-2xl font-light mb-1">{formatCurrency(stats.revenue.thisYear)}</p>
                <p className="text-green-200 text-sm">
                  Net: {formatCurrency(stats.taxes.netRevenueThisYear)}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Couples"
              value={stats.users.totalTenants}
              subtitle={`${stats.users.newThisMonth} new this month`}
              icon={Users}
              trend={parseFloat(stats.users.monthOverMonthGrowth) >= 0 ? "up" : "down"}
              trendValue={stats.users.monthOverMonthGrowth}
              color="blue"
            />
            <StatCard
              title="Conversion Rate"
              value={`${stats.plans.conversionRate}%`}
              subtitle={`${stats.plans.complete} of ${stats.users.totalTenants} converted`}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Paid Customers"
              value={stats.plans.complete}
              subtitle={`${stats.plans.free} on free plan`}
              icon={Crown}
              color="purple"
            />
            <StatCard
              title="New This Week"
              value={stats.users.newThisWeek}
              subtitle="signups"
              icon={UserPlus}
              color="amber"
            />
          </div>

          {/* Charts & Activity Section */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-medium text-warm-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-warm-400" />
                    Revenue Trend
                  </h2>
                  <span className="text-xs text-warm-400">Last 6 months</span>
                </div>
                <div className="h-40 flex items-end gap-3">
                  {stats.trends.monthly.map((month, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col gap-1">
                        <div 
                          className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                          style={{ height: `${(month.revenue / maxRevenue) * 100}px` }}
                          title={`Revenue: ${formatCurrency(month.revenue)}`}
                        />
                        <div 
                          className="w-full bg-blue-300 rounded-b transition-all hover:bg-blue-400"
                          style={{ height: `${(month.signups / maxSignups) * 30}px` }}
                          title={`Signups: ${month.signups}`}
                        />
                      </div>
                      <span className="text-xs text-warm-500">{month.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="text-warm-500">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-300 rounded" />
                    <span className="text-warm-500">Signups</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-warm-400" />
                  Plan Distribution
                </h2>
                <div className="space-y-4">
                  <div className="relative w-28 h-28 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e1dc" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="16" fill="none" stroke="#7c3aed" strokeWidth="3"
                        strokeDasharray={`${parseFloat(stats.plans.conversionRate)} ${100 - parseFloat(stats.plans.conversionRate)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-light text-warm-700">{stats.plans.conversionRate}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded" />
                        <span className="text-sm text-warm-600">Complete</span>
                      </div>
                      <span className="font-medium text-warm-800">{stats.plans.complete}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-warm-200 rounded" />
                        <span className="text-sm text-warm-600">Free</span>
                      </div>
                      <span className="font-medium text-warm-800">{stats.plans.free}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Engagement & Financial Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-warm-400" />
                  Engagement Metrics
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <p className="text-xl font-light text-warm-800">{stats.engagement.totalPlanners}</p>
                    <p className="text-sm text-warm-500">Active Planners</p>
                  </div>
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <p className="text-xl font-light text-warm-800">{stats.engagement.totalPages}</p>
                    <p className="text-sm text-warm-500">Total Pages</p>
                  </div>
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <p className="text-xl font-light text-warm-800">{stats.engagement.avgPagesPerPlanner}</p>
                    <p className="text-sm text-warm-500">Avg Pages/Planner</p>
                  </div>
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <p className="text-xl font-light text-warm-800">{stats.engagement.totalRsvpForms}</p>
                    <p className="text-sm text-warm-500">RSVP Forms</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-light text-blue-700">{stats.engagement.totalRsvpResponses}</p>
                        <p className="text-sm text-blue-600">RSVP Responses</p>
                      </div>
                      <Send className="w-6 h-6 text-blue-300" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                  <Calculator className="w-5 h-5 text-warm-400" />
                  Financial Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-warm-100">
                    <span className="text-warm-600">Gross Revenue (YTD)</span>
                    <span className="font-medium text-warm-800">{formatCurrency(stats.revenue.thisYear)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-warm-100">
                    <span className="text-warm-600">Stripe Fees (~2.9% + $0.30)</span>
                    <span className="font-medium text-red-500">
                      -{formatCurrency(stats.revenue.thisYear * 0.029 + (stats.plans.complete * 0.30))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-warm-100">
                    <span className="text-warm-600">Est. Tax ({(stats.taxes.rate * 100).toFixed(0)}%)</span>
                    <span className="font-medium text-amber-600">
                      -{formatCurrency(stats.taxes.estimatedThisYear)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 bg-green-50 -mx-6 px-6 rounded-lg">
                    <span className="font-medium text-green-800">Net Revenue (YTD)</span>
                    <span className="text-lg font-medium text-green-700">
                      {formatCurrency(stats.taxes.netRevenueThisYear - (stats.revenue.thisYear * 0.029 + (stats.plans.complete * 0.30)))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feeds */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                  <UserPlus className="w-5 h-5 text-warm-400" />
                  Recent Signups
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.activity.recentSignups.length > 0 ? (
                    stats.activity.recentSignups.map((signup) => (
                      <div key={signup.id} className="flex items-center justify-between py-2 border-b border-warm-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-warm-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-warm-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-warm-800">{signup.displayName}</p>
                            <p className="text-xs text-warm-400">{timeAgo(signup.createdAt)}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          signup.plan === "complete" ? "bg-purple-100 text-purple-700" : "bg-warm-100 text-warm-600"
                        }`}>
                          {signup.plan}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-warm-400 text-center py-8">No recent signups</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                  <Crown className="w-5 h-5 text-purple-500" />
                  Recent Upgrades
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.activity.recentUpgrades.length > 0 ? (
                    stats.activity.recentUpgrades.map((upgrade) => (
                      <div key={upgrade.id} className="flex items-center justify-between py-2 border-b border-warm-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-warm-800">{upgrade.displayName}</p>
                            <p className="text-xs text-warm-400">{timeAgo(upgrade.updatedAt)}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          +{formatCurrency(stats.revenue.pricePerUnit)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-warm-400 text-center py-8">No recent upgrades</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        /* Product Insights Tab */
        <>
          {/* Insights Header */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6 mb-8 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-light">Product Insights</h2>
                <p className="text-purple-200 text-sm">Anonymized & aggregated user behavior data</p>
              </div>
            </div>
          </div>

          {/* AI Planner Insights */}
          <div className="bg-gradient-to-br from-rose-500 to-purple-600 text-white p-6 mb-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-lg font-medium">AI Planner Usage</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-light">{stats.productInsights.aiPlanner.tenantsUsingAI}</p>
                <p className="text-sm text-white/80">Couples Using AI</p>
                <p className="text-xs text-white/60 mt-1">{stats.productInsights.aiPlanner.aiAdoptionRate}% adoption</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-light">{stats.productInsights.aiPlanner.totalConversations}</p>
                <p className="text-sm text-white/80">Conversations</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-3xl font-light">{stats.productInsights.aiPlanner.totalMessages}</p>
                <p className="text-sm text-white/80">Total Messages</p>
                <p className="text-xs text-white/60 mt-1">~{stats.productInsights.aiPlanner.avgMessagesPerConversation} per convo</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-light">{stats.productInsights.aiPlanner.usageByPlan.free}</p>
                    <p className="text-xs text-white/60">Free</p>
                  </div>
                  <div>
                    <p className="text-xl font-light">{stats.productInsights.aiPlanner.usageByPlan.paid}</p>
                    <p className="text-xs text-white/60">Paid</p>
                  </div>
                </div>
                <p className="text-sm text-white/80 mt-2">By Plan</p>
              </div>
            </div>
          </div>

          {/* Popular Planner Names */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Popular Planner Names
              </h2>
              <div className="flex flex-wrap gap-2">
                {stats.productInsights.aiPlanner.topPlannerNames.length > 0 ? (
                  stats.productInsights.aiPlanner.topPlannerNames.map((item, i) => (
                    <div
                      key={item.name}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        i === 0 ? "bg-purple-100 text-purple-700 font-medium" :
                        i < 3 ? "bg-rose-50 text-rose-600" :
                        "bg-warm-100 text-warm-600"
                      }`}
                    >
                      {item.name} <span className="text-xs opacity-60">({item.count})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-warm-400">No data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feature Adoption Rates */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                <Target className="w-5 h-5 text-warm-400" />
                Feature Adoption Rates
              </h2>
              <div className="grid md:grid-cols-5 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-warm-600">AI Planner</span>
                    <span className="text-sm font-medium text-warm-800">{stats.productInsights.featureAdoption.ai}%</span>
                  </div>
                  <ProgressBar value={stats.productInsights.featureAdoption.ai} color="purple" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-warm-600">RSVP Forms</span>
                    <span className="text-sm font-medium text-warm-800">{stats.productInsights.featureAdoption.rsvp}%</span>
                  </div>
                  <ProgressBar value={stats.productInsights.featureAdoption.rsvp} color="blue" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-warm-600">Budget Tracker</span>
                    <span className="text-sm font-medium text-warm-800">{stats.productInsights.featureAdoption.budget}%</span>
                  </div>
                  <ProgressBar value={stats.productInsights.featureAdoption.budget} color="green" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-warm-600">Vendor Contacts</span>
                    <span className="text-sm font-medium text-warm-800">{stats.productInsights.featureAdoption.vendors}%</span>
                  </div>
                  <ProgressBar value={stats.productInsights.featureAdoption.vendors} color="amber" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-warm-600">Seating Chart</span>
                    <span className="text-sm font-medium text-warm-800">{stats.productInsights.featureAdoption.seating}%</span>
                  </div>
                  <ProgressBar value={stats.productInsights.featureAdoption.seating} color="rose" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wedding Data Insights */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-500" />
                  Guest List Insights
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-light text-blue-700">{stats.productInsights.guestList.avgGuestsPerWedding}</p>
                    <p className="text-sm text-blue-600">Avg Guests</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-warm-50 rounded-lg text-center">
                      <p className="text-lg font-light text-warm-800">{stats.productInsights.guestList.avgRsvpRate}%</p>
                      <p className="text-xs text-warm-500">RSVP Rate</p>
                    </div>
                    <div className="p-2 bg-warm-50 rounded-lg text-center">
                      <p className="text-lg font-light text-warm-800">{stats.productInsights.guestList.totalGuests}</p>
                      <p className="text-xs text-warm-500">Total Guests</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Budget Insights
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-light text-green-700">{formatCurrency(stats.productInsights.budget.avgBudget)}</p>
                    <p className="text-sm text-green-600">Avg Budget</p>
                  </div>
                  <div className="p-2 bg-warm-50 rounded-lg text-center">
                    <p className="text-lg font-light text-warm-800">{formatCurrency(stats.productInsights.budget.avgAllocated)}</p>
                    <p className="text-xs text-warm-500">Avg Allocated</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  Vendor Insights
                </h2>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-light text-purple-700">{stats.productInsights.vendors.totalTracked}</p>
                    <p className="text-sm text-purple-600">Vendors Tracked</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-warm-50 rounded-lg text-center">
                      <p className="text-lg font-light text-warm-800">{stats.productInsights.vendors.bookedRate}%</p>
                      <p className="text-xs text-warm-500">Booked</p>
                    </div>
                    <div className="p-2 bg-warm-50 rounded-lg text-center">
                      <p className="text-lg font-light text-warm-800">{stats.productInsights.vendors.contractRate}%</p>
                      <p className="text-xs text-warm-500">Contracted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RSVP Form Preferences */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-medium text-warm-800 flex items-center gap-2 mb-6">
                <ClipboardList className="w-5 h-5 text-warm-400" />
                RSVP Form Field Preferences
              </h2>
              <div className="grid md:grid-cols-3 gap-3">
                {stats.productInsights.rsvpForms.fieldPreferences.length > 0 ? (
                  stats.productInsights.rsvpForms.fieldPreferences.map(field => (
                    <div key={field.field} className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                      <span className="text-sm text-warm-700">{formatFieldName(field.field)}</span>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                        field.percentage > 70 ? "bg-green-100 text-green-700" :
                        field.percentage > 40 ? "bg-amber-100 text-amber-700" :
                        "bg-warm-200 text-warm-600"
                      }`}>
                        {field.percentage}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-warm-400 col-span-full text-center py-8">No data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actionable Insights */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 rounded-3xl shadow-soft">
            <h2 className="font-medium text-amber-800 flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5" />
              Actionable Insights
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {stats.productInsights.featureAdoption.seating < 30 && (
                <div className="p-3 bg-white rounded-xl border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-1">Low Seating Chart Adoption</p>
                  <p className="text-xs text-amber-600">
                    Only {stats.productInsights.featureAdoption.seating}% use seating charts.
                  </p>
                </div>
              )}
              {stats.productInsights.featureAdoption.rsvp < 40 && (
                <div className="p-3 bg-white rounded-xl border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-1">RSVP Feature Underused</p>
                  <p className="text-xs text-amber-600">
                    Only {stats.productInsights.featureAdoption.rsvp}% create RSVP forms.
                  </p>
                </div>
              )}
              {stats.plans.free > stats.plans.complete && (
                <div className="p-3 bg-white rounded-xl border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-1">Conversion Opportunity</p>
                  <p className="text-xs text-amber-600">
                    {stats.plans.free} free users vs {stats.plans.complete} paid.
                  </p>
                </div>
              )}
              <div className="p-3 bg-white rounded-xl border border-amber-100">
                <p className="text-sm font-medium text-amber-800 mb-1">Keep Monitoring</p>
                <p className="text-xs text-amber-600">
                  Patterns become more reliable with more data points.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-warm-200 text-center">
        <p className="text-xs text-warm-400">
          Data as of {new Date(stats.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
