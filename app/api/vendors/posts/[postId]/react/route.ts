import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { reactToVendorPost } from "@/lib/data/stem";

/**
 * POST /api/vendors/posts/[postId]/react
 * Toggle reaction on a vendor post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
    const result = await reactToVendorPost(postId, session.user.tenantId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error reacting to vendor post:", error);
    return NextResponse.json(
      { error: "Failed to react to post" },
      { status: 500 }
    );
  }
}
