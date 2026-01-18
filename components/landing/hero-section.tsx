"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Wallet, Users, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Mini preview components that mirror the actual product
function BudgetPreview() {
  const categories = [
    { name: "Venue", amount: 8500, color: "bg-rose-400" },
    { name: "Catering", amount: 6800, color: "bg-amber-400" },
    { name: "Photo", amount: 4500, color: "bg-emerald-400" },
    { name: "Flowers", amount: 3200, color: "bg-violet-400" },
  ];
  const total = 28450;
  const budget = 35000;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-muted-foreground">Total Budget</p>
          <p className="text-lg font-semibold">$35,000</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Allocated</p>
          <p className="text-lg font-semibold text-primary">$28,450</p>
        </div>
      </div>
      
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-foreground rounded-full"
          initial={{ width: 0 }}
          animate={{ width: "81%" }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-right">81% allocated</p>

      <div className="space-y-2 pt-2">
        {categories.map((cat, i) => (
          <motion.div 
            key={cat.name} 
            className="flex items-center justify-between text-xs"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", cat.color)} />
              <span className="text-muted-foreground">{cat.name}</span>
            </div>
            <span className="font-medium">${cat.amount.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function GuestsPreview() {
  const guests = [
    { initials: "SC", name: "Sarah Chen", status: "confirmed" },
    { initials: "JR", name: "James Rodriguez", status: "confirmed" },
    { initials: "EW", name: "Emily Watson", status: "pending" },
    { initials: "DP", name: "David Park", status: "confirmed" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-semibold text-foreground">142</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-green-600">98</p>
          <p className="text-[10px] text-green-600">Confirmed</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-amber-600">38</p>
          <p className="text-[10px] text-amber-600">Pending</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {guests.map((guest, i) => (
          <motion.div 
            key={guest.name}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <div className="h-6 w-6 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] font-medium">
              {guest.initials}
            </div>
            <span className="text-xs flex-1 truncate">{guest.name}</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[9px]",
              guest.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            )}>
              {guest.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TimelinePreview() {
  const events = [
    { time: "4:00 PM", title: "Ceremony", icon: "💒" },
    { time: "4:30 PM", title: "Cocktails", icon: "🥂" },
    { time: "6:00 PM", title: "Dinner", icon: "🍽️" },
    { time: "8:00 PM", title: "Dancing", icon: "💃" },
  ];

  return (
    <div className="space-y-2">
      {events.map((event, i) => (
        <motion.div 
          key={event.title}
          className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.15 }}
        >
          <span className="text-base">{event.icon}</span>
          <div className="flex-1">
            <p className="text-xs font-medium">{event.title}</p>
          </div>
          <span className="text-[10px] text-foreground font-medium">{event.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Text Content - Centered */}
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-sm font-medium text-foreground mb-6">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              Wedding Planning Made Simple
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 text-foreground">
              Your wedding, <br className="hidden sm:block" />
              <span className="text-primary italic">beautifully organized.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 font-light leading-relaxed max-w-2xl mx-auto">
              Budget, guests, timeline, vendors—all in one place. 
              Stop juggling spreadsheets and start enjoying the engagement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-lg bg-foreground hover:bg-foreground/90 text-background rounded-full transition-colors">
                  Start Planning Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full border border-border hover:bg-muted/30">
                  Explore Demo
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {["👩", "👨", "👩‍🦰"].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <p>Trusted by 2,000+ couples</p>
            </div>
          </motion.div>
        </div>

        {/* Product Preview - Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Budget Card - Takes 2 columns on larger screens */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Budget Tracker</h3>
              </div>
              <BudgetPreview />
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-2xl border border-border shadow-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Day-of Timeline</h3>
              </div>
              <TimelinePreview />
            </div>

            {/* Guests Card */}
            <div className="md:col-span-2 bg-white rounded-2xl border border-border shadow-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Guest List & RSVPs</h3>
              </div>
              <GuestsPreview />
            </div>

            {/* Checklist Mini Card */}
            <div className="bg-white rounded-2xl border border-border shadow-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Checklist</h3>
              </div>
              <div className="space-y-2">
                {[
                  { text: "Book venue", done: true },
                  { text: "Hire photographer", done: true },
                  { text: "Order dress", done: true },
                  { text: "Send invitations", done: false },
                  { text: "Book honeymoon", done: false },
                ].map((item, i) => (
                  <motion.div 
                    key={item.text}
                    className="flex items-center gap-2 text-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      item.done ? "bg-green-500 border-green-500" : "border-muted-foreground/30"
                    )}>
                      {item.done && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <span className={cn(item.done && "line-through text-muted-foreground")}>
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground">3 of 5 completed</p>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                  <motion.div 
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "60%" }}
                    transition={{ duration: 1, delay: 1.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
