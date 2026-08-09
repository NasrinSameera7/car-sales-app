# Using Supabase as the database

Supabase gives you a managed Postgres database plus a dashboard (Table
Editor, SQL editor, logs) to view and manage your data directly — it's a
great fit here since the backend already speaks plain Postgres via Prisma.

## 1. Create the project

1. Go to https://supabase.com, create a free account, and click **New project**.
2. Pick an org, name it (e.g. `plateswap`), set a **database password** —
   save this somewhere, you'll need it in the connection strings — and
   choose a region close to your users (e.g. Mumbai/`ap-south-1` for India).
3. Wait ~2 minutes for it to provision.

## 2. Get your connection strings

In the Supabase dashboard: **Project Settings → Database → Connection string**.
You need **two** strings (Supabase runs a connection pooler in front of
Postgres, and Prisma migrations need to bypass it):

- **Transaction pooler** (port `6543`) → this is your `DATABASE_URL`
- **Direct connection** (port `5432`) → this is your `DIRECT_URL`

Both use the same password — the one you set in step 1. Paste both into
`backend/.env` (copy `backend/.env.example` first if you haven't).

```
DATABASE_URL="postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-....pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:YOUR-PASSWORD@aws-0-....pooler.supabase.com:5432/postgres"
```

## 3. Create the tables

From `backend/`:

```bash
npm install                       # picks up the directUrl-aware Prisma schema
npx prisma migrate dev --name init
```

This creates every table (`User`, `CarListing`, `Photo`, `Message`,
`Conversation`, `Wishlist`, `Friendship`, `Purchase`) directly in your
Supabase project. Open **Table Editor** in the Supabase dashboard and
you'll see them all — you can browse, filter, and hand-edit rows there any
time.

For production deploys later (Render/Railway), use `npx prisma migrate
deploy` instead of `migrate dev` — same idea, no interactive prompts.

## 4. A note on Row Level Security (RLS)

Supabase's own client libraries rely on RLS policies for authorization, but
this app doesn't use the Supabase client for the database — the Express
backend talks to Postgres directly through Prisma, using the full-access
database credentials, and does its own authorization (JWT + ownership
checks in each route, e.g. "only the seller can mark their car sold").

That means:
- You **don't** need to write RLS policies for this app to work.
- If you want an extra safety net in case those credentials ever leak, you
  can enable RLS with a "deny all" default policy on each table — the
  backend will be unaffected since it connects with elevated Postgres
  privileges, not through Supabase's public API.

## 5. Optional: move photo storage to Supabase Storage too

Right now uploaded car photos are saved to `backend/uploads/` on local
disk, which most free hosts wipe on redeploy (see main README). Since
you're already on Supabase, its Storage product solves this in one place:

1. In the dashboard: **Storage → New bucket**, name it `car-photos`, make
   it **public** (so photo URLs work directly in `<img>` tags).
2. **Project Settings → API** → copy the **Project URL** and the
   **service_role key** (not the anon key — this one bypasses RLS, so keep
   it server-side only, never in frontend code).
3. Add these to `backend/.env`:
   ```
   SUPABASE_URL="https://xxxx.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   SUPABASE_BUCKET="car-photos"
   ```
4. Ask me and I'll swap `backend/src/utils/upload.js` from disk storage to
   Supabase Storage — it's a small, contained change since every other
   file just reads `photo.url` and doesn't care where it points.

## 6. Managing data day-to-day

- **Table Editor** — browse/edit rows like a spreadsheet (e.g. manually
  mark a user as a dealer, delete a bad listing).
- **SQL Editor** — run raw queries, e.g.:
  ```sql
  select count(*) from "CarListing" where status = 'AVAILABLE';
  ```
- **Database → Backups** — Supabase takes daily backups automatically on
  paid tiers; on the free tier, consider periodically running
  `pg_dump` yourself if this becomes a real production app.
