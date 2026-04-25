# Supabase setup for bight

How to get the database running, in plain steps.

## 1. Create the Supabase project

1. Go to https://supabase.com and log in (or sign up, free tier).
2. Click **New Project**. Give it a name like `bight-crm`.
3. Pick a region close to New Zealand (Sydney is usually best).
4. Set a database password and save it somewhere safe.
5. Wait about 2 minutes for the project to spin up.

## 2. Run the migrations

Two options. Option A is easier for a first-timer.

### Option A: paste into the SQL editor

1. Open your Supabase project.
2. Click **SQL Editor** in the sidebar.
3. For each file in `supabase/migrations/` in order (0001, 0002, 0003):
   - Open the file, copy all of it.
   - Paste into a new SQL query.
   - Click **Run**.
4. Confirm the tables exist under **Database** > **Tables**.

### Option B: use the Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

## 3. Add yourself to staff_users

After you sign in to the app once (magic link to `hello@rapidrefresh.co`),
a row will be created in `auth.users` with your user id. Then in the SQL editor run:

```sql
insert into public.staff_users (auth_user_id, email)
select id, email from auth.users where email = 'hello@rapidrefresh.co';
```

This makes you a staff user, so you can see every table.

## 4. Copy the env values

In your project settings find:

- **Project URL** (looks like `https://xxxx.supabase.co`)
- **anon public key** (a long string starting with `eyJ...`)
- **service_role key** (another long string, keep secret)

Put them in `.env.local` in the bight project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Never commit `.env.local`. It is in `.gitignore` already.
