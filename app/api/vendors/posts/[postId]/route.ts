import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getVendorPostById,
  updateVendorPost,
  deleteVendorPost,
  reactToVendorPost,
  hasReacted,
  type VendorPostType,
} from "@/lib/data/stem";

/**
 * GET /api/vendors/posts/[postId]
 * Get a single vendor post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await getServerSession(authOptions);

    const post = await getVendorPostById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    let userHasReacted = false;
    if (session?.user?.tenantId) {
      userHasReacted = await hasReacted(session.user.tenantId, "vendor_post", postId);
    }

    return NextResponse.json({ post, userHasReacted });
  } catch (error) {
    console.error("Error fetching vendor post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vendors/posts/[postId]
 * Update a vendor post
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const body = await request.json();
    const { type, title, content, images } = body;

    // Validate type if provided
    if (type) {
      const validTypes: VendorPostType[] = ["update", "portfolio", "special_offer", "tip"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: "Invalid post type" },
          { status: 400 }
        );
      }
    }

    const updated = await updateVendorPost(postId, session.user.tenantId, {
      type,
      title,
      content: content?.trim(),
      images,
    });

    return NextResponse.json({ post: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    console.error("Error updating vendor post:", error);
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/vendors/posts/[postId]
 * Delete a vendor post
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    await deleteVendorPost(postId, session.user.tenantId);

    return NextResponse.json({ message: "Post deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    console.error("Error deleting vendor post:", error);
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 403 : 500 }
    );
  }
}
