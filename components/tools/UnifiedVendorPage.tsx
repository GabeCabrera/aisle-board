"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { VendorFeed } from "./stem/VendorFeed";
import VendorsTool from "./VendorsTool";
import { Compass, Heart, Loader2, Bookmark, MapPin, Star, ExternalLink } from "lucide-react";
import type { PlannerData } from "@/lib/hooks/usePlannerData";
import type { VendorProfile } from "@/lib/db/schema";
import type { LocationMatch, WeddingLocation } from "@/lib/data/stem";

type VendorWithLocation = VendorProfile & { locationMatch?: LocationMatch };
type SavedVendor = VendorProfile & { savedAt?: Date; notes?: string | null };

interface UnifiedVendorPageProps {
  // My vendors props
  plannerData?: PlannerData;
  // Directory props
  initialVendors: VendorProfile[];
  initialCategories: string[];
  initialStates: string[];
  savedVendorIds?: string[];
  savedVendors?: SavedVendor[];
  recommendedVendors?: VendorWithLocation[];
  weddingLocation?: WeddingLocation | null;
}

export function UnifiedVendorPage({
  plannerData,
  initialVendors,
  initialCategories,
  initialStates,
  savedVendorIds: initialSavedVendorIds = [],
  savedVendors: initialSavedVendors = [],
  recommendedVendors = [],
  weddingLocation,
}: UnifiedVendorPageProps) {
  const [activeTab, setActiveTab] = useState("discover");

  // Manage saved vendors as state for real-time updates
  const [savedVendorsList, setSavedVendorsList] = useState<SavedVendor[]>(initialSavedVendors);
  const savedVendorIds = savedVendorsList.map((v) => v.id);

  // Handle save/unsave from VendorFeed
  const handleSaveChange = (vendor: VendorProfile, saved: boolean) => {
    setSavedVendorsList((prev) => {
      if (saved) {
        // Add vendor if not already in list
        if (!prev.some((v) => v.id === vendor.id)) {
          return [{ ...vendor, savedAt: new Date() }, ...prev];
        }
        return prev;
      } else {
        // Remove vendor from list
        return prev.filter((v) => v.id !== vendor.id);
      }
    });
  };

  // Count of tracked vendors + saved vendors
  const trackedCount = plannerData?.vendors?.list?.length || 0;
  const savedCount = savedVendorsList.length;
  const myVendorsCount = trackedCount + savedCount;

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="border-b border-border/50 pb-6 mb-6 px-6 pt-2">
        <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
          Vendors
        </h1>
        <p className="text-xl text-muted-foreground mt-2 font-light max-w-lg">
          Discover wedding vendors and track your favorites
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-muted/50">
            <TabsTrigger
              value="discover"
              className="flex items-center gap-2 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Compass className="h-4 w-4" />
              <span>Discover</span>
            </TabsTrigger>
            <TabsTrigger
              value="my-vendors"
              className="flex items-center gap-2 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Heart className="h-4 w-4" />
              <span>My Vendors</span>
              {myVendorsCount > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {myVendorsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="discover" className="mt-0">
          <Suspense fallback={<VendorFeedSkeleton />}>
            <VendorFeed
              initialVendors={initialVendors}
              initialCategories={initialCategories}
              initialStates={initialStates}
              savedVendorIds={savedVendorIds}
              recommendedVendors={recommendedVendors}
              weddingLocation={weddingLocation}
              hideHeader
              onSaveChange={handleSaveChange}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="my-vendors" className="mt-0">
          <div className="px-6">
            <MyVendorsContent plannerData={plannerData} savedVendors={savedVendorsList} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component to avoid duplicate header from VendorsTool
function MyVendorsContent({
  plannerData,
  savedVendors = []
}: {
  plannerData?: PlannerData;
  savedVendors?: SavedVendor[];
}) {
  const router = useRouter();
  const hasTrackedVendors = (plannerData?.vendors?.list?.length || 0) > 0;
  const hasSavedVendors = savedVendors.length > 0;

  return (
    <div className="space-y-8">
      {/* Saved Vendors from Directory */}
      {hasSavedVendors && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-2xl text-foreground">Saved Vendors</h2>
            <span className="text-sm text-muted-foreground">({savedVendors.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedVendors.map((vendor) => (
              <Card
                key={vendor.id}
                className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50"
                onClick={() => router.push(`/planner/stem/vendors/${vendor.slug}`)}
              >
                {/* Image */}
                <div className="relative h-32 bg-muted">
                  {vendor.coverImage ? (
                    <Image
                      src={vendor.coverImage}
                      alt={vendor.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="font-serif text-3xl text-primary/30">
                        {vendor.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Category badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/90 text-foreground capitalize">
                      {vendor.category}
                    </span>
                  </div>
                  {/* View profile indicator */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary text-white flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      View
                    </span>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {vendor.name}
                  </h3>
                  {(vendor.city || vendor.state) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {vendor.averageRating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{vendor.averageRating.toFixed(1)}</span>
                        {vendor.reviewCount && (
                          <span className="text-muted-foreground">({vendor.reviewCount})</span>
                        )}
                      </div>
                    )}
                    {vendor.priceRange && (
                      <span className="text-sm text-muted-foreground">{vendor.priceRange}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tracked Vendors from Chat */}
      {hasTrackedVendors && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-2xl text-foreground">Tracked Vendors</h2>
          </div>
          <VendorsTool initialData={plannerData} hideHeader />
        </div>
      )}

      {/* Empty state */}
      {!hasTrackedVendors && !hasSavedVendors && (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
          <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium text-foreground">No saved vendors yet</p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            Browse vendors in the Discover tab and click the heart to save your favorites.
          </p>
        </div>
      )}
    </div>
  );
}

// Loading skeleton for VendorFeed while useSearchParams resolves
function VendorFeedSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Filters skeleton */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}
