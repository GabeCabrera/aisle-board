"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Heart,
  MessageCircle,
  Mail,
  Share2,
  Users,
  FileText,
  Tag,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export interface NotificationItemData {
  id: string;
  type: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    displayName: string;
    profileImage: string | null;
  } | null;
  targetPreview?: {
    name?: string;
    imageUrl?: string;
  } | null;
}

interface NotificationItemProps {
  notification: NotificationItemData;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "new_follower":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "reaction":
      return <Heart className="h-4 w-4 text-rose-500" />;
    case "comment":
      return <MessageCircle className="h-4 w-4 text-purple-500" />;
    case "message":
      return <Mail className="h-4 w-4 text-green-500" />;
    case "board_shared":
      return <Share2 className="h-4 w-4 text-amber-500" />;
    case "collaborator_invite":
      return <Users className="h-4 w-4 text-indigo-500" />;
    case "vendor_post":
      return <FileText className="h-4 w-4 text-teal-500" />;
    case "showcase_tag":
      return <Tag className="h-4 w-4 text-pink-500" />;
    default:
      return <Heart className="h-4 w-4 text-muted-foreground" />;
  }
}

function getNotificationText(notification: NotificationItemData): string {
  const actorName = notification.actor?.displayName || "Someone";
  const targetName = notification.targetPreview?.name;

  switch (notification.type) {
    case "new_follower":
      return `${actorName} started following you`;
    case "reaction":
      return targetName
        ? `${actorName} reacted to "${targetName}"`
        : `${actorName} reacted to your content`;
    case "comment":
      return targetName
        ? `${actorName} commented on "${targetName}"`
        : `${actorName} commented on your content`;
    case "message":
      return `${actorName} sent you a message`;
    case "board_shared":
      return targetName
        ? `${actorName} shared the board "${targetName}" with you`
        : `${actorName} shared a board with you`;
    case "collaborator_invite":
      return targetName
        ? `${actorName} invited you to collaborate on "${targetName}"`
        : `${actorName} invited you to collaborate`;
    case "vendor_post":
      return targetName
        ? `${targetName} posted an update`
        : "A vendor you follow posted an update";
    case "showcase_tag":
      return targetName
        ? `${actorName} tagged you in "${targetName}"`
        : `${actorName} tagged you in a wedding showcase`;
    default:
      return "You have a new notification";
  }
}

function getNotificationLink(notification: NotificationItemData): string | null {
  switch (notification.type) {
    case "new_follower":
      return notification.actor?.id
        ? `/planner/stem/profile/${notification.actor.id}`
        : null;
    case "reaction":
    case "comment":
      if (notification.targetType === "board" && notification.targetId) {
        return `/planner/stem?board=${notification.targetId}`;
      }
      if (notification.targetType === "idea" && notification.targetId) {
        return `/planner/stem?idea=${notification.targetId}`;
      }
      return null;
    case "message":
      return notification.targetId
        ? `/planner/stem/messages?conversation=${notification.targetId}`
        : "/planner/stem/messages";
    case "board_shared":
    case "collaborator_invite":
      return notification.targetId
        ? `/planner/stem?board=${notification.targetId}`
        : null;
    case "vendor_post":
      return notification.targetId
        ? `/planner/stem/vendors/${(notification.metadata as Record<string, string>)?.vendorSlug || ""}`
        : null;
    case "showcase_tag":
      return notification.targetId
        ? `/planner/stem/showcases/${notification.targetId}`
        : null;
    default:
      return null;
  }
}

export function NotificationItem({
  notification,
  onMarkRead,
  onClose,
}: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }

    const link = getNotificationLink(notification);
    if (link) {
      onClose();
      router.push(link);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <button
      className={cn(
        "w-full flex items-start gap-3 p-3 text-left hover:bg-accent/50 transition-colors",
        !notification.isRead && "bg-accent/30"
      )}
      onClick={handleClick}
    >
      {/* Actor avatar or icon */}
      <div className="flex-shrink-0 relative">
        {notification.actor?.profileImage ? (
          <div className="relative">
            <Image
              src={notification.actor.profileImage}
              alt={notification.actor.displayName || ""}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
              {getNotificationIcon(notification.type)}
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {getNotificationIcon(notification.type)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          {getNotificationText(notification)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>

      {/* Target preview image */}
      {notification.targetPreview?.imageUrl && (
        <div className="flex-shrink-0">
          <Image
            src={notification.targetPreview.imageUrl}
            alt=""
            width={44}
            height={44}
            className="rounded object-cover"
          />
        </div>
      )}

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="flex-shrink-0 self-center">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
        </div>
      )}
    </button>
  );
}
