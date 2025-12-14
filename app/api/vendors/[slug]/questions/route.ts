import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getVendorQuestions,
  createVendorQuestion,
  getVendorBySlug,
} from "@/lib/data/stem";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const sortBy = (searchParams.get("sortBy") as "newest" | "unanswered" | "helpful") || "newest";
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

    const questions = await getVendorQuestions(vendor.id, {
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
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
    const { question } = await request.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: "Question must be 500 characters or less" },
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

    const newQuestion = await createVendorQuestion({
      vendorId: vendor.id,
      tenantId: session.user.tenantId,
      question: question.trim(),
    });

    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
    const message = error instanceof Error ? error.message : "Failed to create question";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
