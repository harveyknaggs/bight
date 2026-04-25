# bight

Rapid Refresh CRM plus a small client portal.

Internal tool for Harvey. Staff (Harvey) sees every lead, every demo site, and runs the pipeline.
Clients log in and only see their own demo site.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- shadcn/ui for components
- Drizzle ORM
- Postgres on Railway
- Auth.js v5 with email + password (Credentials provider, bcrypt hashes, JWT sessions)
- Hosted on Railway

## Data model

See `src/db/schema.ts`.

Auth tables (Auth.js): `users`, `accounts`, `sessions`, `verification_tokens`.

CRM tables:
- `niches` which niches you are working on
- `leads` every business scraped
- `websites` demo sites built
- `reviews` review notes per lead
- `outreach` cold emails sent
- `clients` once a lead claims their site
- `notes` free-form notes and client messages
- `reminders`, `activity` extras

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Visit http://localhost:3000 and you should hit the login page.

To regenerate types after editing `src/db/schema.ts`:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## Access model

There is no Postgres-level Row Level Security. All access is enforced in the app code:

- `requireStaff()` in `src/lib/auth.ts` redirects non-staff away from `/dashboard`, `/leads`, etc.
- `requireClient()` redirects staff away from the portal.
- Every database query for client portal pages explicitly filters by `clients.userId = session.user.id`.
- Staff role is granted via the `STAFF_EMAILS` env var on signup.
- Sign-up is open today (anyone can create an account); we will lock it down in a later phase.

## Repo

https://github.com/harveyknaggs/bight
