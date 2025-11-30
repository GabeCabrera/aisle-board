import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { customTemplates } from "@/lib/db/schema";
import { getUserByEmail } from "@/lib/db/queries";
import { eq } from "drizzle-orm";

const ADMIN_EMAILS = [
  "gabecabr@gmail.com",
];

async function isAdmin(email: string) {
  const user = await getUserByEmail(email);
  return user?.isAdmin || ADMIN_EMAILS.includes(email);
}

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

    const body = await request.json();
    const {
      templateId,
      name,
      description,
      category,
      icon,
      timelineFilters,
      fields,
      isFree,
      isPublished,
    } = body;

    if (!templateId || !name || !description) {
      return NextResponse.json(
        { error: "Template ID, name, and description are required" },
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

    const [newTemplate] = await db
      .insert(customTemplates)
      .values({
        templateId,
        name,
        description,
        category: category || "extras",
        icon: icon || "StickyNote",
        timelineFilters: timelineFilters || [],
        fields: fields || [],
        isFree: isFree || false,
        isPublished: isPublished || false,
      })
      .returning();

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
