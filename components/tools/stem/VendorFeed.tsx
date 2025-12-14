"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { VendorCard } from "./VendorCard";
import { VendorFilters } from "./VendorFilters";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { VendorProfile } from "@/lib/db/schema";
import type { LocationMatch, WeddingLocation } from "@/lib/data/stem";

type VendorWithLocation = VendorProfile & { locationMatch?: LocationMatch };

interface VendorFeedProps {
  initialVendors: VendorProfile[];
  initialCategories: string[];
  initialStates: string[];
  savedVendorIds?: string[];
  recommendedVendors?: VendorWithLocation[];
  weddingLocation?: WeddingLocation | null;
}

export function VendorFeed({
  initialVendors,
  initialCategories,
  initialStates,
  savedVendorIds = [],
  recommendedVendors = [],
  weddingLocation,
}: VendorFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vendors, setVendors] = useState(initialVendors);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(savedVendorIds));
  const [isLoading, setIsLoading] = useState(false);

  // Filter state from URL params (use wedding location state as default)
  const [category, setCategory] = useState(searchParams.get("category") || undefined);
  const [state, setState] = useState(searchParams.get("state") || undefined);
  const [priceRange, setPriceRange] = useState(searchParams.get("priceRange") || undefined);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "featured");

  // Track if any filters are active (to hide recommended section)
  const hasActiveFilters = !!(category || state || priceRange || search);

  // Update URL when filters change
  const updateUrl = useCallback((params: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    const queryString = newParams.toString();
    router.push(`/planner/stem/vendors${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [router]);

  // Fetch vendors when filters change
  const fetchVendors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (state) params.set("state", state);
      if (priceRange) params.set("priceRange", priceRange);
      if (search) params.set("search", search);
      if (sortBy) params.set("sortBy", sortBy);

      const response = await fetch(`/api/vendors?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setIsLoading(false);
    }
  }, [category, state, priceRange, search, sortBy]);

  // Update vendors when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVendors();
      updateUrl({ category, state, priceRange, search: search || undefined, sortBy });
    }, 300);
    return () => clearTimeout(timer);
  }, [category, state, priceRange, search, sortBy, fetchVendors, updateUrl]);

  const handleSaveToggle = async (vendorId: string, currentlySaved: boolean) => {
    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (currentlySaved) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });

    try {
      const response = await fetch("/api/vendors/saves", {
        method: currentlySaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update save");
      }

      toast.success(currentlySaved ? "Removed from saved vendors" : "Added to saved vendors");
    } catch (error) {
      // Revert optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) {
          next.add(vendorId);
        } else {
          next.delete(vendorId);
        }
        return next;
      });
      toast.error("Failed to update saved vendors");
    }
  };

  const handleClearFilters = () => {
    setCategory(undefined);
    setState(undefined);
    setPriceRange(undefined);
    setSearch("");
    setSortBy("featured");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="border-b border-border/50 pb-8">
        <h1 className="font-serif text-5xl md:text-7xl text-foreground tracking-tight">
          Vendors
        </h1>
        <p className="text-xl text-muted-foreground mt-4 font-light max-w-lg">
          Discover trusted wedding professionals. Save your favorites and connect directly.
        </p>
      </div>

      {/* Recommended for Your Area */}
      {!hasActiveFilters && recommendedVendors.length > 0 && weddingLocation?.state && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-2xl text-foreground">
              Recommended Near {weddingLocation.city || weddingLocation.state}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedVendors.slice(0, 4).map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                isSaved={savedIds.has(vendor.id)}
                onSaveToggle={handleSaveToggle}
                locationMatch={vendor.locationMatch}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <VendorFilters
        categories={initialCategories}
        states={initialStates}
        selectedCategory={category}
        selectedState={state}
        selectedPriceRange={priceRange}
        searchQuery={search}
        sortBy={sortBy}
        onCategoryChange={setCategory}
        onStateChange={setState}
        onPriceRangeChange={setPriceRange}
        onSearchChange={setSearch}
        onSortChange={setSortBy}
        onClearFilters={handleClearFilters}
        defaultState={weddingLocation?.state}
      />

      {/* Vendor Grid */}
      <div className="min-h-[500px]">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
            <p className="text-lg">No vendors found matching your criteria.</p>
            <p className="text-sm mt-2">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 750: 2, 1100: 3 }}>
            <Masonry gutter="24px">
              {vendors.map((vendor) => (
                <div key={vendor.id} className="mb-6">
                  <VendorCard
                    vendor={vendor}
                    isSaved={savedIds.has(vendor.id)}
                    onSaveToggle={handleSaveToggle}
                  />
                </div>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        )}
      </div>
    </div>
  );
}
