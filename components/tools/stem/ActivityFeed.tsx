"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  UserPlus,
  FolderPlus,
  Bookmark,
  Sparkles,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityActor {
  id: string;
  displayName: string;
  profileImage: string | null;
  slug: string;
}

interface ActivityItem {
  id: string;
  actorTenantId: string;
  type: string;
  targetType: string;
  targetId: string;
  isPublic: boolean;
  metadata: unknown;
  createdAt: Date;
  actor: ActivityActor;
}

interface ActivityFeedProps {
  initialActivities: ActivityItem[];
  currentTenantId: string;
}

function getActivityIcon(type: string) {
  switch (type) {
    case "followed_user":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "board_created":
      return <FolderPlus className="h-4 w-4 text-green-500" />;
    case "idea_saved":
      return <Bookmark className="h-4 w-4 text-amber-500" />;
    case "reaction_added":
      return <Heart className="h-4 w-4 text-rose-500" />;
    case "comment_added":
      return <MessageCircle className="h-4 w-4 text-purple-500" />;
    case "article_saved":
      return <Bookmark className="h-4 w-4 text-teal-500" />;
    default:
      return <Sparkles className="h-4 w-4 text-primary" />;
  }
}

function getMetadata(activity: ActivityItem): Record<string, unknown> {
  return (activity.metadata as Record<string, unknown>) || {};
}

function getActivityText(activity: ActivityItem, isOwnActivity: boolean): string {
  const actorName = isOwnActivity ? "You" : activity.actor.displayName;
  const meta = getMetadata(activity);

  switch (activity.type) {
    case "followed_user":
      return `${actorName} started following someone`;
    case "board_created":
      const boardName = (meta.boardName as string) || "a board";
      return `${actorName} created a new board: ${boardName}`;
    case "idea_saved":
      const toBoardName = (meta.boardName as string) || "a board";
      return `${actorName} saved an idea to ${toBoardName}`;
    case "reaction_added":
      return `${actorName} loved something`;
    case "comment_added":
      return `${actorName} left a comment`;
    case "article_saved":
      return `${actorName} saved an article to their board`;
    default:
      return `${actorName} did something`;
  }
}

function getActivityLink(activity: ActivityItem): string | null {
  switch (activity.targetType) {
    case "board":
      return `/planner/stem/board/${activity.targetId}`;
    case "idea":
      return null; // Ideas don't have their own page yet
    case "tenant":
      return `/planner/stem/profile/${activity.targetId}`;
    case "article":
      return `/blog/${activity.targetId}`;
    default:
      return null;
  }
}

export function ActivityFeed({ initialActivities, currentTenantId }: ActivityFeedProps) {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight">
          Activity
        </h1>
        <p className="text-muted-foreground mt-2">
          See what&apos;s happening with people you follow
        </p>
      </div>

      {/* Activity List */}
      {initialActivities.length === 0 ? (
        <Card className="text-center p-12 border-2 border-dashed border-border/50 bg-muted/5 shadow-none rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-serif text-2xl text-foreground mb-2">No activity yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Follow other couples to see their wedding inspiration and updates in your feed.
          </p>
          <Button
            onClick={() => router.push("/planner/stem/explore")}
            className="rounded-full px-6 shadow-soft"
          >
            Explore Stem
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {initialActivities.map((activity) => {
            const isOwnActivity = activity.actorTenantId === currentTenantId;
            const activityLink = getActivityLink(activity);
            const initials = activity.actor.displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card
                key={activity.id}
                className="p-4 rounded-2xl border-border shadow-soft hover:shadow-medium transition-all"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <Link href={`/planner/stem/profile/${activity.actor.id}`}>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-serif text-primary border-2 border-white shadow-sm overflow-hidden relative shrink-0 hover:ring-2 hover:ring-primary/20 transition-all">
                      {activity.actor.profileImage ? (
                        <Image
                          src={activity.actor.profileImage}
                          alt={activity.actor.displayName}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-muted/50">
                          {getActivityIcon(activity.type)}
                        </div>
                        <p className="text-sm text-foreground">
                          {getActivityText(activity, isOwnActivity)}
                        </p>
                      </div>
                    </div>

                    {/* Metadata preview if available */}
                    {Boolean(getMetadata(activity).boardName) && activityLink && (
                      <Link href={activityLink}>
                        <div className="mt-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                          <p className="text-sm font-medium text-foreground truncate">
                            {String(getMetadata(activity).boardName)}
                          </p>
                        </div>
                      </Link>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
