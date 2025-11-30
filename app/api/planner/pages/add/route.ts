import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerByTenantId, getPagesByPlannerId, createPage } from "@/lib/db/queries";
import { getTemplateById } from "@/lib/templates/registry";
import { addPagesSchema } from "@/lib/validation";

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
    const result = addPagesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { templateIds } = result.data;

    const planner = await getPlannerByTenantId(session.user.tenantId);

    if (!planner) {
      return NextResponse.json(
        { error: "Planner not found" },
        { status: 404 }
      );
    }

    // Get current pages to determine position
    const existingPages = await getPagesByPlannerId(planner.id);
    
    // Limit total pages per planner
    if (existingPages.length + templateIds.length > 50) {
      return NextResponse.json(
        { error: "Maximum page limit reached" },
        { status: 400 }
      );
    }

    let nextPosition = existingPages.length;

    // Create pages for each template
    const createdPages = [];
    for (const templateId of templateIds) {
      const template = getTemplateById(templateId);

      if (!template) {
        console.warn(`Template not found: ${templateId}`);
        continue;
      }

      // Create default fields from template definition
      const defaultFields: Record<string, unknown> = {};
      for (const field of template.fields) {
        if (field.type === "array") {
          defaultFields[field.key] = [];
        } else if (field.type === "checkbox") {
          defaultFields[field.key] = false;
        } else {
          defaultFields[field.key] = "";
        }
      }

      const page = await createPage(
        planner.id,
        templateId,
        template.name,
        nextPosition,
        defaultFields
      );

      createdPages.push(page);
      nextPosition++;
    }

    return NextResponse.json({ success: true, pages: createdPages });
  } catch (error) {
    console.error("Add pages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
