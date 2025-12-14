"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VendorFeed } from "./stem/VendorFeed";
import VendorsTool from "./VendorsTool";
import { Store, Compass, Heart } from "lucide-react";
import type { PlannerData } from "@/lib/hooks/usePlannerData";
import type { VendorProfile } from "@/lib/db/schema";
import type { LocationMatch, WeddingLocation } from "@/lib/data/stem";

type VendorWithLocation = VendorProfile & { locationMatch?: LocationMatch };

interface UnifiedVendorPageProps {
  // My vendors props
  plannerData?: PlannerData;
  // Directory props
  initialVendors: VendorProfile[];
  initialCategories: string[];
  initialStates: string[];
  savedVendorIds?: string[];
  recommendedVendors?: VendorWithLocation[];
  weddingLocation?: WeddingLocation | null;
}

export function UnifiedVendorPage({
  plannerData,
  initialVendors,
  initialCategories,
  initialStates,
  savedVendorIds = [],
  recommendedVendors = [],
  weddingLocation,
}: UnifiedVendorPageProps) {
  const [activeTab, setActiveTab] = useState("discover");

  // Count of tracked vendors
  const myVendorsCount = plannerData?.vendors?.list?.length || 0;

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
          <VendorFeed
            initialVendors={initialVendors}
            initialCategories={initialCategories}
            initialStates={initialStates}
            savedVendorIds={savedVendorIds}
            recommendedVendors={recommendedVendors}
            weddingLocation={weddingLocation}
            hideHeader
          />
        </TabsContent>

        <TabsContent value="my-vendors" className="mt-0">
          <div className="px-6">
            <MyVendorsContent plannerData={plannerData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component to avoid duplicate header from VendorsTool
function MyVendorsContent({ plannerData }: { plannerData?: PlannerData }) {
  return <VendorsTool initialData={plannerData} hideHeader />;
}
