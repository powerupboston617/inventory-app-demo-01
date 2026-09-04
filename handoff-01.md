# Handoff — Power Up Boston Inventory

Written so a new agent can continue without the prior chat. Product: **Power Up Boston Inventory** for Power Up Boston (PUB), an IT/MSP shop in Plymouth, MA. Sortly-inspired, mobile-first, not an ERP.

Workspace: `C:\Users\Christopher\pub-inventory-01`  
Stack: Next.js 16.3.2 App Router, React 19, TypeScript, Tailwind 4, Prisma 6 + SQLite, NextAuth v5 (`next-auth@beta`), Lucide. No `src/` dir. Alias `@/*`.

---

## Where we started

Empty workspace. User asked for a complete Phase 1 inventory app (schema, seed categories, Dashboard, Item CRUD, Projects, activity log, PUB colors, no auth). Later phases and several reversals were layered on in this same conversation.

---

## Decisions locked in (do not undo)

**Product / UX**
- Keep it simple. No HaloPSA, Hudu, label printing, full demand forecasting, or secrets Settings page.
- Home is the **item list** (photo cards, Filter pill → modal, Active jobs chips, Recent activity). **Not** a stat-card dashboard.
- **Summary Stats is gone.** Do not restore `/summary` or dashboard-on-Home.
- Bottom nav (mobile): Home | Items | Add (+) | Projects. Hidden on login.
- Brand: Primary `#03005D`, Secondary `#0011FF`, Surface `#52C8FF`, Accent `#FF7300`, Mute `#9D9D9D`. Navy header, light pages, orange CTAs.
- Combined location+status display: e.g. `In Transit | Van`.
- Serial optional. Quantity required. Two items may share the same catalog name (e.g. two “Dream Router”).

**Auth / roles**
- Email + password only. **No 2FA, OTP, magic link, SMS, or remember-device.** Those were built in Phase 2 then stripped.
- Optional Google if `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` exist; email must already be a User (no public signup).
- Admin: users, lists, CSV import, reports, deletes. Tech: inventory add/edit, qty/location, filters; no Users/Lists/Import/Reports; cannot delete items/projects.
- Last remaining Admin cannot demote or disable themselves. Cannot disable your own account.

**Projects**
- Status is **Active | Completed only**. **Pause was added then reverted.** Any Pause rows were set back to Active. Do not re-add Pause.
- Home “Active jobs” = `status === "Active"` only.

**Low stock**
- `quantity <= reorderPoint && reorderPoint > 0`.
- In-app banner + Filter count + `/?low=1`. Email Admins only on **transition into** low stock, and only if SMTP is set. CSV import logs LowStock activity but does **not** email per row.

**Engineering**
- Pin **Prisma 6** (not 7). SQLite `DATABASE_URL="file:./dev.db"`.
- Next.js 16 uses **`proxy.ts`**, not `middleware.ts`.
- **`"use server"` files may only export async functions.** No `export const NUMBER`, no re-exporting constants from action files. Put constants/types/helpers in `lib/csv.ts`, `lib/catalog.ts`, `lib/ai-suggest.ts`, etc. This bit CSV import (`CSV_MAX_ROWS` re-export) — do not regress.
- AI: SpaceXAI via `XAI_API_KEY` and `https://api.x.ai/v1`. Hide AI UI if key missing. Restart after setting the key.

---

## What shipped

### Phase 1 — core inventory
App shell, Prisma schema, category seed, Item CRUD, photo upload (`public/uploads`), Projects, activity log, mobile layout.

Then **Home layout revision**: old dashboard → was `/summary`, Home became the item list + Filter popup. Summary Stats later **deleted**.

### Phase 2 — login, then simplified
NextAuth JWT + Credentials. Users `/settings`. Low-stock banner + transition emails. Active jobs on Home.

**Revision:** 2FA/magic/remember-device removed. Users page gained **Edit** (name, email, optional password, role).

### Phase 3 — CSV, reports, scan, light AI
- Admin CSV import `/items/import` (max 500 rows, create-only, per-row errors).
- Admin reports `/reports` (Off/Daily/Weekly Monday 6am `America/New_York`). Cron `GET /api/cron/reports` with `CRON_SECRET`. Does not send on page load.
- Barcode/QR (`html5-qrcode`) on Home, Items, Add, Edit. HTTPS or localhost.
- Suggest category on Add Item if `XAI_API_KEY` set.

**Hotfix:** `"use server"` number export crashed `/items/import`. Fixed by keeping `CSV_MAX_ROWS` only in `lib/csv.ts`.

### Phase 4 — pick lists
Catalogs: `ItemName`, `Manufacturer`, existing `Category`. Item has `itemNameId` (required) + `manufacturerId` (optional). Denormalized `Item.name` / `Item.manufacturer` strings kept in sync for display/search.

Admin `/lists`: search, add, rename (updates all items), delete blocked if in use.

Seed `backfillItemCatalogs()` links existing items from their text names.

**Add-on:** Fill from photo on Add/Edit after a photo exists. Vision via chat/completions, default model `grok-4.6` (`XAI_VISION_MODEL` override). Match-or-create name/manufacturer; category = closest **existing** only. Does not auto-Save. Hidden without API key.

---

## Seeded logins (do not treat as production secrets)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@pub.local` | `Admin123!` |
| Tech | `tech@pub.local` | `Tech123!` |

Re-seed does not reset existing user passwords.

---

## Key files for next session

| Area | Paths |
|------|--------|
| Schema / seed / backfill | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/catalog.ts` |
| Auth | `auth.ts`, `lib/actions-auth.ts`, `lib/guards.ts`, `proxy.ts`, `app/login/page.tsx` |
| Items | `lib/actions.ts`, `components/ItemForm.tsx`, `app/items/**` |
| Lists | `lib/actions-catalog.ts`, `components/ListsEditor.tsx`, `app/lists/page.tsx` |
| CSV | `lib/csv.ts` (constants **here**), `lib/actions-import.ts` (**async only**), `app/items/import/` |
| Reports / mail | `lib/reports.ts`, `lib/actions-reports.ts`, `lib/mail.ts`, `lib/low-stock.ts`, `app/reports/page.tsx`, `app/api/cron/reports/route.ts` |
| Scan | `components/BarcodeScanner.tsx`, `components/ScanLookupButton.tsx`, `lib/actions-scan.ts` |
| AI | `lib/ai-suggest.ts` (no `"use server"`), `lib/actions-ai.ts` (`suggestCategory`, `fillFromPhoto`) |
| Shell | `app/layout.tsx`, `components/Header.tsx`, `components/UserMenu.tsx`, `components/BottomNav.tsx` |
| Docs | `README.md`, `.env.example` |

Home: `app/page.tsx`. There is **no** `app/summary`.

---

## Running state

- Dev server is **stopped** (user routinely kills `npm run dev`). Do **not** auto-restart unless asked. Start with `npm run dev` → http://localhost:3000
- Local SQLite at `prisma/dev.db`. Schema pushed; seed has backfilled catalogs (this machine: 10 items linked).
- SMTP is typically **unset** locally → in-app low stock works; emails/reports will not send (UI says so).
- `XAI_API_KEY` may be unset → Fill from photo and Suggest category hidden.
- `tsc --noEmit` was clean after the last Fill-from-photo change.
- Prisma generate can `EPERM` rename the Windows query engine if something still has the DLL locked; retry after stopping Node.

Setup if starting cold:

```bash
npm install
npx prisma db push
npx prisma generate
npx prisma db seed
npm run dev
```

---

## What's left (not in this build)

Explicitly out of scope unless the user asks:

- HaloPSA / Hudu
- Label printing / barcode label sheets
- Full demand forecasting
- CSV “update existing by serial”
- Production hosting, custom domain, HTTPS for phone camera off-localhost
- Wiring real SMTP and a host cron for Daily/Weekly reports
- Google OAuth (code is there; needs env)
- Settings UI for API keys / SMTP (user forbade this)

---

## Open questions / watch-outs

1. **Fill from photo** was not fully exercised in a browser with a live `XAI_API_KEY`. If `grok-4.6` rejects vision on chat/completions, try `XAI_VISION_MODEL` or switch the request body to `/v1/responses` with `input_image` (see xAI image-understanding docs). Timeout is 20s. Do not store raw model dumps on the item.
2. **Denormalized `Item.name` / `Item.manufacturer`**: catalog rename updates both the catalog row and all items. Keep them in sync on create/update. Display/search still use the text fields plus relation `contains`.
3. **`"use server"` trap:** never re-export numbers/helpers from action files. CSV import already burned once.
4. **Phone camera** for scan and Fill-from-photo needs HTTPS (or localhost).
5. **Cron** will not fire by itself; something must hit `/api/cron/reports` with `CRON_SECRET`.
6. Category table has **no** `createdAt`/`updatedAt` (adding them broke `db push` on existing rows). ItemName/Manufacturer do have timestamps.

---

## How to talk to the user

They iterate in small phases and then hotfix/revert quickly (2FA, Summary Stats, Pause). Match that: don’t restore removed features, don’t expand scope, keep PUB colors and the Home-as-list layout.
