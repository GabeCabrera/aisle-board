import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { pages, planners } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

interface BudgetItem {
  id: string;
  category: string;
  vendor?: string;
  totalCost: number; // in cents
  amountPaid: number; // in cents
  notes?: string;
  createdAt: string;
}

interface BudgetFields {
  totalBudget?: number;
  items?: BudgetItem[];
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
 * POST /api/budget/items - Create a new budget item
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category, vendor, totalCost, amountPaid, notes } = body;

    // Validate required fields
    if (!category || totalCost === undefined) {
      return NextResponse.json(
        { error: "Category and totalCost are required" },
        { status: 400 }
      );
    }

    const budgetPage = await getOrCreateBudgetPage(session.user.tenantId);
    const fields = budgetPage.fields as BudgetFields;
    const items = fields.items || [];

    // Create new item
    const newItem: BudgetItem = {
      id: nanoid(12),
      category,
      vendor: vendor || undefined,
      totalCost: Math.round(Number(totalCost) * 100), // Convert to cents
      amountPaid: Math.round(Number(amountPaid || 0) * 100), // Convert to cents
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    // Add to items array
    items.push(newItem);

    // Update the page
    await db
      .update(pages)
      .set({
        fields: { ...fields, items },
        updatedAt: new Date(),
      })
      .where(eq(pages.id, budgetPage.id));

    // Return item with costs in dollars for display
    return NextResponse.json({
      item: {
        ...newItem,
        totalCost: newItem.totalCost / 100,
        amountPaid: newItem.amountPaid / 100,
      },
    });
  } catch (error) {
    console.error("Budget item create error:", error);
    return NextResponse.json(
      { error: "Failed to create budget item" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/budget/items - Get all budget items (alternative to planner/data)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const budgetPage = await getOrCreateBudgetPage(session.user.tenantId);
    const fields = budgetPage.fields as BudgetFields;
    const items = (fields.items || []).map(item => ({
      ...item,
      totalCost: item.totalCost / 100,
      amountPaid: item.amountPaid / 100,
    }));

    return NextResponse.json({
      items,
      totalBudget: (fields.totalBudget || 0) / 100,
    });
  } catch (error) {
    console.error("Budget items fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget items" },
      { status: 500 }
    );
  }
}
