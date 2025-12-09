import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ideas, boards } from "@/lib/db/schema"; // Updated imports
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// Create a new idea
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { boardId, imageUrl, title, description, sourceUrl, tags } = await req.json(); // Updated param name

    if (!boardId || !imageUrl) { // Updated param name
      return new Response("boardId and imageUrl are required", { status: 400 }); // Updated message
    }

    // Verify the user owns the board they are adding an idea to
    const [board] = await db // Updated variable name
      .select()
      .from(boards) // Updated table name
      .where(and(eq(boards.id, boardId), eq(boards.tenantId, session.user.tenantId))); // Updated table and param names

    if (!board) { // Updated variable name
      return new Response("Board not found or you do not have permission to add to it.", { status: 404 }); // Updated message
    }

    const [newIdea] = await db // Updated variable name
      .insert(ideas) // Updated table name
      .values({
        boardId, // Updated param name
        imageUrl,
        title,
        description,
        sourceUrl,
        tags: tags || [],
      })
      .returning();

    return NextResponse.json(newIdea); // Updated variable name
  } catch (error) {
    console.error("Failed to create idea:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}