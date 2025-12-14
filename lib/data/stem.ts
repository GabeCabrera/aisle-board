import { db } from "@/lib/db";
import {
  boards,
  ideas,
  tenants,
  follows,
  activities,
  comments,
  reactions,
  conversations,
  messages,
  vendorProfiles,
  vendorSaves,
  vendorReviews,
  vendorQuestions,
  vendorFollows,
  vendorPosts,
  weddingShowcases,
  boardArticles,
  userBlocks,
  weddingKernels,
  customVendors,
  contentReports,
} from "@/lib/db/schema";
import type { VendorProfile, CustomVendor, VendorPost, WeddingShowcase } from "@/lib/db/schema";
import { eq, and, desc, or, inArray, not, sql, ilike, asc } from "drizzle-orm";
import {
  createFollowerNotification,
  createReactionNotification,
  createCommentNotification,
  createMessageNotification,
} from "@/lib/data/notifications";

// =============================================================================
// BOARDS & IDEAS (renamed from inspo.ts)
// =============================================================================

export async function getBoard(boardId: string) {
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
    with: {
      tenant: {
        columns: { displayName: true },
      },
    },
  });

  if (!board) return null;

  const fetchedIdeas = await db.query.ideas.findMany({
    where: eq(ideas.boardId, boardId),
    orderBy: [desc(ideas.createdAt)],
  });

  // Also fetch board articles
  const fetchedArticles = await db.query.boardArticles.findMany({
    where: eq(boardArticles.boardId, boardId),
    orderBy: [desc(boardArticles.createdAt)],
  });

  return {
    ...board,
    ideas: fetchedIdeas,
    articles: fetchedArticles,
  };
}

export async function getPublicBoards() {
  const boardsData = await db.query.boards.findMany({
    where: eq(boards.isPublic, true),
    with: {
      tenant: {
        columns: { id: true, displayName: true, profileImage: true },
      },
      ideas: {
        columns: { id: true, imageUrl: true },
        orderBy: [desc(ideas.createdAt)],
      },
    },
    orderBy: [desc(boards.updatedAt)],
    limit: 50,
  });

  // Return boards with idea count and only first 4 ideas for cover
  return boardsData.map((board) => ({
    ...board,
    ideaCount: board.ideas.length,
    ideas: board.ideas.slice(0, 4),
  }));
}

export async function getMyBoards(tenantId: string) {
  const myBoards = await db.query.boards.findMany({
    where: eq(boards.tenantId, tenantId),
    with: {
      ideas: {
        columns: { id: true },
      },
      tenant: {
        columns: { displayName: true },
      },
    },
    orderBy: [desc(boards.updatedAt)],
  });

  return myBoards.map((board) => ({
    ...board,
    ideaCount: board.ideas.length,
    tenantName: board.tenant?.displayName || "Unknown",
  }));
}

/**
 * Search for ideas across public boards
 * Returns ideas with their associated board and tenant info
 */
export async function searchIdeas(query: string, limit = 20) {
  if (!query.trim()) return [];

  const searchPattern = `%${query.trim()}%`;

  // Search ideas that belong to public boards
  const results = await db
    .select({
      idea: ideas,
      board: boards,
      tenant: {
        id: tenants.id,
        displayName: tenants.displayName,
        profileImage: tenants.profileImage,
      },
    })
    .from(ideas)
    .innerJoin(boards, eq(ideas.boardId, boards.id))
    .innerJoin(tenants, eq(boards.tenantId, tenants.id))
    .where(
      and(
        eq(boards.isPublic, true),
        or(
          ilike(ideas.title, searchPattern),
          ilike(ideas.description, searchPattern),
          sql`${ideas.tags}::text ILIKE ${searchPattern}`
        )
      )
    )
    .orderBy(desc(ideas.reactionCount), desc(ideas.saveCount), desc(ideas.createdAt))
    .limit(limit);

  // Transform to expected format: IdeaWithBoard
  return results.map(({ idea, board, tenant }) => ({
    ...idea,
    board: {
      ...board,
      tenant,
      ideas: [], // Not needed for search results
      ideaCount: 0,
    },
  }));
}

// =============================================================================
// PUBLIC PROFILES
// =============================================================================

export async function getPublicProfile(tenantId: string, viewerTenantId?: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      id: true,
      displayName: true,
      weddingDate: true,
      slug: true,
      bio: true,
      socialLinks: true,
      profileImage: true,
      messagingEnabled: true,
      profileVisibility: true,
    },
  });

  if (!tenant) return null;

  const publicBoards = await db.query.boards.findMany({
    where: and(eq(boards.tenantId, tenantId), eq(boards.isPublic, true)),
    with: {
      ideas: {
        columns: { imageUrl: true },
        limit: 4,
        orderBy: [desc(ideas.createdAt)],
      },
      tenant: {
        columns: { displayName: true },
      },
    },
    orderBy: [desc(boards.updatedAt)],
  });

  const stats = await getSocialStats(tenantId);
  const isFollowing = viewerTenantId ? await getFollowStatus(viewerTenantId, tenantId) : false;
  const isBlocked = viewerTenantId ? await getBlockStatus(viewerTenantId, tenantId) : false;

  return {
    ...tenant,
    boards: publicBoards,
    stats,
    isFollowing,
    isBlocked,
  };
}

// =============================================================================
// FOLLOWS & SOCIAL STATS
// =============================================================================

export async function getFollowStatus(followerId: string, followingId: string) {
  const follow = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
  });
  return !!follow;
}

export async function followTenant(followerId: string, followingId: string) {
  if (followerId === followingId) return;

  // Check if already following to avoid duplicate notifications
  const existing = await db.query.follows.findFirst({
    where: and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)),
  });

  if (existing) return;

  await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();

  // Create activity
  await createActivity({
    actorTenantId: followerId,
    type: "followed_user",
    targetType: "tenant",
    targetId: followingId,
    isPublic: true,
  });

  // Notify the followed user
  await createFollowerNotification(followingId, followerId);
}

export async function unfollowTenant(followerId: string, followingId: string) {
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
}

export async function getSocialStats(tenantId: string) {
  const followers = await db.query.follows.findMany({
    where: eq(follows.followingId, tenantId),
    columns: { followerId: true },
  });

  const following = await db.query.follows.findMany({
    where: eq(follows.followerId, tenantId),
    columns: { followingId: true },
  });

  return {
    followersCount: followers.length,
    followingCount: following.length,
  };
}

export async function getFollowingIds(tenantId: string): Promise<string[]> {
  const followingList = await db.query.follows.findMany({
    where: eq(follows.followerId, tenantId),
    columns: { followingId: true },
  });
  return followingList.map((f) => f.followingId);
}

export async function getFollowersList(tenantId: string, viewerTenantId: string) {
  // Get all followers of this tenant
  const followerRecords = await db.query.follows.findMany({
    where: eq(follows.followingId, tenantId),
    with: {
      follower: {
        columns: {
          id: true,
          displayName: true,
          profileImage: true,
          slug: true,
          weddingDate: true,
        },
      },
    },
  });

  // Check which ones the viewer is following
  const viewerFollowingIds = await getFollowingIds(viewerTenantId);

  return followerRecords.map((record) => ({
    id: record.follower.id,
    displayName: record.follower.displayName,
    profileImage: record.follower.profileImage,
    slug: record.follower.slug,
    weddingDate: record.follower.weddingDate,
    isFollowing: viewerFollowingIds.includes(record.follower.id),
  }));
}

export async function getFollowingList(tenantId: string, viewerTenantId: string) {
  // Get all tenants this user is following
  const followingRecords = await db.query.follows.findMany({
    where: eq(follows.followerId, tenantId),
    with: {
      following: {
        columns: {
          id: true,
          displayName: true,
          profileImage: true,
          slug: true,
          weddingDate: true,
        },
      },
    },
  });

  // Check which ones the viewer is following (for follow/unfollow button state)
  const viewerFollowingIds = await getFollowingIds(viewerTenantId);

  return followingRecords.map((record) => ({
    id: record.following.id,
    displayName: record.following.displayName,
    profileImage: record.following.profileImage,
    slug: record.following.slug,
    weddingDate: record.following.weddingDate,
    isFollowing: viewerFollowingIds.includes(record.following.id),
  }));
}

// =============================================================================
// ACTIVITIES
// =============================================================================

export async function createActivity(data: {
  actorTenantId: string;
  type: string;
  targetType: string;
  targetId: string;
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(activities).values({
    actorTenantId: data.actorTenantId,
    type: data.type,
    targetType: data.targetType,
    targetId: data.targetId,
    isPublic: data.isPublic ?? true,
    metadata: data.metadata ?? {},
  });
}

export async function getActivityFeed(
  viewerTenantId: string,
  options: { cursor?: string; limit?: number } = {}
) {
  const limit = options.limit ?? 20;

  // Get who the viewer follows
  const followingIds = await getFollowingIds(viewerTenantId);

  // Get blocked users
  const blockedIds = await getBlockedIds(viewerTenantId);

  // Include own activities + followed users' activities
  const targetTenantIds = [viewerTenantId, ...followingIds].filter(
    (id) => !blockedIds.includes(id)
  );

  if (targetTenantIds.length === 0) {
    return { activities: [], nextCursor: null };
  }

  const feed = await db.query.activities.findMany({
    where: and(
      inArray(activities.actorTenantId, targetTenantIds),
      eq(activities.isPublic, true)
    ),
    with: {
      actor: {
        columns: { id: true, displayName: true, profileImage: true, slug: true },
      },
    },
    orderBy: [desc(activities.createdAt)],
    limit: limit + 1, // Fetch one extra to check for more
  });

  const hasMore = feed.length > limit;
  const activitiesResult = hasMore ? feed.slice(0, limit) : feed;
  const nextCursor = hasMore ? activitiesResult[activitiesResult.length - 1]?.id : null;

  return {
    activities: activitiesResult,
    nextCursor,
  };
}

// =============================================================================
// COMMENTS
// =============================================================================

export async function getComments(targetType: string, targetId: string) {
  const allComments = await db.query.comments.findMany({
    where: and(
      eq(comments.targetType, targetType),
      eq(comments.targetId, targetId),
      eq(comments.isHidden, false)
    ),
    with: {
      tenant: {
        columns: { id: true, displayName: true, profileImage: true, slug: true },
      },
    },
    orderBy: [desc(comments.createdAt)],
  });

  // Organize into threads (parent comments with replies)
  const parentComments = allComments.filter((c) => !c.parentId);
  const replies = allComments.filter((c) => c.parentId);

  return parentComments.map((parent) => ({
    ...parent,
    replies: replies.filter((r) => r.parentId === parent.id),
  }));
}

export async function createComment(data: {
  tenantId: string;
  targetType: string;
  targetId: string;
  content: string;
  parentId?: string;
}) {
  const [newComment] = await db
    .insert(comments)
    .values({
      tenantId: data.tenantId,
      targetType: data.targetType,
      targetId: data.targetId,
      content: data.content,
      parentId: data.parentId,
    })
    .returning();

  // Create activity
  await createActivity({
    actorTenantId: data.tenantId,
    type: "comment_added",
    targetType: data.targetType,
    targetId: data.targetId,
    metadata: { commentId: newComment.id },
  });

  // Increment comment count on target
  if (data.targetType === "board") {
    await db
      .update(boards)
      .set({ commentCount: sql`${boards.commentCount} + 1` })
      .where(eq(boards.id, data.targetId));
  } else if (data.targetType === "idea") {
    await db
      .update(ideas)
      .set({ commentCount: sql`${ideas.commentCount} + 1` })
      .where(eq(ideas.id, data.targetId));
  } else if (data.targetType === "vendor_post") {
    await db
      .update(vendorPosts)
      .set({ commentCount: sql`${vendorPosts.commentCount} + 1` })
      .where(eq(vendorPosts.id, data.targetId));
  } else if (data.targetType === "showcase") {
    await db
      .update(weddingShowcases)
      .set({ commentCount: sql`${weddingShowcases.commentCount} + 1` })
      .where(eq(weddingShowcases.id, data.targetId));
  }

  // Notify the content owner (if different from commenter) for boards and ideas
  if (data.targetType === "board" || data.targetType === "idea") {
    const ownerId = await getContentOwnerId(data.targetType, data.targetId);
    if (ownerId && ownerId !== data.tenantId) {
      await createCommentNotification(
        ownerId,
        data.tenantId,
        data.targetType as "board" | "idea",
        data.targetId
      );
    }
  }

  return newComment;
}

export async function deleteComment(commentId: string, tenantId: string) {
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
  });

  if (!comment || comment.tenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  await db.delete(comments).where(eq(comments.id, commentId));

  // Decrement comment count
  if (comment.targetType === "board") {
    await db
      .update(boards)
      .set({ commentCount: sql`${boards.commentCount} - 1` })
      .where(eq(boards.id, comment.targetId));
  } else if (comment.targetType === "idea") {
    await db
      .update(ideas)
      .set({ commentCount: sql`${ideas.commentCount} - 1` })
      .where(eq(ideas.id, comment.targetId));
  } else if (comment.targetType === "vendor_post") {
    await db
      .update(vendorPosts)
      .set({ commentCount: sql`${vendorPosts.commentCount} - 1` })
      .where(eq(vendorPosts.id, comment.targetId));
  } else if (comment.targetType === "showcase") {
    await db
      .update(weddingShowcases)
      .set({ commentCount: sql`${weddingShowcases.commentCount} - 1` })
      .where(eq(weddingShowcases.id, comment.targetId));
  }
}

// =============================================================================
// REACTIONS
// =============================================================================

export async function toggleReaction(data: {
  tenantId: string;
  targetType: string;
  targetId: string;
  type?: string;
}) {
  const reactionType = data.type ?? "heart";

  // Check if reaction exists
  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.tenantId, data.tenantId),
      eq(reactions.targetType, data.targetType),
      eq(reactions.targetId, data.targetId),
      eq(reactions.type, reactionType)
    ),
  });

  if (existing) {
    // Remove reaction
    await db.delete(reactions).where(eq(reactions.id, existing.id));

    // Decrement count
    await updateReactionCount(data.targetType, data.targetId, -1);

    return { reacted: false };
  } else {
    // Add reaction
    await db.insert(reactions).values({
      tenantId: data.tenantId,
      targetType: data.targetType,
      targetId: data.targetId,
      type: reactionType,
    });

    // Increment count
    await updateReactionCount(data.targetType, data.targetId, 1);

    // Create activity
    await createActivity({
      actorTenantId: data.tenantId,
      type: "reaction_added",
      targetType: data.targetType,
      targetId: data.targetId,
      metadata: { reactionType },
    });

    // Notify the content owner (if different from reactor)
    const ownerId = await getContentOwnerId(data.targetType, data.targetId);
    if (ownerId && ownerId !== data.tenantId) {
      await createReactionNotification(
        ownerId,
        data.tenantId,
        data.targetType as "board" | "idea" | "comment",
        data.targetId
      );
    }

    return { reacted: true };
  }
}

async function updateReactionCount(targetType: string, targetId: string, delta: number) {
  if (targetType === "board") {
    await db
      .update(boards)
      .set({ reactionCount: sql`${boards.reactionCount} + ${delta}` })
      .where(eq(boards.id, targetId));
  } else if (targetType === "idea") {
    await db
      .update(ideas)
      .set({ reactionCount: sql`${ideas.reactionCount} + ${delta}` })
      .where(eq(ideas.id, targetId));
  }
}

async function getContentOwnerId(targetType: string, targetId: string): Promise<string | null> {
  if (targetType === "board") {
    const board = await db.query.boards.findFirst({
      where: eq(boards.id, targetId),
      columns: { tenantId: true },
    });
    return board?.tenantId ?? null;
  } else if (targetType === "idea") {
    const idea = await db.query.ideas.findFirst({
      where: eq(ideas.id, targetId),
      with: { board: { columns: { tenantId: true } } },
    });
    return idea?.board?.tenantId ?? null;
  } else if (targetType === "comment") {
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, targetId),
      columns: { tenantId: true },
    });
    return comment?.tenantId ?? null;
  }
  return null;
}

export async function getReactionStatus(
  tenantId: string,
  targetType: string,
  targetId: string
) {
  const reaction = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.tenantId, tenantId),
      eq(reactions.targetType, targetType),
      eq(reactions.targetId, targetId)
    ),
  });
  return !!reaction;
}

// =============================================================================
// MESSAGING
// =============================================================================

export async function getConversations(tenantId: string) {
  const convos = await db.query.conversations.findMany({
    where: or(
      eq(conversations.participant1Id, tenantId),
      eq(conversations.participant2Id, tenantId)
    ),
    with: {
      participant1: {
        columns: { id: true, displayName: true, profileImage: true, slug: true },
      },
      participant2: {
        columns: { id: true, displayName: true, profileImage: true, slug: true },
      },
    },
    orderBy: [desc(conversations.lastMessageAt)],
  });

  // Get unread counts for each conversation
  const convosWithUnread = await Promise.all(
    convos.map(async (convo) => {
      const unreadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, convo.id),
            not(eq(messages.senderTenantId, tenantId)),
            sql`${messages.readAt} IS NULL`
          )
        );

      const otherParticipant =
        convo.participant1Id === tenantId ? convo.participant2 : convo.participant1;

      return {
        ...convo,
        otherParticipant,
        unreadCount: Number(unreadCount[0]?.count ?? 0),
      };
    })
  );

  return convosWithUnread;
}

export async function getOrCreateConversation(tenantId: string, otherTenantId: string) {
  // Check for existing conversation (in either direction)
  const existing = await db.query.conversations.findFirst({
    where: or(
      and(
        eq(conversations.participant1Id, tenantId),
        eq(conversations.participant2Id, otherTenantId)
      ),
      and(
        eq(conversations.participant1Id, otherTenantId),
        eq(conversations.participant2Id, tenantId)
      )
    ),
  });

  if (existing) return existing;

  // Create new conversation
  const [newConvo] = await db
    .insert(conversations)
    .values({
      participant1Id: tenantId,
      participant2Id: otherTenantId,
    })
    .returning();

  return newConvo;
}

export async function getMessages(conversationId: string, tenantId: string) {
  // Verify participant
  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (
    !convo ||
    (convo.participant1Id !== tenantId && convo.participant2Id !== tenantId)
  ) {
    throw new Error("Unauthorized");
  }

  const msgs = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    with: {
      sender: {
        columns: { id: true, displayName: true, profileImage: true },
      },
    },
    orderBy: [desc(messages.createdAt)],
    limit: 100,
  });

  // Mark messages as read
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        not(eq(messages.senderTenantId, tenantId)),
        sql`${messages.readAt} IS NULL`
      )
    );

  return msgs.reverse(); // Return in chronological order
}

export async function sendMessage(
  conversationId: string,
  senderTenantId: string,
  content: string
) {
  // Verify participant
  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (
    !convo ||
    (convo.participant1Id !== senderTenantId && convo.participant2Id !== senderTenantId)
  ) {
    throw new Error("Unauthorized");
  }

  const [newMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      senderTenantId,
      content,
    })
    .returning();

  // Update conversation's lastMessageAt
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));

  // Notify the recipient
  const recipientId = convo.participant1Id === senderTenantId
    ? convo.participant2Id
    : convo.participant1Id;
  await createMessageNotification(recipientId, senderTenantId, conversationId);

  return newMessage;
}

// =============================================================================
// BLOCKING
// =============================================================================

export async function getBlockStatus(blockerTenantId: string, blockedTenantId: string) {
  const block = await db.query.userBlocks.findFirst({
    where: and(
      eq(userBlocks.blockerTenantId, blockerTenantId),
      eq(userBlocks.blockedTenantId, blockedTenantId)
    ),
  });
  return !!block;
}

export async function getBlockedIds(tenantId: string): Promise<string[]> {
  const blocks = await db.query.userBlocks.findMany({
    where: eq(userBlocks.blockerTenantId, tenantId),
    columns: { blockedTenantId: true },
  });
  return blocks.map((b) => b.blockedTenantId);
}

export async function blockUser(blockerTenantId: string, blockedTenantId: string) {
  if (blockerTenantId === blockedTenantId) return;

  await db
    .insert(userBlocks)
    .values({ blockerTenantId, blockedTenantId })
    .onConflictDoNothing();

  // Also unfollow if following
  await unfollowTenant(blockerTenantId, blockedTenantId);
  await unfollowTenant(blockedTenantId, blockerTenantId);
}

export async function unblockUser(blockerTenantId: string, blockedTenantId: string) {
  await db
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerTenantId, blockerTenantId),
        eq(userBlocks.blockedTenantId, blockedTenantId)
      )
    );
}

// =============================================================================
// CONTENT REPORTS
// =============================================================================

const VALID_REPORT_REASONS = ["spam", "inappropriate", "harassment", "other"] as const;
const VALID_REPORT_TARGETS = ["board", "idea", "comment", "message", "tenant", "vendor_post", "showcase"] as const;

type ReportReason = typeof VALID_REPORT_REASONS[number];
type ReportTarget = typeof VALID_REPORT_TARGETS[number];

export async function createContentReport(data: {
  reporterTenantId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
}) {
  // Validate reason
  if (!VALID_REPORT_REASONS.includes(data.reason as ReportReason)) {
    throw new Error("Invalid report reason");
  }

  // Validate target type
  if (!VALID_REPORT_TARGETS.includes(data.targetType as ReportTarget)) {
    throw new Error("Invalid target type");
  }

  const [report] = await db
    .insert(contentReports)
    .values({
      reporterTenantId: data.reporterTenantId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      details: data.details,
      status: "pending",
    })
    .returning();

  return report;
}

export async function getReportsForAdmin(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const { status, limit = 50, offset = 0 } = options || {};

  const reports = await db.query.contentReports.findMany({
    where: status ? eq(contentReports.status, status) : undefined,
    with: {
      reporter: {
        columns: { id: true, displayName: true, profileImage: true },
      },
    },
    orderBy: [desc(contentReports.createdAt)],
    limit,
    offset,
  });

  return reports;
}

// =============================================================================
// BOARD ARTICLES (Blog integration)
// =============================================================================

export async function saveArticleToBoard(
  boardId: string,
  articleSlug: string,
  tenantId: string,
  notes?: string
) {
  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  });

  if (!board || board.tenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  await db
    .insert(boardArticles)
    .values({ boardId, articleSlug, notes })
    .onConflictDoNothing();

  // Create activity
  await createActivity({
    actorTenantId: tenantId,
    type: "article_saved",
    targetType: "article",
    targetId: articleSlug,
    metadata: { boardId, boardName: board.name },
  });
}

export async function removeArticleFromBoard(
  boardId: string,
  articleSlug: string,
  tenantId: string
) {
  // Verify board ownership
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  });

  if (!board || board.tenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(boardArticles)
    .where(
      and(eq(boardArticles.boardId, boardId), eq(boardArticles.articleSlug, articleSlug))
    );
}

export async function getBoardArticles(boardId: string) {
  return db.query.boardArticles.findMany({
    where: eq(boardArticles.boardId, boardId),
    orderBy: [desc(boardArticles.createdAt)],
  });
}

// =============================================================================
// VENDORS
// =============================================================================

export async function getVendors(options: {
  category?: string;
  state?: string;
  city?: string;
  priceRange?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];

  if (options.category) {
    conditions.push(eq(vendorProfiles.category, options.category));
  }
  if (options.state) {
    conditions.push(eq(vendorProfiles.state, options.state));
  }
  if (options.city) {
    conditions.push(eq(vendorProfiles.city, options.city));
  }
  if (options.priceRange) {
    conditions.push(eq(vendorProfiles.priceRange, options.priceRange));
  }

  const vendors = await db.query.vendorProfiles.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(vendorProfiles.isFeatured), desc(vendorProfiles.saveCount)],
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
  });

  return vendors;
}

export async function getVendorBySlug(slug: string) {
  return db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.slug, slug),
  });
}

export async function getVendorsWithSearch(options: {
  category?: string;
  state?: string;
  city?: string;
  priceRange?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "featured" | "rating" | "reviews" | "saves" | "newest";
}) {
  const conditions = [];

  if (options.category) {
    conditions.push(eq(vendorProfiles.category, options.category));
  }
  if (options.state) {
    conditions.push(eq(vendorProfiles.state, options.state));
  }
  if (options.city) {
    conditions.push(eq(vendorProfiles.city, options.city));
  }
  if (options.priceRange) {
    conditions.push(eq(vendorProfiles.priceRange, options.priceRange));
  }
  if (options.search) {
    conditions.push(
      or(
        ilike(vendorProfiles.name, `%${options.search}%`),
        ilike(vendorProfiles.description, `%${options.search}%`),
        ilike(vendorProfiles.city, `%${options.search}%`)
      )
    );
  }

  // Determine sort order
  let orderBy;
  switch (options.sortBy) {
    case "rating":
      orderBy = [desc(vendorProfiles.averageRating), desc(vendorProfiles.reviewCount)];
      break;
    case "reviews":
      orderBy = [desc(vendorProfiles.reviewCount)];
      break;
    case "saves":
      orderBy = [desc(vendorProfiles.saveCount)];
      break;
    case "newest":
      orderBy = [desc(vendorProfiles.createdAt)];
      break;
    case "featured":
    default:
      orderBy = [desc(vendorProfiles.isFeatured), desc(vendorProfiles.averageRating), desc(vendorProfiles.saveCount)];
  }

  const vendors = await db.query.vendorProfiles.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy,
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
  });

  return vendors;
}

// =============================================================================
// LOCATION-BASED VENDOR RECOMMENDATIONS
// =============================================================================

export type LocationMatch = "city" | "state" | "serviceArea" | null;

export interface WeddingLocation {
  city: string | null;
  state: string | null;
  region: string | null;
  raw: string | null;
}

export async function getWeddingLocation(tenantId: string): Promise<WeddingLocation> {
  const kernel = await db.query.weddingKernels.findFirst({
    where: eq(weddingKernels.tenantId, tenantId),
    columns: { location: true, region: true },
  });

  if (!kernel?.location && !kernel?.region) {
    return { city: null, state: null, region: null, raw: null };
  }

  // Parse location string (format: "City, State" or just "City" or "State")
  let city: string | null = null;
  let state: string | null = null;

  if (kernel.location) {
    const parts = kernel.location.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      city = parts[0];
      state = parts[1];
    } else if (parts.length === 1) {
      // Could be just a city or state - try to determine
      state = parts[0];
    }
  }

  // Use region as state fallback
  if (!state && kernel.region) {
    state = kernel.region;
  }

  return {
    city,
    state,
    region: kernel.region,
    raw: kernel.location,
  };
}

export async function getVendorsForLocation(options: {
  state?: string | null;
  city?: string | null;
  category?: string;
  limit?: number;
  excludeIds?: string[];
}) {
  const conditions = [];

  // Must have a state or city to filter
  if (!options.state && !options.city) {
    return [];
  }

  // Match by state
  if (options.state) {
    conditions.push(
      or(
        ilike(vendorProfiles.state, options.state),
        ilike(vendorProfiles.region, options.state)
      )
    );
  }

  // Filter by category if provided
  if (options.category) {
    conditions.push(eq(vendorProfiles.category, options.category));
  }

  // Exclude specific vendor IDs (useful to avoid duplicates)
  if (options.excludeIds && options.excludeIds.length > 0) {
    conditions.push(not(inArray(vendorProfiles.id, options.excludeIds)));
  }

  const vendors = await db.query.vendorProfiles.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(vendorProfiles.isFeatured), desc(vendorProfiles.averageRating), desc(vendorProfiles.saveCount)],
    limit: options.limit ?? 12,
  });

  // Determine location match type for each vendor
  return vendors.map((vendor) => {
    let locationMatch: LocationMatch = null;

    if (options.city && vendor.city?.toLowerCase() === options.city.toLowerCase()) {
      locationMatch = "city";
    } else if (options.state && (
      vendor.state?.toLowerCase() === options.state.toLowerCase() ||
      vendor.region?.toLowerCase() === options.state.toLowerCase()
    )) {
      locationMatch = "state";
    } else {
      // Check service area
      const serviceArea = (vendor.serviceArea as string[]) || [];
      const matchesServiceArea = serviceArea.some((area) => {
        const areaLower = area.toLowerCase();
        return (
          (options.city && areaLower.includes(options.city.toLowerCase())) ||
          (options.state && areaLower.includes(options.state.toLowerCase()))
        );
      });
      if (matchesServiceArea) {
        locationMatch = "serviceArea";
      }
    }

    return { ...vendor, locationMatch };
  });
}

export async function getVendorBySlugWithStatus(slug: string, viewerTenantId?: string) {
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.slug, slug),
  });

  if (!vendor) return null;

  const isSaved = viewerTenantId
    ? await getVendorSaveStatus(viewerTenantId, vendor.id)
    : false;

  const userReview = viewerTenantId
    ? await getUserReviewForVendor(viewerTenantId, vendor.id)
    : null;

  // Get claimed tenant info if vendor is claimed
  let claimedTenant = null;
  if (vendor.claimedByTenantId) {
    claimedTenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, vendor.claimedByTenantId),
      columns: { id: true, displayName: true, profileImage: true, messagingEnabled: true },
    });
  }

  return {
    ...vendor,
    isSaved,
    userReview,
    claimedTenant,
  };
}

// =============================================================================
// VENDOR SAVES
// =============================================================================

export async function getVendorSaveStatus(tenantId: string, vendorId: string) {
  const save = await db.query.vendorSaves.findFirst({
    where: and(
      eq(vendorSaves.tenantId, tenantId),
      eq(vendorSaves.vendorId, vendorId)
    ),
  });
  return !!save;
}

export async function saveVendor(tenantId: string, vendorId: string, notes?: string) {
  await db
    .insert(vendorSaves)
    .values({ tenantId, vendorId, notes })
    .onConflictDoNothing();

  // Increment vendor save count
  await db
    .update(vendorProfiles)
    .set({ saveCount: sql`${vendorProfiles.saveCount} + 1` })
    .where(eq(vendorProfiles.id, vendorId));

  // Create activity
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, vendorId),
    columns: { name: true, slug: true },
  });

  await createActivity({
    actorTenantId: tenantId,
    type: "vendor_saved",
    targetType: "vendor",
    targetId: vendorId,
    metadata: { vendorName: vendor?.name, vendorSlug: vendor?.slug },
  });
}

export async function unsaveVendor(tenantId: string, vendorId: string) {
  const existing = await db.query.vendorSaves.findFirst({
    where: and(
      eq(vendorSaves.tenantId, tenantId),
      eq(vendorSaves.vendorId, vendorId)
    ),
  });

  if (!existing) return;

  await db
    .delete(vendorSaves)
    .where(
      and(
        eq(vendorSaves.tenantId, tenantId),
        eq(vendorSaves.vendorId, vendorId)
      )
    );

  // Decrement vendor save count
  await db
    .update(vendorProfiles)
    .set({ saveCount: sql`${vendorProfiles.saveCount} - 1` })
    .where(eq(vendorProfiles.id, vendorId));
}

export async function getSavedVendors(tenantId: string) {
  const saves = await db.query.vendorSaves.findMany({
    where: eq(vendorSaves.tenantId, tenantId),
    with: {
      vendor: true,
    },
    orderBy: [desc(vendorSaves.savedAt)],
  });

  return saves.map((save) => ({
    ...save.vendor,
    savedAt: save.savedAt,
    notes: save.notes,
  }));
}

// =============================================================================
// VENDOR REVIEWS
// =============================================================================

export async function createVendorReview(data: {
  vendorId: string;
  tenantId: string;
  rating: number;
  title?: string;
  content?: string;
  serviceDate?: Date;
}) {
  // Check for existing review
  const existing = await db.query.vendorReviews.findFirst({
    where: and(
      eq(vendorReviews.tenantId, data.tenantId),
      eq(vendorReviews.vendorId, data.vendorId)
    ),
  });

  if (existing) {
    throw new Error("You have already reviewed this vendor");
  }

  const [newReview] = await db
    .insert(vendorReviews)
    .values({
      vendorId: data.vendorId,
      tenantId: data.tenantId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      serviceDate: data.serviceDate,
    })
    .returning();

  // Update vendor's review count and average rating
  await updateVendorRatingStats(data.vendorId);

  // Create activity
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, data.vendorId),
    columns: { name: true, slug: true },
  });

  await createActivity({
    actorTenantId: data.tenantId,
    type: "vendor_reviewed",
    targetType: "vendor",
    targetId: data.vendorId,
    metadata: {
      vendorName: vendor?.name,
      vendorSlug: vendor?.slug,
      rating: data.rating,
    },
  });

  return newReview;
}

export async function getVendorReviews(
  vendorId: string,
  options: { limit?: number; offset?: number; sortBy?: "newest" | "highest" | "lowest" | "helpful" } = {}
) {
  let orderBy;
  switch (options.sortBy) {
    case "highest":
      orderBy = [desc(vendorReviews.rating), desc(vendorReviews.createdAt)];
      break;
    case "lowest":
      orderBy = [asc(vendorReviews.rating), desc(vendorReviews.createdAt)];
      break;
    case "helpful":
      orderBy = [desc(vendorReviews.helpfulCount), desc(vendorReviews.createdAt)];
      break;
    case "newest":
    default:
      orderBy = [desc(vendorReviews.createdAt)];
  }

  const reviews = await db.query.vendorReviews.findMany({
    where: and(
      eq(vendorReviews.vendorId, vendorId),
      eq(vendorReviews.isHidden, false)
    ),
    with: {
      tenant: {
        columns: { id: true, displayName: true, profileImage: true, slug: true },
      },
    },
    orderBy,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });

  return reviews;
}

export async function getUserReviewForVendor(tenantId: string, vendorId: string) {
  return db.query.vendorReviews.findFirst({
    where: and(
      eq(vendorReviews.tenantId, tenantId),
      eq(vendorReviews.vendorId, vendorId)
    ),
  });
}

export async function updateVendorReview(
  reviewId: string,
  tenantId: string,
  data: { rating?: number; title?: string; content?: string; serviceDate?: Date }
) {
  const review = await db.query.vendorReviews.findFirst({
    where: eq(vendorReviews.id, reviewId),
  });

  if (!review || review.tenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  const [updated] = await db
    .update(vendorReviews)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vendorReviews.id, reviewId))
    .returning();

  // Update vendor stats if rating changed
  if (data.rating !== undefined) {
    await updateVendorRatingStats(review.vendorId);
  }

  return updated;
}

export async function deleteVendorReview(reviewId: string, tenantId: string) {
  const review = await db.query.vendorReviews.findFirst({
    where: eq(vendorReviews.id, reviewId),
  });

  if (!review || review.tenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  await db.delete(vendorReviews).where(eq(vendorReviews.id, reviewId));

  // Update vendor stats
  await updateVendorRatingStats(review.vendorId);
}

export async function markReviewHelpful(reviewId: string, tenantId: string) {
  // For now, just increment - could add a separate table for tracking who marked helpful
  await db
    .update(vendorReviews)
    .set({ helpfulCount: sql`${vendorReviews.helpfulCount} + 1` })
    .where(eq(vendorReviews.id, reviewId));
}

async function updateVendorRatingStats(vendorId: string) {
  // Calculate new average rating and count
  const stats = await db
    .select({
      avgRating: sql<number>`COALESCE(AVG(${vendorReviews.rating}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(vendorReviews)
    .where(
      and(
        eq(vendorReviews.vendorId, vendorId),
        eq(vendorReviews.isHidden, false)
      )
    );

  const avgRating = Number(stats[0]?.avgRating ?? 0);
  const count = Number(stats[0]?.count ?? 0);

  await db
    .update(vendorProfiles)
    .set({
      averageRating: Math.round(avgRating * 10), // Store as integer 10-50 (e.g., 4.5 = 45)
      reviewCount: count,
    })
    .where(eq(vendorProfiles.id, vendorId));
}

// =============================================================================
// VENDOR QUESTIONS (Q&A)
// =============================================================================

export async function createVendorQuestion(data: {
  vendorId: string;
  tenantId: string;
  question: string;
}) {
  const [newQuestion] = await db
    .insert(vendorQuestions)
    .values({
      vendorId: data.vendorId,
      tenantId: data.tenantId,
      question: data.question,
    })
    .returning();

  // Update vendor question count
  await updateVendorQuestionStats(data.vendorId);

  // Create activity
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, data.vendorId),
    columns: { name: true, slug: true },
  });

  await createActivity({
    actorTenantId: data.tenantId,
    type: "vendor_question",
    targetType: "vendor",
    targetId: data.vendorId,
    metadata: {
      vendorName: vendor?.name,
      vendorSlug: vendor?.slug,
    },
  });

  return newQuestion;
}

export async function getVendorQuestions(
  vendorId: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: "newest" | "unanswered" | "helpful";
  } = {}
) {
  let orderBy;
  switch (options.sortBy) {
    case "unanswered":
      // Unanswered first, then by date
      orderBy = [sql`${vendorQuestions.answeredAt} IS NOT NULL`, desc(vendorQuestions.createdAt)];
      break;
    case "helpful":
      orderBy = [desc(vendorQuestions.helpfulCount), desc(vendorQuestions.createdAt)];
      break;
    case "newest":
    default:
      orderBy = [desc(vendorQuestions.createdAt)];
  }

  const questions = await db.query.vendorQuestions.findMany({
    where: and(
      eq(vendorQuestions.vendorId, vendorId),
      eq(vendorQuestions.isHidden, false)
    ),
    with: {
      tenant: {
        columns: { id: true, displayName: true, profileImage: true, slug: true },
      },
      answeredBy: {
        columns: { id: true, displayName: true, profileImage: true },
      },
    },
    orderBy,
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });

  return questions;
}

export async function answerVendorQuestion(
  questionId: string,
  tenantId: string,
  answer: string
) {
  // Get the question to verify vendor ownership
  const question = await db.query.vendorQuestions.findFirst({
    where: eq(vendorQuestions.id, questionId),
    with: {
      vendor: {
        columns: { claimedByTenantId: true },
      },
    },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  // Verify the answerer owns the vendor
  if (question.vendor.claimedByTenantId !== tenantId) {
    throw new Error("Only the vendor owner can answer questions");
  }

  // Update the question with the answer
  const [updated] = await db
    .update(vendorQuestions)
    .set({
      answer,
      answeredByTenantId: tenantId,
      answeredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(vendorQuestions.id, questionId))
    .returning();

  return updated;
}

export async function markQuestionHelpful(questionId: string, tenantId: string) {
  await db
    .update(vendorQuestions)
    .set({ helpfulCount: sql`${vendorQuestions.helpfulCount} + 1` })
    .where(eq(vendorQuestions.id, questionId));
}

async function updateVendorQuestionStats(vendorId: string) {
  const stats = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(vendorQuestions)
    .where(
      and(
        eq(vendorQuestions.vendorId, vendorId),
        eq(vendorQuestions.isHidden, false)
      )
    );

  const count = Number(stats[0]?.count ?? 0);

  await db
    .update(vendorProfiles)
    .set({ questionCount: count })
    .where(eq(vendorProfiles.id, vendorId));
}

// =============================================================================
// VENDOR ADMIN
// =============================================================================

export async function createVendor(data: {
  name: string;
  slug: string;
  category: string;
  description?: string;
  city?: string;
  state?: string;
  priceRange?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  profileImage?: string;
  coverImage?: string;
  portfolioImages?: string[];
  isVerified?: boolean;
  isFeatured?: boolean;
}) {
  const [vendor] = await db
    .insert(vendorProfiles)
    .values(data)
    .returning();

  return vendor;
}

export async function updateVendor(
  vendorId: string,
  data: Partial<{
    name: string;
    slug: string;
    category: string;
    description: string;
    city: string;
    state: string;
    priceRange: string;
    email: string;
    phone: string;
    website: string;
    instagram: string;
    profileImage: string;
    coverImage: string;
    portfolioImages: string[];
    isVerified: boolean;
    isFeatured: boolean;
  }>
) {
  const [updated] = await db
    .update(vendorProfiles)
    .set(data)
    .where(eq(vendorProfiles.id, vendorId))
    .returning();

  return updated;
}

export async function deleteVendor(vendorId: string) {
  await db.delete(vendorProfiles).where(eq(vendorProfiles.id, vendorId));
}

export async function getVendorById(vendorId: string) {
  return db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, vendorId),
  });
}

export async function getVendorCategories() {
  const result = await db
    .selectDistinct({ category: vendorProfiles.category })
    .from(vendorProfiles)
    .orderBy(vendorProfiles.category);

  return result.map((r) => r.category);
}

export async function getVendorStates() {
  const result = await db
    .selectDistinct({ state: vendorProfiles.state })
    .from(vendorProfiles)
    .where(not(sql`${vendorProfiles.state} IS NULL`))
    .orderBy(vendorProfiles.state);

  return result.map((r) => r.state).filter(Boolean) as string[];
}

// =============================================================================
// UNIFIED VENDOR MANAGEMENT (for AI tools)
// =============================================================================

export type MyVendorSource = "directory" | "custom";

export interface MyVendor {
  id: string;
  source: MyVendorSource;
  category: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  status: string | null;
  priority: number | null;
  price: number | null;
  depositPaid: boolean | null;
  contractSigned: boolean | null;
  lastContactedAt: Date | null;
  bookedAt: Date | null;
  createdAt: Date;
  // Directory vendor extras (only for source="directory")
  vendorProfile?: VendorProfile;
}

/**
 * Get all "my vendors" - both saved directory vendors and custom vendors
 */
export async function getMyVendors(
  tenantId: string,
  filters?: {
    category?: string;
    status?: string;
    search?: string;
  }
): Promise<MyVendor[]> {
  // Fetch saved directory vendors
  const savedVendorsQuery = db
    .select({
      id: vendorSaves.id,
      vendorId: vendorSaves.vendorId,
      notes: vendorSaves.notes,
      status: vendorSaves.status,
      priority: vendorSaves.priority,
      price: vendorSaves.price,
      depositPaid: vendorSaves.depositPaid,
      contractSigned: vendorSaves.contractSigned,
      lastContactedAt: vendorSaves.lastContactedAt,
      bookedAt: vendorSaves.bookedAt,
      savedAt: vendorSaves.savedAt,
      // Vendor profile fields
      vendorName: vendorProfiles.name,
      vendorCategory: vendorProfiles.category,
      vendorEmail: vendorProfiles.email,
      vendorPhone: vendorProfiles.phone,
      vendorWebsite: vendorProfiles.website,
      vendorCity: vendorProfiles.city,
      vendorState: vendorProfiles.state,
      vendorProfileImage: vendorProfiles.profileImage,
      vendorSlug: vendorProfiles.slug,
      vendorAverageRating: vendorProfiles.averageRating,
      vendorReviewCount: vendorProfiles.reviewCount,
    })
    .from(vendorSaves)
    .innerJoin(vendorProfiles, eq(vendorSaves.vendorId, vendorProfiles.id))
    .where(eq(vendorSaves.tenantId, tenantId));

  // Fetch custom vendors
  const customVendorsQuery = db
    .select()
    .from(customVendors)
    .where(eq(customVendors.tenantId, tenantId));

  const [savedResults, customResults] = await Promise.all([
    savedVendorsQuery,
    customVendorsQuery,
  ]);

  // Transform saved vendors
  const savedVendorsList: MyVendor[] = savedResults.map((sv) => ({
    id: sv.id,
    source: "directory" as MyVendorSource,
    category: sv.vendorCategory,
    name: sv.vendorName,
    contactName: null, // Directory vendors use vendor profile contact
    email: sv.vendorEmail,
    phone: sv.vendorPhone,
    website: sv.vendorWebsite,
    notes: sv.notes,
    status: sv.status,
    priority: sv.priority,
    price: sv.price,
    depositPaid: sv.depositPaid,
    contractSigned: sv.contractSigned,
    lastContactedAt: sv.lastContactedAt,
    bookedAt: sv.bookedAt,
    createdAt: sv.savedAt,
    vendorProfile: {
      id: sv.vendorId,
      name: sv.vendorName,
      slug: sv.vendorSlug,
      category: sv.vendorCategory,
      email: sv.vendorEmail,
      phone: sv.vendorPhone,
      website: sv.vendorWebsite,
      city: sv.vendorCity,
      state: sv.vendorState,
      profileImage: sv.vendorProfileImage,
      averageRating: sv.vendorAverageRating,
      reviewCount: sv.vendorReviewCount,
    } as unknown as VendorProfile,
  }));

  // Transform custom vendors
  const customVendorsList: MyVendor[] = customResults.map((cv) => ({
    id: cv.id,
    source: "custom" as MyVendorSource,
    category: cv.category,
    name: cv.name,
    contactName: cv.contactName,
    email: cv.email,
    phone: cv.phone,
    website: cv.website,
    notes: cv.notes,
    status: cv.status,
    priority: cv.priority,
    price: cv.price,
    depositPaid: cv.depositPaid,
    contractSigned: cv.contractSigned,
    lastContactedAt: cv.lastContactedAt,
    bookedAt: cv.bookedAt,
    createdAt: cv.createdAt,
  }));

  // Combine and filter
  let allVendors = [...savedVendorsList, ...customVendorsList];

  if (filters?.category) {
    allVendors = allVendors.filter(
      (v) => v.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  if (filters?.status) {
    allVendors = allVendors.filter(
      (v) => v.status?.toLowerCase() === filters.status!.toLowerCase()
    );
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    allVendors = allVendors.filter(
      (v) =>
        v.name.toLowerCase().includes(searchLower) ||
        v.contactName?.toLowerCase().includes(searchLower) ||
        v.notes?.toLowerCase().includes(searchLower)
    );
  }

  // Sort by priority (high to low), then by creation date
  allVendors.sort((a, b) => {
    const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return allVendors;
}

/**
 * Update saved vendor (from directory) status/booking info
 */
export async function updateSavedVendorStatus(
  tenantId: string,
  saveId: string,
  updates: {
    status?: string;
    priority?: number;
    price?: number;
    depositPaid?: boolean;
    contractSigned?: boolean;
    notes?: string;
    lastContactedAt?: Date;
    bookedAt?: Date;
  }
) {
  const [updated] = await db
    .update(vendorSaves)
    .set(updates)
    .where(and(eq(vendorSaves.id, saveId), eq(vendorSaves.tenantId, tenantId)))
    .returning();

  return updated;
}

/**
 * Update custom vendor
 */
export async function updateCustomVendor(
  tenantId: string,
  vendorId: string,
  updates: {
    name?: string;
    category?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    notes?: string;
    status?: string;
    priority?: number;
    price?: number;
    depositPaid?: boolean;
    contractSigned?: boolean;
    lastContactedAt?: Date;
    bookedAt?: Date;
  }
) {
  const [updated] = await db
    .update(customVendors)
    .set(updates)
    .where(
      and(eq(customVendors.id, vendorId), eq(customVendors.tenantId, tenantId))
    )
    .returning();

  return updated;
}

/**
 * Add custom vendor (not in directory)
 */
export async function addCustomVendor(
  tenantId: string,
  vendor: {
    category: string;
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    notes?: string;
    status?: string;
    price?: number;
  }
) {
  const [created] = await db
    .insert(customVendors)
    .values({
      tenantId,
      category: vendor.category,
      name: vendor.name,
      contactName: vendor.contactName,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      notes: vendor.notes,
      status: vendor.status ?? "researching",
      price: vendor.price,
    })
    .returning();

  return created;
}

/**
 * Delete a vendor from my list (either saved or custom)
 */
export async function deleteMyVendor(
  tenantId: string,
  vendorId: string,
  source: MyVendorSource
) {
  if (source === "directory") {
    // For saved vendors, use the save ID
    await db
      .delete(vendorSaves)
      .where(
        and(eq(vendorSaves.id, vendorId), eq(vendorSaves.tenantId, tenantId))
      );
  } else {
    await db
      .delete(customVendors)
      .where(
        and(
          eq(customVendors.id, vendorId),
          eq(customVendors.tenantId, tenantId)
        )
      );
  }
}

/**
 * Search vendor directory (for AI to recommend vendors)
 */
export async function searchVendorDirectory(options: {
  category?: string;
  state?: string;
  city?: string;
  priceRange?: string;
  search?: string;
  limit?: number;
}): Promise<VendorProfile[]> {
  const conditions = [];

  if (options.category) {
    conditions.push(ilike(vendorProfiles.category, options.category));
  }

  if (options.state) {
    conditions.push(ilike(vendorProfiles.state, `%${options.state}%`));
  }

  if (options.city) {
    conditions.push(ilike(vendorProfiles.city, `%${options.city}%`));
  }

  if (options.priceRange) {
    conditions.push(eq(vendorProfiles.priceRange, options.priceRange));
  }

  if (options.search) {
    conditions.push(
      or(
        ilike(vendorProfiles.name, `%${options.search}%`),
        ilike(vendorProfiles.city, `%${options.search}%`),
        ilike(vendorProfiles.bio, `%${options.search}%`)
      )
    );
  }

  const query = db
    .select()
    .from(vendorProfiles)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      desc(vendorProfiles.isFeatured),
      desc(vendorProfiles.averageRating),
      desc(vendorProfiles.reviewCount)
    )
    .limit(options.limit ?? 10);

  return query;
}

/**
 * Find vendor in directory by name (for AI to match user input)
 */
export async function findVendorInDirectory(
  name: string,
  category?: string
): Promise<VendorProfile | null> {
  const conditions = [ilike(vendorProfiles.name, `%${name}%`)];

  if (category) {
    conditions.push(ilike(vendorProfiles.category, category));
  }

  const results = await db
    .select()
    .from(vendorProfiles)
    .where(and(...conditions))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Save vendor from directory to my list with initial status
 */
export async function saveVendorFromDirectory(
  tenantId: string,
  vendorId: string,
  options?: {
    status?: string;
    notes?: string;
    price?: number;
  }
) {
  const [saved] = await db
    .insert(vendorSaves)
    .values({
      tenantId,
      vendorId,
      status: options?.status ?? "saved",
      notes: options?.notes,
      price: options?.price,
    })
    .onConflictDoUpdate({
      target: [vendorSaves.tenantId, vendorSaves.vendorId],
      set: {
        status: options?.status ?? "saved",
        notes: options?.notes,
        price: options?.price,
      },
    })
    .returning();

  // Increment save count on vendor profile
  await db
    .update(vendorProfiles)
    .set({
      saveCount: sql`COALESCE(${vendorProfiles.saveCount}, 0) + 1`,
    })
    .where(eq(vendorProfiles.id, vendorId));

  return saved;
}

// =============================================================================
// PUBLIC VENDOR QUERIES (for SEO - no authentication required)
// =============================================================================

/**
 * Get all vendor slugs for sitemap/static generation
 */
export async function getAllVendorSlugs(): Promise<string[]> {
  const vendors = await db
    .select({ slug: vendorProfiles.slug })
    .from(vendorProfiles)
    .orderBy(vendorProfiles.slug);

  return vendors.map((v) => v.slug);
}

/**
 * Get public vendor by slug (no auth required)
 */
export async function getPublicVendorBySlug(slug: string) {
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.slug, slug),
  });

  if (!vendor) return null;

  // Get reviews for this vendor
  const reviews = await db.query.vendorReviews.findMany({
    where: and(
      eq(vendorReviews.vendorId, vendor.id),
      eq(vendorReviews.isHidden, false)
    ),
    with: {
      tenant: {
        columns: { id: true, displayName: true, profileImage: true },
      },
    },
    orderBy: [desc(vendorReviews.createdAt)],
    limit: 5,
  });

  return {
    ...vendor,
    reviews,
  };
}

/**
 * Get public vendors with filters (no auth required)
 */
export async function getPublicVendors(options: {
  category?: string;
  state?: string;
  city?: string;
  priceRange?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: "featured" | "rating" | "reviews" | "saves" | "newest";
}) {
  const conditions = [];

  if (options.category) {
    conditions.push(eq(vendorProfiles.category, options.category));
  }
  if (options.state) {
    conditions.push(eq(vendorProfiles.state, options.state));
  }
  if (options.city) {
    conditions.push(ilike(vendorProfiles.city, `%${options.city}%`));
  }
  if (options.priceRange) {
    conditions.push(eq(vendorProfiles.priceRange, options.priceRange));
  }
  if (options.search) {
    conditions.push(
      or(
        ilike(vendorProfiles.name, `%${options.search}%`),
        ilike(vendorProfiles.description, `%${options.search}%`),
        ilike(vendorProfiles.city, `%${options.search}%`)
      )
    );
  }

  let orderBy;
  switch (options.sortBy) {
    case "rating":
      orderBy = [desc(vendorProfiles.averageRating), desc(vendorProfiles.reviewCount)];
      break;
    case "reviews":
      orderBy = [desc(vendorProfiles.reviewCount)];
      break;
    case "saves":
      orderBy = [desc(vendorProfiles.saveCount)];
      break;
    case "newest":
      orderBy = [desc(vendorProfiles.createdAt)];
      break;
    case "featured":
    default:
      orderBy = [desc(vendorProfiles.isFeatured), desc(vendorProfiles.averageRating), desc(vendorProfiles.saveCount)];
  }

  const vendors = await db.query.vendorProfiles.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy,
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
  });

  return vendors;
}

/**
 * Get vendor count for SEO pages
 */
export async function getVendorCount(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(vendorProfiles);
  return Number(result[0]?.count ?? 0);
}

// =============================================================================
// FOLLOWER SUGGESTIONS
// =============================================================================

interface SuggestionCandidate {
  tenantId: string;
  displayName: string;
  profileImage: string | null;
  weddingDate: Date | null;
  bio: string | null;
  score: number;
  reason: string;
}

/**
 * Get follower suggestions for a tenant
 * Scoring algorithm:
 * - Mutual follows: +30 points per mutual connection
 * - Similar wedding date (within 3 months): +25 points
 * - Same region: +20 points
 * - Matching vibe/style: +15 points per match
 * - Similar budget: +10 points
 */
export async function getFollowerSuggestions(
  tenantId: string,
  limit: number = 10
): Promise<SuggestionCandidate[]> {
  // Get the current user's kernel for matching
  const currentKernel = await db.query.weddingKernels.findFirst({
    where: eq(weddingKernels.tenantId, tenantId),
  });

  // Get who the user already follows
  const existingFollows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, tenantId));

  const followingIds = new Set(existingFollows.map((f) => f.followingId));
  followingIds.add(tenantId); // Exclude self

  // Get blocked users (both directions)
  const blockedRelations = await db
    .select({
      blockerTenantId: userBlocks.blockerTenantId,
      blockedTenantId: userBlocks.blockedTenantId,
    })
    .from(userBlocks)
    .where(
      or(
        eq(userBlocks.blockerTenantId, tenantId),
        eq(userBlocks.blockedTenantId, tenantId)
      )
    );

  const blockedIds = new Set<string>();
  blockedRelations.forEach((b) => {
    blockedIds.add(b.blockerTenantId);
    blockedIds.add(b.blockedTenantId);
  });

  // Get followers of people the user follows (mutual connections)
  const mutualCandidates = await db
    .select({
      tenantId: follows.followerId,
      mutualCount: sql<number>`count(*)::int`,
    })
    .from(follows)
    .where(
      and(
        inArray(follows.followingId, Array.from(followingIds)),
        not(inArray(follows.followerId, [...Array.from(followingIds), ...Array.from(blockedIds)]))
      )
    )
    .groupBy(follows.followerId)
    .orderBy(desc(sql`count(*)`))
    .limit(50);

  // Get all public tenants with profiles (fallback candidates)
  const allCandidates = await db
    .select({
      id: tenants.id,
      displayName: tenants.displayName,
      profileImage: tenants.profileImage,
      weddingDate: tenants.weddingDate,
      bio: tenants.bio,
      profileVisibility: tenants.profileVisibility,
    })
    .from(tenants)
    .where(
      and(
        eq(tenants.profileVisibility, "public"),
        not(inArray(tenants.id, [...Array.from(followingIds), ...Array.from(blockedIds)])),
        sql`${tenants.displayName} != ''`
      )
    )
    .limit(100);

  // Get kernels for candidates for matching
  const candidateIds = allCandidates.map((c) => c.id);
  const candidateKernels = await db
    .select()
    .from(weddingKernels)
    .where(inArray(weddingKernels.tenantId, candidateIds));

  const kernelMap = new Map(candidateKernels.map((k) => [k.tenantId, k]));
  const mutualCountMap = new Map(mutualCandidates.map((m) => [m.tenantId, m.mutualCount]));

  // Score each candidate
  const scoredCandidates: SuggestionCandidate[] = allCandidates.map((candidate) => {
    let score = 0;
    const reasons: string[] = [];

    // Mutual connections score
    const mutualCount = mutualCountMap.get(candidate.id) || 0;
    if (mutualCount > 0) {
      score += mutualCount * 30;
      reasons.push(`${mutualCount} mutual connection${mutualCount > 1 ? "s" : ""}`);
    }

    const candidateKernel = kernelMap.get(candidate.id);

    if (currentKernel && candidateKernel) {
      // Similar wedding date (within 3 months)
      if (currentKernel.weddingDate && candidateKernel.weddingDate) {
        const diffMs = Math.abs(
          new Date(currentKernel.weddingDate).getTime() -
            new Date(candidateKernel.weddingDate).getTime()
        );
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays <= 90) {
          score += 25;
          reasons.push("Similar wedding date");
        }
      }

      // Same region
      if (
        currentKernel.region &&
        candidateKernel.region &&
        currentKernel.region.toLowerCase() === candidateKernel.region.toLowerCase()
      ) {
        score += 20;
        reasons.push("Same region");
      }

      // Matching vibe
      const currentVibe = (currentKernel.vibe as string[]) || [];
      const candidateVibe = (candidateKernel.vibe as string[]) || [];
      const matchingVibes = currentVibe.filter((v) =>
        candidateVibe.some((cv) => cv.toLowerCase() === v.toLowerCase())
      );
      if (matchingVibes.length > 0) {
        score += matchingVibes.length * 15;
        reasons.push(`Similar style: ${matchingVibes.slice(0, 2).join(", ")}`);
      }

      // Similar budget range
      if (
        currentKernel.budgetRange &&
        candidateKernel.budgetRange &&
        currentKernel.budgetRange === candidateKernel.budgetRange
      ) {
        score += 10;
        reasons.push("Similar budget");
      }
    }

    // Boost for having a profile image
    if (candidate.profileImage) {
      score += 5;
    }

    // Boost for having a bio
    if (candidate.bio) {
      score += 5;
    }

    return {
      tenantId: candidate.id,
      displayName: candidate.displayName,
      profileImage: candidate.profileImage,
      weddingDate: candidate.weddingDate,
      bio: candidate.bio,
      score,
      reason: reasons.length > 0 ? reasons[0] : "Planning a wedding too",
    };
  });

  // Sort by score and return top suggestions
  return scoredCandidates
    .filter((c) => c.score > 0 || c.displayName) // Only show scored candidates or those with names
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// =============================================================================
// TRENDING CONTENT
// =============================================================================

import { trendingSnapshots } from "@/lib/db/schema";

interface TrendingBoard {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  tenantName: string;
  tenantImage: string | null;
  ideaCount: number;
  coverImages: string[];
  reactionCount: number;
  viewCount: number;
  trendScore: number;
}

interface TrendingIdea {
  id: string;
  title: string | null;
  imageUrl: string;
  boardId: string;
  boardName: string;
  tenantId: string;
  tenantName: string;
  reactionCount: number;
  saveCount: number;
  trendScore: number;
}

/**
 * Compute trending boards based on recent engagement
 */
export async function computeTrendingBoards(region?: string): Promise<TrendingBoard[]> {
  // Get boards with recent engagement (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingBoards = await db
    .select({
      id: boards.id,
      name: boards.name,
      description: boards.description,
      tenantId: boards.tenantId,
      reactionCount: boards.reactionCount,
      viewCount: boards.viewCount,
      saveTrendScore: boards.saveTrendScore,
      reactionTrendScore: boards.reactionTrendScore,
    })
    .from(boards)
    .where(
      and(
        eq(boards.isPublic, true),
        sql`${boards.updatedAt} > ${sevenDaysAgo}`
      )
    )
    .orderBy(
      desc(sql`${boards.reactionTrendScore} + ${boards.saveTrendScore} + (${boards.viewCount} * 0.1)`)
    )
    .limit(20);

  // Enrich with tenant info and ideas
  const enrichedBoards: TrendingBoard[] = [];
  for (const board of trendingBoards) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, board.tenantId),
      columns: { displayName: true, profileImage: true },
    });

    const boardIdeas = await db.query.ideas.findMany({
      where: eq(ideas.boardId, board.id),
      columns: { id: true, imageUrl: true },
      limit: 4,
    });

    enrichedBoards.push({
      id: board.id,
      name: board.name,
      description: board.description,
      tenantId: board.tenantId,
      tenantName: tenant?.displayName || "Unknown",
      tenantImage: tenant?.profileImage || null,
      ideaCount: boardIdeas.length,
      coverImages: boardIdeas.map((i) => i.imageUrl),
      reactionCount: board.reactionCount,
      viewCount: board.viewCount,
      trendScore: board.reactionTrendScore + board.saveTrendScore,
    });
  }

  return enrichedBoards;
}

/**
 * Compute trending ideas based on recent engagement
 */
export async function computeTrendingIdeas(region?: string): Promise<TrendingIdea[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingIdeas = await db
    .select({
      id: ideas.id,
      title: ideas.title,
      imageUrl: ideas.imageUrl,
      boardId: ideas.boardId,
      reactionCount: ideas.reactionCount,
      saveCount: ideas.saveCount,
      saveTrendScore: ideas.saveTrendScore,
      reactionTrendScore: ideas.reactionTrendScore,
    })
    .from(ideas)
    .innerJoin(boards, eq(ideas.boardId, boards.id))
    .where(
      and(
        eq(boards.isPublic, true),
        sql`${ideas.createdAt} > ${sevenDaysAgo}`
      )
    )
    .orderBy(
      desc(sql`${ideas.reactionTrendScore} + ${ideas.saveTrendScore}`)
    )
    .limit(30);

  // Enrich with board and tenant info
  const enrichedIdeas: TrendingIdea[] = [];
  for (const idea of trendingIdeas) {
    const board = await db.query.boards.findFirst({
      where: eq(boards.id, idea.boardId),
      with: {
        tenant: {
          columns: { id: true, displayName: true },
        },
      },
    });

    if (board) {
      enrichedIdeas.push({
        id: idea.id,
        title: idea.title,
        imageUrl: idea.imageUrl,
        boardId: idea.boardId,
        boardName: board.name,
        tenantId: board.tenantId,
        tenantName: board.tenant?.displayName || "Unknown",
        reactionCount: idea.reactionCount,
        saveCount: idea.saveCount,
        trendScore: idea.reactionTrendScore + idea.saveTrendScore,
      });
    }
  }

  return enrichedIdeas;
}

/**
 * Get or compute trending content (cached)
 */
export async function getTrendingContent(
  type: "boards" | "ideas",
  region?: string
): Promise<TrendingBoard[] | TrendingIdea[]> {
  // Check for cached snapshot
  const cached = await db.query.trendingSnapshots.findFirst({
    where: and(
      eq(trendingSnapshots.type, type),
      region
        ? eq(trendingSnapshots.region, region)
        : sql`${trendingSnapshots.region} IS NULL`,
      sql`${trendingSnapshots.expiresAt} > NOW()`
    ),
  });

  if (cached) {
    return cached.data as TrendingBoard[] | TrendingIdea[];
  }

  // Compute fresh trending content
  const data =
    type === "boards"
      ? await computeTrendingBoards(region)
      : await computeTrendingIdeas(region);

  // Cache for 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Upsert the snapshot
  await db
    .insert(trendingSnapshots)
    .values({
      type,
      region: region || null,
      data,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [trendingSnapshots.type, trendingSnapshots.region],
      set: {
        data,
        computedAt: new Date(),
        expiresAt,
      },
    });

  return data;
}

/**
 * Update trend scores when engagement happens
 * Uses time-decay: recent engagement counts more
 */
export async function updateTrendScore(
  targetType: "board" | "idea",
  targetId: string,
  engagementType: "reaction" | "save" | "view"
): Promise<void> {
  // Points per engagement type
  const points = {
    reaction: 10,
    save: 15,
    view: 1,
  };

  const pointsToAdd = points[engagementType];

  if (targetType === "board") {
    const scoreField =
      engagementType === "reaction" ? "reactionTrendScore" : "saveTrendScore";
    await db
      .update(boards)
      .set({
        [scoreField]: sql`${boards[scoreField as keyof typeof boards]} + ${pointsToAdd}`,
        lastTrendUpdate: new Date(),
      })
      .where(eq(boards.id, targetId));
  } else {
    const scoreField =
      engagementType === "reaction" ? "reactionTrendScore" : "saveTrendScore";
    await db
      .update(ideas)
      .set({
        [scoreField]: sql`${ideas[scoreField as keyof typeof ideas]} + ${pointsToAdd}`,
        lastTrendUpdate: new Date(),
      })
      .where(eq(ideas.id, targetId));
  }
}

/**
 * Decay trend scores (run periodically, e.g., daily cron job)
 */
export async function decayTrendScores(): Promise<void> {
  const decayFactor = 0.9; // 10% decay per day

  await db
    .update(boards)
    .set({
      saveTrendScore: sql`FLOOR(${boards.saveTrendScore} * ${decayFactor})`,
      reactionTrendScore: sql`FLOOR(${boards.reactionTrendScore} * ${decayFactor})`,
    })
    .where(sql`${boards.saveTrendScore} > 0 OR ${boards.reactionTrendScore} > 0`);

  await db
    .update(ideas)
    .set({
      saveTrendScore: sql`FLOOR(${ideas.saveTrendScore} * ${decayFactor})`,
      reactionTrendScore: sql`FLOOR(${ideas.reactionTrendScore} * ${decayFactor})`,
    })
    .where(sql`${ideas.saveTrendScore} > 0 OR ${ideas.reactionTrendScore} > 0`);
}

// =============================================================================
// ENHANCED EXPLORE
// =============================================================================

export type BoardCategory =
  | "all"
  | "venues"
  | "dresses"
  | "decor"
  | "flowers"
  | "cakes"
  | "photography"
  | "invitations"
  | "rings"
  | "hair-makeup";

export type ExploreSortOption = "trending" | "recent" | "popular";

interface ExploreOptions {
  category?: BoardCategory;
  sortBy?: ExploreSortOption;
  region?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get explore feed with filtering and sorting
 */
export async function getExploreFeed(options: ExploreOptions = {}): Promise<{
  boards: Array<{
    id: string;
    name: string;
    description: string | null;
    tenantId: string;
    tenantName: string;
    tenantImage: string | null;
    ideaCount: number;
    coverImages: string[];
    reactionCount: number;
    viewCount: number;
  }>;
  hasMore: boolean;
}> {
  const { category = "all", sortBy = "trending", limit = 20, offset = 0 } = options;

  // Build category filter if needed
  const categoryKeywords: Record<BoardCategory, string[]> = {
    all: [],
    venues: ["venue", "location", "ceremony", "reception"],
    dresses: ["dress", "gown", "bridal", "attire"],
    decor: ["decor", "decoration", "centerpiece", "table"],
    flowers: ["flower", "bouquet", "floral", "bloom"],
    cakes: ["cake", "dessert", "sweet", "bakery"],
    photography: ["photo", "photography", "photographer"],
    invitations: ["invitation", "stationery", "paper", "invite"],
    rings: ["ring", "jewelry", "band", "engagement"],
    "hair-makeup": ["hair", "makeup", "beauty", "bridal look"],
  };

  const keywords = categoryKeywords[category];

  // Build query conditions
  const conditions = [eq(boards.isPublic, true)];

  if (keywords.length > 0) {
    // Filter by board name or description containing category keywords
    const keywordConditions = keywords.map((kw) =>
      or(
        ilike(boards.name, `%${kw}%`),
        ilike(boards.description, `%${kw}%`)
      )
    );
    conditions.push(or(...keywordConditions)!);
  }

  // Build order by
  let orderByClause;
  switch (sortBy) {
    case "trending":
      orderByClause = [
        desc(sql`${boards.reactionTrendScore} + ${boards.saveTrendScore}`),
        desc(boards.viewCount),
      ];
      break;
    case "recent":
      orderByClause = [desc(boards.createdAt)];
      break;
    case "popular":
      orderByClause = [desc(boards.reactionCount), desc(boards.viewCount)];
      break;
  }

  const boardsData = await db.query.boards.findMany({
    where: and(...conditions),
    with: {
      tenant: {
        columns: { id: true, displayName: true, profileImage: true },
      },
      ideas: {
        columns: { id: true, imageUrl: true },
        orderBy: [desc(ideas.createdAt)],
      },
    },
    orderBy: orderByClause,
    limit: limit + 1, // Get one extra to check for more
    offset,
  });

  const hasMore = boardsData.length > limit;
  const resultBoards = hasMore ? boardsData.slice(0, limit) : boardsData;

  return {
    boards: resultBoards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      tenantId: board.tenantId,
      tenantName: board.tenant?.displayName || "Unknown",
      tenantImage: board.tenant?.profileImage || null,
      ideaCount: board.ideas.length,
      coverImages: board.ideas.slice(0, 4).map((i) => i.imageUrl),
      reactionCount: board.reactionCount,
      viewCount: board.viewCount,
    })),
    hasMore,
  };
}

// =============================================================================
// VENDOR SOCIAL - Follows, Posts, Showcases
// =============================================================================

/**
 * Follow a vendor
 */
export async function followVendor(tenantId: string, vendorId: string) {
  // Check if already following
  const existing = await db.query.vendorFollows.findFirst({
    where: and(
      eq(vendorFollows.tenantId, tenantId),
      eq(vendorFollows.vendorId, vendorId)
    ),
  });

  if (existing) {
    return { alreadyFollowing: true };
  }

  // Create follow
  const [follow] = await db
    .insert(vendorFollows)
    .values({ tenantId, vendorId })
    .returning();

  // Update vendor follower count
  await db
    .update(vendorProfiles)
    .set({ followerCount: sql`${vendorProfiles.followerCount} + 1` })
    .where(eq(vendorProfiles.id, vendorId));

  // Get vendor info for activity
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, vendorId),
    columns: { name: true, slug: true },
  });

  // Create activity
  await createActivity({
    actorTenantId: tenantId,
    type: "vendor_followed",
    targetType: "vendor",
    targetId: vendorId,
    metadata: {
      vendorName: vendor?.name,
      vendorSlug: vendor?.slug,
    },
  });

  return { follow, alreadyFollowing: false };
}

/**
 * Unfollow a vendor
 */
export async function unfollowVendor(tenantId: string, vendorId: string) {
  const deleted = await db
    .delete(vendorFollows)
    .where(
      and(
        eq(vendorFollows.tenantId, tenantId),
        eq(vendorFollows.vendorId, vendorId)
      )
    )
    .returning();

  if (deleted.length > 0) {
    // Update vendor follower count
    await db
      .update(vendorProfiles)
      .set({ followerCount: sql`GREATEST(${vendorProfiles.followerCount} - 1, 0)` })
      .where(eq(vendorProfiles.id, vendorId));
  }

  return { unfollowed: deleted.length > 0 };
}

/**
 * Check if user is following a vendor
 */
export async function isFollowingVendor(tenantId: string, vendorId: string): Promise<boolean> {
  const follow = await db.query.vendorFollows.findFirst({
    where: and(
      eq(vendorFollows.tenantId, tenantId),
      eq(vendorFollows.vendorId, vendorId)
    ),
  });

  return !!follow;
}

/**
 * Get vendors a user is following
 */
export async function getFollowedVendors(tenantId: string, limit = 20, offset = 0) {
  const followedVendors = await db.query.vendorFollows.findMany({
    where: eq(vendorFollows.tenantId, tenantId),
    with: {
      vendor: true,
    },
    orderBy: [desc(vendorFollows.createdAt)],
    limit,
    offset,
  });

  return followedVendors.map((f) => ({
    ...f.vendor,
    followedAt: f.createdAt,
  }));
}

/**
 * Get followers of a vendor
 */
export async function getVendorFollowers(vendorId: string, limit = 20, offset = 0) {
  const followers = await db.query.vendorFollows.findMany({
    where: eq(vendorFollows.vendorId, vendorId),
    with: {
      tenant: {
        columns: { id: true, displayName: true, profileImage: true, slug: true },
      },
    },
    orderBy: [desc(vendorFollows.createdAt)],
    limit,
    offset,
  });

  return followers.map((f) => ({
    ...f.tenant,
    followedAt: f.createdAt,
  }));
}

// =============================================================================
// VENDOR POSTS
// =============================================================================

export type VendorPostType = "update" | "portfolio" | "special_offer" | "tip";

/**
 * Create a vendor post
 */
export async function createVendorPost(data: {
  vendorId: string;
  authorTenantId: string;
  type: VendorPostType;
  title?: string;
  content: string;
  images?: string[];
}) {
  // Verify the author owns the vendor
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, data.vendorId),
    columns: { claimedByTenantId: true, name: true, slug: true },
  });

  if (!vendor || vendor.claimedByTenantId !== data.authorTenantId) {
    throw new Error("Only the vendor owner can create posts");
  }

  const [post] = await db
    .insert(vendorPosts)
    .values({
      vendorId: data.vendorId,
      authorTenantId: data.authorTenantId,
      type: data.type,
      title: data.title,
      content: data.content,
      images: data.images ?? [],
    })
    .returning();

  // Update vendor post count
  await db
    .update(vendorProfiles)
    .set({ postCount: sql`${vendorProfiles.postCount} + 1` })
    .where(eq(vendorProfiles.id, data.vendorId));

  // Create activity for followers
  await createActivity({
    actorTenantId: data.authorTenantId,
    type: "vendor_post",
    targetType: "vendor_post",
    targetId: post.id,
    metadata: {
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      postType: data.type,
      postTitle: data.title,
    },
  });

  return post;
}

/**
 * Get vendor posts
 */
export async function getVendorPosts(
  vendorId: string,
  options: { limit?: number; offset?: number; type?: VendorPostType } = {}
) {
  const conditions = [
    eq(vendorPosts.vendorId, vendorId),
    eq(vendorPosts.isPublished, true),
  ];

  if (options.type) {
    conditions.push(eq(vendorPosts.type, options.type));
  }

  const posts = await db.query.vendorPosts.findMany({
    where: and(...conditions),
    with: {
      vendor: {
        columns: { name: true, slug: true, profileImage: true },
      },
      author: {
        columns: { displayName: true, profileImage: true },
      },
    },
    orderBy: [desc(vendorPosts.createdAt)],
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });

  return posts;
}

/**
 * Get single vendor post by ID
 */
export async function getVendorPostById(postId: string) {
  return db.query.vendorPosts.findFirst({
    where: eq(vendorPosts.id, postId),
    with: {
      vendor: {
        columns: { id: true, name: true, slug: true, profileImage: true },
      },
      author: {
        columns: { displayName: true, profileImage: true },
      },
    },
  });
}

/**
 * Update a vendor post
 */
export async function updateVendorPost(
  postId: string,
  tenantId: string,
  data: { title?: string; content?: string; images?: string[]; type?: VendorPostType }
) {
  const post = await db.query.vendorPosts.findFirst({
    where: eq(vendorPosts.id, postId),
  });

  if (!post || post.authorTenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  const [updated] = await db
    .update(vendorPosts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vendorPosts.id, postId))
    .returning();

  return updated;
}

/**
 * Delete a vendor post
 */
export async function deleteVendorPost(postId: string, tenantId: string) {
  const post = await db.query.vendorPosts.findFirst({
    where: eq(vendorPosts.id, postId),
  });

  if (!post || post.authorTenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  await db.delete(vendorPosts).where(eq(vendorPosts.id, postId));

  // Update vendor post count
  await db
    .update(vendorProfiles)
    .set({ postCount: sql`GREATEST(${vendorProfiles.postCount} - 1, 0)` })
    .where(eq(vendorProfiles.id, post.vendorId));
}

/**
 * Get posts from vendors a user follows
 */
export async function getFollowedVendorPosts(tenantId: string, limit = 20, offset = 0) {
  // Get IDs of vendors the user follows
  const followedVendorIds = await db
    .select({ vendorId: vendorFollows.vendorId })
    .from(vendorFollows)
    .where(eq(vendorFollows.tenantId, tenantId));

  if (followedVendorIds.length === 0) {
    return [];
  }

  const vendorIds = followedVendorIds.map((f) => f.vendorId);

  const posts = await db.query.vendorPosts.findMany({
    where: and(
      inArray(vendorPosts.vendorId, vendorIds),
      eq(vendorPosts.isPublished, true)
    ),
    with: {
      vendor: {
        columns: { id: true, name: true, slug: true, profileImage: true },
      },
      author: {
        columns: { displayName: true, profileImage: true },
      },
    },
    orderBy: [desc(vendorPosts.createdAt)],
    limit,
    offset,
  });

  return posts;
}

// =============================================================================
// WEDDING SHOWCASES
// =============================================================================

/**
 * Create a wedding showcase
 */
export async function createWeddingShowcase(data: {
  vendorId: string;
  authorTenantId: string;
  title: string;
  description?: string;
  weddingDate?: Date;
  location?: string;
  images: string[];
  featuredImage?: string;
  vendorList?: Array<{ vendorId?: string; role: string; name: string }>;
  coupleTenantId?: string;
}) {
  // Verify the author owns the vendor
  const vendor = await db.query.vendorProfiles.findFirst({
    where: eq(vendorProfiles.id, data.vendorId),
    columns: { claimedByTenantId: true, name: true, slug: true },
  });

  if (!vendor || vendor.claimedByTenantId !== data.authorTenantId) {
    throw new Error("Only the vendor owner can create showcases");
  }

  const [showcase] = await db
    .insert(weddingShowcases)
    .values({
      vendorId: data.vendorId,
      authorTenantId: data.authorTenantId,
      title: data.title,
      description: data.description,
      weddingDate: data.weddingDate,
      location: data.location,
      images: data.images,
      featuredImage: data.featuredImage ?? data.images[0],
      vendorList: data.vendorList ?? [],
      coupleTenantId: data.coupleTenantId,
      // If couple is tagged, they need to approve
      coupleApproved: !data.coupleTenantId,
    })
    .returning();

  // Update vendor showcase count
  await db
    .update(vendorProfiles)
    .set({ showcaseCount: sql`${vendorProfiles.showcaseCount} + 1` })
    .where(eq(vendorProfiles.id, data.vendorId));

  // Create activity
  await createActivity({
    actorTenantId: data.authorTenantId,
    type: "showcase_created",
    targetType: "showcase",
    targetId: showcase.id,
    metadata: {
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      showcaseTitle: data.title,
    },
  });

  return showcase;
}

/**
 * Get wedding showcases
 */
export async function getWeddingShowcases(
  options: {
    vendorId?: string;
    limit?: number;
    offset?: number;
    featured?: boolean;
  } = {}
) {
  const conditions = [eq(weddingShowcases.isPublished, true)];

  if (options.vendorId) {
    conditions.push(eq(weddingShowcases.vendorId, options.vendorId));
  }

  if (options.featured) {
    conditions.push(eq(weddingShowcases.isFeatured, true));
  }

  const showcases = await db.query.weddingShowcases.findMany({
    where: and(...conditions),
    with: {
      vendor: {
        columns: { id: true, name: true, slug: true, profileImage: true, category: true },
      },
      author: {
        columns: { displayName: true, profileImage: true },
      },
      couple: {
        columns: { id: true, displayName: true, profileImage: true },
      },
    },
    orderBy: [desc(weddingShowcases.createdAt)],
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
  });

  return showcases;
}

/**
 * Get single showcase by ID
 */
export async function getWeddingShowcaseById(showcaseId: string) {
  const showcase = await db.query.weddingShowcases.findFirst({
    where: eq(weddingShowcases.id, showcaseId),
    with: {
      vendor: {
        columns: { id: true, name: true, slug: true, profileImage: true, category: true },
      },
      author: {
        columns: { displayName: true, profileImage: true },
      },
      couple: {
        columns: { id: true, displayName: true, profileImage: true },
      },
    },
  });

  if (showcase) {
    // Increment view count
    await db
      .update(weddingShowcases)
      .set({ viewCount: sql`${weddingShowcases.viewCount} + 1` })
      .where(eq(weddingShowcases.id, showcaseId));
  }

  return showcase;
}

/**
 * Update a wedding showcase
 */
export async function updateWeddingShowcase(
  showcaseId: string,
  tenantId: string,
  data: {
    title?: string;
    description?: string;
    weddingDate?: Date;
    location?: string;
    images?: string[];
    featuredImage?: string;
    vendorList?: Array<{ vendorId?: string; role: string; name: string }>;
  }
) {
  const showcase = await db.query.weddingShowcases.findFirst({
    where: eq(weddingShowcases.id, showcaseId),
  });

  if (!showcase || showcase.authorTenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  const [updated] = await db
    .update(weddingShowcases)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(weddingShowcases.id, showcaseId))
    .returning();

  return updated;
}

/**
 * Delete a wedding showcase
 */
export async function deleteWeddingShowcase(showcaseId: string, tenantId: string) {
  const showcase = await db.query.weddingShowcases.findFirst({
    where: eq(weddingShowcases.id, showcaseId),
  });

  if (!showcase || showcase.authorTenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  await db.delete(weddingShowcases).where(eq(weddingShowcases.id, showcaseId));

  // Update vendor showcase count
  await db
    .update(vendorProfiles)
    .set({ showcaseCount: sql`GREATEST(${vendorProfiles.showcaseCount} - 1, 0)` })
    .where(eq(vendorProfiles.id, showcase.vendorId));
}

/**
 * Couple approves their tagging in a showcase
 */
export async function approveShowcaseTagging(showcaseId: string, tenantId: string) {
  const showcase = await db.query.weddingShowcases.findFirst({
    where: eq(weddingShowcases.id, showcaseId),
  });

  if (!showcase || showcase.coupleTenantId !== tenantId) {
    throw new Error("Unauthorized");
  }

  const [updated] = await db
    .update(weddingShowcases)
    .set({ coupleApproved: true })
    .where(eq(weddingShowcases.id, showcaseId))
    .returning();

  return updated;
}

/**
 * Get showcases where user is tagged (for approval)
 */
export async function getShowcasesAwaitingApproval(tenantId: string) {
  return db.query.weddingShowcases.findMany({
    where: and(
      eq(weddingShowcases.coupleTenantId, tenantId),
      eq(weddingShowcases.coupleApproved, false)
    ),
    with: {
      vendor: {
        columns: { id: true, name: true, slug: true, profileImage: true },
      },
    },
    orderBy: [desc(weddingShowcases.createdAt)],
  });
}

/**
 * React to a vendor post
 */
export async function reactToVendorPost(postId: string, tenantId: string) {
  // Check for existing reaction
  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.tenantId, tenantId),
      eq(reactions.targetType, "vendor_post"),
      eq(reactions.targetId, postId)
    ),
  });

  if (existing) {
    // Remove reaction
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    await db
      .update(vendorPosts)
      .set({ reactionCount: sql`GREATEST(${vendorPosts.reactionCount} - 1, 0)` })
      .where(eq(vendorPosts.id, postId));
    return { reacted: false };
  }

  // Add reaction
  await db.insert(reactions).values({
    tenantId,
    targetType: "vendor_post",
    targetId: postId,
    type: "like",
  });

  await db
    .update(vendorPosts)
    .set({ reactionCount: sql`${vendorPosts.reactionCount} + 1` })
    .where(eq(vendorPosts.id, postId));

  return { reacted: true };
}

/**
 * React to a showcase
 */
export async function reactToShowcase(showcaseId: string, tenantId: string) {
  // Check for existing reaction
  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.tenantId, tenantId),
      eq(reactions.targetType, "showcase"),
      eq(reactions.targetId, showcaseId)
    ),
  });

  if (existing) {
    // Remove reaction
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    await db
      .update(weddingShowcases)
      .set({ reactionCount: sql`GREATEST(${weddingShowcases.reactionCount} - 1, 0)` })
      .where(eq(weddingShowcases.id, showcaseId));
    return { reacted: false };
  }

  // Add reaction
  await db.insert(reactions).values({
    tenantId,
    targetType: "showcase",
    targetId: showcaseId,
    type: "like",
  });

  await db
    .update(weddingShowcases)
    .set({ reactionCount: sql`${weddingShowcases.reactionCount} + 1` })
    .where(eq(weddingShowcases.id, showcaseId));

  return { reacted: true };
}

/**
 * Check if user has reacted to a post or showcase
 */
export async function hasReacted(
  tenantId: string,
  targetType: "vendor_post" | "showcase",
  targetId: string
): Promise<boolean> {
  const reaction = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.tenantId, tenantId),
      eq(reactions.targetType, targetType),
      eq(reactions.targetId, targetId)
    ),
  });

  return !!reaction;
}
