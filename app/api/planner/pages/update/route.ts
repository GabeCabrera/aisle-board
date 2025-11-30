import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerByTenantId, getPageById, updatePageFields } from "@/lib/db/queries";
import { pageUpdateSchema, sanitizeForDb } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate input
    const result = pageUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { pageId, fields } = result.data;

    // Sanitize fields
    const sanitizedFields = sanitizeForDb(fields as Record<string, unknown>);

    // Verify the page belongs to this tenant's planner
    const planner = await getPlannerByTenantId(session.user.tenantId);

    if (!planner) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const page = await getPageById(pageId, planner.id);

    if (!page) {
      return NextResponse.json(
        { error: "Page not found" },
        { status: 404 }
      );
    }

    // Update with sanitized fields
    await updatePageFields(pageId, sanitizedFields);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update page fields error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
