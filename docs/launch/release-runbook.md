# Dew & Bloom — Android & iOS Release Runbook

> Concise, copy-paste checklist to deploy the launch site (`web/`), configure live secrets, and publish `com.dewbloom.app` to Google Play and the Apple App Store via Expo EAS Cloud.

---

## 1. Deploy Public Launch Site (`web/`)
Required **before** store submission so your Privacy Policy URL and `app-ads.txt` are live over HTTPS.

```bash
cd web
npx vercel login
npx vercel --prod
```

Verify live URLs after deploy:
- `https://<your-domain>/` — Interactive 3D Floating Meadow landing page
- `https://<your-domain>/privacy` — Hosted Privacy Policy (paste into App Store Connect & Play Console)
- `https://<your-domain>/app-ads.txt` — AdMob verification file (replace placeholder publisher ID before going live with ads)

---

## 2. Configure Production Secrets (EAS)
Set these in Expo EAS (or `.env` locally for dev builds):

```bash
npx eas-cli login
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_URL --value "..." --environment production
npx eas-cli env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..." --environment production
npx eas-cli env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value "..." --environment production
npx eas-cli env:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "..." --environment production
# Optional (only if enabling live AdMob Rewarded Dew ads):
npx eas-cli env:create --name EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS --value "..." --environment production
npx eas-cli env:create --name EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID --value "..." --environment production
```

Install native monetization SDKs right before cutting your first native EAS binary:
```bash
npx expo install react-native-purchases react-native-google-mobile-ads
```

---

## 3. Run Local Preflight Gate
Always run before `eas build`:
```bash
npm run preflight
```

---

## 4. Android — Google Play Store (`com.dewbloom.app`)
1. **Google Play Console (\$25 one-time):** Create app `Dew & Bloom: Sleep & Steps`, attach Privacy Policy URL (`https://<your-domain>/privacy`), complete Data Safety (health data used solely for app functionality, encrypted in transit, deletable in-app; non-personalized ads if enabled), IARC rating, and **Health Connect Permissions Declaration** (`READ_STEPS`, `READ_SLEEP` + short unlisted screen-recording).
2. **Build & Submit AAB:**
   ```bash
   npx eas-cli build --platform android --profile production
   npx eas-cli submit --platform android --profile production
   ```
3. **14-Day Closed Test (Personal Play Accounts):** Upload to **Closed testing → Alpha**, opt in 15–20 Android testers (keep ≥12 active for 14 continuous days), confirm 0 crashes in Android Vitals, then apply for Production on Day 15.

---

## 5. iOS — Apple App Store (`com.dewbloom.app`)
1. **Apple Developer Program (\$99/yr):** Ensure `com.dewbloom.app` has **HealthKit** and **In-App Purchase** enabled; create products `annual_pro` (\$19.99/yr + 7-day trial), `monthly_pro` (\$2.99/mo), and `lifetime_pro` (\$39.99) in App Store Connect and link them in RevenueCat.
2. **Build & Submit IPA (Cloud-built — no local Xcode required):**
   ```bash
   npx eas-cli build --platform ios --profile production
   npx eas-cli submit --platform ios --profile production
   ```
3. **TestFlight & App Review Notes:** Smoke-test on a physical iPhone via TestFlight (Onboarding → HealthKit prompt → Morning Reveal → Sandbox Purchase → Restore → Delete Account). In App Review Notes, mention both **Phone-Only Goodnight Lantern** (works without a wearable) and **Apple Health** read-only integration.
