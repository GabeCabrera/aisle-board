"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Heart,
  BadgeCheck,
  Sparkles,
  ImageIcon,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { VendorProfile } from "@/lib/db/schema";
import type { LocationMatch } from "@/lib/data/stem";

interface VendorCardProps {
  vendor: VendorProfile;
  isSaved?: boolean;
  onSaveToggle?: (vendorId: string, currentlySaved: boolean) => void;
  locationMatch?: LocationMatch;
  compact?: boolean;
  status?: string | null; // Tracking status for saved vendors
}

const LOCATION_MATCH_LABELS: Record<string, string> = {
  city: "In Your City",
  state: "Near You",
  serviceArea: "Serves Your Area",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  saved: { label: "Saved", color: "bg-slate-500/90" },
  researching: { label: "Researching", color: "bg-blue-500/90" },
  contacted: { label: "Contacted", color: "bg-yellow-500/90" },
  meeting_scheduled: { label: "Meeting Set", color: "bg-purple-500/90" },
  booked: { label: "Booked", color: "bg-green-500/90" },
  passed: { label: "Passed", color: "bg-gray-500/90" },
};

const PRICE_LABELS: Record<string, string> = {
  "$": "$",
  "$$": "$$",
  "$$$": "$$$",
  "$$$$": "$$$$",
};

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

export function VendorCard({ vendor, isSaved = false, onSaveToggle, locationMatch, compact = false, status }: VendorCardProps) {
  const router = useRouter();

  const coverImage = vendor.coverImage || vendor.profileImage;
  const categoryLabel = CATEGORY_LABELS[vendor.category] || vendor.category;
  const priceLabel = vendor.priceRange ? PRICE_LABELS[vendor.priceRange] : null;
  const statusInfo = status ? STATUS_LABELS[status] : null;
  const location = [vendor.city, vendor.state].filter(Boolean).join(", ");
  const locationMatchLabel = locationMatch ? LOCATION_MATCH_LABELS[locationMatch] : null;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveToggle?.(vendor.id, isSaved);
  };

  return (
    <Card
      className="cursor-pointer rounded-3xl h-full shadow-soft transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lifted overflow-hidden group"
      onClick={() => router.push(`/planner/stem/vendors/${vendor.slug}`)}
    >
      {/* Cover Image */}
      <div className={cn("relative bg-muted", compact ? "h-36" : "h-48")}>
        {coverImage ? (
          <Image
            src={coverImage}
            alt={vendor.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <ImageIcon className="h-12 w-12 text-primary/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {statusInfo && (
            <Badge className={cn(statusInfo.color, "text-white backdrop-blur-sm")}>
              {statusInfo.label}
            </Badge>
          )}
          {locationMatchLabel && (
            <Badge className="bg-emerald-500/90 text-white backdrop-blur-sm gap-1">
              <Navigation className="h-3 w-3" />
              {locationMatchLabel}
            </Badge>
          )}
          {vendor.isVerified && !compact && (
            <Badge className="bg-white/90 text-primary backdrop-blur-sm gap-1">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {vendor.isFeatured && !compact && (
            <Badge className="bg-amber-500/90 text-white backdrop-blur-sm gap-1">
              <Sparkles className="h-3 w-3" />
              Featured
            </Badge>
          )}
        </div>

        {/* Save button */}
        {onSaveToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-3 right-3 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all",
              isSaved && "text-rose-500 hover:text-rose-600"
            )}
            onClick={handleSaveClick}
          >
            <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
          </Button>
        )}

        {/* Category badge on image */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground">
            {categoryLabel}
          </Badge>
        </div>

        {/* Price badge */}
        {priceLabel && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-0 font-semibold">
              {priceLabel}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Vendor name */}
        <h3 className="font-serif text-xl leading-tight mb-1 text-foreground group-hover:text-primary transition-colors">
          {vendor.name}
        </h3>

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
        )}

        {/* Rating and reviews */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            {vendor.averageRating && vendor.averageRating > 0 ? (
              <>
                <div className="flex items-center gap-0.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-sm">{(vendor.averageRating / 10).toFixed(1)}</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">No reviews yet</span>
            )}
          </div>

          {vendor.saveCount && vendor.saveCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Heart className="h-3.5 w-3.5" />
              <span>{vendor.saveCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
