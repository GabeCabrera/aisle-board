import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rsvpForms, tenants } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

// GET - Fetch RSVP form data by slug (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Sanitize slug - remove dangerous characters but preserve case for lookup
    const sanitizedSlug = slug
      .replace(/[^a-zA-Z0-9-]/g, "")
      .slice(0, 100);

    // Get the RSVP form (case-insensitive slug match)
    const form = await db.query.rsvpForms.findFirst({
      where: sql`lower(${rsvpForms.slug}) = lower(${sanitizedSlug})`,
      with: {
        tenant: {
          columns: {
            displayName: true,
            weddingDate: true,
          }
        }
      }
    });

    if (!form || !form.isActive) {
      return NextResponse.json(
        { error: "RSVP form not found" },
        { status: 404 }
      );
    }

    // Return form configuration (no sensitive data)
    return NextResponse.json({
      title: form.title,
      message: form.message,
      weddingDate: form.weddingDate,
      coupleNames: form.tenant?.displayName || null,
      fields: form.fields,
      mealOptions: form.mealOptions || [],
    });
  } catch (error) {
    console.error("RSVP form fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load RSVP form" },
      { status: 500 }
    );
  }
}
