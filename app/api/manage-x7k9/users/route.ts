import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { users, tenants, planners, pages, rsvpForms, rsvpResponses, calendarEvents, googleCalendarConnections, scheduledEmails } from "@/lib/db/schema";
import { eq, desc, like, or, count, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/manage-x7k9/users - Get all users with pagination and search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const planFilter = searchParams.get("plan") || "";

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`),
          like(tenants.displayName, `%${search}%`)
        )
      );
    }
    
    if (planFilter === "free" || planFilter === "complete") {
      conditions.push(eq(tenants.plan, planFilter));
    }

    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(users);
    const total = totalResult?.count || 0;

    // Get paginated results
    const results = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isTestAccount: users.isTestAccount,
        emailOptIn: users.emailOptIn,
        unsubscribedAt: users.unsubscribedAt,
        createdAt: users.createdAt,
        tenant: {
          id: tenants.id,
          displayName: tenants.displayName,
          slug: tenants.slug,
          plan: tenants.plan,
          weddingDate: tenants.weddingDate,
          onboardingComplete: tenants.onboardingComplete,
        },
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      users: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to get users" },
      { status: 500 }
    );
  }
}

// PATCH /api/manage-x7k9/users - Update user (toggle test account status)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, isTestAccount } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ isTestAccount, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/manage-x7k9/users - Delete user and their tenant
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const tenantId = searchParams.get("tenantId");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "User ID and Tenant ID required" }, { status: 400 });
    }

    // Delete in order to respect foreign key constraints
    // Most tables cascade from tenants, but let's be explicit
    
    // Delete scheduled emails first
    await db.delete(scheduledEmails).where(eq(scheduledEmails.tenantId, tenantId));
    
    // Delete calendar-related data
    await db.delete(googleCalendarConnections).where(eq(googleCalendarConnections.tenantId, tenantId));
    await db.delete(calendarEvents).where(eq(calendarEvents.tenantId, tenantId));
    
    // Get planner to delete pages
    const [planner] = await db.select().from(planners).where(eq(planners.tenantId, tenantId));
    
    if (planner) {
      // Delete RSVP responses and forms
      const rsvpFormsList = await db.select().from(rsvpForms).where(eq(rsvpForms.tenantId, tenantId));
      for (const form of rsvpFormsList) {
        await db.delete(rsvpResponses).where(eq(rsvpResponses.formId, form.id));
      }
      await db.delete(rsvpForms).where(eq(rsvpForms.tenantId, tenantId));
      
      // Delete pages
      await db.delete(pages).where(eq(pages.plannerId, planner.id));
      
      // Delete planner
      await db.delete(planners).where(eq(planners.tenantId, tenantId));
    }

    // Delete user (password reset tokens cascade)
    await db.delete(users).where(eq(users.id, userId));
    
    // Delete tenant
    await db.delete(tenants).where(eq(tenants.id, tenantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
