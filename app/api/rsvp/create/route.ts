import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rsvpForms, pages, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, title, message, fields, mealOptions } = body;

    // Verify the page belongs to this tenant
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId))
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

    // Generate unique slug
    const slug = `${tenant.slug}-${nanoid(6)}`;

    // Check if form already exists for this page
    const [existingForm] = await db
      .select()
      .from(rsvpForms)
      .where(eq(rsvpForms.pageId, pageId))
      .limit(1);

    if (existingForm) {
      // Update existing form
      const [updatedForm] = await db
        .update(rsvpForms)
        .set({
          title: title || "RSVP",
          message: message || null,
          fields: fields || existingForm.fields,
          mealOptions: mealOptions || [],
          updatedAt: new Date(),
        })
        .where(eq(rsvpForms.id, existingForm.id))
        .returning();

      return NextResponse.json(updatedForm);
    }

    // Create new form
    const [newForm] = await db
      .insert(rsvpForms)
      .values({
        tenantId: session.user.tenantId,
        pageId,
        slug,
        title: title || "RSVP",
        message: message || null,
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
        mealOptions: mealOptions || [],
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
