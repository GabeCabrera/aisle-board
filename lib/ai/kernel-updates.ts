import { db } from "@/lib/db";
import { weddingKernels, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface WeddingKernel {
  id: string;
  names?: string[];
  location?: string;
  occupations?: string[];
  howTheyMet?: string;
  howLongTogether?: string;
  engagementStory?: string;
  weddingDate?: Date;
  guestCount?: number;
  budgetTotal?: number;
  vibe?: string[];
  formality?: string;
  colorBoard?: string[];
  priorities?: string[];
  stressors?: string[];
  biggestConcern?: string;
  decisions?: Record<string, unknown>;
  vendorsBooked?: string[];
  planningPhase?: string;
  communicationStyle?: string;
  usesEmojis?: boolean;
  usesSwearing?: boolean;
  messageLength?: "short" | "medium" | "long";
  knowledgeLevel?: "beginner" | "intermediate" | "experienced";
  [key: string]: unknown; // Allow for dynamic properties
}

export async function updateKernelFromExtraction(
  kernelId: string,
  tenantId: string,
  extracted: Record<string, unknown>,
  profileUpdates: Record<string, unknown>
): Promise<void> {
  const kernel = await db.query.weddingKernels.findFirst({
    where: eq(weddingKernels.id, kernelId)
  });
  if (!kernel) return;

  const updates: Record<string, unknown> = { ...profileUpdates, updatedAt: new Date() };

  if (extracted.names && Array.isArray(extracted.names)) {
    const current = (kernel.names as string[]) || [];
    updates.names = [...new Set([...current, ...extracted.names])];
    const names = updates.names as string[];
    if (names.length >= 2) {
      await db.update(tenants)
        .set({ displayName: `${names[0]} & ${names[1]}` })
        .where(eq(tenants.id, tenantId));
    }
  }

  if (extracted.location) updates.location = extracted.location;
  if (extracted.howTheyMet) updates.howTheyMet = extracted.howTheyMet;
  if (extracted.engagementStory) updates.engagementStory = extracted.engagementStory;
  if (extracted.biggestConcern) updates.biggestConcern = extracted.biggestConcern;

  if (extracted.weddingDate) {
    // Add T12:00:00 to parse as noon, avoiding timezone shift to previous day
    const dateStr = extracted.weddingDate as string;
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
    if (!isNaN(date.getTime())) {
      updates.weddingDate = date;
      await db.update(tenants).set({ weddingDate: date }).where(eq(tenants.id, tenantId));
    }
  }

  if (extracted.guestCount) updates.guestCount = extracted.guestCount;
  if (extracted.budgetTotal) updates.budgetTotal = extracted.budgetTotal;

  // Merge arrays
  const arrayFields = ['occupations', 'vibe', 'priorities', 'stressors'] as const;
  for (const field of arrayFields) {
    if (extracted[field] && Array.isArray(extracted[field])) {
      const current = (kernel[field] as string[]) || [];
      updates[field] = [...new Set([...current, ...(extracted[field] as string[])])];
    }
  }

  if (Object.keys(updates).length > 1) {
    await db.update(weddingKernels).set(updates).where(eq(weddingKernels.id, kernelId));
  }
}
