"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Wallet,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  Heart,
  Martini,
  Utensils,
  Home,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SAMPLE_BUDGET = {
  total: 35000,
  spent: 28450,
  paid: 18200,
  remaining: 10250,
  percentUsed: 81,
  items: [
    { id: "1", vendor: "The Grand Estate", category: "Venue", totalCost: 8500, amountPaid: 4250, notes: "Includes ceremony + reception" },
    { id: "2", vendor: "Bloom & Wild Florals", category: "Flowers", totalCost: 3200, amountPaid: 1600, notes: "Bridal bouquet, centerpieces, arch" },
    { id: "3", vendor: "Captured Moments Photo", category: "Photography", totalCost: 4500, amountPaid: 2250, notes: "8 hours + engagement shoot" },
    { id: "4", vendor: "Sweet Endings Bakery", category: "Catering", totalCost: 6800, amountPaid: 3400, notes: "150 guests, plated dinner" },
    { id: "5", vendor: "The Perfect Dress Boutique", category: "Attire", totalCost: 2800, amountPaid: 2800, notes: "Dress + alterations" },
    { id: "6", vendor: "String Theory Quartet", category: "Music", totalCost: 1800, amountPaid: 900, notes: "Ceremony music" },
    { id: "7", vendor: "DJ Nightwave", category: "Music", totalCost: 850, amountPaid: 0, notes: "Reception DJ" },
  ],
};

const SAMPLE_GUESTS = [
  { id: "1", name: "Sarah & Michael Chen", email: "sarah.chen@email.com", rsvp: "confirmed", group: "Family", side: "bride", plusOne: false, dietaryRestrictions: null },
  { id: "2", name: "James Rodriguez", email: "james.r@email.com", rsvp: "confirmed", group: "College Friends", side: "groom", plusOne: true, dietaryRestrictions: "Vegetarian" },
  { id: "3", name: "Emily Watson", email: "emily.w@email.com", rsvp: "pending", group: "Work", side: "bride", plusOne: false, dietaryRestrictions: null },
  { id: "4", name: "David & Lisa Park", email: "dpark@email.com", rsvp: "confirmed", group: "Family", side: "groom", plusOne: false, dietaryRestrictions: "Gluten-free" },
  { id: "5", name: "Alexandra Moore", email: "alex.moore@email.com", rsvp: "confirmed", group: "College Friends", side: "bride", plusOne: true, dietaryRestrictions: null },
  { id: "6", name: "Robert Thompson", email: "rthompson@email.com", rsvp: "declined", group: "Work", side: "groom", plusOne: false, dietaryRestrictions: null },
  { id: "7", name: "Jennifer & Mark Liu", email: "jliu@email.com", rsvp: "confirmed", group: "Family", side: "bride", plusOne: false, dietaryRestrictions: null },
  { id: "8", name: "Chris Anderson", email: "canderson@email.com", rsvp: "pending", group: "High School", side: "groom", plusOne: true, dietaryRestrictions: null },
];

const SAMPLE_TIMELINE = [
  { id: "1", time: "10:00 AM", title: "Hair & Makeup Begins", category: "Prep", duration: "3 hours", location: "Bridal Suite" },
  { id: "2", time: "12:30 PM", title: "Photographer Arrives", category: "Prep", duration: "30 min", location: "Bridal Suite" },
  { id: "3", time: "1:00 PM", title: "First Look Photos", category: "Prep", duration: "1 hour", location: "Garden Terrace" },
  { id: "4", time: "3:30 PM", title: "Guests Begin Arriving", category: "Ceremony", duration: "30 min", location: "Main Lawn" },
  { id: "5", time: "4:00 PM", title: "Ceremony Begins", category: "Ceremony", duration: "30 min", location: "Rose Garden" },
  { id: "6", time: "4:30 PM", title: "Cocktail Hour", category: "Cocktail Hour", duration: "1 hour", location: "West Patio" },
  { id: "7", time: "5:30 PM", title: "Grand Entrance", category: "Reception", duration: "15 min", location: "Grand Ballroom" },
  { id: "8", time: "5:45 PM", title: "First Dance", category: "Reception", duration: "5 min", location: "Grand Ballroom" },
  { id: "9", time: "6:00 PM", title: "Dinner Service", category: "Reception", duration: "1.5 hours", location: "Grand Ballroom" },
  { id: "10", time: "7:30 PM", title: "Toasts & Speeches", category: "Reception", duration: "30 min", location: "Grand Ballroom" },
  { id: "11", time: "8:00 PM", title: "Cake Cutting", category: "Reception", duration: "15 min", location: "Grand Ballroom" },
  { id: "12", time: "10:00 PM", title: "Sparkler Exit", category: "Reception", duration: "15 min", location: "Front Drive" },
];

const SAMPLE_CHECKLIST = [
  { id: "1", title: "Book venue", completed: true, category: "Venue" },
  { id: "2", title: "Hire photographer", completed: true, category: "Vendors" },
  { id: "3", title: "Order wedding dress", completed: true, category: "Attire" },
  { id: "4", title: "Send save-the-dates", completed: true, category: "Invitations" },
  { id: "5", title: "Book florist", completed: true, category: "Vendors" },
  { id: "6", title: "Finalize guest list", completed: false, category: "Guests" },
  { id: "7", title: "Send invitations", completed: false, category: "Invitations" },
  { id: "8", title: "Book honeymoon", completed: false, category: "Travel" },
  { id: "9", title: "Schedule hair & makeup trial", completed: false, category: "Beauty" },
  { id: "10", title: "Order wedding cake", completed: false, category: "Catering" },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case "prep":
      return <Home className="h-4 w-4 text-primary" />;
    case "ceremony":
      return <Heart className="h-4 w-4 text-red-500" />;
    case "cocktail hour":
      return <Martini className="h-4 w-4 text-amber-500" />;
    case "reception":
      return <Utensils className="h-4 w-4 text-green-500" />;
    default:
      return <Sparkles className="h-4 w-4 text-blue-500" />;
  }
};

// ============================================================================
// TAB COMPONENTS
// ============================================================================

function BudgetDemo() {
  const budget = SAMPLE_BUDGET;
  const byCategory = budget.items.reduce((acc, item) => {
    const cat = item.category;
    if (!acc[cat]) acc[cat] = { total: 0, paid: 0, items: [] };
    acc[cat].total += item.totalCost;
    acc[cat].paid += item.amountPaid;
    acc[cat].items.push(item);
    return acc;
  }, {} as Record<string, { total: number; paid: number; items: typeof budget.items }>);

  const categories = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs mb-1">Total Budget</p>
            <h3 className="font-semibold text-lg">{formatCurrency(budget.total)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs mb-1">Allocated</p>
            <h3 className="font-semibold text-lg">{formatCurrency(budget.spent)}</h3>
            <p className="text-xs text-muted-foreground">{budget.percentUsed}% of budget</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs mb-1">Paid So Far</p>
            <h3 className="font-semibold text-lg text-green-600">{formatCurrency(budget.paid)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs mb-1">Still Owed</p>
            <h3 className="font-semibold text-lg text-amber-600">{formatCurrency(budget.remaining)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-muted-foreground text-sm">Budget used</p>
            <p className="font-medium">{budget.percentUsed}%</p>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${budget.percentUsed}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-medium">By Category</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/50">
            {categories.map(([category, data]) => (
              <li key={category} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-muted rounded-full text-xs font-medium">{category}</span>
                  <span className="text-xs text-muted-foreground">{data.items.length} items</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(data.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((data.total / budget.spent) * 100)}% of total
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function GuestsDemo() {
  const guests = SAMPLE_GUESTS;
  const stats = {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvp === "confirmed").length,
    pending: guests.filter((g) => g.rsvp === "pending").length,
    declined: guests.filter((g) => g.rsvp === "declined").length,
    plusOnes: guests.filter((g) => g.plusOne).length,
  };

  const getRsvpStyle = (rsvp: string) => {
    switch (rsvp) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "declined":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs mb-1">Total Guests</p>
            <h3 className="font-semibold text-lg">{stats.total}</h3>
            <p className="text-xs text-muted-foreground">+{stats.plusOnes} plus ones</p>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs mb-1 text-green-600">Confirmed</p>
            <h3 className="font-semibold text-lg text-green-600">{stats.confirmed}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs mb-1 text-amber-600">Pending</p>
            <h3 className="font-semibold text-lg text-amber-600">{stats.pending}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <p className="text-xs mb-1 text-red-600">Declined</p>
            <h3 className="font-semibold text-lg text-red-600">{stats.declined}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Guest List */}
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-medium">Guest List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/50">
            {guests.map((guest) => (
              <li key={guest.id} className="flex items-center p-4 hover:bg-muted/30 transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 text-sm font-medium flex-shrink-0">
                  {guest.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{guest.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{guest.group}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {guest.plusOne && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">+1</span>
                  )}
                  {guest.dietaryRestrictions && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs hidden sm:inline">
                      {guest.dietaryRestrictions}
                    </span>
                  )}
                  <span className={cn("px-2 py-0.5 rounded-full text-xs capitalize", getRsvpStyle(guest.rsvp))}>
                    {guest.rsvp}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineDemo() {
  const events = SAMPLE_TIMELINE;
  const categoryOrder = ["Prep", "Ceremony", "Cocktail Hour", "Reception"];

  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur p-4">
        <p className="text-sm text-muted-foreground mb-1">Wedding Day</p>
        <h3 className="font-serif text-xl">Saturday, October 12, 2024</h3>
        <p className="text-sm text-muted-foreground mt-1">The Grand Estate, Napa Valley</p>
      </Card>

      {categoryOrder.map((category) => {
        const categoryEvents = groupedEvents[category];
        if (!categoryEvents) return null;

        return (
          <div key={category} className="relative pl-6">
            <div className="absolute left-0 top-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 border border-primary/20">
              {getCategoryIcon(category)}
            </div>
            <h2 className="font-medium text-lg mb-3 ml-2">{category}</h2>

            <div className="relative border-l-2 border-border/50 ml-2 pl-4 space-y-3">
              {categoryEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div className="absolute -left-2.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-primary/40" />
                  <Card className="bg-white/80 backdrop-blur">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-medium text-sm text-primary">{event.time}</p>
                          <p className="text-xs text-muted-foreground">{event.duration}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChecklistDemo() {
  const items = SAMPLE_CHECKLIST;
  const completed = items.filter((i) => i.completed).length;

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-muted-foreground text-sm">Progress</p>
            <p className="font-medium">{Math.round((completed / items.length) * 100)}%</p>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completed / items.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completed} of {items.length} tasks completed
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-medium">Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border/50">
            {items.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center p-4 hover:bg-muted/30 transition-colors"
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 transition-colors",
                    item.completed ? "bg-green-500 border-green-500" : "border-muted-foreground/30"
                  )}
                >
                  {item.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", item.completed && "line-through text-muted-foreground")}>{item.title}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground ml-2 flex-shrink-0">
                  {item.category}
                </span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// MAIN DEMO PAGE
// ============================================================================

type TabId = "budget" | "guests" | "timeline" | "checklist";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "guests", label: "Guests", icon: Users },
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "checklist", label: "Checklist", icon: CheckCircle2 },
];

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<TabId>("budget");

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-amber-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-serif text-xl font-medium tracking-tight">
            Scribe & Stem
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              Demo Mode
            </span>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-4 bg-foreground text-background hover:bg-primary">
                Start Planning <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-rose-100/50 to-amber-100/50 py-6 px-4 text-center border-b border-border/30">
        <h1 className="font-serif text-2xl md:text-3xl mb-2">
          Sarah & Jake&apos;s Wedding
        </h1>
        <p className="text-muted-foreground text-sm">
          Explore a sample wedding plan • October 12, 2024
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-[57px] z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-foreground text-background shadow-md"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "budget" && <BudgetDemo />}
            {activeTab === "guests" && <GuestsDemo />}
            {activeTab === "timeline" && <TimelineDemo />}
            {activeTab === "checklist" && <ChecklistDemo />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Link href="/register">
          <Button
            size="lg"
            className="rounded-full px-6 shadow-xl bg-foreground text-background hover:bg-primary hover:scale-105 transition-all"
          >
            Create Your Own Plan <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Footer spacer for floating CTA */}
      <div className="h-24" />
    </div>
  );
}
