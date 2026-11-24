# Dew & Bloom

**Your sleep and daily steps passively grow a cozy, living isometric sanctuary on your phone — zero manual logging, zero punishing streaks.**

Restful nights gather **Morning Dew**, and daily walks bring **Warm Sunlight**. Missing a day never kills a streak; instead, a soft morning mist settles over your 8×8 meadow and clears naturally on your next good rest.

- **Figma Design System & Mockups:** https://www.figma.com/design/kWT8rNHi5C7hcQ3qT1mX1i
- **Product Spec:** [docs/prd.md](docs/prd.md)
- **Design Tokens & Rules:** [design-system/dew-and-bloom/MASTER.md](design-system/dew-and-bloom/MASTER.md)

---

## Stack

- **Mobile:** React Native `0.88` + Expo SDK `58` + Expo Router (iOS & Android)
- **Animations & Graphics:** `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `lucide-react-native`, `expo-haptics`
- **State & Persistence:** Zustand (`persist` + `AsyncStorage`)
- **Backend & Auth:** Supabase (`dew_*` isolated schema with Row-Level Security)
- **Health & Monetization:** Apple HealthKit / Android Health Connect + Goodnight Lantern fallback, RevenueCat (7-day free trial), PostHog (PII-scrubbed analytics)
- **Testing & Types:** TypeScript (`strict`), Jest + `jest-expo` + `@testing-library/react-native`

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Expo dev server (iOS, Android, or Web)
npx expo start

# 3. Run typecheck and unit/component tests
npm run typecheck && npm test
```

### Environment Variables (`.env`)

All external services degrade gracefully in local/Expo Go development when env vars are unset:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=...
EXPO_PUBLIC_POSTHOG_KEY=...
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## Architecture Map

```text
app/
├── index.tsx                 # Hydration gate & onboarding redirect
├── onboarding.tsx            # 4-step rhythm, seedling & health/lantern setup → Paywall
├── paywall.tsx               # Honest 7-day trial & Pro plans (source-aware routing)
├── auth.tsx                  # Email sign-in / sign-up
├── settings.tsx              # Goal adjustments, cloud sync & 1-tap account deletion
└── (tabs)/
    ├── sanctuary.tsx         # 8×8 isometric meadow, Morning Reveal, Lantern & Share
    ├── shop.tsx              # Sunlit Meadow catalog (plants, decor, critters)
    └── insights.tsx          # AI Garden Keeper reflections & 7/30-day rhythm bars

src/
├── domain/                   # Pure TypeScript game & economy logic (catalog, fog, grid, lantern)
├── state/                    # Zustand store + automatic widget snapshot persistence
├── services/                 # Supabase sync, HealthKit/Health Connect, RevenueCat, PostHog, Widget bridge
├── components/               # SanctuaryHud, IsometricCanvas, MorningRevealModal, ShareProgressCard, UI kit
└── theme/                    # Locked palette, typography (Lora + Plus Jakarta Sans), spacing & motion tokens
```

---

## Supabase Isolated `dew_*` Setup

Dew & Bloom uses a dedicated `dew_` table prefix so it can coexist cleanly alongside other schemas in a shared Supabase project:

- Migration file: [`supabase/migrations/202611240001_dew_bloom_schema.sql`](supabase/migrations/202611240001_dew_bloom_schema.sql)
- Tables: `dew_profiles`, `dew_daily_logs`, `dew_catalog_items`, `dew_garden_placements`, `dew_subscriptions`
- All tables enforce Row-Level Security (`auth.uid() = user_id`), and `dew_profiles` includes a trigger protecting server-owned balances.

Apply the migration via the Supabase CLI or SQL Editor:

```bash
supabase db push
```

---

## EAS Build & Store Submission

`eas.json` is configured for simultaneous iOS and Android builds:

```bash
# Internal TestFlight & Android APK preview build
eas build --platform all --profile preview

# Production App Store (IPA) & Google Play (AAB) build
eas build --platform all --profile production

# Submit latest production builds to App Store Connect & Google Play Console
eas submit --platform all --profile production
```

Store listing copy, ASO keywords, UGC scripts, and privacy policy are in [`docs/launch/`](docs/launch/app-store-listing.md).
