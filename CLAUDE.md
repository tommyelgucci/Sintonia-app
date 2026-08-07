# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                          # install deps
npm start                            # Expo Dev Tools; pick Android/iOS/web
npm run web                          # expo start --web directly
npm test                             # jest — runs all lib/*.test.ts
npx jest lib/cycle.test.ts           # run a single test file
npx jest -t "nombre del test"        # run tests matching a name
npx tsc --noEmit                     # typecheck (no build step otherwise)
```

In network-restricted sandboxes, `expo start` hangs trying to validate
dependency versions against Expo's API. Add `--offline` to skip that:
`npx expo start --web --offline --port 8081`.

There is no lint script configured. Tests are `ts-jest` over Node,
scoped to `lib/*.test.ts` — only the pure logic modules are tested, not
screens or components.

## Architecture

**Local-first, Supabase-optional.** SQLite (`lib/db.ts`, native) is the
source of truth; the app is fully usable with zero network and no
account. Supabase (`lib/sync.ts`, `lib/supabase.ts`) is a one-way mirror
for backup and partner-linking only — writes always go to local storage
first, then `sync.ts` pushes a copy to the cloud *if* a session exists.
Never the other direction for the device's own data.

**Two storage backends, one API.** `lib/db.ts` (expo-sqlite) and
`lib/db.web.ts` (AsyncStorage) expose the identical function signatures;
Metro resolves `.web.ts` automatically on the web target, so screens
just `import from "@/lib/db"` and never know which backend answered.
When you change the data model, touch **both** files:
- `db.ts`: add the column to the `CREATE TABLE` (for fresh installs)
  *and* add a `try { ALTER TABLE ... ADD COLUMN ... } catch {}` right
  after it (for devices upgrading from an older schema — SQLite has no
  `ADD COLUMN IF NOT EXISTS`, and `CREATE TABLE IF NOT EXISTS` won't
  retrofit a column onto an existing table).
- `db.web.ts`: default the new field when reading old JSON blobs from
  AsyncStorage (e.g. `dischargeSigns: l.dischargeSigns ?? []`) — records
  written before the field existed won't have it.
- If the field syncs to Supabase, mirror it in `supabase/schema.sql`
  too, using `alter table ... add column if not exists` (Postgres does
  support that) so re-running the script against an already-deployed
  project is safe.

**Pure logic lives apart from data access and from React.** `lib/cycle.ts`,
`lib/fertility.ts`, `lib/pregnancy.ts`, `lib/healthReport.ts`, and
`lib/insights.ts` are plain functions that take already-loaded data and
return a result — no imports of `db.ts`, no React. That's what makes them
unit-testable (`*.test.ts` siblings) without mocking storage. Screens don't
call these directly either; a `use*` hook (`useCyclePrediction.ts`,
`usePregnancy.ts`, `useIntention.ts`, `useInsights.ts`) reads from `db.ts`,
calls the pure module, and exposes `{ loading, ..., reload }` — `reload` is
called from `useFocusEffect` after any screen writes new data, since
`app/index.tsx` is the router root and never unmounts on navigation.

**Dates are always `'YYYY-MM-DD'` strings, parsed as UTC midnight.**
`cycle.ts`'s `parseUTCDate`/`addDays`/`diffDays` are the only sanctioned
way to do date math in this codebase — never compare a stored date
string against `Date.now()` or `new Date()` directly, that's a timezone
bug waiting to happen (see the comment at the top of `lib/cycle.ts`).

**Every screen is a file under `app/` (Expo Router) AND a line in
`app/_layout.tsx`.** Adding a route means both: the file for the
screen, and a `<Stack.Screen name="..." options={{ title: "..." }} />`
entry in the root layout, or it renders without a header/title.

**Design system, not ad hoc styles.** `lib/theme.ts` (colors, type scale,
spacing, radius, shadow) and `lib/ui.tsx` (`Card`, `HeroCard`,
`FadeInView`, `ActionRow`, `ProgressBar`, `PrimaryButton`, `QuietButton`,
`Eyebrow`) are shared across every screen — compose from these instead of
one-off `StyleSheet` primitives. Icons are hand-drawn SVGs in
`lib/icons.tsx`; the app never uses emoji in UI (glyphs render
inconsistently across iOS/Android/web). `FadeInView`'s `index` prop
staggers the entrance animation — bump every subsequent index when you
insert a new block into an existing screen.

**Content articles (`lib/library.ts`) follow three fixed rules**, stated
in that file's header comment: red flags render before the body (a
separate `redFlags` field, not buried in a paragraph), ranges instead of
single averages ("21 to 35 days", not "28 days"), and articles never
assert a diagnosis or tell someone to stop a treatment — only describe
what's typical and when to consult. Follow these when adding an article.

**Privacy model:** nothing is shared with a linked partner by default.
`connections` is a symmetric relationship with no fixed roles (no
gender field anywhere in the schema). Once a connection is accepted, a
Postgres trigger creates a `share_settings` row per person with
everything off except `share_cycle_dates`; each person separately opts
in to sharing symptoms/mood. `lib/sync.ts`'s `fetchPartnerDailyLogs`
enforces this at the client too — e.g. `dischargeSigns` intentionally
isn't fetched there even though it exists on the row, because it's more
sensitive than symptoms/mood and that screen never renders it. When you
add a new personal-data field, decide deliberately whether it belongs in
that fetch, don't just widen the `select`.

## Stack

Expo (React Native + TypeScript) + Expo Router · SQLite local storage ·
Supabase (Postgres + Auth) for sync/linking, disabled gracefully if
`EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` are unset ·
`lib/ai.ts` is a placeholder for an AI assistant, meant to call a
first-party backend endpoint rather than the Anthropic API directly from
the client (see the security note in that file).
