import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: "ok" | "error"; latencyMs?: number; error?: string };
    environment: { status: "ok" | "error"; missing?: string[] };
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    checks: {
      database: { status: "ok" },
      environment: { status: "ok" },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    health.checks.database.latencyMs = Date.now() - dbStart;
  } catch (error) {
    health.status = "unhealthy";
    health.checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Database connection failed",
    };
  }

  // Check critical environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "ANTHROPIC_API_KEY",
    "STRIPE_SECRET_KEY",
  ];

  const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingEnvVars.length > 0) {
    health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
    health.checks.environment = {
      status: "error",
      missing: missingEnvVars,
    };
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
