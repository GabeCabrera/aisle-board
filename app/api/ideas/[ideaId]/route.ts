import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ideas, boards } from "@/lib/db/schema"; // Updated imports
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Get a single idea
export async function GET(req: Request, { params }: { params: { ideaId: string } }) { // Updated param name
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const { ideaId } = params; // Updated param name
        const idea = await db.query.ideas.findFirst({ // Updated table name
          where: eq(ideas.id, ideaId) // Updated table name and param
        });

        if (!idea) { // Updated variable name
            return new Response("Idea not found", { status: 404 }); // Updated message
        }
        
        // Verify the user owns the board this idea belongs to
        const board = await db.query.boards.findFirst({ // Updated variable and table names
          where: and(eq(boards.id, idea.boardId), eq(boards.tenantId, session.user.tenantId)) // Updated table and param names
        });
        if (!board) { // Updated variable name
            return new Response("Unauthorized", { status: 401 });
        }

        return NextResponse.json(idea); // Updated variable name
    } catch (error) {
        console.error("Failed to fetch idea:", error); // Updated message
        return new Response("Internal Server Error", { status: 500 });
    }
}


// Delete an idea
export async function DELETE(req: Request, { params }: { params: { ideaId: string } }) { // Updated param name
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { ideaId } = params; // Updated param name
    
    // First get the idea to verify ownership via the board
    const idea = await db.query.ideas.findFirst({ // Updated variable and table names
      where: eq(ideas.id, ideaId) // Updated table name and param
    });

    if (!idea) { // Updated variable name
        return new Response("Idea not found", { status: 404 }); // Updated message
    }

    // Verify the user owns the board this idea belongs to
    const board = await db.query.boards.findFirst({ // Updated variable and table names
      where: and(eq(boards.id, idea.boardId), eq(boards.tenantId, session.user.tenantId)) // Updated table and param names
    });

    if (!board) { // Updated variable name
        return new Response("Unauthorized to delete this idea", { status: 403 }); // Updated message
    }

    // If ownership is confirmed, delete the idea
    await db.delete(ideas).where(eq(ideas.id, ideaId)); // Updated table name and param

    return new Response(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Failed to delete idea:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Update an idea (edit details or move to another board)
export async function PATCH(req: Request, { params }: { params: { ideaId: string } }) { // Updated param name
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { ideaId } = params; // Updated param name
    const body = await req.json();
    const { title, description, tags, boardId } = body; // Updated param name

    // 1. Verify ownership of the idea (via its current board)
    const existingIdea = await db.query.ideas.findFirst({ // Updated variable and table names
      where: eq(ideas.id, ideaId) // Updated table name and param
    });
    if (!existingIdea) return new Response("Idea not found", { status: 404 }); // Updated message

    const currentBoard = await db.query.boards.findFirst({ // Updated variable and table names
      where: and(eq(boards.id, existingIdea.boardId), eq(boards.tenantId, session.user.tenantId)) // Updated table and param names
    });

    if (!currentBoard) return new Response("Unauthorized", { status: 403 });

    // 2. If moving to a new board, verify ownership of the new board
    if (boardId && boardId !== existingIdea.boardId) { // Updated param name
      const newBoard = await db.query.boards.findFirst({ // Updated variable and table names
        where: and(eq(boards.id, boardId), eq(boards.tenantId, session.user.tenantId)) // Updated table and param names
      });
      
      if (!newBoard) return new Response("Unauthorized target board", { status: 403 }); // Updated message
    }

    // 3. Update the idea
    const [updatedIdea] = await db // Updated variable name
      .update(ideas) // Updated table name
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(boardId !== undefined && { boardId }), // Updated param name
      })
      .where(eq(ideas.id, ideaId)) // Updated table name and param
      .returning();

    return NextResponse.json(updatedIdea); // Updated variable name
  } catch (error) {
    console.error("Failed to update idea:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}
