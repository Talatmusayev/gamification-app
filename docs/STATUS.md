# Dewy (`dew-and-bloom`) — Live Status, Roadmap & Changelog

> **Single source of truth for agents & contributors.** Keep this file lean and updated whenever a milestone lands, a live URL changes, or an external service is connected.

---

## 1. Current Architecture & Environment Breadcrumbs

* **App Package / Bundle ID:** `com.dewy.garden` (`scheme: dewy`)
* **Mobile Stack:** Expo SDK `~58`, React Native `0.88`, `expo-router`, Reanimated `4.7`, `react-native-svg`, Zustand (`useSanctuaryStore`), Jest (`18` suites / `108` tests).
* **Marketing & Legal Site (`web/`):** Vite + React 19 + `@react-three/fiber` (`web/src/`).
  * **Live Production URL:** https://dewy-garden.vercel.app
  * **Privacy Policy:** https://dewy-garden.vercel.app/privacy
  * **Terms of Use:** https://dewy-garden.vercel.app/terms
  * **AdMob Verification:** https://dewy-garden.vercel.app/app-ads.txt *(placeholder `pub-0000000000000000` until AdMob publisher ID is set)*
* **Supabase Project:** `gsczgklgwhpotzylvlsf`
  * Live Edge Functions: `dew-garden-keeper-insight`, `dew-delete-account`
  * Repo-ready (not yet deployed): `supabase/functions/identify-plant/index.ts`, `supabase/functions/dew-revenuecat-webhook/index.ts`
* **Monetization Mode (`sandbox` vs `live`):**
  * **RevenueCat** (`src/services/nativePurchasesProvider.ts`) and **AdMob** (`src/services/rewardedAdsService.ts`) are wired in TypeScript, but **`react-native-purchases` and `react-native-google-mobile-ads` are NOT yet installed in `package.json`**, and `EXPO_PUBLIC_REVENUECAT_*` / `EXPO_PUBLIC_ADMOB_*` keys are unset in `.env`.
  * In Expo Go and tests, purchases/ads/health cleanly fall back to local sandbox mode.
* **Key Rules & Docs:**
  * Design system: [design-system/dew-and-bloom/MASTER.md](../design-system/dew-and-bloom/MASTER.md) (`Lora` + `Plus Jakarta Sans`, warm linen `#FAF8F4`, moss `#365E44`, dew `#376675`, amber `#98601A`/`#E3B261`; zero purple/violet chrome, zero emojis, zero exclamation marks).
  * Monetization plan: [docs/monetization-strategy.md](./monetization-strategy.md)
  * Store submission guide: [docs/launch/release-runbook.md](./launch/release-runbook.md)

---

## 2. Release Roadmap

- [x] **MVP App Core & Hay Day-style Isometric Sanctuary** — 8×8 meadow, stepped terraces, conservatory/postbox/pier/wishing well landmarks, Morning Reveal, Goodnight Lantern, Duo Shared Meadow, Share Card.
- [x] **Onboarding Psychology & Paywall Compliance** — Sanctuary naming & Pip greeting, projected morning reward preview, interactive first-drop sprout ritual (`1/3 → 2/3`), read-only health privacy pledge, 72h no-card Sunlit Guest Pass, 7-day trial timeline, Guideline 3.1.2 Terms/Privacy links.
- [x] **Launch Site (`web/`) Deployed to Vercel** — Live at `https://dewy-garden.vercel.app` with 3D R3F island, Liquid Glass Day/Twilight toggle, cropped Stageshow iPhone previews, animated pricing, waitlist, `/privacy`, `/terms`, `/app-ads.txt`.
- [ ] **Step 3 — Cloud Accounts & Store SKUs:** Configure RevenueCat (`annual_pro` `$19.99/yr` + 7-day trial, `monthly_pro` `$2.99/mo`, `lifetime_pro` `$39.99`), Apple App Store Connect, Google Play Console, and optional AdMob (`app-ads.txt`).
- [ ] **Step 4 — Supabase Edge Functions:** Set `REVENUECAT_WEBHOOK_SECRET` and deploy `dew-revenuecat-webhook` & `identify-plant` to `gsczgklgwhpotzylvlsf`.
- [ ] **Step 5 — Native SDKs & EAS Cloud Builds:** `npx expo install react-native-purchases react-native-google-mobile-ads`, populate EAS env secrets, run `npm run preflight`, cut Android preview `.apk` (for `/phone-use` real-device QA), Android `.aab` (14-day Play closed test), and iOS TestFlight `.ipa`.
- [ ] **Post-v1.0 (v1.1):** Native SwiftUI WidgetKit & Kotlin Glance widget extensions (`widgetBridge` already persists snapshots), `expo-notifications` offline Day-5 trial reminder, and optional 2.5D illustrated PNG/Rive sprites.

---

## 3. Changelog

* **2026-11-25 (`754c1e5`, `51c0e57`, `7c3aa0a`):** Deployed `web/` to Vercel (`https://dewy-garden.vercel.app`), added `/terms` & `/privacy` rewrites + [web/public/terms.html](../web/public/terms.html), upgraded onboarding with sanctuary naming, first-drop sprout watering, and health privacy pledge, and added Guideline 3.1.2 links on `app/paywall.tsx`.
* **2026-11-25 (`3bc9a07`):** Upgraded `web/` with `/design-taste-frontend`, `/stageshow` iPhone previews, `21st.dev` Liquid Glass Day/Twilight toggle (`LiquidDayNightToggle`) and animated pricing (`PriceTicker`), custom `<MeadowFireflies>`, and Playwright visual verification (`0` console errors/warnings).
* **2026-11-25 (`628b11d` / `c93979c` / `71c1935`):** Merged Phase A (*Hay Day* living diorama, progressive landmarks, `/ux-motion` springs, scenic `ShareProgressCard`) and Phase B (72h Sunlit Guest Pass, 2-step paywall, live health/sync hooks, `dew-revenuecat-webhook`).
