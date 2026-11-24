# Plan 1: Foundation, Core Economy & Playable Sanctuary Canvas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working, offline-first, testable iOS & Android Expo app for *Dew & Bloom* covering Onboarding, the Dew/Sunlight & Compassionate Fog domain engine, Phone-Only Goodnight Lantern, the 8x8 isometric Sanctuary Canvas, Morning Reveal modal, Garden Shop, and Share Progress Card.

**Architecture:** Clean domain-first architecture inside a single Expo (React Native + TypeScript) project. Pure TypeScript domain modules (`src/domain/*`) own all currency math, fog recovery, grid rules, and lantern calculations with zero React/RN imports so they unit-test instantaneously in Vitest/Jest and can later share contracts with Supabase Edge Functions. Zustand + AsyncStorage persist state offline behind typed store actions, while Expo Router screens render the cozy UI using Reanimated + Expo Haptics + React Native ViewShot.

**Tech Stack:** React Native (Expo SDK 52+), Expo Router, TypeScript (strict), Zustand, `@react-native-async-storage/async-storage`, `react-native-reanimated`, `react-native-gesture-handler`, `expo-haptics`, `react-native-view-shot`, `expo-sharing`, Jest + `@testing-library/react-native`.

**Spec:** [docs/prd.md](../../prd.md)

### Multi-Plan Roadmap (Scope Decomposition)
The full v1 PRD spans three independent subsystems; each gets its own plan and produces runnable software:
1. **Plan 1 (This Plan):** Expo iOS/Android shell, pure domain engine, offline persistence, Onboarding, Goodnight Lantern, Isometric Sanctuary Canvas, Morning Reveal, Catalog/Shop, Share Card.
2. **Plan 2 (Next):** Supabase Auth (Apple/Google/Email), Postgres schema + RLS, server-side reward RPC, AI Garden Keeper Edge Function, offline sync queue.
3. **Plan 3 (Final v1):** Apple HealthKit + Android Health Connect native adapters, RevenueCat Freemium + 7-day trial paywall ($19.99/yr, $2.99/mo, $39.99 Lifetime), PostHog analytics, iOS WidgetKit & Android Glance home-screen widgets.

---

## Global Constraints
- **Platforms:** iOS & Android simultaneously via React Native + Expo (TypeScript strict mode, zero `any`).
- **Language:** Global English only for v1.
- **Currency Rules (PRD §4.2.1):** Dew (sleep): ≥85% goal = `100`, 65–84% = `70`, <65% = `40`, bedtime within ±45 min = `+25`; Sunlight (steps): `10` per `1,000` steps, capped at `150/day`, reaching step goal = `+30` bonus.
- **Sanity Bounds (PRD §4.2.1):** Clamp sleep to `[0, 960]` minutes (16h max) and steps to `[0, 60000]`.
- **Compassionate Fog (PRD §4.2.2):** `0` missed days → `fog_level = 0`; `1` missed → `1`; `2–3` missed → `2`; `4+` missed → `3`. Never delete plants. Any 1 valid day (logged sleep or ≥2,000 steps) resets `fog_level = 0`.
- **Pro Expiry Rule (PRD §4.0b):** Already-placed Pro plants remain visible forever; only placing *new* Pro items is gated when `isPro === false`.
- **Accessibility (PRD §6.3):** Every interactive control has `accessibilityLabel` and `accessibilityRole`; respect `useReducedMotion()` for swaying/mist animations.
- **No Guilt Copy:** Never use punitive streak-shaming copy or countdown timers.

---

## Review Focus
1. **Tampered or malformed health inputs** (`sleepMin < 0`, `sleepMin > 960`, `steps < 0`, `steps > 60000`, `NaN`) → clamped silently to valid bounds without throwing or awarding runaway currency *(pinned in Task 2)*.
2. **Duplicate Morning Reveal on the same local calendar date** → strictly idempotent; returns `alreadyRevealed: true` and awards `0` extra Dew/Sunlight *(pinned in Task 3)*.
3. **Expired Pro subscription with already-placed Pro items** → existing Pro placements stay rendered and movable; only buying/placing *unowned* Pro items returns `PRO_REQUIRED` *(pinned in Task 4)*.
4. **Grid boundary, tile collision, or insufficient funds** → placement/purchase fails cleanly with a typed reason (`OUT_OF_BOUNDS`, `TILE_OCCUPIED`, `INSUFFICIENT_FUNDS`) and leaves balances & grid untouched *(pinned in Task 4)*.
5. **Goodnight Lantern crossing midnight or forgotten wake (> 16h)** → computes exact elapsed minutes across calendar dates and clamps to `960` minutes max *(pinned in Task 5)*.

---

## File Structure

```
app/
  _layout.tsx                     # Root Expo Router layout, GestureHandlerRootView, theme
  index.tsx                       # Entry redirect: /onboarding vs /(tabs)/sanctuary
  onboarding.tsx                  # 4-step cozy onboarding (goals, starter seedling, mode)
  (tabs)/
    _layout.tsx                   # Minimal bottom dock navigation
    sanctuary.tsx                 # Main 8x8 isometric Sanctuary Canvas + HUD + Fog + Reveal trigger
    shop.tsx                      # Garden Catalog & Inventory (Free + Pro badged items)
    insights.tsx                  # 7-day Sleep/Step rhythm bars + local Garden Keeper fallback notes
src/
  domain/
    types.ts                      # Shared domain types (Profile, DailyLog, CatalogItem, Placement, FogLevel)
    economy.ts                    # Pure Dew/Sunlight calculation & sanity clamping
    fog.ts                        # Pure Compassionate Fog calculation, Harmony score & recovery
    grid.ts                       # Pure 8x8 isometric grid math, collision/bounds/purchase validation
    lantern.ts                    # Pure Goodnight Lantern session duration & sleep-tier helper
    catalog.ts                    # Seeded v1 Sunlit Meadow catalog (35 items: 18 plants, 10 decor, 7 critters)
    keeperFallback.ts             # Curated rule-based cozy Garden Keeper notes (offline/v1 fallback)
  state/
    useSanctuaryStore.ts          # Zustand + AsyncStorage persisted store (offline-first)
  components/
    IsometricCanvas.tsx           # Pan/zoom 8x8 diamond grid + animated Fog overlay + item sprites
    MorningRevealModal.tsx        # 60-second daily ritual: swipe/tap to clear mist, collect rewards
    GoodnightLanternModal.tsx     # Bedtime wind-down glowing lantern + "I'm Awake" trigger
    ShareProgressCard.tsx         # ViewShot 9:16 / 1:1 stylized garden share card + expo-sharing
    SanctuaryHud.tsx              # Minimal top HUD (Dew, Sunlight, 7-day Harmony pill)
  theme/
    tokens.ts                     # Warm daylight & starlit night palettes, spacing, typography
__tests__/
  domain/
    economy.test.ts
    fog.test.ts
    grid.test.ts
    lantern.test.ts
  state/
    useSanctuaryStore.test.ts
  components/
    MorningRevealModal.test.tsx
```

---

### Task 1: Expo React Native Project Scaffold & Test Harness

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `jest.config.js`, `app/_layout.tsx`, `app/index.tsx`, `src/theme/tokens.ts`, `src/domain/types.ts`

**Interfaces:**
- Produces:
  - `src/domain/types.ts`: exports `TrackingMode`, `FogLevel`, `ItemCategory`, `UserProfile`, `DailyLog`, `CatalogItem`, `GardenPlacement`, `LanternSession`, `MorningRevealInput`, `MorningRevealResult`.
  - `src/theme/tokens.ts`: exports `palette` (day/night warm cozy colors), `spacing`, `radii`.

- [ ] **Step 1: Initialize Expo TypeScript project with Expo Router & dependencies**

Run in workspace root (preserving existing `README.md` and `docs/`):
```bash
npx create-expo-app@latest . --template blank-typescript --no-install
```
(If `create-expo-app` refuses a non-empty directory, scaffold into a temp folder and move `package.json`, `app.json`, `tsconfig.json`, `assets/` into root without overwriting `README.md` or `docs/`.)

Install core packages:
```bash
npx expo install expo-router expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens react-native-reanimated react-native-gesture-handler expo-haptics @react-native-async-storage/async-storage react-native-view-shot expo-sharing
npm install zustand
npm install -D jest jest-expo @testing-library/react-native @types/jest
```

- [ ] **Step 2: Configure strict TypeScript, Expo Router entry, and Jest**
  - Update `tsconfig.json` with `"strict": true` and path alias `"@/*": ["./src/*"]`.
  - Update `package.json` `"main": "expo-router/entry"` and `"scripts": { "test": "jest", "typecheck": "tsc --noEmit" }`.
  - Configure `app.json` scheme `"dewbloom"`, iOS bundleIdentifier `"com.dewbloom.app"`, Android package `"com.dewbloom.app"`.
  - Configure `jest.config.js` with `preset: "jest-expo"`.

- [ ] **Step 3: Create `src/domain/types.ts` and `src/theme/tokens.ts`**
  - Define exact interfaces for `UserProfile` (`sleepGoalMin`, `stepGoal`, `bedtimeTargetMin`, `trackingMode`, `dewBalance`, `sunlightBalance`, `fogLevel`, `isPro`, `onboardingCompleted`), `DailyLog`, `CatalogItem`, `GardenPlacement`, `LanternSession`.
  - Define warm daylight/starlit night cozy tokens in `src/theme/tokens.ts` (WCAG AA contrast pairs).

- [ ] **Step 4: Verify typecheck and Jest boot cleanly**

Run: `npm run typecheck && npm test -- --passWithNoTests`
Expected: PASS (exit code 0, zero TS errors).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo Router app, strict TypeScript, Jest, and domain types"
```

---

### Task 2: Dew & Sunlight Resource Economy (TDD)

**Files:**
- Create: `src/domain/economy.ts`
- Test: `__tests__/domain/economy.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`
- Produces:
  - `clampHealthInput(input: { sleepMin: number; steps: number }): { sleepMin: number; steps: number }`
  - `calculateDewReward(sleepMin: number, sleepGoalMin: number, bedtimeOffsetMin?: number): number`
  - `calculateSunlightReward(steps: number, stepGoal: number): number`

- [ ] **Step 1: Write the failing tests in `__tests__/domain/economy.test.ts`**

```ts
import { clampHealthInput, calculateDewReward, calculateSunlightReward } from '../../src/domain/economy';

describe('economy', () => {
  it('awards 100 Dew for >=85% sleep goal, 70 for 65-84%, 40 for <65%', () => {
    expect(calculateDewReward(450, 450)).toBe(100);
    expect(calculateDewReward(383, 450)).toBe(100); // 85.1%
    expect(calculateDewReward(300, 450)).toBe(70);  // 66.7%
    expect(calculateDewReward(200, 450)).toBe(40);  // 44.4%
  });

  it('adds +25 Dew bedtime bonus when within +/-45 min of target', () => {
    expect(calculateDewReward(450, 450, 30)).toBe(125);
    expect(calculateDewReward(450, 450, -45)).toBe(125);
    expect(calculateDewReward(450, 450, 46)).toBe(100);
  });

  it('awards 10 Sunlight per 1,000 steps, capped at 150 base, +30 step goal bonus', () => {
    expect(calculateSunlightReward(3500, 6000)).toBe(30);
    expect(calculateSunlightReward(6000, 6000)).toBe(90);   // 60 + 30
    expect(calculateSunlightReward(20000, 6000)).toBe(180); // 150 cap + 30
  });

  it('clamps impossible/tampered or NaN health inputs safely', () => {
    expect(clampHealthInput({ sleepMin: -50, steps: -100 })).toEqual({ sleepMin: 0, steps: 0 });
    expect(clampHealthInput({ sleepMin: 1500, steps: 99999 })).toEqual({ sleepMin: 960, steps: 60000 });
    expect(clampHealthInput({ sleepMin: Number.NaN, steps: Number.NaN })).toEqual({ sleepMin: 0, steps: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/domain/economy.test.ts`
Expected: FAIL (cannot find module `../../src/domain/economy`).

- [ ] **Step 3: Implement `src/domain/economy.ts`**
  - Implement `clampHealthInput`, `calculateDewReward`, and `calculateSunlightReward` strictly matching PRD §4.2.1 bounds and tiers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/domain/economy.test.ts`
Expected: PASS (4/4 tests passing).

- [ ] **Step 5: Commit**

```bash
git add src/domain/economy.ts __tests__/domain/economy.test.ts
git commit -m "feat(domain): add Dew/Sunlight reward economy with sanity clamping"
```

---

### Task 3: Compassionate Morning Fog, Harmony Score & Idempotent Daily Reveal (TDD)

**Files:**
- Create: `src/domain/fog.ts`, `src/domain/keeperFallback.ts`
- Test: `__tests__/domain/fog.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`, `src/domain/economy.ts`
- Produces:
  - `calculateFogLevel(missedDays: number): FogLevel` (`0 | 1 | 2 | 3`)
  - `calculateHarmonyScore(recentLogs: DailyLog[], windowDays?: number): { restfulDays: number; windowDays: number }`
  - `processMorningReveal(params: { dateKey: string; existingLogs: Record<string, DailyLog>; sleepMin: number; steps: number; bedtimeOffsetMin?: number; profile: UserProfile }): MorningRevealResult`
  - `pickKeeperFallbackNote(sleepMin: number, sleepGoalMin: number, steps: number, fogCleared: boolean): string`

- [ ] **Step 1: Write the failing tests in `__tests__/domain/fog.test.ts`**

```ts
import { calculateFogLevel, calculateHarmonyScore, processMorningReveal } from '../../src/domain/fog';

describe('fog & morning reveal', () => {
  it('maps missed days to compassionate fog levels 0..3', () => {
    expect(calculateFogLevel(0)).toBe(0);
    expect(calculateFogLevel(1)).toBe(1);
    expect(calculateFogLevel(2)).toBe(2);
    expect(calculateFogLevel(3)).toBe(2);
    expect(calculateFogLevel(4)).toBe(3);
    expect(calculateFogLevel(20)).toBe(3);
  });

  it('clears fog to 0 on any valid day and returns non-empty keeper note', () => {
    const res = processMorningReveal({
      dateKey: '2026-11-24',
      existingLogs: {},
      sleepMin: 460,
      steps: 6500,
      profile: { sleepGoalMin: 450, stepGoal: 6000, fogLevel: 3, dewBalance: 0, sunlightBalance: 0, isPro: false, trackingMode: 'phone_only', onboardingCompleted: true },
    });
    expect(res.alreadyRevealed).toBe(false);
    expect(res.newFogLevel).toBe(0);
    expect(res.dewAwarded).toBe(100);
    expect(res.sunlightAwarded).toBe(90);
    expect(res.keeperNote.length).toBeGreaterThan(10);
  });

  it('is strictly idempotent if Morning Reveal already ran for the same local dateKey', () => {
    const existingLog = { dateKey: '2026-11-24', sleepMin: 450, steps: 6000, dewAwarded: 100, sunlightAwarded: 90, revealedAt: '2026-11-24T08:00:00Z', aiInsight: 'Nice rest!' };
    const res = processMorningReveal({
      dateKey: '2026-11-24',
      existingLogs: { '2026-11-24': existingLog },
      sleepMin: 480,
      steps: 8000,
      profile: { sleepGoalMin: 450, stepGoal: 6000, fogLevel: 0, dewBalance: 100, sunlightBalance: 90, isPro: false, trackingMode: 'phone_only', onboardingCompleted: true },
    });
    expect(res.alreadyRevealed).toBe(true);
    expect(res.dewAwarded).toBe(0);
    expect(res.sunlightAwarded).toBe(0);
  });

  it('calculates rolling 7-day Harmony score without strict streak resets', () => {
    const logs = Array.from({ length: 5 }, (_, i) => ({
      dateKey: `2026-11-2${i}`, sleepMin: 420, steps: 5000, dewAwarded: 100, sunlightAwarded: 50, revealedAt: '2026-11-20T08:00:00Z', aiInsight: '',
    }));
    expect(calculateHarmonyScore(logs, 7)).toEqual({ restfulDays: 5, windowDays: 7 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/domain/fog.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/domain/fog.ts` and `src/domain/keeperFallback.ts`**
  - Add 20+ warm, guilt-free, curated notes in `keeperFallback.ts` keyed by sleep tier, step milestone, and fog-cleared state.
  - Implement `calculateFogLevel`, `calculateHarmonyScore`, and idempotent `processMorningReveal` in `src/domain/fog.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/domain/fog.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/domain/fog.ts src/domain/keeperFallback.ts __tests__/domain/fog.test.ts
git commit -m "feat(domain): add compassionate fog recovery, harmony score, and idempotent reveal"
```

---

### Task 4: Sanctuary 8x8 Isometric Grid, Seeded Catalog & Pro-Safe Placement Rules (TDD)

**Files:**
- Create: `src/domain/catalog.ts`, `src/domain/grid.ts`
- Test: `__tests__/domain/grid.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`
- Produces:
  - `GRID_SIZE = 8`
  - `SUNLIT_MEADOW_CATALOG: readonly CatalogItem[]` (35 items: 18 plants, 10 decor, 7 critters; 15 Free, 20 Pro)
  - `gridToScreen(x: number, y: number, tileWidth: number, tileHeight: number): { sx: number; sy: number }`
  - `validateAndPlaceItem(params: { item: CatalogItem; x: number; y: number; placements: GardenPlacement[]; ownedItemIds: string[]; dewBalance: number; sunlightBalance: number; isPro: boolean }): { ok: true; nextPlacements: GardenPlacement[]; nextDew: number; nextSunlight: number; nextOwnedIds: string[] } | { ok: false; reason: 'OUT_OF_BOUNDS' | 'TILE_OCCUPIED' | 'INSUFFICIENT_FUNDS' | 'PRO_REQUIRED' }`
  - `movePlacement(placements: GardenPlacement[], placementId: string, toX: number, toY: number): { ok: true; nextPlacements: GardenPlacement[] } | { ok: false; reason: 'NOT_FOUND' | 'OUT_OF_BOUNDS' | 'TILE_OCCUPIED' }`

- [ ] **Step 1: Write the failing tests in `__tests__/domain/grid.test.ts`**

```ts
import { SUNLIT_MEADOW_CATALOG } from '../../src/domain/catalog';
import { GRID_SIZE, gridToScreen, validateAndPlaceItem, movePlacement } from '../../src/domain/grid';

describe('sanctuary grid & catalog', () => {
  it('seeds exactly 35 Sunlit Meadow catalog items (18 plants, 10 decor, 7 critters)', () => {
    expect(SUNLIT_MEADOW_CATALOG).toHaveLength(35);
    expect(SUNLIT_MEADOW_CATALOG.filter(i => i.category === 'plant')).toHaveLength(18);
    expect(SUNLIT_MEADOW_CATALOG.filter(i => i.category === 'decor')).toHaveLength(10);
    expect(SUNLIT_MEADOW_CATALOG.filter(i => i.category === 'critter')).toHaveLength(7);
  });

  it('rejects out-of-bounds, occupied tile, and insufficient funds cleanly', () => {
    const freeItem = SUNLIT_MEADOW_CATALOG.find(i => !i.isPro)!;
    expect(validateAndPlaceItem({ item: freeItem, x: GRID_SIZE, y: 0, placements: [], ownedItemIds: [], dewBalance: 500, sunlightBalance: 500, isPro: false })).toEqual({ ok: false, reason: 'OUT_OF_BOUNDS' });
    expect(validateAndPlaceItem({ item: freeItem, x: 2, y: 2, placements: [{ id: 'p1', itemId: freeItem.id, x: 2, y: 2, placedAt: '' }], ownedItemIds: [], dewBalance: 500, sunlightBalance: 500, isPro: false })).toEqual({ ok: false, reason: 'TILE_OCCUPIED' });
    expect(validateAndPlaceItem({ item: freeItem, x: 1, y: 1, placements: [], ownedItemIds: [], dewBalance: 0, sunlightBalance: 0, isPro: false })).toEqual({ ok: false, reason: 'INSUFFICIENT_FUNDS' });
  });

  it('blocks buying unowned Pro item when isPro=false, but allows moving already-placed Pro items', () => {
    const proItem = SUNLIT_MEADOW_CATALOG.find(i => i.isPro)!;
    expect(validateAndPlaceItem({ item: proItem, x: 1, y: 1, placements: [], ownedItemIds: [], dewBalance: 999, sunlightBalance: 999, isPro: false })).toEqual({ ok: false, reason: 'PRO_REQUIRED' });
    const moved = movePlacement([{ id: 'p-pro', itemId: proItem.id, x: 1, y: 1, placedAt: '' }], 'p-pro', 3, 4);
    expect(moved.ok).toBe(true);
  });

  it('converts isometric grid coordinates to 2:1 diamond screen coordinates', () => {
    expect(gridToScreen(0, 0, 64, 32)).toEqual({ sx: 0, sy: 0 });
    expect(gridToScreen(1, 0, 64, 32)).toEqual({ sx: 32, sy: 16 });
    expect(gridToScreen(0, 1, 64, 32)).toEqual({ sx: -32, sy: 16 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/domain/grid.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/domain/catalog.ts` and `src/domain/grid.ts`**
  - Seed the 35 Sunlit Meadow items (unique slugs, cozy names, emoji/vector icon keys for v1 placeholder sprites until final WebP art swaps in, balanced Dew/Sunlight costs).
  - Implement `gridToScreen`, `validateAndPlaceItem`, and `movePlacement` in `src/domain/grid.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/domain/grid.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/domain/catalog.ts src/domain/grid.ts __tests__/domain/grid.test.ts
git commit -m "feat(domain): add 35-item Sunlit Meadow catalog and 8x8 isometric grid rules"
```

---

### Task 5: Phone-Only Goodnight Lantern Logic (TDD)

**Files:**
- Create: `src/domain/lantern.ts`
- Test: `__tests__/domain/lantern.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`, `src/domain/economy.ts`
- Produces:
  - `startLanternSession(startedAtIso: string): LanternSession`
  - `completeLanternSession(session: LanternSession, endedAtIso: string): { sleepMin: number; isValidRest: boolean }`

- [ ] **Step 1: Write the failing tests in `__tests__/domain/lantern.test.ts`**

```ts
import { startLanternSession, completeLanternSession } from '../../src/domain/lantern';

describe('Goodnight Lantern', () => {
  it('computes accurate sleep minutes across midnight', () => {
    const s = startLanternSession('2026-11-24T22:30:00Z');
    const res = completeLanternSession(s, '2026-11-25T06:30:00Z');
    expect(res).toEqual({ sleepMin: 480, isValidRest: true });
  });

  it('clamps forgotten wake (>16h) to 960 minutes and rejects negative duration', () => {
    const s = startLanternSession('2026-11-24T22:00:00Z');
    expect(completeLanternSession(s, '2026-11-26T10:00:00Z')).toEqual({ sleepMin: 960, isValidRest: true });
    expect(completeLanternSession(s, '2026-11-24T21:00:00Z')).toEqual({ sleepMin: 0, isValidRest: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/domain/lantern.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/domain/lantern.ts`**
  - Compute elapsed minutes via UTC epoch delta, clamp `[0, 960]`, mark `isValidRest = sleepMin >= 60`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/domain/lantern.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add src/domain/lantern.ts __tests__/domain/lantern.test.ts
git commit -m "feat(domain): add phone-only Goodnight Lantern sleep session logic"
```

---

### Task 6: Offline-First Persisted Zustand Store (TDD)

**Files:**
- Create: `src/state/useSanctuaryStore.ts`
- Test: `__tests__/state/useSanctuaryStore.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts`, `src/domain/fog.ts`, `src/domain/grid.ts`, `src/domain/lantern.ts`, `src/domain/catalog.ts`
- Produces:
  - `useSanctuaryStore` with state (`profile`, `placements`, `ownedItemIds`, `dailyLogs`, `activeLantern`, `pendingReveal`) and actions:
    - `completeOnboarding(input: { sleepGoalMin: number; stepGoal: number; starterItemId: string; trackingMode: TrackingMode }): void`
    - `triggerMorningReveal(input: { dateKey: string; sleepMin: number; steps: number; bedtimeOffsetMin?: number }): MorningRevealResult`
    - `placeCatalogItem(itemId: string, x: number, y: number): ReturnType<typeof validateAndPlaceItem>`
    - `movePlacedItem(placementId: string, toX: number, toY: number): ReturnType<typeof movePlacement>`
    - `startLantern(nowIso?: string): void`
    - `finishLantern(nowIso?: string, steps?: number): MorningRevealResult | null`
    - `resetAllData(): void`

- [ ] **Step 1: Write failing store integration test in `__tests__/state/useSanctuaryStore.test.ts`**
  - Test onboarding places starter seedling at center `(3, 3)` and sets `onboardingCompleted: true`.
  - Test `triggerMorningReveal` credits Dew/Sunlight once and ignores duplicate same-day calls.
  - Test `placeCatalogItem` deducts currency and appends placement.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/state/useSanctuaryStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/state/useSanctuaryStore.ts`**
  - Use Zustand `persist` middleware backed by `AsyncStorage` (`storage: createJSONStorage(() => AsyncStorage)`), delegating all math strictly to `src/domain/*`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/state/useSanctuaryStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/useSanctuaryStore.ts __tests__/state/useSanctuaryStore.test.ts
git commit -m "feat(state): add offline-first Zustand sanctuary store with AsyncStorage persistence"
```

---

### Task 7: Onboarding Flow & Root Navigation

**Files:**
- Modify: `app/_layout.tsx`, `app/index.tsx`
- Create: `app/onboarding.tsx`, `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useSanctuaryStore.completeOnboarding`, `SUNLIT_MEADOW_CATALOG`, `src/theme/tokens.ts`
- Produces: Complete 4-step cozy onboarding flow redirecting into `/(tabs)/sanctuary`.

- [ ] **Step 1: Build `app/onboarding.tsx`**
  - Step 1: Warm welcome preview ("Your sleep & steps grow a living sanctuary").
  - Step 2: Sleep goal (6h–10h, default 7.5h) & daily step goal (2,000–15,000, default 6,000) adjusters.
  - Step 3: Pick 1 of 3 starter seedlings (Lavender, Bonsai Sprout, Sunlit Fern).
  - Step 4: Tracking mode selection ("Health Sync — coming in Plan 3" or "Phone-Only Goodnight Lantern" ready today), calling `completeOnboarding` and routing to `/(tabs)/sanctuary`.
  - Include `accessibilityLabel` and `accessibilityRole` on every button.

- [ ] **Step 2: Wire `app/index.tsx` and `app/(tabs)/_layout.tsx`**
  - `app/index.tsx` redirects to `/onboarding` if `!profile.onboardingCompleted`, else `/(tabs)/sanctuary`.
  - `app/(tabs)/_layout.tsx` renders 3 calm tabs: **Sanctuary**, **Shop**, **Insights**.

- [ ] **Step 3: Verify typecheck and all tests pass**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/index.tsx app/onboarding.tsx app/(tabs)/_layout.tsx
git commit -m "feat(ui): add 4-step cozy onboarding flow and tab navigation"
```

---

### Task 8: Playable Sanctuary Canvas, Morning Reveal, Goodnight Lantern, Shop, Insights & Share Card

**Files:**
- Create: `src/components/SanctuaryHud.tsx`, `src/components/IsometricCanvas.tsx`, `src/components/MorningRevealModal.tsx`, `src/components/GoodnightLanternModal.tsx`, `src/components/ShareProgressCard.tsx`
- Create: `app/(tabs)/sanctuary.tsx`, `app/(tabs)/shop.tsx`, `app/(tabs)/insights.tsx`
- Test: `__tests__/components/MorningRevealModal.test.tsx`

**Interfaces:**
- Consumes: `useSanctuaryStore`, `gridToScreen`, `SUNLIT_MEADOW_CATALOG`, `calculateHarmonyScore`
- Produces: Full playable v1 offline loop on iOS & Android + shareable 9:16/1:1 progress card.

- [ ] **Step 1: Write failing component test in `__tests__/components/MorningRevealModal.test.tsx`**
  - Verify modal renders sleep summary, Dew/Sunlight earned, AI Garden Keeper note, and calls `onClearMist` when the "Clear Morning Mist" button is pressed.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/MorningRevealModal.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement UI components and screens**
  - `SanctuaryHud.tsx`: Dew balance, Sunlight balance, 7-day Harmony pill (`"X of 7 restful days"`).
  - `IsometricCanvas.tsx`: Interactive 8x8 diamond grid with pan/zoom (`GestureHandler`), tap-to-place/move mode, subtle fog overlay driven by `fogLevel` (respecting `useReducedMotion()`).
  - `MorningRevealModal.tsx`: Interactive mist-clearing button with `expo-haptics` success feedback, reward summary, and Garden Keeper 1-line note.
  - `GoodnightLanternModal.tsx`: Warm starlit lantern screen (`Start Goodnight Lantern` / `I'm Awake — Reveal Morning`).
  - `ShareProgressCard.tsx`: Captures garden snapshot + stats via `react-native-view-shot` and shares via `expo-sharing`.
  - `app/(tabs)/sanctuary.tsx`: Combines HUD, IsometricCanvas, Lantern trigger, Morning Reveal trigger, and Share modal.
  - `app/(tabs)/shop.tsx`: Filterable catalog (Plants / Decor / Critters) with Free vs. Pro badges and 1-tap select-to-place.
  - `app/(tabs)/insights.tsx`: 7-day visual sleep & step bars + Garden Keeper insight card + Demo "Simulate Morning Reveal" dev button (under `__DEV__`) for instant QA on simulators.

- [ ] **Step 4: Run full verification suite**

Run: `npm run typecheck && npm test`
Expected: PASS (all unit + component tests passing, zero TS errors).

- [ ] **Step 5: Commit**

```bash
git add src/components/ app/\(tabs\)/ __tests__/components/
git commit -m "feat(ui): build playable Sanctuary Canvas, Morning Reveal, Lantern, Shop, Insights & Share Card"
```
