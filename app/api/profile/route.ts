import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/profile
 * Get the current user's profile
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId),
      columns: {
        id: true,
        displayName: true,
        weddingDate: true,
        slug: true,
        bio: true,
        socialLinks: true,
        profileImage: true,
        messagingEnabled: true,
        profileVisibility: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update the current user's profile
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      bio,
      profileImage,
      weddingDate,
      socialLinks,
      messagingEnabled,
      profileVisibility,
    } = body;

    // Validate required fields
    if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    // Validate bio length
    if (bio && typeof bio === "string" && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Validate profile visibility
    const validVisibility = ["public", "followers", "private"];
    if (profileVisibility && !validVisibility.includes(profileVisibility)) {
      return NextResponse.json(
        { error: "Invalid profile visibility" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      displayName: displayName.trim(),
      bio: bio?.trim() || null,
      profileImage: profileImage?.trim() || null,
      socialLinks: socialLinks || {},
      updatedAt: new Date(),
    };

    // Only update weddingDate if provided
    if (weddingDate) {
      updateData.weddingDate = new Date(weddingDate);
    } else if (weddingDate === null) {
      updateData.weddingDate = null;
    }

    // Only update boolean/enum fields if explicitly provided
    if (typeof messagingEnabled === "boolean") {
      updateData.messagingEnabled = messagingEnabled;
    }
    if (profileVisibility) {
      updateData.profileVisibility = profileVisibility;
    }

    // Update the tenant
    const [updatedTenant] = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, session.user.tenantId))
      .returning({
        id: tenants.id,
        displayName: tenants.displayName,
        bio: tenants.bio,
        profileImage: tenants.profileImage,
        weddingDate: tenants.weddingDate,
        socialLinks: tenants.socialLinks,
        messagingEnabled: tenants.messagingEnabled,
        profileVisibility: tenants.profileVisibility,
      });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
