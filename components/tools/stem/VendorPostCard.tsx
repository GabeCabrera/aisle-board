"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Sparkles,
  Tag,
  Lightbulb,
  ImageIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VendorPostCardProps {
  post: {
    id: string;
    type: string;
    title?: string | null;
    content: string;
    images?: string[];
    reactionCount: number;
    commentCount: number;
    createdAt: Date | string;
    vendor?: {
      id?: string;
      name: string;
      slug: string;
      profileImage?: string | null;
    } | null;
    author?: {
      displayName: string;
      profileImage?: string | null;
    } | null;
  };
  showVendorInfo?: boolean;
  isOwner?: boolean;
  userHasReacted?: boolean;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const postTypeConfig = {
  update: { label: "Update", icon: Sparkles, color: "bg-blue-100 text-blue-700" },
  portfolio: { label: "Portfolio", icon: ImageIcon, color: "bg-purple-100 text-purple-700" },
  special_offer: { label: "Special Offer", icon: Tag, color: "bg-green-100 text-green-700" },
  tip: { label: "Tip", icon: Lightbulb, color: "bg-amber-100 text-amber-700" },
};

export function VendorPostCard({
  post,
  showVendorInfo = true,
  isOwner = false,
  userHasReacted = false,
  onEdit,
  onDelete,
}: VendorPostCardProps) {
  const router = useRouter();
  const [isReacted, setIsReacted] = useState(userHasReacted);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [isReacting, setIsReacting] = useState(false);

  const typeConfig = postTypeConfig[post.type as keyof typeof postTypeConfig] || postTypeConfig.update;
  const TypeIcon = typeConfig.icon;

  const handleReact = async () => {
    setIsReacting(true);
    try {
      const response = await fetch(`/api/vendors/posts/${post.id}/react`, {
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
      console.error("Error reacting to post:", error);
    } finally {
      setIsReacting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title || `Post from ${post.vendor?.name}`,
        url: window.location.href,
      });
    } catch {
      // Share cancelled or not supported
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const images = Array.isArray(post.images) ? post.images : [];

  return (
    <Card className="overflow-hidden">
      {showVendorInfo && post.vendor && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/planner/stem/vendors/${post.vendor?.slug}`)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {post.vendor.profileImage ? (
                <Image
                  src={post.vendor.profileImage}
                  alt={post.vendor.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {post.vendor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="text-left">
                <p className="font-medium text-sm">{post.vendor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs", typeConfig.color)}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(post.id)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete?.(post.id)}
                      className="text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn(showVendorInfo && post.vendor ? "pt-0" : "pt-4")}>
        {post.title && (
          <h3 className="font-semibold text-base mb-2">{post.title}</h3>
        )}

        <p className="text-sm text-foreground/90 whitespace-pre-wrap mb-4">
          {post.content}
        </p>

        {images.length > 0 && (
          <div
            className={cn(
              "grid gap-2 mb-4",
              images.length === 1 && "grid-cols-1",
              images.length === 2 && "grid-cols-2",
              images.length >= 3 && "grid-cols-2"
            )}
          >
            {images.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className={cn(
                  "relative rounded-lg overflow-hidden",
                  images.length === 1 && "aspect-video",
                  images.length >= 2 && "aspect-square",
                  images.length === 3 && index === 0 && "row-span-2"
                )}
              >
                <Image
                  src={image}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {images.length > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReact}
            disabled={isReacting}
            className={cn(
              "text-muted-foreground",
              isReacted && "text-red-500"
            )}
          >
            {isReacting ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Heart
                className={cn(
                  "h-4 w-4 mr-1.5",
                  isReacted && "fill-current"
                )}
              />
            )}
            {reactionCount > 0 && reactionCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {post.commentCount > 0 && post.commentCount}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground ml-auto"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
