"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorFiltersProps {
  categories: string[];
  states: string[];
  selectedCategory?: string;
  selectedState?: string;
  selectedPriceRange?: string;
  searchQuery?: string;
  sortBy?: string;
  defaultState?: string | null;
  onCategoryChange: (category: string | undefined) => void;
  onStateChange: (state: string | undefined) => void;
  onPriceRangeChange: (priceRange: string | undefined) => void;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  photographer: "Photographer",
  videographer: "Videographer",
  venue: "Venue",
  caterer: "Caterer",
  florist: "Florist",
  dj: "DJ",
  musician: "Musician",
  "wedding-planner": "Planner",
  "hair-makeup": "Hair & Makeup",
  officiant: "Officiant",
  rentals: "Rentals",
  bakery: "Bakery",
  stationery: "Stationery",
  transportation: "Transportation",
};

const PRICE_RANGES = [
  { value: "$", label: "$ - Budget Friendly" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
  { value: "saves", label: "Most Saved" },
  { value: "newest", label: "Newest" },
];

export function VendorFilters({
  categories,
  states,
  selectedCategory,
  selectedState,
  selectedPriceRange,
  searchQuery = "",
  sortBy = "featured",
  defaultState: _defaultState,
  onCategoryChange,
  onStateChange,
  onPriceRangeChange,
  onSearchChange,
  onSortChange,
  onClearFilters,
}: VendorFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const hasActiveFilters = selectedCategory || selectedState || selectedPriceRange || searchQuery;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearchChange(localSearch);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors by name, city..."
            className="pl-10 h-12 rounded-full bg-muted/30 border-transparent focus:bg-white transition-all"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {localSearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-48 h-12 rounded-full">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!selectedCategory ? "default" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => onCategoryChange(undefined)}
        >
          All Categories
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => onCategoryChange(selectedCategory === category ? undefined : category)}
          >
            {CATEGORY_LABELS[category] || category}
          </Button>
        ))}
      </div>

      {/* Dropdowns Row */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={selectedState || "all"}
          onValueChange={(v) => onStateChange(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-40 rounded-full">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedPriceRange || "all"}
          onValueChange={(v) => onPriceRangeChange(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-44 rounded-full">
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prices</SelectItem>
            {PRICE_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
            onClick={onClearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
