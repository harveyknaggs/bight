ALTER TABLE "niches" ADD COLUMN "top_demo_url" text;--> statement-breakpoint
ALTER TABLE "niches" ADD COLUMN "top_demo_stage" text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "niches" ADD COLUMN "top_demo_design_angle" text;--> statement-breakpoint
ALTER TABLE "niches" ADD COLUMN "top_demo_review_notes" text;--> statement-breakpoint
ALTER TABLE "niches" ADD COLUMN "top_demo_built_at" timestamp;--> statement-breakpoint
ALTER TABLE "niches" ADD COLUMN "top_demo_reviewed_at" timestamp;