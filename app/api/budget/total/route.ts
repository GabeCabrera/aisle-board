import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { pages, planners, weddingKernels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface BudgetFields {
  totalBudget?: number;
  items?: unknown[];
}

// Get or create the budget page for a tenant
async function getOrCreateBudgetPage(tenantId: string) {
  // Get the planner
  let planner = await db.query.planners.findFirst({
    where: eq(planners.tenantId, tenantId),
  });

  // Create planner if doesn't exist
  if (!planner) {
    const [newPlanner] = await db
      .insert(planners)
      .values({ tenantId })
      .returning();
    planner = newPlanner;
  }

  // Get the budget page
  let budgetPage = await db.query.pages.findFirst({
    where: and(
      eq(pages.plannerId, planner.id),
      eq(pages.templateId, "budget")
    ),
  });

  // Create budget page if doesn't exist
  if (!budgetPage) {
    const [newPage] = await db
      .insert(pages)
      .values({
        plannerId: planner.id,
        templateId: "budget",
        title: "Budget",
        position: 0,
        fields: { totalBudget: 0, items: [] },
      })
      .returning();
    budgetPage = newPage;
  }

  return budgetPage;
}

/**
 * PUT /api/budget/total - Set the total budget
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { totalBudget } = body;

    if (totalBudget === undefined || totalBudget < 0) {
      return NextResponse.json(
        { error: "Valid totalBudget is required" },
        { status: 400 }
      );
    }

    const totalBudgetCents = Math.round(Number(totalBudget) * 100);

    // Update budget page
    const budgetPage = await getOrCreateBudgetPage(session.user.tenantId);
    const fields = budgetPage.fields as BudgetFields;

    await db
      .update(pages)
      .set({
        fields: { ...fields, totalBudget: totalBudgetCents },
        updatedAt: new Date(),
      })
      .where(eq(pages.id, budgetPage.id));

    // Also update wedding kernel if it exists (for AI context)
    await db
      .update(weddingKernels)
      .set({
        budgetTotal: totalBudgetCents,
        updatedAt: new Date(),
      })
      .where(eq(weddingKernels.tenantId, session.user.tenantId));

    return NextResponse.json({
      totalBudget: totalBudgetCents / 100,
    });
  } catch (error) {
    console.error("Budget total update error:", error);
    return NextResponse.json(
      { error: "Failed to update total budget" },
      { status: 500 }
    );
  }
}
