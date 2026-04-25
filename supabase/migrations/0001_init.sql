-- bight CRM: initial schema
-- Seven tables plus a small staff allowlist table used by RLS.

create extension if not exists "pgcrypto";

-- Staff allowlist. Used by RLS to grant full access to Harvey.
create table if not exists public.staff_users (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Niches being worked on.
create table if not exists public.niches (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  slug text not null,
  status text not null default 'queue' check (status in ('queue', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  unique (city, slug)
);

-- One row per business scraped.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  niche_id uuid references public.niches(id) on delete set null,

  google_place_id text unique not null,
  folder_slug text not null,

  name text not null,
  category text,
  phone text,
  email text,
  website text,
  has_website boolean default false,

  full_address text,
  suburb text,
  postal_code text,
  latitude double precision,
  longitude double precision,

  google_rating numeric(2,1),
  review_count integer,
  google_description text,
  working_hours jsonb,

  brand_colors jsonb,
  logo_url text,
  screenshot_url text,
  mobile_screenshot_url text,

  social_links jsonb,
  site_text_snippet text,
  site_issues jsonb,

  google_photos jsonb,
  google_place_url text,

  pipeline_stage text not null default 'scraped' check (pipeline_stage in (
    'scraped', 'site_built', 'reviewed', 'emailed', 'replied', 'signed_up'
  )),
  tags text[] default '{}',

  scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_niche_idx on public.leads(niche_id);
create index if not exists leads_stage_idx on public.leads(pipeline_stage);

-- Demo sites built for leads.
create table if not exists public.websites (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','built','reviewed','sent','claimed')),
  demo_url text,
  live_url text,
  template_used text,
  built_at timestamptz,
  sent_at timestamptz,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists websites_lead_idx on public.websites(lead_id);

-- Review notes (was review.md on disk).
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  design_angle text,
  missing_data text,
  booking_fallback text,
  cold_email_draft text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_lead_idx on public.reviews(lead_id);

-- Cold outreach log.
create table if not exists public.outreach (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  subject text,
  body text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists outreach_lead_idx on public.outreach(lead_id);

-- Client login records. Only filled when a lead claims their site.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.leads(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  contact_name text,
  contact_email text not null,
  signed_up_at timestamptz,
  plan text not null default 'free' check (plan in ('free','paid','cancelled')),
  stripe_link text,
  created_at timestamptz not null default now()
);

create index if not exists clients_auth_user_idx on public.clients(auth_user_id);

-- Notes on a lead. Can also be used for client-facing messages when author_role='client'.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  body text not null,
  author_role text not null default 'staff' check (author_role in ('staff','client')),
  author_user_id uuid references auth.users(id) on delete set null,
  visible_to_client boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notes_lead_idx on public.notes(lead_id);

-- Reminders (extra feature).
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  body text not null,
  remind_at timestamptz not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- Activity timeline (extra feature).
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  kind text not null,
  summary text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_lead_idx on public.activity(lead_id);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists websites_updated_at on public.websites;
create trigger websites_updated_at before update on public.websites
  for each row execute function public.set_updated_at();
