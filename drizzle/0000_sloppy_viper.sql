CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"summary" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"user_id" uuid,
	"contact_name" text,
	"contact_email" text NOT NULL,
	"signed_up_at" timestamp,
	"plan" text DEFAULT 'free' NOT NULL,
	"stripe_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_lead_id_unique" UNIQUE("lead_id"),
	CONSTRAINT "clients_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"niche_id" uuid,
	"google_place_id" text NOT NULL,
	"folder_slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"phone" text,
	"email" text,
	"website" text,
	"has_website" boolean DEFAULT false,
	"full_address" text,
	"suburb" text,
	"postal_code" text,
	"latitude" double precision,
	"longitude" double precision,
	"google_rating" numeric(2, 1),
	"review_count" integer,
	"google_description" text,
	"working_hours" jsonb,
	"brand_colors" jsonb,
	"logo_url" text,
	"screenshot_url" text,
	"mobile_screenshot_url" text,
	"social_links" jsonb,
	"site_text_snippet" text,
	"site_issues" jsonb,
	"google_photos" jsonb,
	"google_place_url" text,
	"pipeline_stage" text DEFAULT 'scraped' NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"scraped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_google_place_id_unique" UNIQUE("google_place_id")
);
--> statement-breakpoint
CREATE TABLE "niches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'queue' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"body" text NOT NULL,
	"author_role" text DEFAULT 'staff' NOT NULL,
	"author_user_id" uuid,
	"visible_to_client" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"subject" text,
	"body" text,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"replied_at" timestamp,
	"bounced" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid,
	"body" text NOT NULL,
	"remind_at" timestamp NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"design_angle" text,
	"missing_data" text,
	"booking_fallback" text,
	"cold_email_draft" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"name" text,
	"image" text,
	"role" text DEFAULT 'client' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"demo_url" text,
	"live_url" text,
	"template_used" text,
	"built_at" timestamp,
	"sent_at" timestamp,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_niche_id_niches_id_fk" FOREIGN KEY ("niche_id") REFERENCES "public"."niches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach" ADD CONSTRAINT "outreach_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "websites" ADD CONSTRAINT "websites_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_lead_idx" ON "activity" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "clients_user_idx" ON "clients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leads_niche_idx" ON "leads" USING btree ("niche_id");--> statement-breakpoint
CREATE INDEX "leads_stage_idx" ON "leads" USING btree ("pipeline_stage");--> statement-breakpoint
CREATE UNIQUE INDEX "niches_city_slug_unique" ON "niches" USING btree ("city","slug");--> statement-breakpoint
CREATE INDEX "notes_lead_idx" ON "notes" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "outreach_lead_idx" ON "outreach" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "reviews_lead_idx" ON "reviews" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "websites_lead_idx" ON "websites" USING btree ("lead_id");