# Plan 2: Supabase Backend, Auth, Server-Side Rewards & AI Garden Keeper — Implementation Plan

> **For agentic workers:** Orchestrated by **Gemini 4 Neon (Medium)** and executed by **Gemini 4 Hydrogen (Medium)** swarm workers. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect *Dew & Bloom* to a live Supabase backend with Postgres + Row Level Security (RLS), Apple/Google/Email authentication, server-validated Dew/Sunlight & Fog reward RPC, the live AI Garden Keeper Edge Function (with automatic offline fallback), and offline-first sync from `useSanctuaryStore`.

**Architecture:** Supabase hosts PostgreSQL (with strict RLS so users can only read/write their own rows and never arbitrarily mutate currency balances), Supabase Auth (`@supabase/supabase-js` + `expo-secure-store` session storage), a Postgres RPC (`claim_morning_reveal`) mirroring `src/domain/economy.ts` & `src/domain/fog.ts` rules server-side, and a Supabase Edge Function (`garden-keeper-insight`) calling a fast LLM with strict JSON output and cost/rate limits. The mobile app remains 100% playable offline and syncs transparently when authenticated and online.

**Tech Stack:** Supabase (Postgres 17, Auth, RLS, Edge Functions in Deno/TypeScript), `@supabase/supabase-js`, `expo-secure-store`, `expo-auth-session`, `expo-apple-authentication`, React Native + Expo Router, Zustand, Jest.

**Spec:** [docs/prd.md](../../prd.md) (§4.2, §4.4, §6.2, §6.5) · **Design System:** [design-system/dew-and-bloom/MASTER.md](../../../design-system/dew-and-bloom/MASTER.md)

---

## Global Constraints
- **Server-Side Integrity (PRD §6.5):** Clients must NEVER directly update `dew_balance`, `sunlight_balance`, or `is_pro` via REST; only Postgres RPCs / Edge Functions with `SECURITY DEFINER` or service role mutate balances.
- **Health Data Privacy (PRD §6.5):** Anonymized 7-day numeric summaries only (`sleep_min`, `bedtime_offset_min`, `steps`, `fog_level`) sent to AI; zero PII, zero ad-network sharing.
- **AI Safety & Cost Control (PRD §4.2.3):** Max 1x/day (Pro) or 1x/week (Free), max 22 words, warm cozy tone, zero exclamation marks, zero medical diagnoses, graceful fallback to `pickKeeperFallbackNote()` on timeout (>3s) or offline.
- **Mandatory Account Deletion (PRD §6.5):** 1-tap in-app "Delete account & all data" flow calling an authenticated Edge Function.
- **UI & Design System:** All new Auth & Settings UI strictly follows [MASTER.md](../../../design-system/dew-and-bloom/MASTER.md) (Lora + Plus Jakarta Sans, `palette` tokens, `lucide-react-native`, `BotanicalButton`, zero emojis, WCAG AA >=4.5:1).

---

## Review Focus
1. **Direct client balance tampering** (attempting `UPDATE profiles SET dew_balance = 999999`) → blocked by RLS / column-level trigger *(pinned in Task 1)*.
2. **Duplicate `claim_morning_reveal` RPC call for same `log_date`** → idempotent (`UNIQUE (user_id, log_date)`), returns `already_revealed: true` and `0` extra currency *(pinned in Task 1)*.
3. **AI Edge Function timeout, malformed LLM output, or missing API key** → never throws 500 to client; returns clean fallback insight + `source: 'fallback'` *(pinned in Task 2)*.
4. **Offline-to-online sync conflict** → local placements & morning reveals queue safely and reconcile cleanly after sign-in without losing local progress *(pinned in Task 4)*.
5. **Account deletion completeness** → deleting an account cascades `profiles`, `daily_logs`, `garden_placements`, `subscriptions`, and clears local AsyncStorage/SecureStore *(pinned in Task 5)*.

---

## File Structure

```
supabase/
  migrations/
    202611240001_initial_schema.sql      # profiles, daily_logs, catalog_items, garden_placements, subscriptions + RLS + claim_morning_reveal RPC
  functions/
    garden-keeper-insight/index.ts       # Rate-limited AI Garden Keeper Edge Function (strict JSON + fallback)
    delete-account/index.ts              # Authenticated cascading account deletion Edge Function
src/
  services/
    supabase.ts                          # Typed Supabase client backed by expo-secure-store
    authService.ts                       # Email/password, Apple, Google sign-in & session listener
    syncService.ts                       # Profile, placements, and claim_morning_reveal RPC sync + AI insight fetcher
app/
  auth.tsx                               # Calm, optional sign-in / create account screen (Email + Apple + Google)
  settings.tsx                           # Profile goals, tracking mode, sync status, Sign Out & Delete Account
__tests__/
  services/
    syncService.test.ts                  # Offline fallback, RPC mapping, AI timeout fallback tests
```

---

### Task 1: Supabase Postgres Schema, RLS & `claim_morning_reveal` RPC
- Apply migration via Supabase MCP (`apply_migration`) creating `profiles`, `daily_logs`, `catalog_items` (seeded with all 35 Sunlit Meadow items), `garden_placements`, `subscriptions`.
- Enable RLS on every table with `auth.uid() = user_id` policies and a `BEFORE UPDATE` trigger preventing direct client mutations to `dew_balance`, `sunlight_balance`, and `is_pro`.
- Create idempotent `claim_morning_reveal(p_log_date date, p_sleep_min int, p_steps int, p_bedtime_offset_min int)` `SECURITY DEFINER` RPC matching `src/domain/economy.ts` & `src/domain/fog.ts` exact math and sanity clamping (`[0, 960]`, `[0, 60000]`).
- Verify via Supabase MCP `get_advisors` (security + performance) and SQL assertions.

### Task 2: AI Garden Keeper & Delete-Account Edge Functions
- Deploy `garden-keeper-insight` Edge Function via Supabase MCP (`deploy_edge_function`): authenticates JWT, checks Free (1/wk) vs Pro (1/day) rate limit, calls fast LLM with strict JSON schema (<=22 words, no `!`, no medical advice), falls back cleanly on timeout/missing key.
- Deploy `delete-account` Edge Function via Supabase MCP (`deploy_edge_function`): verifies caller JWT and deletes auth user (cascading all rows).

### Task 3: Mobile Supabase Client & Auth Flow (`src/services/supabase.ts`, `authService.ts`, `app/auth.tsx`)
- Install `@supabase/supabase-js` and `expo-secure-store`.
- Configure `.env.example` + `.env` (gitignored) with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` fetched via Supabase MCP (`get_project_url`, `get_publishable_keys`).
- Build calm `app/auth.tsx` (Email + Apple + Google buttons + "Continue offline" option) following `MASTER.md`.

### Task 4: Offline-First Sync Service & Store Wiring (`src/services/syncService.ts`, `useSanctuaryStore.ts`)
- Wire `syncService` to call `claim_morning_reveal` RPC and `garden-keeper-insight` Edge Function when signed in & online, falling back seamlessly to local domain engine + `pickKeeperFallbackNote()` when offline or signed out.
- Unit-test all online/offline/timeout paths in `__tests__/services/syncService.test.ts` (TDD).

### Task 5: Settings & Account Deletion Screen (`app/settings.tsx`)
- Add subtle Settings gear button on `SanctuaryHud` / `Insights` opening `app/settings.tsx`.
- Allow updating sleep/step goals, viewing cloud sync status, signing in/out, and 1-tap confirmed **Delete account & all data** calling `delete-account` Edge Function + `resetAllData()`.
- Verify `npm run typecheck && npm test` and run whole-branch review.
