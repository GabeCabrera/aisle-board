import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getSavedVendors, saveVendor, unsaveVendor } from "@/lib/data/stem";
import { getTenantAccess, getPlanLimit } from "@/lib/subscription";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedVendors = await getSavedVendors(session.user.tenantId);
    return NextResponse.json(savedVendors);
  } catch (error) {
    console.error("Error fetching saved vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved vendors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vendorId, notes } = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId is required" },
        { status: 400 }
      );
    }

    // Check vendor limit for subscription tier
    const access = await getTenantAccess(session.user.tenantId);
    if (!access) {
      return NextResponse.json({ error: "Unable to verify account" }, { status: 403 });
    }

    const currentVendors = await getSavedVendors(session.user.tenantId);
    const vendorLimit = getPlanLimit(access.plan, "vendors", access.isLegacy);

    if (currentVendors.length >= vendorLimit) {
      return NextResponse.json(
        {
          error: `You've reached your vendor limit of ${vendorLimit} on the free plan. Upgrade to Stem for unlimited vendors!`,
          limitReached: true,
          currentCount: currentVendors.length,
          limit: vendorLimit,
        },
        { status: 403 }
      );
    }

    await saveVendor(session.user.tenantId, vendorId, notes);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving vendor:", error);
    return NextResponse.json(
      { error: "Failed to save vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vendorId } = await request.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId is required" },
        { status: 400 }
      );
    }

    await unsaveVendor(session.user.tenantId, vendorId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsaving vendor:", error);
    return NextResponse.json(
      { error: "Failed to unsave vendor" },
      { status: 500 }
    );
  }
}
