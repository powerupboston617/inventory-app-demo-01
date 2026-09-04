# Power Up Boston Inventory — PM handoff
Date: 2026-09-04
Roles: Chris = owner/tester. This Grok chat = project manager. GrokBuild = writes code.

## Where we started
Internal inventory web app for Power Up Boston (IT/MSP, Plymouth MA). Sortly-style, mobile-first, not an ERP. Original live-build in this chat was cancelled (sandbox). GrokBuild builds; this chat writes prompts and scope.

## Locked decisions
- Stack: Next.js App Router + TypeScript + Tailwind + Prisma + SQLite
- Auth: email + password only. NO 2FA, no magic link required
- Roles: Admin / Tech. Admin: Users, Lists, Import, Reports. Tech: inventory only
- No Summary Stats page (removed)
- Project status: Active | Completed only. Pause was added then REMOVED (it broke)
- No Settings page for SMTP or API keys — secrets stay in `.env`
- Colors: Primary #03005D, Secondary #0011FF, Surface #52C8FF, Accent #FF7300, Mute #9D9D9D
- Home = item list + Filter popup + Active jobs + Recent activity. Bottom nav: Home | Items | Add | Projects
- Item fields: name (from ItemName list), manufacturer (list, optional), serial optional, qty, reorderPoint, location, status, condition, price, photo, category, project, notes
- Locations: Shop | Van | Shipping | Jobsite | Other
- Status: In Stock | Out of Stock | In Transit | At Location
- Condition: New | Used | Shop Refurbished
- Categories seed: AV/Cameras, Network & Security, Computer Systems, Components & Parts, Door Access, Accessory Part, Tools, Others
- Delete on Lists blocked if still in use
- CSV create-new-only (match-or-create name/manufacturer/category)
- AI buttons must NOT depend on client `process.env.XAI_API_KEY` (empty in browser). Use server `/api/ai-status`. Never `NEXT_PUBLIC_XAI_API_KEY`
- Vision model: grok-4.6, fallback grok-4.3. Not grok-imagine-image-*
- Camera/barcode on live phones needs HTTPS; AI does not differ on mobile if server has the key

## What shipped (tested OK unless noted)
- Phase 1: items CRUD, categories, projects, search/filter, activity, photos, Home list revision
- Phase 2: login, roles, Users add/edit/password, low-stock in-app, Active jobs
- Phase 3: CSV import (fixed "use server" export-number crash), reports, barcode scan
- Phase 4: ItemName + Manufacturer pick lists + /lists editor + migrate old free text
- Add-on specified: Fill from photo + Suggest category — NOT working in UI yet (no buttons after adding key)

## Running state
- App usable for shop inventory without AI
- Last known AI issue: key in .env but no new buttons (gating/wiring, likely never fully implemented)

## What's left
1. Land AI hotfix: /api/ai-status, Fill from photo, Suggest category, README restart note
2. After AI works: optional Phase 4 wrap (README/.env.example cleanup only)
3. Deploy/live: HTTPS for camera; SMTP + XAI_API_KEY on the host; restart after env change

## Open questions
- Exact env var name in their repo (XAI_API_KEY vs GROK_API_KEY) — confirm in README
- Whether GrokBuild ever committed the photo-AI UI
- Hosting target (local Proxmox vs VPS vs Vercel) not chosen in this chat

## How the next PM session should work
User tests → short assessment → this agent writes the next GrokBuild prompt only. No scope creep.