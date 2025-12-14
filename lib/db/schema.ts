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

    // Stem social platform additions
    messagingEnabled: boolean("messaging_enabled").default(true).notNull(),
    profileVisibility: text("profile_visibility").default("public"), // "public", "followers", "private"

    // Account type: "couple" (default) or "vendor"
    accountType: text("account_type").default("couple"),

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

  // Stem social platform additions
  boardType: text("board_type").default("standard").notNull(), // "standard", "learning", "vendor"
  reactionCount: integer("reaction_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  linkedVendorId: uuid("linked_vendor_id"), // For vendor showcase boards

  // Trending scores
  saveTrendScore: integer("save_trend_score").default(0).notNull(),
  reactionTrendScore: integer("reaction_trend_score").default(0).notNull(),
  lastTrendUpdate: timestamp("last_trend_update", { withTimezone: true }),

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
  articles: many(boardArticles),
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

  // Stem social platform additions
  reactionCount: integer("reaction_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  linkedVendorId: uuid("linked_vendor_id"), // If idea showcases a vendor
  linkedArticleSlug: text("linked_article_slug"), // If idea is from an article

  // Trending scores
  saveTrendScore: integer("save_trend_score").default(0).notNull(),
  reactionTrendScore: integer("reaction_trend_score").default(0).notNull(),
  lastTrendUpdate: timestamp("last_trend_update", { withTimezone: true }),

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

// ============================================================================
// STEM SOCIAL PLATFORM - Activities, Comments, Reactions, Messaging, Vendors
// ============================================================================

// ACTIVITIES - Activity feed for social features
export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorTenantId: uuid("actor_tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Activity type
    type: text("type").notNull(), // "board_created", "idea_added", "article_saved", "followed_user", "comment_added", "reaction_added"

    // Target entity (polymorphic)
    targetType: text("target_type").notNull(), // "board", "idea", "article", "tenant"
    targetId: text("target_id").notNull(),

    // Visibility
    isPublic: boolean("is_public").default(true).notNull(),

    // Extra context (JSON for flexibility)
    metadata: jsonb("metadata").default({}),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    actorIdx: index("activities_actor_idx").on(table.actorTenantId),
    targetIdx: index("activities_target_idx").on(table.targetType, table.targetId),
    createdIdx: index("activities_created_idx").on(table.createdAt),
  })
);

export const activitiesRelations = relations(activities, ({ one }) => ({
  actor: one(tenants, {
    fields: [activities.actorTenantId],
    references: [tenants.id],
  }),
}));

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

// COMMENTS - Comments on boards, ideas, or articles
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Target entity (polymorphic)
    targetType: text("target_type").notNull(), // "board", "idea", "article"
    targetId: text("target_id").notNull(), // UUID for board/idea, slug for article

    // Content
    content: text("content").notNull(),

    // Threading
    parentId: uuid("parent_id"), // For replies

    // Moderation
    isHidden: boolean("is_hidden").default(false).notNull(),
    reportCount: integer("report_count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("comments_tenant_idx").on(table.tenantId),
    targetIdx: index("comments_target_idx").on(table.targetType, table.targetId),
    parentIdx: index("comments_parent_idx").on(table.parentId),
  })
);

export const commentsRelations = relations(comments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [comments.tenantId],
    references: [tenants.id],
  }),
}));

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

// REACTIONS - Like/heart reactions
export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Target entity (polymorphic)
    targetType: text("target_type").notNull(), // "board", "idea", "article", "comment"
    targetId: text("target_id").notNull(),

    // Reaction type (for future expansion)
    type: text("type").notNull().default("heart"), // "heart", "inspire", "love"

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one reaction per tenant per target per type
    tenantTargetIdx: uniqueIndex("reactions_tenant_target_idx").on(
      table.tenantId,
      table.targetType,
      table.targetId,
      table.type
    ),
  })
);

export const reactionsRelations = relations(reactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [reactions.tenantId],
    references: [tenants.id],
  }),
}));

export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;

// CONVERSATIONS - Direct messaging between couples
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participant1Id: uuid("participant_1_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    participant2Id: uuid("participant_2_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    participant1Idx: index("conversations_participant1_idx").on(table.participant1Id),
    participant2Idx: index("conversations_participant2_idx").on(table.participant2Id),
  })
);

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  participant1: one(tenants, {
    fields: [conversations.participant1Id],
    references: [tenants.id],
    relationName: "participant1",
  }),
  participant2: one(tenants, {
    fields: [conversations.participant2Id],
    references: [tenants.id],
    relationName: "participant2",
  }),
  messages: many(messages),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

// MESSAGES - Individual messages in conversations
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderTenantId: uuid("sender_tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    // Message type (for attachments)
    messageType: text("message_type").default("text"), // "text" | "image" | "attachment"
    attachmentUrl: text("attachment_url"),
    attachmentType: text("attachment_type"), // MIME type
    attachmentName: text("attachment_name"),
    attachmentSize: integer("attachment_size"), // in bytes

    // Read status
    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("messages_conversation_idx").on(table.conversationId),
    senderIdx: index("messages_sender_idx").on(table.senderTenantId),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(tenants, {
    fields: [messages.senderTenantId],
    references: [tenants.id],
  }),
}));

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// VENDOR PROFILES - For vendor discovery
export const vendorProfiles = pgTable(
  "vendor_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Basic info
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    category: text("category").notNull(), // "photographer", "venue", "florist", "catering", etc.

    // Location
    city: text("city"),
    state: text("state"),
    region: text("region"),
    serviceArea: jsonb("service_area").default([]), // Array of regions/cities they serve

    // Contact
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    instagram: text("instagram"),

    // Profile content
    bio: text("bio"),
    description: text("description"),
    profileImage: text("profile_image"),
    coverImage: text("cover_image"),

    // Pricing
    priceRange: text("price_range"), // "$", "$$", "$$$", "$$$$"
    startingPrice: integer("starting_price"), // in cents

    // Portfolio
    portfolioImages: jsonb("portfolio_images").default([]), // Array of image URLs
    featuredBoardId: uuid("featured_board_id"), // Link to a showcase board

    // Stats
    reviewCount: integer("review_count").default(0),
    averageRating: integer("average_rating"), // 1-5 scaled to 10-50
    saveCount: integer("save_count").default(0),
    questionCount: integer("question_count").default(0),

    // Social stats
    followerCount: integer("follower_count").default(0).notNull(),
    postCount: integer("post_count").default(0).notNull(),
    showcaseCount: integer("showcase_count").default(0).notNull(),

    // Verification
    isVerified: boolean("is_verified").default(false).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),

    // Claimed by tenant (if vendor creates account)
    claimedByTenantId: uuid("claimed_by_tenant_id").references(() => tenants.id, {
      onDelete: "set null",
    }),
    claimStatus: text("claim_status").default("unclaimed"), // "unclaimed" | "pending" | "claimed"

    // Google Places integration
    googlePlaceId: text("google_place_id"),
    googleData: jsonb("google_data").default({}),
    googleDataUpdatedAt: timestamp("google_data_updated_at", { withTimezone: true }),

    // Profile quality
    profileCompleteness: integer("profile_completeness").default(0), // 0-100 score

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("vendor_profiles_slug_idx").on(table.slug),
    categoryIdx: index("vendor_profiles_category_idx").on(table.category),
    regionIdx: index("vendor_profiles_region_idx").on(table.state, table.city),
  })
);

export const vendorProfilesRelations = relations(vendorProfiles, ({ one, many }) => ({
  claimedBy: one(tenants, {
    fields: [vendorProfiles.claimedByTenantId],
    references: [tenants.id],
  }),
  saves: many(vendorSaves),
  reviews: many(vendorReviews),
  questions: many(vendorQuestions),
}));

export type VendorProfile = typeof vendorProfiles.$inferSelect;
export type NewVendorProfile = typeof vendorProfiles.$inferInsert;

// =============================================================================
// VENDOR CLAIM TOKENS - Email verification for vendor claiming
// =============================================================================
export const vendorClaimTokens = pgTable(
  "vendor_claim_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    email: text("email").notNull(), // Business email for verification
    token: text("token").notNull().unique(),
    status: text("status").notNull().default("pending"), // "pending" | "verified" | "approved" | "rejected"
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("vendor_claim_tokens_token_idx").on(table.token),
    vendorIdx: index("vendor_claim_tokens_vendor_idx").on(table.vendorId),
    statusIdx: index("vendor_claim_tokens_status_idx").on(table.status),
  })
);

export const vendorClaimTokensRelations = relations(vendorClaimTokens, ({ one }) => ({
  vendor: one(vendorProfiles, {
    fields: [vendorClaimTokens.vendorId],
    references: [vendorProfiles.id],
  }),
  reviewer: one(users, {
    fields: [vendorClaimTokens.reviewedBy],
    references: [users.id],
  }),
}));

export type VendorClaimToken = typeof vendorClaimTokens.$inferSelect;
export type NewVendorClaimToken = typeof vendorClaimTokens.$inferInsert;

// BOARD ARTICLES - Link articles to boards
export const boardArticles = pgTable(
  "board_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    articleSlug: text("article_slug").notNull(),

    // Custom notes for this save
    notes: text("notes"),

    position: integer("position").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    boardIdx: index("board_articles_board_idx").on(table.boardId),
    uniqueSaveIdx: uniqueIndex("board_articles_unique_idx").on(
      table.boardId,
      table.articleSlug
    ),
  })
);

export const boardArticlesRelations = relations(boardArticles, ({ one }) => ({
  board: one(boards, {
    fields: [boardArticles.boardId],
    references: [boards.id],
  }),
}));

export type BoardArticle = typeof boardArticles.$inferSelect;
export type NewBoardArticle = typeof boardArticles.$inferInsert;

// CONTENT REPORTS - For moderation
export const contentReports = pgTable("content_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterTenantId: uuid("reporter_tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),

  // Target
  targetType: text("target_type").notNull(), // "board", "idea", "comment", "message", "tenant"
  targetId: text("target_id").notNull(),

  reason: text("reason").notNull(), // "spam", "inappropriate", "harassment", "other"
  details: text("details"),

  // Resolution
  status: text("status").default("pending").notNull(), // "pending", "reviewed", "action_taken", "dismissed"
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(tenants, {
    fields: [contentReports.reporterTenantId],
    references: [tenants.id],
  }),
}));

export type ContentReport = typeof contentReports.$inferSelect;
export type NewContentReport = typeof contentReports.$inferInsert;

// USER BLOCKS - Block other users
export const userBlocks = pgTable(
  "user_blocks",
  {
    blockerTenantId: uuid("blocker_tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    blockedTenantId: uuid("blocked_tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.blockerTenantId, table.blockedTenantId] }),
  })
);

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(tenants, {
    fields: [userBlocks.blockerTenantId],
    references: [tenants.id],
    relationName: "blocker",
  }),
  blocked: one(tenants, {
    fields: [userBlocks.blockedTenantId],
    references: [tenants.id],
    relationName: "blocked",
  }),
}));

export type UserBlock = typeof userBlocks.$inferSelect;
export type NewUserBlock = typeof userBlocks.$inferInsert;

// VENDOR SAVES - Track saved/favorited vendors
export const vendorSaves = pgTable(
  "vendor_saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    notes: text("notes"),
    savedAt: timestamp("saved_at").defaultNow().notNull(),
    // Status tracking
    status: text("status").default("saved"), // saved, researching, contacted, meeting_scheduled, booked, passed
    priority: integer("priority").default(0), // 1-5 ranking
    // Booking tracking
    price: integer("price"), // in cents
    depositPaid: boolean("deposit_paid").default(false),
    contractSigned: boolean("contract_signed").default(false),
    // Timestamps
    lastContactedAt: timestamp("last_contacted_at"),
    bookedAt: timestamp("booked_at"),
  },
  (table) => ({
    tenantVendorIdx: uniqueIndex("vendor_saves_tenant_vendor_idx").on(
      table.tenantId,
      table.vendorId
    ),
    tenantIdx: index("vendor_saves_tenant_idx").on(table.tenantId),
    vendorIdx: index("vendor_saves_vendor_idx").on(table.vendorId),
  })
);

export const vendorSavesRelations = relations(vendorSaves, ({ one }) => ({
  tenant: one(tenants, {
    fields: [vendorSaves.tenantId],
    references: [tenants.id],
  }),
  vendor: one(vendorProfiles, {
    fields: [vendorSaves.vendorId],
    references: [vendorProfiles.id],
  }),
}));

export type VendorSave = typeof vendorSaves.$inferSelect;
export type NewVendorSave = typeof vendorSaves.$inferInsert;

// CUSTOM VENDORS - Vendors not in the directory (manually added by couples)
export const customVendors = pgTable(
  "custom_vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    // Vendor info
    category: text("category").notNull(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    website: text("website"),
    notes: text("notes"),
    // Status tracking (same as vendorSaves)
    status: text("status").default("researching"), // researching, contacted, meeting_scheduled, booked, passed
    priority: integer("priority").default(0),
    // Booking tracking
    price: integer("price"), // in cents
    depositPaid: boolean("deposit_paid").default(false),
    contractSigned: boolean("contract_signed").default(false),
    // Timestamps
    lastContactedAt: timestamp("last_contacted_at"),
    bookedAt: timestamp("booked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("custom_vendors_tenant_idx").on(table.tenantId),
    categoryIdx: index("custom_vendors_category_idx").on(table.category),
  })
);

export const customVendorsRelations = relations(customVendors, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customVendors.tenantId],
    references: [tenants.id],
  }),
}));

export type CustomVendor = typeof customVendors.$inferSelect;
export type NewCustomVendor = typeof customVendors.$inferInsert;

// VENDOR REQUESTS - Track requested vendors to add to directory
export const vendorRequests = pgTable(
  "vendor_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Who requested it
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "set null" }),
    // Vendor info
    vendorName: text("vendor_name").notNull(),
    category: text("category").notNull(),
    city: text("city"),
    state: text("state"),
    website: text("website"),
    notes: text("notes"),
    // Search context
    searchQuery: text("search_query"), // What they searched for
    // Status tracking
    status: text("status").default("pending"), // pending, contacted, added, declined
    adminNotes: text("admin_notes"),
    // If we added them, link to the profile
    vendorProfileId: uuid("vendor_profile_id")
      .references(() => vendorProfiles.id, { onDelete: "set null" }),
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    statusIdx: index("vendor_requests_status_idx").on(table.status),
    createdAtIdx: index("vendor_requests_created_at_idx").on(table.createdAt),
  })
);

export const vendorRequestsRelations = relations(vendorRequests, ({ one }) => ({
  tenant: one(tenants, {
    fields: [vendorRequests.tenantId],
    references: [tenants.id],
  }),
  vendorProfile: one(vendorProfiles, {
    fields: [vendorRequests.vendorProfileId],
    references: [vendorProfiles.id],
  }),
}));

export type VendorRequest = typeof vendorRequests.$inferSelect;
export type NewVendorRequest = typeof vendorRequests.$inferInsert;

// VENDOR REVIEWS - Reviews and ratings for vendors
export const vendorReviews = pgTable(
  "vendor_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Review content
    rating: integer("rating").notNull(), // 1-5
    title: text("title"),
    content: text("content"),

    // Service details
    serviceDate: timestamp("service_date", { withTimezone: true }),

    // Moderation
    isHidden: boolean("is_hidden").default(false).notNull(),
    reportCount: integer("report_count").default(0).notNull(),

    // Helpful votes
    helpfulCount: integer("helpful_count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index("vendor_reviews_vendor_idx").on(table.vendorId),
    tenantIdx: index("vendor_reviews_tenant_idx").on(table.tenantId),
    // One review per tenant per vendor
    tenantVendorIdx: uniqueIndex("vendor_reviews_tenant_vendor_idx").on(
      table.tenantId,
      table.vendorId
    ),
  })
);

export const vendorReviewsRelations = relations(vendorReviews, ({ one }) => ({
  vendor: one(vendorProfiles, {
    fields: [vendorReviews.vendorId],
    references: [vendorProfiles.id],
  }),
  tenant: one(tenants, {
    fields: [vendorReviews.tenantId],
    references: [tenants.id],
  }),
}));

export type VendorReview = typeof vendorReviews.$inferSelect;
export type NewVendorReview = typeof vendorReviews.$inferInsert;

// VENDOR QUESTIONS - Q&A for vendors
export const vendorQuestions = pgTable(
  "vendor_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Question content
    question: text("question").notNull(),

    // Answer (filled by vendor)
    answer: text("answer"),
    answeredByTenantId: uuid("answered_by_tenant_id").references(() => tenants.id),
    answeredAt: timestamp("answered_at", { withTimezone: true }),

    // Moderation
    isHidden: boolean("is_hidden").default(false).notNull(),

    // Engagement
    helpfulCount: integer("helpful_count").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index("vendor_questions_vendor_idx").on(table.vendorId),
    tenantIdx: index("vendor_questions_tenant_idx").on(table.tenantId),
  })
);

export const vendorQuestionsRelations = relations(vendorQuestions, ({ one }) => ({
  vendor: one(vendorProfiles, {
    fields: [vendorQuestions.vendorId],
    references: [vendorProfiles.id],
  }),
  tenant: one(tenants, {
    fields: [vendorQuestions.tenantId],
    references: [tenants.id],
  }),
  answeredBy: one(tenants, {
    fields: [vendorQuestions.answeredByTenantId],
    references: [tenants.id],
  }),
}));

export type VendorQuestion = typeof vendorQuestions.$inferSelect;
export type NewVendorQuestion = typeof vendorQuestions.$inferInsert;

// ============================================================================
// NOTIFICATIONS - System notifications for social features
// ============================================================================
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientTenantId: uuid("recipient_tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Notification type
    type: text("type").notNull(), // "new_follower" | "reaction" | "comment" | "message" | "board_shared" | "collaborator_invite" | "vendor_post" | "showcase_tag"

    // Who triggered this notification (optional - system notifications have no actor)
    actorTenantId: uuid("actor_tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

    // Target entity (polymorphic)
    targetType: text("target_type"), // "board" | "idea" | "conversation" | "vendor_post" | "showcase" | null
    targetId: text("target_id"),

    // Additional context
    metadata: jsonb("metadata").default({}),

    // Read status
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    recipientIdx: index("notifications_recipient_idx").on(table.recipientTenantId),
    readIdx: index("notifications_read_idx").on(table.recipientTenantId, table.isRead),
    createdIdx: index("notifications_created_idx").on(table.createdAt),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(tenants, {
    fields: [notifications.recipientTenantId],
    references: [tenants.id],
    relationName: "notificationRecipient",
  }),
  actor: one(tenants, {
    fields: [notifications.actorTenantId],
    references: [tenants.id],
    relationName: "notificationActor",
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// ============================================================================
// TRENDING SNAPSHOTS - Cached trending content
// ============================================================================
export const trendingSnapshots = pgTable(
  "trending_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // What type of trending content
    type: text("type").notNull(), // "boards" | "ideas" | "showcases"

    // Scope
    region: text("region"), // NULL for global

    // Cached trending data
    data: jsonb("data").notNull().default([]),

    // Cache management
    computedAt: timestamp("computed_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    typeRegionIdx: uniqueIndex("trending_snapshots_type_region_idx").on(table.type, table.region),
    expiresIdx: index("trending_snapshots_expires_idx").on(table.expiresAt),
  })
);

export type TrendingSnapshot = typeof trendingSnapshots.$inferSelect;
export type NewTrendingSnapshot = typeof trendingSnapshots.$inferInsert;

// ============================================================================
// BOARD COLLABORATORS - Collaborative boards
// ============================================================================
export const boardCollaborators = pgTable(
  "board_collaborators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Permission level
    permission: text("permission").notNull(), // "owner" | "editor" | "viewer"

    // Invitation tracking
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // "pending" | "accepted" | "declined"
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (table) => ({
    boardIdx: index("board_collaborators_board_idx").on(table.boardId),
    tenantIdx: index("board_collaborators_tenant_idx").on(table.tenantId),
    boardTenantIdx: uniqueIndex("board_collaborators_board_tenant_idx").on(
      table.boardId,
      table.tenantId
    ),
  })
);

export const boardCollaboratorsRelations = relations(boardCollaborators, ({ one }) => ({
  board: one(boards, {
    fields: [boardCollaborators.boardId],
    references: [boards.id],
  }),
  tenant: one(tenants, {
    fields: [boardCollaborators.tenantId],
    references: [tenants.id],
  }),
  inviter: one(tenants, {
    fields: [boardCollaborators.invitedBy],
    references: [tenants.id],
  }),
}));

export type BoardCollaborator = typeof boardCollaborators.$inferSelect;
export type NewBoardCollaborator = typeof boardCollaborators.$inferInsert;

// ============================================================================
// WEDDING PARTY MEMBERS - Wedding party management
// ============================================================================
export const weddingPartyMembers = pgTable(
  "wedding_party_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Member info
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),

    // Role
    role: text("role").notNull(), // "bridesmaid" | "groomsman" | "maid_of_honor" | "best_man" | "flower_girl" | "ring_bearer" | "officiant" | "other"
    side: text("side").notNull().default("both"), // "bride" | "groom" | "both"

    // If they have an account, link it
    linkedTenantId: uuid("linked_tenant_id").references(() => tenants.id, { onDelete: "set null" }),

    // Invitation status
    invitationStatus: text("invitation_status").default("not_invited"), // "not_invited" | "invited" | "accepted" | "declined"
    invitationToken: text("invitation_token").unique(),
    invitedAt: timestamp("invited_at", { withTimezone: true }),

    // Permissions
    canViewPlanning: boolean("can_view_planning").default(false).notNull(),
    canViewBudget: boolean("can_view_budget").default(false).notNull(),
    canEditPartyBoards: boolean("can_edit_party_boards").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("wedding_party_members_tenant_idx").on(table.tenantId),
    linkedTenantIdx: index("wedding_party_members_linked_idx").on(table.linkedTenantId),
    tokenIdx: uniqueIndex("wedding_party_members_token_idx").on(table.invitationToken),
  })
);

export const weddingPartyMembersRelations = relations(weddingPartyMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [weddingPartyMembers.tenantId],
    references: [tenants.id],
  }),
  linkedTenant: one(tenants, {
    fields: [weddingPartyMembers.linkedTenantId],
    references: [tenants.id],
  }),
}));

export type WeddingPartyMember = typeof weddingPartyMembers.$inferSelect;
export type NewWeddingPartyMember = typeof weddingPartyMembers.$inferInsert;

// ============================================================================
// BOARD SHARES - Public sharing links for boards
// ============================================================================
export const boardShares = pgTable(
  "board_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),

    // Share type
    shareType: text("share_type").notNull(), // "link" | "email" | "vendor"

    // Unique share token for URL
    shareToken: text("share_token").notNull().unique(),

    // Permission level for viewers
    permission: text("permission").default("view"), // "view" | "comment"

    // Optional expiration
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Analytics
    viewCount: integer("view_count").default(0).notNull(),

    // Who created this share
    createdBy: uuid("created_by")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    boardIdx: index("board_shares_board_idx").on(table.boardId),
    tokenIdx: uniqueIndex("board_shares_token_idx").on(table.shareToken),
  })
);

export const boardSharesRelations = relations(boardShares, ({ one }) => ({
  board: one(boards, {
    fields: [boardShares.boardId],
    references: [boards.id],
  }),
  creator: one(tenants, {
    fields: [boardShares.createdBy],
    references: [tenants.id],
  }),
}));

export type BoardShare = typeof boardShares.$inferSelect;
export type NewBoardShare = typeof boardShares.$inferInsert;

// ============================================================================
// VENDOR FOLLOWS - Follow vendors for updates
// ============================================================================
export const vendorFollows = pgTable(
  "vendor_follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantVendorIdx: uniqueIndex("vendor_follows_tenant_vendor_idx").on(
      table.tenantId,
      table.vendorId
    ),
    tenantIdx: index("vendor_follows_tenant_idx").on(table.tenantId),
    vendorIdx: index("vendor_follows_vendor_idx").on(table.vendorId),
  })
);

export const vendorFollowsRelations = relations(vendorFollows, ({ one }) => ({
  tenant: one(tenants, {
    fields: [vendorFollows.tenantId],
    references: [tenants.id],
  }),
  vendor: one(vendorProfiles, {
    fields: [vendorFollows.vendorId],
    references: [vendorProfiles.id],
  }),
}));

export type VendorFollow = typeof vendorFollows.$inferSelect;
export type NewVendorFollow = typeof vendorFollows.$inferInsert;

// ============================================================================
// VENDOR POSTS - Posts/updates from vendors
// ============================================================================
export const vendorPosts = pgTable(
  "vendor_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    authorTenantId: uuid("author_tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Post type
    type: text("type").notNull(), // "update" | "portfolio" | "special_offer" | "tip"

    // Content
    title: text("title"),
    content: text("content").notNull(),
    images: jsonb("images").default([]),

    // Engagement
    reactionCount: integer("reaction_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),

    // Visibility
    isPublished: boolean("is_published").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index("vendor_posts_vendor_idx").on(table.vendorId),
    createdIdx: index("vendor_posts_created_idx").on(table.createdAt),
  })
);

export const vendorPostsRelations = relations(vendorPosts, ({ one }) => ({
  vendor: one(vendorProfiles, {
    fields: [vendorPosts.vendorId],
    references: [vendorProfiles.id],
  }),
  author: one(tenants, {
    fields: [vendorPosts.authorTenantId],
    references: [tenants.id],
  }),
}));

export type VendorPost = typeof vendorPosts.$inferSelect;
export type NewVendorPost = typeof vendorPosts.$inferInsert;

// ============================================================================
// WEDDING SHOWCASES - Real wedding showcases from vendors
// ============================================================================
export const weddingShowcases = pgTable(
  "wedding_showcases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendorProfiles.id, { onDelete: "cascade" }),
    authorTenantId: uuid("author_tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Tagged couple (optional)
    coupleTenantId: uuid("couple_tenant_id").references(() => tenants.id, { onDelete: "set null" }),
    coupleApproved: boolean("couple_approved").default(false).notNull(),

    // Content
    title: text("title").notNull(),
    description: text("description"),
    weddingDate: timestamp("wedding_date", { withTimezone: true }),
    location: text("location"),

    // Images
    images: jsonb("images").default([]),
    featuredImage: text("featured_image"),

    // Vendor credits
    vendorList: jsonb("vendor_list").default([]), // [{ vendorId, role, name }]

    // Engagement
    viewCount: integer("view_count").default(0).notNull(),
    reactionCount: integer("reaction_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),

    // Visibility
    isPublished: boolean("is_published").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    vendorIdx: index("wedding_showcases_vendor_idx").on(table.vendorId),
    coupleIdx: index("wedding_showcases_couple_idx").on(table.coupleTenantId),
    createdIdx: index("wedding_showcases_created_idx").on(table.createdAt),
  })
);

export const weddingShowcasesRelations = relations(weddingShowcases, ({ one }) => ({
  vendor: one(vendorProfiles, {
    fields: [weddingShowcases.vendorId],
    references: [vendorProfiles.id],
  }),
  author: one(tenants, {
    fields: [weddingShowcases.authorTenantId],
    references: [tenants.id],
  }),
  couple: one(tenants, {
    fields: [weddingShowcases.coupleTenantId],
    references: [tenants.id],
  }),
}));

export type WeddingShowcase = typeof weddingShowcases.$inferSelect;
export type NewWeddingShowcase = typeof weddingShowcases.$inferInsert;

// ============================================================================
// SANITY HISTORY - Track stress/sanity snapshots over time
// ============================================================================
export const sanityHistory = pgTable(
  "sanity_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    // Score snapshot
    sanityScore: integer("sanity_score").notNull(), // 0-100 (100 = calm)
    inferredFamilyFriction: integer("inferred_family_friction"), // 0-10

    // Signal breakdown (StressSignals object)
    signals: jsonb("signals"),

    // What triggered this snapshot
    triggerType: text("trigger_type").notNull(), // "message" | "daily" | "activity_spike" | "milestone"

    // Primary stressors at this point
    primaryStressors: jsonb("primary_stressors").default([]),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("sanity_history_tenant_idx").on(table.tenantId),
    createdIdx: index("sanity_history_created_idx").on(table.createdAt),
  })
);

export const sanityHistoryRelations = relations(sanityHistory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [sanityHistory.tenantId],
    references: [tenants.id],
  }),
}));

export type SanityHistory = typeof sanityHistory.$inferSelect;
export type NewSanityHistory = typeof sanityHistory.$inferInsert;
