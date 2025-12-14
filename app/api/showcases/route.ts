import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getWeddingShowcases, createWeddingShowcase } from "@/lib/data/stem";

/**
 * GET /api/showcases
 * Get wedding showcases (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const vendorId = searchParams.get("vendorId") || undefined;
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const showcases = await getWeddingShowcases({
      vendorId,
      featured,
      limit: Math.min(limit, 50),
      offset,
    });

    return NextResponse.json({ showcases });
  } catch (error) {
    console.error("Error fetching showcases:", error);
    return NextResponse.json(
      { error: "Failed to fetch showcases" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/showcases
 * Create a wedding showcase (vendor owners only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      vendorId,
      title,
      description,
      weddingDate,
      location,
      images,
      featuredImage,
      vendorList,
      coupleTenantId,
    } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    const showcase = await createWeddingShowcase({
      vendorId,
      authorTenantId: session.user.tenantId,
      title: title.trim(),
      description: description?.trim(),
      weddingDate: weddingDate ? new Date(weddingDate) : undefined,
      location: location?.trim(),
      images,
      featuredImage,
      vendorList,
      coupleTenantId,
    });

    return NextResponse.json({ showcase }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create showcase";
    console.error("Error creating showcase:", error);
    return NextResponse.json(
      { error: message },
      { status: message.includes("Only the vendor owner") ? 403 : 500 }
    );
  }
}
