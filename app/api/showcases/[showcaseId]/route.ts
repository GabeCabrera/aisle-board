import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getWeddingShowcaseById,
  updateWeddingShowcase,
  deleteWeddingShowcase,
  hasReacted,
} from "@/lib/data/stem";

/**
 * GET /api/showcases/[showcaseId]
 * Get a single wedding showcase
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ showcaseId: string }> }
) {
  try {
    const { showcaseId } = await params;
    const session = await getServerSession(authOptions);

    const showcase = await getWeddingShowcaseById(showcaseId);
    if (!showcase) {
      return NextResponse.json({ error: "Showcase not found" }, { status: 404 });
    }

    let userHasReacted = false;
    if (session?.user?.tenantId) {
      userHasReacted = await hasReacted(session.user.tenantId, "showcase", showcaseId);
    }

    return NextResponse.json({ showcase, userHasReacted });
  } catch (error) {
    console.error("Error fetching showcase:", error);
    return NextResponse.json(
      { error: "Failed to fetch showcase" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/showcases/[showcaseId]
 * Update a wedding showcase
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ showcaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { showcaseId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      weddingDate,
      location,
      images,
      featuredImage,
      vendorList,
    } = body;

    const updated = await updateWeddingShowcase(showcaseId, session.user.tenantId, {
      title: title?.trim(),
      description: description?.trim(),
      weddingDate: weddingDate ? new Date(weddingDate) : undefined,
      location: location?.trim(),
      images,
      featuredImage,
      vendorList,
    });

    return NextResponse.json({ showcase: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update showcase";
    console.error("Error updating showcase:", error);
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 403 : 500 }
    );
  }
}

/**
 * DELETE /api/showcases/[showcaseId]
 * Delete a wedding showcase
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ showcaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { showcaseId } = await params;
    await deleteWeddingShowcase(showcaseId, session.user.tenantId);

    return NextResponse.json({ message: "Showcase deleted" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete showcase";
    console.error("Error deleting showcase:", error);
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 403 : 500 }
    );
  }
}
