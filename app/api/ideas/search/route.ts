import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ideas, boards } from "@/lib/db/schema";
import { eq, or, ilike, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const tagsParam = searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : [];

    let searchConditions = [];

    if (query) {
      searchConditions.push(
        or(
          ilike(ideas.title, `%${query}%`),
          ilike(ideas.description, `%${query}%`),
          // For tags, we need to check if the JSONB array contains any matching tags
          // This requires a bit more complex Drizzle query for JSONB array containment
          // For now, we'll focus on text fields.
          // Later: sql`${ideas.tags} @> ${JSON.stringify([query])}::jsonb`
        )
      );
    }
    
    // Add tag filtering if provided
    if (tags.length > 0) {
      // For each tag, check if it's contained in the ideas.tags JSONB array
      tags.forEach(tag => {
        searchConditions.push(sql`${ideas.tags} @> ${JSON.stringify([tag])}::jsonb`);
      });
    }

    // Only search public ideas
    searchConditions.push(eq(boards.isPublic, true));

    const searchedIdeas = await db.query.ideas.findMany({
      where: and(...searchConditions),
      with: {
        board: {
          with: {
            tenant: true
          }
        }
      },
      orderBy: [ideas.createdAt],
      limit: 50, // Limit results for performance
    });

    return NextResponse.json(searchedIdeas);

  } catch (error) {
    console.error("Idea search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
