"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, Calendar, MapPin, Clock, Users, DollarSign, Heart, 
  Phone, Palette, CheckCircle2, AlertCircle, TrendingUp, Sparkles,
  ChevronRight, Circle, ArrowRight, Gift, Music, Utensils, Camera
} from "lucide-react";
import { type RendererWithAllPagesProps, type Task, type BudgetItem, type ScheduleEvent } from "./types";
import { formatCurrency, formatDate } from "./shared";

// Typewriter hook
function useTypewriter(text: string, speed: number = 50, delay: number = 0) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText("");
    setIsComplete(false);
    
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1));
          i++;
        } else {
          setIsComplete(true);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, speed, delay]);

  return { displayText, isComplete };
}

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1000, delay: number = 0) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function for smooth animation
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(target * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return count;
}

// Typewriter component for reusability
function TypewriterText({ 
  text, 
  speed = 40, 
  delay = 0, 
  className = "",
  showCursor = true 
}: { 
  text: string; 
  speed?: number; 
  delay?: number; 
  className?: string;
  showCursor?: boolean;
}) {
  const { displayText, isComplete } = useTypewriter(text, speed, delay);
  
  return (
    <span className={className}>
      {displayText}
      {showCursor && !isComplete && (
        <span className="inline-block w-0.5 h-[1em] bg-warm-400 ml-0.5 animate-pulse" />
      )}
    </span>
  );
}

export function OverviewRenderer({ page, fields, updateField, allPages }: RendererWithAllPagesProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

  // ============================================================================
  // DATA EXTRACTION FROM ALL PAGES
  // ============================================================================

  // Cover page data
  const coverPage = allPages.find(p => p.templateId === "cover");
  const coverFields = (coverPage?.fields || {}) as Record<string, unknown>;
  const weddingDate = coverFields.weddingDate as string;
  const coupleNames = coverFields.names as string;

  // Calculate days until wedding
  const daysUntil = useMemo(() => {
    if (!weddingDate) return null;
    return Math.ceil(
      (new Date(weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [weddingDate]);

  // Budget data
  const budgetPage = allPages.find(p => p.templateId === "budget");
  const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
  const rawBudgetItems = budgetFields.items;
  const budgetItems: BudgetItem[] = Array.isArray(rawBudgetItems) ? rawBudgetItems : [];
  const totalBudget = parseFloat((budgetFields.totalBudget as string) || "0") || 0;
  
  const budgetStats = useMemo(() => {
    const totalCost = budgetItems.reduce((sum, item) => 
      sum + (parseFloat(item?.totalCost || "0") || 0), 0);
    const totalPaid = budgetItems.reduce((sum, item) => 
      sum + (parseFloat(item?.amountPaid || "0") || 0), 0);
    const pendingPayments = budgetItems.filter(item => {
      const cost = parseFloat(item?.totalCost || "0") || 0;
      const paid = parseFloat(item?.amountPaid || "0") || 0;
      return cost > paid;
    });
    return { totalCost, totalPaid, remaining: totalCost - totalPaid, pendingPayments };
  }, [budgetItems]);

  // Guest list data
  const guestListPage = allPages.find(p => p.templateId === "guest-list");
  const guestFields = (guestListPage?.fields || {}) as Record<string, unknown>;
  const rawGuests = guestFields.guests;
  const guests: { name: string; rsvp: boolean; meal?: string }[] = Array.isArray(rawGuests) ? rawGuests : [];
  
  const guestStats = useMemo(() => ({
    total: guests.length,
    confirmed: guests.filter(g => g?.rsvp === true).length,
    pending: guests.filter(g => g?.rsvp !== true).length,
  }), [guests]);

  // Wedding party data
  const weddingPartyPage = allPages.find(p => p.templateId === "wedding-party");
  const partyFields = (weddingPartyPage?.fields || {}) as Record<string, unknown>;
  const rawBridesmaids = partyFields.bridesmaids;
  const rawGroomsmen = partyFields.groomsmen;
  const rawOthers = partyFields.others;
  const bridesmaids = Array.isArray(rawBridesmaids) ? rawBridesmaids : [];
  const groomsmen = Array.isArray(rawGroomsmen) ? rawGroomsmen : [];
  const others = Array.isArray(rawOthers) ? rawOthers : [];
  const weddingPartySize = bridesmaids.length + groomsmen.length + others.length;

  // Task board data
  const taskBoardPage = allPages.find(p => p.templateId === "task-board");
  const taskBoardFields = (taskBoardPage?.fields || {}) as Record<string, unknown>;
  const rawTasks = taskBoardFields.tasks;
  const tasks: Task[] = Array.isArray(rawTasks) ? rawTasks : [];
  
  const taskStats = useMemo(() => {
    const todo = tasks.filter(t => t?.status === "todo");
    const inProgress = tasks.filter(t => t?.status === "in-progress");
    const done = tasks.filter(t => t?.status === "done");
    const overdue = todo.filter(t => t?.dueDate && new Date(t.dueDate) < new Date());
    const upcoming = [...todo, ...inProgress]
      .filter(t => t?.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
    return { todo, inProgress, done, overdue, upcoming, total: tasks.length };
  }, [tasks]);

  // Day-of schedule data
  const schedulePage = allPages.find(p => p.templateId === "day-of-schedule");
  const scheduleFields = (schedulePage?.fields || {}) as Record<string, unknown>;
  const rawEvents = scheduleFields.events;
  const scheduleEvents: ScheduleEvent[] = Array.isArray(rawEvents) ? rawEvents : [];

  // Vendor contacts data
  const vendorPage = allPages.find(p => p.templateId === "vendor-contacts");
  const vendorFields = (vendorPage?.fields || {}) as Record<string, unknown>;
  const rawVendors = vendorFields.vendors;
  const vendors: { company: string; contractStatus: string }[] = Array.isArray(rawVendors) ? rawVendors : [];
  
  const vendorStats = useMemo(() => ({
    total: vendors.length,
    signed: vendors.filter(v => v?.contractStatus === "signed" || v?.contractStatus === "completed").length,
    pending: vendors.filter(v => v?.contractStatus === "pending").length,
  }), [vendors]);

  // Seating chart data
  const seatingPage = allPages.find(p => p.templateId === "seating-chart");
  const seatingFields = (seatingPage?.fields || {}) as Record<string, unknown>;
  const rawTables = seatingFields.tables;
  const tables: { guests: unknown[] }[] = Array.isArray(rawTables) ? rawTables : [];
  const seatedGuests = tables.reduce((sum, t) => sum + (Array.isArray(t?.guests) ? t.guests.length : 0), 0);

  // ============================================================================
  // DYNAMIC GREETING & INSIGHTS
  // ============================================================================

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getInsightMessage = useMemo(() => {
    const insights: string[] = [];
    
    if (daysUntil !== null) {
      if (daysUntil <= 7 && daysUntil > 0) {
        insights.push(`Only ${daysUntil} days to go! The big day is almost here.`);
      } else if (daysUntil <= 30 && daysUntil > 7) {
        insights.push(`${daysUntil} days until your wedding. Time to finalize the details!`);
      } else if (daysUntil > 30) {
        insights.push(`${daysUntil} days to plan your perfect day.`);
      }
    }

    if (taskStats.overdue.length > 0) {
      insights.push(`You have ${taskStats.overdue.length} overdue task${taskStats.overdue.length > 1 ? 's' : ''} that need attention.`);
    }

    if (guestStats.pending > 0 && guestStats.total > 0) {
      const pendingPercent = Math.round((guestStats.pending / guestStats.total) * 100);
      if (pendingPercent > 50) {
        insights.push(`${guestStats.pending} guests haven't RSVP'd yet.`);
      }
    }

    if (budgetStats.pendingPayments.length > 0) {
      insights.push(`${budgetStats.pendingPayments.length} vendor payment${budgetStats.pendingPayments.length > 1 ? 's' : ''} remaining.`);
    }

    if (vendorStats.pending > 0) {
      insights.push(`${vendorStats.pending} contract${vendorStats.pending > 1 ? 's' : ''} awaiting signature.`);
    }

    return insights.length > 0 ? insights[0] : "Everything is on track! Keep up the great work.";
  }, [daysUntil, taskStats.overdue, guestStats, budgetStats.pendingPayments, vendorStats.pending]);

  // Color palette
  const rawColorPalette = fields.colorPalette;
  const colorPalette: { color: string; hex: string }[] = Array.isArray(rawColorPalette) ? rawColorPalette : [];
  
  // Emergency contacts
  const rawEmergencyContacts = fields.emergencyContacts;
  const emergencyContacts: { name: string; role: string; phone: string }[] = Array.isArray(rawEmergencyContacts) ? rawEmergencyContacts : [];

  // Animated counters
  const animatedDays = useAnimatedCounter(daysUntil || 0, 1500, 500);
  const animatedGuests = useAnimatedCounter(guestStats.confirmed, 1000, 700);
  const animatedBudget = useAnimatedCounter(budgetStats.totalPaid, 1200, 900);
  const animatedTasks = useAnimatedCounter(taskStats.done.length, 800, 1100);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const addColor = () => {
    updateField("colorPalette", [...colorPalette, { color: "", hex: "#e8e4e0" }]);
  };

  const updateColor = (index: number, key: string, value: string) => {
    const updated = [...colorPalette];
    updated[index] = { ...updated[index], [key]: value };
    updateField("colorPalette", updated);
  };

  const removeColor = (index: number) => {
    updateField("colorPalette", colorPalette.filter((_, i) => i !== index));
  };

  const addContact = () => {
    updateField("emergencyContacts", [...emergencyContacts, { name: "", role: "", phone: "" }]);
  };

  const updateContact = (index: number, key: string, value: string) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], [key]: value };
    updateField("emergencyContacts", updated);
  };

  const removeContact = (index: number) => {
    updateField("emergencyContacts", emergencyContacts.filter((_, i) => i !== index));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-lg">
        {/* Hero Section with Typewriter */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-warm-50 to-amber-50 p-8 md:p-12 border-b border-warm-200">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-100/30 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-100/30 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            {/* Greeting */}
            <p className="text-warm-500 text-sm tracking-wider uppercase mb-2">
              <TypewriterText text={getGreeting()} speed={60} />
            </p>
            
            {/* Names with typewriter effect */}
            <h1 className="text-4xl md:text-5xl font-serif font-light text-warm-800 mb-4">
              {coupleNames ? (
                <TypewriterText text={coupleNames} speed={80} delay={300} />
              ) : (
                <TypewriterText text="Your Wedding" speed={80} delay={300} />
              )}
            </h1>

            {/* Wedding date */}
            {weddingDate && (
              <p className="text-lg text-warm-600 font-light mb-6">
                <TypewriterText text={formatDate(weddingDate)} speed={40} delay={800} />
              </p>
            )}

            {/* Insight message */}
            <div className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-warm-200/50 max-w-xl">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-warm-600 text-sm">
                <TypewriterText text={getInsightMessage} speed={30} delay={1500} />
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-warm-200">
          {/* Countdown */}
          <div 
            className="p-6 text-center border-r border-warm-200 hover:bg-warm-50 transition-colors cursor-pointer group"
            onClick={() => setActiveSection(activeSection === "countdown" ? null : "countdown")}
          >
            <Calendar className="w-6 h-6 mx-auto mb-3 text-rose-400 group-hover:scale-110 transition-transform" />
            {daysUntil !== null ? (
              <>
                <p className="text-4xl font-light text-warm-800 tabular-nums">
                  {daysUntil > 0 ? animatedDays : daysUntil === 0 ? "🎉" : "✓"}
                </p>
                <p className="text-xs tracking-wider uppercase text-warm-500 mt-1">
                  {daysUntil > 0 ? "Days to Go" : daysUntil === 0 ? "Today!" : "Married!"}
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-light text-warm-300">—</p>
                <p className="text-xs tracking-wider uppercase text-warm-400 mt-1">Set Your Date</p>
              </>
            )}
          </div>

          {/* Guests */}
          <div 
            className="p-6 text-center border-r border-warm-200 hover:bg-warm-50 transition-colors cursor-pointer group"
            onClick={() => setActiveSection(activeSection === "guests" ? null : "guests")}
          >
            <Users className="w-6 h-6 mx-auto mb-3 text-blue-400 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-light text-warm-800 tabular-nums">
              {animatedGuests}
              <span className="text-xl text-warm-400">/{guestStats.total}</span>
            </p>
            <p className="text-xs tracking-wider uppercase text-warm-500 mt-1">Confirmed</p>
          </div>

          {/* Budget */}
          <div 
            className="p-6 text-center border-r border-warm-200 hover:bg-warm-50 transition-colors cursor-pointer group"
            onClick={() => setActiveSection(activeSection === "budget" ? null : "budget")}
          >
            <DollarSign className="w-6 h-6 mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-light text-warm-800 tabular-nums">
              {formatCurrency(animatedBudget).replace(".00", "")}
            </p>
            <p className="text-xs tracking-wider uppercase text-warm-500 mt-1">
              of {formatCurrency(totalBudget).replace(".00", "")} Paid
            </p>
          </div>

          {/* Tasks */}
          <div 
            className="p-6 text-center hover:bg-warm-50 transition-colors cursor-pointer group"
            onClick={() => setActiveSection(activeSection === "tasks" ? null : "tasks")}
          >
            <CheckCircle2 className="w-6 h-6 mx-auto mb-3 text-purple-400 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-light text-warm-800 tabular-nums">
              {animatedTasks}
              <span className="text-xl text-warm-400">/{taskStats.total}</span>
            </p>
            <p className="text-xs tracking-wider uppercase text-warm-500 mt-1">Tasks Done</p>
          </div>
        </div>

        {/* Alerts Section */}
        {(taskStats.overdue.length > 0 || vendorStats.pending > 0 || guestStats.pending > guestStats.total * 0.5) && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Needs Attention</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {taskStats.overdue.length > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs text-amber-700 border border-amber-200">
                  <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                  {taskStats.overdue.length} overdue task{taskStats.overdue.length > 1 ? 's' : ''}
                </span>
              )}
              {vendorStats.pending > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs text-amber-700 border border-amber-200">
                  <Circle className="w-2 h-2 fill-amber-500 text-amber-500" />
                  {vendorStats.pending} pending contract{vendorStats.pending > 1 ? 's' : ''}
                </span>
              )}
              {guestStats.pending > guestStats.total * 0.5 && guestStats.total > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-xs text-amber-700 border border-amber-200">
                  <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />
                  {guestStats.pending} awaiting RSVP
                </span>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-8 md:p-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Tasks & Upcoming */}
            <div className="lg:col-span-2 space-y-8">
              {/* Upcoming Tasks */}
              <div className="bg-warm-50 rounded-xl p-6 border border-warm-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-warm-800">Upcoming Tasks</h3>
                  </div>
                  {taskStats.total > 0 && (
                    <div className="flex items-center gap-2 text-xs text-warm-500">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-warm-300 rounded-full" />
                        {taskStats.todo.length} to do
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-400 rounded-full" />
                        {taskStats.inProgress.length} in progress
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        {taskStats.done.length} done
                      </div>
                    </div>
                  )}
                </div>

                {taskStats.total > 0 ? (
                  <>
                    {/* Progress bar */}
                    <div className="h-2 bg-warm-200 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                        style={{ width: `${taskStats.total > 0 ? (taskStats.done.length / taskStats.total) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Task list */}
                    <div className="space-y-2">
                      {(showAllTasks ? [...taskStats.todo, ...taskStats.inProgress] : [...taskStats.todo, ...taskStats.inProgress].slice(0, 5)).map((task) => (
                        <div 
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-warm-100 hover:border-warm-300 transition-colors"
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            task.status === "in-progress" ? "bg-amber-400" : "bg-warm-300"
                          }`} />
                          <span className="flex-1 text-sm text-warm-700">{task.title}</span>
                          {task.dueDate && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              new Date(task.dueDate) < new Date() 
                                ? "bg-red-100 text-red-600" 
                                : "bg-warm-100 text-warm-500"
                            }`}>
                              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {[...taskStats.todo, ...taskStats.inProgress].length > 5 && (
                      <button 
                        onClick={() => setShowAllTasks(!showAllTasks)}
                        className="mt-3 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        {showAllTasks ? "Show less" : `Show ${[...taskStats.todo, ...taskStats.inProgress].length - 5} more`}
                        <ChevronRight className={`w-4 h-4 transition-transform ${showAllTasks ? "rotate-90" : ""}`} />
                      </button>
                    )}

                    {taskStats.todo.length === 0 && taskStats.inProgress.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-green-600 text-sm">🎉 All tasks complete!</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-warm-400 italic text-center py-4">
                    Add a Task Board to track your to-dos
                  </p>
                )}
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Wedding Party */}
                <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                  <Heart className="w-5 h-5 text-pink-500 mb-2" />
                  <p className="text-2xl font-light text-warm-800">{weddingPartySize}</p>
                  <p className="text-xs text-warm-500">Wedding Party</p>
                </div>

                {/* Vendors */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <Camera className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-2xl font-light text-warm-800">
                    {vendorStats.signed}<span className="text-lg text-warm-400">/{vendorStats.total}</span>
                  </p>
                  <p className="text-xs text-warm-500">Vendors Booked</p>
                </div>

                {/* Schedule Events */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <Clock className="w-5 h-5 text-amber-500 mb-2" />
                  <p className="text-2xl font-light text-warm-800">{scheduleEvents.length}</p>
                  <p className="text-xs text-warm-500">Day-Of Events</p>
                </div>

                {/* Seated */}
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <Utensils className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-2xl font-light text-warm-800">
                    {seatedGuests}<span className="text-lg text-warm-400">/{guestStats.confirmed}</span>
                  </p>
                  <p className="text-xs text-warm-500">Guests Seated</p>
                </div>
              </div>

              {/* Venue Details */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Ceremony */}
                <div className="bg-white rounded-xl p-6 border border-warm-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-500" />
                    </div>
                    <h3 className="font-medium text-warm-800">Ceremony</h3>
                  </div>
                  <div className="space-y-3">
                    <Input
                      value={(fields.ceremonyVenue as string) || ""}
                      onChange={(e) => updateField("ceremonyVenue", e.target.value)}
                      placeholder="Venue name"
                      className="font-medium border-warm-200"
                    />
                    <Input
                      value={(fields.ceremonyAddress as string) || ""}
                      onChange={(e) => updateField("ceremonyAddress", e.target.value)}
                      placeholder="Address"
                      className="text-sm border-warm-200"
                    />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warm-400" />
                      <Input
                        value={(fields.ceremonyTime as string) || ""}
                        onChange={(e) => updateField("ceremonyTime", e.target.value)}
                        placeholder="Time"
                        className="text-sm border-warm-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Reception */}
                <div className="bg-white rounded-xl p-6 border border-warm-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Music className="w-4 h-4 text-amber-500" />
                    </div>
                    <h3 className="font-medium text-warm-800">Reception</h3>
                  </div>
                  <div className="space-y-3">
                    <Input
                      value={(fields.receptionVenue as string) || ""}
                      onChange={(e) => updateField("receptionVenue", e.target.value)}
                      placeholder="Venue name"
                      className="font-medium border-warm-200"
                    />
                    <Input
                      value={(fields.receptionAddress as string) || ""}
                      onChange={(e) => updateField("receptionAddress", e.target.value)}
                      placeholder="Address"
                      className="text-sm border-warm-200"
                    />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warm-400" />
                      <Input
                        value={(fields.receptionTime as string) || ""}
                        onChange={(e) => updateField("receptionTime", e.target.value)}
                        placeholder="Time"
                        className="text-sm border-warm-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Theme & Colors */}
              <div className="bg-white rounded-xl p-6 border border-warm-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Palette className="w-4 h-4 text-purple-500" />
                  </div>
                  <h3 className="font-medium text-warm-800">Theme & Colors</h3>
                </div>
                
                <Input
                  value={(fields.theme as string) || ""}
                  onChange={(e) => updateField("theme", e.target.value)}
                  placeholder="Wedding theme or style"
                  className="mb-4 border-warm-200"
                />
                
                {/* Color Swatches */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-warm-500">Color Palette</Label>
                    <Button variant="ghost" size="sm" onClick={addColor} className="h-6 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {colorPalette.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {colorPalette.map((color, index) => (
                        <div key={index} className="group relative">
                          <div
                            className="w-12 h-12 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: color.hex || "#e8e4e0" }}
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "color";
                              input.value = color.hex || "#e8e4e0";
                              input.onchange = (e) => updateColor(index, "hex", (e.target as HTMLInputElement).value);
                              input.click();
                            }}
                          />
                          <button
                            onClick={() => removeColor(index)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                          {color.color && (
                            <p className="text-[10px] text-warm-500 text-center mt-1 truncate w-12">{color.color}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-warm-400 italic">Click &quot;Add&quot; to create your palette</p>
                  )}
                </div>
              </div>

              {/* Day-Of Contacts */}
              <div className="bg-white rounded-xl p-6 border border-warm-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-green-500" />
                    </div>
                    <h3 className="font-medium text-warm-800">Day-Of Contacts</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={addContact} className="h-6 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {emergencyContacts.length > 0 ? (
                    emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center gap-2 group">
                        <div className="flex-1 space-y-1">
                          <Input
                            value={contact.name || ""}
                            onChange={(e) => updateContact(index, "name", e.target.value)}
                            placeholder="Name"
                            className="text-sm h-8 border-warm-200"
                          />
                          <div className="grid grid-cols-2 gap-1">
                            <Input
                              value={contact.role || ""}
                              onChange={(e) => updateContact(index, "role", e.target.value)}
                              placeholder="Role"
                              className="text-xs h-7 border-warm-200"
                            />
                            <Input
                              value={contact.phone || ""}
                              onChange={(e) => updateContact(index, "phone", e.target.value)}
                              placeholder="Phone"
                              className="text-xs h-7 border-warm-200"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeContact(index)}
                          className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-warm-400 italic">Add important contacts for the big day</p>
                  )}
                </div>
              </div>

              {/* Quick Notes */}
              <div className="bg-white rounded-xl p-6 border border-warm-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-warm-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-warm-500" />
                  </div>
                  <h3 className="font-medium text-warm-800">Quick Notes</h3>
                </div>
                <Textarea
                  value={(fields.notes as string) || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Jot down reminders, ideas, or inspiration..."
                  rows={4}
                  className="text-sm border-warm-200 resize-none"
                />
              </div>

              {/* Budget Breakdown Mini */}
              {totalBudget > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-warm-800">Budget Health</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-600">Allocated</span>
                      <span className="font-medium text-warm-800">{formatCurrency(budgetStats.totalCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-600">Paid</span>
                      <span className="font-medium text-green-600">{formatCurrency(budgetStats.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-600">Remaining</span>
                      <span className="font-medium text-amber-600">{formatCurrency(budgetStats.remaining)}</span>
                    </div>
                    <div className="h-2 bg-green-200 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${totalBudget > 0 ? Math.min((budgetStats.totalCost / totalBudget) * 100, 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-warm-500">
                      {totalBudget - budgetStats.totalCost >= 0 
                        ? `${formatCurrency(totalBudget - budgetStats.totalCost)} under budget`
                        : `${formatCurrency(Math.abs(totalBudget - budgetStats.totalCost))} over budget`
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
