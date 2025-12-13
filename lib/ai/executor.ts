/**
 * Aisle AI Tool Executor
 * 
 * Executes tool calls from the AI and returns results.
 * Each tool function takes parameters and a context (tenantId, etc.)
 */

import { db } from "@/lib/db";
import {
  getCalendarEventsByTenantId,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/db/queries";
import {
  weddingKernels,
  pages,
  planners,
  calendarEvents,
  tenants,
  rsvpForms,
  rsvpResponses,
  users,
  boards, // Renamed from palettes
  ideas,  // Renamed from sparks
  knowledgeBase,
  weddingDecisions,
  type CalendarEvent
} from "@/lib/db/schema";
import { eq, and, sql, desc, like, ilike, or } from "drizzle-orm";
import logger from "@/lib/logger";

// ============================================================================ 
// TYPES
// ============================================================================ 

export interface ToolContext {
  tenantId: string;
  userId?: string;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  artifact?: {
    type: string;
    data: unknown;
  };
}

// Type for Drizzle transaction context
type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Page data returned from transactional page access
interface PageData {
  pageId: string;
  plannerId: string;
  fields: Record<string, unknown>;
}

/**
 * Execute a read-modify-write operation on a page with row-level locking.
 * Uses FOR UPDATE to prevent concurrent modifications.
 *
 * @param tenantId - The tenant ID
 * @param templateId - The page template ID (e.g., "guest-list", "vendor-contacts")
 * @param operation - Callback that receives the transaction context and page data
 * @returns The result of the operation
 */
async function withPageLock<T>(
  tenantId: string,
  templateId: string,
  operation: (
    tx: DrizzleTransaction,
    pageData: PageData
  ) => Promise<T>
): Promise<T> {
  logger.info("withPageLock: starting transaction", { tenantId, templateId });

  try {
    return await db.transaction(async (tx) => {
      // Get or create planner
      let planner = await tx.query.planners.findFirst({
        where: eq(planners.tenantId, tenantId)
      });

      if (!planner) {
        logger.info("withPageLock: creating planner", { tenantId });
        const [newPlanner] = await tx.insert(planners).values({ tenantId }).returning();
        planner = newPlanner;
      }

      // Try to get page with FOR UPDATE lock to prevent concurrent modifications
      const pageResult = await tx.execute(sql`
        SELECT id, fields FROM pages
        WHERE planner_id = ${planner.id} AND template_id = ${templateId}
        FOR UPDATE
      `);

      let page: { id: string; fields: Record<string, unknown> };

      if (pageResult.rows.length === 0) {
        // Create new page if it doesn't exist
        logger.info("withPageLock: creating page", { plannerId: planner.id, templateId });
        const [newPage] = await tx.insert(pages).values({
          plannerId: planner.id,
          templateId,
          title: getTemplateTitle(templateId),
          fields: getDefaultFields(templateId)
        }).returning();
        page = { id: newPage.id, fields: (newPage.fields as Record<string, unknown>) || {} };
      } else {
        const row = pageResult.rows[0] as { id: string; fields: Record<string, unknown> };
        page = { id: row.id, fields: row.fields || {} };
      }

      logger.info("withPageLock: executing operation", { pageId: page.id, templateId });

      return operation(tx, {
        pageId: page.id,
        plannerId: planner.id,
        fields: page.fields
      });
    });
  } catch (error) {
    logger.error("withPageLock: transaction failed", error instanceof Error ? error : undefined, {
      tenantId,
      templateId,
      errorDetails: error instanceof Error ? error.stack : String(error),
    });
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTOR
// ============================================================================ 

export async function executeToolCall(
  toolName: string,
  parameters: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  logger.info("Executing tool", { toolName, parameters, tenantId: context.tenantId });

  try {
    switch (toolName) {
      // Budget tools
      case "add_budget_item":
        return await addBudgetItem(parameters, context);
      case "update_budget_item":
        return await updateBudgetItem(parameters, context);
      case "delete_budget_item":
        return await deleteBudgetItem(parameters, context);
      case "set_total_budget":
        return await setTotalBudget(parameters, context);

      // Guest tools
      case "add_guest":
        return await addGuest(parameters, context);
      case "update_guest":
        return await updateGuest(parameters, context);
      case "delete_guest":
        return await deleteGuest(parameters, context);
      case "add_guest_group":
        return await addGuestGroup(parameters, context);
      case "get_guest_list":
        return await getGuestList(parameters, context);
      case "get_guest_stats":
        return await getGuestStats(parameters, context);
      case "sync_rsvp_responses":
        return await syncRsvpResponses(parameters, context);

      // RSVP tools
      case "create_rsvp_link":
        return await createRsvpLink(parameters, context);
      case "get_rsvp_link":
        return await getRsvpLink(parameters, context);
      case "get_rsvp_responses":
        return await getRsvpResponses(parameters, context);

      // Calendar tools
      case "get_calendar_events":
        return await getCalendarEvents(parameters, context);
      case "add_event":
        return await addEvent(parameters, context);
      case "update_event":
        return await updateEvent(parameters, context);
      case "delete_event":
        return await deleteEvent(parameters, context);
      case "add_day_of_event":
        return await addDayOfEvent(parameters, context);

      // Vendor tools
      case "add_vendor":
        return await addVendor(parameters, context);
      case "update_vendor":
        return await updateVendor(parameters, context);
      case "get_vendor_list":
        return await getVendorList(parameters, context);
      case "delete_vendor":
        return await deleteVendor(parameters, context);

      // Task tools
      case "add_task":
        return await addTask(parameters, context);
      case "complete_task":
        return await completeTask(parameters, context);
      case "delete_task":
        return await deleteTask(parameters, context);

      // Decision tools
      case "update_decision":
        return await handleUpdateDecision(parameters, context);
      case "mark_decision_complete":
        return await handleMarkDecisionComplete(parameters, context);
      case "update_checklist_item":
        return await handleUpdateChecklistItem(parameters, context);
      case "lock_decision":
        return await handleLockDecision(parameters, context);
      case "skip_decision":
        return await handleSkipDecision(parameters, context);
      case "get_decision_status":
        return await handleGetDecisionStatus(parameters, context);
      case "show_checklist":
        return await handleShowChecklist(parameters, context);
      case "add_custom_decision":
        return await handleAddCustomDecision(parameters, context);

      // Kernel tools
      case "update_wedding_details":
        return await updateWeddingDetails(parameters, context);
      case "update_preferences":
        return await updatePreferences(parameters, context);

      // Analysis tools
      case "analyze_planning_gaps":
        return await analyzePlanningGaps(parameters, context);

      // Inspiration tools
      case "create_board": // Renamed from create_palette
        return await createBoard(parameters, context);
      case "save_idea": // Renamed from save_spark
        return await saveIdea(parameters, context);
      case "get_boards": // Renamed from get_palettes
        return await getBoards(parameters, context);

      // Knowledge tools
      case "query_knowledge_base":
        return await queryKnowledgeBase(parameters, context);

      // Logic tools
      case "calculate_budget_breakdown":
        return await calculateBudgetBreakdown(parameters, context);

      // Seating tools
      case "create_seating_table":
        return await createSeatingTable(parameters, context);
      case "assign_guest_seat":
        return await assignGuestSeat(parameters, context);
      case "get_seating_chart":
        return await getSeatingChart(parameters, context);

      // External tools
      case "web_search":
        return await webSearch(parameters, context);

      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`
        };
    }
  } catch (error) {
    logger.error(`Tool execution failed: ${toolName}`, error instanceof Error ? error : undefined, {
      parameters,
      tenantId: context.tenantId,
      errorDetails: error instanceof Error ? error.stack : String(error),
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Tool execution failed"
    };
  }
}

// ============================================================================ 
// HELPER: Get or create planner and page
// ============================================================================ 

async function getOrCreatePage(
  tenantId: string,
  templateId: string
): Promise<{ plannerId: string; pageId: string; fields: Record<string, unknown> }> {
  // Get or create planner
  let planner = await db.query.planners.findFirst({
    where: eq(planners.tenantId, tenantId)
  });

  if (!planner) {
    const [newPlanner] = await db.insert(planners).values({
      tenantId
    }).returning();
    planner = newPlanner;
  }

  // Get or create page for this template
  let page = await db.query.pages.findFirst({
    where: and(
      eq(pages.plannerId, planner.id),
      eq(pages.templateId, templateId)
    )
  });

  if (!page) {
    const [newPage] = await db.insert(pages).values({
      plannerId: planner.id,
      templateId,
      title: getTemplateTitle(templateId),
      fields: getDefaultFields(templateId)
    }).returning();
    page = newPage;
  }

  return {
    plannerId: planner.id,
    pageId: page.id,
    fields: (page.fields as Record<string, unknown>) || {}
  };
}

function getTemplateTitle(templateId: string): string {
  const titles: Record<string, string> = {
    "budget": "Budget",
    "guest-list": "Guest List",
    "vendor-contacts": "Vendors",
    "day-of-schedule": "Day-Of Timeline",
    "task-board": "Tasks",
    "calendar": "Calendar"
  };
  return titles[templateId] || templateId;
}

function getDefaultFields(templateId: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    "budget": { totalBudget: 0, items: [] },
    "guest-list": { guests: [] },
    "vendor-contacts": { vendors: [] },
    "day-of-schedule": { events: [] },
    "task-board": { tasks: [] }
  };
  return defaults[templateId] || {};
}

// ============================================================================ 
// BUDGET TOOLS
// ============================================================================ 

async function addBudgetItem(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId } = await getOrCreatePage(context.tenantId, "budget"); // Only get pageId

  const newItem = {
    id: crypto.randomUUID(),
    category: params.category,
    vendor: params.vendor || "",
    totalCost: String((params.estimatedCost as number || 0) * 100),
    amountPaid: String((params.amountPaid as number || 0) * 100),
    notes: params.notes || "",
    createdAt: new Date().toISOString()
  };

  // Use jsonb_insert to append newItem directly to the 'items' array within 'fields'
  await db.update(pages)
    .set({
      fields: sql`jsonb_insert(
        COALESCE(${pages.fields} -> 'items', '[]'::jsonb), -- Target array, or empty if null
        '{999999}'::text[], -- Path to append (high index)
        ${sql`${JSON.stringify(newItem)}::jsonb`}, -- Item to append, cast to jsonb
        true -- create_if_missing: true (this parameter is for key in object, but for array it's ignored for insert)
      )`,
      updatedAt: new Date()
    })
    .where(eq(pages.id, pageId));

  // Also update kernel decisions (already expects cents/dollars? No, usually dollars for decision, let's keep it as is or check decision logic. 
  // Actually, `updateDecisionFn` expects CENTS for estimatedCost. Let's verify updateDecisionFn call below.
  // The call below passed `params.estimatedCost`. If we want cents there, we need to multiply.
  await updateKernelDecision(context.tenantId, params.category as string, {
    status: "budgeted",
    amount: params.estimatedCost // This might need checking if kernel decisions expects cents
  });

  // Update checklist decision
  const decisionName = getDecisionNameFromCategory(params.category as string);
  if (decisionName) {
      await updateDecisionFn(context.tenantId, decisionName, {
          status: "researching", 
          estimatedCost: (params.estimatedCost as number) * 100 // Correctly converting to cents here
      });
  }

  return {
    success: true,
    message: `Added ${params.category} to budget: $${(params.estimatedCost as number).toLocaleString()}`,
    data: newItem
  };
}

async function updateBudgetItem(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  return withPageLock(context.tenantId, "budget", async (tx, { pageId, fields }) => {
    const items = (fields.items as Array<Record<string, unknown>>) || [];
    let itemIndex = -1;

    // Find by ID first
    if (params.itemId) {
      itemIndex = items.findIndex(i => i.id === params.itemId);
    }
    // Find by Vendor Name (fuzzy)
    else if (params.findVendor) {
      const search = (params.findVendor as string).toLowerCase();
      itemIndex = items.findIndex(i => (i.vendor as string)?.toLowerCase().includes(search));
    }
    // Find by Category (exactish)
    else if (params.findCategory) {
      const search = (params.findCategory as string).toLowerCase();
      itemIndex = items.findIndex(i => (i.category as string)?.toLowerCase() === search);
    }

    if (itemIndex === -1) {
      return { success: false, message: "Budget item not found" };
    }

    const item = items[itemIndex];
    const changes: string[] = [];

    // Store as string in CENTS
    if (params.estimatedCost !== undefined) {
      item.totalCost = String((params.estimatedCost as number) * 100);
      changes.push(`cost to $${(params.estimatedCost as number).toLocaleString()}`);
    }
    if (params.amountPaid !== undefined) {
      item.amountPaid = String((params.amountPaid as number) * 100);
      changes.push(`paid amount to $${(params.amountPaid as number).toLocaleString()}`);
    }
    if (params.vendor !== undefined) {
      item.vendor = params.vendor;
      changes.push(`vendor to ${params.vendor}`);
    }
    if (params.notes !== undefined) {
      item.notes = params.notes;
      changes.push(`notes`);
    }

    items[itemIndex] = item;

    await tx.update(pages)
      .set({ fields: { ...fields, items }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    return {
      success: true,
      message: `Updated ${item.category || "item"}: changed ${changes.join(", ")}`,
      data: items[itemIndex]
    };
  });
}

async function deleteBudgetItem(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  return withPageLock(context.tenantId, "budget", async (tx, { pageId, fields }) => {
    const items = (fields.items as Array<Record<string, unknown>>) || [];
    const initialCount = items.length;

    // Normalize search strings for comparison
    const normalize = (s: string | undefined | null) =>
      (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const searchVendor = params.vendor ? normalize(params.vendor as string) : null;
    const searchCategory = params.category ? normalize(params.category as string) : null;
    const searchAmount = params.amount as number | undefined;

    // Filter out items that match the criteria
    // We keep items that DO NOT match
    const newItems = items.filter(i => {
      // 1. ID Check
      if (params.itemId) {
        if (params.itemId === "undefined") {
          // If target is "undefined", delete items with missing/null/"undefined" IDs
          if (!i.id || i.id === "undefined") return false; // Delete this
        } else {
          // Standard ID match
          if (i.id === params.itemId) return false; // Delete this
        }
        // If ID was provided and didn't match above, keep it (unless we want to support mixed criteria, but ID is usually specific)
        return true;
      }

      let matches = false;
      let criteriaCount = 0;
      let matchCount = 0;

      // Vendor Check
      if (searchVendor) {
        criteriaCount++;
        const itemVendor = normalize(i.vendor as string);
        if (itemVendor === searchVendor || itemVendor.includes(searchVendor) || searchVendor.includes(itemVendor)) {
          matchCount++;
        }
      }

      // Category Check
      if (searchCategory) {
        criteriaCount++;
        const itemCategory = normalize(i.category as string);
        if (itemCategory === searchCategory || itemCategory.includes(searchCategory) || searchCategory.includes(itemCategory)) {
          matchCount++;
        }
      }

      // Amount Check
      if (searchAmount !== undefined) {
        criteriaCount++;
        const cost = parseFloat(String(i.totalCost));
        // Check exact dollars, x100 (cents), or /100 (dollars from cents)
        if (Math.abs(cost - searchAmount) < 0.01 ||
            Math.abs(cost - searchAmount * 100) < 0.01 ||
            Math.abs(cost - searchAmount / 100) < 0.01) {
          matchCount++;
        }
      }

      // If we have criteria and they ALL match, then delete
      if (criteriaCount > 0 && matchCount === criteriaCount) {
        matches = true;
      }

      return !matches;
    });

    if (newItems.length === initialCount) {
      const itemList = items.slice(0, 5).map(i => {
        const cost = parseFloat(String(i.totalCost)) || 0;
        return `${i.category || "Unknown"} - ${i.vendor || "No vendor"} ($${cost.toLocaleString()})`;
      }).join(", ");
      return {
        success: false,
        message: `Budget item not found. Available items: ${itemList || "none"}`
      };
    }

    const deletedCount = initialCount - newItems.length;

    // Require explicit confirmation for bulk deletes (more than 1 item)
    if (deletedCount > 1 && params.confirmBulk !== true) {
      const itemsToDelete = items
        .filter(i => !newItems.includes(i))
        .map(i => `${i.category || "Unknown"} - ${i.vendor || "No vendor"}`)
        .slice(0, 10)
        .join(", ");
      return {
        success: false,
        message: `This will delete ${deletedCount} budget items: ${itemsToDelete}${deletedCount > 10 ? "..." : ""}. Please confirm this bulk delete operation.`,
        requiresConfirmation: true,
        data: { count: deletedCount }
      };
    }

    await tx.update(pages)
      .set({ fields: { ...fields, items: newItems }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    return {
      success: true,
      message: `Removed ${deletedCount} item${deletedCount > 1 ? "s" : ""} from budget`,
      data: { deletedCount }
    };
  });
}

async function setTotalBudget(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId } = await getOrCreatePage(context.tenantId, "budget"); // Only need pageId here
  // Store as string in CENTS
  const amount = params.amount as number;
  const amountInCents = String(amount * 100);

  // Directly update the totalBudget within the fields JSONB using jsonb_set
  await db.update(pages)
    .set({
      fields: sql`jsonb_set(
        COALESCE(${pages.fields}, '{}'::jsonb), -- Start with existing fields or an empty object
        ${['totalBudget']}::text[],
        ${sql`${amountInCents}::jsonb`}, -- New value for totalBudget
        true -- create_if_missing
      )`,
      updatedAt: new Date()
    })
    .where(eq(pages.id, pageId));

  // Also update kernel (kernel uses cents for historical reasons)
  await db.update(weddingKernels)
    .set({ budgetTotal: amount * 100, updatedAt: new Date() })
    .where(eq(weddingKernels.tenantId, context.tenantId));

  return {
    success: true,
    message: `Total budget set to $${amount.toLocaleString()}`,
    data: { totalBudget: amount }
  };
}

// ============================================================================ 
// GUEST TOOLS
// ============================================================================ 

interface GuestData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  side?: string;
  group?: string;
  plusOne?: boolean;
  plusOneName?: string;
  rsvp?: string; // "pending" | "confirmed" | "declined"
  mealChoice?: string;
  dietaryRestrictions?: string;
  tableNumber?: number;
  giftReceived?: boolean;
  thankYouSent?: boolean;
  notes?: string;
  createdAt?: string;
}

async function addGuest(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const result = await withPageLock(context.tenantId, "guest-list", async (tx, { pageId, fields }) => {
    const guests = (fields.guests as GuestData[]) || [];

    // Check if guest already exists (by name)
    const existingGuest = guests.find(
      g => g.name?.toLowerCase() === (params.name as string)?.toLowerCase()
    );

    if (existingGuest) {
      return {
        success: false,
        message: `${params.name} is already on the guest list. Use update_guest to modify their info.`,
        guestCount: guests.length
      };
    }

    const newGuest: GuestData = {
      id: crypto.randomUUID(),
      name: params.name as string,
      email: (params.email as string) || "",
      phone: (params.phone as string) || "",
      address: (params.address as string) || "",
      side: (params.side as string) || "both",
      group: (params.group as string) || "",
      plusOne: (params.plusOne as boolean) || false,
      plusOneName: "",
      rsvp: (params.rsvp as string) || "pending",
      mealChoice: (params.mealChoice as string) || "",
      dietaryRestrictions: (params.dietaryRestrictions as string) || "",
      tableNumber: params.tableNumber as number | undefined,
      giftReceived: false,
      thankYouSent: false,
      notes: (params.notes as string) || "",
      createdAt: new Date().toISOString()
    };

    guests.push(newGuest);

    // Update page within transaction
    await tx.update(pages)
      .set({ fields: { ...fields, guests }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    // Update kernel guest count within transaction
    await tx.update(weddingKernels)
      .set({ guestCount: guests.length, updatedAt: new Date() })
      .where(eq(weddingKernels.tenantId, context.tenantId));

    const extras: string[] = [];
    if (params.group) extras.push(`group: ${params.group}`);
    if (params.plusOne) extras.push("with plus one");
    if (params.rsvp === "confirmed") extras.push("confirmed");

    return {
      success: true,
      message: `Added ${params.name} to guest list${extras.length ? ` (${extras.join(", ")})` : ""}. Total guests: ${guests.length}`,
      data: { guest: newGuest, totalGuests: guests.length, pageId },
      guestCount: guests.length
    };
  });

  // Update checklist decision outside transaction (non-critical)
  if (result.success && (result as { guestCount?: number }).guestCount && (result as { guestCount: number }).guestCount > 0) {
    await updateDecisionFn(context.tenantId, "guest_list", {
      status: "researching"
    });
  }

  return result;
}

async function updateGuest(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  return withPageLock(context.tenantId, "guest-list", async (tx, { pageId, fields }) => {
    const guests = (fields.guests as GuestData[]) || [];
    let guestIndex = -1;

    // Find by ID first
    if (params.guestId) {
      guestIndex = guests.findIndex(g => g.id === params.guestId);
    }
    // Find by name (partial match, case insensitive)
    else if (params.guestName) {
      const searchName = (params.guestName as string).toLowerCase();
      // Try exact match first
      guestIndex = guests.findIndex(g =>
        g.name?.toLowerCase() === searchName
      );
      // Then try partial match
      if (guestIndex === -1) {
        guestIndex = guests.findIndex(g =>
          g.name?.toLowerCase().includes(searchName) ||
          searchName.includes(g.name?.toLowerCase() || "")
        );
      }
    }

    if (guestIndex === -1) {
      const guestNames = guests.slice(0, 10).map(g => g.name).join(", ");
      return {
        success: false,
        message: `Guest not found. Available guests: ${guestNames || "none"}${guests.length > 10 ? `... and ${guests.length - 10} more` : ""}`
      };
    }

    const guest = guests[guestIndex];
    const changes: string[] = [];

    // Update all provided fields
    if (params.name !== undefined) {
      guest.name = params.name as string;
      changes.push("name");
    }
    if (params.email !== undefined) {
      guest.email = params.email as string;
      changes.push("email");
    }
    if (params.phone !== undefined) {
      guest.phone = params.phone as string;
      changes.push("phone");
    }
    if (params.address !== undefined) {
      guest.address = params.address as string;
      changes.push("address");
    }
    if (params.side !== undefined) {
      guest.side = params.side as string;
      changes.push("side");
    }
    if (params.group !== undefined) {
      guest.group = params.group as string;
      changes.push("group");
    }
    if (params.plusOne !== undefined) {
      guest.plusOne = params.plusOne as boolean;
      changes.push("plus one");
    }
    if (params.plusOneName !== undefined) {
      guest.plusOneName = params.plusOneName as string;
      changes.push("plus one name");
    }
    if (params.rsvp !== undefined) {
      guest.rsvp = params.rsvp as string;
      changes.push(`RSVP to ${params.rsvp}`);
    }
    if (params.mealChoice !== undefined) {
      guest.mealChoice = params.mealChoice as string;
      changes.push(`meal to ${params.mealChoice}`);
    }
    if (params.dietaryRestrictions !== undefined) {
      guest.dietaryRestrictions = params.dietaryRestrictions as string;
      changes.push("dietary restrictions");
    }
    if (params.tableNumber !== undefined) {
      guest.tableNumber = params.tableNumber as number;
      changes.push(`table to ${params.tableNumber}`);
    }
    if (params.giftReceived !== undefined) {
      guest.giftReceived = params.giftReceived as boolean;
      changes.push(params.giftReceived ? "marked gift received" : "marked gift not received");
    }
    if (params.thankYouSent !== undefined) {
      guest.thankYouSent = params.thankYouSent as boolean;
      changes.push(params.thankYouSent ? "marked thank you sent" : "marked thank you not sent");
    }
    if (params.notes !== undefined) {
      guest.notes = params.notes as string;
      changes.push("notes");
    }

    guests[guestIndex] = guest;

    await tx.update(pages)
      .set({ fields: { ...fields, guests }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    return {
      success: true,
      message: `Updated ${guest.name}: changed ${changes.join(", ")}`,
      data: { guest, pageId }
    };
  });
}

async function deleteGuest(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  logger.info("deleteGuest called", { params, tenantId: context.tenantId });

  return withPageLock(context.tenantId, "guest-list", async (tx, { pageId, fields }) => {
    const guests = (fields.guests as GuestData[]) || [];
    logger.info("deleteGuest: found guests", {
      guestCount: guests.length,
      guestNames: guests.slice(0, 5).map(g => g.name),
      searchParams: { guestId: params.guestId, guestName: params.guestName }
    });

    let guestIndex = -1;

    // Find by ID first
    if (params.guestId) {
      guestIndex = guests.findIndex(g => g.id === params.guestId);
      logger.info("deleteGuest: searched by ID", { guestId: params.guestId, found: guestIndex !== -1 });
    }
    // Find by name (partial match, case insensitive)
    else if (params.guestName) {
      const searchName = (params.guestName as string).toLowerCase();
      // Try exact match first
      guestIndex = guests.findIndex(g =>
        g.name?.toLowerCase() === searchName
      );
      logger.info("deleteGuest: exact name match", { searchName, found: guestIndex !== -1 });
      // Then try partial match
      if (guestIndex === -1) {
        guestIndex = guests.findIndex(g =>
          g.name?.toLowerCase().includes(searchName) ||
          searchName.includes(g.name?.toLowerCase() || "")
        );
        logger.info("deleteGuest: partial name match", { searchName, found: guestIndex !== -1, index: guestIndex });
      }
    } else {
      logger.warn("deleteGuest: no guestId or guestName provided", { params });
    }

    if (guestIndex === -1) {
      const guestNames = guests.slice(0, 5).map(g => g.name).join(", ");
      logger.info("deleteGuest: guest not found", {
        searchParams: { guestId: params.guestId, guestName: params.guestName },
        currentGuests: guestNames
      });
      return {
        success: false,
        message: `Guest not found. Current guests: ${guestNames || "none"}${guests.length > 5 ? `... and ${guests.length - 5} more` : ""}`
      };
    }

    const deletedGuest = guests[guestIndex];
    guests.splice(guestIndex, 1);

    // Update page within transaction
    await tx.update(pages)
      .set({ fields: { ...fields, guests }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    // Update kernel guest count within transaction
    await tx.update(weddingKernels)
      .set({ guestCount: guests.length, updatedAt: new Date() })
      .where(eq(weddingKernels.tenantId, context.tenantId));

    logger.info("deleteGuest: success", { deletedGuest: deletedGuest.name, remainingCount: guests.length });

    return {
      success: true,
      message: `Removed ${deletedGuest.name} from guest list. Total guests: ${guests.length}`,
      data: deletedGuest
    };
  });
}

async function addGuestGroup(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  return withPageLock(context.tenantId, "guest-list", async (tx, { pageId, fields }) => {
    const guests = (fields.guests as GuestData[]) || [];
    const guestNames = params.guests as string[];
    const newGuests: GuestData[] = [];
    const skipped: string[] = [];

    for (const name of guestNames) {
      // Check if guest already exists
      const exists = guests.some(g => g.name?.toLowerCase() === name.toLowerCase());
      if (exists) {
        skipped.push(name);
        continue;
      }

      const newGuest: GuestData = {
        id: crypto.randomUUID(),
        name,
        email: "",
        phone: "",
        address: (params.address as string) || "",
        side: (params.side as string) || "both",
        group: (params.group as string) || "",
        plusOne: (params.plusOnes as boolean) || false,
        rsvp: "pending",
        mealChoice: "",
        dietaryRestrictions: "",
        giftReceived: false,
        thankYouSent: false,
        notes: "",
        createdAt: new Date().toISOString()
      };
      guests.push(newGuest);
      newGuests.push(newGuest);
    }

    if (newGuests.length === 0) {
      return {
        success: false,
        message: `All ${skipped.length} guests are already on the list: ${skipped.join(", ")}`
      };
    }

    // Update page within transaction
    await tx.update(pages)
      .set({ fields: { ...fields, guests }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    // Update kernel guest count within transaction
    await tx.update(weddingKernels)
      .set({ guestCount: guests.length, updatedAt: new Date() })
      .where(eq(weddingKernels.tenantId, context.tenantId));

    let message = `Added ${newGuests.length} guest${newGuests.length > 1 ? "s" : ""}: ${newGuests.map(g => g.name).join(", ")}`;
    if (skipped.length > 0) {
      message += `. Skipped ${skipped.length} (already on list): ${skipped.join(", ")}`;
    }
    message += `. Total guests: ${guests.length}`;

    return {
      success: true,
      message,
      data: { guests: newGuests, totalGuests: guests.length, skipped, pageId }
    };
  });
}

async function getGuestList(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { fields } = await getOrCreatePage(context.tenantId, "guest-list");
  
  let guests = (fields.guests as GuestData[]) || [];
  const totalCount = guests.length;

  // Apply filters
  if (params.filter) {
    const filter = params.filter as string;
    switch (filter) {
      case "confirmed":
        guests = guests.filter(g => g.rsvp === "confirmed");
        break;
      case "declined":
        guests = guests.filter(g => g.rsvp === "declined");
        break;
      case "pending":
        guests = guests.filter(g => g.rsvp === "pending" || !g.rsvp);
        break;
      case "no_address":
        guests = guests.filter(g => !g.address || g.address.trim() === "");
        break;
      case "no_meal":
        guests = guests.filter(g => !g.mealChoice || g.mealChoice.trim() === "");
        break;
      case "with_plus_one":
        guests = guests.filter(g => g.plusOne === true);
        break;
      case "no_thank_you":
        guests = guests.filter(g => g.giftReceived && !g.thankYouSent);
        break;
    }
  }

  if (params.group) {
    const searchGroup = (params.group as string).toLowerCase();
    guests = guests.filter(g => g.group?.toLowerCase().includes(searchGroup));
  }

  if (params.side) {
    guests = guests.filter(g => g.side === params.side);
  }

  if (params.search) {
    const search = (params.search as string).toLowerCase();
    guests = guests.filter(g => g.name?.toLowerCase().includes(search));
  }

  // Format response
  const guestList = guests.map(g => {
    let status = "";
    if (g.rsvp === "confirmed") status = " [confirmed]";
    else if (g.rsvp === "declined") status = " [declined]";
    return `${g.name}${status}${g.group ? ` (${g.group})` : ""}`;
  });

  let message = `**Guest List** (${guests.length}${totalCount !== guests.length ? ` of ${totalCount}` : ""}):\n`;
  if (guests.length === 0) {
    message += "\nNo guests match your criteria.";
  } else if (guests.length <= 20) {
    message += guestList.map(g => `• ${g}`).join("\n");
  } else {
    message += guestList.slice(0, 15).map(g => `• ${g}`).join("\n");
    message += `\n... and ${guests.length - 15} more`;
  }

  return {
    success: true,
    message,
    data: { guests, count: guests.length, totalCount }
  };
}

async function getGuestStats(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { fields } = await getOrCreatePage(context.tenantId, "guest-list");
  
  const guests = (fields.guests as GuestData[]) || [];

  const stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvp === "confirmed").length,
    declined: guests.filter(g => g.rsvp === "declined").length,
    pending: guests.filter(g => g.rsvp === "pending" || !g.rsvp).length,
    withPlusOne: guests.filter(g => g.plusOne).length,
    noAddress: guests.filter(g => !g.address || g.address.trim() === "").length,
    noMealChoice: guests.filter(g => !g.mealChoice || g.mealChoice.trim() === "").length,
    giftsReceived: guests.filter(g => g.giftReceived).length,
    thankYousPending: guests.filter(g => g.giftReceived && !g.thankYouSent).length,
  };

  // Count meal choices
  const mealCounts: Record<string, number> = {};
  guests.forEach(g => {
    if (g.mealChoice) {
      mealCounts[g.mealChoice] = (mealCounts[g.mealChoice] || 0) + 1;
    }
  });

  // Count by group
  const groupCounts: Record<string, number> = {};
  guests.forEach(g => {
    const group = g.group || "Ungrouped";
    groupCounts[group] = (groupCounts[group] || 0) + 1;
  });

  // Count dietary restrictions
  const dietaryGuests = guests.filter(g => g.dietaryRestrictions);

  let message = `**Guest List Stats:**\n`;
  message += `• Total: ${stats.total} guests`;
  if (stats.withPlusOne > 0) {
    message += ` (${stats.withPlusOne} with plus ones = up to ${stats.total + stats.withPlusOne} attendees)`;
  }
  message += `\n• RSVPs: ${stats.confirmed} confirmed, ${stats.declined} declined, ${stats.pending} pending`;
  
  if (Object.keys(mealCounts).length > 0) {
    message += `\n\n**Meal Choices:**`;
    Object.entries(mealCounts).forEach(([meal, count]) => {
      message += `\n• ${meal}: ${count}`;
    });
    if (stats.noMealChoice > 0) {
      message += `\n• No choice yet: ${stats.noMealChoice}`;
    }
  }

  if (dietaryGuests.length > 0) {
    message += `\n\n**Dietary Restrictions:** ${dietaryGuests.length} guest${dietaryGuests.length > 1 ? "s" : ""}`;
    dietaryGuests.slice(0, 5).forEach(g => {
      message += `\n• ${g.name}: ${g.dietaryRestrictions}`;
    });
    if (dietaryGuests.length > 5) {
      message += `\n... and ${dietaryGuests.length - 5} more`;
    }
  }

  if (stats.noAddress > 0) {
    message += `\n\n**Missing Info:** ${stats.noAddress} guests need addresses`;
  }

  if (stats.thankYousPending > 0) {
    message += `\n\n**Thank You Notes:** ${stats.thankYousPending} pending`;
  }

  return {
    success: true,
    message,
    data: { stats, mealCounts, groupCounts, dietaryGuests }
  };
}

async function syncRsvpResponses(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "guest-list");
  
  // Find RSVP form for this tenant
  const form = await db.query.rsvpForms.findFirst({
    where: eq(rsvpForms.tenantId, context.tenantId)
  });

  if (!form) {
    return {
      success: false,
      message: "No RSVP form found. Create one first with create_rsvp_link."
    };
  }

  // Get responses
  let responses = await db.query.rsvpResponses.findMany({
    where: eq(rsvpResponses.formId, form.id)
  });

  // Filter to only unsynced if requested (default)
  if (params.onlyNew !== false) {
    responses = responses.filter(r => !r.syncedToGuestList);
  }

  if (responses.length === 0) {
    return {
      success: true,
      message: params.onlyNew !== false 
        ? "No new RSVP responses to sync."
        : "No RSVP responses found."
    };
  }

  const guests = (fields.guests as GuestData[]) || [];
  const added: string[] = [];
  const updated: string[] = [];

  for (const response of responses) {
    // Check if guest already exists by name
    const existingIndex = guests.findIndex(
      g => g.name?.toLowerCase() === response.name.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing guest
      const guest = guests[existingIndex];
      if (response.email) guest.email = response.email;
      if (response.phone) guest.phone = response.phone;
      if (response.address) guest.address = response.address;
      guest.rsvp = response.attending === true ? "confirmed" : response.attending === false ? "declined" : "pending";
      if (response.mealChoice) guest.mealChoice = response.mealChoice;
      if (response.dietaryRestrictions) guest.dietaryRestrictions = response.dietaryRestrictions;
      if (response.plusOneName) guest.plusOneName = response.plusOneName;
      if (response.songRequest) guest.notes = (guest.notes || "") + (guest.notes ? "\n" : "") + `Song request: ${response.songRequest}`;
      guests[existingIndex] = guest;
      updated.push(response.name);
    } else {
      // Add new guest
      const newGuest: GuestData = {
        id: crypto.randomUUID(),
        name: response.name,
        email: response.email || "",
        phone: response.phone || "",
        address: response.address || "",
        side: "both",
        group: "",
        plusOne: response.plusOne || false,
        plusOneName: response.plusOneName || "",
        rsvp: response.attending === true ? "confirmed" : response.attending === false ? "declined" : "pending",
        mealChoice: response.mealChoice || "",
        dietaryRestrictions: response.dietaryRestrictions || "",
        giftReceived: false,
        thankYouSent: false,
        notes: response.songRequest ? `Song request: ${response.songRequest}` : "",
        createdAt: new Date().toISOString()
      };
      guests.push(newGuest);
      added.push(newGuest.name);
    }

    // Mark response as synced
    await db.update(rsvpResponses)
      .set({ syncedToGuestList: true })
      .where(eq(rsvpResponses.id, response.id));
  }

  // Save updated guest list
  await db.update(pages)
    .set({ fields: { ...fields, guests }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Update kernel guest count
  await db.update(weddingKernels)
    .set({ guestCount: guests.length, updatedAt: new Date() })
    .where(eq(weddingKernels.tenantId, context.tenantId));

  // ADDED: Update checklist for guest_list decision
  if (guests.length > 0) {
      await updateDecisionFn(context.tenantId, "guest_list", {
          status: "decided" // Once responses are synced, it's pretty decided
      });
  }


  let message = `Synced ${responses.length} RSVP response${responses.length > 1 ? "s" : ""}:`;
  if (added.length > 0) {
    message += `\n• Added: ${added.join(", ")}`;
  }
  if (updated.length > 0) {
    message += `\n• Updated: ${updated.join(", ")}`;
  }
  message += `\n\nTotal guests: ${guests.length}`;

  return {
    success: true,
    message,
    data: { added, updated, totalGuests: guests.length, pageId }
  };
}

// ============================================================================ 
// RSVP TOOLS
// ============================================================================ 

function generateSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

async function createRsvpLink(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // Get the guest list page (RSVP forms are linked to guest list pages)
  const { pageId } = await getOrCreatePage(context.tenantId, "guest-list");

  // Get tenant for slug generation
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, context.tenantId)
  });

  if (!tenant) {
    return { success: false, message: "Tenant not found" };
  }

  // Build the fields configuration
  const fields = {
    name: true, // Always required
    email: params.collectEmail !== false, // Default true
    phone: params.collectPhone === true, // Default false
    address: params.collectAddress !== false, // Default true
    attending: true, // Always include RSVP status
    mealChoice: params.collectMealChoice === true,
    dietaryRestrictions: params.collectDietaryRestrictions === true,
    plusOne: params.collectPlusOne === true,
    plusOneName: params.collectPlusOne === true,
    plusOneMeal: params.collectPlusOne === true && params.collectMealChoice === true,
    songRequest: params.collectSongRequest === true,
    notes: true, // Always include notes
  };

  const mealOptions = (params.mealOptions as string[]) || [];

  // Check if form already exists
  const existingForm = await db.query.rsvpForms.findFirst({
    where: and(
      eq(rsvpForms.pageId, pageId),
      eq(rsvpForms.tenantId, context.tenantId)
    )
  });

  if (existingForm) {
    // Update existing form
    const [updatedForm] = await db
      .update(rsvpForms)
      .set({
        fields,
        mealOptions,
        updatedAt: new Date(),
      })
      .where(eq(rsvpForms.id, existingForm.id))
      .returning();

    const link = `${process.env.NEXTAUTH_URL || "https://aisleboard.com"}/rsvp/${updatedForm.slug}`;

    return {
      success: true,
      message: `Your RSVP link has been updated! Share this with your guests:\n\n**${link}**`,
      data: { slug: updatedForm.slug, link, fields, mealOptions }
    };
  }

  // Generate slug from couple names
  const baseSlug = generateSlug(tenant.displayName || "wedding");
  let slug = baseSlug;

  // Check if slug exists
  const slugExists = await db.query.rsvpForms.findFirst({
    where: eq(rsvpForms.slug, slug)
  });

  if (slugExists) {
    slug = `${baseSlug}-${context.tenantId.slice(-4)}`;
  }

  // Create new RSVP form
  const [newForm] = await db
    .insert(rsvpForms)
    .values({
      tenantId: context.tenantId,
      pageId,
      slug,
      title: "RSVP",
      weddingDate: tenant.weddingDate,
      fields,
      mealOptions,
    })
    .returning();

  const link = `${process.env.NEXTAUTH_URL || "https://aisleboard.com"}/rsvp/${newForm.slug}`;

  return {
    success: true,
    message: `I've created your RSVP link! Share this with your guests:\n\n**${link}**\n\nGuests can use this to submit their name, ${params.collectAddress !== false ? "address, " : ""}${params.collectMealChoice ? "meal choice, " : ""}and RSVP status.`, 
    data: { slug: newForm.slug, link, fields, mealOptions }
  };
}

async function getRsvpLink(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // Find existing RSVP form for this tenant
  const form = await db.query.rsvpForms.findFirst({
    where: eq(rsvpForms.tenantId, context.tenantId)
  });

  if (!form) {
    return {
      success: false,
      message: "You don't have an RSVP link yet. Would you like me to create one for you?"
    };
  }

  const link = `${process.env.NEXTAUTH_URL || "https://aisleboard.com"}/rsvp/${form.slug}`;

  // Get response count
  const responses = await db.query.rsvpResponses.findMany({
    where: eq(rsvpResponses.formId, form.id)
  });

  const attending = responses.filter(r => r.attending === true).length;
  const notAttending = responses.filter(r => r.attending === false).length;
  const pending = responses.filter(r => r.attending === null).length;

  let statsMessage = "";
  if (responses.length > 0) {
    statsMessage = `\n\nSo far: ${attending} attending, ${notAttending} not attending, ${pending} haven't responded yet.`;
  }

  return {
    success: true,
    message: `Here's your RSVP link:\n\n**${link}**${statsMessage}`,
    data: { slug: form.slug, link, responseCount: responses.length }
  };
}

async function getRsvpResponses(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // Find RSVP form for this tenant
  const form = await db.query.rsvpForms.findFirst({
    where: eq(rsvpForms.tenantId, context.tenantId)
  });

  if (!form) {
    return {
      success: false,
      message: "You don't have an RSVP form yet. Would you like me to create one?"
    };
  }

  // Get all responses
  const responses = await db.query.rsvpResponses.findMany({
    where: eq(rsvpResponses.formId, form.id),
    orderBy: (responses, { desc }) => [desc(responses.createdAt)]
  });

  if (responses.length === 0) {
    return {
      success: true,
      message: "No responses yet! Make sure to share your RSVP link with your guests.",
      data: { responses: [], stats: { total: 0, attending: 0, notAttending: 0, pending: 0 } }
    };
  }

  const attending = responses.filter(r => r.attending === true);
  const notAttending = responses.filter(r => r.attending === false);
  const pending = responses.filter(r => r.attending === null);

  let message = `**RSVP Summary:**\n`;
  message += `• ${attending.length} attending`;
  if (attending.length > 0) {
    message += `: ${attending.slice(0, 5).map(r => r.name).join(", ")}${attending.length > 5 ? ` and ${attending.length - 5} more` : ""}`;
  }
  message += `\n• ${notAttending.length} not attending`;
  message += `\n• ${pending.length} haven't responded yet`;
  message += `\n\n**Total responses:** ${responses.length}`;

  // Check for dietary restrictions
  const dietary = responses.filter(r => r.dietaryRestrictions).map(r => ({
    name: r.name,
    restriction: r.dietaryRestrictions
  }));

  if (dietary.length > 0) {
    message += `\n\n**Dietary restrictions:**`;
    dietary.forEach(d => {
      message += `\n• ${d.name}: ${d.restriction}`;
    });
  }

  return {
    success: true,
    message,
    data: {
      responses,
      stats: {
        total: responses.length,
        attending: attending.length,
        notAttending: notAttending.length,
        pending: pending.length
      }
    }
  };
}

// ============================================================================ 
// CALENDAR TOOLS
// ============================================================================ 

async function getCalendarEvents(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const events = await getCalendarEventsByTenantId(context.tenantId);
  
  let filtered = events;
  const now = new Date();

  // Date Filtering
  if (params.startDate) {
    const start = new Date(params.startDate as string);
    if (!isNaN(start.getTime())) {
      filtered = filtered.filter(e => e.startTime >= start);
    }
  } else {
    // Default to showing upcoming events from today if no specific range given, 
    // unless user asked for "past" events (which we can infer if endDate is in past, but simpler to just default to >= today)
    // actually, let's just default to >= today for "upcoming" context unless range specified
    // If endDate is provided but not startDate, assume range is -infinity to endDate? No, usually means "until X".
    // Let's stick to: if no start date, show from today.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter(e => e.startTime >= today);
  }

  if (params.endDate) {
    const end = new Date(params.endDate as string);
    if (!isNaN(end.getTime())) {
      // Include the whole end date
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => e.startTime <= end);
    }
  } else if (!params.startDate) {
    // If no range specified at all, default to next 30 days to avoid overwhelming
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    filtered = filtered.filter(e => e.startTime <= nextMonth);
  }

  // Category Filtering
  if (params.category) {
    const cat = (params.category as string).toLowerCase();
    filtered = filtered.filter(e => e.category.toLowerCase() === cat);
  }

  // Limit
  if (params.limit) {
    filtered = filtered.slice(0, params.limit as number);
  } else {
    filtered = filtered.slice(0, 50); // Safe default
  }

  if (filtered.length === 0) {
    return {
      success: true,
      message: "No upcoming events found for the specified criteria.",
      data: []
    };
  }

  // Format for chat
  const eventList = filtered.map(e => {
    const dateStr = e.startTime.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = e.allDay ? "All Day" : e.startTime.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
    return `• **${e.title}**: ${dateStr} at ${timeStr}${e.location ? ` (${e.location})` : ""}`;
  }).join("\n");

  return {
    success: true,
    message: `Here are your upcoming events:\n\n${eventList}`,
    data: filtered
  };
}

async function addEvent(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  try {
    // Robust date parsing
    const dateStr = String(params.date).trim();
    const timeStr = params.time ? String(params.time).trim() : "12:00";
    
    // Validate format YYYY-MM-DD roughly
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Try to fix common LLM errors (like YYYY/MM/DD)
      // If completely invalid, let new Date fail and we catch it
    }

    const startDateTimeStr = `${dateStr}T${timeStr.length === 5 ? timeStr : "12:00"}:00`;
    const startTime = new Date(startDateTimeStr);

    if (isNaN(startTime.getTime())) {
      throw new Error(`Invalid date/time format: ${dateStr} ${timeStr}`);
    }

    let endTime: Date | undefined;
    if (params.endTime) {
      const endTimeStr = String(params.endTime).trim();
      const endDateTimeStr = `${dateStr}T${endTimeStr.length === 5 ? endTimeStr : "13:00"}:00`;
      endTime = new Date(endDateTimeStr);
      if (isNaN(endTime.getTime())) {
        endTime = undefined; // Fallback if end time is bad
      }
    }
    
    const [event] = await db.insert(calendarEvents).values({
      tenantId: context.tenantId,
      title: params.title as string,
      startTime,
      endTime,
      location: params.location as string,
      category: (params.category as string) || "other",
      description: params.notes as string
    }).returning();

    return {
      success: true,
      message: `Added "${params.title}" to calendar on ${dateStr}`,
      data: event
    };
  } catch (error) {
    console.error("[addEvent] Error:", error);
    return {
      success: false,
      message: `Failed to add event: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

async function updateEvent(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const events = await getCalendarEventsByTenantId(context.tenantId);
  let targetEvent: CalendarEvent | undefined;

  if (params.eventId) {
    targetEvent = events.find(e => e.id === params.eventId);
  } else if (params.title) {
    const searchTitle = (params.title as string).toLowerCase();
    targetEvent = events.find(e => e.title.toLowerCase().includes(searchTitle));
  }

  if (!targetEvent) {
    return { success: false, message: "Event not found. Please provide a valid ID or title." };
  }

  const updates: Partial<CalendarEvent> = {};
  let message = `Updated "${targetEvent.title}":`;

  if (params.newTitle) {
    updates.title = params.newTitle as string;
    message += ` title changed to "${params.newTitle}"`;
  }

  // Handle date/time updates
  const newDate = (params.date as string) || targetEvent.startTime.toISOString().split('T')[0];
  
  // If time provided, update time. If not, keep existing time.
  // Need to extract existing time carefully.
  let newTimeStr = "12:00";
  if (params.time) {
    newTimeStr = String(params.time).trim();
  } else {
    newTimeStr = targetEvent.startTime.toLocaleTimeString("en-US", { hour12: false, hour: '2-digit', minute: '2-digit' });
    // Handle single digit hour edge case from toLocaleTimeString if locale varies, but usually HH:MM
    if (newTimeStr.length === 4) newTimeStr = "0" + newTimeStr; 
  }

  if (params.date || params.time) {
    const startDateTimeStr = `${newDate}T${newTimeStr.length === 5 ? newTimeStr : "12:00"}:00`;
    const newStart = new Date(startDateTimeStr);
    if (!isNaN(newStart.getTime())) {
      updates.startTime = newStart;
      message += `, moved to ${newDate} at ${newTimeStr}`;
    }
  }

  if (params.location) {
    updates.location = params.location as string;
    message += `, location set to ${params.location}`;
  }
  if (params.category) {
    updates.category = params.category as string;
    message += `, category set to ${params.category}`;
  }
  if (params.notes) {
    updates.description = params.notes as string;
    message += `, notes updated`;
  }

  await updateCalendarEvent(targetEvent.id, context.tenantId, updates);

  return {
    success: true,
    message,
    data: { ...targetEvent, ...updates }
  };
}

async function deleteEvent(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const events = await getCalendarEventsByTenantId(context.tenantId);
  let targetEvent: CalendarEvent | undefined;

  if (params.eventId) {
    targetEvent = events.find(e => e.id === params.eventId);
  } else if (params.title) {
    const searchTitle = (params.title as string).toLowerCase();
    const searchDate = params.date ? new Date(params.date as string) : null;

    // Filter matches
    const matches = events.filter(e => e.title.toLowerCase().includes(searchTitle));
    
    if (matches.length === 1) {
      targetEvent = matches[0];
    } else if (matches.length > 1 && searchDate && !isNaN(searchDate.getTime())) {
      // Disambiguate by date
      targetEvent = matches.find(e => 
        e.startTime.getFullYear() === searchDate.getFullYear() &&
        e.startTime.getMonth() === searchDate.getMonth() &&
        e.startTime.getDate() === searchDate.getDate()
      );
    } else if (matches.length > 1) {
      return { 
        success: false, 
        message: `Found multiple events matching "${params.title}". Please specify the date to delete the correct one.` 
      };
    }
  }

  if (!targetEvent) {
    return { success: false, message: "Event not found." };
  }

  await deleteCalendarEvent(targetEvent.id, context.tenantId);

  return {
    success: true,
    message: `Deleted event: "${targetEvent.title}"`,
    data: targetEvent
  };
}

async function addDayOfEvent(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {

  const { pageId, fields } = await getOrCreatePage(context.tenantId, "day-of-schedule");
  
  const events = (fields.events as Array<Record<string, unknown>>) || [];
  
  const newEvent = {
    id: crypto.randomUUID(),
    time: params.time,
    event: params.event,
    duration: params.duration,
    location: params.location || "",
    notes: params.notes || ""
  };

  events.push(newEvent);
  
  // Sort by time
  events.sort((a, b) => {
    const timeA = String(a.time).replace(/[^0-9:]/g, "");
    const timeB = String(b.time).replace(/[^0-9:]/g, "");
    return timeA.localeCompare(timeB);
  });

  await db.update(pages)
    .set({ fields: { ...fields, events }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Update checklist decision
  if (events.length > 0) {
      await updateDecisionFn(context.tenantId, "day_of_timeline", {
          status: "researching"
      });
  }

  return {
    success: true,
    message: `Added "${params.event}" at ${params.time} to day-of timeline`,
    data: newEvent
  };
}

// ============================================================================ 
// VENDOR TOOLS
// ============================================================================ 

async function addVendor(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const result = await withPageLock(context.tenantId, "vendor-contacts", async (tx, { pageId, fields }) => {
    const vendors = (fields.vendors as Array<Record<string, unknown>>) || [];

    const newVendor = {
      id: crypto.randomUUID(),
      category: params.category,
      name: params.name,
      contactName: params.contactName || "",
      email: params.email || "",
      phone: params.phone || "",
      status: params.status || "researching",
      price: params.price ? (params.price as number) * 100 : null,
      notes: params.notes || "",
      depositPaid: false,
      contractSigned: false,
      createdAt: new Date().toISOString()
    };

    vendors.push(newVendor);

    await tx.update(pages)
      .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    return {
      success: true,
      message: `Added ${params.name} (${params.category}) to vendors`,
      data: newVendor
    };
  });

  // Update kernel and checklist decisions outside transaction (non-critical)
  if (result.success) {
    await updateKernelDecision(context.tenantId, params.category as string, {
      status: params.status,
      name: params.name,
      locked: params.status === "booked"
    });

    const decisionName = getDecisionNameFromCategory(params.category as string);
    if (decisionName) {
      const decisionStatus = params.status === "booked" || params.status === "confirmed" ? "decided" : "researching";
      await updateDecisionFn(context.tenantId, decisionName, {
        status: decisionStatus,
        choiceName: params.name as string,
      });
    }
  }

  return result;
}

function getDecisionNameFromCategory(category: string): string | null {
  const c = (category || "").toLowerCase();
  if (c.includes("photo")) return "photographer";
  if (c.includes("video")) return "videographer";
  if (c.includes("cater")) return "caterer";
  if (c.includes("dj") || c.includes("band") || c.includes("music")) return "dj_band";
  if (c.includes("flower") || c.includes("florist")) return "florist";
  if (c.includes("officiant") || c.includes("pastor") || c.includes("priest")) return "officiant";
  if (c.includes("cake") || c.includes("baker") || c.includes("dessert")) return "cake_baker";
  if (c.includes("hair") || c.includes("makeup") || c.includes("beauty")) return "hair_makeup";
  if (c.includes("dress") || c.includes("gown")) return "wedding_dress";
  if (c.includes("suit") || c.includes("tux")) return "partner_attire";
  if (c.includes("transport") || c.includes("limo") || c.includes("bus")) return "transportation";
  if (c.includes("hotel") || c.includes("accommodation") || c.includes("room")) return "accommodations";
  if (c.includes("invitation") || c.includes("stationery") || c.includes("paper")) return "invitations";
  return null;
}

async function updateVendor(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const result = await withPageLock(context.tenantId, "vendor-contacts", async (tx, { pageId, fields }) => {
    const vendors = (fields.vendors as Array<Record<string, unknown>>) || [];
    let vendorIndex = -1;

    // Find by ID first
    if (params.vendorId) {
      vendorIndex = vendors.findIndex(v => v.id === params.vendorId);
    }
    // Fall back to name match (case insensitive)
    else if (params.vendorName) {
      const searchName = (params.vendorName as string).toLowerCase();
      // Try exact match first
      vendorIndex = vendors.findIndex(v =>
        (v.name as string)?.toLowerCase() === searchName
      );
      // Then try partial match
      if (vendorIndex === -1) {
        vendorIndex = vendors.findIndex(v =>
          (v.name as string)?.toLowerCase().includes(searchName) ||
          searchName.includes((v.name as string)?.toLowerCase() || "")
        );
      }
    }

    if (vendorIndex === -1) {
      const vendorNames = vendors.slice(0, 5).map(v => v.name).join(", ");
      return {
        success: false,
        message: `Vendor not found. Available vendors: ${vendorNames || "none"}${vendors.length > 5 ? `... and ${vendors.length - 5} more` : ""}`
      };
    }

    const vendor = vendors[vendorIndex];
    const changes: string[] = [];

    // Update fields if provided
    if (params.name !== undefined) {
      vendor.name = params.name;
      changes.push("name");
    }
    if (params.category !== undefined) {
      vendor.category = params.category;
      changes.push("category");
    }
    if (params.contactName !== undefined) {
      vendor.contactName = params.contactName;
      changes.push("contact info");
    }
    if (params.email !== undefined) {
      vendor.email = params.email;
      changes.push("email");
    }
    if (params.phone !== undefined) {
      vendor.phone = params.phone;
      changes.push("phone");
    }
    if (params.status !== undefined) {
      vendor.status = params.status;
      changes.push(`status to ${params.status}`);
    }
    if (params.price !== undefined) {
      vendor.price = (params.price as number) * 100; // Convert to cents
      changes.push(`price to $${params.price}`);
    }
    if (params.notes !== undefined) {
      vendor.notes = params.notes;
      changes.push("notes");
    }
    if (params.depositPaid !== undefined) {
      vendor.depositPaid = params.depositPaid;
      changes.push(params.depositPaid ? "deposit paid" : "deposit unpaid");
    }
    if (params.contractSigned !== undefined) {
      vendor.contractSigned = params.contractSigned;
      changes.push(params.contractSigned ? "contract signed" : "contract unsigned");
    }

    await tx.update(pages)
      .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));

    return {
      success: true,
      message: `Updated ${vendor.name}: changed ${changes.join(", ")}`,
      data: vendor,
      _vendor: vendor // Pass vendor data for post-transaction updates
    };
  });

  // Update kernel and checklist decisions outside transaction (non-critical)
  if (result.success && (result as { _vendor?: Record<string, unknown> })._vendor) {
    const vendor = (result as { _vendor: Record<string, unknown> })._vendor;

    if (params.status || params.name) {
      await updateKernelDecision(context.tenantId, vendor.category as string, {
        status: vendor.status,
        name: vendor.name,
        locked: vendor.status === "booked"
      });
    }

    const decisionName = getDecisionNameFromCategory(vendor.category as string);
    if (decisionName && params.status) {
      const decisionStatus = vendor.status === "booked" || vendor.status === "confirmed" ? "decided" : "researching";
      await updateDecisionFn(context.tenantId, decisionName, {
        status: decisionStatus,
        choiceName: vendor.name as string,
      });
    }
  }

  return result;
}

async function getVendorList(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "vendor-contacts");
  
  let vendors = (fields.vendors as Array<Record<string, unknown>>) || [];
  const initialCount = vendors.length;

  // Self-healing: Filter out corrupted entries (undefined ID, undefined Name, or Name "0")
  vendors = vendors.filter(v => {
    const name = (v.name as string || "").trim();
    const id = (v.id as string || "").trim();
    
    const isCorrupt = 
      !id || 
      id === "undefined" || 
      !name || 
      name.toLowerCase() === "undefined" ||
      name === "0";
      
    return !isCorrupt;
  });

  // If we found corrupted entries, save the cleaned list immediately
  if (vendors.length !== initialCount) {
    console.log(`[Auto-Cleanup] Removed ${initialCount - vendors.length} corrupted vendor entries.`);
    await db.update(pages)
      .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
      .where(eq(pages.id, pageId));
  }

  const totalCount = vendors.length;

  // Apply filters
  if (params.category) {
    const searchCategory = (params.category as string).toLowerCase();
    vendors = vendors.filter(v => (v.category as string)?.toLowerCase() === searchCategory);
  }

  if (params.status) {
    const searchStatus = (params.status as string).toLowerCase();
    vendors = vendors.filter(v => (v.status as string)?.toLowerCase() === searchStatus);
  }

  if (params.search) {
    const search = (params.search as string).toLowerCase();
    vendors = vendors.filter(v => 
      (v.name as string)?.toLowerCase().includes(search) ||
      (v.contactName as string)?.toLowerCase().includes(search)
    );
  }

  // Format response
  const vendorList = vendors.map(v => {
    const price = v.price ? ` ($${((v.price as number) / 100).toLocaleString()})` : "";
    return `• ${v.name} (ID: ${v.id}) [${v.category}] - ${v.status}${price}`;
  });

  let message = `**Vendor List** (${vendors.length}${totalCount !== vendors.length ? ` of ${totalCount}` : ""}):\n`;
  
  if (vendors.length === 0) {
    message += "\nNo vendors match your criteria.";
  } else {
    message += vendorList.join("\n");
  }

  return {
    success: true,
    message,
    data: { vendors, count: vendors.length, totalCount }
  };
}

async function deleteVendor(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  return withPageLock(context.tenantId, "vendor-contacts", async (tx, { pageId, fields }) => {
    const vendors = (fields.vendors as Array<Record<string, unknown>>) || [];

    // 1. Delete by ID
    if (params.vendorId) {
      // Special handling for "undefined" ID string which comes from LLM when ID is missing
      const targetId = params.vendorId as string;
      const isTargetingUndefined = targetId === "undefined";

      let vendorIndex = vendors.findIndex(v => {
        if (isTargetingUndefined) {
          return !v.id || v.id === "undefined" || v.name === "0";
        }
        return v.id === targetId;
      });

      // Fallback: If targeting undefined and didn't find it, try looking for the strange "0" vendor by name
      if (vendorIndex === -1 && isTargetingUndefined) {
        vendorIndex = vendors.findIndex(v => v.name === "0");
      }

      if (vendorIndex === -1) {
        return { success: false, message: "Vendor not found by ID" };
      }
      const deletedVendor = vendors[vendorIndex];
      vendors.splice(vendorIndex, 1);

      await tx.update(pages)
        .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
        .where(eq(pages.id, pageId));

      return {
        success: true,
        message: `Removed ${deletedVendor.name} from vendor list`,
        data: deletedVendor
      };
    }

    // 2. Delete by Category (Bulk) - Only if name is NOT provided
    if (params.category && !params.vendorName) {
      const category = (params.category as string).toLowerCase();
      const initialCount = vendors.length;

      // Filter out vendors that match the category
      const newVendors = vendors.filter(v => (v.category as string)?.toLowerCase() !== category);

      if (newVendors.length === initialCount) {
        return { success: false, message: `No vendors found in category: ${params.category}` };
      }

      const deletedCount = initialCount - newVendors.length;

      // Require explicit confirmation for bulk deletes (more than 1 vendor)
      if (deletedCount > 1 && params.confirmBulk !== true) {
        const vendorsToDelete = vendors
          .filter(v => (v.category as string)?.toLowerCase() === category)
          .map(v => v.name)
          .join(", ");
        return {
          success: false,
          message: `This will delete ${deletedCount} vendors: ${vendorsToDelete}. Please confirm this bulk delete operation.`,
          requiresConfirmation: true,
          data: { count: deletedCount, vendors: vendorsToDelete }
        };
      }

      await tx.update(pages)
        .set({ fields: { ...fields, vendors: newVendors }, updatedAt: new Date() })
        .where(eq(pages.id, pageId));

      return {
        success: true,
        message: `Removed ${deletedCount} vendor(s) from category: ${params.category}`,
        data: { deletedCount }
      };
    }

    // 3. Delete by Name (with optional category filter)
    if (params.vendorName) {
      const searchName = (params.vendorName as string).toLowerCase();
      const searchCategory = params.category ? (params.category as string).toLowerCase() : null;

      // Map to preserve original indices
      const candidates = vendors.map((v, i) => ({ vendor: v, index: i }));

      // Filter by category if provided
      const filteredCandidates = searchCategory
        ? candidates.filter(({ vendor }) => (vendor.category as string)?.toLowerCase() === searchCategory)
        : candidates;

      // Try exact match first
      let match = filteredCandidates.find(({ vendor }) => (vendor.name as string)?.toLowerCase() === searchName);

      // If no exact match, try partial match
      if (!match) {
        match = filteredCandidates.find(({ vendor }) => (vendor.name as string)?.toLowerCase().includes(searchName));
      }

      if (!match) {
        return { success: false, message: `Vendor "${params.vendorName}" not found` };
      }

      // We found a match, delete it using the original index
      const deletedVendor = vendors[match.index];
      vendors.splice(match.index, 1);

      await tx.update(pages)
        .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
        .where(eq(pages.id, pageId));

      return {
        success: true,
        message: `Removed ${deletedVendor.name} from vendor list`,
        data: deletedVendor
      };
    }

    return {
      success: false,
      message: "Please provide a vendorId, vendorName, or category to delete."
    };
  });
}

// ============================================================================ 
// TASK TOOLS
// ============================================================================ 

async function addTask(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "task-board");
  
  const tasks = (fields.tasks as Array<Record<string, unknown>>) || [];
  
  const newTask = {
    id: crypto.randomUUID(),
    title: params.title,
    dueDate: params.dueDate,
    assignee: params.assignee || "both",
    priority: params.priority || "medium",
    category: params.category || "",
    status: "todo",
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);

  await db.update(pages)
    .set({ fields: { ...fields, tasks }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: `Added task: "${params.title}"`,
    data: newTask
  };
}

async function completeTask(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "task-board");
  
  const tasks = (fields.tasks as Array<Record<string, unknown>>) || [];
  const taskIndex = tasks.findIndex(t => t.id === params.taskId);

  if (taskIndex === -1) {
    return { success: false, message: "Task not found" };
  }

  tasks[taskIndex].status = "done";
  tasks[taskIndex].completedAt = new Date().toISOString();

  await db.update(pages)
    .set({ fields: { ...fields, tasks }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: `Completed task: "${tasks[taskIndex].title}"`,
    data: tasks[taskIndex]
  };
}

async function deleteTask(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "task-board");
  
  const tasks = (fields.tasks as Array<Record<string, unknown>>) || [];
  let taskIndex = -1;
  let deletedTask: Record<string, unknown> | null = null;

  // Find by ID first
  if (params.taskId) {
    taskIndex = tasks.findIndex(t => t.id === params.taskId);
  }
  // Fall back to title match (case insensitive)
  else if (params.taskTitle) {
    taskIndex = tasks.findIndex(t => 
      (t.title as string)?.toLowerCase().includes((params.taskTitle as string).toLowerCase())
    );
  }

  if (taskIndex === -1) {
    return { success: false, message: "Task not found" };
  }

  deletedTask = tasks[taskIndex];
  tasks.splice(taskIndex, 1);

  await db.update(pages)
    .set({ fields: { ...fields, tasks }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: `Removed task: "${deletedTask.title}"`,
    data: deletedTask
  };
}

// ============================================================================ 
// KERNEL TOOLS
// ============================================================================ 

async function updateWeddingDetails(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const kernelUpdates: Record<string, unknown> = { updatedAt: new Date() };
  const decisionsUpdates: Record<string, unknown> = {};

  if (params.weddingDate) {
    kernelUpdates.weddingDate = new Date(params.weddingDate as string);
    // Also update tenant (this is a separate table, so it remains a direct update)
    await db.update(tenants)
      .set({ weddingDate: kernelUpdates.weddingDate as Date })
      .where(eq(tenants.id, context.tenantId));
  }
  if (params.ceremonyTime) kernelUpdates.ceremonyTime = params.ceremonyTime;
  if (params.receptionTime) kernelUpdates.receptionTime = params.receptionTime;
  if (params.guestCount) kernelUpdates.guestCount = params.guestCount;

  // Update venue in decisions (now using partial JSONB update)
  if (params.venueName || params.venueAddress) {
    const venueName = params.venueName as string;
    const venueCost = params.venueCost ? (params.venueCost as number) * 100 : undefined;
    
    // Construct the partial update for the 'venue' decision object
    const venueUpdatePayload: Record<string, unknown> = { locked: true };
    if (venueName) venueUpdatePayload.name = venueName;
    if (params.venueAddress) venueUpdatePayload.address = params.venueAddress;
    // Note: Cost is handled by updateDecisionFn, not directly in kernel.decisions.venue

    // Apply partial update to weddingKernels.decisions.venue
    await db.update(weddingKernels)
      .set({
        decisions: sql`jsonb_set(
          ${weddingKernels.decisions},
          ${['venue']}::text[],
          (COALESCE(${weddingKernels.decisions} -> 'venue', '{}'::jsonb) || ${JSON.stringify(venueUpdatePayload)}::jsonb),
          true
        )::jsonb`,
        updatedAt: new Date()
      })
      .where(eq(weddingKernels.tenantId, context.tenantId));

    // Synchronize with weddingDecisions table (remains as is)
    await updateDecisionFn(
      context.tenantId,
      "ceremony_venue",
      {
        choiceName: venueName,
        status: "decided",
        estimatedCost: venueCost,
      }
    );

    await updateDecisionFn(
      context.tenantId,
      "reception_venue",
      {
        choiceName: venueName,
        status: "decided",
        estimatedCost: venueCost,
      }
    );
  }

  // Apply other kernel updates (if any, excluding decisions which are handled above)
  if (Object.keys(kernelUpdates).length > 1 || (Object.keys(kernelUpdates).length === 1 && !kernelUpdates.updatedAt)) { // Check if there are actual updates beyond just updatedAt
    await db.update(weddingKernels)
      .set(kernelUpdates)
      .where(eq(weddingKernels.tenantId, context.tenantId));
  }

  return {
    success: true,
    message: "Wedding details updated",
    data: kernelUpdates // Return kernelUpdates as it reflects the primary updates
  };
}

async function updatePreferences(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const kernelUpdates: Record<string, unknown> = { updatedAt: new Date() };

  const buildJsonbArrayUpdate = (
    field: any,
    newElements: unknown[] | undefined
  ) => {
    if (!newElements || newElements.length === 0) {
      return undefined; // No new elements to add
    }
    const newElementsJsonb = JSON.stringify(newElements);
    return sql`
      (SELECT jsonb_agg(DISTINCT elem)::jsonb FROM (
        SELECT jsonb_array_elements_text(COALESCE(${field}, '[]'::jsonb)) AS elem
        UNION ALL
        SELECT jsonb_array_elements_text(${newElementsJsonb}::jsonb) AS elem
      ) AS combined_elements)
    `;
  };

  if (params.vibe) {
    kernelUpdates.vibe = buildJsonbArrayUpdate(weddingKernels.vibe, params.vibe as string[]);
  }
  if (params.colorPalette) {
    kernelUpdates.colorPalette = buildJsonbArrayUpdate(weddingKernels.colorPalette, params.colorPalette as string[]);
  }
  if (params.mustHaves) {
    kernelUpdates.mustHaves = buildJsonbArrayUpdate(weddingKernels.mustHaves, params.mustHaves as string[]);
  }
  if (params.dealbreakers) {
    kernelUpdates.dealbreakers = buildJsonbArrayUpdate(weddingKernels.dealbreakers, params.dealbreakers as string[]);
  }

  // Filter out undefined updates before sending to DB
  const filteredUpdates = Object.fromEntries(
    Object.entries(kernelUpdates).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(filteredUpdates).length > 1 || (Object.keys(filteredUpdates).length === 1 && filteredUpdates.updatedAt)) { // Check if there are actual updates beyond just updatedAt
    await db.update(weddingKernels)
      .set(filteredUpdates)
      .where(eq(weddingKernels.tenantId, context.tenantId));
  } else {
      return { success: false, message: "No valid preferences provided for update." };
  }

  return {
    success: true,
    message: "Preferences updated",
    data: filteredUpdates
  };
}

// ============================================================================ 
// DECISION TOOLS
// ============================================================================ 

import {
  getDecision,
  getAllDecisions,
  getDecisionsByCategory,
  updateDecision as updateDecisionFn,
  lockDecision as lockDecisionFn,
  skipDecision as skipDecisionFn,
  addCustomDecision as addCustomDecisionFn,
  getDecisionProgress,
  initializeDecisionsForTenant,
  type LockReason,
} from "./decisions";

async function handleUpdateDecision(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const estimatedCost = params.estimatedCost ? (params.estimatedCost as number) : undefined;
  const choiceAmount = params.choiceAmount ? (params.choiceAmount as number) : undefined;

  // Sync with total budget if this is the budget decision
  if (params.decisionName === "budget" && (estimatedCost !== undefined || choiceAmount !== undefined)) {
    await setTotalBudget({ amount: estimatedCost ?? choiceAmount }, context);
  }

  const result = await updateDecisionFn(
    context.tenantId,
    params.decisionName as string,
    {
      status: params.status as "not_started" | "researching" | "decided" | undefined,
      choiceName: params.choiceName as string | undefined,
      choiceAmount: choiceAmount ? choiceAmount * 100 : undefined,
      estimatedCost: estimatedCost ? estimatedCost * 100 : undefined,
      choiceNotes: params.notes as string | undefined,
      force: params.force as boolean | undefined,
    }
  );

  if (result.wasLocked) {
    return { success: false, message: result.message };
  }

  // Auto-create vendor if decision is made/booked and we have a name
  if ((params.status === "decided" || params.status === "booked") && params.choiceName) {
    const { pageId, fields } = await getOrCreatePage(context.tenantId, "vendor-contacts");
    const vendors = (fields.vendors as Array<Record<string, unknown>>) || [];
    const vendorName = params.choiceName as string;
    
    // Check if vendor already exists
    const exists = vendors.some(v => 
      (v.name as string)?.toLowerCase() === vendorName.toLowerCase()
    );

    if (!exists) {
      const decision = await getDecision(context.tenantId, params.decisionName as string);
      const category = decision?.category === "vendors" ? decision.displayName : decision?.category || "other";
      
      const newVendor = {
        id: crypto.randomUUID(),
        category,
        name: vendorName,
        contactName: "",
        email: "",
        phone: "",
        status: params.status === "booked" ? "booked" : "researching", // Default to researching unless explicitly booked logic
        price: choiceAmount ? choiceAmount * 100 : (estimatedCost ? estimatedCost * 100 : null), // Store as CENTS
        notes: params.notes || `Added from ${decision?.displayName} decision`,
        depositPaid: false,
        contractSigned: false,
        createdAt: new Date().toISOString()
      };
      
      vendors.push(newVendor);

      await db.update(pages)
        .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
        .where(eq(pages.id, pageId));
    }
  }

  return { success: result.success, message: result.message };
}

async function handleMarkDecisionComplete(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const result = await updateDecisionFn(
    context.tenantId,
    params.decisionName as string,
    {
      status: "decided"
    }
  );

  return { success: result.success, message: result.message };
}

async function handleUpdateChecklistItem(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const isChecked = params.isChecked as boolean;
  const status = isChecked ? "decided" : "not_started";

  const result = await updateDecisionFn(
    context.tenantId,
    params.decisionName as string,
    {
      status
    }
  );

  // If unchecking, we might want to clear the choice name/amount if it was just a simple check-off
  // But for now, we'll just change the status. 
  // If the user wants to "reset" the decision fully, they might need a different action, 
  // but "unchecking" usually just means "I haven't done it yet".

  return { 
    success: result.success, 
    message: result.message,
    data: { status, decisionName: params.decisionName }
  };
}

async function handleLockDecision(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const result = await lockDecisionFn(
    context.tenantId,
    params.decisionName as string,
    params.reason as LockReason,
    params.details as string | undefined
  );

  return { success: result.success, message: result.message };
}

async function handleSkipDecision(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const result = await skipDecisionFn(
    context.tenantId,
    params.decisionName as string
  );

  return { success: result.success, message: result.message };
}

async function handleGetDecisionStatus(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const decision = await getDecision(
    context.tenantId,
    params.decisionName as string
  );

  if (!decision) {
    return { success: false, message: `Decision "${params.decisionName}" not found` };
  }

  return {
    success: true,
    message: `${decision.displayName}: ${decision.status}${decision.choiceName ? ` (${decision.choiceName})` : ""}${decision.status === "locked" ? " - LOCKED" : ""}`,
    data: {
      name: decision.name,
      displayName: decision.displayName,
      status: decision.status,
      choiceName: decision.choiceName,
      isLocked: decision.status === "locked",
      lockReason: decision.lockReason,
      lockDetails: decision.lockDetails,
    }
  };
}

async function handleShowChecklist(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const category = params.category as string | undefined;
  const decisions = category
    ? await getDecisionsByCategory(context.tenantId, category)
    : await getAllDecisions(context.tenantId);

  const progress = await getDecisionProgress(context.tenantId);

  return {
    success: true,
    message: `${progress.decided} of ${progress.total} decisions made (${progress.percentComplete}% complete)`,
    artifact: {
      type: "checklist_full",
      data: { progress, decisions }
    }
  };
}

async function handleAddCustomDecision(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  await initializeDecisionsForTenant(context.tenantId);

  const result = await addCustomDecisionFn(
    context.tenantId,
    params.displayName as string,
    params.category as string
  );

  return { success: result.success, message: result.message };
}

// ============================================================================ 
// INSPIRATION TOOLS
// ============================================================================ 

async function createBoard(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const name = params.name as string;
  
  // Check if board exists
  const existing = await db.query.boards.findFirst({
    where: and(
      eq(boards.tenantId, context.tenantId),
      eq(boards.name, name)
    )
  });

  if (existing) {
    return {
      success: true,
      message: `Board '${name}' already exists.`,
      data: existing
    };
  }

  const [board] = await db.insert(boards).values({
    tenantId: context.tenantId,
    name,
    description: (params.description as string) || "",
    position: 0 // Default position, could query max position + 1
  }).returning();

  return {
    success: true,
    message: `Created new inspiration board: ${name}`,
    data: board
  };
}

async function saveIdea(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  let boardId = params.boardId as string;
  
  // If no ID, find or create by name
  if (!boardId && params.boardName) {
    const name = params.boardName as string;
    let board = await db.query.boards.findFirst({
      where: and(
        eq(boards.tenantId, context.tenantId),
        eq(boards.name, name)
      )
    });
    
    if (!board) {
      // Create default board if it doesn't exist
      const [newBoard] = await db.insert(boards).values({
        tenantId: context.tenantId,
        name,
        description: "Created by Scribe"
      }).returning();
      board = newBoard;
    }
    boardId = board.id;
  }

  // If still no board ID, use a default "General" board
  if (!boardId) {
    let generalBoard = await db.query.boards.findFirst({
      where: and(
        eq(boards.tenantId, context.tenantId),
        eq(boards.name, "General Inspiration")
      )
    });
    
    if (!generalBoard) {
      const [newBoard] = await db.insert(boards).values({
        tenantId: context.tenantId,
        name: "General Inspiration",
        description: "General wedding ideas"
      }).returning();
      generalBoard = newBoard;
    }
    boardId = generalBoard.id;
  }

  const [idea] = await db.insert(ideas).values({
    boardId,
    imageUrl: params.imageUrl as string,
    title: params.title as string,
    description: params.description as string,
    tags: (params.tags as string[]) || [],
  }).returning();

  return {
    success: true,
    message: "Saved idea to your board.",
    data: idea
  };
}

async function getBoards(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.tenantId, context.tenantId),
    with: {
      ideas: {
        limit: 5,
        orderBy: (ideas, { desc }) => [desc(ideas.createdAt)]
      }
    },
    orderBy: (boards, { desc }) => [desc(boards.createdAt)]
  });

  if (userBoards.length === 0) {
    return {
      success: true,
      message: "You don't have any inspiration boards yet.",
      data: []
    };
  }

  const summary = userBoards.map(b => 
    `${b.name} (${b.ideas.length} items)`
  ).join("\n");

  return {
    success: true,
    message: `Here are your inspiration boards:\n${summary}`,
    data: userBoards
  };
}

// ============================================================================ 
// KNOWLEDGE BASE TOOLS
// ============================================================================ 

// Escape special regex characters to prevent SQL injection
function escapeRegexPattern(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function queryKnowledgeBase(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const rawQuery = params.query as string;

  // Validate and sanitize input
  if (!rawQuery || typeof rawQuery !== 'string') {
    return {
      success: false,
      message: "Please provide a search query."
    };
  }

  // Limit query length and sanitize
  const query = rawQuery.toLowerCase().slice(0, 200);
  const category = params.category as string;

  // Escape regex special characters for safe JSONB path query
  const escapedQuery = escapeRegexPattern(query);

  // Simple keyword search using ILIKE (parameterized by Drizzle)
  // and safe JSONB keyword search with escaped pattern
  // In production, you'd want vector search here (pgvector)
  const results = await db.query.knowledgeBase.findMany({
    where: and(
      category ? eq(knowledgeBase.category, category) : undefined,
      or(
        ilike(knowledgeBase.title, `%${query}%`),
        ilike(knowledgeBase.content, `%${query}%`),
        // Use array containment instead of regex for safer keyword matching
        sql`${knowledgeBase.keywords}::jsonb @> ${JSON.stringify([query])}::jsonb`
      )
    ),
    limit: 3
  });

  if (results.length === 0) {
    // Fallback to searching just title if content search fails or returns nothing
    // This is a simplified fallback
    return {
      success: true,
      message: "I couldn't find specific advice on that in my library, but I can try to answer based on general wedding knowledge."
    };
  }

  const knowledge = results.map(r => `**${r.title}**\n${r.content}`).join("\n\n");

  return {
    success: true,
    message: `Here is some advice from our wedding experts:\n\n${knowledge}`,
    data: results
  };
}

// ============================================================================ 
// LOGIC TOOLS
// ============================================================================ 

async function calculateBudgetBreakdown(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const totalBudget = params.totalBudget as number;
  const priorities = (params.priorities as string[]) || [];

  // Standard industry ratios (simplified)
  const standardRatios: Record<string, number> = {
    "venue": 0.40,       // Reception & Ceremony
    "catering": 0.0,     // Often included in venue, separating for clarity if needed, but venue usually covers major cost
    "photography": 0.12,
    "videography": 0.08,
    "attire": 0.08,
    "flowers": 0.08,
    "music_dj": 0.08,
    "planner": 0.10,
    "cake": 0.02,
    "stationary": 0.02,
    "transport": 0.02
  };

  // Adjust for priorities (simplified logic: boost priority cats by 20%, reduce others proportionally)
  // This is a placeholder logic - real logic would be more complex
  const adjustedRatios = { ...standardRatios };
  if (priorities.length > 0) {
    // Boost priorities
    priorities.forEach(p => {
      // Map user input to keys (fuzzy matching would be better)
      const key = Object.keys(standardRatios).find(k => k.includes(p.toLowerCase()));
      if (key) {
        adjustedRatios[key] = Math.min(adjustedRatios[key] * 1.5, 0.6); // Cap at 60%
      }
    });
    
    // Re-normalize
    const currentTotal = Object.values(adjustedRatios).reduce((a, b) => a + b, 0);
    Object.keys(adjustedRatios).forEach(k => {
      adjustedRatios[k] = adjustedRatios[k] / currentTotal;
    });
  }

  const breakdown = Object.entries(adjustedRatios).map(([category, ratio]) => ({
    category: category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    amount: Math.round(totalBudget * ratio),
    percentage: Math.round(ratio * 100)
  })).filter(item => item.amount > 0);

  // Ask to save?
  // For now, just return the calculation. 
  // The user can then say "save this to my budget" which would trigger multiple add_budget_item calls 
  // or we could add a "apply_budget_breakdown" tool later.

  return {
    success: true,
    message: `Here is a recommended breakdown for a $${totalBudget.toLocaleString()} budget${priorities.length ? ` prioritizing ${priorities.join(", ")}` : ""}:\n\n` +
      breakdown.map(i => `• **${i.category}**: $${i.amount.toLocaleString()} (${i.percentage}%)`).join("\n"),
    data: { breakdown, totalBudget }
  };
}

// ============================================================================ 
// PLANNING ANALYSIS TOOLS
// ============================================================================ 

async function analyzePlanningGaps(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // Gather all data
  const kernel = await db.query.weddingKernels.findFirst({
    where: eq(weddingKernels.tenantId, context.tenantId)
  });
  
  const { fields: budgetFields } = await getOrCreatePage(context.tenantId, "budget");
  const { fields: guestFields } = await getOrCreatePage(context.tenantId, "guest-list");
  const { fields: vendorFields } = await getOrCreatePage(context.tenantId, "vendor-contacts");
  const { fields: taskFields } = await getOrCreatePage(context.tenantId, "task-board");
  
  await initializeDecisionsForTenant(context.tenantId);
  const decisions = await getAllDecisions(context.tenantId);
  const progress = await getDecisionProgress(context.tenantId);



  // Calculate days until wedding
  const weddingDate = kernel?.weddingDate;
  const daysUntil = weddingDate 
    ? Math.ceil((new Date(weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Analyze gaps
  const gaps: Array<{ category: string; issue: string; priority: "high" | "medium" | "low"; suggestion: string }> = [];
  const warnings: string[] = [];
  const wins: string[] = [];

  // Check foundation items
  if (!weddingDate) {
    gaps.push({
      category: "foundation",
      issue: "No wedding date set",
      priority: "high",
      suggestion: "Setting a date helps plan everything else around it"
    });
  }

  const budgetItems = (budgetFields.items as Array<Record<string, unknown>>) || [];
  const totalBudget = (budgetFields.totalBudget as number) || 0;
  
  if (totalBudget === 0) {
    gaps.push({
      category: "budget",
      issue: "No total budget set",
      priority: "high",
      suggestion: "Set a budget to help prioritize spending"
    });
  }

  // Check vendors
  const vendors = (vendorFields.vendors as Array<Record<string, unknown>>) || [];
  const bookedVendors = vendors.filter(v => {
    const status = (v.status as string)?.toLowerCase();
    return status === "booked" || status === "confirmed" || status === "paid";
  });
  
  const essentialVendorCategories = ["venue", "photographer", "caterer", "officiant"];
  
  for (const category of essentialVendorCategories) {
    const hasVendor = bookedVendors.some(v => {
      const vCat = (v.category as string)?.toLowerCase() || "";
      const vName = (v.name as string)?.toLowerCase() || "";
      const target = category.toLowerCase();
      return vCat.includes(target) || vName.includes(target);
    });

    if (!hasVendor) {
      const urgency = daysUntil && daysUntil < 180 ? "high" : daysUntil && daysUntil < 365 ? "medium" : "low";
      gaps.push({
        category: "vendors",
        issue: `No ${category} booked yet`,
        priority: urgency,
        suggestion: `${category === "venue" ? "Venues book up fast - start looking soon" : `Consider reaching out to ${category}s`}`
      });
    }
  }

  // Check guest list
  const guests = (guestFields.guests as Array<Record<string, unknown>>) || [];
  if (guests.length === 0) {
    gaps.push({
      category: "guests",
      issue: "Guest list is empty",
      priority: "medium",
      suggestion: "Start adding guests to help with venue capacity and catering numbers"
    });
  } else {
    const pendingRsvps = guests.filter(g => g.rsvp === "pending").length;
    if (pendingRsvps > 0 && daysUntil && daysUntil < 60) {
      warnings.push(`${pendingRsvps} guests haven't RSVP'd yet and the wedding is in ${daysUntil} days`);
    }
  }

  // Check budget vs spending
  if (totalBudget > 0) {
    const totalSpent = budgetItems.reduce((sum, item) => sum + ((item.totalCost as number) || 0), 0);
    const percentUsed = (totalSpent / totalBudget) * 100;
    
    if (percentUsed > 100) {
      warnings.push(`You're ${(percentUsed - 100).toFixed(0)}% over budget`);
    } else if (percentUsed > 90) {
      warnings.push(`You've allocated ${percentUsed.toFixed(0)}% of your budget`);
    }
  }

  // Check tasks
  const tasks = (taskFields.tasks as Array<Record<string, unknown>>) || [];
  const overdueTasks = tasks.filter(t => {
    if (t.status === "done") return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate as string) < new Date();
  });
  
  if (overdueTasks.length > 0) {
    warnings.push(`${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}`);
  }

  // Celebrate wins
  if (bookedVendors.length > 0) {
    wins.push(`${bookedVendors.length} vendor${bookedVendors.length > 1 ? "s" : ""} booked`);
  }
  if (progress.locked > 0) {
    wins.push(`${progress.locked} decision${progress.locked > 1 ? "s" : ""} locked in`);
  }
  if (guests.length > 0) {
    // RSVP status values are: "pending", "confirmed", "declined"
    const confirmed = guests.filter(g => g.rsvp === "confirmed").length;
    if (confirmed > 0) {
      wins.push(`${confirmed} guest${confirmed > 1 ? "s" : ""} confirmed`);
    }
  }

  // Build summary message
  let message = "";
  if (daysUntil !== null) {
    message = `# ${daysUntil} Days Until Your Wedding\n\n`;
  }

  if (gaps.length === 0 && warnings.length === 0) {
    message += "**You're in great shape! All the essentials are covered.** 🎉\n\n";
  } else {
    const highPriorityGaps = gaps.filter(g => g.priority === "high");
    if (highPriorityGaps.length > 0) {
      message += `### 🚨 High Priority Actions (${highPriorityGaps.length})\n`;
      highPriorityGaps.forEach(g => {
        message += `- **${g.issue}**: ${g.suggestion}\n`;
      });
      message += "\n";
    }

    const mediumPriorityGaps = gaps.filter(g => g.priority === "medium");
    if (mediumPriorityGaps.length > 0) {
        message += `### ⚠️ Upcoming Tasks\n`;
        mediumPriorityGaps.forEach(g => {
            message += `- ${g.issue}\n`;
        });
        message += "\n";
    }

    if (warnings.length > 0) {
        message += `### ⚠️ Alerts\n`;
        warnings.forEach(w => message += `- ${w}\n`);
        message += "\n";
    }
  }

  if (wins.length > 0) {
    message += `### ✅ What's Going Well\n`;
    wins.forEach(w => message += `- ${w}\n`);
  }

  return {
    success: true,
    message,
    data: {
      daysUntil,
      progress,
      gaps,
      warnings,
      wins,
      summary: {
        guestsCount: guests.length,
        vendorsBooked: bookedVendors.length,
        budgetAllocated: totalBudget > 0 
          ? Math.round((budgetItems.reduce((sum, item) => sum + ((item.totalCost as number) || 0), 0) / totalBudget) * 100)
          : 0,
        tasksRemaining: tasks.filter(t => t.status !== "done").length
      }
    }
  };
}

// ============================================================================ 
// HELPER: Update kernel decisions (legacy)
// ============================================================================ 

async function updateKernelDecision(
  tenantId: string,
  category: string,
  update: Record<string, unknown>
): Promise<void> {
  // Update the 'decisions' JSONB field
  await db.update(weddingKernels)
    .set({
      decisions: sql`jsonb_set(
        ${weddingKernels.decisions},
        ${[category]}::text[],
        (COALESCE(${weddingKernels.decisions} -> ${category}, '{}'::jsonb) || ${JSON.stringify(update)}::jsonb),
        true
      )::jsonb`,
      updatedAt: new Date() 
    })
    .where(eq(weddingKernels.tenantId, tenantId));

  // Conditionally update 'vendorsBooked' if status indicates booking and category is not already present
  if (update.locked || update.status === "booked") {
    await db.update(weddingKernels)
      .set({
        vendorsBooked: sql`
          CASE
            WHEN ${weddingKernels.vendorsBooked} @> jsonb_build_array(${category}) THEN ${weddingKernels.vendorsBooked} -- Already exists, do nothing
            ELSE jsonb_insert(
              COALESCE(${weddingKernels.vendorsBooked}, '[]'::jsonb),
              '{999999}'::text[], -- Insert at a high index to append
              to_jsonb(${category})
            )
          END
        `,
        updatedAt: new Date() // Ensure updatedAt is also updated for this operation
      })
      .where(eq(weddingKernels.tenantId, tenantId));
  }
}

// ============================================================================ 
// SEATING CHART TOOLS
// ============================================================================ 

interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  tableNumber: number;
}

async function createSeatingTable(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "seating-chart");
  
  const tables = (fields.tables as SeatingTable[]) || [];
  
  // Determine table number if not provided
  let tableNumber = params.tableNumber as number;
  if (!tableNumber) {
    // Auto-increment based on existing numeric tables
    const existingNumbers = tables.map(t => t.tableNumber).filter(n => typeof n === 'number');
    tableNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  }

  const newTable: SeatingTable = {
    id: crypto.randomUUID(),
    name: params.name as string,
    capacity: params.capacity as number,
    tableNumber
  };

  tables.push(newTable);
  
  // Sort by table number
  tables.sort((a, b) => a.tableNumber - b.tableNumber);

  await db.update(pages)
    .set({ fields: { ...fields, tables }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: `Created table "${newTable.name}" (Table ${newTable.tableNumber}) with ${newTable.capacity} seats`,
    data: newTable
  };
}

async function assignGuestSeat(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // 1. Find Guest
  const { pageId: guestPageId, fields: guestFields } = await getOrCreatePage(context.tenantId, "guest-list");
  const guests = (guestFields.guests as GuestData[]) || [];
  
  const guestName = (params.guestName as string).toLowerCase();
  const guestIndex = guests.findIndex(g => g.name?.toLowerCase() === guestName || g.name?.toLowerCase().includes(guestName));

  if (guestIndex === -1) {
    return { success: false, message: `Guest "${params.guestName}" not found` };
  }

  // 2. Find Table
  const { fields: seatingFields } = await getOrCreatePage(context.tenantId, "seating-chart");
  const tables = (seatingFields.tables as SeatingTable[]) || [];
  
  const tableNameInput = String(params.tableName).toLowerCase();
  let targetTable: SeatingTable | undefined;

  // Try matching by table name
  targetTable = tables.find(t => t.name.toLowerCase() === tableNameInput || t.name.toLowerCase().includes(tableNameInput));

  // Try matching by table number (if input looks like a number)
  if (!targetTable) {
    const tableNum = parseInt(tableNameInput.replace(/\D/g, ''));
    if (!isNaN(tableNum)) {
      targetTable = tables.find(t => t.tableNumber === tableNum);
    }
  }

  if (!targetTable) {
    return { 
      success: false, 
      message: `Table "${params.tableName}" not found. Please create it first.` 
    };
  }

  // 3. Check Capacity (Optional - just warn for now, don't block)
  const currentSeated = guests.filter(g => g.tableNumber === targetTable!.tableNumber).length;
  let warning = "";
  if (currentSeated >= targetTable.capacity) {
    warning = ` (Note: Table capacity of ${targetTable.capacity} reached)`;
  }

  // 4. Assign
  guests[guestIndex].tableNumber = targetTable.tableNumber;

  await db.update(pages)
    .set({ fields: { ...guestFields, guests }, updatedAt: new Date() })
    .where(eq(pages.id, guestPageId));

  return {
    success: true,
    message: `Assigned ${guests[guestIndex].name} to ${targetTable.name}${warning}`,
    data: { guest: guests[guestIndex].name, table: targetTable.name }
  };
}

async function getSeatingChart(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  // Get tables
  const { fields: seatingFields } = await getOrCreatePage(context.tenantId, "seating-chart");
  const tables = (seatingFields.tables as SeatingTable[]) || [];

  // Get guests
  const { fields: guestFields } = await getOrCreatePage(context.tenantId, "guest-list");
  const guests = (guestFields.guests as GuestData[]) || [];

  // Map guests to tables
  const chart = tables.map(table => {
    const seatedGuests = guests.filter(g => g.tableNumber === table.tableNumber);
    return {
      ...table,
      guests: seatedGuests.map(g => g.name),
      count: seatedGuests.length,
      isFull: seatedGuests.length >= table.capacity
    };
  });

  const unseated = guests.filter(g => g.tableNumber === undefined || g.tableNumber === null).map(g => g.name);

  let message = `**Seating Chart**\n\n`;
  
  if (tables.length === 0) {
    message += "No tables created yet.";
  } else {
    message += chart.map(t => 
      `**${t.name}** (${t.count}/${t.capacity}): ${t.guests.join(", ") || "Empty"}`
    ).join("\n\n");
  }

  if (unseated.length > 0) {
    message += `\n\n**Unseated Guests (${unseated.length}):** ${unseated.slice(0, 10).join(", ")}${unseated.length > 10 ? "..." : ""}`;
  }

  return {
    success: true,
    message,
    data: { chart, unseated }
  };
}

// ============================================================================
// WEB SEARCH TOOL
// ============================================================================

async function webSearch(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const query = params.query as string;
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    console.error(`[WebSearch] Missing config: API Key is ${apiKey ? "SET" : "MISSING"}, Engine ID is ${cx ? "SET" : "MISSING"}`);
    // Fallback message that explains the situation without exposing internal config details to the end user.
    return { 
      success: false, 
      message: "I cannot browse the web right now because the search function is not fully configured." 
    };
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error("Google Search API error:", data);
      return { success: false, message: "I encountered a problem while trying to search the web." };
    }

    if (!data.items || data.items.length === 0) {
      return { success: true, message: `I searched for "${query}" but didn't find any relevant results.` };
    }

    // Format results for the AI
    const results = data.items.slice(0, 5).map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));

    const formattedResults = results.map((r: any) => 
      `Title: ${r.title}\nLink: ${r.link}\nSummary: ${r.snippet}`
    ).join("\n\n");

    return { 
      success: true, 
      message: `Here are the search results for "${query}":\n\n${formattedResults}` 
    };

  } catch (error) {
    console.error("Web search exception:", error);
    return { success: false, message: "I encountered an error while searching the web." };
  }
}