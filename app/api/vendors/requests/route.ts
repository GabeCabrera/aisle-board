import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { vendorRequests } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

// POST - Submit a vendor request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId;

    const body = await request.json();
    const { vendorName, category, city, state, website, notes, searchQuery } = body;

    if (!vendorName || !category) {
      return NextResponse.json(
        { error: "Vendor name and category are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(vendorRequests)
      .values({
        tenantId: tenantId || null,
        vendorName,
        category,
        city,
        state,
        website,
        notes,
        searchQuery,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ success: true, request: created });
  } catch (error) {
    console.error("Error creating vendor request:", error);
    return NextResponse.json(
      { error: "Failed to create vendor request" },
      { status: 500 }
    );
  }
}

// GET - Get all vendor requests (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await db.query.vendorRequests.findMany({
      orderBy: [desc(vendorRequests.createdAt)],
      with: {
        tenant: {
          columns: {
            displayName: true,
          },
        },
        vendorProfile: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching vendor requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor requests" },
      { status: 500 }
    );
  }
}
