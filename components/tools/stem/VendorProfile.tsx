"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Star,
  Heart,
  Share2,
  Globe,
  Instagram,
  Mail,
  Phone,
  MessageCircle,
  BadgeCheck,
  Sparkles,
  ImageIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VendorReviewCard } from "./VendorReviewCard";
import { VendorReviewForm } from "./VendorReviewForm";
import { VendorQASection } from "./VendorQASection";
import type { VendorProfile as VendorProfileType, VendorReview, VendorQuestion } from "@/lib/db/schema";

interface VendorProfileProps {
  vendor: VendorProfileType & {
    isSaved: boolean;
    userReview?: VendorReview | null;
    claimedTenant?: {
      id: string;
      displayName: string;
      profileImage: string | null;
      messagingEnabled: boolean | null;
    } | null;
  };
  reviews: (VendorReview & {
    tenant: {
      id: string;
      displayName: string;
      profileImage: string | null;
      slug: string;
    };
  })[];
  questions: (VendorQuestion & {
    tenant: {
      id: string;
      displayName: string;
      profileImage: string | null;
      slug: string;
    };
    answeredBy?: {
      id: string;
      displayName: string;
      profileImage: string | null;
    } | null;
  })[];
  isVendorOwner?: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  photographer: "Photographer",
  videographer: "Videographer",
  venue: "Venue",
  caterer: "Caterer",
  florist: "Florist",
  dj: "DJ",
  musician: "Musician",
  "wedding-planner": "Wedding Planner",
  "hair-makeup": "Hair & Makeup Artist",
  officiant: "Officiant",
  rentals: "Rentals",
  bakery: "Bakery",
  stationery: "Stationery",
  transportation: "Transportation",
};

const PRICE_LABELS: Record<string, string> = {
  "$": "Budget Friendly",
  "$$": "Moderate",
  "$$$": "Premium",
  "$$$$": "Luxury",
};

export function VendorProfile({ vendor, reviews, questions, isVendorOwner = false }: VendorProfileProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(vendor.isSaved);
  const [saveCount, setSaveCount] = useState(vendor.saveCount ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const coverImage = vendor.coverImage || vendor.profileImage;
  const categoryLabel = CATEGORY_LABELS[vendor.category] || vendor.category;
  const priceLabel = vendor.priceRange ? PRICE_LABELS[vendor.priceRange] : null;
  const location = [vendor.city, vendor.state].filter(Boolean).join(", ");
  const portfolioImages = (vendor.portfolioImages as string[]) || [];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vendor.name} - Wedding Vendor`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleSave = async () => {
    const newStatus = !isSaved;
    setIsSaved(newStatus);
    setSaveCount((prev) => (newStatus ? prev + 1 : prev - 1));
    setIsSaving(true);

    try {
      const response = await fetch("/api/vendors/saves", {
        method: newStatus ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update save");
      }

      toast.success(newStatus ? "Added to saved vendors" : "Removed from saved vendors");
    } catch (error) {
      setIsSaved(!newStatus);
      setSaveCount((prev) => (!newStatus ? prev + 1 : prev - 1));
      toast.error("Failed to update saved vendors");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartChat = async () => {
    if (!vendor.claimedTenant) return;

    setIsStartingChat(true);
    try {
      const response = await fetch("/api/social/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherTenantId: vendor.claimedTenant.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to start conversation");
      }

      const data = await response.json();
      router.push(`/planner/stem/messages/${data.id}`);
    } catch (error) {
      toast.error("Failed to start conversation");
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleReviewSubmit = async (data: { rating: number; title?: string; content?: string; serviceDate?: Date }) => {
    try {
      const response = await fetch(`/api/vendors/${vendor.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit review";
      toast.error(message);
    }
  };

  const handleQuestionSubmit = async (question: string) => {
    const response = await fetch(`/api/vendors/${vendor.slug}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit question");
    }

    toast.success("Question submitted successfully!");
    router.refresh();
  };

  const handleAnswerSubmit = async (questionId: string, answer: string) => {
    const response = await fetch(`/api/vendors/questions/${questionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit answer");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 animate-fade-up">
      {/* Navigation */}
      <Button
        variant="ghost"
        onClick={() => router.push("/planner/stem/vendors")}
        className="pl-0 hover:pl-2 transition-all"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vendors
      </Button>

      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 rounded-3xl overflow-hidden bg-muted relative">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={vendor.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <ImageIcon className="h-16 w-16 text-primary/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {vendor.isVerified && (
              <Badge className="bg-white/90 text-primary backdrop-blur-sm gap-1">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
            {vendor.isFeatured && (
              <Badge className="bg-amber-500/90 text-white backdrop-blur-sm gap-1">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Info Overlay */}
        <div className="relative -mt-24 mx-6">
          <Card className="rounded-3xl shadow-lifted border-0 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Profile Image */}
                {vendor.profileImage && vendor.profileImage !== coverImage && (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden relative shrink-0 ring-4 ring-white shadow-soft">
                    <Image
                      src={vendor.profileImage}
                      alt={vendor.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}

                <div className="flex-1">
                  {/* Name and Category */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="font-serif text-3xl md:text-4xl text-foreground">
                      {vendor.name}
                    </h1>
                    <Badge variant="secondary" className="text-sm">
                      {categoryLabel}
                    </Badge>
                  </div>

                  {/* Location and Price */}
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                    {location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{location}</span>
                      </div>
                    )}
                    {priceLabel && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{vendor.priceRange}</span>
                        <span className="text-sm">({priceLabel})</span>
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-4">
                    {vendor.averageRating && vendor.averageRating > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-5 w-5",
                                star <= Math.round(vendor.averageRating! / 10)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200"
                              )}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{(vendor.averageRating / 10).toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No reviews yet</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      size="lg"
                      className={cn(
                        "rounded-full px-6 transition-all",
                        isSaved
                          ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Heart className={cn("h-4 w-4 mr-2", isSaved && "fill-current")} />
                      )}
                      {isSaved ? "Saved" : "Save"} {saveCount > 0 && `(${saveCount})`}
                    </Button>

                    {vendor.claimedTenant && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full px-6"
                        onClick={handleStartChat}
                        disabled={isStartingChat}
                      >
                        {isStartingChat ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <MessageCircle className="h-4 w-4 mr-2" />
                        )}
                        Message
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full px-4"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      {(vendor.description || vendor.bio) && (
        <div className="space-y-3">
          <h2 className="font-serif text-2xl text-foreground">About</h2>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            {vendor.description || vendor.bio}
          </p>
        </div>
      )}

      {/* Contact Links */}
      <div className="flex flex-wrap gap-3">
        {vendor.website && (
          <a href={vendor.website} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full gap-2">
              <Globe className="h-4 w-4" />
              Website
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        )}
        {vendor.instagram && (
          <a href={`https://instagram.com/${vendor.instagram}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="rounded-full gap-2">
              <Instagram className="h-4 w-4" />
              @{vendor.instagram}
            </Button>
          </a>
        )}
        {vendor.email && (
          <a href={`mailto:${vendor.email}`}>
            <Button variant="outline" className="rounded-full gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </a>
        )}
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`}>
            <Button variant="outline" className="rounded-full gap-2">
              <Phone className="h-4 w-4" />
              {vendor.phone}
            </Button>
          </a>
        )}
      </div>

      {/* Portfolio Gallery */}
      {portfolioImages.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl text-foreground">Portfolio</h2>
          <ResponsiveMasonry columnsCountBreakPoints={{ 350: 1, 550: 2, 900: 3 }}>
            <Masonry gutter="16px">
              {portfolioImages.map((image, index) => (
                <div
                  key={index}
                  className="rounded-2xl overflow-hidden relative aspect-auto group cursor-pointer"
                >
                  <Image
                    src={image}
                    alt={`${vendor.name} portfolio ${index + 1}`}
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                </div>
              ))}
            </Masonry>
          </ResponsiveMasonry>
        </div>
      )}

      {/* Reviews Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-foreground">
            Reviews ({vendor.reviewCount || 0})
          </h2>
          {!vendor.userReview && !showReviewForm && (
            <Button
              className="rounded-full"
              onClick={() => setShowReviewForm(true)}
            >
              Write a Review
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <VendorReviewForm
            vendorName={vendor.name}
            onSubmit={handleReviewSubmit}
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        {/* User's existing review */}
        {vendor.userReview && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Your Review</p>
            <VendorReviewCard
              review={{
                ...vendor.userReview,
                tenant: { id: "", displayName: "You", profileImage: null, slug: "" },
              }}
              isOwnReview
            />
          </div>
        )}

        {/* Other reviews */}
        {reviews.length === 0 && !vendor.userReview ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <VendorReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>

      {/* Q&A Section */}
      <VendorQASection
        vendorName={vendor.name}
        vendorSlug={vendor.slug}
        questions={questions}
        questionCount={vendor.questionCount ?? 0}
        isVendorOwner={isVendorOwner}
        onQuestionSubmit={handleQuestionSubmit}
        onAnswerSubmit={handleAnswerSubmit}
      />
    </div>
  );
}
