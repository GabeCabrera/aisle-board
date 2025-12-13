import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { profileUpdateSchema, sanitizeString } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { displayName, weddingDate, onboardingComplete, plannerName, bio, socialLinks, profileImage } = parsed.data;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateData.displayName = sanitizeString(displayName);
    }

    if (weddingDate !== undefined) {
      updateData.weddingDate = weddingDate ? new Date(weddingDate) : null;
    }

    if (onboardingComplete !== undefined) {
      updateData.onboardingComplete = onboardingComplete;
    }

    if (plannerName !== undefined) {
      updateData.plannerName = sanitizeString(plannerName);
    }

    if (bio !== undefined) {
      updateData.bio = sanitizeString(bio);
    }

    if (socialLinks !== undefined) {
      updateData.socialLinks = socialLinks;
    }

    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }

    await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, session.user.tenantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
