import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { pages, planners } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

// Get the budget page for a tenant
async function getBudgetPage(tenantId: string) {
  const planner = await db.query.planners.findFirst({
    where: eq(planners.tenantId, tenantId),
  });

  if (!planner) return null;

  const budgetPage = await db.query.pages.findFirst({
    where: and(
      eq(pages.plannerId, planner.id),
      eq(pages.templateId, "budget")
    ),
  });

  return budgetPage;
}

/**
 * PUT /api/budget/items/[id] - Update a budget item
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { category, vendor, totalCost, amountPaid, notes } = body;

    const budgetPage = await getBudgetPage(session.user.tenantId);
    
    if (!budgetPage) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const fields = budgetPage.fields as BudgetFields;
    const items = fields.items || [];
    
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update the item
    const updatedItem: BudgetItem = {
      ...items[itemIndex],
      category: category ?? items[itemIndex].category,
      vendor: vendor !== undefined ? (vendor || undefined) : items[itemIndex].vendor,
      totalCost: totalCost !== undefined ? Math.round(Number(totalCost) * 100) : items[itemIndex].totalCost,
      amountPaid: amountPaid !== undefined ? Math.round(Number(amountPaid) * 100) : items[itemIndex].amountPaid,
      notes: notes !== undefined ? (notes || undefined) : items[itemIndex].notes,
    };

    items[itemIndex] = updatedItem;

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
        ...updatedItem,
        totalCost: updatedItem.totalCost / 100,
        amountPaid: updatedItem.amountPaid / 100,
      },
    });
  } catch (error) {
    console.error("Budget item update error:", error);
    return NextResponse.json(
      { error: "Failed to update budget item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/budget/items/[id] - Delete a budget item
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const budgetPage = await getBudgetPage(session.user.tenantId);
    
    if (!budgetPage) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const fields = budgetPage.fields as BudgetFields;
    const items = fields.items || [];
    
    const itemIndex = items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Remove the item
    items.splice(itemIndex, 1);

    // Update the page
    await db
      .update(pages)
      .set({
        fields: { ...fields, items },
        updatedAt: new Date(),
      })
      .where(eq(pages.id, budgetPage.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Budget item delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete budget item" },
      { status: 500 }
    );
  }
}
