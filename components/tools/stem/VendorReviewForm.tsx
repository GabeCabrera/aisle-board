"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorReviewFormProps {
  vendorName: string;
  onSubmit: (data: {
    rating: number;
    title?: string;
    content?: string;
    serviceDate?: Date;
  }) => Promise<void>;
  onCancel: () => void;
}

export function VendorReviewForm({ vendorName, onSubmit, onCancel }: VendorReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        title: title || undefined,
        content: content || undefined,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="font-serif text-xl">Write a Review for {vendorName}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Your Rating *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-200 hover:text-amber-200"
                    )}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm text-muted-foreground">
                {ratingLabels[hoverRating || rating]}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Review Title</Label>
            <Input
              id="title"
              placeholder="Summarize your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Your Review</Label>
            <Textarea
              id="content"
              placeholder="Share details about your experience with this vendor..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Service Date */}
          <div className="space-y-2">
            <Label htmlFor="serviceDate">When did they provide service?</Label>
            <Input
              id="serviceDate"
              type="month"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="rounded-xl w-48"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              className="rounded-full px-6"
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
