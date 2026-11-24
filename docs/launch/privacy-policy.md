# Privacy Policy for Dew & Bloom

**Effective Date:** November 24, 2026  
**App Name:** Dew & Bloom (`com.dewbloom.app`)

Dew & Bloom is built to help you build calmer sleep and movement habits without sacrificing your privacy. This Privacy Policy explains what information we access, how we use it, and the controls you have.

---

## 1. The Short Version

- **We never sell your data.**
- **We never share your health data with advertisers or data brokers.**
- **Your sanctuary works locally on your device by default**, with optional cloud backup if you create an account.
- **You can delete your account and all cloud data in 1 tap** inside the app.

---

## 2. Information We Access & How We Use It

### A. Apple HealthKit (iOS) & Android Health Connect (Android)
If you choose **Health Sync** mode and grant permission, Dew & Bloom requests **read-only** access to:
- **Sleep duration / sleep sessions** (to calculate Morning Dew and clear Morning Fog)
- **Daily step counts** (to calculate Warm Sunlight)

**Strict Health Data Commitments:**
- Health data is used **exclusively** to power your in-app sanctuary, Morning Reveal, and personal Garden Keeper reflections.
- We **never** sell HealthKit or Health Connect data, **never** use it for advertising or marketing, and **never** share it with third-party ad networks.
- If you deny health permissions or prefer not to connect a wearable, you can use **Phone-Only mode** (Goodnight Lantern + device pedometer) with no health permission required.

### B. Account & Cloud Backup (Supabase Auth & Storage)
If you sign in with an email or account for cloud sync:
- We store your account identifier, sleep/step goals, garden placements, unlocked catalog items, and daily sanctuary logs in our Supabase database (protected by Row-Level Security so only your authenticated session can access your rows).
- Session tokens are stored securely on your device using `expo-secure-store` / `AsyncStorage`.

### C. Subscriptions & Purchases (RevenueCat)
- In-app purchases and 7-day free trials for *Dew & Bloom Pro* are processed by Apple App Store / Google Play and managed via **RevenueCat**.
- RevenueCat receives an anonymous app user ID and purchase receipt/entitlement status to verify whether Pro features are unlocked. RevenueCat never receives your sleep or step data.

### D. Privacy-Safe Product Analytics (PostHog)
- We use **PostHog** to understand basic app reliability and feature usage (for example: `onboarding_completed`, `paywall_viewed`, `garden_item_placed`, `morning_reveal_completed`, `progress_card_shared`).
- Our analytics client explicitly strips sensitive fields (`sleepMin`, `steps`, `email`, `phone`, `full_name`) before any event is queued or sent. We never send raw sleep durations, step counts, or personal health metrics to PostHog.

---

## 3. Data Retention & 1-Tap Account Deletion

- **Local Data:** Remains on your device until you reset data or uninstall the app.
- **Cloud Account Deletion:** Open **Settings → Account → Delete account** inside Dew & Bloom. Confirming deletion immediately removes your cloud profile, daily logs, and garden placements from our servers and signs you out.
- You may also revoke Apple HealthKit or Android Health Connect permissions at any time in your device's system Settings.

---

## 4. Children's Privacy

Dew & Bloom is not directed to children under 13 (or the applicable age of digital consent in your region), and we do not knowingly collect personal information from children.

---

## 5. Changes to This Policy

If we make material changes to this Privacy Policy, we will update the Effective Date above and surface a notice in the app or release notes.

---

## 6. Contact

If you have any questions about this Privacy Policy or your data, please contact us via the support link in the App Store / Google Play listing or inside **Settings** in Dew & Bloom.
