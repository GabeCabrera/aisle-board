import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { plan } = await request.json();

    if (!["free", "complete"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Update tenant plan
    await db
      .update(tenants)
      .set({
        plan,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, session.user.tenantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plan selection error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
