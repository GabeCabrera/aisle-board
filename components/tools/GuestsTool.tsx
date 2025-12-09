"use client";

import React, { useState } from "react";
import { usePlannerData, Guest } from "@/lib/hooks/usePlannerData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Users,
  PersonStanding,
  ListCollapse,
  Search
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function GuestRow({ guest }: { guest: Guest }) {
  const rsvpLabel = () => {
    switch (guest.rsvp) {
      case "confirmed":
      case "attending":
        return "Confirmed";
      case "declined":
        return "Declined";
      default:
        return "Pending";
    }
  };

  const rsvpColorClass = () => {
    switch (guest.rsvp) {
      case "confirmed":
      case "attending":
        return "bg-green-100 text-green-700";
      case "declined":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const initials = guest.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "G";

  return (
    <div className="flex items-center py-3 px-4 border-b last:border-b-0 border-border/70 group hover:bg-muted/30 transition-colors">
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4 font-medium shrink-0">
        {initials}
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground">{guest.name}</p>
        {(guest.email || guest.group) && (
          <p className="text-sm text-muted-foreground">
            {guest.email} {guest.group && guest.email ? "•" : ""} {guest.group}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {guest.plusOne && (
          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
            <PersonStanding className="h-3 w-3" />+1
          </span>
        )}
        {guest.dietaryRestrictions && (
          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
            {guest.dietaryRestrictions}
          </span>
        )}
        <span className={cn("px-2 py-0.5 rounded-full text-xs", rsvpColorClass())}>
          {rsvpLabel()}
        </span>
      </div>
    </div>
  );
}

interface GuestsToolProps {
  initialData?: any;
}

export default function GuestsTool({ initialData }: GuestsToolProps) {
  const router = useRouter();
  // Request only relevant sections
  const { data, loading, refetch, isFetching } = usePlannerData(["guests", "kernel"], { initialData });
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "declined">("all");
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "side" | "group">("none");

  const handleRefresh = async () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  const guests = data?.guests;
  const stats = guests?.stats;
  const hasData = guests && guests.list.length > 0;

  let filteredGuests = guests?.list || [];
  
  if (filter !== "all") {
    filteredGuests = filteredGuests.filter(g => {
      if (filter === "confirmed") return g.rsvp === "confirmed" || g.rsvp === "attending";
      if (filter === "declined") return g.rsvp === "declined";
      if (filter === "pending") return g.rsvp === "pending" || !g.rsvp;
      return true;
    });
  }
  
  if (search) {
    const q = search.toLowerCase();
    filteredGuests = filteredGuests.filter(g => 
      g.name.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.group?.toLowerCase().includes(q)
    );
  }

  const groupedGuests = (): Record<string, Guest[]> => {
    if (groupBy === "none") return { "All Guests": filteredGuests };
    
    return filteredGuests.reduce((acc, guest) => {
      let key: string;
      if (groupBy === "side") {
        key = guest.side === "bride" ? "Bride's Side" 
            : guest.side === "groom" ? "Groom's Side" 
            : "Both Sides";
      } else {
        key = guest.group || "No Group";
      }
      if (!acc[key]) acc[key] = [];
      acc[key].push(guest);
      return acc;
    }, {} as Record<string, Guest[]>);
  };

  const groups = groupedGuests();

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Guest List
          </h1>
          <p className="text-xl text-muted-foreground mt-2 font-light">
            Manage your wedding guests and RSVPs.
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
            <Users className="h-8 w-8 text-primary" data-testid="empty-guests-icon" />
          </div>
          <CardTitle className="font-serif text-2xl text-foreground mb-2">No guests yet</CardTitle>
          <p className="text-muted-foreground mb-6">
            Tell me about your guests in chat and I'll add them to your list.
          </p>
          <Button onClick={() => router.push('/planner/chat')} className="rounded-full px-6 shadow-soft">
            Go to chat
          </Button>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-0">
                <p className="text-muted-foreground text-sm mb-1">Total Guests</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">
                  {stats?.total || 0}
                </h3>
                {stats?.withPlusOnes ? (
                  <p className="text-sm text-muted-foreground mt-1">+{stats.withPlusOnes} plus ones</p>
                ) : null}
              </CardContent>
            </Card>
            <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-0">
                <p className="text-sm mb-1 text-green-700">Confirmed</p>
                <h3 className="font-sans text-2xl font-medium text-green-700">
                  {stats?.confirmed || 0}
                </h3>
              </CardContent>
            </Card>
            <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-0">
                <p className="text-sm mb-1 text-amber-700">Pending</p>
                <h3 className="font-sans text-2xl font-medium text-amber-700">
                  {stats?.pending || 0}
                </h3>
              </CardContent>
            </Card>
            <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-0">
                <p className="text-sm mb-1 text-red-700">Declined</p>
                <h3 className="font-sans text-2xl font-medium text-red-700">
                  {stats?.declined || 0}
                </h3>
              </CardContent>
            </Card>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-xl h-12"
            />
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-full px-4",
                  filter === "all" ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
              >
                All
              </Button>
              <Button
                variant={filter === "confirmed" ? "default" : "outline"}
                onClick={() => setFilter("confirmed")}
                className={cn(
                  "rounded-full px-4",
                  filter === "confirmed" ? "bg-green-600 text-white hover:bg-green-700" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
              >
                Confirmed
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => setFilter("pending")}
                className={cn(
                  "rounded-full px-4",
                  filter === "pending" ? "bg-amber-600 text-white hover:bg-amber-700" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
              >
                Pending
              </Button>
              <Button
                variant={filter === "declined" ? "default" : "outline"}
                onClick={() => setFilter("declined")}
                className={cn(
                  "rounded-full px-4",
                  filter === "declined" ? "bg-red-600 text-white hover:bg-red-700" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
              >
                Declined
              </Button>
            </div>
          </div>

          {/* Group By Buttons */}
          <div className="flex space-x-2 mt-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center">
              <ListCollapse className="h-4 w-4 mr-2" /> Group By:
            </span>
            <Button
              variant={groupBy === "none" ? "default" : "outline"}
              onClick={() => setGroupBy("none")}
              className={cn(
                "rounded-full px-4 h-9",
                groupBy === "none" ? "bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted/30"
              )}
            >
              None
            </Button>
            <Button
              variant={groupBy === "side" ? "default" : "outline"}
              onClick={() => setGroupBy("side")}
              className={cn(
                "rounded-full px-4 h-9",
                groupBy === "side" ? "bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted/30"
              )}
            >
              Side
            </Button>
            <Button
              variant={groupBy === "group" ? "default" : "outline"}
              onClick={() => setGroupBy("group")}
              className={cn(
                "rounded-full px-4 h-9",
                groupBy === "group" ? "bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted/30"
              )}
            >
              Group
            </Button>
          </div>

          {/* Guest List */}
          <Card className="bg-white rounded-3xl border border-border shadow-soft">
            {Object.entries(groups).map(([groupName, groupGuests]) => (
              <React.Fragment key={groupName}>
                {groupBy !== "none" && (
                  <CardHeader className="p-4 border-b border-border/70 bg-muted/20">
                    <CardTitle className="font-serif text-lg text-foreground">{groupName} ({groupGuests.length})</CardTitle>
                  </CardHeader>
                )}
                <div className="divide-y divide-border/70">
                  {groupGuests.length === 0 ? (
                    <p className="p-4 text-muted-foreground text-sm text-center">No guests in this group match the filter.</p>
                  ) : (
                    groupGuests.map((guest) => (
                      <GuestRow key={guest.id} guest={guest} />
                    ))
                  )}
                </div>
              </React.Fragment>
            ))}
          </Card>

          {filteredGuests.length === 0 && (
            <div className="text-center p-8 bg-muted/30 rounded-2xl text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-4" />
              <p>No guests match your search or filter criteria.</p>
            </div>
          )}

          {/* Help prompt */}
          <div className="text-center mt-4 p-4 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-sm">
              Need to add or update guests?{" "}
              <Link href="#" onClick={() => router.push('/planner/chat')} className="text-primary font-medium hover:underline">
                Tell me in chat
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
