"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { VendorCard } from "./VendorCard";
import { VendorFilters } from "./VendorFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MapPin, Search, Plus, ExternalLink } from "lucide-react";
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

  // Vendor request dialog state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    vendorName: "",
    website: "",
    notes: "",
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Generate Google search URL based on current filters
  const getGoogleSearchUrl = () => {
    const parts = [];
    if (category) parts.push(category.replace("-", " "));
    if (search) parts.push(search);
    if (state) parts.push(state);
    if (weddingLocation?.city) parts.push(weddingLocation.city);

    if (parts.length === 0) {
      parts.push("wedding vendors");
      if (weddingLocation?.state) parts.push(weddingLocation.state);
    }

    const query = encodeURIComponent(parts.join(" "));
    return `https://www.google.com/search?q=${query}`;
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.vendorName.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const response = await fetch("/api/vendors/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorName: requestForm.vendorName,
          category: category || "other",
          city: weddingLocation?.city,
          state: state || weddingLocation?.state,
          website: requestForm.website,
          notes: requestForm.notes,
          searchQuery: search,
        }),
      });

      if (response.ok) {
        toast.success("Vendor request submitted! We'll look into adding them.");
        setRequestDialogOpen(false);
        setRequestForm({ vendorName: "", website: "", notes: "" });
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmittingRequest(false);
    }
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
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground">No vendors found matching your criteria</p>
            <p className="text-sm mt-2 mb-6 max-w-md mx-auto">
              Try adjusting your filters, or search Google for local vendors and request we add them!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(getGoogleSearchUrl(), "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Search Google
              </Button>
              <Button
                className="gap-2"
                onClick={() => setRequestDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Request a Vendor
              </Button>
            </div>
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

      {/* Vendor Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Vendor</DialogTitle>
            <DialogDescription>
              Found a vendor you&apos;d like to see in our directory? Let us know and we&apos;ll reach out to them!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name *</Label>
              <Input
                id="vendorName"
                placeholder="e.g., The Potted Pansy"
                value={requestForm.vendorName}
                onChange={(e) => setRequestForm({ ...requestForm, vendorName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                placeholder="e.g., https://thepottedpansy.com"
                value={requestForm.website}
                onChange={(e) => setRequestForm({ ...requestForm, website: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any details that might help us find them..."
                value={requestForm.notes}
                onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={isSubmittingRequest}>
              {isSubmittingRequest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
