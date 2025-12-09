import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { boards, ideas, tenants } from "@/lib/db/schema"; // Updated imports
import { eq, and, ne, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Fetch public boards from OTHER tenants
    // We join with tenants to get the couple's name/display name
    const publicBoards = await db // Updated variable name
      .select({
        id: boards.id, // Updated table name
        name: boards.name, // Updated table name
        description: boards.description, // Updated table name
        isPublic: boards.isPublic, // Updated table name
        viewCount: boards.viewCount, // Updated table name
        tenantName: tenants.displayName,
        createdAt: boards.createdAt, // Updated table name
      })
      .from(boards) // Updated table name
      .leftJoin(tenants, eq(boards.tenantId, tenants.id)) // Updated table name
      .where(
        and(
          eq(boards.isPublic, true), // Updated table name
          ne(boards.tenantId, session.user.tenantId) // Updated table name
        )
      )
      .orderBy(desc(boards.viewCount), desc(boards.createdAt)) // Updated table name
      .limit(50); // Limit for now

    // Ideally we'd fetch preview images for each board too, but that's complex in one query without aggregate
    // For now, we can do a secondary fetch or just let the frontend handle loading details when clicked
    // OR, we fetch one idea image for each board to show as a cover
    
    const boardsWithCovers = await Promise.all( // Updated variable name
      publicBoards.map(async (b) => { // Updated variable name
        const [coverIdea] = await db // Updated variable name
          .select({ imageUrl: ideas.imageUrl }) // Updated table name
          .from(ideas) // Updated table name
          .where(eq(ideas.boardId, b.id)) // Updated table name and param
          .limit(1);
        
        return {
          ...b,
          coverImage: coverIdea?.imageUrl || null,
        };
      })
    );

    return NextResponse.json(boardsWithCovers); // Updated variable name
  } catch (error) {
    console.error("Failed to fetch explore boards:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}