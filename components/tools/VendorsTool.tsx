"use client";

import React, { useState } from "react";
import { usePlannerData, formatCurrency, Vendor, PlannerData } from "@/lib/hooks/usePlannerData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Store,
  Search,
  Loader2,
} from "lucide-react";

import VendorCard from "./vendors-tool/VendorCard";

interface VendorsToolProps {
  initialData?: PlannerData;
}

export default function VendorsTool({ initialData }: VendorsToolProps) {
  const router = useRouter();
  const { data, loading, refetch, isFetching } = usePlannerData(["vendors", "kernel"], { initialData });
  const [filter, setFilter] = useState<"all" | "booked" | "researching">("all");
  const [search, setSearch] = useState("");

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

  const vendors = data?.vendors;
  const stats = vendors?.stats;
  const hasData = vendors && vendors.list.length > 0;

  // Filter and search logic
  let filteredVendors = vendors?.list || [];
  if (filter === "booked") {
    filteredVendors = filteredVendors.filter(v =>
      v.status === "booked" || v.status === "confirmed" || v.status === "paid"
    );
  } else if (filter === "researching") {
    filteredVendors = filteredVendors.filter(v =>
      v.status === "researching" || v.status === "contacted" || !v.status
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filteredVendors = filteredVendors.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    );
  }

  // Group by category
  const byCategory = filteredVendors.reduce((acc, vendor) => {
    const cat = vendor.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(vendor);
    return acc;
  }, {} as Record<string, Vendor[]>);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Vendors
          </h1>
          <p className="text-xl text-muted-foreground mt-2 font-light">
            Track your wedding vendors and contacts
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
            <Store className="h-8 w-8 text-primary" data-testid="empty-vendors-icon" />
          </div>
          <CardTitle className="font-serif text-2xl text-foreground mb-2">No vendors yet</CardTitle>
          <p className="text-muted-foreground mb-6">
            Tell me about your vendors in chat and I&apos;ll track them here.
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
                <p className="text-muted-foreground text-sm mb-1">Total Vendors</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">{stats?.total || 0}</h3>
              </CardContent>
            </Card>
            <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-0">
                <p className="text-green-700 text-sm mb-1">Booked</p>
                <h3 className="font-sans text-2xl font-medium text-green-700">{stats?.booked || 0}</h3>
              </CardContent>
            </Card>
            <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-0">
                <p className="text-muted-foreground text-sm mb-1">Total Cost</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">{stats?.totalCost ? formatCurrency(stats.totalCost) : "$0"}</h3>
              </CardContent>
            </Card>
            <Card className="bg-white rounded-3xl p-6 border border-border shadow-soft hover:shadow-lifted transition-all duration-300">
              <CardContent className="p-0">
                <p className="text-muted-foreground text-sm mb-1">Deposits Paid</p>
                <h3 className="font-sans text-2xl font-medium text-foreground">{stats?.totalDeposits ? formatCurrency(stats.totalDeposits) : "$0"}</h3>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl h-10"
              />
            </div>
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
                variant={filter === "booked" ? "default" : "outline"}
                onClick={() => setFilter("booked")}
                className={cn(
                  "rounded-full px-4",
                  filter === "booked" ? "bg-green-600 text-white hover:bg-green-700" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
              >
                Booked
              </Button>
              <Button
                variant={filter === "researching" ? "default" : "outline"}
                onClick={() => setFilter("researching")}
                className={cn(
                  "rounded-full px-4",
                  filter === "researching" ? "bg-amber-600 text-white hover:bg-amber-700" : "border-border text-muted-foreground hover:bg-muted/30"
                )}
              >
                Researching
              </Button>
            </div>
          </div>

          {/* Vendor Cards by Category */}
          {Object.entries(byCategory).map(([category, categoryVendors]) => (
            <div key={category} className="space-y-4">
              <h2 className="font-serif text-3xl text-foreground">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryVendors.map((vendor) => (
                  <VendorCard vendor={vendor} key={vendor.id} />
                ))}
              </div>
            </div>
          ))}

          {filteredVendors.length === 0 && (
            <div className="text-center p-8 bg-muted/30 rounded-2xl text-muted-foreground">
              <Store className="h-8 w-8 mx-auto mb-4" />
              <p>No vendors match this filter or search criteria.</p>
            </div>
          )}

          {/* Help prompt */}
          <div className="text-center mt-4 p-4 bg-muted/30 rounded-2xl">
            <p className="text-muted-foreground text-sm">
              Need to add or update a vendor?{" "}
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