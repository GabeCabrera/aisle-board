import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getOrCreatePlanner, createPage, getTenantById } from "@/lib/db/queries";
import { getTemplateById } from "@/lib/templates/registry";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { templateIds } = await request.json();

    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      return NextResponse.json(
        { error: "At least one template is required" },
        { status: 400 }
      );
    }

    // Get or create planner for this tenant
    const planner = await getOrCreatePlanner(session.user.tenantId);

    // Get tenant info for pre-populating user data
    const tenant = await getTenantById(session.user.tenantId);

    // Always add cover page first if not already included
    const allTemplateIds = templateIds.includes("cover")
      ? templateIds
      : ["cover", ...templateIds];

    // Create pages for each template
    for (let i = 0; i < allTemplateIds.length; i++) {
      const templateId = allTemplateIds[i];
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

      // Pre-populate shared fields with tenant data for personalization
      if (tenant) {
        // Pre-populate names field if this template has it
        if ("names" in defaultFields && tenant.displayName) {
          defaultFields.names = tenant.displayName;
        }
        // Pre-populate wedding date if set
        if ("weddingDate" in defaultFields && tenant.weddingDate) {
          defaultFields.weddingDate = tenant.weddingDate.toISOString().split("T")[0];
        }
      }

      await createPage(
        planner.id,
        templateId,
        template.name,
        i,
        defaultFields
      );
    }

    return NextResponse.json({ success: true, plannerId: planner.id });
  } catch (error) {
    console.error("Create planner error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
