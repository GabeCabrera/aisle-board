"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, MapPin, Calendar, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShowcaseCardProps {
  showcase: {
    id: string;
    title: string;
    description?: string | null;
    weddingDate?: Date | string | null;
    location?: string | null;
    featuredImage?: string | null;
    images?: string[];
    viewCount: number;
    reactionCount: number;
    isFeatured: boolean;
    vendor?: {
      id?: string;
      name: string;
      slug: string;
      profileImage?: string | null;
      category?: string | null;
    } | null;
    couple?: {
      id?: string;
      displayName: string;
      profileImage?: string | null;
    } | null;
  };
  className?: string;
}

export function ShowcaseCard({ showcase, className }: ShowcaseCardProps) {
  const router = useRouter();

  const images = Array.isArray(showcase.images) ? showcase.images : [];
  const displayImage = showcase.featuredImage || images[0];

  return (
    <Card
      onClick={() => router.push(`/planner/stem/showcases/${showcase.id}`)}
      className={cn(
        "group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-lg",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={showcase.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Featured Badge */}
        {showcase.isFeatured && (
          <Badge className="absolute top-3 left-3 bg-amber-500 text-white">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Featured
          </Badge>
        )}

        {/* Stats */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">
            {showcase.title}
          </h3>

          <div className="flex items-center gap-3 text-white/90 text-sm">
            {showcase.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {showcase.location}
              </span>
            )}
            {showcase.weddingDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(showcase.weddingDate), "MMM yyyy")}
              </span>
            )}
          </div>
        </div>

        {/* Image count badge */}
        {images.length > 1 && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3 bg-black/50 text-white border-0"
          >
            {images.length} photos
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Vendor Info */}
        {showcase.vendor && (
          <div className="flex items-center gap-3 mb-3">
            {showcase.vendor.profileImage ? (
              <Image
                src={showcase.vendor.profileImage}
                alt={showcase.vendor.name}
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {showcase.vendor.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {showcase.vendor.name}
              </p>
              {showcase.vendor.category && (
                <p className="text-xs text-muted-foreground capitalize">
                  {showcase.vendor.category.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Couple Tag */}
        {showcase.couple && (
          <p className="text-xs text-muted-foreground mb-3">
            Featuring {showcase.couple.displayName}
          </p>
        )}

        {/* Description */}
        {showcase.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {showcase.description}
          </p>
        )}

        {/* Footer Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {showcase.reactionCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {showcase.viewCount}
          </span>
        </div>
      </div>
    </Card>
  );
}
