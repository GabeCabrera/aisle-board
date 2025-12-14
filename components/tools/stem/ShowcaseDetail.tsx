"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Share2,
  MapPin,
  Calendar,
  ArrowLeft,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShowcaseDetailProps {
  showcase: {
    id: string;
    title: string;
    description?: string | null;
    weddingDate?: Date | string | null;
    location?: string | null;
    featuredImage?: string | null;
    images?: string[];
    vendorList?: Array<{ vendorId?: string; role: string; name: string }>;
    viewCount: number;
    reactionCount: number;
    isFeatured: boolean;
    createdAt: Date | string;
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
    coupleApproved?: boolean;
  };
  userHasReacted?: boolean;
}

export function ShowcaseDetail({
  showcase,
  userHasReacted = false,
}: ShowcaseDetailProps) {
  const router = useRouter();
  const [isReacted, setIsReacted] = useState(userHasReacted);
  const [reactionCount, setReactionCount] = useState(showcase.reactionCount);
  const [isReacting, setIsReacting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = Array.isArray(showcase.images) ? showcase.images : [];
  const vendorList = Array.isArray(showcase.vendorList) ? showcase.vendorList : [];

  const handleReact = async () => {
    setIsReacting(true);
    try {
      const response = await fetch(`/api/showcases/${showcase.id}/react`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsReacted(data.reacted);
        setReactionCount((prev) => (data.reacted ? prev + 1 : prev - 1));
      } else {
        toast.error("Please sign in to react");
      }
    } catch (error) {
      console.error("Error reacting:", error);
    } finally {
      setIsReacting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: showcase.title,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image Gallery */}
        <div className="lg:col-span-2">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
            {images.length > 0 ? (
              <>
                <Image
                  src={images[currentImageIndex]}
                  alt={`${showcase.title} - Image ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-colors",
                            index === currentImageIndex
                              ? "bg-white"
                              : "bg-white/50"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}

                {showcase.isFeatured && (
                  <Badge className="absolute top-4 left-4 bg-amber-500 text-white">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">No images</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors",
                    index === currentImageIndex
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          {/* Title & Actions */}
          <div>
            <h1 className="font-serif text-3xl text-foreground mb-4">
              {showcase.title}
            </h1>

            <div className="flex items-center gap-3">
              <Button
                variant={isReacted ? "default" : "outline"}
                onClick={handleReact}
                disabled={isReacting}
              >
                {isReacting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Heart
                    className={cn(
                      "h-4 w-4 mr-2",
                      isReacted && "fill-current"
                    )}
                  />
                )}
                {reactionCount}
              </Button>

              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {showcase.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {showcase.location}
              </span>
            )}
            {showcase.weddingDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(showcase.weddingDate), "MMMM d, yyyy")}
              </span>
            )}
          </div>

          {/* Vendor */}
          {showcase.vendor && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Featured by
                </p>
                <button
                  onClick={() =>
                    router.push(`/planner/stem/vendors/${showcase.vendor?.slug}`)
                  }
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {showcase.vendor.profileImage ? (
                    <Image
                      src={showcase.vendor.profileImage}
                      alt={showcase.vendor.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {showcase.vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{showcase.vendor.name}</p>
                    {showcase.vendor.category && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {showcase.vendor.category.replace(/_/g, " ")}
                      </p>
                    )}
                  </div>
                </button>
              </CardContent>
            </Card>
          )}

          {/* Couple */}
          {showcase.couple && showcase.coupleApproved && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Featuring
                </p>
                <button
                  onClick={() =>
                    router.push(`/planner/stem/profile/${showcase.couple?.id}`)
                  }
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  {showcase.couple.profileImage ? (
                    <Image
                      src={showcase.couple.profileImage}
                      alt={showcase.couple.displayName}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {showcase.couple.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                  )}
                  <p className="font-medium">{showcase.couple.displayName}</p>
                </button>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {showcase.description && (
            <div>
              <h3 className="font-semibold mb-2">About this wedding</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {showcase.description}
              </p>
            </div>
          )}

          {/* Vendor Credits */}
          {vendorList.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Vendor Team</h3>
              <div className="space-y-2">
                {vendorList.map((v, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground capitalize">
                      {v.role.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium">{v.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
