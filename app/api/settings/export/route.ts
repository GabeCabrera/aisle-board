import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getTenantById, getPlannerByTenantId, getPagesByPlannerId } from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all user data
    const tenant = await getTenantById(session.user.tenantId);
    const planner = await getPlannerByTenantId(session.user.tenantId);
    const pages = planner ? await getPagesByPlannerId(planner.id) : [];

    const exportData = {
      exportedAt: new Date().toISOString(),
      tenant: {
        displayName: tenant?.displayName,
        weddingDate: tenant?.weddingDate,
        plan: tenant?.plan,
      },
      planner: planner ? {
        createdAt: planner.createdAt,
        pages: pages.map((page) => ({
          title: page.title,
          templateId: page.templateId,
          fields: page.fields,
          position: page.position,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        })),
      } : null,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="aisle-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
