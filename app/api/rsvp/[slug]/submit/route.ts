import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rsvpForms, rsvpResponses, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // Get the RSVP form
    const [form] = await db
      .select()
      .from(rsvpForms)
      .where(eq(rsvpForms.slug, slug))
      .limit(1);

    if (!form || !form.isActive) {
      return NextResponse.json(
        { error: "RSVP form not found or inactive" },
        { status: 404 }
      );
    }

    // Insert the response
    const [response] = await db
      .insert(rsvpResponses)
      .values({
        formId: form.id,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        attending: body.attending,
        mealChoice: body.mealChoice || null,
        dietaryRestrictions: body.dietaryRestrictions || null,
        plusOne: body.plusOne || false,
        plusOneName: body.plusOneName || null,
        plusOneMeal: body.plusOneMeal || null,
        songRequest: body.songRequest || null,
        notes: body.notes || null,
        syncedToGuestList: false,
      })
      .returning();

    // Auto-sync to guest list page
    await syncResponseToGuestList(form.pageId, response);

    return NextResponse.json({ success: true, id: response.id });
  } catch (error) {
    console.error("RSVP submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit RSVP" },
      { status: 500 }
    );
  }
}

async function syncResponseToGuestList(pageId: string, response: typeof rsvpResponses.$inferSelect) {
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

    // Add the new guest
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
