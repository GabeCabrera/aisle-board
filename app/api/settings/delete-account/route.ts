import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants, users, planners, pages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPlannerByTenantId } from "@/lib/db/queries";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Delete in order: pages -> planner -> users -> tenant
    const planner = await getPlannerByTenantId(tenantId);
    
    if (planner) {
      // Delete all pages for this planner
      await db.delete(pages).where(eq(pages.plannerId, planner.id));
      
      // Delete the planner
      await db.delete(planners).where(eq(planners.id, planner.id));
    }

    // Delete all users for this tenant
    await db.delete(users).where(eq(users.tenantId, tenantId));

    // Delete the tenant
    await db.delete(tenants).where(eq(tenants.id, tenantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
