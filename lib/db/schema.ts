import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// TENANTS - Each couple gets a tenant (workspace)
// ============================================================================
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(), // subdomain: "sarahandgabe"
    displayName: text("display_name").notNull().default(""), // "Emma & James"
    weddingDate: timestamp("wedding_date"),
    plan: text("plan").notNull().default("free"), // "free" | "complete"
    stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID after payment
    onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("tenant_slug_idx").on(table.slug),
  })
);

export const tenantsRelations = relations(tenants, ({ many, one }) => ({
  users: many(users),
  planner: one(planners),
  rsvpForms: many(rsvpForms),
}));

// ============================================================================
// USERS - Individual accounts linked to a tenant
// ============================================================================
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"), // Nullable for Google-only users
    googleId: text("google_id").unique(), // Google account ID for OAuth
    name: text("name"),
    role: text("role").notNull().default("member"), // "owner" | "member"
    isAdmin: boolean("is_admin").default(false).notNull(), // Site-wide admin
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    emailVerified: timestamp("email_verified"),
    // Email preferences
    emailOptIn: boolean("email_opt_in").default(false).notNull(),
    unsubscribeToken: text("unsubscribe_token").unique(),
    unsubscribedAt: timestamp("unsubscribed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("user_email_idx").on(table.email),
  })
);

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

// ============================================================================
// PASSWORD RESET TOKENS
// ============================================================================
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// PLANNERS - One per tenant, contains all pages
// ============================================================================
export const planners = pgTable("planners", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const plannersRelations = relations(planners, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [planners.tenantId],
    references: [tenants.id],
  }),
  pages: many(pages),
}));

// ============================================================================
// PAGES - Template instances within a planner
// ============================================================================
export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  plannerId: uuid("planner_id")
    .notNull()
    .references(() => planners.id, { onDelete: "cascade" }),
  templateId: text("template_id").notNull(), // References template registry
  title: text("title").notNull(), // User can customize title
  position: integer("position").notNull().default(0), // For ordering
  fields: jsonb("fields").notNull().default({}), // Template-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pagesRelations = relations(pages, ({ one }) => ({
  planner: one(planners, {
    fields: [pages.plannerId],
    references: [planners.id],
  }),
}));

// ============================================================================
// CUSTOM TEMPLATES - Admin-created templates stored in database
// ============================================================================
export const customTemplates = pgTable("custom_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  templateId: text("template_id").notNull().unique(), // Unique identifier like "honeymoon-checklist"
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "essentials" | "planning" | "people" | "day-of" | "extras"
  icon: text("icon").notNull().default("StickyNote"), // Lucide icon name
  timelineFilters: jsonb("timeline_filters").notNull().default([]), // Array of timeline filters
  fields: jsonb("fields").notNull().default([]), // Array of field definitions
  isFree: boolean("is_free").default(false).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  position: integer("position").notNull().default(0), // For ordering in marketplace
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// RSVP FORMS - Shareable forms for collecting guest information
// ============================================================================
export const rsvpForms = pgTable(
  "rsvp_forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }), // Links to guest-list page
    slug: text("slug").notNull().unique(), // URL slug like "sarah-gabe-abc123"
    title: text("title").notNull().default("RSVP"), // Form title shown to guests
    message: text("message"), // Optional welcome message
    weddingDate: timestamp("wedding_date"), // Display on form
    isActive: boolean("is_active").default(true).notNull(),
    // Customizable fields - which ones to show
    fields: jsonb("fields").notNull().default({
      name: true,
      email: true,
      phone: false,
      address: true,
      attending: true,
      mealChoice: false,
      dietaryRestrictions: false,
      plusOne: false,
      plusOneName: false,
      plusOneMeal: false,
      songRequest: false,
      notes: false,
    }),
    // Meal options if meal choice is enabled
    mealOptions: jsonb("meal_options").notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("rsvp_form_slug_idx").on(table.slug),
  })
);

export const rsvpFormsRelations = relations(rsvpForms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rsvpForms.tenantId],
    references: [tenants.id],
  }),
  page: one(pages, {
    fields: [rsvpForms.pageId],
    references: [pages.id],
  }),
  responses: many(rsvpResponses),
}));

// ============================================================================
// RSVP RESPONSES - Guest submissions
// ============================================================================
export const rsvpResponses = pgTable("rsvp_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => rsvpForms.id, { onDelete: "cascade" }),
  // Guest info
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  attending: boolean("attending"),
  mealChoice: text("meal_choice"),
  dietaryRestrictions: text("dietary_restrictions"),
  plusOne: boolean("plus_one"),
  plusOneName: text("plus_one_name"),
  plusOneMeal: text("plus_one_meal"),
  songRequest: text("song_request"),
  notes: text("notes"),
  // Sync status
  syncedToGuestList: boolean("synced_to_guest_list").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rsvpResponsesRelations = relations(rsvpResponses, ({ one }) => ({
  form: one(rsvpForms, {
    fields: [rsvpResponses.formId],
    references: [rsvpForms.id],
  }),
}));

// ============================================================================
// CALENDAR EVENTS - Wedding planning calendar
// ============================================================================
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  // Event details
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  allDay: boolean("all_day").default(false).notNull(),
  location: text("location"),

  // Categorization
  category: text("category").notNull().default("other"), // vendor, deadline, appointment, milestone, personal, other
  color: text("color").default("blue"),

  // Related entities (for cross-page integration)
  vendorId: text("vendor_id"), // Links to vendor from budget
  taskId: text("task_id"), // Links to task from task board

  // Google Calendar sync
  googleEventId: text("google_event_id").unique(),
  googleCalendarId: text("google_calendar_id"),
  syncStatus: text("sync_status").default("local").notNull(), // local, synced, pending, error
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  googleEtag: text("google_etag"), // For conflict detection

  // Recurrence (future support)
  recurrenceRule: text("recurrence_rule"), // iCal RRULE format

  // Metadata
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [calendarEvents.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(users, {
    fields: [calendarEvents.createdBy],
    references: [users.id],
  }),
}));

// ============================================================================
// GOOGLE CALENDAR CONNECTIONS - OAuth tokens and sync state
// ============================================================================
export const googleCalendarConnections = pgTable("google_calendar_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),

  // OAuth tokens (encrypted in practice)
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }).notNull(),

  // The dedicated wedding calendar we create in Google
  weddingCalendarId: text("wedding_calendar_id").notNull(),
  weddingCalendarName: text("wedding_calendar_name").notNull(),

  // Sync settings
  syncEnabled: boolean("sync_enabled").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  syncToken: text("sync_token"), // For incremental sync

  // User info
  googleEmail: text("google_email"),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  connectedBy: uuid("connected_by").references(() => users.id),
});

export const googleCalendarConnectionsRelations = relations(
  googleCalendarConnections,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [googleCalendarConnections.tenantId],
      references: [tenants.id],
    }),
    connectedByUser: one(users, {
      fields: [googleCalendarConnections.connectedBy],
      references: [users.id],
    }),
  })
);

// ============================================================================
// CALENDAR SYNC LOG - For debugging sync issues
// ============================================================================
export const calendarSyncLog = pgTable("calendar_sync_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // push, pull, conflict_resolved, error
  eventId: uuid("event_id").references(() => calendarEvents.id, { onDelete: "set null" }),
  googleEventId: text("google_event_id"),
  status: text("status").notNull(), // success, failed, conflict
  details: jsonb("details"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calendarSyncLogRelations = relations(calendarSyncLog, ({ one }) => ({
  tenant: one(tenants, {
    fields: [calendarSyncLog.tenantId],
    references: [tenants.id],
  }),
  event: one(calendarEvents, {
    fields: [calendarSyncLog.eventId],
    references: [calendarEvents.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Planner = typeof planners.$inferSelect;
export type NewPlanner = typeof planners.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export type CustomTemplate = typeof customTemplates.$inferSelect;
export type NewCustomTemplate = typeof customTemplates.$inferInsert;

export type RsvpForm = typeof rsvpForms.$inferSelect;
export type NewRsvpForm = typeof rsvpForms.$inferInsert;

export type RsvpResponse = typeof rsvpResponses.$inferSelect;
export type NewRsvpResponse = typeof rsvpResponses.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;

export type GoogleCalendarConnection = typeof googleCalendarConnections.$inferSelect;
export type NewGoogleCalendarConnection = typeof googleCalendarConnections.$inferInsert;

export type CalendarSyncLog = typeof calendarSyncLog.$inferSelect;
export type NewCalendarSyncLog = typeof calendarSyncLog.$inferInsert;

// ============================================================================
// SCHEDULED EMAILS - For delayed email sequences
// ============================================================================
export const scheduledEmails = pgTable("scheduled_emails", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  emailType: text("email_type").notNull(), // welcome, why_29, tips_1, etc.
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"), // pending, sent, failed, cancelled
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduledEmailsRelations = relations(scheduledEmails, ({ one }) => ({
  user: one(users, {
    fields: [scheduledEmails.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [scheduledEmails.tenantId],
    references: [tenants.id],
  }),
}));

export type ScheduledEmail = typeof scheduledEmails.$inferSelect;
export type NewScheduledEmail = typeof scheduledEmails.$inferInsert;
