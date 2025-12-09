import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema"; // Updated import
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all boards for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const userBoards = await db.query.boards.findMany({ // Updated table name
      where: eq(boards.tenantId, session.user.tenantId),
      orderBy: (boards, { asc }) => [asc(boards.position)], // Updated table name
    });
    return NextResponse.json(userBoards);
  } catch (error) {
    console.error("Failed to fetch boards:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Create a new board
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { name, description } = await req.json();

    if (!name) {
      return new Response("Name is required", { status: 400 });
    }

    const [newBoard] = await db // Updated variable name
      .insert(boards) // Updated table name
      .values({
        tenantId: session.user.tenantId,
        name,
        description,
      })
      .returning();

    return NextResponse.json(newBoard); // Updated variable name
  } catch (error) {
    console.error("Failed to create board:", error); // Updated message
    return new Response("Internal Server Error", { status: 500 });
  }
}