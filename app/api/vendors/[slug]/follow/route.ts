import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getVendorBySlug, followVendor, unfollowVendor, isFollowingVendor } from "@/lib/data/stem";

/**
 * GET /api/vendors/[slug]/follow
 * Check if user is following a vendor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ isFollowing: false });
    }

    const { slug } = await params;
    const vendor = await getVendorBySlug(slug);

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const isFollowing = await isFollowingVendor(session.user.tenantId, vendor.id);

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error("Error checking vendor follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendors/[slug]/follow
 * Follow a vendor
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

    const result = await followVendor(session.user.tenantId, vendor.id);

    if (result.alreadyFollowing) {
      return NextResponse.json({
        message: "Already following this vendor",
        isFollowing: true
      });
    }

    return NextResponse.json({
      message: "Successfully followed vendor",
      isFollowing: true
    });
  } catch (error) {
    console.error("Error following vendor:", error);
    return NextResponse.json(
      { error: "Failed to follow vendor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendors/[slug]/follow
 * Unfollow a vendor
 */
export async function DELETE(
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

    const result = await unfollowVendor(session.user.tenantId, vendor.id);

    return NextResponse.json({
      message: result.unfollowed ? "Successfully unfollowed vendor" : "Was not following",
      isFollowing: false
    });
  } catch (error) {
    console.error("Error unfollowing vendor:", error);
    return NextResponse.json(
      { error: "Failed to unfollow vendor" },
      { status: 500 }
    );
  }
}
