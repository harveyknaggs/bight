// Hand-written DB types for now. Regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/db.ts
// once the Supabase project exists.

export type PipelineStage =
  | "scraped"
  | "site_built"
  | "reviewed"
  | "emailed"
  | "replied"
  | "signed_up";

export type WebsiteStatus = "draft" | "built" | "reviewed" | "sent" | "claimed";

export type NicheStatus = "queue" | "in_progress" | "done";

export type ClientPlan = "free" | "paid" | "cancelled";

export type Niche = {
  id: string;
  city: string;
  slug: string;
  status: NicheStatus;
  created_at: string;
};

export type Lead = {
  id: string;
  niche_id: string | null;
  google_place_id: string;
  folder_slug: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  has_website: boolean;
  full_address: string | null;
  suburb: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  google_rating: number | null;
  review_count: number | null;
  google_description: string | null;
  working_hours: unknown;
  brand_colors: unknown;
  logo_url: string | null;
  screenshot_url: string | null;
  mobile_screenshot_url: string | null;
  social_links: unknown;
  site_text_snippet: string | null;
  site_issues: unknown;
  google_photos: unknown;
  google_place_url: string | null;
  pipeline_stage: PipelineStage;
  tags: string[];
  scraped_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Website = {
  id: string;
  lead_id: string;
  status: WebsiteStatus;
  demo_url: string | null;
  live_url: string | null;
  template_used: string | null;
  built_at: string | null;
  sent_at: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  lead_id: string;
  auth_user_id: string | null;
  contact_name: string | null;
  contact_email: string;
  signed_up_at: string | null;
  plan: ClientPlan;
  stripe_link: string | null;
  created_at: string;
};

export type Note = {
  id: string;
  lead_id: string;
  body: string;
  author_role: "staff" | "client";
  author_user_id: string | null;
  visible_to_client: boolean;
  created_at: string;
};
