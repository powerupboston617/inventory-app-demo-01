# Power Up Boston Inventory

A simple, mobile-first inventory app for **Power Up Boston** (PUB), an IT / MSP shop in Plymouth, MA.

Built for the shop floor, the van, and the jobsite — visual, fast, no ERP bloat.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (swap the datasource to Postgres later)
- Server Actions for forms
- NextAuth.js (Auth.js v5) for login
- Local photo uploads in `public/uploads`

## Setup

From the project root:

```bash
npm install
npx prisma db push
npx prisma generate
npx prisma db seed
npm run dev
```

`npx prisma db seed` also creates Item name / Manufacturer list rows from existing item text so old inventory still displays (Dream Router, Ubiquiti, etc.).

Create a `.env` file (see `.env.example`):

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate-a-long-random-string"
NEXTAUTH_SECRET="same-as-AUTH_SECRET"
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

### First admin / tech (from seed)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@pub.local` | `Admin123!` |
| Tech | `tech@pub.local` | `Tech123!` |

Re-running seed will not reset those passwords if the users already exist. Add more people from **Users** (Admin only).

### Optional Google sign-in

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. The Google account email must already exist as a user — there is no public signup.

### Optional email (low-stock alerts)

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
EMAIL_FROM="PUB Inventory <inventory@powerupboston.com>"
```

If SMTP is missing, in-app low-stock banner and activity still work. Low-stock **email** and scheduled reports are skipped.

Optional cron (Daily after 6:00 AM, Weekly Monday after 6:00 AM, timezone `America/New_York`):

```
CRON_SECRET="a-long-random-string"
```

Call once an hour from Task Scheduler or a host cron:

```
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/reports
```

The endpoint only sends when a report is due. It does not send on page load.

Optional AI (`XAI_API_KEY` — **restart** `npm run dev` or the host process after setting it):

```
XAI_API_KEY=
# GROK_API_KEY=   # used only if XAI_API_KEY is unset
```

If the key is missing, **Fill from photo** and **Suggest category** stay hidden. After you add the key, restart the server. Add Item and Edit Item ask the server whether AI is on (`GET /api/ai-status`); they never read the key in the browser. Do not set `NEXT_PUBLIC_XAI_API_KEY`.

Fill from photo uses a vision/chat model (`grok-4.6`, then `grok-4.3` if needed). Do not use `grok-imagine-image-*`. Override with `XAI_VISION_MODEL` only for another chat/vision model.

## Routes

| Path | Screen |
|---|---|
| `/login` | Sign in (email + password, Google if configured) |
| `/` | **Home** — item list, Filter popup, low-stock banner, active jobs, recent activity |
| `/items` | Fuller items list with inline search/filters + scan |
| `/items/import` | CSV import (Admin) |
| `/items/new` | Add item |
| `/items/[id]` | Item detail |
| `/items/[id]/edit` | Edit item |
| `/projects` | Projects list |
| `/projects/new` | New project |
| `/projects/[id]` | Project detail / edit |
| `/settings` | Users (Admin only) |
| `/lists` | Item names, manufacturers, categories (Admin only) |
| `/reports` | Email report settings (Admin only) |

Home and Items are similar lists. Home is the list plus Filter popup, active jobs, and recent activity. Items keeps the inline filter bar. Bottom nav: Home \| Items \| Add (+) \| Projects (hidden on the login screens).

## What you can do

- **Login** — email and password. Optional Google if keys are set.
- **Roles** — Admin: everything including users and deletes. Tech: inventory add/edit, no user admin, no deletes.
- **Users** — Admin can add people and edit name, email, password, and role.
- **Lists** — Admin manages item names, manufacturers, and categories. Rename updates every item that uses that label. Delete is blocked while items still use it. Tech can still add names/manufacturers from Add Item.
- **Home** — item cards, Filter popup, low-stock banner, active job chips, recent activity
- **Items / Add / Edit** — name and manufacturer are pick lists (+ New on the form). Photo, quantity, serial, and the rest are unchanged.
- **Projects** — client jobs with status Active or Completed. Home Active jobs shows Active only.
- **Low stock** — `quantity <= reorder point` **and** reorder point > 0. Banner on Home. Emails Admin(s) only when an item **becomes** low, and only if SMTP is set.
- **CSV import** — Admin only. Download a template, upload up to 500 rows. Invalid rows are skipped; the rest still import. Creates new items only. Name/manufacturer/category match existing list rows or create them.
- **Reports** — Admin: Off / Daily / Weekly (Monday). Test send button. All Admin emails plus an optional extra recipient.
- **Barcode scan** — Scan on Home, Items, Add, and Edit. Fills serial or opens the matching item. Camera needs HTTPS or localhost.
- **Fill from photo** — On Add/Edit Item after a photo is chosen, when AI is on. Fills name (and manufacturer/category when obvious). Review, then Save. Restart after adding `XAI_API_KEY`.
- **Suggest category** — On Add/Edit Item when AI is on. Sets Category from name + manufacturer + notes. Restart after adding the key.

## Data notes

- Serial number is optional. Quantity is required (use it for bulk parts: cables, connectors, mounts).
- Location and status show together, e.g. `In Transit | Van` or `At Location | Jobsite`.
- Every create, edit, quantity change, location change, delete, and low-stock transition is written to the activity log.

## Later (not in this build)

Label printing, HaloPSA / Hudu, full demand forecasting.

## Switching to Postgres

1. Change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`.
2. Set `DATABASE_URL` to your Postgres connection string.
3. Run `npx prisma db push` (or `npx prisma migrate dev`).
