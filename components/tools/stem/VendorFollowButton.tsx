"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VendorFollowButtonProps {
  vendorSlug: string;
  vendorName: string;
  initialIsFollowing?: boolean;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function VendorFollowButton({
  vendorSlug,
  vendorName,
  initialIsFollowing = false,
  size = "default",
  variant = "outline",
  className,
  onFollowChange,
}: VendorFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(!initialIsFollowing);

  // Check initial follow status
  useEffect(() => {
    if (initialIsFollowing) return;

    const checkFollowStatus = async () => {
      try {
        const response = await fetch(`/api/vendors/${vendorSlug}/follow`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Error checking follow status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFollowStatus();
  }, [vendorSlug, initialIsFollowing]);

  const handleToggleFollow = async () => {
    setIsLoading(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(`/api/vendors/${vendorSlug}/follow`, {
        method,
      });

      if (response.ok) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        onFollowChange?.(newFollowState);

        toast.success(
          newFollowState
            ? `Now following ${vendorName}`
            : `Unfollowed ${vendorName}`
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update follow status");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "default" : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={cn(
        isFollowing && "bg-primary/90 hover:bg-primary/80",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Heart
            className={cn(
              "h-4 w-4 mr-1.5",
              isFollowing && "fill-current"
            )}
          />
          {isFollowing ? "Following" : "Follow"}
        </>
      )}
    </Button>
  );
}
