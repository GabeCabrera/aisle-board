"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { usePlannerData, formatCurrency } from "@/lib/hooks/usePlannerData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateSanityScore } from "@/lib/algorithms/sanity-engine";
import { 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  CheckSquare, 
  CreditCard, 
  Users, 
  Store, 
  ArrowRight,
  BrainCircuit,
  Activity
} from "lucide-react";

interface DashboardToolProps {
  initialData?: any;
}

export default function DashboardTool({ initialData }: DashboardToolProps) {
  // Request specific sections for the dashboard
  const { data, loading, refetch, isFetching } = usePlannerData([
    "summary", "budget", "guests", "vendors", "decisions", "kernel"
  ], { initialData });
  const router = useRouter();
  const [familyFriction, setFamilyFriction] = useState(1);

  const handleRefresh = () => {
    refetch();
  };

  const handleToolClick = (toolId: string) => {
    router.push(`/planner/${toolId}`);
  };

  const sanityData = useMemo(() => {
    if (!data || !data.budget || !data.guests || !data.vendors || !data.summary) {
        return { score: 100, alerts: [] };
    }
    
    const { budget, guests, vendors, summary } = data;
    
    // Calculate critical unsigned
    const essentialVendors = ["venue", "catering"];
    const bookedCategories = vendors.list
      .filter(v => ["booked", "confirmed", "paid"].includes(v.status || ""))
      .map(v => (v.category || "").toLowerCase());
      
    const criticalUnsigned = essentialVendors.some(
      req => !bookedCategories.some(booked => booked.includes(req))
    );

    return calculateSanityScore({
      budget: { 
        planned: budget.total, 
        actual: budget.spent 
      },
      logistics: { 
        daysToEvent: summary.daysUntil || 365, 
        totalGuests: guests.stats.total, 
        pendingRSVPs: guests.stats.pending 
      },
      contracts: { 
        totalRequired: 10, // heuristic estimate or derive from decisions
        signed: vendors.stats.booked, 
        criticalUnsigned 
      },
      friction: { familyIndex: familyFriction }
    });
  }, [data, familyFriction]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  const summary = data?.summary;
  const budget = data?.budget;
  const guests = data?.guests;
  const vendors = data?.vendors;
  const decisions = data?.decisions;
  const kernel = data?.kernel;

  const alerts: Array<{
    type: "warning" | "info" | "success" | "critical";
    message: string;
    toolId?: string;
  }> = [];

  // Sanity Alerts
  sanityData.alerts.forEach(alert => {
    alerts.push({
      type: "critical",
      message: alert,
      toolId: "dashboard" // or link to specific tool if parsed
    });
  });

  // Calculate alerts/priorities
  if (budget && budget.total > 0 && budget.percentUsed > 100) {
    alerts.push({
      type: "warning",
      message: `Over budget by ${formatCurrency(budget.spent - budget.total)}`,
      toolId: "budget",
    });
  } else if (budget && budget.total > 0 && budget.percentUsed > 90) {
    alerts.push({
      type: "warning",
      message: `Budget is ${budget.percentUsed}% allocated`,
      toolId: "budget",
    });
  }

  const essentialVendors = ["venue", "photographer", "catering", "officiant"];
  const bookedCategories =
    vendors?.list
      .filter(
        (v) =>
          v.status === "booked" || v.status === "confirmed" || v.status === "paid"
      )
      .map((v) => (v.category || "").toLowerCase()) || [];

  const missingEssentials = essentialVendors.filter(
    (v) => !bookedCategories.some((b) => b.includes(v))
  );
  if (missingEssentials.length > 0 && summary?.daysUntil && summary.daysUntil < 180) {
    alerts.push({
      type: "warning",
      message: `Need to book: ${missingEssentials.join(", ")}`,
      toolId: "vendors",
    });
  }

  if (
    guests &&
    guests.stats.total > 0 &&
    guests.stats.pending > 0 &&
    summary?.daysUntil &&
    summary.daysUntil < 60
  ) {
    alerts.push({
      type: "info",
      message: `${guests.stats.pending} guests pending RSVP`,
      toolId: "guests",
    });
  }

  if (vendors && vendors.stats.booked >= 3) {
    alerts.push({
      type: "success",
      message: `${vendors.stats.booked} vendors booked!`,
      toolId: "vendors",
    });
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            {summary?.coupleNames || "Your Wedding"}
          </h1>
          {summary?.weddingDate && (
            <p className="text-xl text-muted-foreground mt-2 font-light">
              {(() => {
                const dateStr = summary.weddingDate;
                const date = dateStr.includes("T")
                  ? new Date(dateStr)
                  : new Date(dateStr + "T12:00:00");
                return date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              })()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 px-3 border-border hover:bg-white hover:text-primary"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-3 w-3 mr-2", isFetching && "animate-spin")} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Sanity Score Card */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="relative flex items-center justify-center h-32 w-32 shrink-0">
             {/* Simple Circle Progress */}
             <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
               <circle
                 className="text-muted/20"
                 strokeWidth="8"
                 stroke="currentColor"
                 fill="transparent"
                 r="40"
                 cx="50"
                 cy="50"
               />
               <circle
                 className={cn(
                   "transition-all duration-1000 ease-out",
                   sanityData.score > 70 ? "text-green-500" : sanityData.score > 40 ? "text-amber-500" : "text-red-500"
                 )}
                 strokeWidth="8"
                 strokeDasharray={251.2}
                 strokeDashoffset={251.2 - (251.2 * sanityData.score) / 100}
                 strokeLinecap="round"
                 stroke="currentColor"
                 fill="transparent"
                 r="40"
                 cx="50"
                 cy="50"
               />
             </svg>
             <div className="absolute flex flex-col items-center">
               <span className="text-3xl font-bold font-sans" data-testid="sanity-score">{Math.round(sanityData.score)}</span>
               <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sanity</span>
             </div>
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium text-lg">System Status</h3>
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Family Friction Index</span>
                  <span className="font-medium">{familyFriction}/10</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="1"
                  value={familyFriction}
                  onChange={(e) => setFamilyFriction(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
            </div>
             <p className="text-sm text-muted-foreground">
              {sanityData.score > 80 ? "Systems nominal. You are in a state of Zen." : 
               sanityData.score > 50 ? "Minor logistical turbulence detected." : 
               "Logistical entropy is high. Immediate intervention recommended."}
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <button
              key={i}
              onClick={() => handleToolClick(alert.toolId || "dashboard")}
              className={cn(
                "w-full flex items-center p-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] shadow-sm border text-left",
                alert.type === "critical" && "bg-red-50 text-red-900 border-red-100 hover:bg-red-100",
                alert.type === "warning" && "bg-orange-50 text-orange-900 border-orange-100 hover:bg-orange-100",
                alert.type === "info" && "bg-blue-50 text-blue-900 border-blue-100 hover:bg-blue-100",
                alert.type === "success" && "bg-green-50 text-green-900 border-green-100 hover:bg-green-100"
              )}
            >
              {alert.type === "critical" && <BrainCircuit className="h-4 w-4 mr-3 shrink-0" />}
              {alert.type === "warning" && <AlertTriangle className="h-4 w-4 mr-3 shrink-0" />}
              {alert.type === "info" && <Info className="h-4 w-4 mr-3 shrink-0" />}
              {alert.type === "success" && <CheckCircle className="h-4 w-4 mr-3 shrink-0" />}
              <span className="flex-1">{alert.message}</span>
              <ArrowRight className="h-4 w-4 ml-3 opacity-50 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Checklist Card */}
        <div 
          onClick={() => handleToolClick("checklist")}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-border shadow-soft hover:shadow-lifted transition-all duration-500 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <h3 className="font-serif text-2xl mb-2 text-foreground">Checklist</h3>
          
          {decisions?.progress ? (
            <div className="space-y-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-medium font-sans text-foreground">
                  {decisions.progress.percentComplete}%
                </span>
                <span className="text-muted-foreground font-medium">complete</span>
              </div>
              
              {/* Custom Progress Bar */}
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${decisions.progress.percentComplete}%` }}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                {decisions.progress.decided} of {decisions.progress.total} decisions made
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">Start planning your big day</p>
          )}
        </div>

        {/* Budget Card */}
        <div 
          onClick={() => handleToolClick("budget")}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-border shadow-soft hover:shadow-lifted transition-all duration-500 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-700 group-hover:scale-110 transition-transform duration-500">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <h3 className="font-serif text-2xl mb-2 text-foreground">Budget</h3>

          {budget && budget.total > 0 ? (
            <div>
              <div className="text-4xl font-medium font-sans text-foreground mb-1">
                {formatCurrency(budget.total)}
              </div>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">{formatCurrency(budget.spent)}</span> allocated ({budget.percentUsed}%)
              </p>
            </div>
          ) : budget && budget.spent > 0 ? (
            <div>
              <div className="text-4xl font-medium font-sans text-foreground mb-1">
                {formatCurrency(budget.spent)}
              </div>
              <p className="text-muted-foreground">allocated so far</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Set your budget</p>
          )}
        </div>

        {/* Guests Card */}
        <div 
          onClick={() => handleToolClick("guests")}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-border shadow-soft hover:shadow-lifted transition-all duration-500 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform duration-500">
              <Users className="h-6 w-6" />
            </div>
            <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <h3 className="font-serif text-2xl mb-2 text-foreground">Guest List</h3>

          {guests && guests.stats.total > 0 ? (
            <div>
              <div className="text-4xl font-medium font-sans text-foreground mb-1">
                {guests.stats.total}
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-md">
                  {guests.stats.confirmed} confirmed
                </span>
                <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
                  {guests.stats.pending} pending
                </span>
              </div>
            </div>
          ) : kernel?.guestCount ? (
            <div>
              <div className="text-4xl font-medium font-sans text-foreground mb-1">
                ~{kernel.guestCount}
              </div>
              <p className="text-muted-foreground">estimated guests</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Build your guest list</p>
          )}
        </div>

        {/* Vendors Card */}
        <div 
          onClick={() => handleToolClick("vendors")}
          className="group cursor-pointer bg-white rounded-3xl p-8 border border-border shadow-soft hover:shadow-lifted transition-all duration-500 hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform duration-500">
              <Store className="h-6 w-6" />
            </div>
            <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <h3 className="font-serif text-2xl mb-2 text-foreground">Vendors</h3>

          {vendors && vendors.list && vendors.list.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {vendors.list.slice(0, 3).map((vendor) => {
                const isBooked = ["booked", "confirmed", "paid"].includes(vendor.status || "");
                return (
                  <span 
                    key={vendor.id}
                    className={cn(
                      "px-3 py-1 rounded-full text-sm border",
                      isBooked 
                        ? "bg-stone-800 text-white border-stone-800" 
                        : "bg-stone-50 text-stone-600 border-stone-200"
                    )}
                  >
                    {vendor.name}
                  </span>
                );
              })}
              {vendors.list.length > 3 && (
                <span className="px-3 py-1 rounded-full text-sm bg-white border border-dashed border-border text-muted-foreground">
                  +{vendors.list.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Track your vendors</p>
          )}
        </div>

      </div>
    </div>
  );
}