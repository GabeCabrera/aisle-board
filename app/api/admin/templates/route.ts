import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { customTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { sanitizeString } from "@/lib/validation";

const createTemplateSchema = z.object({
  templateId: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Template ID must be lowercase alphanumeric with dashes"),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.string().optional(),
  icon: z.string().max(50).optional(),
  timelineFilters: z.array(z.string()).optional(),
  fields: z.array(z.any()).optional(),
  isFree: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const templates = await db.select().from(customTemplates);
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Get templates error:", error);
    return NextResponse.json({ error: "Failed to get templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
    const result = createTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Sanitize strings
    const templateId = data.templateId.toLowerCase();
    const name = sanitizeString(data.name);
    const description = sanitizeString(data.description);
    const category = data.category || "extras";
    const icon = data.icon || "StickyNote";

    // Validate category
    const validCategories = ["essentials", "planning", "people", "day-of", "extras"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Validate icon format
    if (!/^[A-Za-z]+$/.test(icon)) {
      return NextResponse.json(
        { error: "Invalid icon name" },
        { status: 400 }
      );
    }

    // Check if templateId already exists
    const existing = await db
      .select()
      .from(customTemplates)
      .where(eq(customTemplates.templateId, templateId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A template with this ID already exists" },
        { status: 400 }
      );
    }

    // Limit total custom templates
    const allTemplates = await db.select().from(customTemplates);
    if (allTemplates.length >= 100) {
      return NextResponse.json(
        { error: "Maximum template limit reached" },
        { status: 400 }
      );
    }

    const [newTemplate] = await db
      .insert(customTemplates)
      .values({
        templateId,
        name,
        description,
        category,
        icon,
        timelineFilters: data.timelineFilters || [],
        fields: data.fields || [],
        isFree: data.isFree || false,
        isPublished: data.isPublished || false,
      })
      .returning();

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
