"use client";

import { useState, useEffect } from "react";
import { usePlannerData, formatCurrency, Vendor } from "@/lib/hooks/usePlannerData";
import {
  Building2, Utensils, Camera, Video, Flower2, Music, Guitar, Cake,
  Heart, Scissors, Sparkles, Armchair, Car, ClipboardList, Mail, Pin,
  RefreshCw, Clock
} from "lucide-react";
import { LucideIcon } from "lucide-react";

// Category icons and colors
const categoryConfig: Record<string, { Icon: LucideIcon; color: string }> = {
  venue: { Icon: Building2, color: "bg-blue-50 text-blue-700" },
  catering: { Icon: Utensils, color: "bg-orange-50 text-orange-700" },
  photographer: { Icon: Camera, color: "bg-purple-50 text-purple-700" },
  photography: { Icon: Camera, color: "bg-purple-50 text-purple-700" },
  videographer: { Icon: Video, color: "bg-pink-50 text-pink-700" },
  videography: { Icon: Video, color: "bg-pink-50 text-pink-700" },
  florist: { Icon: Flower2, color: "bg-green-50 text-green-700" },
  flowers: { Icon: Flower2, color: "bg-green-50 text-green-700" },
  dj: { Icon: Music, color: "bg-yellow-50 text-yellow-700" },
  band: { Icon: Guitar, color: "bg-yellow-50 text-yellow-700" },
  music: { Icon: Music, color: "bg-yellow-50 text-yellow-700" },
  cake: { Icon: Cake, color: "bg-amber-50 text-amber-700" },
  bakery: { Icon: Cake, color: "bg-amber-50 text-amber-700" },
  officiant: { Icon: Heart, color: "bg-sky-50 text-sky-700" },
  hair: { Icon: Scissors, color: "bg-red-50 text-red-700" },
  makeup: { Icon: Sparkles, color: "bg-red-50 text-red-700" },
  beauty: { Icon: Sparkles, color: "bg-red-50 text-red-700" },
  rentals: { Icon: Armchair, color: "bg-cyan-50 text-cyan-700" },
  transportation: { Icon: Car, color: "bg-indigo-50 text-indigo-700" },
  planner: { Icon: ClipboardList, color: "bg-teal-50 text-teal-700" },
  coordinator: { Icon: ClipboardList, color: "bg-teal-50 text-teal-700" },
  invitations: { Icon: Mail, color: "bg-rose-50 text-rose-700" },
  stationery: { Icon: Mail, color: "bg-rose-50 text-rose-700" },
};

function getCategoryConfig(category: string) {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(categoryConfig)) {
    if (key.includes(k)) return v;
  }
  return { Icon: Pin, color: "bg-stone-50 text-stone-700" };
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function VendorsTool() {
  const { data, loading, refetch, lastRefresh } = usePlannerData();
  const [filter, setFilter] = useState<"all" | "booked" | "researching">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("just now");

  // Update "time ago" display every 10 seconds
  useEffect(() => {
    const updateTimeAgo = () => setTimeAgo(formatTimeAgo(lastRefresh));
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh > 30000) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [lastRefresh, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const vendors = data?.vendors;
  const stats = vendors?.stats;
  const hasData = vendors && vendors.list.length > 0;

  // Filter vendors
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

  // Group by category
  const byCategory = filteredVendors.reduce((acc, vendor) => {
    const cat = vendor.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(vendor);
    return acc;
  }, {} as Record<string, Vendor[]>);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-1">Vendors</h1>
          <p className="text-ink-soft">Track your wedding vendors</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {timeAgo}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-soft hover:text-ink hover:bg-stone-100 transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
          </div>
          <h2 className="font-medium text-ink text-xl mb-2">No vendors yet</h2>
          <p className="text-ink-soft mb-6">
            Tell me about your vendors in chat and I&apos;ll track them here.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Go to chat
          </a>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Total Vendors</p>
              <p className="text-2xl font-serif text-ink">{stats?.total || 0}</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Booked</p>
              <p className="text-2xl font-serif text-green-600">{stats?.booked || 0}</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Total Cost</p>
              <p className="text-2xl font-serif text-ink">
                {stats?.totalCost ? formatCurrency(stats.totalCost) : "$0"}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Deposits Paid</p>
              <p className="text-2xl font-serif text-ink">
                {stats?.totalDeposits ? formatCurrency(stats.totalDeposits) : "$0"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-6">
            {(["all", "booked", "researching"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-rose-500 text-white"
                    : "bg-white border border-stone-200 text-ink-soft hover:border-rose-300"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Vendor Cards by Category */}
          {Object.entries(byCategory).map(([category, categoryVendors]) => (
            <div key={category} className="mb-6">
              <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                <span className={`w-6 h-6 rounded flex items-center justify-center ${getCategoryConfig(category).color}`}>
                  {(() => {
                    const config = getCategoryConfig(category);
                    const IconComponent = config.Icon;
                    return <IconComponent className="w-4 h-4" />;
                  })()}
                </span>
                {category}
                <span className="text-xs text-ink-faint font-normal">({categoryVendors.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            </div>
          ))}

          {filteredVendors.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
              <p className="text-ink-soft">No vendors match this filter</p>
            </div>
          )}

          {/* Help prompt */}
          <div className="mt-6 p-4 bg-stone-50 rounded-xl text-center">
            <p className="text-sm text-ink-soft">
              Need to add or update a vendor?{" "}
              <a href="/" className="text-rose-600 hover:text-rose-700 font-medium">
                Tell me in chat
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const config = getCategoryConfig(vendor.category);
  
  const statusStyle = () => {
    switch (vendor.status) {
      case "booked":
      case "confirmed":
        return "bg-green-50 text-green-700";
      case "paid":
        return "bg-green-100 text-green-800";
      case "contacted":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  const statusLabel = () => {
    switch (vendor.status) {
      case "booked":
      case "confirmed":
        return "Booked";
      case "paid":
        return "Paid";
      case "contacted":
        return "Contacted";
      case "researching":
        return "Researching";
      default:
        return "Researching";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
            <config.Icon className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-medium text-ink">{vendor.name}</h4>
            <p className="text-xs text-ink-faint">{vendor.category}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle()}`}>
          {statusLabel()}
        </span>
      </div>

      {/* Cost */}
      {vendor.cost ? (
        <div className="mb-3 p-3 bg-stone-50 rounded-xl">
          <div className="flex justify-between items-center">
            <span className="text-sm text-ink-soft">Total cost</span>
            <span className="font-medium text-ink">{formatCurrency(vendor.cost)}</span>
          </div>
          {vendor.depositPaid ? (
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-ink-faint">Deposit paid</span>
              <span className="text-xs text-green-600">{formatCurrency(vendor.depositPaid)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Contact info */}
      <div className="space-y-2">
        {vendor.phone && (
          <a 
            href={`tel:${vendor.phone}`}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {vendor.phone}
          </a>
        )}
        {vendor.email && (
          <a 
            href={`mailto:${vendor.email}`}
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors truncate"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span className="truncate">{vendor.email}</span>
          </a>
        )}
        {vendor.website && (
          <a 
            href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors truncate"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <span className="truncate">{vendor.website}</span>
          </a>
        )}
      </div>

      {/* Contract status */}
      {vendor.contractSigned && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Contract signed
          </span>
        </div>
      )}

      {/* Notes */}
      {vendor.notes && (
        <p className="mt-3 pt-3 border-t border-stone-100 text-xs text-ink-faint">
          {vendor.notes}
        </p>
      )}
    </div>
  );
}
