import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rsvpResponses, rsvpForms } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formId = searchParams.get("formId");

    if (!formId) {
      return NextResponse.json({ error: "formId required" }, { status: 400 });
    }

    // Verify the form belongs to this tenant
    const form = await db.query.rsvpForms.findFirst({
      where: and(
        eq(rsvpForms.id, formId),
        eq(rsvpForms.tenantId, session.user.tenantId)
      ),
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Fetch responses
    const responses = await db.query.rsvpResponses.findMany({
      where: eq(rsvpResponses.formId, formId),
      orderBy: [desc(rsvpResponses.createdAt)],
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error fetching RSVP responses:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
