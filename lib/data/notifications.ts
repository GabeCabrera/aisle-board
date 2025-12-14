import { db } from "@/lib/db";
import {
  notifications,
  tenants,
  boards,
  ideas,
  vendorProfiles,
  vendorPosts,
  weddingShowcases,
  type Notification,
  type NewNotification,
} from "@/lib/db/schema";
import { eq, and, desc, sql, lt, or } from "drizzle-orm";

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | "new_follower"
  | "reaction"
  | "comment"
  | "message"
  | "board_shared"
  | "collaborator_invite"
  | "vendor_post"
  | "showcase_tag";

export interface NotificationWithActor extends Notification {
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

// ============================================================================
// CREATE NOTIFICATIONS
// ============================================================================

/**
 * Create a notification
 */
export async function createNotification(data: NewNotification): Promise<Notification> {
  const [notification] = await db.insert(notifications).values(data).returning();
  return notification;
}

/**
 * Create a "new follower" notification
 */
export async function createFollowerNotification(
  recipientTenantId: string,
  followerTenantId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId,
    actorTenantId: followerTenantId,
    type: "new_follower",
    targetType: "tenant",
    targetId: followerTenantId,
  });
}

/**
 * Create a "reaction" notification
 */
export async function createReactionNotification(
  recipientTenantId: string,
  reactorTenantId: string,
  targetType: "board" | "idea" | "comment",
  targetId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId,
    actorTenantId: reactorTenantId,
    type: "reaction",
    targetType,
    targetId,
  });
}

/**
 * Create a "comment" notification
 */
export async function createCommentNotification(
  recipientTenantId: string,
  commenterTenantId: string,
  targetType: "board" | "idea",
  targetId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId,
    actorTenantId: commenterTenantId,
    type: "comment",
    targetType,
    targetId,
  });
}

/**
 * Create a "new message" notification
 */
export async function createMessageNotification(
  recipientTenantId: string,
  senderTenantId: string,
  conversationId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId,
    actorTenantId: senderTenantId,
    type: "message",
    targetType: "conversation",
    targetId: conversationId,
  });
}

/**
 * Create a "board shared" notification
 */
export async function createBoardSharedNotification(
  recipientTenantId: string,
  sharerTenantId: string,
  boardId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId,
    actorTenantId: sharerTenantId,
    type: "board_shared",
    targetType: "board",
    targetId: boardId,
  });
}

/**
 * Create a "collaborator invite" notification
 */
export async function createCollaboratorInviteNotification(
  recipientTenantId: string,
  inviterTenantId: string,
  boardId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId,
    actorTenantId: inviterTenantId,
    type: "collaborator_invite",
    targetType: "board",
    targetId: boardId,
  });
}

/**
 * Create a "vendor post" notification (for followers)
 */
export async function createVendorPostNotification(
  recipientTenantId: string,
  vendorId: string,
  postId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId,
    type: "vendor_post",
    targetType: "vendor_post",
    targetId: postId,
    metadata: { vendorId },
  });
}

/**
 * Create a "showcase tag" notification (when tagged in a showcase)
 */
export async function createShowcaseTagNotification(
  coupleTenantId: string,
  vendorTenantId: string,
  showcaseId: string
): Promise<Notification> {
  return createNotification({
    recipientTenantId: coupleTenantId,
    actorTenantId: vendorTenantId,
    type: "showcase_tag",
    targetType: "showcase",
    targetId: showcaseId,
  });
}

// ============================================================================
// READ NOTIFICATIONS
// ============================================================================

/**
 * Get notifications for a tenant with pagination
 */
export async function getNotifications(
  tenantId: string,
  options: {
    limit?: number;
    cursor?: string; // notification ID for cursor-based pagination
    unreadOnly?: boolean;
  } = {}
): Promise<{
  notifications: NotificationWithActor[];
  nextCursor: string | null;
}> {
  const { limit = 20, cursor, unreadOnly = false } = options;

  // Build conditions
  const conditions = [eq(notifications.recipientTenantId, tenantId)];

  if (cursor) {
    // Get the cursor notification's createdAt for proper ordering
    const cursorNotification = await db.query.notifications.findFirst({
      where: eq(notifications.id, cursor),
    });
    if (cursorNotification) {
      conditions.push(lt(notifications.createdAt, cursorNotification.createdAt));
    }
  }

  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const results = await db
    .select({
      notification: notifications,
      actor: {
        id: tenants.id,
        displayName: tenants.displayName,
        profileImage: tenants.profileImage,
      },
    })
    .from(notifications)
    .leftJoin(tenants, eq(notifications.actorTenantId, tenants.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1);

  const hasMore = results.length > limit;
  const notificationResults = hasMore ? results.slice(0, limit) : results;

  // Enrich with target previews
  const enrichedNotifications = await Promise.all(
    notificationResults.map(async (r) => {
      const notification = r.notification as NotificationWithActor;
      notification.actor = r.actor;
      notification.targetPreview = await getTargetPreview(
        notification.targetType,
        notification.targetId
      );
      return notification;
    })
  );

  return {
    notifications: enrichedNotifications,
    nextCursor: hasMore ? notificationResults[notificationResults.length - 1].notification.id : null,
  };
}

/**
 * Get preview info for a notification target
 */
async function getTargetPreview(
  targetType: string | null,
  targetId: string | null
): Promise<{ name?: string; imageUrl?: string } | null> {
  if (!targetType || !targetId) return null;

  switch (targetType) {
    case "board": {
      const board = await db.query.boards.findFirst({
        where: eq(boards.id, targetId),
        with: { ideas: { limit: 1 } },
      });
      if (board) {
        return {
          name: board.name,
          imageUrl: board.ideas?.[0]?.imageUrl,
        };
      }
      break;
    }
    case "idea": {
      const idea = await db.query.ideas.findFirst({
        where: eq(ideas.id, targetId),
      });
      if (idea) {
        return {
          name: idea.title || "Idea",
          imageUrl: idea.imageUrl,
        };
      }
      break;
    }
    case "tenant": {
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, targetId),
      });
      if (tenant) {
        return {
          name: tenant.displayName,
          imageUrl: tenant.profileImage ?? undefined,
        };
      }
      break;
    }
    case "vendor_post": {
      const post = await db.query.vendorPosts.findFirst({
        where: eq(vendorPosts.id, targetId),
        with: { vendor: true },
      });
      if (post) {
        return {
          name: post.vendor?.name || "Vendor Post",
          imageUrl: (post.images as string[])?.[0] || (post.vendor?.profileImage ?? undefined),
        };
      }
      break;
    }
    case "showcase": {
      const showcase = await db.query.weddingShowcases.findFirst({
        where: eq(weddingShowcases.id, targetId),
      });
      if (showcase) {
        return {
          name: showcase.title,
          imageUrl: showcase.featuredImage || (showcase.images as string[])?.[0],
        };
      }
      break;
    }
  }
  return null;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(tenantId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientTenantId, tenantId),
        eq(notifications.isRead, false)
      )
    );

  return result[0]?.count ?? 0;
}

// ============================================================================
// UPDATE NOTIFICATIONS
// ============================================================================

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

/**
 * Mark all notifications as read for a tenant
 */
export async function markAllNotificationsRead(tenantId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.recipientTenantId, tenantId),
        eq(notifications.isRead, false)
      )
    );
}

/**
 * Mark notifications as read for a specific target
 * Useful for marking message notifications as read when viewing a conversation
 */
export async function markNotificationsReadForTarget(
  tenantId: string,
  targetType: string,
  targetId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.recipientTenantId, tenantId),
        eq(notifications.targetType, targetType),
        eq(notifications.targetId, targetId),
        eq(notifications.isRead, false)
      )
    );
}

// ============================================================================
// DELETE NOTIFICATIONS
// ============================================================================

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await db.delete(notifications).where(eq(notifications.id, notificationId));
}

/**
 * Delete old read notifications (cleanup job)
 * Keeps notifications for 30 days after being read
 */
export async function cleanupOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.isRead, true),
        lt(notifications.readAt, thirtyDaysAgo)
      )
    )
    .returning({ id: notifications.id });

  return result.length;
}

// ============================================================================
// BATCH NOTIFICATIONS
// ============================================================================

/**
 * Send notifications to multiple followers (e.g., for a new vendor post)
 */
export async function notifyFollowers(
  followerTenantIds: string[],
  notificationData: Omit<NewNotification, "recipientTenantId">
): Promise<void> {
  if (followerTenantIds.length === 0) return;

  const notificationValues = followerTenantIds.map((tenantId) => ({
    ...notificationData,
    recipientTenantId: tenantId,
  }));

  await db.insert(notifications).values(notificationValues);
}
