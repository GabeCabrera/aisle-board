import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { followTenant, unfollowTenant } from "@/lib/data/stem";
import { z } from "zod";

const followSchema = z.object({
  targetTenantId: z.string().uuid(),
  action: z.enum(["follow", "unfollow"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = followSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { targetTenantId, action } = result.data;
    const followerId = session.user.tenantId;

    if (followerId === targetTenantId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    if (action === "follow") {
      await followTenant(followerId, targetTenantId);
    } else {
      await unfollowTenant(followerId, targetTenantId);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Follow API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
