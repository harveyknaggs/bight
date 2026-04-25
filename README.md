# bight

Rapid Refresh CRM plus a small client portal.

Internal tool for Harvey. Staff (Harvey) sees every lead, every demo site, and runs the pipeline.
Clients log in and only see their own demo site.

## What is in here (so far)

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- shadcn/ui for components
- Supabase (Postgres, Auth, Storage) wiring ready
- SQL migrations with Row Level Security so clients never see each other
- Magic-link login (one-time email code, no passwords)

## Data model (core tables)

See `supabase/migrations/0001_init.sql`.

- `niches` which niches you are working on
- `leads` every business scraped
- `websites` demo sites built
- `reviews` review notes per lead
- `outreach` cold emails sent
- `clients` once a lead claims their site
- `notes` free-form notes and client messages

Plus `staff_users`, `reminders`, `activity` for extras.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in Supabase keys
npm run dev
```

Visit http://localhost:3000 and you should hit the login page.

## Database setup

See `supabase/README.md` for the full walk-through. Short version:

1. Create a Supabase project.
2. Paste each file in `supabase/migrations/` into the SQL editor, in order.
3. Sign in to the app once, then add yourself to `staff_users` with SQL.

## Repo

https://github.com/harveyknaggs/bight
