import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  numeric,
  doublePrecision,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// -----------------------------------------------------------------------------
// Auth tables (Auth.js shape)
// -----------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: text("name"),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("client"), // 'staff' | 'client'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// -----------------------------------------------------------------------------
// CRM tables
// -----------------------------------------------------------------------------

export const niches = pgTable(
  "niches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    city: text("city").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("queue"), // queue | in_progress | done
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("niches_city_slug_unique").on(t.city, t.slug)]
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nicheId: uuid("niche_id").references(() => niches.id, { onDelete: "set null" }),

    googlePlaceId: text("google_place_id").notNull().unique(),
    folderSlug: text("folder_slug").notNull(),

    name: text("name").notNull(),
    category: text("category"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    hasWebsite: boolean("has_website").default(false),

    fullAddress: text("full_address"),
    suburb: text("suburb"),
    postalCode: text("postal_code"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    googleRating: numeric("google_rating", { precision: 2, scale: 1 }),
    reviewCount: integer("review_count"),
    googleDescription: text("google_description"),
    workingHours: jsonb("working_hours"),

    brandColors: jsonb("brand_colors"),
    logoUrl: text("logo_url"),
    screenshotUrl: text("screenshot_url"),
    mobileScreenshotUrl: text("mobile_screenshot_url"),

    socialLinks: jsonb("social_links"),
    siteTextSnippet: text("site_text_snippet"),
    siteIssues: jsonb("site_issues"),

    googlePhotos: jsonb("google_photos"),
    googlePlaceUrl: text("google_place_url"),

    pipelineStage: text("pipeline_stage").notNull().default("scraped"),
    // valid stages: scraped | site_built | reviewed | emailed | replied | signed_up
    tags: text("tags").array().default(sql`ARRAY[]::text[]`),

    scrapedAt: timestamp("scraped_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("leads_niche_idx").on(t.nicheId),
    index("leads_stage_idx").on(t.pipelineStage),
  ]
);

export const websites = pgTable(
  "websites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("draft"),
    // valid statuses: draft | built | reviewed | sent | claimed
    demoUrl: text("demo_url"),
    liveUrl: text("live_url"),
    templateUsed: text("template_used"),
    builtAt: timestamp("built_at"),
    sentAt: timestamp("sent_at"),
    claimedAt: timestamp("claimed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("websites_lead_idx").on(t.leadId)]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    designAngle: text("design_angle"),
    missingData: text("missing_data"),
    bookingFallback: text("booking_fallback"),
    coldEmailDraft: text("cold_email_draft"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("reviews_lead_idx").on(t.leadId)]
);

export const outreach = pgTable(
  "outreach",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    subject: text("subject"),
    body: text("body"),
    sentAt: timestamp("sent_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    repliedAt: timestamp("replied_at"),
    bounced: boolean("bounced").default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("outreach_lead_idx").on(t.leadId)]
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .unique()
      .references(() => leads.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .unique()
      .references(() => users.id, { onDelete: "set null" }),
    contactName: text("contact_name"),
    contactEmail: text("contact_email").notNull(),
    signedUpAt: timestamp("signed_up_at"),
    plan: text("plan").notNull().default("free"), // free | paid | cancelled
    stripeLink: text("stripe_link"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("clients_user_idx").on(t.userId)]
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    authorRole: text("author_role").notNull().default("staff"), // staff | client
    authorUserId: uuid("author_user_id").references(() => users.id, { onDelete: "set null" }),
    visibleToClient: boolean("visible_to_client").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notes_lead_idx").on(t.leadId)]
);

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  remindAt: timestamp("remind_at").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activity = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    summary: text("summary").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("activity_lead_idx").on(t.leadId)]
);

// -----------------------------------------------------------------------------
// Relations
// -----------------------------------------------------------------------------

export const leadsRelations = relations(leads, ({ one, many }) => ({
  niche: one(niches, { fields: [leads.nicheId], references: [niches.id] }),
  websites: many(websites),
  reviews: many(reviews),
  outreach: many(outreach),
  notes: many(notes),
  client: one(clients, { fields: [leads.id], references: [clients.leadId] }),
  activity: many(activity),
}));

export const clientsRelations = relations(clients, ({ one }) => ({
  lead: one(leads, { fields: [clients.leadId], references: [leads.id] }),
  user: one(users, { fields: [clients.userId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  client: one(clients, { fields: [users.id], references: [clients.userId] }),
}));

// -----------------------------------------------------------------------------
// Inferred types for app code
// -----------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type Niche = typeof niches.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Website = typeof websites.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Outreach = typeof outreach.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Activity = typeof activity.$inferSelect;
