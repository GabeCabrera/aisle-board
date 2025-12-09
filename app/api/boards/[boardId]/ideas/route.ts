import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { ideas, boards } from "@/lib/db/schema"; // Updated imports
import { and, eq, desc } from "drizzle-orm"; // Added desc
import { NextResponse } from "next/server";

// Get all ideas for a specific board
export async function GET(req: Request, { params }: { params: { boardId: string } }) { // Updated param name
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const { boardId } = params; // Updated param name

        // First, verify the user owns the board OR it's a public board
        const board = await db.query.boards.findFirst({
            where: and(eq(boards.id, boardId), eq(boards.tenantId, session.user.tenantId))
        });
        
        // If board is not found, or not owned by user and not public
        if (!board) {
            return new Response("Board not found or you do not have permission to view it.", { status: 404 });
        }

        const boardIdeas = await db.query.ideas.findMany({ // Updated table name
            where: eq(ideas.boardId, boardId), // Updated table name and param
            orderBy: (ideas, { desc }) => [desc(ideas.createdAt)], // Updated table name and desc
        });

        return NextResponse.json(boardIdeas);
    } catch (error) {
        console.error("Failed to fetch ideas:", error); // Updated message
        return new Response("Internal Server Error", { status: 500 });
    }
}