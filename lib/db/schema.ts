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
    displayName: text("display_name").notNull(), // "Sarah & Gabe"
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
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    role: text("role").notNull().default("member"), // "owner" | "member"
    mustChangePassword: boolean("must_change_password").default(true).notNull(),
    emailVerified: timestamp("email_verified"),
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
