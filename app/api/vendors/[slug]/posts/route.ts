import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getVendorBySlug,
  getVendorPosts,
  createVendorPost,
  type VendorPostType,
} from "@/lib/data/stem";

/**
 * GET /api/vendors/[slug]/posts
 * Get vendor posts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const vendor = await getVendorBySlug(slug);
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const type = searchParams.get("type") as VendorPostType | null;

    const posts = await getVendorPosts(vendor.id, {
      limit: Math.min(limit, 50),
      offset,
      type: type || undefined,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching vendor posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendors/[slug]/posts
 * Create a vendor post (vendor owners only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const vendor = await getVendorBySlug(slug);

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Verify the user owns this vendor
    if (vendor.claimedByTenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Only the vendor owner can create posts" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, title, content, images } = body;

    // Validate type
    const validTypes: VendorPostType[] = ["update", "portfolio", "special_offer", "tip"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid post type" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const post = await createVendorPost({
      vendorId: vendor.id,
      authorTenantId: session.user.tenantId,
      type,
      title,
      content: content.trim(),
      images: Array.isArray(images) ? images : [],
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
