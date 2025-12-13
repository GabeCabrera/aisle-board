import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { getUserByEmail, upgradeTenantByUserEmail } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

// POST /api/manage-x7k9/users/upgrade - Upgrade a user to complete plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await isAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const tenant = await upgradeTenantByUserEmail(email);
    if (!tenant) {
      return NextResponse.json(
        { error: "Failed to upgrade user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Upgraded ${email} to Complete plan`,
      tenant: {
        id: tenant.id,
        displayName: tenant.displayName,
        plan: tenant.plan,
      }
    });
  } catch (error) {
    console.error("Upgrade user error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade user" },
      { status: 500 }
    );
  }
}
