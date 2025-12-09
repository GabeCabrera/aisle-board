import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, weddingDate, onboardingComplete, plannerName, bio, socialLinks, profileImage } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (weddingDate !== undefined) {
      updateData.weddingDate = weddingDate ? new Date(weddingDate) : null;
    }

    if (onboardingComplete !== undefined) {
      updateData.onboardingComplete = onboardingComplete;
    }

    if (plannerName !== undefined) {
      updateData.plannerName = plannerName;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (socialLinks !== undefined) {
      updateData.socialLinks = socialLinks; // Assuming socialLinks is already a valid JSON object
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
