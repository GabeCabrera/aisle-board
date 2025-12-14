/**
 * STRESS SIGNAL ANALYZER
 * Aggregates signals from chat, behavior, and planning data to infer stress levels.
 * All inference is automatic - no explicit user input required.
 */

import { db } from "@/lib/db";
import { eq, and, gte, desc, sql, count } from "drizzle-orm";
import {
  activities,
  scribeConversations,
  weddingKernels,
  pages,
  planners,
  weddingDecisions,
} from "@/lib/db/schema";

// ============================================================================
// TYPES
// ============================================================================

export interface StressSignals {
  // From chat analysis
  chat: {
    inferredStressLevel: number; // 1-5 from AI extraction
    familyMentionCount: number;
    topicRepetitionScore: number; // 0-1 scale
    decisionUncertaintyCount: number;
    emojiDecline: boolean; // Used to use emojis, now doesn't
    toneShift: "improving" | "stable" | "declining" | null;
  };

  // From behavioral patterns
  behavior: {
    lateNightActivityRatio: number; // % of activity 11pm-4am
    vendorBrowsingVelocity: number; // Actions per hour
    statusChurnRate: number; // Status changes per vendor
    activityGapDays: number; // Days since last activity
    activitySpike: boolean; // Unusually high activity
  };

  // From planning data
  planning: {
    budgetVariance: number; // % over budget (negative = under)
    rsvpPendingRatio: number; // % of guests pending RSVP
    contractsUnsignedRatio: number; // % of critical vendors unsigned
    decisionsOverdueCount: number;
    daysToEvent: number;
  };

  // Computed
  computed: {
    overallStressScore: number; // 0-100 (higher = more stressed)
    inferredFamilyFriction: number; // 0-10
    stressCategory: "calm" | "mild" | "moderate" | "elevated" | "high";
    primaryStressors: string[];
    trend: "improving" | "stable" | "worsening" | null;
  };
}

export interface StressSnapshot {
  score: number;
  inferredFamilyFriction: number;
  signals: StressSignals;
  timestamp: Date;
}

// ============================================================================
// SIGNAL WEIGHTS (tuned values for stress calculation)
// ============================================================================

const WEIGHTS = {
  // Chat signals
  chatStressLevel: 8, // Points per level (1-5)
  familyMention: 3, // Points per family mention
  topicRepetition: 15, // Max points for topic repetition
  decisionUncertainty: 5, // Points per uncertain decision
  emojiDecline: 5, // Points if emoji usage dropped
  toneShift: 10, // Points for declining tone

  // Behavioral signals
  lateNightActivity: 20, // Max points for late-night activity
  activitySpike: 10, // Points for unusual activity
  activityGap: 15, // Max points for inactivity
  statusChurn: 10, // Max points for frequent status changes

  // Planning signals
  budgetVariance: 20, // Max points for budget issues
  rsvpAnxiety: 15, // Max points for RSVP issues
  contractRisk: 25, // Max points for unsigned contracts
  decisionsOverdue: 5, // Points per overdue decision
};

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

export async function analyzeStressSignals(tenantId: string): Promise<StressSignals> {
  const [chatSignals, behaviorSignals, planningSignals] = await Promise.all([
    analyzeChatSignals(tenantId),
    analyzeBehaviorSignals(tenantId),
    analyzePlanningSignals(tenantId),
  ]);

  const computed = computeStressMetrics(chatSignals, behaviorSignals, planningSignals);

  return {
    chat: chatSignals,
    behavior: behaviorSignals,
    planning: planningSignals,
    computed,
  };
}

// ============================================================================
// CHAT SIGNAL ANALYSIS
// ============================================================================

const FAMILY_KEYWORDS = [
  "mom", "mother", "dad", "father", "parent",
  "in-law", "inlaw", "in law", "mother-in-law", "father-in-law",
  "sister", "brother", "sibling",
  "aunt", "uncle", "cousin", "grandma", "grandpa", "grandmother", "grandfather",
  "family", "relatives",
];

const STRESS_KEYWORDS = [
  "stressed", "overwhelmed", "anxious", "worried", "frustrated",
  "exhausted", "tired", "can't decide", "don't know", "confused",
  "help", "struggling", "difficult", "hard", "impossible",
  "too much", "behind", "late", "deadline", "running out",
];

const DECISION_UNCERTAINTY_KEYWORDS = [
  "should i", "should we", "what do you think", "not sure",
  "can't decide", "torn between", "which one", "help me choose",
  "i don't know", "maybe", "might", "possibly",
];

async function analyzeChatSignals(tenantId: string): Promise<StressSignals["chat"]> {
  // Get recent conversations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conversations = await db
    .select()
    .from(scribeConversations)
    .where(
      and(
        eq(scribeConversations.tenantId, tenantId),
        gte(scribeConversations.updatedAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(scribeConversations.updatedAt))
    .limit(10);

  // Get kernel for historical emoji usage
  const kernel = await db
    .select()
    .from(weddingKernels)
    .where(eq(weddingKernels.tenantId, tenantId))
    .limit(1);

  let familyMentionCount = 0;
  let stressKeywordCount = 0;
  let decisionUncertaintyCount = 0;
  let totalMessages = 0;
  let recentEmojiCount = 0;
  const topicCounts: Record<string, number> = {};

  // Analyze recent user messages
  for (const conv of conversations) {
    const messages = (conv.messages as Array<{ role: string; content: string }>) || [];
    const userMessages = messages.filter((m) => m.role === "user");

    for (const msg of userMessages) {
      totalMessages++;
      const content = msg.content.toLowerCase();

      // Count family mentions
      for (const keyword of FAMILY_KEYWORDS) {
        if (content.includes(keyword)) {
          familyMentionCount++;
          break;
        }
      }

      // Count stress keywords
      for (const keyword of STRESS_KEYWORDS) {
        if (content.includes(keyword)) {
          stressKeywordCount++;
          break;
        }
      }

      // Count decision uncertainty
      for (const keyword of DECISION_UNCERTAINTY_KEYWORDS) {
        if (content.includes(keyword)) {
          decisionUncertaintyCount++;
          break;
        }
      }

      // Check for emojis in recent messages
      const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
      if (emojiRegex.test(msg.content)) {
        recentEmojiCount++;
      }

      // Track topic repetition (simplified: look for repeated question patterns)
      const topics = extractTopics(content);
      for (const topic of topics) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }
  }

  // Calculate topic repetition score (0-1)
  const maxTopicCount = Math.max(...Object.values(topicCounts), 1);
  const topicRepetitionScore = Math.min((maxTopicCount - 1) / 5, 1); // 5+ repeats = max score

  // Check for emoji decline
  const historicalEmojiUse = kernel[0]?.usesEmojis ?? false;
  const recentEmojiUse = totalMessages > 0 && recentEmojiCount / totalMessages > 0.1;
  const emojiDecline = historicalEmojiUse && !recentEmojiUse;

  // Infer stress level from keywords (1-5)
  let inferredStressLevel = 1;
  if (totalMessages > 0) {
    const stressRatio = stressKeywordCount / totalMessages;
    if (stressRatio > 0.5) inferredStressLevel = 5;
    else if (stressRatio > 0.3) inferredStressLevel = 4;
    else if (stressRatio > 0.2) inferredStressLevel = 3;
    else if (stressRatio > 0.1) inferredStressLevel = 2;
  }

  return {
    inferredStressLevel,
    familyMentionCount,
    topicRepetitionScore,
    decisionUncertaintyCount,
    emojiDecline,
    toneShift: null, // Would need historical comparison
  };
}

function extractTopics(content: string): string[] {
  // Simple topic extraction - look for common wedding planning topics
  const topics: string[] = [];
  const topicPatterns = [
    { pattern: /venue|location|place/i, topic: "venue" },
    { pattern: /photo|photographer/i, topic: "photography" },
    { pattern: /caterer|catering|food|menu/i, topic: "catering" },
    { pattern: /flower|florist|bouquet/i, topic: "flowers" },
    { pattern: /dress|gown|attire/i, topic: "attire" },
    { pattern: /guest|invite|invitation/i, topic: "guests" },
    { pattern: /budget|cost|money|expensive|afford/i, topic: "budget" },
    { pattern: /seating|table|seat/i, topic: "seating" },
    { pattern: /family|parent|in-law/i, topic: "family" },
    { pattern: /rsvp|response|attending/i, topic: "rsvps" },
  ];

  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(content)) {
      topics.push(topic);
    }
  }

  return topics;
}

// ============================================================================
// BEHAVIORAL SIGNAL ANALYSIS
// ============================================================================

async function analyzeBehaviorSignals(tenantId: string): Promise<StressSignals["behavior"]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all activities in last 30 days
  const recentActivities = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.actorTenantId, tenantId),
        gte(activities.createdAt, thirtyDaysAgo)
      )
    )
    .orderBy(desc(activities.createdAt));

  if (recentActivities.length === 0) {
    return {
      lateNightActivityRatio: 0,
      vendorBrowsingVelocity: 0,
      statusChurnRate: 0,
      activityGapDays: 30,
      activitySpike: false,
    };
  }

  // Calculate late-night activity ratio (11pm - 4am)
  const lateNightActivities = recentActivities.filter((a) => {
    const hour = a.createdAt.getHours();
    return hour >= 23 || hour < 4;
  });
  const lateNightActivityRatio = lateNightActivities.length / recentActivities.length;

  // Calculate vendor browsing velocity (actions per hour in last 7 days)
  const recentWeekActivities = recentActivities.filter(
    (a) => a.createdAt >= sevenDaysAgo
  );
  const hoursInWeek = 168;
  const vendorBrowsingVelocity = recentWeekActivities.length / hoursInWeek;

  // Calculate activity gap (days since last activity)
  const lastActivityDate = recentActivities[0]?.createdAt || thirtyDaysAgo;
  const activityGapDays = Math.floor(
    (Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Detect activity spike (>2x average daily activity)
  const avgDailyActivity = recentActivities.length / 30;
  const todayActivities = recentActivities.filter((a) => {
    const today = new Date();
    return a.createdAt.toDateString() === today.toDateString();
  });
  const activitySpike = todayActivities.length > avgDailyActivity * 2;

  // Calculate status churn (vendor status changes)
  const vendorActivities = recentActivities.filter(
    (a) => a.type.includes("vendor") || a.targetType === "vendor"
  );
  const statusChurnRate = vendorActivities.length > 0
    ? vendorActivities.filter((a) => a.type.includes("status")).length / vendorActivities.length
    : 0;

  return {
    lateNightActivityRatio,
    vendorBrowsingVelocity,
    statusChurnRate,
    activityGapDays,
    activitySpike,
  };
}

// ============================================================================
// PLANNING SIGNAL ANALYSIS
// ============================================================================

async function analyzePlanningSignals(tenantId: string): Promise<StressSignals["planning"]> {
  // Get planner and pages
  const planner = await db
    .select()
    .from(planners)
    .where(eq(planners.tenantId, tenantId))
    .limit(1);

  if (!planner[0]) {
    return {
      budgetVariance: 0,
      rsvpPendingRatio: 0,
      contractsUnsignedRatio: 0,
      decisionsOverdueCount: 0,
      daysToEvent: 365,
    };
  }

  // Get kernel for wedding date
  const kernel = await db
    .select()
    .from(weddingKernels)
    .where(eq(weddingKernels.tenantId, tenantId))
    .limit(1);

  const weddingDate = kernel[0]?.weddingDate;
  const daysToEvent = weddingDate
    ? Math.max(0, Math.ceil((weddingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 365;

  // Get budget page
  const budgetPage = await db
    .select()
    .from(pages)
    .where(
      and(eq(pages.plannerId, planner[0].id), eq(pages.templateId, "budget"))
    )
    .limit(1);

  // Calculate budget variance
  let budgetVariance = 0;
  if (budgetPage[0]?.fields) {
    const fields = budgetPage[0].fields as { items?: Array<{ cost?: number }>; totalBudget?: number };
    const totalBudget = fields.totalBudget || kernel[0]?.budgetTotal || 0;
    const actualSpend = (fields.items || []).reduce((sum, item) => sum + (item.cost || 0), 0);
    if (totalBudget > 0) {
      budgetVariance = ((actualSpend - totalBudget) / totalBudget) * 100;
    }
  }

  // Get guest page
  const guestPage = await db
    .select()
    .from(pages)
    .where(
      and(eq(pages.plannerId, planner[0].id), eq(pages.templateId, "guest-list"))
    )
    .limit(1);

  // Calculate RSVP pending ratio
  let rsvpPendingRatio = 0;
  if (guestPage[0]?.fields) {
    const fields = guestPage[0].fields as { guests?: Array<{ rsvp?: string }> };
    const guests = fields.guests || [];
    const totalGuests = guests.length;
    const pendingGuests = guests.filter(
      (g) => !g.rsvp || g.rsvp === "pending" || g.rsvp === "invited"
    ).length;
    if (totalGuests > 0) {
      rsvpPendingRatio = pendingGuests / totalGuests;
    }
  }

  // Get decisions
  const decisions = await db
    .select()
    .from(weddingDecisions)
    .where(eq(weddingDecisions.tenantId, tenantId));

  // Calculate contracts unsigned ratio (for critical vendors)
  const criticalCategories = ["venue", "catering", "photography"];
  const criticalDecisions = decisions.filter((d) =>
    criticalCategories.includes(d.category)
  );
  const unsignedCritical = criticalDecisions.filter(
    (d) => d.status !== "locked" && !d.contractSigned
  );
  const contractsUnsignedRatio = criticalDecisions.length > 0
    ? unsignedCritical.length / criticalDecisions.length
    : 0;

  // Count overdue decisions
  const now = new Date();
  const overdueDecisions = decisions.filter(
    (d) => d.dueBy && d.dueBy < now && d.status !== "locked" && !d.isSkipped
  );

  return {
    budgetVariance,
    rsvpPendingRatio,
    contractsUnsignedRatio,
    decisionsOverdueCount: overdueDecisions.length,
    daysToEvent,
  };
}

// ============================================================================
// STRESS COMPUTATION
// ============================================================================

function computeStressMetrics(
  chat: StressSignals["chat"],
  behavior: StressSignals["behavior"],
  planning: StressSignals["planning"]
): StressSignals["computed"] {
  let stressPoints = 0;
  const stressors: string[] = [];

  // Chat-based stress
  stressPoints += (chat.inferredStressLevel - 1) * WEIGHTS.chatStressLevel;
  if (chat.inferredStressLevel >= 4) stressors.push("emotional_stress");

  stressPoints += Math.min(chat.familyMentionCount, 5) * WEIGHTS.familyMention;
  if (chat.familyMentionCount >= 3) stressors.push("family");

  stressPoints += chat.topicRepetitionScore * WEIGHTS.topicRepetition;
  if (chat.topicRepetitionScore > 0.5) stressors.push("decision_paralysis");

  stressPoints += Math.min(chat.decisionUncertaintyCount, 5) * WEIGHTS.decisionUncertainty;

  if (chat.emojiDecline) {
    stressPoints += WEIGHTS.emojiDecline;
  }

  if (chat.toneShift === "declining") {
    stressPoints += WEIGHTS.toneShift;
    stressors.push("declining_mood");
  }

  // Behavioral stress
  stressPoints += behavior.lateNightActivityRatio * WEIGHTS.lateNightActivity;
  if (behavior.lateNightActivityRatio > 0.3) stressors.push("sleep_disruption");

  if (behavior.activitySpike) {
    stressPoints += WEIGHTS.activitySpike;
    stressors.push("frantic_planning");
  }

  if (behavior.activityGapDays > 14) {
    stressPoints += Math.min(behavior.activityGapDays / 14, 1) * WEIGHTS.activityGap;
    stressors.push("disengagement");
  }

  stressPoints += behavior.statusChurnRate * WEIGHTS.statusChurn;
  if (behavior.statusChurnRate > 0.5) stressors.push("vendor_indecision");

  // Planning stress (weighted by proximity to event)
  const timeMultiplier = Math.max(0.5, 1.5 - planning.daysToEvent / 365);

  if (planning.budgetVariance > 0) {
    stressPoints += Math.min(planning.budgetVariance / 10, 1) * WEIGHTS.budgetVariance * timeMultiplier;
    if (planning.budgetVariance > 10) stressors.push("budget");
  }

  stressPoints += planning.rsvpPendingRatio * WEIGHTS.rsvpAnxiety * timeMultiplier;
  if (planning.rsvpPendingRatio > 0.3 && planning.daysToEvent < 60) stressors.push("rsvp_anxiety");

  stressPoints += planning.contractsUnsignedRatio * WEIGHTS.contractRisk * timeMultiplier;
  if (planning.contractsUnsignedRatio > 0.5 && planning.daysToEvent < 180) {
    stressors.push("contracts");
  }

  stressPoints += Math.min(planning.decisionsOverdueCount, 5) * WEIGHTS.decisionsOverdue;
  if (planning.decisionsOverdueCount >= 3) stressors.push("overdue_decisions");

  // Calculate family friction (0-10)
  let familyFriction = 2; // Base level
  familyFriction += Math.min(chat.familyMentionCount, 4); // +1 per mention up to 4
  if (chat.topicRepetitionScore > 0.3) familyFriction += 2; // Repeated family topics
  familyFriction = Math.min(familyFriction, 10);

  // Convert to 0-100 scale (inverted: 100 = calm, 0 = maximum stress)
  const overallStressScore = Math.max(0, Math.min(100, 100 - stressPoints));

  // Determine category
  let stressCategory: StressSignals["computed"]["stressCategory"];
  if (overallStressScore >= 80) stressCategory = "calm";
  else if (overallStressScore >= 65) stressCategory = "mild";
  else if (overallStressScore >= 50) stressCategory = "moderate";
  else if (overallStressScore >= 35) stressCategory = "elevated";
  else stressCategory = "high";

  return {
    overallStressScore,
    inferredFamilyFriction: familyFriction,
    stressCategory,
    primaryStressors: stressors.slice(0, 3),
    trend: null, // Requires historical comparison
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a human-readable stress status message
 */
export function getStressStatusMessage(signals: StressSignals): string {
  const { stressCategory, primaryStressors } = signals.computed;

  if (stressCategory === "calm") {
    return "Planning is going smoothly";
  }

  if (stressCategory === "mild") {
    return "Some planning tasks need attention";
  }

  const stressorMessages: Record<string, string> = {
    budget: "Budget is a concern",
    family: "Family dynamics are complex",
    contracts: "Some vendors need contracts",
    rsvp_anxiety: "RSVPs are pending",
    decision_paralysis: "Some decisions are pending",
    sleep_disruption: "Late-night planning detected",
    frantic_planning: "High activity detected",
    disengagement: "Planning has been paused",
    vendor_indecision: "Vendor choices are in flux",
    overdue_decisions: "Some decisions are overdue",
    emotional_stress: "Feeling overwhelmed",
    declining_mood: "Energy seems low",
  };

  const topStressor = primaryStressors[0];
  if (topStressor && stressorMessages[topStressor]) {
    return stressorMessages[topStressor];
  }

  if (stressCategory === "moderate") {
    return "Planning has some challenges";
  }

  return "Planning needs attention";
}

/**
 * Calculate sanity impact of an action
 */
export function calculateActionImpact(
  action: string,
  currentSignals: StressSignals
): { impact: number; message: string } {
  const impactMap: Record<string, { base: number; message: string }> = {
    book_venue: { base: 15, message: "Booking your venue is a major milestone" },
    book_photographer: { base: 10, message: "Securing a photographer brings peace of mind" },
    book_catering: { base: 12, message: "Locking in catering reduces planning load" },
    sign_contract: { base: 8, message: "Signed contracts mean fewer loose ends" },
    confirm_guest: { base: 2, message: "Each confirmed guest helps your planning" },
    complete_decision: { base: 5, message: "One less thing to decide" },
  };

  const actionImpact = impactMap[action];
  if (!actionImpact) {
    return { impact: 0, message: "" };
  }

  // Adjust based on current stress level (more impact when stressed)
  const stressMultiplier = currentSignals.computed.stressCategory === "high" ? 1.5 :
    currentSignals.computed.stressCategory === "elevated" ? 1.25 : 1;

  return {
    impact: Math.round(actionImpact.base * stressMultiplier),
    message: actionImpact.message,
  };
}
