/**
 * Wedding Decisions System
 * 
 * Manages the master checklist of wedding decisions,
 * their states, and lock logic.
 */

import { db } from "@/lib/db";
import { weddingDecisions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// DEFAULT DECISIONS
// ============================================================================

export const DEFAULT_DECISIONS = [
  // Foundation (required to start)
  { name: "wedding_date", displayName: "Wedding Date", category: "foundation", isRequired: true, position: 1 },
  { name: "budget", displayName: "Budget", category: "foundation", isRequired: true, position: 2 },
  { name: "guest_count", displayName: "Guest Count Estimate", category: "foundation", isRequired: true, position: 3 },
  { name: "style", displayName: "Wedding Style/Vibe", category: "foundation", isRequired: false, position: 4 },
  
  // Venue
  { name: "ceremony_venue", displayName: "Ceremony Venue", category: "venue", isRequired: true, position: 10 },
  { name: "reception_venue", displayName: "Reception Venue", category: "venue", isRequired: true, position: 11 },
  { name: "rehearsal_dinner_venue", displayName: "Rehearsal Dinner Venue", category: "venue", isRequired: false, position: 12 },
  
  // Core Vendors
  { name: "photographer", displayName: "Photographer", category: "vendors", isRequired: false, position: 20 },
  { name: "videographer", displayName: "Videographer", category: "vendors", isRequired: false, position: 21 },
  { name: "caterer", displayName: "Caterer", category: "vendors", isRequired: true, position: 22 },
  { name: "dj_band", displayName: "DJ / Band", category: "vendors", isRequired: false, position: 23 },
  { name: "florist", displayName: "Florist", category: "vendors", isRequired: false, position: 24 },
  { name: "officiant", displayName: "Officiant", category: "vendors", isRequired: true, position: 25 },
  { name: "cake_baker", displayName: "Cake / Desserts", category: "vendors", isRequired: false, position: 26 },
  { name: "hair_makeup", displayName: "Hair & Makeup", category: "vendors", isRequired: false, position: 27 },
  
  // Attire
  { name: "wedding_dress", displayName: "Wedding Dress/Outfit", category: "attire", isRequired: false, position: 30 },
  { name: "partner_attire", displayName: "Partner's Attire", category: "attire", isRequired: false, position: 31 },
  { name: "wedding_rings", displayName: "Wedding Rings", category: "attire", isRequired: true, position: 32 },
  { name: "wedding_party_attire", displayName: "Wedding Party Attire", category: "attire", isRequired: false, position: 33 },
  
  // Ceremony
  { name: "ceremony_music", displayName: "Ceremony Music", category: "ceremony", isRequired: false, position: 40 },
  { name: "vows", displayName: "Vows", category: "ceremony", isRequired: false, position: 41 },
  { name: "readings", displayName: "Readings", category: "ceremony", isRequired: false, position: 42 },
  
  // Reception
  { name: "menu", displayName: "Menu", category: "reception", isRequired: true, position: 50 },
  { name: "seating_chart", displayName: "Seating Chart", category: "reception", isRequired: false, position: 51 },
  { name: "first_dance_song", displayName: "First Dance Song", category: "reception", isRequired: false, position: 52 },
  { name: "reception_music", displayName: "Reception Playlist", category: "reception", isRequired: false, position: 53 },
  
  // Guests & Stationery
  { name: "guest_list", displayName: "Final Guest List", category: "guests", isRequired: true, position: 60 },
  { name: "save_the_dates", displayName: "Save the Dates", category: "guests", isRequired: false, position: 61 },
  { name: "invitations", displayName: "Invitations", category: "guests", isRequired: true, position: 62 },
  
  // Logistics
  { name: "transportation", displayName: "Transportation", category: "logistics", isRequired: false, position: 70 },
  { name: "accommodations", displayName: "Guest Accommodations", category: "logistics", isRequired: false, position: 71 },
  { name: "day_of_timeline", displayName: "Day-Of Timeline", category: "logistics", isRequired: true, position: 72 },
  
  // Legal
  { name: "marriage_license", displayName: "Marriage License", category: "legal", isRequired: true, position: 80 },
  
  // Honeymoon
  { name: "honeymoon_destination", displayName: "Honeymoon Destination", category: "honeymoon", isRequired: false, position: 90 },
  { name: "honeymoon_bookings", displayName: "Honeymoon Bookings", category: "honeymoon", isRequired: false, position: 91 },
];

// ============================================================================
// INITIALIZE DECISIONS FOR NEW TENANT
// ============================================================================

export async function initializeDecisionsForTenant(tenantId: string): Promise<void> {
  // Check if decisions already exist
  const existing = await db.query.weddingDecisions.findFirst({
    where: eq(weddingDecisions.tenantId, tenantId),
  });

  if (existing) {
    console.log("Decisions already exist for tenant:", tenantId);
    return;
  }

  // Create all default decisions
  const decisionsToCreate = DEFAULT_DECISIONS.map(d => ({
    tenantId,
    name: d.name,
    displayName: d.displayName,
    category: d.category,
    isRequired: d.isRequired,
    position: d.position,
    status: "not_started" as const,
  }));

  await db.insert(weddingDecisions).values(decisionsToCreate);
  console.log(`Created ${decisionsToCreate.length} decisions for tenant:`, tenantId);
}

// ============================================================================
// DECISION STATUS HELPERS
// ============================================================================

export type DecisionStatus = "not_started" | "researching" | "decided" | "locked";
export type LockReason = "deposit_paid" | "contract_signed" | "full_payment" | "date_passed" | "user_confirmed";

function normalizeDecisionName(name: string): string {
  const n = name.toLowerCase().trim();
  if (n === "wedding_budget") return "budget";
  if (n === "dj") return "dj_band";
  if (n === "band") return "dj_band";
  if (n === "music") return "dj_band"; // Context dependent, but usually means DJ/Band in vendor context
  if (n === "cake") return "cake_baker";
  if (n === "dessert") return "cake_baker";
  if (n === "dress") return "wedding_dress";
  if (n === "rings") return "wedding_rings";
  return n;
}

export async function getDecision(tenantId: string, name: string) {
  return db.query.weddingDecisions.findFirst({
    where: and(
      eq(weddingDecisions.tenantId, tenantId),
      eq(weddingDecisions.name, normalizeDecisionName(name))
    ),
  });
}

export async function getAllDecisions(tenantId: string) {
  return db.query.weddingDecisions.findMany({
    where: eq(weddingDecisions.tenantId, tenantId),
    orderBy: (decisions, { asc }) => [asc(decisions.position)],
  });
}

export async function getDecisionsByCategory(tenantId: string, category: string) {
  return db.query.weddingDecisions.findMany({
    where: and(
      eq(weddingDecisions.tenantId, tenantId),
      eq(weddingDecisions.category, category)
    ),
    orderBy: (decisions, { asc }) => [asc(decisions.position)],
  });
}

export async function getLockedDecisions(tenantId: string) {
  return db.query.weddingDecisions.findMany({
    where: and(
      eq(weddingDecisions.tenantId, tenantId),
      eq(weddingDecisions.status, "locked")
    ),
  });
}

// ============================================================================
// UPDATE DECISION
// ============================================================================

interface UpdateDecisionParams {
  status?: DecisionStatus;
  choiceName?: string;
  choiceAmount?: number;
  choiceNotes?: string;
  estimatedCost?: number;
  depositAmount?: number;
  depositPaidAt?: Date;
  totalPaid?: number;
  contractSigned?: boolean;
  contractSignedAt?: Date;
  isSkipped?: boolean;
  force?: boolean;
}

export async function updateDecision(
  tenantId: string,
  name: string,
  updates: UpdateDecisionParams
): Promise<{ success: boolean; message: string; wasLocked?: boolean }> {
  // Handle aliases
  name = normalizeDecisionName(name);

  let decision = await getDecision(tenantId, name);

  // Auto-create if missing but in default list
  if (!decision) {
    const defaultDef = DEFAULT_DECISIONS.find(d => d.name === name);
    if (defaultDef) {
      const [newDecision] = await db.insert(weddingDecisions).values({
        tenantId,
        name: defaultDef.name,
        displayName: defaultDef.displayName,
        category: defaultDef.category,
        isRequired: defaultDef.isRequired,
        position: defaultDef.position,
        status: "not_started",
      }).returning();
      
      // Re-fetch formatted result (with joins if any, though simple query here)
      decision = await getDecision(tenantId, name);
    } else if (name === "rehearsal_dinner_venue") {
      // Specific fallback for rehearsal dinner if not found in defaults for some reason
      const [newDecision] = await db.insert(weddingDecisions).values({
        tenantId,
        name: "rehearsal_dinner_venue",
        displayName: "Rehearsal Dinner Venue",
        category: "venue",
        isRequired: false,
        position: 12,
        status: "not_started",
      }).returning();
      decision = await getDecision(tenantId, name);
    }
  }

  if (!decision) {
    return { success: false, message: `Decision "${name}" not found` };
  }

  // Check if locked
  if (decision.status === "locked" && !updates.force) {
    return { 
      success: false, 
      message: `This decision is locked: ${decision.lockDetails || decision.lockReason}. User must confirm to unlock/overwrite.`,
      wasLocked: true
    };
  }

  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: new Date(),
  };

  // If status is being set to "decided", record the timestamp
  if (updates.status === "decided" && decision.status !== "decided") {
    updateData.decidedAt = new Date();
  }

  // Auto-lock triggers
  let shouldLock = false;
  let lockReason: LockReason | undefined;
  let lockDetails: string | undefined;

  if (updates.depositPaidAt || updates.depositAmount) {
    shouldLock = true;
    lockReason = "deposit_paid";
    lockDetails = `Deposit of $${((updates.depositAmount || decision.depositAmount || 0) / 100).toLocaleString()} paid`;
  }

  if (updates.contractSigned && updates.contractSignedAt) {
    shouldLock = true;
    lockReason = "contract_signed";
    lockDetails = `Contract signed on ${updates.contractSignedAt.toLocaleDateString()}`;
  }

  if (shouldLock) {
    updateData.status = "locked";
    updateData.lockedAt = new Date();
    updateData.lockReason = lockReason;
    updateData.lockDetails = lockDetails;
  }

  await db.update(weddingDecisions)
    .set(updateData)
    .where(eq(weddingDecisions.id, decision.id));

  return { 
    success: true, 
    message: shouldLock 
      ? `Decision "${decision.displayName}" is now locked: ${lockDetails}`
      : `Updated "${decision.displayName}"`
  };
}

// ============================================================================
// LOCK / UNLOCK DECISION
// ============================================================================

export async function lockDecision(
  tenantId: string,
  name: string,
  reason: LockReason,
  details?: string
): Promise<{ success: boolean; message: string }> {
  name = normalizeDecisionName(name);
  const decision = await getDecision(tenantId, name);

  if (!decision) {
    return { success: false, message: `Decision "${name}" not found` };
  }

  if (decision.status === "locked") {
    return { success: false, message: `Decision is already locked` };
  }

  await db.update(weddingDecisions)
    .set({
      status: "locked",
      lockedAt: new Date(),
      lockReason: reason,
      lockDetails: details,
      updatedAt: new Date(),
    })
    .where(eq(weddingDecisions.id, decision.id));

  return { success: true, message: `Locked "${decision.displayName}"` };
}

export async function unlockDecision(
  tenantId: string,
  name: string
): Promise<{ success: boolean; message: string; warning?: string }> {
  name = normalizeDecisionName(name);
  const decision = await getDecision(tenantId, name);

  if (!decision) {
    return { success: false, message: `Decision "${name}" not found` };
  }

  if (decision.status !== "locked") {
    return { success: false, message: `Decision is not locked` };
  }

  // Warn if there's financial commitment
  let warning: string | undefined;
  if (decision.depositAmount || decision.totalPaid) {
    warning = `Warning: You have paid $${((decision.totalPaid || decision.depositAmount || 0) / 100).toLocaleString()} toward this. Changing may have financial implications.`;
  }
  if (decision.contractSigned) {
    warning = `Warning: You have a signed contract. Changing may have legal implications.`;
  }

  await db.update(weddingDecisions)
    .set({
      status: "decided", // Go back to decided, not not_started
      lockedAt: null,
      lockReason: null,
      lockDetails: null,
      updatedAt: new Date(),
    })
    .where(eq(weddingDecisions.id, decision.id));

  return { 
    success: true, 
    message: `Unlocked "${decision.displayName}"`,
    warning 
  };
}

// ============================================================================
// SKIP DECISION
// ============================================================================

export async function skipDecision(
  tenantId: string,
  name: string
): Promise<{ success: boolean; message: string }> {
  name = normalizeDecisionName(name);
  const decision = await getDecision(tenantId, name);

  if (!decision) {
    return { success: false, message: `Decision "${name}" not found` };
  }

  if (decision.isRequired) {
    return { success: false, message: `"${decision.displayName}" is required and cannot be skipped` };
  }

  if (decision.status === "locked") {
    return { success: false, message: `Cannot skip a locked decision` };
  }

  await db.update(weddingDecisions)
    .set({
      isSkipped: true,
      status: "decided", // Mark as "decided" to skip
      updatedAt: new Date(),
    })
    .where(eq(weddingDecisions.id, decision.id));

  return { success: true, message: `Skipping "${decision.displayName}"` };
}

// ============================================================================
// ADD CUSTOM DECISION
// ============================================================================

export async function addCustomDecision(
  tenantId: string,
  displayName: string,
  category: string
): Promise<{ success: boolean; message: string; decision?: typeof weddingDecisions.$inferSelect }> {
  // Generate name from displayName
  const name = displayName.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  // Check if already exists
  const existing = await getDecision(tenantId, name);
  if (existing) {
    return { success: false, message: `A decision called "${displayName}" already exists` };
  }

  // Get max position
  const allDecisions = await getAllDecisions(tenantId);
  const maxPosition = Math.max(...allDecisions.map(d => d.position ?? 0), 0);

  const [newDecision] = await db.insert(weddingDecisions).values({
    tenantId,
    name,
    displayName,
    category,
    isRequired: false,
    position: maxPosition + 1,
    status: "not_started",
  }).returning();

  return { 
    success: true, 
    message: `Added "${displayName}" to your checklist`,
    decision: newDecision
  };
}

// ============================================================================
// GET PROGRESS SUMMARY
// ============================================================================

export async function getDecisionProgress(tenantId: string) {
  const decisions = await getAllDecisions(tenantId);
  
  const total = decisions.filter(d => !d.isSkipped).length;
  const locked = decisions.filter(d => d.status === "locked").length;
  const decided = decisions.filter(d => d.status === "decided" || d.status === "locked").length;
  const researching = decisions.filter(d => d.status === "researching").length;
  const notStarted = decisions.filter(d => d.status === "not_started" && !d.isSkipped).length;
  const skipped = decisions.filter(d => d.isSkipped).length;

  const requiredTotal = decisions.filter(d => d.isRequired && !d.isSkipped).length;
  const requiredDone = decisions.filter(d => d.isRequired && (d.status === "decided" || d.status === "locked")).length;

  return {
    total,
    locked,
    decided,
    researching,
    notStarted,
    skipped,
    requiredTotal,
    requiredDone,
    percentComplete: Math.round((decided / total) * 100),
    percentRequired: Math.round((requiredDone / requiredTotal) * 100),
  };
}
