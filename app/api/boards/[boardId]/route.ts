import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema"; // Updated import
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Update a board
export async function PATCH(req: Request, { params }: { params: { boardId: string } }) { // Updated param name
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { name, description, isPublic } = await req.json();
    const { boardId } = params; // Updated param name

    const [updatedBoard] = await db // Updated variable name
      .update(boards) // Updated table name
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        updatedAt: new Date()
      })
      .where(and(eq(boards.id, boardId), eq(boards.tenantId, session.user.tenantId))) // Updated table and param names
      .returning();

    if (!updatedBoard) { // Updated variable name
      return new Response("Board not found or you do not have permission to edit it.", { status: 404 }); // Updated message
    }

    return NextResponse.json(updatedBoard); // Updated variable name
  } catch (error) {
    console.error("Failed to update board:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Delete a board
export async function DELETE(req: Request, { params }: { params: { boardId: string } }) { // Updated param name
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { boardId } = params; // Updated param name

    const [deletedBoard] = await db // Updated variable name
      .delete(boards) // Updated table name
      .where(and(eq(boards.id, boardId), eq(boards.tenantId, session.user.tenantId))) // Updated table and param names
      .returning();

    if (!deletedBoard) { // Updated variable name
        return new Response("Board not found or you do not have permission to delete it.", { status: 404 }); // Updated message
    }

    return new Response(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Failed to delete board:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}
