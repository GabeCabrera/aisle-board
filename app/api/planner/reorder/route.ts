import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerByTenantId, reorderPages } from "@/lib/db/queries";
import { z } from "zod";

const reorderSchema = z.object({
  plannerId: z.string().uuid("Invalid planner ID"),
  pageIds: z.array(z.string().uuid("Invalid page ID"))
    .min(1, "At least one page is required")
    .max(100, "Too many pages"),
});

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
    const result = reorderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { plannerId, pageIds } = result.data;

    // Verify the planner belongs to this tenant
    const planner = await getPlannerByTenantId(session.user.tenantId);

    if (!planner || planner.id !== plannerId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await reorderPages(plannerId, pageIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder pages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
