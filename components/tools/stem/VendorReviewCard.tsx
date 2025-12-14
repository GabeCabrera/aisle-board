"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { VendorReview } from "@/lib/db/schema";

interface VendorReviewCardProps {
  review: VendorReview & {
    tenant: {
      id: string;
      displayName: string;
      profileImage: string | null;
      slug: string;
    };
  };
  isOwnReview?: boolean;
}

export function VendorReviewCard({ review, isOwnReview = false }: VendorReviewCardProps) {
  const router = useRouter();
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [hasMarkedHelpful, setHasMarkedHelpful] = useState(false);

  const initials = review.tenant.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleHelpful = async () => {
    if (hasMarkedHelpful || isOwnReview) return;

    setHelpfulCount((prev) => prev + 1);
    setHasMarkedHelpful(true);

    try {
      await fetch(`/api/vendors/reviews/${review.id}/helpful`, {
        method: "POST",
      });
    } catch (error) {
      setHelpfulCount((prev) => prev - 1);
      setHasMarkedHelpful(false);
    }
  };

  const handleProfileClick = () => {
    if (review.tenant.id && review.tenant.slug && !isOwnReview) {
      router.push(`/planner/stem/profile/${review.tenant.id}`);
    }
  };

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Author Avatar */}
          <div
            onClick={handleProfileClick}
            className={cn(
              "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary overflow-hidden relative shrink-0",
              !isOwnReview && review.tenant.id && "cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            )}
          >
            {review.tenant.profileImage ? (
              <Image
                src={review.tenant.profileImage}
                alt={review.tenant.displayName}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p
                  onClick={handleProfileClick}
                  className={cn(
                    "font-medium text-foreground",
                    !isOwnReview && review.tenant.id && "cursor-pointer hover:text-primary transition-colors"
                  )}
                >
                  {review.tenant.displayName}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                  {review.serviceDate && (
                    <>
                      <span className="text-border">•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Service: {new Date(review.serviceDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-0.5 shrink-0">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star <= review.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Review Title */}
            {review.title && (
              <h4 className="font-medium text-foreground mb-1">{review.title}</h4>
            )}

            {/* Review Content */}
            {review.content && (
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                {review.content}
              </p>
            )}

            {/* Helpful Button */}
            {!isOwnReview && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "rounded-full text-muted-foreground hover:text-foreground gap-1.5",
                    hasMarkedHelpful && "text-primary"
                  )}
                  onClick={handleHelpful}
                  disabled={hasMarkedHelpful}
                >
                  <ThumbsUp className={cn("h-3.5 w-3.5", hasMarkedHelpful && "fill-current")} />
                  Helpful {helpfulCount > 0 && `(${helpfulCount})`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
