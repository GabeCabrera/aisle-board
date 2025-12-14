import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getSanityContext, getRecentSanityHistory, getSanityBenchmark } from "@/lib/data/sanity";
import { analyzeStressSignals } from "@/lib/algorithms/stress-signals";
import { db } from "@/lib/db";
import { weddingKernels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Get current sanity context and history in parallel
    const [context, history, kernel] = await Promise.all([
      getSanityContext(tenantId),
      getRecentSanityHistory(tenantId, 30),
      db.query.weddingKernels.findFirst({
        where: eq(weddingKernels.tenantId, tenantId),
      }),
    ]);

    // Calculate days to event
    const daysToEvent = kernel?.weddingDate
      ? Math.max(0, Math.ceil((new Date(kernel.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 365;

    // Get benchmark
    const benchmark = await getSanityBenchmark(context.currentScore, daysToEvent);

    return NextResponse.json({
      context,
      history,
      benchmark,
      daysToEvent,
    });
  } catch (error) {
    console.error("Error fetching sanity data:", error);
    return NextResponse.json(
      { error: "Failed to fetch sanity data" },
      { status: 500 }
    );
  }
}
