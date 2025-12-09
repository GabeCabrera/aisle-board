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
 * Returns wedding planning data for the current user.
 * Accepts an optional 'sections' query parameter (comma-separated) to fetch specific data subsets.
 * Example: /api/planner/data?sections=budget,guests,kernel
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const requestedSections = searchParams.get("sections")?.split(",").map(s => s.trim()) || [
      "kernel", "budget", "guests", "seating", "vendors", "timeline", "tasks", "decisions", "summary"
    ];

    const result: Record<string, any> = {};

    let kernel: any = null;
    if (requestedSections.includes("kernel") || requestedSections.includes("summary")) {
      kernel = await db.query.weddingKernels.findFirst({
        where: eq(weddingKernels.tenantId, tenantId),
      });
      result.kernel = kernel || null;
    }

    let planner: any = null;
    let allPages: any[] = [];

    // Fetch planner and all pages if any page-dependent sections are requested
    const pageDependentSections = ["budget", "guests", "vendors", "timeline", "tasks", "seating"];
    if (requestedSections.some(section => pageDependentSections.includes(section))) {
      planner = await db.query.planners.findFirst({
        where: eq(planners.tenantId, tenantId),
      });

      if (planner) {
        allPages = await db.query.pages.findMany({
          where: eq(pages.plannerId, planner.id),
        });
      }
    }

    let budgetData: { totalBudget: number; items: unknown[] } = { totalBudget: 0, items: [] };
    let guestData: { guests: unknown[] } = { guests: [] };
    let vendorData: { vendors: unknown[] } = { vendors: [] };
    let timelineData: { events: unknown[] } = { events: [] };
    let taskData: { tasks: unknown[] } = { tasks: [] };
    let seatingData: { tables: unknown[] } = { tables: [] };
    
    // Process pages data once
    for (const page of allPages) {
      const fields = (page.fields as Record<string, unknown>) || {};
      
      switch (page.templateId) {
        case "budget":
          if (requestedSections.includes("budget")) {
            const rawBudget = fields.totalBudget;
            budgetData = {
              totalBudget: typeof rawBudget === 'string' ? parseFloat(rawBudget) || 0 : (rawBudget as number) || 0,
              items: Array.isArray(fields.items) ? fields.items : [],
            };
          }
          break;
        case "guest-list":
          if (requestedSections.includes("guests") || requestedSections.includes("seating")) {
            guestData = {
              guests: Array.isArray(fields.guests) ? fields.guests : [],
            };
          }
          break;
        case "vendor-contacts":
          if (requestedSections.includes("vendors")) {
            vendorData = {
              vendors: Array.isArray(fields.vendors) ? fields.vendors : [],
            };
          }
          break;
        case "day-of-schedule":
          if (requestedSections.includes("timeline")) {
            timelineData = {
              events: Array.isArray(fields.events) ? fields.events : [],
            };
          }
          break;
        case "task-board":
          if (requestedSections.includes("tasks")) {
            taskData = {
              tasks: Array.isArray(fields.tasks) ? fields.tasks : [],
            };
          }
          break;
        case "seating-chart":
          if (requestedSections.includes("seating")) {
            seatingData = {
              tables: Array.isArray(fields.tables) ? fields.tables : [],
            };
          }
          break;
      }
    }

    let decisions: any[] = [];
    if (requestedSections.includes("decisions")) {
      decisions = await db.query.weddingDecisions.findMany({
        where: eq(weddingDecisions.tenantId, tenantId),
      });
    }

    // --- Data processing and aggregation for requested sections ---

    // Budget
    if (requestedSections.includes("budget")) {
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

      result.budget = {
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
      };
    }

    // Guests
    let guests: any[] = [];
    let guestStats: any = {};
    if (requestedSections.includes("guests") || requestedSections.includes("seating")) {
      guests = guestData.guests as Array<{
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

      guestStats = {
        total: guests.length,
        confirmed: guests.filter(g => g.rsvp === "confirmed" || g.rsvp === "attending").length,
        declined: guests.filter(g => g.rsvp === "declined").length,
        pending: guests.filter(g => g.rsvp === "pending" || !g.rsvp).length,
        withPlusOnes: guests.filter(g => g.plusOne).length,
        brideSide: guests.filter(g => g.side === "bride").length,
        groomSide: guests.filter(g => g.side === "groom").length,
        both: guests.filter(g => g.side === "both" || !g.side).length,
      };

      if (requestedSections.includes("guests")) {
        result.guests = {
          list: guests,
          stats: guestStats,
        };
      }
    }
    
    // Seating
    if (requestedSections.includes("seating")) {
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

      result.seating = {
        tables,
        unseated: unseatedGuests,
        stats: seatingStats
      };
    }

    // Vendors
    if (requestedSections.includes("vendors")) {
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

      result.vendors = {
        list: normalizedVendors,
        stats: vendorStats,
      };
    }

    // Timeline
    if (requestedSections.includes("timeline")) {
      result.timeline = {
        events: timelineData.events,
      };
    }

    // Tasks
    if (requestedSections.includes("tasks")) {
      result.tasks = {
        list: taskData.tasks,
        completed: (taskData.tasks as Array<{ status?: string }>).filter(t => t.status === "done").length,
        pending: (taskData.tasks as Array<{ status?: string }>).filter(t => t.status !== "done").length,
      };
    }

    // Decisions
    if (requestedSections.includes("decisions")) {
      const totalDecisions = decisions.length;
      const lockedDecisions = decisions.filter(d => d.status === "locked").length;
      const decidedDecisions = decisions.filter(d => d.status === "decided" || d.status === "locked").length;
      const researchingDecisions = decisions.filter(d => d.status === "researching").length;
      const notStartedDecisions = decisions.filter(d => d.status === "not_started" && !d.isSkipped).length;

      result.decisions = {
        list: decisions,
        progress: {
          total: totalDecisions,
          locked: lockedDecisions,
          decided: decidedDecisions,
          researching: researchingDecisions,
          notStarted: notStartedDecisions,
          percentComplete: totalDecisions > 0 ? Math.round((decidedDecisions / totalDecisions) * 100) : 0,
        },
      };
    }

    // Summary
    if (requestedSections.includes("summary")) {
      const daysUntil = kernel?.weddingDate
        ? Math.ceil((new Date(kernel.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      result.summary = {
        daysUntil,
        coupleNames: Array.isArray(kernel?.names) && kernel.names.length === 2 
          ? `${kernel.names[0]} & ${kernel.names[1]}` 
          : null,
        weddingDate: kernel?.weddingDate || null,
        vibe: Array.isArray(kernel?.vibe) ? kernel.vibe : [],
        vendorsBooked: Array.isArray(kernel?.vendorsBooked) ? kernel.vendorsBooked : [],
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Planner data error:", error);
    return NextResponse.json(
      { error: "Failed to load planner data" },
      { status: 500 }
    );
  }
}
