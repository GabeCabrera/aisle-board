"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  tenantId: string;
  displayName: string;
  profileImage: string | null;
  weddingDate: string | null;
  bio: string | null;
  score: number;
  reason: string;
}

interface SuggestionsCardProps {
  className?: string;
}

export function SuggestionsCard({ className }: SuggestionsCardProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch("/api/stem/suggestions?limit=5");
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (tenantId: string, displayName: string) => {
    try {
      setFollowingIds((prev) => new Set([...prev, tenantId]));

      const response = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTenantId: tenantId }),
      });

      if (response.ok) {
        toast.success(`Following ${displayName}`);
        // Remove from suggestions after following
        setSuggestions((prev) => prev.filter((s) => s.tenantId !== tenantId));
      } else {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(tenantId);
          return next;
        });
        toast.error("Failed to follow");
      }
    } catch (error) {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(tenantId);
        return next;
      });
      console.error("Error following user:", error);
    }
  };

  const handleViewProfile = (tenantId: string) => {
    router.push(`/planner/stem/profile/${tenantId}`);
  };

  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null; // Don't show the card if no suggestions
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Couples You May Know</h3>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.tenantId}
            className="flex items-center gap-3"
          >
            {/* Avatar */}
            <button
              onClick={() => handleViewProfile(suggestion.tenantId)}
              className="flex-shrink-0"
            >
              {suggestion.profileImage ? (
                <Image
                  src={suggestion.profileImage}
                  alt={suggestion.displayName}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {suggestion.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <button
                onClick={() => handleViewProfile(suggestion.tenantId)}
                className="block text-left"
              >
                <p className="text-sm font-medium truncate">
                  {suggestion.displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {suggestion.reason}
                </p>
              </button>
            </div>

            {/* Follow Button */}
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-8"
              onClick={() => handleFollow(suggestion.tenantId, suggestion.displayName)}
              disabled={followingIds.has(suggestion.tenantId)}
            >
              {followingIds.has(suggestion.tenantId) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* See All Link */}
      <button
        onClick={() => router.push("/planner/stem/discover")}
        className="flex items-center gap-1 text-xs text-primary hover:underline mt-4 pt-3 border-t w-full justify-center"
      >
        Discover more couples
        <ChevronRight className="h-3 w-3" />
      </button>
    </Card>
  );
}
