import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { palettes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Get all palettes for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const userPalettes = await db.query.palettes.findMany({
      where: eq(palettes.tenantId, session.user.tenantId),
      orderBy: (palettes, { asc }) => [asc(palettes.position)],
    });
    return NextResponse.json(userPalettes);
  } catch (error) {
    console.error("Failed to fetch palettes:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Create a new palette
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

    const [newPalette] = await db
      .insert(palettes)
      .values({
        tenantId: session.user.tenantId,
        name,
        description,
      })
      .returning();

    return NextResponse.json(newPalette);
  } catch (error) {
    console.error("Failed to create palette:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
