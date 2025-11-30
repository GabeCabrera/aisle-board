import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import { getUserByEmail } from "@/lib/db/queries";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Generate a unique slug for the tenant (using nanoid for slug only)
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${nanoid(6)}`;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Use proper UUIDs for database IDs
    const tenantId = randomUUID();
    const userId = randomUUID();

    // Create tenant first
    await db.insert(tenants).values({
      id: tenantId,
      slug,
      displayName: name,
      plan: "free",
      onboardingComplete: false,
    });

    // Create user
    await db.insert(users).values({
      id: userId,
      tenantId,
      email,
      name,
      passwordHash,
      role: "owner",
      mustChangePassword: false,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId,
      tenantId,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
