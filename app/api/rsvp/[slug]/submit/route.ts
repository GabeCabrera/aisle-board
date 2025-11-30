import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rsvpForms, rsvpResponses, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { 
  checkRateLimit,
  sanitizeString,
  sanitizeEmail,
  sanitizePhone 
} from "@/lib/validation";

// Simple validation schema
const rsvpSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().max(254).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  attending: z.boolean().nullable().optional(),
  mealChoice: z.string().max(100).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  plusOne: z.boolean().optional(),
  plusOneName: z.string().max(200).optional(),
  plusOneMeal: z.string().max(100).optional(),
  songRequest: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Sanitize slug
    const sanitizedSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 100);

    // Rate limit by IP (10 submissions per minute per IP)
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               "unknown";
    const rateLimitKey = `rsvp:${ip}`;
    const { allowed, remaining } = checkRateLimit(rateLimitKey, 10, 60000);
    
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: { "Retry-After": "60" }
        }
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
    const result = rsvpSubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Sanitize all inputs
    const sanitizedData = {
      name: sanitizeString(data.name),
      email: data.email ? sanitizeEmail(data.email) : null,
      phone: data.phone ? sanitizePhone(data.phone) : null,
      address: data.address ? sanitizeString(data.address) : null,
      attending: data.attending ?? null,
      mealChoice: data.mealChoice ? sanitizeString(data.mealChoice) : null,
      dietaryRestrictions: data.dietaryRestrictions ? sanitizeString(data.dietaryRestrictions) : null,
      plusOne: data.plusOne || false,
      plusOneName: data.plusOneName ? sanitizeString(data.plusOneName) : null,
      plusOneMeal: data.plusOneMeal ? sanitizeString(data.plusOneMeal) : null,
      songRequest: data.songRequest ? sanitizeString(data.songRequest) : null,
      notes: data.notes ? sanitizeString(data.notes) : null,
    };

    // Get the RSVP form
    const [form] = await db
      .select()
      .from(rsvpForms)
      .where(eq(rsvpForms.slug, sanitizedSlug))
      .limit(1);

    if (!form || !form.isActive) {
      return NextResponse.json(
        { error: "RSVP form not found or inactive" },
        { status: 404 }
      );
    }

    // Validate meal choice against allowed options if provided
    if (sanitizedData.mealChoice && form.mealOptions) {
      const allowedMeals = form.mealOptions as string[];
      if (allowedMeals.length > 0 && !allowedMeals.includes(sanitizedData.mealChoice)) {
        return NextResponse.json(
          { error: "Invalid meal choice" },
          { status: 400 }
        );
      }
    }

    // Insert the response with sanitized data
    const [response] = await db
      .insert(rsvpResponses)
      .values({
        formId: form.id,
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        address: sanitizedData.address,
        attending: sanitizedData.attending,
        mealChoice: sanitizedData.mealChoice,
        dietaryRestrictions: sanitizedData.dietaryRestrictions,
        plusOne: sanitizedData.plusOne,
        plusOneName: sanitizedData.plusOneName,
        plusOneMeal: sanitizedData.plusOneMeal,
        songRequest: sanitizedData.songRequest,
        notes: sanitizedData.notes,
        syncedToGuestList: false,
      })
      .returning();

    // Auto-sync to guest list page
    await syncResponseToGuestList(form.pageId, response);

    return NextResponse.json(
      { success: true },
      { 
        headers: { 
          "X-RateLimit-Remaining": remaining.toString() 
        }
      }
    );
  } catch (error) {
    console.error("RSVP submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    );
  }
}

async function syncResponseToGuestList(
  pageId: string, 
  response: typeof rsvpResponses.$inferSelect
) {
  try {
    // Get the guest list page
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId))
      .limit(1);

    if (!page) return;

    const fields = page.fields as Record<string, unknown>;
    const guests = (fields.guests as Record<string, unknown>[]) || [];

    // Add the new guest (data is already sanitized)
    const newGuest: Record<string, unknown> = {
      name: response.name,
      email: response.email || "",
      phone: response.phone || "",
      address: response.address || "",
      rsvp: response.attending ?? false,
      meal: response.mealChoice || "",
      dietaryRestrictions: response.dietaryRestrictions || "",
      plusOne: response.plusOne || false,
      plusOneName: response.plusOneName || "",
      notes: response.notes || "",
      giftReceived: false,
      thankYouSent: false,
    };

    guests.push(newGuest);

    // If they have a plus one, add that too
    if (response.plusOne && response.plusOneName) {
      const plusOneGuest: Record<string, unknown> = {
        name: response.plusOneName,
        email: "",
        phone: "",
        address: "",
        rsvp: response.attending ?? false,
        meal: response.plusOneMeal || "",
        dietaryRestrictions: "",
        plusOne: false,
        plusOneName: "",
        notes: `Guest of ${response.name}`,
        giftReceived: false,
        thankYouSent: false,
      };
      guests.push(plusOneGuest);
    }

    // Update the page
    await db
      .update(pages)
      .set({
        fields: { ...fields, guests },
        updatedAt: new Date(),
      })
      .where(eq(pages.id, pageId));

    // Mark response as synced
    await db
      .update(rsvpResponses)
      .set({ syncedToGuestList: true })
      .where(eq(rsvpResponses.id, response.id));

  } catch (error) {
    console.error("Failed to sync to guest list:", error);
  }
}
