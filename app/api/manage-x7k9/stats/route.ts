import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { tenants, users, planners, pages, rsvpForms, rsvpResponses, scribeConversations } from "@/lib/db/schema";
import { count, eq, gte, sql, desc, and, ne, notInArray, inArray } from "drizzle-orm";

const COMPLETE_PLAN_PRICE = 29; // $29 one-time
const TAX_RATE = 0.0; // Adjust based on your tax situation (0% for now, could be ~30% for self-employment)

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ============================================================================
    // GET TEST ACCOUNT TENANT IDS TO EXCLUDE
    // ============================================================================
    
    const testAccountUsers = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.isTestAccount, true));
    
    const testTenantIds = testAccountUsers.map(u => u.tenantId);
    
    // Helper to add "not test account" condition
    const excludeTestTenants = testTenantIds.length > 0 
      ? notInArray(tenants.id, testTenantIds) 
      : undefined;

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    // ============================================================================
    // USER METRICS (excluding test accounts)
    // ============================================================================
    
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isTestAccount, false));
    const totalUsers = totalUsersResult?.count || 0;

    const totalTenantsConditions = excludeTestTenants ? [excludeTestTenants] : [];
    const [totalTenantsResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(totalTenantsConditions.length > 0 ? and(...totalTenantsConditions) : undefined);
    const totalTenants = totalTenantsResult?.count || 0;

    const newUsersThisWeekConditions = [
      eq(users.isTestAccount, false),
      gte(users.createdAt, thisWeekStart)
    ];
    const [newUsersThisWeekResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(...newUsersThisWeekConditions));
    const newUsersThisWeek = newUsersThisWeekResult?.count || 0;

    const newUsersThisMonthConditions = [
      eq(users.isTestAccount, false),
      gte(users.createdAt, thisMonthStart)
    ];
    const [newUsersThisMonthResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(...newUsersThisMonthConditions));
    const newUsersThisMonth = newUsersThisMonthResult?.count || 0;

    const newUsersLastMonthConditions = [
      eq(users.isTestAccount, false),
      gte(users.createdAt, lastMonthStart),
      sql`${users.createdAt} < ${thisMonthStart}`
    ];
    const [newUsersLastMonthResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(...newUsersLastMonthConditions));
    const newUsersLastMonth = newUsersLastMonthResult?.count || 0;

    // ============================================================================
    // PLAN DISTRIBUTION (excluding test accounts)
    // ============================================================================

    const freeConditions = [eq(tenants.plan, "free")];
    if (excludeTestTenants) freeConditions.push(excludeTestTenants);
    const [freeTenantsResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(...freeConditions));
    const freeTenants = freeTenantsResult?.count || 0;

    const completeConditions = [eq(tenants.plan, "complete")];
    if (excludeTestTenants) completeConditions.push(excludeTestTenants);
    const [completeTenantsResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(...completeConditions));
    const completeTenants = completeTenantsResult?.count || 0;

    // ============================================================================
    // REVENUE METRICS (excluding test accounts)
    // ============================================================================

    const totalRevenue = completeTenants * COMPLETE_PLAN_PRICE;

    const revenueThisMonthConditions = [
      eq(tenants.plan, "complete"),
      gte(tenants.updatedAt, thisMonthStart)
    ];
    if (excludeTestTenants) revenueThisMonthConditions.push(excludeTestTenants);
    const [completePurchasesThisMonthResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(...revenueThisMonthConditions));
    const revenueThisMonth = (completePurchasesThisMonthResult?.count || 0) * COMPLETE_PLAN_PRICE;

    const revenueLastMonthConditions = [
      eq(tenants.plan, "complete"),
      gte(tenants.updatedAt, lastMonthStart),
      sql`${tenants.updatedAt} < ${thisMonthStart}`
    ];
    if (excludeTestTenants) revenueLastMonthConditions.push(excludeTestTenants);
    const [completePurchasesLastMonthResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(...revenueLastMonthConditions));
    const revenueLastMonth = (completePurchasesLastMonthResult?.count || 0) * COMPLETE_PLAN_PRICE;

    const revenueThisYearConditions = [
      eq(tenants.plan, "complete"),
      gte(tenants.updatedAt, thisYearStart)
    ];
    if (excludeTestTenants) revenueThisYearConditions.push(excludeTestTenants);
    const [completePurchasesThisYearResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(...revenueThisYearConditions));
    const revenueThisYear = (completePurchasesThisYearResult?.count || 0) * COMPLETE_PLAN_PRICE;

    const conversionRate = totalTenants > 0 
      ? ((completeTenants / totalTenants) * 100).toFixed(1) 
      : "0";

    // ============================================================================
    // TAX ESTIMATES
    // ============================================================================

    const estimatedTaxThisYear = revenueThisYear * TAX_RATE;
    const netRevenueThisYear = revenueThisYear - estimatedTaxThisYear;

    // ============================================================================
    // ENGAGEMENT METRICS (excluding test accounts)
    // ============================================================================

    // Get planners that are NOT associated with test accounts
    const realPlannerIds = testTenantIds.length > 0
      ? await db
          .select({ id: planners.id })
          .from(planners)
          .where(notInArray(planners.tenantId, testTenantIds))
      : await db.select({ id: planners.id }).from(planners);
    
    const realPlannerIdList = realPlannerIds.map(p => p.id);

    const [totalPagesResult] = realPlannerIdList.length > 0
      ? await db
          .select({ count: count() })
          .from(pages)
          .where(inArray(pages.plannerId, realPlannerIdList))
      : [{ count: 0 }];
    const totalPages = totalPagesResult?.count || 0;

    // RSVP forms (excluding test accounts)
    const rsvpFormsConditions = excludeTestTenants ? [excludeTestTenants] : [];
    const [totalRsvpFormsResult] = testTenantIds.length > 0
      ? await db
          .select({ count: count() })
          .from(rsvpForms)
          .where(notInArray(rsvpForms.tenantId, testTenantIds))
      : await db.select({ count: count() }).from(rsvpForms);
    const totalRsvpForms = totalRsvpFormsResult?.count || 0;

    // RSVP responses (need to join through forms)
    const realRsvpFormIds = testTenantIds.length > 0
      ? await db
          .select({ id: rsvpForms.id })
          .from(rsvpForms)
          .where(notInArray(rsvpForms.tenantId, testTenantIds))
      : await db.select({ id: rsvpForms.id }).from(rsvpForms);
    
    const realRsvpFormIdList = realRsvpFormIds.map(f => f.id);
    
    const [totalRsvpResponsesResult] = realRsvpFormIdList.length > 0
      ? await db
          .select({ count: count() })
          .from(rsvpResponses)
          .where(inArray(rsvpResponses.formId, realRsvpFormIdList))
      : [{ count: 0 }];
    const totalRsvpResponses = totalRsvpResponsesResult?.count || 0;

    const totalPlanners = realPlannerIdList.length;
    const avgPagesPerPlanner = totalPlanners > 0 
      ? (totalPages / totalPlanners).toFixed(1) 
      : "0";

    // ============================================================================
    // TEMPLATE USAGE ANALYTICS (excluding test accounts)
    // ============================================================================

    // Get all pages with their template IDs (excluding cover and test accounts)
    const allPages = realPlannerIdList.length > 0
      ? await db
          .select({
            templateId: pages.templateId,
            fields: pages.fields,
            plannerId: pages.plannerId,
          })
          .from(pages)
          .where(and(
            ne(pages.templateId, "cover"),
            inArray(pages.plannerId, realPlannerIdList)
          ))
      : [];

    // Count template usage
    const templateUsage: Record<string, number> = {};
    allPages.forEach(page => {
      templateUsage[page.templateId] = (templateUsage[page.templateId] || 0) + 1;
    });

    // Sort by usage
    const templateRankings = Object.entries(templateUsage)
      .map(([templateId, usageCount]) => ({ templateId, count: usageCount }))
      .sort((a, b) => b.count - a.count);

    // ============================================================================
    // TEMPLATE FIELD COMPLETION ANALYSIS
    // ============================================================================

    // Analyze how "filled out" each template type is on average
    const templateCompletion: Record<string, { total: number; filledFields: number; pageCount: number }> = {};
    
    allPages.forEach(page => {
      const fields = page.fields as Record<string, unknown>;
      const fieldKeys = Object.keys(fields);
      const filledFields = fieldKeys.filter(key => {
        const value = fields[key];
        if (value === null || value === undefined || value === "") return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === "object" && Object.keys(value as object).length === 0) return false;
        return true;
      }).length;

      if (!templateCompletion[page.templateId]) {
        templateCompletion[page.templateId] = { total: 0, filledFields: 0, pageCount: 0 };
      }
      templateCompletion[page.templateId].total += fieldKeys.length;
      templateCompletion[page.templateId].filledFields += filledFields;
      templateCompletion[page.templateId].pageCount += 1;
    });

    const templateEngagement = Object.entries(templateCompletion)
      .map(([templateId, data]) => ({
        templateId,
        avgCompletion: data.total > 0 
          ? Math.round((data.filledFields / data.total) * 100) 
          : 0,
        pageCount: data.pageCount,
      }))
      .sort((a, b) => b.avgCompletion - a.avgCompletion);

    // ============================================================================
    // GUEST LIST INSIGHTS (Anonymized & Aggregated)
    // ============================================================================

    const guestListPages = allPages.filter(p => p.templateId === "guest-list");
    let totalGuests = 0;
    let totalConfirmed = 0;
    let totalWithMeals = 0;
    let totalWithDietary = 0;
    let guestListsWithData = 0;

    guestListPages.forEach(page => {
      const fields = page.fields as Record<string, unknown>;
      const guests = fields.guests as Array<Record<string, unknown>> | undefined;
      if (Array.isArray(guests) && guests.length > 0) {
        guestListsWithData++;
        totalGuests += guests.length;
        guests.forEach(guest => {
          if (guest.rsvp === true) totalConfirmed++;
          if (guest.meal) totalWithMeals++;
          if (guest.dietaryRestrictions) totalWithDietary++;
        });
      }
    });

    const avgGuestsPerWedding = guestListsWithData > 0 
      ? Math.round(totalGuests / guestListsWithData) 
      : 0;
    const avgRsvpRate = totalGuests > 0 
      ? Math.round((totalConfirmed / totalGuests) * 100) 
      : 0;

    // ============================================================================
    // BUDGET INSIGHTS (Anonymized & Aggregated)
    // ============================================================================

    const budgetPages = allPages.filter(p => p.templateId === "budget");
    let totalBudgetAmount = 0;
    let totalAllocated = 0;
    let totalPaidAmount = 0;
    let budgetsWithData = 0;
    const categorySpending: Record<string, number> = {};

    budgetPages.forEach(page => {
      const fields = page.fields as Record<string, unknown>;
      const budget = parseFloat(fields.totalBudget as string) || 0;
      const items = fields.items as Array<Record<string, unknown>> | undefined;
      
      if (budget > 0 || (Array.isArray(items) && items.length > 0)) {
        budgetsWithData++;
        totalBudgetAmount += budget;
        
        if (Array.isArray(items)) {
          items.forEach(item => {
            const cost = parseFloat(item.totalCost as string) || 0;
            const paid = parseFloat(item.amountPaid as string) || 0;
            const category = (item.category as string) || "Other";
            
            totalAllocated += cost;
            totalPaidAmount += paid;
            categorySpending[category] = (categorySpending[category] || 0) + cost;
          });
        }
      }
    });

    const avgBudget = budgetsWithData > 0 
      ? Math.round(totalBudgetAmount / budgetsWithData) 
      : 0;
    const avgAllocated = budgetsWithData > 0 
      ? Math.round(totalAllocated / budgetsWithData) 
      : 0;

    // Top spending categories
    const topCategories = Object.entries(categorySpending)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // ============================================================================
    // VENDOR INSIGHTS (Anonymized & Aggregated)
    // ============================================================================

    const vendorPages = allPages.filter(p => p.templateId === "vendor-contacts");
    let totalVendors = 0;
    let vendorsBooked = 0;
    let vendorsWithContracts = 0;
    const vendorCategories: Record<string, number> = {};

    vendorPages.forEach(page => {
      const fields = page.fields as Record<string, unknown>;
      const vendors = fields.vendors as Array<Record<string, unknown>> | undefined;
      
      if (Array.isArray(vendors)) {
        totalVendors += vendors.length;
        vendors.forEach(vendor => {
          const category = (vendor.category as string) || "Other";
          vendorCategories[category] = (vendorCategories[category] || 0) + 1;
          if (vendor.contractStatus === "signed") vendorsWithContracts++;
          if (vendor.contractStatus === "signed" || vendor.depositPaid) vendorsBooked++;
        });
      }
    });

    const topVendorCategories = Object.entries(vendorCategories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ============================================================================
    // RSVP FORM FIELD PREFERENCES (excluding test accounts)
    // ============================================================================

    const allRsvpForms = testTenantIds.length > 0
      ? await db
          .select({ fields: rsvpForms.fields })
          .from(rsvpForms)
          .where(notInArray(rsvpForms.tenantId, testTenantIds))
      : await db.select({ fields: rsvpForms.fields }).from(rsvpForms);
    
    const rsvpFieldUsage: Record<string, number> = {};

    allRsvpForms.forEach(form => {
      const fields = form.fields as Record<string, boolean>;
      Object.entries(fields).forEach(([field, enabled]) => {
        if (enabled) {
          rsvpFieldUsage[field] = (rsvpFieldUsage[field] || 0) + 1;
        }
      });
    });

    const rsvpFieldPreferences = Object.entries(rsvpFieldUsage)
      .map(([field, count]) => ({ 
        field, 
        count,
        percentage: allRsvpForms.length > 0 
          ? Math.round((count / allRsvpForms.length) * 100) 
          : 0
      }))
      .sort((a, b) => b.count - a.count);

    // ============================================================================
    // FEATURE ADOPTION RATES
    // ============================================================================

    // What % of users create RSVP forms?
    const rsvpAdoptionRate = totalPlanners > 0 
      ? Math.round((totalRsvpForms / totalPlanners) * 100) 
      : 0;

    // What % of users use budget tracking?
    const budgetAdoptionRate = totalPlanners > 0 
      ? Math.round((budgetPages.length / totalPlanners) * 100) 
      : 0;

    // What % of users use vendor contacts?
    const vendorAdoptionRate = totalPlanners > 0 
      ? Math.round((vendorPages.length / totalPlanners) * 100) 
      : 0;

    // What % of users use seating chart?
    const seatingPages = allPages.filter(p => p.templateId === "seating-chart");
    const seatingAdoptionRate = totalPlanners > 0 
      ? Math.round((seatingPages.length / totalPlanners) * 100) 
      : 0;

    // ============================================================================
    // AI PLANNER INSIGHTS (excluding test accounts)
    // ============================================================================

    // Get all conversations (excluding test accounts)
    const allConversations = testTenantIds.length > 0
      ? await db
          .select({
            id: scribeConversations.id,
            tenantId: scribeConversations.tenantId,
            messages: scribeConversations.messages,
            isActive: scribeConversations.isActive,
            createdAt: scribeConversations.createdAt,
          })
          .from(scribeConversations)
          .where(notInArray(scribeConversations.tenantId, testTenantIds))
      : await db
          .select({
            id: scribeConversations.id,
            tenantId: scribeConversations.tenantId,
            messages: scribeConversations.messages,
            isActive: scribeConversations.isActive,
            createdAt: scribeConversations.createdAt,
          })
          .from(scribeConversations);

    // Count conversations and messages
    const totalConversations = allConversations.length;
    let totalAIMessages = 0;
    const uniqueTenantIds = new Set<string>();
    
    allConversations.forEach(convo => {
      uniqueTenantIds.add(convo.tenantId);
      const messages = convo.messages as Array<{ role: string }> | null;
      if (Array.isArray(messages)) {
        totalAIMessages += messages.length;
      }
    });

    const tenantsUsingAI = uniqueTenantIds.size;
    const aiAdoptionRate = totalTenants > 0 
      ? Math.round((tenantsUsingAI / totalTenants) * 100) 
      : 0;
    const avgMessagesPerConversation = totalConversations > 0
      ? Math.round(totalAIMessages / totalConversations)
      : 0;

    // Get planner name preferences
    const allTenantsWithPlannerName = testTenantIds.length > 0
      ? await db
          .select({ plannerName: tenants.plannerName })
          .from(tenants)
          .where(notInArray(tenants.id, testTenantIds))
      : await db.select({ plannerName: tenants.plannerName }).from(tenants);

    const plannerNameCounts: Record<string, number> = {};
    allTenantsWithPlannerName.forEach(t => {
      const name = t.plannerName || "Planner";
      plannerNameCounts[name] = (plannerNameCounts[name] || 0) + 1;
    });

    const topPlannerNames = Object.entries(plannerNameCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // AI usage by plan type
    const tenantsWithConversations = new Set(allConversations.map(c => c.tenantId));
    const freeTenantsWithAI = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(
        eq(tenants.plan, "free"),
        excludeTestTenants ? excludeTestTenants : sql`1=1`
      ));
    const paidTenantsWithAI = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(
        eq(tenants.plan, "complete"),
        excludeTestTenants ? excludeTestTenants : sql`1=1`
      ));

    const freeUsingAI = freeTenantsWithAI.filter(t => tenantsWithConversations.has(t.id)).length;
    const paidUsingAI = paidTenantsWithAI.filter(t => tenantsWithConversations.has(t.id)).length;

    // ============================================================================
    // RECENT ACTIVITY (excluding test accounts)
    // ============================================================================

    const recentSignupsConditions = excludeTestTenants ? [excludeTestTenants] : [];
    const recentSignups = await db
      .select({
        id: tenants.id,
        displayName: tenants.displayName,
        plan: tenants.plan,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .where(recentSignupsConditions.length > 0 ? and(...recentSignupsConditions) : undefined)
      .orderBy(desc(tenants.createdAt))
      .limit(10);

    const recentUpgradesConditions = [eq(tenants.plan, "complete")];
    if (excludeTestTenants) recentUpgradesConditions.push(excludeTestTenants);
    const recentUpgrades = await db
      .select({
        id: tenants.id,
        displayName: tenants.displayName,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .where(and(...recentUpgradesConditions))
      .orderBy(desc(tenants.updatedAt))
      .limit(10);

    // ============================================================================
    // MONTHLY TRENDS (last 6 months, excluding test accounts)
    // ============================================================================

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const signupsConditions = [
        gte(tenants.createdAt, monthStart),
        sql`${tenants.createdAt} <= ${monthEnd}`
      ];
      if (excludeTestTenants) signupsConditions.push(excludeTestTenants);
      
      const [signupsResult] = await db
        .select({ count: count() })
        .from(tenants)
        .where(and(...signupsConditions));

      const upgradesConditions = [
        eq(tenants.plan, "complete"),
        gte(tenants.updatedAt, monthStart),
        sql`${tenants.updatedAt} <= ${monthEnd}`
      ];
      if (excludeTestTenants) upgradesConditions.push(excludeTestTenants);

      const [upgradesResult] = await db
        .select({ count: count() })
        .from(tenants)
        .where(and(...upgradesConditions));

      monthlyData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        signups: signupsResult?.count || 0,
        upgrades: upgradesResult?.count || 0,
        revenue: (upgradesResult?.count || 0) * COMPLETE_PLAN_PRICE,
      });
    }

    // ============================================================================
    // TEST ACCOUNTS COUNT (for reference)
    // ============================================================================
    
    const testAccountCount = testTenantIds.length;

    // ============================================================================
    // RESPONSE
    // ============================================================================

    return NextResponse.json({
      users: {
        total: totalUsers,
        totalTenants,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        monthOverMonthGrowth: newUsersLastMonth > 0 
          ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
          : newUsersThisMonth > 0 ? "100" : "0",
        testAccountsExcluded: testAccountCount,
      },
      plans: {
        free: freeTenants,
        complete: completeTenants,
        conversionRate,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        thisYear: revenueThisYear,
        monthOverMonthGrowth: revenueLastMonth > 0
          ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
          : revenueThisMonth > 0 ? "100" : "0",
        pricePerUnit: COMPLETE_PLAN_PRICE,
      },
      taxes: {
        rate: TAX_RATE,
        estimatedThisYear: estimatedTaxThisYear,
        netRevenueThisYear,
      },
      engagement: {
        totalPages,
        totalPlanners,
        avgPagesPerPlanner,
        totalRsvpForms,
        totalRsvpResponses,
      },
      // NEW: Product insights
      productInsights: {
        templateUsage: {
          rankings: templateRankings.slice(0, 10),
          engagement: templateEngagement,
        },
        guestList: {
          avgGuestsPerWedding,
          avgRsvpRate,
          totalGuests,
          totalConfirmed,
          weddingsWithData: guestListsWithData,
        },
        budget: {
          avgBudget,
          avgAllocated,
          totalTracked: totalBudgetAmount,
          topCategories,
          weddingsWithData: budgetsWithData,
        },
        vendors: {
          totalTracked: totalVendors,
          bookedRate: totalVendors > 0 ? Math.round((vendorsBooked / totalVendors) * 100) : 0,
          contractRate: totalVendors > 0 ? Math.round((vendorsWithContracts / totalVendors) * 100) : 0,
          topCategories: topVendorCategories,
        },
        rsvpForms: {
          fieldPreferences: rsvpFieldPreferences,
          avgResponseRate: totalRsvpForms > 0 
            ? Math.round(totalRsvpResponses / totalRsvpForms) 
            : 0,
        },
        featureAdoption: {
          rsvp: rsvpAdoptionRate,
          budget: budgetAdoptionRate,
          vendors: vendorAdoptionRate,
          seating: seatingAdoptionRate,
          ai: aiAdoptionRate,
        },
        aiPlanner: {
          totalConversations,
          totalMessages: totalAIMessages,
          tenantsUsingAI,
          aiAdoptionRate,
          avgMessagesPerConversation,
          topPlannerNames,
          usageByPlan: {
            free: freeUsingAI,
            paid: paidUsingAI,
          },
        },
      },
      activity: {
        recentSignups,
        recentUpgrades,
      },
      trends: {
        monthly: monthlyData,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
