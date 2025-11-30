import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rsvpForms, pages, tenants, planners } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { rsvpFormSchema, sanitizeString } from "@/lib/validation";

// Generate a cute slug from couple names
function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const result = rsvpFormSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = result.data;
    const pageId = data.pageId;
    const title = data.title ? sanitizeString(data.title) : "RSVP";
    const message = data.message ? sanitizeString(data.message) : null;
    const fields = data.fields;
    const mealOptions = data.mealOptions?.map(o => sanitizeString(o)) || [];

    // Verify the page belongs to this tenant's planner
    const [page] = await db
      .select()
      .from(pages)
      .innerJoin(planners, eq(pages.plannerId, planners.id))
      .where(
        and(
          eq(pages.id, pageId),
          eq(planners.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Get tenant for slug generation
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, session.user.tenantId))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check if form already exists for this page
    const [existingForm] = await db
      .select()
      .from(rsvpForms)
      .where(
        and(
          eq(rsvpForms.pageId, pageId),
          eq(rsvpForms.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    if (existingForm) {
      // Update existing form
      const [updatedForm] = await db
        .update(rsvpForms)
        .set({
          title,
          message,
          fields: fields || existingForm.fields,
          mealOptions,
          updatedAt: new Date(),
        })
        .where(eq(rsvpForms.id, existingForm.id))
        .returning();

      return NextResponse.json(updatedForm);
    }

    // Generate cute slug from couple names
    const baseSlug = generateSlug(tenant.displayName);
    
    // Check if slug exists, if so add a short suffix
    let slug = baseSlug;
    const [existing] = await db
      .select()
      .from(rsvpForms)
      .where(eq(rsvpForms.slug, slug))
      .limit(1);
    
    if (existing) {
      // Add last 4 chars of tenant ID to make unique
      slug = `${baseSlug}-${tenant.id.slice(-4)}`;
    }

    // Limit RSVP forms per tenant
    const existingFormsCount = await db
      .select()
      .from(rsvpForms)
      .where(eq(rsvpForms.tenantId, session.user.tenantId));
    
    if (existingFormsCount.length >= 10) {
      return NextResponse.json(
        { error: "Maximum RSVP forms limit reached" },
        { status: 400 }
      );
    }

    // Create new form
    const [newForm] = await db
      .insert(rsvpForms)
      .values({
        tenantId: session.user.tenantId,
        pageId,
        slug,
        title,
        message,
        weddingDate: tenant.weddingDate,
        fields: fields || {
          name: true,
          email: true,
          phone: false,
          address: true,
          attending: true,
          mealChoice: false,
          dietaryRestrictions: false,
          plusOne: false,
          plusOneName: false,
          plusOneMeal: false,
          songRequest: false,
          notes: false,
        },
        mealOptions,
      })
      .returning();

    return NextResponse.json(newForm);
  } catch (error) {
    console.error("Create RSVP form error:", error);
    return NextResponse.json(
      { error: "Failed to create RSVP form" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json({ error: "pageId required" }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pageId)) {
      return NextResponse.json({ error: "Invalid pageId" }, { status: 400 });
    }

    const [form] = await db
      .select()
      .from(rsvpForms)
      .where(
        and(
          eq(rsvpForms.pageId, pageId),
          eq(rsvpForms.tenantId, session.user.tenantId)
        )
      )
      .limit(1);

    return NextResponse.json(form || null);
  } catch (error) {
    console.error("Get RSVP form error:", error);
    return NextResponse.json(
      { error: "Failed to get RSVP form" },
      { status: 500 }
    );
  }
}
