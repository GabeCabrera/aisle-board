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
  boardArticles,
  userBlocks,
} from "@/lib/db/schema";
import { eq, and, desc, or, inArray, not, sql } from "drizzle-orm";

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
        columns: { displayName: true, profileImage: true },
      },
      ideas: {
        columns: { id: true, imageUrl: true },
        limit: 4,
        orderBy: [desc(ideas.createdAt)],
      },
    },
    orderBy: [desc(boards.updatedAt)],
    limit: 50,
  });

  return boardsData;
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

  await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();

  // Create activity
  await createActivity({
    actorTenantId: followerId,
    type: "followed_user",
    targetType: "tenant",
    targetId: followingId,
    isPublic: true,
  });
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
