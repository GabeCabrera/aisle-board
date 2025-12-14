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
  boardArticles,
  userBlocks,
  weddingKernels,
} from "@/lib/db/schema";
import { eq, and, desc, or, inArray, not, sql, ilike, asc } from "drizzle-orm";

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
