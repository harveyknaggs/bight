-- bight CRM: storage buckets
-- One private bucket for scraper assets (screenshots, logos). Accessed via signed URLs only.

insert into storage.buckets (id, name, public)
values ('lead-assets', 'lead-assets', false)
on conflict (id) do nothing;

-- Only staff can upload / manage objects. Clients never get direct object reads.
-- (Portal pages use signed URLs generated server-side.)
drop policy if exists lead_assets_staff_all on storage.objects;
create policy lead_assets_staff_all on storage.objects
  for all
  using (bucket_id = 'lead-assets' and public.is_staff())
  with check (bucket_id = 'lead-assets' and public.is_staff());
