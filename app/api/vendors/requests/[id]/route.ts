import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { vendorRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH - Update a vendor request (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes, vendorProfileId } = body;

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (vendorProfileId !== undefined) updates.vendorProfileId = vendorProfileId;

    // If marking as resolved (added/declined), set resolvedAt
    if (status === "added" || status === "declined") {
      updates.resolvedAt = new Date();
    }

    const [updated] = await db
      .update(vendorRequests)
      .set(updates)
      .where(eq(vendorRequests.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Vendor request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Error updating vendor request:", error);
    return NextResponse.json(
      { error: "Failed to update vendor request" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a vendor request (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await db.delete(vendorRequests).where(eq(vendorRequests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vendor request:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor request" },
      { status: 500 }
    );
  }
}
