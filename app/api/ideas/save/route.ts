import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ideas, boards } from "@/lib/db/schema"; // Updated imports
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const saveIdeaSchema = z.object({
  originalIdeaId: z.string().uuid(),
  targetBoardId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = saveIdeaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.issues }, { status: 400 });
    }

    const { originalIdeaId, targetBoardId } = parsed.data; // Updated param names
    const tenantId = session.user.tenantId;

    // 1. Fetch the original idea
    const originalIdea = await db.query.ideas.findFirst({ // Updated variable and table names
      where: eq(ideas.id, originalIdeaId), // Updated table name and param
    });

    if (!originalIdea) { // Updated variable name
      return NextResponse.json({ error: "Original idea not found" }, { status: 404 }); // Updated message
    }

    // 2. Verify target board belongs to the user
    const targetBoard = await db.query.boards.findFirst({ // Updated variable and table names
      where: and(eq(boards.id, targetBoardId), eq(boards.tenantId, tenantId)), // Updated table and param names
    });

    if (!targetBoard) { // Updated variable name
      return NextResponse.json({ error: "Target board not found or unauthorized" }, { status: 403 }); // Updated message
    }

    // 3. Create a new idea in the target board
    const [newIdea] = await db.insert(ideas).values({
      boardId: targetBoardId,
      title: originalIdea.title,
      description: originalIdea.description,
      imageUrl: originalIdea.imageUrl,
      sourceUrl: originalIdea.sourceUrl,
      imageWidth: originalIdea.imageWidth,
      imageHeight: originalIdea.imageHeight,
      tags: originalIdea.tags,
      originalIdeaId: originalIdea.id,
      viewCount: 0,
      saveCount: 0,
    }).returning();

    // 4. Increment saveCount on the original idea
    await db.update(ideas) // Updated table name
      .set({ saveCount: sql`${ideas.saveCount} + 1` }) // Updated table name
      .where(eq(ideas.id, originalIdeaId)); // Updated table name and param

    return NextResponse.json({ success: true, idea: newIdea }, { status: 201 }); // Updated variable name

  } catch (error) {
    console.error("Failed to save idea:", error); // Updated message
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}