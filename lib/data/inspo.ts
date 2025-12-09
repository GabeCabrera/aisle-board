import { db } from "@/lib/db";
import { boards, ideas, users, tenants, follows } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function getBoard(boardId: string) {
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
    with: {
      tenant: {
        columns: { displayName: true } // Explicitly select displayName
      }
    }
  });

  if (!board) return null;

  const fetchedIdeas = await db.query.ideas.findMany({
    where: eq(ideas.boardId, boardId),
    orderBy: [desc(ideas.createdAt)],
  });

  return {
    ...board,
    ideas: fetchedIdeas // Alias sparks as ideas
  };
}

export async function getPublicBoards() {
  const boardsData = await db.query.boards.findMany({
    where: eq(boards.isPublic, true),
    with: {
      tenant: {
        columns: { displayName: true } // Explicitly select displayName
      }
    },
    orderBy: [desc(boards.updatedAt)],
    limit: 50
  });

  return boardsData;
}

export async function getMyBoards(tenantId: string) {
  const myBoards = await db.query.boards.findMany({
    where: eq(boards.tenantId, tenantId),
    with: {
      ideas: { // Changed from sparks to ideas
        columns: { id: true } // Just count them
      },
      tenant: {
        columns: { displayName: true } // Explicitly select displayName
      }
    },
    orderBy: [desc(boards.updatedAt)],
  });

  return myBoards.map(board => ({
    ...board,
    ideaCount: board.ideas.length, // Changed from sparks.length
    tenantName: board.tenant?.displayName || "Unknown" // Add tenantName for frontend
  }));
}

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
    }
  });

  if (!tenant) return null;

  const publicBoards = await db.query.boards.findMany({
    where: and(
      eq(boards.tenantId, tenantId),
      eq(boards.isPublic, true)
    ),
    with: {
      ideas: {
        columns: { imageUrl: true },
        limit: 4, // Get preview images
        orderBy: [desc(ideas.createdAt)]
      },
      tenant: {
        columns: { displayName: true }
      }
    },
    orderBy: [desc(boards.updatedAt)]
  });

  const stats = await getSocialStats(tenantId);
  const isFollowing = viewerTenantId ? await getFollowStatus(viewerTenantId, tenantId) : false;

  return {
    ...tenant,
    boards: publicBoards,
    stats,
    isFollowing
  };
}


export async function getFollowStatus(followerId: string, followingId: string) {
  const follow = await db.query.follows.findFirst({
    where: and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    )
  });
  return !!follow;
}

export async function followTenant(followerId: string, followingId: string) {
  if (followerId === followingId) return; // Cannot follow self
  
  await db.insert(follows)
    .values({ followerId, followingId })
    .onConflictDoNothing();
}

export async function unfollowTenant(followerId: string, followingId: string) {
  await db.delete(follows)
    .where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ));
}

export async function getSocialStats(tenantId: string) {
  // This is a simplified count. For scale, use count() query or aggregate table.
  const followers = await db.query.follows.findMany({
    where: eq(follows.followingId, tenantId),
    columns: { followerId: true }
  });
  
  const following = await db.query.follows.findMany({
    where: eq(follows.followerId, tenantId),
    columns: { followingId: true }
  });

  return {
    followersCount: followers.length,
    followingCount: following.length
  };
}