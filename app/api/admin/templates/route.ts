import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { customTemplates } from "@/lib/db/schema";
import { getUserByEmail } from "@/lib/db/queries";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateRequest, sanitizeString, sanitizeForDb } from "@/lib/validation";

const ADMIN_EMAILS = [
  "gabecabr@gmail.com",
];

async function isAdmin(email: string) {
  const user = await getUserByEmail(email);
  return user?.isAdmin || ADMIN_EMAILS.includes(email);
}

const createTemplateSchema = z.object({
  templateId: z.string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Template ID must be lowercase alphanumeric with dashes")
    .transform(s => s.toLowerCase()),
  name: z.string()
    .min(1)
    .max(100)
    .transform(sanitizeString),
  description: z.string()
    .min(1)
    .max(500)
    .transform(sanitizeString),
  category: z.enum(["essentials", "planning", "people", "day-of", "extras"])
    .default("extras"),
  icon: z.string()
    .max(50)
    .regex(/^[A-Za-z]+$/, "Invalid icon name")
    .default("StickyNote"),
  timelineFilters: z.array(
    z.enum(["12-months", "9-months", "6-months", "3-months", "1-month", "week-of"])
  ).default([]),
  fields: z.array(z.object({
    key: z.string().max(50).regex(/^[a-z_]+$/),
    label: z.string().max(100).transform(sanitizeString),
    type: z.enum(["text", "textarea", "number", "date", "checkbox", "select", "array"]),
    required: z.boolean().optional(),
    options: z.array(z.string().max(100).transform(sanitizeString)).optional(),
    arrayItemSchema: z.array(z.any()).optional(),
  })).max(50).default([]),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
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
    
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
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
    const validation = validateRequest(createTemplateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if templateId already exists
    const existing = await db
      .select()
      .from(customTemplates)
      .where(eq(customTemplates.templateId, data.templateId))
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
        templateId: data.templateId,
        name: data.name,
        description: data.description,
        category: data.category,
        icon: data.icon,
        timelineFilters: data.timelineFilters,
        fields: data.fields,
        isFree: data.isFree,
        isPublished: data.isPublished,
      })
      .returning();

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
