/**
 * Aisle AI Tool Executor
 * 
 * Executes tool calls from the AI and returns results.
 * Each tool function takes parameters and a context (tenantId, etc.)
 */

import { db } from "@/lib/db";
import {
  weddingKernels,
  pages,
  planners,
  calendarEvents,
  tenants,
  rsvpForms,
  rsvpResponses,
  users,
  palettes,
  sparks,
  knowledgeBase,
  weddingDecisions
} from "@/lib/db/schema";
import { eq, and, sql, desc, like, or } from "drizzle-orm";

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

// ============================================================================ 
// MAIN EXECUTOR
// ============================================================================ 

export async function executeToolCall(
  toolName: string,
  parameters: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  console.log(`Executing tool: ${toolName}`, parameters);

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
      case "add_event":
        return await addEvent(parameters, context);
      case "add_day_of_event":
        return await addDayOfEvent(parameters, context);

      // Vendor tools
      case "add_vendor":
        return await addVendor(parameters, context);
      case "update_vendor_status":
        return await updateVendorStatus(parameters, context);
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
      case "create_palette":
        return await createPalette(parameters, context);
      case "save_spark":
        return await saveSpark(parameters, context);
      case "get_palettes":
        return await getPalettes(parameters, context);

      // Knowledge tools
      case "query_knowledge_base":
        return await queryKnowledgeBase(parameters, context);

      // Logic tools
      case "calculate_budget_breakdown":
        return await calculateBudgetBreakdown(parameters, context);

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
    console.error(`Tool execution error (${toolName}):`, error);
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
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "budget");
  
  const items = (fields.items as Array<Record<string, unknown>>) || [];
  
  // Store as string in dollars (matching BudgetRenderer format)
  const newItem = {
    id: crypto.randomUUID(),
    category: params.category,
    vendor: params.vendor || "",
    totalCost: String(params.estimatedCost || 0),
    amountPaid: String(params.amountPaid || 0),
    notes: params.notes || "",
    createdAt: new Date().toISOString()
  };

  items.push(newItem);

  await db.update(pages)
    .set({ fields: { ...fields, items }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Also update kernel decisions
  await updateKernelDecision(context.tenantId, params.category as string, {
    status: "budgeted",
    amount: params.estimatedCost
  });

  // Update checklist decision
  const decisionName = getDecisionNameFromCategory(params.category as string);
  if (decisionName) {
      await updateDecisionFn(context.tenantId, decisionName, {
          status: "researching", // Start researching if we are budgeting
          estimatedCost: (params.estimatedCost as number) * 100
      });
  }

  return {
    success: true,
    message: `Added ${params.category} to budget: ${(params.estimatedCost as number).toLocaleString()}`,
    data: newItem
  };
}

async function updateBudgetItem(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "budget");
  
  const items = (fields.items as Array<Record<string, unknown>>) || [];
  const itemIndex = items.findIndex(i => i.id === params.itemId);

  if (itemIndex === -1) {
    return { success: false, message: "Budget item not found" };
  }

  // Store as string in dollars (matching BudgetRenderer format)
  if (params.estimatedCost !== undefined) {
    items[itemIndex].totalCost = String(params.estimatedCost);
  }
  if (params.amountPaid !== undefined) {
    items[itemIndex].amountPaid = String(params.amountPaid);
  }
  if (params.vendor !== undefined) {
    items[itemIndex].vendor = params.vendor;
  }
  if (params.notes !== undefined) {
    items[itemIndex].notes = params.notes;
  }

  await db.update(pages)
    .set({ fields: { ...fields, items }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: "Budget item updated",
    data: items[itemIndex]
  };
}

async function deleteBudgetItem(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "budget");
  
  let items = (fields.items as Array<Record<string, unknown>>) || [];
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
    // If ID is provided and matches, delete it (return false)
    if (params.itemId && i.id === params.itemId) return false;

    // If ID was provided, we only care about ID match
    if (params.itemId) return true;

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

  await db.update(pages)
    .set({ fields: { ...fields, items: newItems }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: `Removed ${deletedCount} item${deletedCount > 1 ? "s" : ""} from budget`,
    data: { deletedCount }
  };
}

async function setTotalBudget(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "budget");
  // Store as string in dollars (matching BudgetRenderer format)
  const amount = params.amount as number;

  await db.update(pages)
    .set({ fields: { ...fields, totalBudget: String(amount) }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Also update kernel (kernel uses cents for historical reasons)
  await db.update(weddingKernels)
    .set({ budgetTotal: amount * 100, updatedAt: new Date() })
    .where(eq(weddingKernels.tenantId, context.tenantId));

  return {
    success: true,
    message: `Total budget set to ${amount.toLocaleString()}`,
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
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "guest-list");
  
  const guests = (fields.guests as GuestData[]) || [];
  
  // Check if guest already exists (by name)
  const existingGuest = guests.find(
    g => g.name?.toLowerCase() === (params.name as string)?.toLowerCase()
  );
  
  if (existingGuest) {
    return {
      success: false,
      message: `${params.name} is already on the guest list. Use update_guest to modify their info.`
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

  await db.update(pages)
    .set({ fields: { ...fields, guests }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Update kernel guest count
  await db.update(weddingKernels)
    .set({ guestCount: guests.length, updatedAt: new Date() })
    .where(eq(weddingKernels.tenantId, context.tenantId));

  // Update checklist decision
  if (guests.length > 0) {
      await updateDecisionFn(context.tenantId, "guest_list", {
          status: "researching"
      });
  }

  const extras: string[] = [];
  if (params.group) extras.push(`group: ${params.group}`);
  if (params.plusOne) extras.push("with plus one");
  if (params.rsvp === "confirmed") extras.push("confirmed");
  
  return {
    success: true,
    message: `Added ${params.name} to guest list${extras.length ? ` (${extras.join(", ")})` : ""}. Total guests: ${guests.length}`,
    data: { guest: newGuest, totalGuests: guests.length, pageId }
  };
}

async function updateGuest(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "guest-list");
  
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
  const updates: string[] = [];

  // Update all provided fields
  if (params.name !== undefined) {
    guest.name = params.name as string;
    updates.push("name");
  }
  if (params.email !== undefined) {
    guest.email = params.email as string;
    updates.push("email");
  }
  if (params.phone !== undefined) {
    guest.phone = params.phone as string;
    updates.push("phone");
  }
  if (params.address !== undefined) {
    guest.address = params.address as string;
    updates.push("address");
  }
  if (params.side !== undefined) {
    guest.side = params.side as string;
    updates.push("side");
  }
  if (params.group !== undefined) {
    guest.group = params.group as string;
    updates.push("group");
  }
  if (params.plusOne !== undefined) {
    guest.plusOne = params.plusOne as boolean;
    updates.push("plus one");
  }
  if (params.plusOneName !== undefined) {
    guest.plusOneName = params.plusOneName as string;
    updates.push("plus one name");
  }
  if (params.rsvp !== undefined) {
    guest.rsvp = params.rsvp as string;
    updates.push(`RSVP: ${params.rsvp}`);
  }
  if (params.mealChoice !== undefined) {
    guest.mealChoice = params.mealChoice as string;
    updates.push(`meal: ${params.mealChoice}`);
  }
  if (params.dietaryRestrictions !== undefined) {
    guest.dietaryRestrictions = params.dietaryRestrictions as string;
    updates.push("dietary restrictions");
  }
  if (params.tableNumber !== undefined) {
    guest.tableNumber = params.tableNumber as number;
    updates.push(`table ${params.tableNumber}`);
  }
  if (params.giftReceived !== undefined) {
    guest.giftReceived = params.giftReceived as boolean;
    updates.push(params.giftReceived ? "gift received" : "gift not received");
  }
  if (params.thankYouSent !== undefined) {
    guest.thankYouSent = params.thankYouSent as boolean;
    updates.push(params.thankYouSent ? "thank you sent" : "thank you not sent");
  }
  if (params.notes !== undefined) {
    guest.notes = params.notes as string;
    updates.push("notes");
  }

  guests[guestIndex] = guest;

  await db.update(pages)
    .set({ fields: { ...fields, guests }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: `Updated ${guest.name}: ${updates.join(", ")}`,
    data: { guest, pageId }
  };
}

async function deleteGuest(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "guest-list");
  
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
    const guestNames = guests.slice(0, 5).map(g => g.name).join(", ");
    return { 
      success: false, 
      message: `Guest not found. Current guests: ${guestNames || "none"}${guests.length > 5 ? `... and ${guests.length - 5} more` : ""}` 
    };
  }

  const deletedGuest = guests[guestIndex];
  guests.splice(guestIndex, 1);

  await db.update(pages)
    .set({ fields: { ...fields, guests }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Update kernel guest count
  await db.update(weddingKernels)
    .set({ guestCount: guests.length, updatedAt: new Date() })
    .where(eq(weddingKernels.tenantId, context.tenantId));

  return {
    success: true,
    message: `Removed ${deletedGuest.name} from guest list. Total guests: ${guests.length}`,
    data: deletedGuest
  };
}

async function addGuestGroup(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "guest-list");
  
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

  await db.update(pages)
    .set({ fields: { ...fields, guests }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Update kernel guest count
  await db.update(weddingKernels)
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

async function addEvent(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const startTime = new Date(`${params.date}T${params.time || "12:00"}`);
  
  const [event] = await db.insert(calendarEvents).values({
    tenantId: context.tenantId,
    title: params.title as string,
    startTime,
    endTime: params.endTime ? new Date(`${params.date}T${params.endTime}`) : undefined,
    location: params.location as string,
    category: (params.category as string) || "other",
    description: params.notes as string
  }).returning();

  return {
    success: true,
    message: `Added "${params.title}" to calendar on ${params.date}`,
    data: event
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
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "vendor-contacts");
  
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

  await db.update(pages)
    .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Update kernel decisions
  await updateKernelDecision(context.tenantId, params.category as string, {
    status: params.status,
    name: params.name,
    locked: params.status === "booked"
  });

  // Update checklist decision
  const decisionName = getDecisionNameFromCategory(params.category as string);
  if (decisionName) {
    const decisionStatus = params.status === "booked" || params.status === "confirmed" ? "decided" : "researching";
    await updateDecisionFn(context.tenantId, decisionName, {
      status: decisionStatus,
      choiceName: params.name as string,
      // If booked, we could lock it, but let's stick to decided/researching for now unless explicitly locked
    });
    
    if (params.status === "booked") {
        // If booked, allows updating the "locked" state if we wanted, but updateDecisionFn handles auto-lock on deposit
    }
  }

  return {
    success: true,
    message: `Added ${params.name} (${params.category}) to vendors`,
    data: newVendor
  };
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

async function updateVendorStatus(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "vendor-contacts");
  
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
  
  vendor.status = params.status;
  if (params.depositPaid !== undefined) {
    vendor.depositPaid = params.depositPaid;
  }
  if (params.contractSigned !== undefined) {
    vendor.contractSigned = params.contractSigned;
  }

  await db.update(pages)
    .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  // Update kernel
  await updateKernelDecision(context.tenantId, vendor.category as string, {
    status: params.status,
    name: vendor.name,
    locked: params.status === "booked"
  });

  // Update checklist decision
  const decisionName = getDecisionNameFromCategory(vendor.category as string);
  if (decisionName) {
    const decisionStatus = params.status === "booked" || params.status === "confirmed" ? "decided" : "researching";
    await updateDecisionFn(context.tenantId, decisionName, {
        status: decisionStatus,
        choiceName: vendor.name as string,
    });
  }

  return {
    success: true,
    message: `Updated ${vendor.name} status to ${params.status}`,
    data: vendors[vendorIndex]
  };
}

async function deleteVendor(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const { pageId, fields } = await getOrCreatePage(context.tenantId, "vendor-contacts");
  
  const vendors = (fields.vendors as Array<Record<string, unknown>>) || [];
  let vendorIndex = -1;
  let deletedVendor: Record<string, unknown> | null = null;

  // Find by ID first
  if (params.vendorId) {
    vendorIndex = vendors.findIndex(v => v.id === params.vendorId);
  }
  // Fall back to name match (case insensitive)
  else if (params.vendorName) {
    vendorIndex = vendors.findIndex(v => 
      (v.name as string)?.toLowerCase() === (params.vendorName as string).toLowerCase()
    );
  }

  if (vendorIndex === -1) {
    return { success: false, message: "Vendor not found" };
  }

  deletedVendor = vendors[vendorIndex];
  vendors.splice(vendorIndex, 1);

  await db.update(pages)
    .set({ fields: { ...fields, vendors }, updatedAt: new Date() })
    .where(eq(pages.id, pageId));

  return {
    success: true,
    message: `Removed ${deletedVendor.name} from vendor list`,
    data: deletedVendor
  };
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
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (params.weddingDate) {
    updates.weddingDate = new Date(params.weddingDate as string);
    // Also update tenant
    await db.update(tenants)
      .set({ weddingDate: updates.weddingDate as Date })
      .where(eq(tenants.id, context.tenantId));
  }
  if (params.ceremonyTime) updates.ceremonyTime = params.ceremonyTime;
  if (params.receptionTime) updates.receptionTime = params.receptionTime;
  if (params.guestCount) updates.guestCount = params.guestCount;

  // Update venue in decisions
  if (params.venueName || params.venueAddress) {
    const venueName = params.venueName as string;
    const venueCost = params.venueCost ? (params.venueCost as number) * 100 : undefined; // Assuming venueCost might be passed
    
    // Update weddingKernels
    const kernel = await db.query.weddingKernels.findFirst({
      where: eq(weddingKernels.tenantId, context.tenantId)
    });
    const decisions = (kernel?.decisions as Record<string, unknown>) || {};
    decisions.venue = {
      ...(decisions.venue as Record<string, unknown> || {}),
      name: venueName || (decisions.venue as Record<string, unknown>)?.name,
      address: params.venueAddress,
      locked: true
    };
    updates.decisions = decisions;

    // Synchronize with weddingDecisions table
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

  await db.update(weddingKernels)
    .set(updates)
    .where(eq(weddingKernels.tenantId, context.tenantId));

  return {
    success: true,
    message: "Wedding details updated",
    data: updates
  };
}

async function updatePreferences(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const kernel = await db.query.weddingKernels.findFirst({
    where: eq(weddingKernels.tenantId, context.tenantId)
  });

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (params.vibe) {
    const currentVibe = (kernel?.vibe as string[]) || [];
    updates.vibe = [...new Set([...currentVibe, ...(params.vibe as string[])])];
  }
  if (params.colorPalette) {
    const current = (kernel?.colorPalette as string[]) || [];
    updates.colorPalette = [...new Set([...current, ...(params.colorPalette as string[])])];
  }
  if (params.mustHaves) {
    const current = (kernel?.mustHaves as string[]) || [];
    updates.mustHaves = [...new Set([...current, ...(params.mustHaves as string[])])];
  }
  if (params.dealbreakers) {
    const current = (kernel?.dealbreakers as string[]) || [];
    updates.dealbreakers = [...new Set([...current, ...(params.dealbreakers as string[])])];
  }

  await db.update(weddingKernels)
    .set(updates)
    .where(eq(weddingKernels.tenantId, context.tenantId));

  return {
    success: true,
    message: "Preferences updated",
    data: updates
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

async function createPalette(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const name = params.name as string;
  
  // Check if palette exists
  const existing = await db.query.palettes.findFirst({
    where: and(
      eq(palettes.tenantId, context.tenantId),
      eq(palettes.name, name)
    )
  });

  if (existing) {
    return {
      success: true,
      message: `Palette '${name}' already exists.`,
      data: existing
    };
  }

  const [palette] = await db.insert(palettes).values({
    tenantId: context.tenantId,
    name,
    description: (params.description as string) || "",
    position: 0 // Default position, could query max position + 1
  }).returning();

  return {
    success: true,
    message: `Created new inspiration board: ${name}`,
    data: palette
  };
}

async function saveSpark(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  let paletteId = params.paletteId as string;
  
  // If no ID, find or create by name
  if (!paletteId && params.paletteName) {
    const name = params.paletteName as string;
    let palette = await db.query.palettes.findFirst({
      where: and(
        eq(palettes.tenantId, context.tenantId),
        eq(palettes.name, name)
      )
    });
    
    if (!palette) {
      // Create default palette if it doesn't exist
      const [newPalette] = await db.insert(palettes).values({
        tenantId: context.tenantId,
        name,
        description: "Created by Scribe"
      }).returning();
      palette = newPalette;
    }
    paletteId = palette.id;
  }

  // If still no palette ID, use a default "General" board
  if (!paletteId) {
    let generalPalette = await db.query.palettes.findFirst({
      where: and(
        eq(palettes.tenantId, context.tenantId),
        eq(palettes.name, "General Inspiration")
      )
    });
    
    if (!generalPalette) {
      const [newPalette] = await db.insert(palettes).values({
        tenantId: context.tenantId,
        name: "General Inspiration",
        description: "General wedding ideas"
      }).returning();
      generalPalette = newPalette;
    }
    paletteId = generalPalette.id;
  }

  const [spark] = await db.insert(sparks).values({
    paletteId,
    imageUrl: params.imageUrl as string,
    title: params.title as string,
    description: params.description as string,
    tags: (params.tags as string[]) || [],
  }).returning();

  return {
    success: true,
    message: "Saved idea to your board.",
    data: spark
  };
}

async function getPalettes(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const userPalettes = await db.query.palettes.findMany({
    where: eq(palettes.tenantId, context.tenantId),
    with: {
      sparks: {
        limit: 5,
        orderBy: (sparks, { desc }) => [desc(sparks.createdAt)]
      }
    },
    orderBy: (palettes, { desc }) => [desc(palettes.createdAt)]
  });

  if (userPalettes.length === 0) {
    return {
      success: true,
      message: "You don't have any inspiration boards yet.",
      data: []
    };
  }

  const summary = userPalettes.map(p => 
    `${p.name} (${p.sparks.length} items)`
  ).join("\n");

  return {
    success: true,
    message: `Here are your inspiration boards:\n${summary}`,
    data: userPalettes
  };
}

// ============================================================================ 
// KNOWLEDGE BASE TOOLS
// ============================================================================ 

async function queryKnowledgeBase(
  params: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const query = (params.query as string).toLowerCase();
  const category = params.category as string;

  // Simple keyword search using ILIKE
  // In production, you'd want vector search here (pgvector)
  const results = await db.query.knowledgeBase.findMany({
    where: and(
      category ? eq(knowledgeBase.category, category) : undefined,
      or(
        like(knowledgeBase.title, `%${query}%`),
        like(knowledgeBase.content, `%${query}%`),
        sql`jsonb_path_exists(${knowledgeBase.keywords}, ${`$[*] ? (@ like_regex "${query}" flag "i")`})`
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
  const bookedVendors = vendors.filter(v => v.status === "booked");
  const essentialVendorCategories = ["venue", "photographer", "caterer", "officiant"];
  
  for (const category of essentialVendorCategories) {
    const hasVendor = bookedVendors.some(v => v.category === category);
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
    const confirmed = guests.filter(g => g.rsvp === "yes").length;
    if (confirmed > 0) {
      wins.push(`${confirmed} guest${confirmed > 1 ? "s" : ""} confirmed`);
    }
  }

  // Build summary message
  let message = "";
  if (daysUntil !== null) {
    message = `**${daysUntil} days until your wedding!**\n\n`;
  }

  if (gaps.length === 0 && warnings.length === 0) {
    message += "You're in great shape! All the essentials are covered. ";
  } else {
    const highPriorityGaps = gaps.filter(g => g.priority === "high");
    if (highPriorityGaps.length > 0) {
      message += `**${highPriorityGaps.length} high-priority item${highPriorityGaps.length > 1 ? "s" : ""} to address:**\n`;
      highPriorityGaps.forEach(g => {
        message += `• ${g.issue}\n`;
      });
      message += "\n";
    }
  }

  if (wins.length > 0) {
    message += `**What's going well:** ${wins.join(", ")}`;
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
  const kernel = await db.query.weddingKernels.findFirst({
    where: eq(weddingKernels.tenantId, tenantId)
  });

  const decisions = (kernel?.decisions as Record<string, unknown>) || {};
  decisions[category] = {
    ...(decisions[category] as Record<string, unknown> || {}),
    ...update
  };

  // Update vendorsBooked array if status is booked
  let vendorsBooked = (kernel?.vendorsBooked as string[]) || [];
  if (update.locked || update.status === "booked") {
    if (!vendorsBooked.includes(category)) {
      vendorsBooked = [...vendorsBooked, category];
    }
  }

  await db.update(weddingKernels)
    .set({
      decisions,
      vendorsBooked,
      updatedAt: new Date() 
    })
    .where(eq(weddingKernels.tenantId, tenantId));
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