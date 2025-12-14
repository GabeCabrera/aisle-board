// ============================================================================
// AGGREGATE INSIGHTS - Anonymized data across all users
// ============================================================================
export const aggregateInsights = pgTable("aggregate_insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Scope
  region: text("region"), // NULL for global, or "Utah", "California", etc.
  season: text("season"), // NULL for all, or "spring", "summer", etc.
  
  // Budget insights (in cents)
  avgTotalBudget: integer("avg_total_budget"),
  medianTotalBudget: integer("median_total_budget"),
  avgVenueBudget: integer("avg_venue_budget"),
  avgPhotographyBudget: integer("avg_photography_budget"),
  avgCateringBudget: integer("avg_catering_budget"),
  avgFloristBudget: integer("avg_florist_budget"),
  avgMusicBudget: integer("avg_music_budget"),
  avgAttireBudget: integer("avg_attire_budget"),
  
  // Guest insights
  avgGuestCount: integer("avg_guest_count"),
  medianGuestCount: integer("median_guest_count"),
  
  // Timeline insights (in days before wedding)
  avgVenueBookingLeadTime: integer("avg_venue_booking_lead_time"),
  avgPhotographerBookingLeadTime: integer("avg_photographer_booking_lead_time"),
  avgCatererBookingLeadTime: integer("avg_caterer_booking_lead_time"),
  
  // Vibe patterns
  commonVibes: jsonb("common_vibes").default({}), // { "rustic": 234, "modern": 189 }
  commonFormalities: jsonb("common_formalities").default({}), // { "semi_formal": 450 }
  commonColorPalettes: jsonb("common_color_palettes").default([]), // [["dusty rose", "sage"], ...]
  
  // Stressor patterns
  commonStressors: jsonb("common_stressors").default({}), // { "budget": 500, "seating": 340 }
  
  // Vendor patterns
  popularVendorCategories: jsonb("popular_vendor_categories").default([]), // Ordered by booking frequency
  
  // Meta
  sampleSize: integer("sample_size").notNull().default(0),
  computedAt: timestamp("computed_at", { withTimezone: true }).defaultNow().notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AggregateInsights = typeof aggregateInsights.$inferSelect;
export type NewAggregateInsights = typeof aggregateInsights.$inferInsert;

// ============================================================================
// KNOWLEDGE BASE - Curated wedding planning knowledge
// ============================================================================
export const knowledgeBase = pgTable("knowledge_base", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Categorization
  category: text("category").notNull(), // "budget", "timeline", "etiquette", "vendors", "tips"
  subcategory: text("subcategory"), // "photography", "venue", etc.
  
  // Content
  title: text("title").notNull(),
  content: text("content").notNull(), // The actual knowledge/advice
  
  // Context - when this applies
  region: text("region"), // NULL for universal
  season: text("season"), // NULL for all seasons
  budgetRange: text("budget_range"), // "budget", "moderate", "luxury"
  planningPhase: text("planning_phase"), // "early", "mid", "final"
  
  // Search/matching
  tags: jsonb("tags").default([]),
  keywords: jsonb("keywords").default([]), // For semantic matching
  
  // Source
  source: text("source"), // Where this info came from
  sourceUrl: text("source_url"),
  
  // Quality
  isVerified: boolean("is_verified").default(false).notNull(),
  useCount: integer("use_count").default(0).notNull(), // How often AI uses this
  helpfulRating: integer("helpful_rating"), // User feedback
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type NewKnowledgeBase = typeof knowledgeBase.$inferInsert;

// ============================================================================
// WEDDING DECISIONS - Track every major decision and its lock state
// ============================================================================
export const weddingDecisions = pgTable("wedding_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  
  // Identity
  name: text("name").notNull(), // "venue", "photographer", "wedding_date", etc.
  displayName: text("display_name").notNull(), // "Wedding Venue"
  category: text("category").notNull(), // "foundation", "venue", "vendors", "attire", etc.
  
  // State
  status: text("status").notNull().default("not_started"), // not_started, researching, decided, locked
  isRequired: boolean("is_required").default(false).notNull(),
  isSkipped: boolean("is_skipped").default(false).notNull(), // User said "we're not doing this"
  
  // The actual choice
  choiceName: text("choice_name"), // "The Grand Ballroom", "John Smith Photography"
  choiceVendorId: uuid("choice_vendor_id"), // If linked to a vendor record
  choiceDate: timestamp("choice_date", { withTimezone: true }), // If it's a date decision
  choiceAmount: integer("choice_amount"), // Cost in cents if applicable
  choiceNotes: text("choice_notes"),
  
  // Lock information
  lockedAt: timestamp("locked_at", { withTimezone: true }),
  lockReason: text("lock_reason"), // deposit_paid, contract_signed, full_payment, date_passed, user_confirmed
  lockDetails: text("lock_details"), // "Paid $5000 deposit on 3/15"
  
  // Financial tracking
  estimatedCost: integer("estimated_cost"), // in cents
  depositAmount: integer("deposit_amount"), // in cents
  depositPaidAt: timestamp("deposit_paid_at", { withTimezone: true }),
  totalPaid: integer("total_paid").default(0), // in cents
  contractSigned: boolean("contract_signed").default(false),
  contractSignedAt: timestamp("contract_signed_at", { withTimezone: true }),
  
  // Timeline
  dueBy: timestamp("due_by", { withTimezone: true }), // Recommended deadline
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  
  // Ordering
  position: integer("position").default(0), // For display order
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const weddingDecisionsRelations = relations(weddingDecisions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [weddingDecisions.tenantId],
    references: [tenants.id],
  }),
}));

export type WeddingDecision = typeof weddingDecisions.$inferSelect;
export type NewWeddingDecision = typeof weddingDecisions.$inferInsert;

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  uniqueIndex,
  index,
  primaryKey,
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
    
    // Subscription plan: "free" | "monthly" | "yearly"
    plan: text("plan").notNull().default("free"),
    
    // Stripe integration
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"), // For active subscriptions
    stripePriceId: text("stripe_price_id"), // Which price they're on
    subscriptionStatus: text("subscription_status"), // "active" | "canceled" | "past_due" | "trialing" | null
    subscriptionEndsAt: timestamp("subscription_ends_at", { withTimezone: true }), // When current period ends
    
    // AI usage tracking
    aiMessagesUsed: integer("ai_messages_used").notNull().default(0),
    aiMessagesResetAt: timestamp("ai_messages_reset_at", { withTimezone: true }), // For monthly resets if needed
    
    // User's custom name for their AI planner
    plannerName: text("planner_name").default("Planner"),
    
    // Social Profile
    bio: text("bio"),
    socialLinks: jsonb("social_links").default({}), // { instagram: "handle", tiktok: "handle", website: "url" }
    profileImage: text("profile_image"), // URL
    
    // Legacy: for existing "complete" one-time purchases
    hasLegacyAccess: boolean("has_legacy_access").default(false).notNull(),
    
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
  boards: many(boards),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
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
    isTestAccount: boolean("is_test_account").default(false).notNull(), // Exclude from stats
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
}, (table) => ({
  plannerIdx: index("pages_planner_idx").on(table.plannerId),
}));

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
    tenantIdx: index("rsvp_forms_tenant_idx").on(table.tenantId),
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
}, (table) => ({
  formIdx: index("rsvp_responses_form_idx").on(table.formId),
}));

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
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("calendar_events_tenant_idx").on(table.tenantId),
}));

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
// SOCIAL GRAPH - Tenant-to-Tenant following
// ============================================================================
export const follows = pgTable("follows", {
  followerId: uuid("follower_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(tenants, {
    fields: [follows.followerId],
    references: [tenants.id],
    relationName: "following",
  }),
  following: one(tenants, {
    fields: [follows.followingId],
    references: [tenants.id],
    relationName: "followers",
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
// INSPIRATION BOARDS - "Boards" for collecting "Ideas"
// ============================================================================
export const boards = pgTable("boards", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),

  // Social features
  isPublic: boolean("is_public").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("boards_tenant_idx").on(table.tenantId),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [boards.tenantId],
    references: [tenants.id],
  }),
  ideas: many(ideas),
}));

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

// ============================================================================
// INSPIRATION IDEAS - Individual inspiration "pins"
// ============================================================================
export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  sourceUrl: text("source_url"), // Optional URL of the original inspiration
  
  // For uploaded images, we might store metadata
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  
  tags: jsonb("tags").default([]),
  
  // Social features
  originalIdeaId: uuid("original_idea_id"), // If copied from another idea
  viewCount: integer("view_count").default(0).notNull(),
  saveCount: integer("save_count").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ideasRelations = relations(ideas, ({ one }) => ({
  board: one(boards, {
    fields: [ideas.boardId],
    references: [boards.id],
  }),
}));

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

// ============================================================================
// PROMO CODES - Discount codes and free membership grants
// ============================================================================
export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // e.g., "INFLUENCER2024"
  description: text("description"), // Internal note, e.g., "For TikTok influencer @weddingvibes"
  
  // Discount type: percentage, fixed, or free (100% off + auto-upgrade)
  type: text("type").notNull().default("percentage"), // "percentage" | "fixed" | "free"
  value: integer("value").notNull().default(0), // Percentage (0-100) or cents for fixed
  
  // Usage limits
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").notNull().default(0),
  
  // Validity
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PromoCode = typeof promoCodes.$inferSelect;
export type NewPromoCode = typeof promoCodes.$inferInsert;

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

// ============================================================================
// VIBE PROFILES - AI-analyzed wedding aesthetic preferences
// ============================================================================
export const vibeProfiles = pgTable("vibe_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),
  
  // Core vibe attributes
  keywords: jsonb("keywords").notNull().default([]), // ["romantic", "moody", "intimate", "candlelit"]
  colorPalette: jsonb("color_palette").notNull().default([]), // ["#8B0000", "#2C1810", "#D4AF37"]
  aestheticStyle: text("aesthetic_style"), // "Moody Romantic", "Garden Party", etc.
  description: text("description"), // AI-generated description of their vibe
  
  // Preferences extracted from conversation
  venueType: text("venue_type"), // "outdoor", "indoor", "both"
  season: text("season"), // "spring", "summer", "fall", "winter"
  formality: text("formality"), // "casual", "semi-formal", "formal", "black-tie"
  size: text("size"), // "intimate", "medium", "large"
  
  // Pinterest integration
  pinterestConnected: boolean("pinterest_connected").default(false).notNull(),
  pinterestUsername: text("pinterest_username"),
  pinterestBoardIds: jsonb("pinterest_board_ids").default([]), // IDs of connected wedding boards
  pinterestAnalyzedAt: timestamp("pinterest_analyzed_at", { withTimezone: true }),
  
  // Raw data for AI context
  pinterestPinData: jsonb("pinterest_pin_data").default([]), // Analyzed pin descriptions/colors
  conversationInsights: jsonb("conversation_insights").default([]), // Key insights from chat
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vibeProfilesRelations = relations(vibeProfiles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [vibeProfiles.tenantId],
    references: [tenants.id],
  }),
}));

export type VibeProfile = typeof vibeProfiles.$inferSelect;
export type NewVibeProfile = typeof vibeProfiles.$inferInsert;

// ============================================================================
// SCRIBE CONVERSATIONS - Chat history with the AI wedding planner
// ============================================================================
export const scribeConversations = pgTable("concierge_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  
  // Conversation data
  messages: jsonb("messages").notNull().default([]), // Array of {role, content, timestamp}
  
  // Metadata
  title: text("title"), // Auto-generated or first message summary
  isActive: boolean("is_active").default(true).notNull(), // Current active conversation
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scribeConversationsRelations = relations(scribeConversations, ({ one }) => ({
  tenant: one(tenants, {
    fields: [scribeConversations.tenantId],
    references: [tenants.id],
  }),
}));

export type ScribeConversation = typeof scribeConversations.$inferSelect;
export type NewScribeConversation = typeof scribeConversations.$inferInsert;

// ============================================================================
// WEDDING KERNELS - Compressed state for AI context
// ============================================================================
export const weddingKernels = pgTable("wedding_kernels", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),
  
  // ============================================
  // THE COUPLE - who they are
  // ============================================
  names: jsonb("names").notNull().default([]), // ["Sarah", "Mike"]
  pronouns: jsonb("pronouns").default([]), // ["she/her", "he/him"]
  location: text("location"), // "Draper, Utah"
  occupations: jsonb("occupations").notNull().default([]), // ["Aerial PM", "L&D Nurse"]
  
  // Their story
  howTheyMet: text("how_they_met"), // "On Tinder"
  howLongTogether: text("how_long_together"), // "A little over a year"
  engagementDate: timestamp("engagement_date", { withTimezone: true }),
  engagementStory: text("engagement_story"), // "Proposed on July 4th before fireworks"
  whoProposed: text("who_proposed"), // "Gabe"
  
  // ============================================
  // THE WEDDING - the event
  // ============================================
  weddingDate: timestamp("wedding_date", { withTimezone: true }),
  season: text("season"), // spring, summer, fall, winter
  dayOfWeek: text("day_of_week"), // saturday, friday, etc.
  timeOfDay: text("time_of_day"), // morning, afternoon, evening
  
  // Scale
  guestCount: integer("guest_count"),
  guestCountRange: text("guest_count_range"), // intimate, medium, large
  weddingPartySize: integer("wedding_party_size"),
  
  // Location
  region: text("region"), // "Utah", "Pacific Northwest", etc.
  isDestinationWedding: boolean("is_destination_wedding").default(false),
  indoorOutdoor: text("indoor_outdoor"), // indoor, outdoor, both
  
  // Budget
  budgetTotal: integer("budget_total"), // in cents
  budgetSpent: integer("budget_spent").default(0),
  budgetRange: text("budget_range"), // budget, moderate, luxury
  budgetFlexibility: text("budget_flexibility"), // strict, flexible, very_flexible
  budgetPriorities: jsonb("budget_priorities").default([]), // ["photography", "food"]
  
  // ============================================
  // THE VIBE - style & aesthetics
  // ============================================
  vibe: jsonb("vibe").notNull().default([]), // ["rustic", "outdoor", "intimate"]
  formality: text("formality"), // casual, semi_formal, formal, black_tie
  colorPalette: jsonb("color_palette").default([]), // ["dusty rose", "sage", "cream"]
  theme: text("theme"), // if they have a specific theme
  mustHaves: jsonb("must_haves").default([]), // things they definitely want
  dealbreakers: jsonb("dealbreakers").notNull().default([]), // things they definitely don't want
  
  // ============================================
  // PLANNING STATE - where they are
  // ============================================
  planningPhase: text("planning_phase").notNull().default("early"), // dreaming, early, mid, final, week_of
  planningStyle: text("planning_style"), // diy, planner_assisted, full_service
  
  // All decisions tracked as JSON object
  // { venue: { status, name, locked, notes }, photographer: { ... }, ... }
  decisions: jsonb("decisions").notNull().default({}),
  
  // What they've already booked (quick reference)
  vendorsBooked: jsonb("vendors_booked").default([]), // ["venue", "photographer"]
  vendorsPriority: jsonb("vendors_priority").default([]), // what to book next
  
  // ============================================
  // CONCERNS & PRIORITIES
  // ============================================
  stressors: jsonb("stressors").notNull().default([]), // ["seating", "family_drama", "budget"]
  biggestConcern: text("biggest_concern"),
  priorities: jsonb("priorities").notNull().default([]), // ["photography", "food", "music"]
  lessImportant: jsonb("less_important").default([]), // what they care less about
  familyDynamics: text("family_dynamics"), // any family situations to note
  
  // ============================================
  // KEY PEOPLE
  // ============================================
  weddingParty: jsonb("wedding_party").default([]), // [{ name, role, side }]
  officiant: text("officiant"), // who's officiating
  weddingPlanner: text("wedding_planner"), // if they have one
  
  // ============================================
  // TIMELINE & EVENTS
  // ============================================
  ceremonyTime: text("ceremony_time"),
  receptionTime: text("reception_time"),
  honeymoonPlans: text("honeymoon_plans"), // destination or "not yet planned"
  
  // ============================================
  // COMMUNICATION PATTERNS
  // ============================================
  tone: text("tone").default("excited"), // excited, anxious, overwhelmed, calm, frustrated
  communicationStyle: text("communication_style").default("balanced"), // casual, balanced, formal
  decisionMakingStyle: text("decision_making_style"), // quick, research_heavy, needs_reassurance
  planningTogether: boolean("planning_together").default(true), // both involved equally?
  
  // User communication profile (for AI mirroring)
  usesEmojis: boolean("uses_emojis").default(false), // Has user sent emojis?
  usesSwearing: boolean("uses_swearing").default(false), // Has user used casual swearing?
  messageLength: text("message_length").default("medium"), // short, medium, long
  knowledgeLevel: text("knowledge_level").default("intermediate"), // beginner, intermediate, experienced
  
  // ============================================
  // CONTEXT & META
  // ============================================
  recentTopics: jsonb("recent_topics").notNull().default([]),
  onboardingStep: integer("onboarding_step").notNull().default(0),
  onboardingComplete: boolean("onboarding_complete").default(false),
  lastInteraction: timestamp("last_interaction", { withTimezone: true }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const weddingKernelsRelations = relations(weddingKernels, ({ one }) => ({
  tenant: one(tenants, {
    fields: [weddingKernels.tenantId],
    references: [tenants.id],
  }),
}));

export type WeddingKernel = typeof weddingKernels.$inferSelect;
export type NewWeddingKernel = typeof weddingKernels.$inferInsert;

// ============================================================================
// OAUTH ACCOUNTS - Stored tokens for all OAuth providers (Google, Pinterest, etc.)
// ============================================================================
export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    
    // Provider info
    provider: text("provider").notNull(), // "google", "pinterest", "instagram", etc.
    providerAccountId: text("provider_account_id").notNull(), // The ID from the provider
    
    // Tokens
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"), // Not all providers give refresh tokens
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    
    // Scope tracking - what permissions we have
    scope: text("scope"), // Space-separated scopes
    
    // Provider-specific data
    tokenType: text("token_type").default("Bearer"),
    idToken: text("id_token"), // For OIDC providers
    
    // User info from provider
    providerEmail: text("provider_email"),
    providerName: text("provider_name"),
    providerImage: text("provider_image"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Each user can only have one account per provider
    userProviderIdx: uniqueIndex("oauth_user_provider_idx").on(
      table.userId,
      table.provider
    ),
  })
);

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [oauthAccounts.tenantId],
    references: [tenants.id],
  }),
}));

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;

// ============================================================================
// SAVED ARTICLES - Blog articles saved by users
// ============================================================================
export const savedArticles = pgTable(
  "saved_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Article reference (slug from MDX files)
    slug: text("slug").notNull(),

    // When they saved it
    savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Each tenant can only save an article once
    tenantSlugIdx: uniqueIndex("saved_articles_tenant_slug_idx").on(
      table.tenantId,
      table.slug
    ),
    tenantIdx: index("saved_articles_tenant_idx").on(table.tenantId),
  })
);

export const savedArticlesRelations = relations(savedArticles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [savedArticles.tenantId],
    references: [tenants.id],
  }),
}));

export type SavedArticle = typeof savedArticles.$inferSelect;
export type NewSavedArticle = typeof savedArticles.$inferInsert;
