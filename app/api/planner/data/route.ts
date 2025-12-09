import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { pages, planners, weddingKernels, weddingDecisions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/planner/data
 * 
 * Returns all wedding planning data for the current user.
 * Used by the read-only dashboard pages (budget, guests, vendors, timeline).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Get kernel (wedding details)
    const kernel = await db.query.weddingKernels.findFirst({
      where: eq(weddingKernels.tenantId, tenantId),
    });

    // Get planner and all pages
    const planner = await db.query.planners.findFirst({
      where: eq(planners.tenantId, tenantId),
    });

    let budgetData: { totalBudget: number; items: unknown[] } = { totalBudget: 0, items: [] };
    let guestData: { guests: unknown[] } = { guests: [] };
    let vendorData: { vendors: unknown[] } = { vendors: [] };
    let timelineData: { events: unknown[] } = { events: [] };
    let taskData: { tasks: unknown[] } = { tasks: [] };
    let seatingData: { tables: unknown[] } = { tables: [] };

    if (planner) {
      const allPages = await db.query.pages.findMany({
        where: eq(pages.plannerId, planner.id),
      });

      for (const page of allPages) {
        const fields = (page.fields as Record<string, unknown>) || {};
        
        switch (page.templateId) {
          case "budget":
            // totalBudget is stored as a string, must parse
            const rawBudget = fields.totalBudget;
            budgetData = {
              totalBudget: typeof rawBudget === 'string' ? parseFloat(rawBudget) || 0 : (rawBudget as number) || 0,
              items: Array.isArray(fields.items) ? fields.items : [],
            };
            break;
          case "guest-list":
            guestData = {
              guests: Array.isArray(fields.guests) ? fields.guests : [],
            };
            break;
          case "vendor-contacts":
            vendorData = {
              vendors: Array.isArray(fields.vendors) ? fields.vendors : [],
            };
            break;
          case "day-of-schedule":
            timelineData = {
              events: Array.isArray(fields.events) ? fields.events : [],
            };
            break;
          case "task-board":
            taskData = {
              tasks: Array.isArray(fields.tasks) ? fields.tasks : [],
            };
            break;
          case "seating-chart":
            seatingData = {
              tables: Array.isArray(fields.tables) ? fields.tables : [],
            };
            break;
        }
      }
    }

    // Get decisions
    const decisions = await db.query.weddingDecisions.findMany({
      where: eq(weddingDecisions.tenantId, tenantId),
    });

    // Calculate decision progress
    const total = decisions.length;
    const locked = decisions.filter(d => d.status === "locked").length;
    const decided = decisions.filter(d => d.status === "decided" || d.status === "locked").length;
    const researching = decisions.filter(d => d.status === "researching").length;
    const notStarted = decisions.filter(d => d.status === "not_started" && !d.isSkipped).length;

    // Calculate budget stats
    // NOTE: Budget values are stored as STRINGS in the database, must parseFloat
    // AND they are stored in cents, so we must divide by 100
    const rawBudgetItems = budgetData.items as Array<{
      id: string;
      category: string;
      vendor?: string;
      totalCost: string | number;
      amountPaid: string | number;
      notes?: string;
    }>;
    
    const budgetItems = rawBudgetItems.map(item => {
      const cost = typeof item.totalCost === 'string' ? parseFloat(item.totalCost) : item.totalCost;
      const paid = typeof item.amountPaid === 'string' ? parseFloat(item.amountPaid) : item.amountPaid;
      return {
        ...item,
        totalCost: (cost || 0) / 100,
        amountPaid: (paid || 0) / 100,
      };
    });
    
    const totalSpent = budgetItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalPaid = budgetItems.reduce((sum, item) => sum + item.amountPaid, 0);
    const remainingBalance = totalSpent - totalPaid;

    // Calculate guest stats
    const guests = guestData.guests as Array<{
      id: string;
      name: string;
      email?: string;
      side?: string;
      group?: string;
      plusOne?: boolean;
      rsvp?: string;
      dietaryRestrictions?: string;
      tableNumber?: number;
    }>;

    const guestStats = {
      total: guests.length,
      confirmed: guests.filter(g => g.rsvp === "confirmed" || g.rsvp === "attending").length,
      declined: guests.filter(g => g.rsvp === "declined").length,
      pending: guests.filter(g => g.rsvp === "pending" || !g.rsvp).length,
      withPlusOnes: guests.filter(g => g.plusOne).length,
      brideSide: guests.filter(g => g.side === "bride").length,
      groomSide: guests.filter(g => g.side === "groom").length,
      both: guests.filter(g => g.side === "both" || !g.side).length,
    };

    // Calculate Seating Chart
    const tables = (seatingData.tables as Array<{
      id: string;
      name: string;
      capacity: number;
      tableNumber: number;
    }>).map(table => {
      const seatedGuests = guests.filter(g => g.tableNumber === table.tableNumber);
      return {
        ...table,
        guests: seatedGuests,
        count: seatedGuests.length,
        isFull: seatedGuests.length >= table.capacity
      };
    });

    const unseatedGuests = guests.filter(g => g.tableNumber === undefined || g.tableNumber === null);
    
    const seatingStats = {
      totalGuests: guests.length,
      seatedCount: guests.length - unseatedGuests.length,
      unseatedCount: unseatedGuests.length,
      tableCount: tables.length
    };

    // Calculate vendor stats
    const vendors = (vendorData.vendors as Array<{
      id: string;
      name: string;
      category: string;
      status?: string;
      cost?: number;
      depositPaid?: number;
      phone?: string;
      email?: string;
      website?: string;
      notes?: string;
    }>).filter(v => {
      // Filter out corrupted entries
      const isCorrupt = 
        !v ||
        !v.id || 
        v.id === "undefined" || 
        !v.name || 
        v.name === "undefined" ||
        v.name === "0";
      return !isCorrupt;
    });

    const vendorStats = {
      total: vendors.length,
      booked: vendors.filter(v => v.status === "booked" || v.status === "confirmed").length,
      researching: vendors.filter(v => v.status === "researching").length,
      totalCost: vendors.reduce((sum, v) => sum + ((v.cost || 0) / 100), 0),
      totalDeposits: vendors.reduce((sum, v) => sum + ((v.depositPaid || 0) / 100), 0),
    };

    // Normalize vendor list costs to dollars
    const normalizedVendors = vendors.map(v => ({
      ...v,
      cost: v.cost ? v.cost / 100 : 0,
      depositPaid: v.depositPaid ? v.depositPaid / 100 : 0,
      price: v.cost ? v.cost / 100 : 0 // handle legacy naming
    }));

    // Days until wedding
    // kernel.weddingDate is a Date object from the database
    const daysUntil = kernel?.weddingDate
      ? Math.ceil((new Date(kernel.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return NextResponse.json({
      kernel: kernel || null,
      
      budget: {
        // Use kernel budget (cents) as authority, convert to dollars. Fallback to page data.
        total: kernel?.budgetTotal 
          ? kernel.budgetTotal / 100 
          : (budgetData.totalBudget / 100),
        spent: totalSpent,
        paid: totalPaid,
        remaining: remainingBalance,
        items: budgetItems,
        percentUsed: (kernel?.budgetTotal ? kernel.budgetTotal / 100 : (budgetData.totalBudget / 100)) > 0 
          ? Math.round((totalSpent / (kernel?.budgetTotal ? kernel.budgetTotal / 100 : (budgetData.totalBudget / 100))) * 100) 
          : 0,
      },
      
      guests: {
        list: guests,
        stats: guestStats,
      },

      seating: {
        tables,
        unseated: unseatedGuests,
        stats: seatingStats
      },
      
      vendors: {
        list: normalizedVendors,
        stats: vendorStats,
      },
      
      timeline: {
        events: timelineData.events,
      },
      
      tasks: {
        list: taskData.tasks,
        completed: (taskData.tasks as Array<{ status?: string }>).filter(t => t.status === "done").length,
        pending: (taskData.tasks as Array<{ status?: string }>).filter(t => t.status !== "done").length,
      },
      
      decisions: {
        list: decisions,
        progress: {
          total,
          locked,
          decided,
          researching,
          notStarted,
          percentComplete: total > 0 ? Math.round((decided / total) * 100) : 0,
        },
      },
      
      summary: {
        daysUntil,
        coupleNames: Array.isArray(kernel?.names) && kernel.names.length === 2 
          ? `${kernel.names[0]} & ${kernel.names[1]}` 
          : null,
        weddingDate: kernel?.weddingDate || null,
        vibe: Array.isArray(kernel?.vibe) ? kernel.vibe : [],
        vendorsBooked: Array.isArray(kernel?.vendorsBooked) ? kernel.vendorsBooked : [],
      },
    });

  } catch (error) {
    console.error("Planner data error:", error);
    return NextResponse.json(
      { error: "Failed to load planner data" },
      { status: 500 }
    );
  }
}
