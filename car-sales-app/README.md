# PlateSwap — Car Sales Marketplace

A full-stack web app where customers and dealers can list, browse, search,
and message each other about cars, without ever sharing a phone number.

**Stack:** React (Vite) frontend · Node/Express API · PostgreSQL (via Prisma) · JWT auth · photo uploads

## What's included

- **Accounts** — sign up / log in as a Customer or Dealer, JWT-based sessions
- **Logged-in sidebar** — Settings (reset password, edit profile), My posts &
  transactions, My wishlist, My friends, Inbox
- **Home page** — search bar (model, color, city), filters, and a feed of
  every available car from every dealer/customer, newest first
- **Post a car** — Year, Variant, Color, Fuel type, Photos, Insurance
  details, Km's run, No. of owners. No phone number field anywhere — buyers
  reach sellers through the built-in inbox instead
- **My posts & transactions** — cars you've listed, mark them sold to a
  specific buyer, and see everything you've sold and bought
- **Inbox** — one-to-one conversations per car, tied to your account
- **Wishlist** and **Friends** (search people, send/accept requests)

## Project layout

```
car-sales-app/
  backend/    Express API + Prisma schema
  frontend/   React (Vite) single-page app
  docker-compose.yml   local Postgres for development
```

## Run it locally

**Requirements:** Node.js 18+, and either Docker (for the bundled Postgres)
or your own Postgres connection string.

1. **Start a database.** Two options:
   - **Supabase (recommended — gives you a dashboard to view/manage data):**
     see [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for exact steps.
   - **Local Postgres via Docker** (no dashboard, just for quick local dev):
     ```bash
     docker compose up -d
     ```
     This gives you `postgresql://carsales:carsales@localhost:5432/carsales`
     — use it for both `DATABASE_URL` and `DIRECT_URL` in the next step.

2. **Backend:**
   ```bash
   cd backend
   cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET
   npm install
   npx prisma migrate dev --name init
   npm run dev                 # runs on http://localhost:4000
   ```

3. **Frontend** (in a second terminal):
   ```bash
   cd frontend
   npm install
   npm run dev                 # runs on http://localhost:5173
   ```

4. Open http://localhost:5173, sign up, and start posting cars. Uploaded
   photos are saved to `backend/uploads/` and served at `/uploads/...`.

## Deploying it for public use (≈15 minutes, free tier friendly)

This app is split into two deployable pieces, which is the standard,
low-cost way to host a Node + React app for a few hundred users.

### 1. Database — Supabase (free tier)
Follow [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) to create the project and
get your `DATABASE_URL` and `DIRECT_URL`. The free tier comfortably handles
200 users' worth of traffic, and you get a dashboard to browse/edit data
directly. (Railway or Neon work too, using the same `DATABASE_URL` — just
skip `DIRECT_URL` and remove that line from `prisma/schema.prisma` if so.)

### 2. Backend API — Render, Railway, or Fly.io
- Point the service at the `backend/` folder.
- Build command: `npm install && npx prisma generate`
- Start command: `npx prisma migrate deploy && npm start`
- Environment variables: `DATABASE_URL` (from step 1), `JWT_SECRET` (any
  long random string), `CORS_ORIGIN` (your frontend's URL, set after step 3).
- A `Dockerfile` is included in `backend/` if your host prefers Docker.
- **Photo storage note:** the app stores uploaded photos on local disk by
  default, which works, but most free hosts wipe local disk on every
  deploy/restart. For a small pilot this is often fine; for anything you
  expect to run long-term, either (a) enable your host's persistent disk
  add-on, or (b) swap `backend/src/utils/upload.js` to upload to a service
  like Cloudinary or an S3-compatible bucket — it's a small, isolated change
  since all other code just reads `photo.url`.

### 3. Frontend — Vercel or Netlify
- Point it at the `frontend/` folder.
- Build command: `npm install && npm run build`, output directory: `dist`.
- Environment variable: `VITE_API_URL` = your backend's deployed URL from
  step 2.
- Once deployed, go back to the backend's `CORS_ORIGIN` env var and set it
  to this frontend URL, then redeploy the backend.

That's it — you'll have a public URL you can share with real users.
Both Render's and Railway's free tiers, plus a free Postgres tier, are
sufficient for ~200 users making occasional requests; upgrade to a paid
tier only if traffic grows well beyond that.

## Notes on scale & production hardening

- Prisma + Postgres handles far more than 200 concurrent users out of the box.
- Passwords are hashed with bcrypt; sessions use JWTs (30-day expiry).
- For real production use, also consider: rate limiting on `/api/auth`,
  email verification, HTTPS (handled automatically by the hosts above),
  and moving photo storage off local disk (see note above).
