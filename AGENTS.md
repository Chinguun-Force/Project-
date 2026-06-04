## Learned User Preferences

- User often communicates in Mongolian; use English only for foreign-tourist-facing UI (e.g. iOS PWA install guide).
- Prefer Supabase MCP for Supabase schema, migrations, and database debugging when available.
- Staff navigation: moderator login shows only the Moderator panel; admin login shows only Moderator and Admin (not the full traveler app menu).
- Points/balance UI uses `apps/nomad-go-v2/public/Shagai.png` (not inline SVG) with a flip animation when balance changes.
- Logout must redirect to the login page; new registration must land on the dashboard.
- Show total points (Shagai balance) persistently beside the user profile in the shell.
- Use Nomad-Go branded loading: spinner for buttons/actions, skeleton for page/section loads.

## Learned Workspace Facts

- Nomad-Go is an NX package-based monorepo: workspaces `apps/*`, `packages/*`, `libs/*` at repo root.
- Primary active app is `apps/nomad-go-v2` (dev via `npm run dev:v2`); siblings include nomad-go-main, nomad-go-pwa, nomad-go-v3.
- Gamified travel PWA backed by Supabase; quest/mission rewards flow through `grantUserRewardsAction`.
- Four app roles only: admin (super admin), moderator (company staff), guide (company-hired), tourist.
- Domain model: `trips` → `rooms` (`room_code`) → `room_members` / `room_activities`. Tourist join: `joinRoomByCodeAction`; metadata `room_id`. Legacy `sessions` APIs return HTTP 410; admin **Departures** tab lists rooms; `moderatorActions.ts` removed.
- Multi-tenant trips: `tenants` = travel company row; staff link via `profiles.tenant_id` (not “tenant = moderator user”). Room isolation SQL in `apps/nomad-go-v2/supabase/migrations/20260522120000_multi_tenant_rooms_architecture.sql`.
- Auth cutover: role and tenant from `profiles`; XP/points/legacy gamification from `users` (dual-table sync).
- Staff panels: `/moderator` (dashboard, team, templates, rooms — moderator creates rooms and assigns guides); `/guide` (assigned rooms + timeline only); admin Companies tab creates tenants and assigns moderators.
- Tourist marketplace `/tours`: published `trips` only; join live group via room code on Home (`/`). Offline quest queue: IndexedDB + `POST /api/sync/quest-submissions`.
- `apps/nomad-go-v2` uses Drizzle (`db/schema.ts`); introspect from repo root via `npm run db:pull:v2` (not Prisma).
- Shared libs: `@nomad-go/shared-ui` (design tokens, `libs/shared-ui`), `@nomad-go/gamification-xp` (`packages/gamification-xp`).
- Root `.cursorrules` defines Nomad-Go engineering standards (offline-first PWA, RLS, gamification UX, payment trust).
