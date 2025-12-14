import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { ilike, or, and, ne, eq } from "drizzle-orm";

/**
 * GET /api/social/users/search?q=query
 * Search for users by name
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const searchPattern = `%${query}%`;

    const users = await db
      .select({
        id: tenants.id,
        displayName: tenants.displayName,
        profileImage: tenants.profileImage,
        slug: tenants.slug,
      })
      .from(tenants)
      .where(
        and(
          ne(tenants.id, session.user.tenantId),
          or(
            ilike(tenants.displayName, searchPattern),
            ilike(tenants.slug, searchPattern)
          ),
          // Only search users with messaging enabled and public profile
          eq(tenants.messagingEnabled, true),
          or(
            eq(tenants.profileVisibility, "public"),
            eq(tenants.profileVisibility, "followers")
          )
        )
      )
      .limit(20);

    return NextResponse.json(users);
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
