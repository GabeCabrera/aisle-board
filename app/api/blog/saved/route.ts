import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { savedArticles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAllPosts } from "@/lib/blog/mdx";
import type { BlogPost } from "@/lib/blog/types";

// GET - Fetch all saved articles for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const saved = await db
      .select()
      .from(savedArticles)
      .where(eq(savedArticles.tenantId, session.user.tenantId))
      .orderBy(savedArticles.savedAt);

    // Get the slugs of saved articles
    const savedSlugs = saved.map((s) => s.slug);

    // Get full post data for saved articles
    const allPosts = getAllPosts();
    const savedPosts = allPosts.filter((post) => savedSlugs.includes(post.slug));

    return NextResponse.json({
      savedSlugs,
      savedPosts,
    });
  } catch (error) {
    console.error("Error fetching saved articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved articles" },
      { status: 500 }
    );
  }
}

// POST - Save an article
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Check if already saved
    const existing = await db
      .select()
      .from(savedArticles)
      .where(
        and(
          eq(savedArticles.tenantId, session.user.tenantId),
          eq(savedArticles.slug, slug)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: "Already saved", saved: true });
    }

    // Save the article
    await db.insert(savedArticles).values({
      tenantId: session.user.tenantId,
      slug,
    });

    return NextResponse.json({ message: "Article saved", saved: true });
  } catch (error) {
    console.error("Error saving article:", error);
    return NextResponse.json(
      { error: "Failed to save article" },
      { status: 500 }
    );
  }
}

// DELETE - Unsave an article
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    await db
      .delete(savedArticles)
      .where(
        and(
          eq(savedArticles.tenantId, session.user.tenantId),
          eq(savedArticles.slug, slug)
        )
      );

    return NextResponse.json({ message: "Article unsaved", saved: false });
  } catch (error) {
    console.error("Error unsaving article:", error);
    return NextResponse.json(
      { error: "Failed to unsave article" },
      { status: 500 }
    );
  }
}
