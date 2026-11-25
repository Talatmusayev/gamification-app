# Dewy (Dew & Bloom) — Hybrid Cozy Monetization Playbook

Dewy monetizes with a high-trust, zero-guilt **Hybrid Cozy** model designed for Health & Fitness retention: full daily sleep and step care is free forever, supported by opt-in non-personalized rewarded video ads for free players, a **7-day upfront free trial**, and a **3-day no-card Sunlit Guest Pass reverse trial** for onboarding explorers.

---

## 1. Free vs. Paid Pro Boundaries

| Capability | Free Meadow | Sunlit Guest Pass (72h Reverse Trial) | Dewy Pro (`$19.99/yr` · `$2.99/mo` · `$39.99` Lifetime) |
|---|---|---|---|
| **Core Sleep & Step Tracking** | Unlimited (HealthKit, Health Connect, Goodnight Lantern, 2-tap check-in) | Unlimited | Unlimited |
| **Compassionate Morning Fog** | Zero plant deletion, 1-day recovery | Zero plant deletion, 1-day recovery | Zero plant deletion, 1-day recovery |
| **Catalog Items (`SUNLIT_MEADOW_CATALOG`)** | 15 Core species (8 plants, 5 decor, 2 critters) | All 35 species (including 20 Pro plants, lanterns, ponds, critters) | All 35+ species |
| **Meadow Almanac & Insights** | 7-day rolling charts + curated/AI Keeper notes | 30-day deeper rhythm summary + live AI Keeper notes | 30-day deeper rhythm summary + live AI Keeper notes |
| **Cozy Rewarded Dew Video Ads** | Opt-in (`+20 Dew`, max `3/day`) | Optional opt-in (`+20 Dew`, max `3/day`) | Completely ad-free (`0` ad prompts) |
| **Duo Shared Meadow** | Join as a partner | Preview Pro catalog in personal meadow | Host Duo Shared Gardens |
| **Home Screen Widget** | Live `WidgetSnapshot` sync | Live `WidgetSnapshot` sync | Live `WidgetSnapshot` sync |

---

## 2. Day-0 Welcome Economy & Reverse Trial

1. **Starter Welcome Pouch (`completeOnboarding`)**:
   - New sanctuaries start with **`60 Dew`**, **`60 Sunlight`**, and a **3-item Starter Nook** (chosen seedling + `Stepping Stone` + `Meadow Daisy`) so the canvas feels alive on first launch.
2. **Honest 2-Step Onboarding Paywall (`app/paywall.tsx?source=onboarding`)**:
   - Opens immediately after onboarding step 4 (including native `requestHealthPermissions()` when `health_sync` is selected).
   - Leads clearly with **2 primary plans**:
     - **Annual Pro (`$19.99/yr` · `$1.66 / month · Save 44%` · 7-day free trial)** — recommended default.
     - **Monthly Pro (`$2.99/mo`)** — flexible monthly option.
     - **Lifetime Pro (`$39.99 once`)** — tucked into a compact one-time pill below to keep decision load low.
   - Displays a **3-step Honest Trial Timeline** (*Today* full unlock -> *Day 5* optional reminder -> *Day 7* billing, cancel anytime) and an opt-in **Remind me 2 days before trial ends** checkbox (`trialReminderOptIn`).
   - Strictly complies with Apple App Review (Feb 2026): **no free-trial toggle switch** anywhere in the paywall.
3. **3-Day Sunlit Guest Pass Reverse Trial (`src/domain/subscription.ts`)**:
   - Tapping **"Continue with free basic garden"** (or closing the onboarding paywall) triggers `activateGuestPass()`, granting a **one-time 72-hour no-card Sunlit Guest Pass** (`guestPassEndsAt`, `guestPassUsed: true`).
   - During those 72 hours, `hasProAccess(profile)` unlocks Pro catalog placement and 30-day Almanac insights.
   - **Zero-Guilt Expiry:** When the 72-hour pass expires, **zero placed Pro plants or critters are ever removed** (`ZERO_GUILT_EXPIRY_POLICY`). Owned/placed items stay in the meadow forever; only unowned Pro catalog items lock behind Pro until upgrade.

---

## 3. Opt-In Non-Personalized Rewarded Ads (`src/services/rewardedAdsService.ts`)

- **Reward & Cap:** `+20 Dew` per completed video watch, capped at **`3` watches/day** (`60 Dew/day` max).
- **Privacy & Policy Compliance (`NON_PERSONALIZED_ONLY = true`):**
  - Strictly non-personalized ad requests (`requestNonPersonalizedAdsOnly: true`).
  - Zero sleep, step, or personal health metrics ever leave the device or touch ad SDKs (Apple App Store Guideline 5.1.3 & Google Health Connect policy).
- **Pro Immunity:** Paid Pro users (`profile.isPro === true`) are blocked at the service layer (`reason: 'pro_user'`) and never see rewarded ad banners in Shop or Field Snap.

---

## 4. RevenueCat & Supabase Production Setup

1. **Client Environment Variables**:
   - `EXPO_PUBLIC_REVENUECAT_IOS_KEY` — RevenueCat Apple App Store public SDK key.
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` — RevenueCat Google Play public SDK key.
   - `EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS` / `EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID` — AdMob rewarded unit IDs (leave blank in Expo Go / tests for clean 600ms sandbox simulation).
2. **RevenueCat Dashboard Mapping (`src/services/nativePurchasesProvider.ts`)**:
   - Entitlement identifier: `pro`
   - Default offering (`default`) packages matching identifiers containing `annual`, `month`, and `lifetime`:
     - `annual_pro` (`$19.99/yr`, 7-day introductory free trial)
     - `monthly_pro` (`$2.99/mo`)
     - `lifetime_pro` (`$39.99` non-consumable)
   - Set RevenueCat `app_user_id` to the authenticated Supabase `auth.users.id` UUID when signed in so webhook updates map directly.
3. **Supabase Webhook Edge Function (`supabase/functions/dew-revenuecat-webhook/index.ts`)**:
   - Deploy function: `supabase functions deploy dew-revenuecat-webhook --no-verify-jwt`
   - Configure Edge Function secrets:
     - `REVENUECAT_WEBHOOK_AUTH_TOKEN` — bearer token configured in RevenueCat Webhooks Authorization header.
     - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — automatically available in Supabase Edge Functions (required so `dew_profiles.is_pro` updates bypass the `authenticated` trigger guard).
     - Optional `TRIAL_REMINDER_WEBHOOK_URL` / `TRIAL_REMINDER_WEBHOOK_SECRET` — receives Day-5 (`expiration_at_ms - 48h`) scheduling hooks for `INITIAL_PURCHASE` trials.
   - Handled events: `INITIAL_PURCHASE`, `RENEWAL`, `TRIAL_CONVERTED`, `CANCELLATION` (preserves `is_pro` until `expiration_at_ms`), `EXPIRATION`, and `NON_RENEWING_PURCHASE`.
