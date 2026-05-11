# Admin setup — one-time

This walks you through getting the admin CRUD live: Neon database, env vars,
seeding, and deploying to Vercel.

## 1. Create a Neon project

1. Go to https://console.neon.tech.
2. New project. Pick a region close to your Vercel deployment.
3. **Connection details** → copy two strings:
   - **Pooled** connection string → `DATABASE_URL`
   - **Direct** connection string (toggle "Pooled" off) → `DIRECT_URL`

## 2. Generate admin password hash + auth secret

Pick a password (≥12 chars recommended). Then locally:

```bash
npm run auth:hash "your-actual-password"
```

It prints two lines:

```
ADMIN_PASSWORD_HASH="..."
AUTH_SECRET="..."
```

Save both. The plain password is never stored — memorise it.

## 3. Set env vars in two places

### Locally — `.env.local`

Copy `.env.example` to `.env.local`, paste the four values:

```
DATABASE_URL="..."        (Neon pooled)
DIRECT_URL="..."          (Neon direct)
ADMIN_PASSWORD_HASH="..."
AUTH_SECRET="..."
```

### On Vercel — project env vars

Settings → Environment Variables → add all four for **Production** + **Preview**.
Vercel auto-injects them at build/runtime.

## 4. Push schema + seed the database

From local:

```bash
npx prisma db push        # creates tables in Neon
npm run db:seed           # copies existing LOG_ENTRIES into the DB
```

After this, the database is the source of truth. `src/data/log.ts` becomes
seed-only — edits to it don't affect what's shown unless you re-run `db:seed`.

## 5. Verify locally

```bash
npm run dev
```

- Visit `localhost:3000/temporal` — entries load from Neon.
- Visit `localhost:3000/`. Type `login` in the search bar and press Enter.
- The ATTA in the title becomes clickable. Click it → password modal.
- Type the password → redirects to `/admin`.
- Edit an entry, save, refresh `/temporal` — change should be live.

## 6. Deploy

Push to `master` (which you've been doing). Vercel rebuilds. Since `build`
now runs `prisma generate && next build`, the client regenerates against the
current schema on every deploy.

If you ever change `prisma/schema.prisma`, you need to:

```bash
npx prisma db push        # apply schema changes to Neon
```

This is non-destructive for additive changes (new columns, new indexes).

## How to use the admin

- **/admin** — overview
- **/admin/log** — add/edit/delete log entries
  - **Brand** is a compound: "ATTA" + a dropdown (`logical` / `Laugical` / `CKORE`)
  - For CKORE entries, a Spotify URL field appears. When set, the song's
    album art and title surface on `/temporal`:
    - Desktop ATTLAS: in the detail panel and a fixed bottom-left "CKORE" sidebar
    - Mobile card deck: inline below the entry title
- **Lineage** — multi-select of other entries. Used by ATTLAS to draw connections.

## Adding more pages later

Phase 2 will add `/admin/projects` and `/admin/store`. The Prisma schema
gains models, `db push` updates Neon, admin gets two more pages.
