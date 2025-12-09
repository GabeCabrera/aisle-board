"use client";

import React, { useState } from "react";
import { usePlannerData, TimelineEvent } from "@/lib/hooks/usePlannerData";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Calendar,
  Home,
  Heart,
  Martini,
  Utensils,
  Sparkles,
  Circle,
  RefreshCw, // For refresh button
} from "lucide-react";
import TimelineEventCard from './TimelineEventCard';


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

const categoryOrder = ["Prep", "Ceremony", "Cocktail Hour", "Reception", "Other"];


interface TimelineToolProps {
  initialData?: any;
}

export default function TimelineTool({ initialData }: TimelineToolProps) {
  const router = useRouter();
  // Request specific sections
  const { data, loading, refetch, isFetching } = usePlannerData(["timeline", "kernel", "summary"], { initialData });

  const handleRefresh = async () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  const events = data?.timeline?.events || [];
  const hasData = events.length > 0;
  const weddingDate = data?.summary?.weddingDate;

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return timeA.localeCompare(timeB);
  });

  // Group by category
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const category = event.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const orderedCategories = categoryOrder.filter(cat => groupedEvents[cat]?.length > 0);
  Object.keys(groupedEvents).forEach(cat => {
    if (!orderedCategories.includes(cat)) orderedCategories.push(cat);
  });

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Wedding Day Timeline
          </h1>
          <p className="text-xl text-muted-foreground mt-2 font-light">
            {weddingDate
              ? `Your schedule for ${new Date(weddingDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}`
              : "Your day-of schedule"}
          </p>
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

      {!hasData ? (
        /* Empty state */
        <Card className="text-center p-8 border-dashed border-muted-foreground/30 shadow-none bg-canvas">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-primary" data-testid="empty-timeline-icon" />
          </div>
          <CardTitle className="font-serif text-2xl text-foreground mb-2">No timeline events yet</CardTitle>
          <p className="text-muted-foreground mb-6">
            Tell me about your wedding day schedule in chat and I&apos;ll build your timeline.
          </p>
          <Button onClick={() => router.push('/planner/chat')} className="rounded-full px-6 shadow-soft">
            Go to chat
          </Button>

          <Card className="mt-6 p-4 text-left shadow-none border-border/70 bg-background">
            <CardTitle className="font-sans text-lg mb-2">Example things to tell me:</CardTitle>
            <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
              <li>"Ceremony starts at 4pm"</li>
              <li>"Hair and makeup from 10am to 1pm"</li>
              <li>"First dance right after dinner"</li>
              <li>"We want to do a sparkler exit at 10pm"</li>
            </ul>
          </Card>
        </Card>
      ) : (
        <div className="space-y-8">
          {orderedCategories.map((category) => (
            <div key={category} className="relative pl-8"> {/* Timeline Item Container */}
              {/* Category Header */}
              <div className="absolute -left-1.5 top-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 border border-primary/20 z-10">
                {getCategoryIcon(category)}
              </div>
              <h2 className="font-serif text-2xl text-foreground ml-4 mb-4">{category}</h2>

              {/* Events for this category */}
              <div className="relative border-l-2 border-border/70 ml-3 pl-5 space-y-6">
                {groupedEvents[category].map((event, index) => (
                  <div key={event.id || index} className="relative">
                    {/* Event Dot */}
                    <div className="absolute -left-3.5 top-0.5 w-6 h-6 rounded-full bg-white border-2 border-primary/40 flex items-center justify-center z-10">
                      <Circle className="h-2 w-2 text-primary/70 fill-primary/70" />
                    </div>
                    {/* Event Content */}
                    <div className="ml-0">
                      <TimelineEventCard event={event} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-4 p-4 bg-muted/30 rounded-2xl">
        <p className="text-muted-foreground text-sm">
          Need to add or adjust your timeline?{" "}
          <Link href="#" onClick={() => router.push('/planner/chat')} className="text-primary font-medium hover:underline">
            Tell me in chat
          </Link>
        </p>
      </div>
    </div>
  );
}