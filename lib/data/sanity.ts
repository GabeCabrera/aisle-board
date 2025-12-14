/**
 * SANITY DATA LAYER
 * Functions for recording and querying sanity history, trends, and benchmarks.
 */

import { db } from "@/lib/db";
import { eq, and, gte, desc, sql, avg } from "drizzle-orm";
import { sanityHistory, weddingKernels, tenants } from "@/lib/db/schema";
import {
  analyzeStressSignals,
  getStressStatusMessage,
  type StressSignals,
} from "@/lib/algorithms/stress-signals";

// ============================================================================
// TYPES
// ============================================================================

export interface SanitySnapshot {
  id: string;
  score: number;
  inferredFamilyFriction: number;
  stressCategory: string;
  primaryStressors: string[];
  createdAt: Date;
}

export interface SanityTrend {
  data: Array<{ date: Date; score: number }>;
  change7Days: number;
  change30Days: number;
  direction: "improving" | "stable" | "worsening";
}

export interface SanityBenchmark {
  percentile: number; // e.g., 72 = "calmer than 72% of couples"
  averageAtStage: number; // Average sanity at their days-to-event
  topStressorAtStage: string; // Most common stressor at this stage
}

export interface SanityContext {
  currentScore: number;
  stressCategory: string;
  inferredFamilyFriction: number;
  trend: SanityTrend | null;
  statusMessage: string;
  primaryStressors: string[];
  lastUpdated: Date | null;
}

// ============================================================================
// RECORD SANITY SNAPSHOT
// ============================================================================

export async function recordSanitySnapshot(
  tenantId: string,
  triggerType: "message" | "daily" | "activity_spike" | "milestone"
): Promise<SanitySnapshot | null> {
  try {
    // Analyze current stress signals
    const signals = await analyzeStressSignals(tenantId);

    // Check if we should skip (avoid recording too frequently)
    const shouldRecord = await shouldRecordSnapshot(tenantId, triggerType);
    if (!shouldRecord) {
      return null;
    }

    // Insert snapshot
    const [snapshot] = await db
      .insert(sanityHistory)
      .values({
        tenantId,
        sanityScore: Math.round(signals.computed.overallStressScore),
        inferredFamilyFriction: signals.computed.inferredFamilyFriction,
        signals: signals as unknown as Record<string, unknown>,
        triggerType,
        primaryStressors: signals.computed.primaryStressors,
      })
      .returning();

    return {
      id: snapshot.id,
      score: snapshot.sanityScore,
      inferredFamilyFriction: snapshot.inferredFamilyFriction ?? 2,
      stressCategory: signals.computed.stressCategory,
      primaryStressors: signals.computed.primaryStressors,
      createdAt: snapshot.createdAt,
    };
  } catch (error) {
    console.error("Error recording sanity snapshot:", error);
    return null;
  }
}

async function shouldRecordSnapshot(
  tenantId: string,
  triggerType: string
): Promise<boolean> {
  // Get most recent snapshot
  const recent = await db
    .select()
    .from(sanityHistory)
    .where(eq(sanityHistory.tenantId, tenantId))
    .orderBy(desc(sanityHistory.createdAt))
    .limit(1);

  if (!recent[0]) {
    return true; // No history, always record
  }

  const lastSnapshot = recent[0];
  const hoursSinceLastSnapshot =
    (Date.now() - lastSnapshot.createdAt.getTime()) / (1000 * 60 * 60);

  // Different frequency rules by trigger type
  switch (triggerType) {
    case "message":
      // Max once per hour for chat-triggered snapshots
      return hoursSinceLastSnapshot >= 1;
    case "activity_spike":
      // Max once per 4 hours for activity spikes
      return hoursSinceLastSnapshot >= 4;
    case "milestone":
      // Always record milestones
      return true;
    case "daily":
      // Max once per 20 hours for daily snapshots
      return hoursSinceLastSnapshot >= 20;
    default:
      return hoursSinceLastSnapshot >= 1;
  }
}

// ============================================================================
// GET SANITY TREND
// ============================================================================

export async function getSanityTrend(tenantId: string): Promise<SanityTrend | null> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const snapshots = await db
    .select()
    .from(sanityHistory)
    .where(
      and(
        eq(sanityHistory.tenantId, tenantId),
        gte(sanityHistory.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(sanityHistory.createdAt);

  if (snapshots.length < 2) {
    return null; // Not enough data for trend
  }

  // Build trend data
  const data = snapshots.map((s) => ({
    date: s.createdAt,
    score: s.sanityScore,
  }));

  // Calculate changes
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSnapshots = snapshots.filter((s) => s.createdAt >= sevenDaysAgo);
  const olderSnapshots = snapshots.filter((s) => s.createdAt < sevenDaysAgo);

  const currentAvg =
    recentSnapshots.length > 0
      ? recentSnapshots.reduce((sum, s) => sum + s.sanityScore, 0) / recentSnapshots.length
      : snapshots[snapshots.length - 1].sanityScore;

  const oldAvg =
    olderSnapshots.length > 0
      ? olderSnapshots.reduce((sum, s) => sum + s.sanityScore, 0) / olderSnapshots.length
      : snapshots[0].sanityScore;

  const change7Days = currentAvg - oldAvg;
  const change30Days = snapshots[snapshots.length - 1].sanityScore - snapshots[0].sanityScore;

  // Determine direction
  let direction: SanityTrend["direction"] = "stable";
  if (change7Days > 5) direction = "improving";
  else if (change7Days < -5) direction = "worsening";

  return {
    data,
    change7Days: Math.round(change7Days),
    change30Days: Math.round(change30Days),
    direction,
  };
}

// ============================================================================
// GET SANITY DELTA (Change since last check)
// ============================================================================

export async function getSanityDelta(tenantId: string): Promise<number> {
  const snapshots = await db
    .select()
    .from(sanityHistory)
    .where(eq(sanityHistory.tenantId, tenantId))
    .orderBy(desc(sanityHistory.createdAt))
    .limit(2);

  if (snapshots.length < 2) {
    return 0;
  }

  return snapshots[0].sanityScore - snapshots[1].sanityScore;
}

// ============================================================================
// GET BENCHMARK (Anonymous comparison)
// ============================================================================

export async function getSanityBenchmark(
  score: number,
  daysToEvent: number
): Promise<SanityBenchmark> {
  // Group by days to event ranges
  const stageRange = getStageRange(daysToEvent);

  // Get aggregate data for couples at similar stage
  // Note: In production, this would query actual aggregate data
  // For now, we use reasonable estimates
  const averageAtStage = getAverageAtStage(daysToEvent);

  // Calculate percentile
  const percentile = calculatePercentile(score, averageAtStage);

  // Get top stressor at this stage
  const topStressorAtStage = getTopStressorAtStage(daysToEvent);

  return {
    percentile,
    averageAtStage,
    topStressorAtStage,
  };
}

function getStageRange(daysToEvent: number): string {
  if (daysToEvent > 365) return "over_year";
  if (daysToEvent > 180) return "6_12_months";
  if (daysToEvent > 90) return "3_6_months";
  if (daysToEvent > 30) return "1_3_months";
  return "final_month";
}

function getAverageAtStage(daysToEvent: number): number {
  // Based on typical wedding planning stress patterns
  if (daysToEvent > 365) return 78; // Early: relatively calm
  if (daysToEvent > 180) return 72; // 6-12 months: picking up
  if (daysToEvent > 90) return 65; // 3-6 months: moderate stress
  if (daysToEvent > 30) return 58; // 1-3 months: elevated
  return 52; // Final month: highest stress
}

function calculatePercentile(score: number, averageAtStage: number): number {
  // Simplified percentile calculation based on score vs average
  // Assumes roughly normal distribution around average
  const diff = score - averageAtStage;
  const percentile = 50 + diff * 2; // 2 percentile points per score point
  return Math.max(1, Math.min(99, Math.round(percentile)));
}

function getTopStressorAtStage(daysToEvent: number): string {
  // Common stressors by stage
  if (daysToEvent > 365) return "Venue selection";
  if (daysToEvent > 180) return "Budget management";
  if (daysToEvent > 90) return "Vendor coordination";
  if (daysToEvent > 30) return "Guest RSVPs";
  return "Final details";
}

// ============================================================================
// GET FULL SANITY CONTEXT (For AI prompts)
// ============================================================================

export async function getSanityContext(tenantId: string): Promise<SanityContext> {
  // Get current signals
  const signals = await analyzeStressSignals(tenantId);

  // Get trend
  const trend = await getSanityTrend(tenantId);

  // Get most recent snapshot date
  const lastSnapshot = await db
    .select({ createdAt: sanityHistory.createdAt })
    .from(sanityHistory)
    .where(eq(sanityHistory.tenantId, tenantId))
    .orderBy(desc(sanityHistory.createdAt))
    .limit(1);

  return {
    currentScore: Math.round(signals.computed.overallStressScore),
    stressCategory: signals.computed.stressCategory,
    inferredFamilyFriction: signals.computed.inferredFamilyFriction,
    trend,
    statusMessage: getStressStatusMessage(signals),
    primaryStressors: signals.computed.primaryStressors,
    lastUpdated: lastSnapshot[0]?.createdAt || null,
  };
}

// ============================================================================
// GET RECENT SANITY HISTORY (For dashboard chart)
// ============================================================================

export async function getRecentSanityHistory(
  tenantId: string,
  days: number = 30
): Promise<SanitySnapshot[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const snapshots = await db
    .select()
    .from(sanityHistory)
    .where(
      and(
        eq(sanityHistory.tenantId, tenantId),
        gte(sanityHistory.createdAt, cutoff)
      )
    )
    .orderBy(sanityHistory.createdAt);

  return snapshots.map((s) => ({
    id: s.id,
    score: s.sanityScore,
    inferredFamilyFriction: s.inferredFamilyFriction ?? 2,
    stressCategory: getCategoryFromScore(s.sanityScore),
    primaryStressors: (s.primaryStressors as string[]) || [],
    createdAt: s.createdAt,
  }));
}

function getCategoryFromScore(score: number): string {
  if (score >= 80) return "calm";
  if (score >= 65) return "mild";
  if (score >= 50) return "moderate";
  if (score >= 35) return "elevated";
  return "high";
}

// ============================================================================
// CHECK IF INTERVENTION NEEDED
// ============================================================================

export interface InterventionSuggestion {
  type: "gentle_checkin" | "simplification" | "late_night" | "reengagement" | "family_support";
  message: string;
  priority: number; // 1-5, higher = more urgent
}

export async function checkForIntervention(
  tenantId: string
): Promise<InterventionSuggestion | null> {
  const context = await getSanityContext(tenantId);

  // Check for significant score drop
  if (context.trend && context.trend.change7Days < -15) {
    return {
      type: "gentle_checkin",
      message: "I noticed things have been busy! Let's focus on one thing at a time.",
      priority: 4,
    };
  }

  // Check for high family friction
  if (context.inferredFamilyFriction >= 7) {
    return {
      type: "family_support",
      message: "Family dynamics can be tricky. I'm here to help navigate that.",
      priority: 3,
    };
  }

  // Check for topic repetition (decision paralysis)
  if (context.primaryStressors.includes("decision_paralysis")) {
    return {
      type: "simplification",
      message: "Let's break this decision down into smaller pieces.",
      priority: 3,
    };
  }

  // Check for late-night activity pattern
  if (context.primaryStressors.includes("sleep_disruption")) {
    return {
      type: "late_night",
      message: "Burning the midnight oil? Sometimes the best decision is to sleep on it.",
      priority: 2,
    };
  }

  // Check for disengagement
  if (context.primaryStressors.includes("disengagement")) {
    return {
      type: "reengagement",
      message: "Haven't seen you in a while! Just checking in.",
      priority: 2,
    };
  }

  return null;
}

// ============================================================================
// BUILD SANITY CONTEXT STRING (For AI prompts)
// ============================================================================

export function buildSanityContextString(context: SanityContext): string {
  const parts: string[] = [];

  // Score and category
  parts.push(`Current: ${context.currentScore}/100 (${context.stressCategory})`);

  // Trend
  if (context.trend) {
    const arrow = context.trend.direction === "improving" ? "↑" :
      context.trend.direction === "worsening" ? "↓" : "→";
    parts.push(`Trend: ${arrow}${Math.abs(context.trend.change7Days)} points this week`);
  }

  // Family friction
  parts.push(`Family dynamics (inferred): ${context.inferredFamilyFriction}/10`);

  // Top stressors
  if (context.primaryStressors.length > 0) {
    const stressorNames: Record<string, string> = {
      budget: "budget",
      family: "family",
      contracts: "contracts",
      rsvp_anxiety: "RSVPs",
      decision_paralysis: "decisions",
      sleep_disruption: "sleep",
      frantic_planning: "activity",
      disengagement: "engagement",
      vendor_indecision: "vendors",
      overdue_decisions: "deadlines",
      emotional_stress: "overwhelm",
      declining_mood: "energy",
    };

    const readableStressors = context.primaryStressors
      .map((s) => stressorNames[s] || s)
      .slice(0, 3);

    if (readableStressors.length > 0) {
      parts.push(`Top concerns: ${readableStressors.join(", ")}`);
    }
  }

  return parts.join("\n");
}
