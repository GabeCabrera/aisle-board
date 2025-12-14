import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getVendorReviews,
  createVendorReview,
  getVendorBySlug,
} from "@/lib/data/stem";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const sortBy = (searchParams.get("sortBy") as "newest" | "highest" | "lowest" | "helpful") || "newest";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get vendor by slug first
    const vendor = await getVendorBySlug(slug);
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    const reviews = await getVendorReviews(vendor.id, {
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

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
    const { rating, title, content, serviceDate } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get vendor by slug
    const vendor = await getVendorBySlug(slug);
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    const review = await createVendorReview({
      vendorId: vendor.id,
      tenantId: session.user.tenantId,
      rating,
      title,
      content,
      serviceDate: serviceDate ? new Date(serviceDate) : undefined,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    const message = error instanceof Error ? error.message : "Failed to create review";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
