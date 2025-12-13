import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { getAllPromoCodes, createPromoCode, updatePromoCode } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

// GET /api/admin/promo-codes - Get all promo codes
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const codes = await getAllPromoCodes();
    return NextResponse.json({ codes });
  } catch (error) {
    console.error("Get promo codes error:", error);
    return NextResponse.json(
      { error: "Failed to get promo codes" },
      { status: 500 }
    );
  }
}

// POST /api/admin/promo-codes - Create a new promo code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, description, type, value, maxUses, expiresAt } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const newCode = await createPromoCode({
      code: code.toUpperCase().trim(),
      description: description || null,
      type: type || "percentage",
      value: type === "free" ? 100 : (value || 0),
      maxUses: maxUses ? parseInt(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    });

    return NextResponse.json({ code: newCode });
  } catch (error) {
    console.error("Create promo code error:", error);
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "A promo code with this code already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create promo code" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/promo-codes - Update a promo code
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Code ID is required" },
        { status: 400 }
      );
    }

    // Clean up updates
    const cleanUpdates: Record<string, unknown> = {};
    if (updates.description !== undefined) cleanUpdates.description = updates.description;
    if (updates.type !== undefined) cleanUpdates.type = updates.type;
    if (updates.value !== undefined) cleanUpdates.value = updates.value;
    if (updates.maxUses !== undefined) cleanUpdates.maxUses = updates.maxUses ? parseInt(updates.maxUses) : null;
    if (updates.expiresAt !== undefined) cleanUpdates.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null;
    if (updates.isActive !== undefined) cleanUpdates.isActive = updates.isActive;

    const updatedCode = await updatePromoCode(id, cleanUpdates);

    if (!updatedCode) {
      return NextResponse.json(
        { error: "Promo code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: updatedCode });
  } catch (error) {
    console.error("Update promo code error:", error);
    return NextResponse.json(
      { error: "Failed to update promo code" },
      { status: 500 }
    );
  }
}
