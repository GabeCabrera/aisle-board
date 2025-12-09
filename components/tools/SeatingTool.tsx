"use client";

import React, { useState } from "react";
import { usePlannerData } from "@/lib/hooks/usePlannerData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Users,
  Armchair,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  tableNumber: number;
  guests: any[];
  count: number;
  isFull: boolean;
}

interface UnseatedGuest {
  id: string;
  name: string;
  email?: string;
  rsvp?: string;
}

interface SeatingToolProps {
  initialData?: any;
}

export default function SeatingTool({ initialData }: SeatingToolProps) {
  const router = useRouter();
  // Request specific sections
  const { data, loading, refetch, isFetching } = usePlannerData(["seating", "guests", "kernel"], { initialData });

  const handleRefresh = async () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const seatingData = data?.seating;
  const tables = (seatingData?.tables || []) as SeatingTable[];
  const unseated = (seatingData?.unseated || []) as UnseatedGuest[];
  const stats = seatingData?.stats;

  const hasData = tables.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Seating Chart
          </h1>
          <p className="text-xl text-muted-foreground mt-2 font-light">
            Manage tables and assign guests
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
            <Armchair className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-serif text-2xl text-foreground mb-2">No tables created yet</CardTitle>
          <p className="text-muted-foreground mb-6">
            Tell me to "Create a table for 8 people" or "Assign guests to tables".
          </p>
          <Button onClick={() => router.push('/planner/chat')} className="rounded-full px-6 shadow-soft">
            Go to chat
          </Button>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white p-4 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Guests</p>
                  <p className="text-2xl font-semibold text-foreground">{stats?.totalGuests || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-4 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <Armchair className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Seated</p>
                  <p className="text-2xl font-semibold text-green-700">{stats?.seatedCount || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white p-4 rounded-xl border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Unseated</p>
                  <p className="text-2xl font-semibold text-amber-700">{stats?.unseatedCount || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <Card key={table.id} className="overflow-hidden rounded-2xl border border-border shadow-soft">
                <CardHeader className="bg-muted/30 px-4 py-3 border-b border-border/50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white border border-border flex items-center justify-center font-serif text-muted-foreground text-sm shadow-sm">
                      {table.tableNumber}
                    </div>
                    <h3 className="font-medium text-foreground">{table.name}</h3>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    table.isFull ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  )}>
                    {table.count}/{table.capacity}
                  </span>
                </CardHeader>
                <CardContent className="p-0">
                  {table.guests.length > 0 ? (
                    <ul className="divide-y divide-border/30">
                      {table.guests.map((guest: any) => (
                        <li key={guest.id} className="px-4 py-2 text-sm text-foreground flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                          {guest.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground italic">
                      Empty table
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Unseated Guests */}
          {unseated.length > 0 && (
            <Card className="rounded-2xl border border-border shadow-soft">
              <CardHeader className="px-6 py-4 border-b border-border/50">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  Unseated Guests ({unseated.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {unseated.map((guest) => (
                    <span 
                      key={guest.id} 
                      className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm border border-amber-100"
                    >
                      {guest.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}