# Plan 3: Native Health Sync, RevenueCat 7-Day Trial Paywall, Analytics, Widget Bridge & UX Motion Polish

> **For agentic workers:** Orchestrated by **Gemini 4 Neon (Medium)** and executed in parallel isolated `share` worktrees by **Gemini 4 Hydrogen (Medium)** swarm workers (`ux-motion-worker` + `plan3-worker`).

**Goal:** Complete the v1.0 MVP by adding Apple HealthKit / Android Health Connect passive sync adapters, RevenueCat Freemium + 7-Day Trial Paywall ($19.99/yr, $2.99/mo, $39.99 Lifetime), privacy-first PostHog analytics, Home Screen Widget snapshot bridge, and a full `/ux-motion` + `unslop-ui` tactile animation polish pass.

**Spec:** [docs/prd.md](../../prd.md) (§4.0b, §4.1.2, §5.1, §6.5) · **Design System:** [design-system/dew-and-bloom/MASTER.md](../../../design-system/dew-and-bloom/MASTER.md) · **Figma:** https://www.figma.com/design/kWT8rNHi5C7hcQ3qT1mX1i

---

## Parallel Worktree Streams (Zero File Overlap)

### Stream A — `ux-motion-worker` (Isolated `share` worktree)
Applies `/ux-motion` principles (#1 Squash & Stretch, #3 Stagger, #4 Follow Through, #5 Slow In/Out, #7 Secondary Action, #8 Snappy Timing, #10 Solid Drawing, #13 Rubber Banding, #17 Interruptible Motion, #18 Fast Closing, #19 Peak-End, #20 Frequency of Use + `useReducedMotion()`):
- `src/theme/tokens.ts`: Add cubic-bezier & spring motion tokens (`easings`, `springs`).
- `src/components/ui/BotanicalButton.tsx`: Tactile 3D-lite press depth (`translateY: 1.5`, top edge highlight, interruptible spring release).
- `src/components/IsometricCanvas.tsx`: Newly planted item squash-and-stretch pop (`scaleX: 1.12, scaleY: 0.88` → spring settle) + rubber-band edge resistance on pan/pinch.
- `src/components/MorningRevealModal.tsx`: Spring sheet entrance with follow-through, 45ms staggered reward chips, fast-closing mist clear (`140ms`).
- `src/components/SanctuaryHud.tsx`: Secondary scale pulse (`1.0 → 1.08 → 1.0`) when Dew/Sunlight increases.
- `app/(tabs)/shop.tsx` & `app/(tabs)/insights.tsx`: Staggered first-6 card entrance (<280ms total) and animated 7-day rhythm bars.

### Stream B — `plan3-worker` (Isolated `share` worktree)
Builds Plan 3 services, unit tests, and the Honest 7-Day Trial Paywall:
- `src/services/healthService.ts` + `__tests__/services/healthService.test.ts`: Passive Apple HealthKit (iOS) & Android Health Connect adapter interface with graceful Expo Go / Simulator fallback (never crashes in Expo Go).
- `src/services/purchasesService.ts` + `__tests__/services/purchasesService.test.ts`: RevenueCat offering/trial/restore wrapper (`annual_pro` $19.99/yr 7-day trial, `monthly_pro` $2.99/mo, `lifetime_pro` $39.99) with safe sandbox fallback in Expo Go.
- `src/services/analyticsService.ts`: Privacy-first PostHog event queue implementing PRD §5.1 events while strictly excluding PII/health metrics from ad SDKs.
- `src/services/widgetBridge.ts` + `__tests__/services/widgetBridge.test.ts`: Serializes compact live sanctuary widget snapshot for iOS WidgetKit (`AppGroup`) & Android Glance.
- `app/paywall.tsx`: Studio-grade Honest 7-Day Trial Paywall matching Figma Screen 5 (`MASTER.md`, Von Restorff highlight on Annual Pro, clean `"Continue with free basic garden"` button, zero guilt copy).
