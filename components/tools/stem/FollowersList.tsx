"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FollowUser {
  id: string;
  displayName: string;
  profileImage: string | null;
  slug: string;
  weddingDate: Date | null;
  isFollowing: boolean;
}

interface FollowersListProps {
  users: FollowUser[];
  type: "followers" | "following";
  currentTenantId: string;
}

export function FollowersList({ users, type, currentTenantId }: FollowersListProps) {
  const router = useRouter();
  const [followStates, setFollowStates] = useState<Record<string, boolean>>(
    users.reduce((acc, user) => ({ ...acc, [user.id]: user.isFollowing }), {})
  );
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleFollow = async (userId: string) => {
    const currentStatus = followStates[userId];
    const newStatus = !currentStatus;

    // Optimistic update
    setFollowStates((prev) => ({ ...prev, [userId]: newStatus }));
    setLoadingStates((prev) => ({ ...prev, [userId]: true }));

    try {
      const response = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTenantId: userId,
          action: newStatus ? "follow" : "unfollow",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update follow status");
      }
    } catch (error) {
      // Revert on error
      setFollowStates((prev) => ({ ...prev, [userId]: currentStatus }));
      toast.error("Failed to update follow status");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const title = type === "followers" ? "Followers" : "Following";
  const emptyMessage =
    type === "followers"
      ? "You don't have any followers yet. Share your boards to get discovered!"
      : "You're not following anyone yet. Explore to find inspiration from other couples!";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/planner/stem/profile")}
          className="pl-0 hover:pl-2 transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Button>
      </div>

      <div>
        <h1 className="font-serif text-4xl text-foreground tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">
          {users.length} {users.length === 1 ? "person" : "people"}
        </p>
      </div>

      {/* User List */}
      {users.length === 0 ? (
        <Card className="text-center p-12 border-2 border-dashed border-border/50 bg-muted/5 shadow-none rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-sm mx-auto">{emptyMessage}</p>
          <Button
            onClick={() => router.push("/planner/stem/explore")}
            className="mt-6 rounded-full px-6 shadow-soft"
          >
            Explore Stem
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const initials = user.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            const isOwnProfile = user.id === currentTenantId;
            const isFollowing = followStates[user.id];
            const isLoading = loadingStates[user.id];

            return (
              <Card
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-2xl border-border shadow-soft hover:shadow-medium transition-all"
              >
                {/* Avatar */}
                <Link href={`/planner/stem/profile/${user.id}`}>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-serif text-primary border-2 border-white shadow-sm overflow-hidden relative shrink-0 hover:ring-2 hover:ring-primary/20 transition-all">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.displayName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/planner/stem/profile/${user.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors truncate block"
                  >
                    {user.displayName}
                  </Link>
                  {user.weddingDate && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(user.weddingDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Follow Button */}
                {!isOwnProfile && (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "rounded-full min-w-[100px]",
                      isFollowing ? "" : "shadow-soft"
                    )}
                    onClick={() => handleFollow(user.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFollowing ? (
                      "Following"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
