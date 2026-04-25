-- bight CRM: Row Level Security policies
-- Two roles:
--   staff  - listed in staff_users table, can do anything.
--   client - has a matching clients row (auth_user_id = auth.uid()). Can only see their own data.

-- Helper: is the current user staff?
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists(
    select 1 from public.staff_users where auth_user_id = auth.uid()
  );
$$;

-- Helper: the lead_id this client is attached to, or null.
create or replace function public.current_client_lead_id()
returns uuid
language sql
security definer
stable
as $$
  select lead_id from public.clients where auth_user_id = auth.uid() limit 1;
$$;

-- Turn on RLS on every table.
alter table public.staff_users enable row level security;
alter table public.niches enable row level security;
alter table public.leads enable row level security;
alter table public.websites enable row level security;
alter table public.reviews enable row level security;
alter table public.outreach enable row level security;
alter table public.clients enable row level security;
alter table public.notes enable row level security;
alter table public.reminders enable row level security;
alter table public.activity enable row level security;

-- staff_users: only staff can read. Inserts happen via migration / service role.
drop policy if exists staff_users_staff_read on public.staff_users;
create policy staff_users_staff_read on public.staff_users
  for select using (public.is_staff());

-- niches: staff only.
drop policy if exists niches_staff_all on public.niches;
create policy niches_staff_all on public.niches
  for all using (public.is_staff()) with check (public.is_staff());

-- leads: staff all; clients read only their own lead.
drop policy if exists leads_staff_all on public.leads;
create policy leads_staff_all on public.leads
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists leads_client_read_own on public.leads;
create policy leads_client_read_own on public.leads
  for select using (id = public.current_client_lead_id());

-- websites: staff all; clients read only their own.
drop policy if exists websites_staff_all on public.websites;
create policy websites_staff_all on public.websites
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists websites_client_read_own on public.websites;
create policy websites_client_read_own on public.websites
  for select using (lead_id = public.current_client_lead_id());

-- reviews: staff only. Clients do not see internal review notes.
drop policy if exists reviews_staff_all on public.reviews;
create policy reviews_staff_all on public.reviews
  for all using (public.is_staff()) with check (public.is_staff());

-- outreach: staff only.
drop policy if exists outreach_staff_all on public.outreach;
create policy outreach_staff_all on public.outreach
  for all using (public.is_staff()) with check (public.is_staff());

-- clients: staff all; clients read their own row.
drop policy if exists clients_staff_all on public.clients;
create policy clients_staff_all on public.clients
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists clients_client_read_own on public.clients;
create policy clients_client_read_own on public.clients
  for select using (auth_user_id = auth.uid());

-- notes: staff all; clients can read notes on their lead that are marked visible_to_client,
-- and can insert notes on their own lead (for change requests / messages).
drop policy if exists notes_staff_all on public.notes;
create policy notes_staff_all on public.notes
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists notes_client_read_own on public.notes;
create policy notes_client_read_own on public.notes
  for select using (
    lead_id = public.current_client_lead_id()
    and visible_to_client = true
  );

drop policy if exists notes_client_insert_own on public.notes;
create policy notes_client_insert_own on public.notes
  for insert with check (
    lead_id = public.current_client_lead_id()
    and author_role = 'client'
    and author_user_id = auth.uid()
    and visible_to_client = true
  );

-- reminders: staff only.
drop policy if exists reminders_staff_all on public.reminders;
create policy reminders_staff_all on public.reminders
  for all using (public.is_staff()) with check (public.is_staff());

-- activity: staff only.
drop policy if exists activity_staff_all on public.activity;
create policy activity_staff_all on public.activity
  for all using (public.is_staff()) with check (public.is_staff());
