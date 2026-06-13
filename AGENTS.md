## Learned User Preferences

- User often communicates in Mongolian; use English only for foreign-tourist-facing UI (e.g. iOS PWA install guide).
- Prefer Supabase MCP for Supabase schema, migrations, and database debugging when available.
- Staff navigation: moderator login shows only the Moderator panel; admin login shows only Moderator and Admin (not the full traveler app menu).
- Points/balance UI uses `apps/nomad-go-v2/public/Shagai.png` (not inline SVG) with a flip animation when balance changes.
- Logout must redirect to the login page; new registration must land on the dashboard.
- Show total points (Shagai balance) persistently beside the user profile in the shell.
- Use Nomad-Go branded loading: spinner for buttons/actions, skeleton for page/section loads, and post-login boot screen (`NomadBootScreen`) before dashboard on slow networks.
- Tours marketplace cards show image, title, short description, duration, price, and mission badges (top 2 highest-XP missions; overflow as +N).
- Dashboard header uses a single Settings button (avatar + gear) that links directly to `/settings` (no profile avatar dropdown); logout lives only in the `/settings` "Danger Zone" at the bottom; `/settings` has a top Profile shortcut card plus conditional Moderator/Admin panel links for non-staff accounts with panel access.
- Dashboard home (`app/(dashboard)/page.tsx`) shows a clean profile-summary card plus a 4-stat grid (Level, Streak, Quests, Rank) styled like the `/profile` page.

## Learned Workspace Facts

- Nomad-Go is an NX package-based monorepo: workspaces `apps/*`, `packages/*`, `libs/*` at repo root.
- Primary active app is `apps/nomad-go-v2` (dev via `npm run dev:v2`): Next.js App Router in `app/` (routes, server actions), shared code in `src/` (components, hooks, lib); siblings include nomad-go-main, nomad-go-pwa, nomad-go-v3.
- Gamified travel PWA backed by Supabase; quest/mission rewards flow through `grantUserRewardsAction`. tRPC routers in `apps/nomad-go-v2/api/router.ts` are stubs returning `{}` / `[]` / `null` (e.g. `progress.me`); real data comes from Supabase server actions in `src/app/actions/gameActions.ts` (e.g. `getUserProgressAction`).
- Four app roles only: admin (super admin), moderator (company staff), guide (company-hired), tourist.
- Domain model: `trips` → `rooms` (`room_code`) → `room_members` / `room_activities`. Tourist join: `joinRoomByCodeAction`; metadata `room_id`. Legacy `sessions` APIs return HTTP 410; admin **Departures** tab lists rooms; `moderatorActions.ts` removed.
- Multi-tenant trips: `tenants` = travel company row; staff link via `profiles.tenant_id` (not “tenant = moderator user”). Room isolation SQL in `apps/nomad-go-v2/supabase/migrations/20260522120000_multi_tenant_rooms_architecture.sql`.
- Auth cutover: role and tenant from `profiles`; XP/points/legacy gamification from `users` (dual-table sync).
- Staff panels: `/moderator` (dashboard, team, templates, rooms — moderator creates rooms and assigns guides); `/guide` (assigned rooms + timeline only); admin Companies tab creates tenants and assigns moderators.
- Tourist marketplace `/tours`: published `trips` only; join live group via room code on Home (`/`). Offline quests: Dexie `offline_submissions` for PHOTO, AUDIO, QR_SCAN, QUIZ, TIME_BOUND; sync via `POST /api/sync/quest-submissions`.
- `apps/nomad-go-v2` uses Drizzle (`db/schema.ts`); introspect from repo root via `npm run db:pull:v2` (not Prisma).
- `users` table (`db/schema.ts`) has no streak column; daily streak is tracked client-side via localStorage in `src/lib/dailyStreak.ts`, tied to the Road Blessing daily check-in (`claimDailyCheckinAction`). Avoid a `gamification/` folder beside `src/lib/gamification.ts` (module-resolution ambiguity); put standalone lib helpers directly under `src/lib`.
- Shared libs: `@nomad-go/shared-ui` (design tokens, `libs/shared-ui`), `@nomad-go/gamification-xp` (`packages/gamification-xp`); root `.cursorrules` defines Nomad-Go engineering standards (offline-first PWA, RLS, gamification UX, payment trust).
