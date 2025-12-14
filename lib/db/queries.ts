import { db } from "./index";
import { eq, and, or, lte, lt, count, isNotNull, isNull, sql } from "drizzle-orm";
import {
  tenants,
  users,
  planners,
  pages,
  passwordResetTokens,
  calendarEvents,
  googleCalendarConnections,
  calendarSyncLog,
  scheduledEmails,
  promoCodes,
  partnerInviteTokens,
  type Tenant,
  type User,
  type Planner,
  type Page,
  type CalendarEvent,
  type NewCalendarEvent,
  type GoogleCalendarConnection,
  type NewGoogleCalendarConnection,
  type ScheduledEmail,
  type PromoCode,
  type NewPromoCode,
} from "./schema";

// ============================================================================
// TENANT QUERIES
// ============================================================================

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const result = await db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
  });
  return result ?? null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  const result = await db.query.tenants.findFirst({
    where: eq(tenants.id, id),
  });
  return result ?? null;
}

export async function updateTenantOnboarding(
  tenantId: string,
  complete: boolean
): Promise<void> {
  await db
    .update(tenants)
    .set({ onboardingComplete: complete, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  return result ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  return result ?? null;
}

export async function getUsersByTenantId(tenantId: string): Promise<User[]> {
  const result = await db.query.users.findMany({
    where: eq(users.tenantId, tenantId),
  });
  return result;
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string
): Promise<void> {
  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

// ============================================================================
// PASSWORD RESET QUERIES
// ============================================================================

export async function createPasswordResetToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  // Delete any existing tokens for this user
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));

  await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt,
  });
}

export async function getPasswordResetToken(token: string) {
  const result = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });
  return result ?? null;
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token));
}

// ============================================================================
// PLANNER QUERIES
// ============================================================================

export async function getPlannerByTenantId(
  tenantId: string
): Promise<Planner | null> {
  const result = await db.query.planners.findFirst({
    where: eq(planners.tenantId, tenantId),
  });
  return result ?? null;
}

export async function createPlanner(tenantId: string): Promise<Planner> {
  const [planner] = await db
    .insert(planners)
    .values({ tenantId })
    .returning();
  return planner;
}

export async function getOrCreatePlanner(tenantId: string): Promise<Planner> {
  const existing = await getPlannerByTenantId(tenantId);
  if (existing) return existing;
  return createPlanner(tenantId);
}

// ============================================================================
// PAGE QUERIES
// ============================================================================

export async function getPagesByPlannerId(plannerId: string): Promise<Page[]> {
  const result = await db.query.pages.findMany({
    where: eq(pages.plannerId, plannerId),
    orderBy: (pages, { asc }) => [asc(pages.position)],
  });
  return result;
}

export async function getPageById(
  pageId: string,
  plannerId: string
): Promise<Page | null> {
  const result = await db.query.pages.findFirst({
    where: and(eq(pages.id, pageId), eq(pages.plannerId, plannerId)),
  });
  return result ?? null;
}

export async function createPage(
  plannerId: string,
  templateId: string,
  title: string,
  position: number,
  fields: Record<string, unknown> = {}
): Promise<Page> {
  const [page] = await db
    .insert(pages)
    .values({ plannerId, templateId, title, position, fields })
    .returning();
  return page;
}

export async function updatePageFields(
  pageId: string,
  fields: Record<string, unknown>
): Promise<void> {
  await db
    .update(pages)
    .set({ fields, updatedAt: new Date() })
    .where(eq(pages.id, pageId));
}

export async function updatePagePosition(
  pageId: string,
  position: number
): Promise<void> {
  await db
    .update(pages)
    .set({ position, updatedAt: new Date() })
    .where(eq(pages.id, pageId));
}

export async function updatePageTitle(
  pageId: string,
  title: string
): Promise<void> {
  await db
    .update(pages)
    .set({ title, updatedAt: new Date() })
    .where(eq(pages.id, pageId));
}

export async function deletePage(pageId: string): Promise<void> {
  await db.delete(pages).where(eq(pages.id, pageId));
}

export async function reorderPages(
  plannerId: string,
  pageIds: string[]
): Promise<void> {
  // Update positions based on array order
  await Promise.all(
    pageIds.map((pageId, index) =>
      db
        .update(pages)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(pages.id, pageId), eq(pages.plannerId, plannerId)))
    )
  );
}

// ============================================================================
// CALENDAR EVENT QUERIES
// ============================================================================

export async function getCalendarEventsByTenantId(
  tenantId: string
): Promise<CalendarEvent[]> {
  const result = await db.query.calendarEvents.findMany({
    where: eq(calendarEvents.tenantId, tenantId),
    orderBy: (calendarEvents, { asc }) => [asc(calendarEvents.startTime)],
  });
  return result;
}

export async function getCalendarEventById(
  eventId: string,
  tenantId: string
): Promise<CalendarEvent | null> {
  const result = await db.query.calendarEvents.findFirst({
    where: and(
      eq(calendarEvents.id, eventId),
      eq(calendarEvents.tenantId, tenantId)
    ),
  });
  return result ?? null;
}

export async function createCalendarEvent(
  data: NewCalendarEvent
): Promise<CalendarEvent> {
  const [event] = await db.insert(calendarEvents).values(data).returning();
  return event;
}

export async function updateCalendarEvent(
  eventId: string,
  tenantId: string,
  data: Partial<Omit<CalendarEvent, "id" | "tenantId" | "createdAt">>
): Promise<CalendarEvent | null> {
  const [event] = await db
    .update(calendarEvents)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(calendarEvents.id, eventId), eq(calendarEvents.tenantId, tenantId))
    )
    .returning();
  return event ?? null;
}

export async function deleteCalendarEvent(
  eventId: string,
  tenantId: string
): Promise<void> {
  await db
    .delete(calendarEvents)
    .where(
      and(eq(calendarEvents.id, eventId), eq(calendarEvents.tenantId, tenantId))
    );
}

export async function getCalendarEventByGoogleId(
  googleEventId: string,
  tenantId: string
): Promise<CalendarEvent | null> {
  const result = await db.query.calendarEvents.findFirst({
    where: and(
      eq(calendarEvents.googleEventId, googleEventId),
      eq(calendarEvents.tenantId, tenantId)
    ),
  });
  return result ?? null;
}

// ============================================================================
// GOOGLE CALENDAR CONNECTION QUERIES
// ============================================================================

export async function getGoogleCalendarConnection(
  tenantId: string
): Promise<GoogleCalendarConnection | null> {
  const result = await db.query.googleCalendarConnections.findFirst({
    where: eq(googleCalendarConnections.tenantId, tenantId),
  });
  return result ?? null;
}

export async function createGoogleCalendarConnection(
  data: NewGoogleCalendarConnection
): Promise<GoogleCalendarConnection> {
  const [connection] = await db
    .insert(googleCalendarConnections)
    .values(data)
    .returning();
  return connection;
}

export async function updateGoogleCalendarConnection(
  tenantId: string,
  data: Partial<Omit<GoogleCalendarConnection, "id" | "tenantId" | "connectedAt">>
): Promise<GoogleCalendarConnection | null> {
  const [connection] = await db
    .update(googleCalendarConnections)
    .set(data)
    .where(eq(googleCalendarConnections.tenantId, tenantId))
    .returning();
  return connection ?? null;
}

export async function deleteGoogleCalendarConnection(
  tenantId: string
): Promise<void> {
  await db
    .delete(googleCalendarConnections)
    .where(eq(googleCalendarConnections.tenantId, tenantId));
}

// ============================================================================
// CALENDAR SYNC LOG QUERIES
// ============================================================================

export async function createCalendarSyncLog(
  tenantId: string,
  action: string,
  status: string,
  eventId?: string,
  googleEventId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await db.insert(calendarSyncLog).values({
    tenantId,
    action,
    status,
    eventId,
    googleEventId,
    details,
  });
}

// ============================================================================
// SCHEDULED EMAIL QUERIES
// ============================================================================

export async function scheduleEmail(
  userId: string,
  tenantId: string,
  emailType: string,
  scheduledFor: Date
): Promise<ScheduledEmail> {
  const [email] = await db
    .insert(scheduledEmails)
    .values({
      userId,
      tenantId,
      emailType,
      scheduledFor,
      status: "pending",
    })
    .returning();
  return email;
}

export async function getPendingScheduledEmails(): Promise<
  Array<ScheduledEmail & { user: { email: string; name: string | null; unsubscribeToken: string | null } }>
> {
  const now = new Date();
  const emails = await db
    .select({
      id: scheduledEmails.id,
      userId: scheduledEmails.userId,
      tenantId: scheduledEmails.tenantId,
      emailType: scheduledEmails.emailType,
      scheduledFor: scheduledEmails.scheduledFor,
      sentAt: scheduledEmails.sentAt,
      status: scheduledEmails.status,
      error: scheduledEmails.error,
      createdAt: scheduledEmails.createdAt,
      user: {
        email: users.email,
        name: users.name,
        unsubscribeToken: users.unsubscribeToken,
      },
    })
    .from(scheduledEmails)
    .innerJoin(users, eq(scheduledEmails.userId, users.id))
    .where(
      and(
        eq(scheduledEmails.status, "pending"),
        lte(scheduledEmails.scheduledFor, now),
        eq(users.emailOptIn, true) // Only send to opted-in users
      )
    );
  return emails;
}

export async function markEmailAsSent(emailId: string): Promise<void> {
  await db
    .update(scheduledEmails)
    .set({
      status: "sent",
      sentAt: new Date(),
    })
    .where(eq(scheduledEmails.id, emailId));
}

export async function markEmailAsFailed(
  emailId: string,
  error: string
): Promise<void> {
  await db
    .update(scheduledEmails)
    .set({
      status: "failed",
      error,
    })
    .where(eq(scheduledEmails.id, emailId));
}

// ============================================================================
// EMAIL SUBSCRIPTION QUERIES (for admin)
// ============================================================================

export interface EmailStats {
  totalUsers: number;
  subscribedUsers: number;
  unsubscribedUsers: number;
}

export async function getEmailStats(): Promise<EmailStats> {
  const [total] = await db.select({ count: count() }).from(users);
  const [subscribed] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.emailOptIn, true));
  const [unsubscribed] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.emailOptIn, false),
        isNotNull(users.unsubscribedAt) // They explicitly unsubscribed
      )
    );

  return {
    totalUsers: total?.count ?? 0,
    subscribedUsers: subscribed?.count ?? 0,
    unsubscribedUsers: unsubscribed?.count ?? 0,
  };
}

export async function getSubscribedUsers(): Promise<
  Array<{ id: string; email: string; name: string | null; unsubscribeToken: string | null }>
> {
  const subscribedUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      unsubscribeToken: users.unsubscribeToken,
    })
    .from(users)
    .where(eq(users.emailOptIn, true));
  return subscribedUsers;
}

// ============================================================================
// PROMO CODE QUERIES
// ============================================================================

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const codes = await db.query.promoCodes.findMany({
    orderBy: (promoCodes, { desc }) => [desc(promoCodes.createdAt)],
  });
  return codes;
}

export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  const result = await db.query.promoCodes.findFirst({
    where: eq(promoCodes.code, code.toUpperCase()),
  });
  return result ?? null;
}

export async function createPromoCode(data: NewPromoCode): Promise<PromoCode> {
  const [code] = await db
    .insert(promoCodes)
    .values({
      ...data,
      code: data.code.toUpperCase(),
    })
    .returning();
  return code;
}

export async function updatePromoCode(
  id: string,
  data: Partial<Omit<PromoCode, "id" | "createdAt">>
): Promise<PromoCode | null> {
  const [code] = await db
    .update(promoCodes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(promoCodes.id, id))
    .returning();
  return code ?? null;
}

export async function incrementPromoCodeUses(id: string): Promise<boolean> {
  // Use atomic SQL increment to prevent race conditions
  // Also validates that we don't exceed maxUses in the same query
  const result = await db
    .update(promoCodes)
    .set({
      currentUses: sql`${promoCodes.currentUses} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(promoCodes.id, id),
        // Only increment if under limit (or no limit set)
        or(
          isNull(promoCodes.maxUses),
          lt(promoCodes.currentUses, promoCodes.maxUses)
        )
      )
    )
    .returning({ id: promoCodes.id });

  // Return true if update was successful (row matched the conditions)
  return result.length > 0;
}

// ============================================================================
// TENANT PLAN QUERIES
// ============================================================================

export async function upgradeTenantToComplete(tenantId: string): Promise<Tenant | null> {
  const [tenant] = await db
    .update(tenants)
    .set({ plan: "complete", updatedAt: new Date() })
    .where(eq(tenants.id, tenantId))
    .returning();
  return tenant ?? null;
}

export async function getTenantByUserId(userId: string): Promise<Tenant | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) return null;
  
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, user.tenantId),
  });
  return tenant ?? null;
}

export async function upgradeTenantByUserEmail(email: string): Promise<Tenant | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  return upgradeTenantToComplete(user.tenantId);
}

// ============================================================================
// PARTNER INVITE QUERIES
// ============================================================================

export async function createPartnerInviteToken(
  tenantId: string,
  invitedByUserId: string,
  email: string,
  token: string,
  expiresAt: Date
) {
  // Expire any existing pending invites for this email in this tenant
  await db
    .update(partnerInviteTokens)
    .set({ status: "expired" })
    .where(
      and(
        eq(partnerInviteTokens.tenantId, tenantId),
        eq(partnerInviteTokens.email, email.toLowerCase()),
        eq(partnerInviteTokens.status, "pending")
      )
    );

  const [invite] = await db
    .insert(partnerInviteTokens)
    .values({
      tenantId,
      invitedByUserId,
      email: email.toLowerCase(),
      token,
      expiresAt,
    })
    .returning();

  return invite;
}

export async function getPartnerInviteByToken(token: string) {
  const result = await db.query.partnerInviteTokens.findFirst({
    where: eq(partnerInviteTokens.token, token),
  });
  return result ?? null;
}

export async function getPendingPartnerInviteByTenant(tenantId: string) {
  const result = await db.query.partnerInviteTokens.findFirst({
    where: and(
      eq(partnerInviteTokens.tenantId, tenantId),
      eq(partnerInviteTokens.status, "pending")
    ),
  });
  return result ?? null;
}

export async function markPartnerInviteAccepted(token: string) {
  const [invite] = await db
    .update(partnerInviteTokens)
    .set({
      status: "accepted",
      acceptedAt: new Date(),
    })
    .where(eq(partnerInviteTokens.token, token))
    .returning();
  return invite ?? null;
}

export async function expirePartnerInvite(token: string) {
  await db
    .update(partnerInviteTokens)
    .set({ status: "expired" })
    .where(eq(partnerInviteTokens.token, token));
}
