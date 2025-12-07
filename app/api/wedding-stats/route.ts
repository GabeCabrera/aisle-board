import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getTenantById, getPlannerByTenantId, getPagesByPlannerId } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

// Types
interface WeddingStats {
  daysUntil: number | null;
  isToday: boolean;
  coupleNames: string | null;
  weddingDate: string | null;
  guestStats: {
    total: number;
    confirmed: number;
    pending: number;
  };
  budgetStats: {
    totalBudget: number;
    totalPaid: number;
    totalRemaining: number;
  };
  taskStats: {
    total: number;
    done: number;
    completionPercent: number;
  };
  vendorStats: {
    total: number;
    booked: number;
  };
  hasOverview: boolean;
}

function getDaysUntilWedding(weddingDate: Date | null): { daysUntil: number | null; isToday: boolean } {
  if (!weddingDate) return { daysUntil: null, isToday: false };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const wedding = new Date(weddingDate);
  wedding.setHours(0, 0, 0, 0);
  const diff = Math.ceil((wedding.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { daysUntil: diff, isToday: diff === 0 };
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = await getTenantById(session.user.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const planner = await getPlannerByTenantId(tenant.id);
    const userPages = planner ? await getPagesByPlannerId(planner.id) : [];

    // Calculate days until wedding
    const { daysUntil, isToday } = getDaysUntilWedding(tenant.weddingDate);

    // Get cover page for couple names
    const coverPage = userPages.find(p => p.templateId === "cover");
    const coverFields = (coverPage?.fields || {}) as Record<string, unknown>;
    const coupleNames = (coverFields?.names as string) || null;

    // Check if user has overview page
    const hasOverview = userPages.some(p => p.templateId === "overview");

    // Guest stats
    const guestPage = userPages.find(p => p.templateId === "guest-list");
    const guestFields = (guestPage?.fields || {}) as Record<string, unknown>;
    const guests = Array.isArray(guestFields?.guests) ? guestFields.guests : [];
    const confirmedGuests = guests.filter((g: Record<string, unknown>) => g?.rsvp === true).length;

    // Budget stats
    const budgetPage = userPages.find(p => p.templateId === "budget");
    const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
    const totalBudget = parseFloat(String(budgetFields?.totalBudget || 0));
    const budgetItems = Array.isArray(budgetFields?.items) ? budgetFields.items : [];
    
    let totalPaid = 0;
    for (const item of budgetItems) {
      const itemObj = item as Record<string, unknown>;
      totalPaid += parseFloat(String(itemObj?.amountPaid || 0));
    }

    // Task stats
    const taskPage = userPages.find(p => p.templateId === "task-board");
    const taskFields = (taskPage?.fields || {}) as Record<string, unknown>;
    const tasks = Array.isArray(taskFields?.tasks) ? taskFields.tasks : [];
    const doneTasks = tasks.filter((t: Record<string, unknown>) => t?.status === "done").length;

    // Vendor stats
    const vendorPage = userPages.find(p => p.templateId === "vendor-contacts");
    const vendorFields = (vendorPage?.fields || {}) as Record<string, unknown>;
    const vendors = Array.isArray(vendorFields?.vendors) ? vendorFields.vendors : [];
    const bookedVendors = vendors.filter((v: Record<string, unknown>) => v?.depositPaid === true).length;

    const stats: WeddingStats = {
      daysUntil,
      isToday,
      coupleNames,
      weddingDate: tenant.weddingDate ? tenant.weddingDate.toISOString() : null,
      guestStats: {
        total: guests.length,
        confirmed: confirmedGuests,
        pending: guests.length - confirmedGuests,
      },
      budgetStats: {
        totalBudget,
        totalPaid,
        totalRemaining: totalBudget - totalPaid,
      },
      taskStats: {
        total: tasks.length,
        done: doneTasks,
        completionPercent: tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0,
      },
      vendorStats: {
        total: vendors.length,
        booked: bookedVendors,
      },
      hasOverview,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Wedding stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wedding stats" },
      { status: 500 }
    );
  }
}
