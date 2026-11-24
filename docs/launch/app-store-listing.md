# Dew & Bloom — App Store & Google Play Launch Kit

> **Bundle ID / Package:** `com.dewbloom.app`  
> **Primary Category:** Health & Fitness  
> **Secondary Category:** Lifestyle  
> **Pricing:** Free with In-App Purchases (*Dew & Bloom Pro*: $19.99/yr with 7-day free trial, $2.99/mo, $39.99 Lifetime)

---

## 1. Store Metadata (Ready to Paste)

### App Title (30 chars max)
- **App Store (27/30):** `Dew & Bloom: Sleep & Steps`
- **Google Play (27/30):** `Dew & Bloom: Sleep & Steps`

### Subtitle / Short Description
- **App Store Subtitle (29/30):** `Grow a cozy living sanctuary`
- **Google Play Short Description (78/80):** `Your sleep & daily steps passively grow a cozy isometric garden on your phone.`

### Promotional Text (App Store — 170 chars max, editable anytime without review)
`Restful nights gather morning dew and daily walks bring warm sunlight. Clear the gentle morning mist, place botanical flora, and grow your calm sanctuary.` (153 chars)

### ASO Keywords (App Store — 100 chars max, comma-separated, no spaces)
`sleep,steps,cozy,garden,sanctuary,habit,wellness,mindful,walking,widget,tracker,relax,selfcare` (94 chars)

### Full Description (App Store & Google Play)

```text
Your sleep and daily steps automatically grow a cozy, living sanctuary on your phone — zero manual logging, zero guilt.

Most habit trackers punish you with broken streaks the moment life gets busy. Dew & Bloom takes a gentler approach. Restful nights gather Morning Dew, and daily walks bring Warm Sunlight. If you have a rough night or miss a day, nothing dies — a soft morning mist settles over your meadow and clears naturally on your next good rest.

HOW IT WORKS
1. Set your rhythm: Pick a sustainable sleep goal (6–10 hours) and daily step target.
2. Choose your starter seedling: Plant Lavender, a Bonsai Sprout, or a Sunlit Fern in your 8x8 isometric meadow.
3. Sync passively or go phone-only: Connect Apple Health / Android Health Connect for automatic Morning Reveals, or use the 1-tap Goodnight Lantern at bedtime with zero wearable required.
4. Clear the morning mist: Open your sanctuary each morning for a calm 60-second ritual — collect Dew and Sunlight, read a 1-line reflection from your AI Garden Keeper, and plant new flora, stone lanterns, ponds, and visiting meadow critters.

DESIGNED FOR CALM CONSISTENCY
• Passive by default: No tedious forms, calorie math, or loud notifications.
• Compassionate Garden Harmony: Tracks your rolling 7-day rhythm instead of brittle streaks.
• Morning Fog, never streak-death: Your placed plants and critters stay in your meadow forever.
• Duo Shared Meadow: Grow a calm sanctuary alongside a partner or close friend.
• Shareable Progress Cards: Export a clean snapshot of your meadow to share with friends or family.

PRIVATE BY DESIGN
Your sleep and step records are used solely to grow your garden and generate your personal Keeper notes. Health data is never sold and never shared with ad networks. Optional non-personalized rewarded videos are available in the free tier and are never shown to Pro members.

DEW & BLOOM PRO (OPTIONAL)
Start with a free meadow forever, or try Dew & Bloom Pro free for 7 days ($19.99/year, $2.99/month, or $39.99 Lifetime) to unlock all 35+ seasonal plants, stone lanterns, rare critters, deeper Keeper insights, Duo shared meadow perks, cloud backup, and zero ad prompts.

Questions or feedback? Reach us anytime from Settings inside the app.
```

---

## 2. TikTok / Instagram Reels UGC Ad Scripts (3 Angles)

### Script 1: "The Anti-Streak Burnout Hook" (20–25s)
- **Visual:** Overhead shot of someone waking up, checking phone in soft morning light, tapping *Clear mist* on the Morning Reveal modal.
- **Hook (0–3s, on-screen text):** `I quit every habit app that punished me for sleeping 5 hours`
- **Body (3–15s):** "Every tracker I tried deleted my streak the second I had one rough night. This app just puts a gentle morning fog over my garden — nothing dies. When I get good sleep, I earn Dew. When I walk, I earn Sunlight. And I use it to plant little lavender, stone lanterns, and hedgehogs in my meadow."
- **CTA (15–22s):** "Zero manual logging, works with Apple Health or just your phone. Search *Dew & Bloom* on the App Store."

### Script 2: "60-Second Morning Ritual" (18–22s)
- **Visual:** Aesthetic desk / coffee pour → phone Home Screen showing the Dew & Bloom widget → tapping into the Sanctuary Canvas and placing a new Sakura Sapling.
- **Hook (0–3s, on-screen text):** `My favorite 60-second morning ritual (no doomscrolling)`
- **Body (3–14s):** "Instead of opening social media first thing, I open my garden. Last night's 7.5 hours of sleep gave me Morning Dew, yesterday's walk gave me Sunlight, and the AI Garden Keeper gave me one calm note about my week. Today I finally unlocked the koi pond."
- **CTA (14–20s):** "Free to start on iOS & Android — link in bio for *Dew & Bloom*."

### Script 3: "Phone-Only / No Smartwatch Needed" (20s)
- **Visual:** Nightstand shot tapping *Goodnight Lantern* (warm twilight dark mode), cut to morning sunlight tapping *I'm Awake* and watching the Dew counter tick up.
- **Hook (0–3s, on-screen text):** `You don't need an Apple Watch to fix your sleep schedule`
- **Body (3–15s):** "If you don't wear a smartwatch to bed, *Dew & Bloom* has a Goodnight Lantern mode. Tap it before bed, put your phone down, and wake up to Morning Dew to grow your sanctuary. Plus it counts your phone's daily steps automatically."
- **CTA (15–20s):** "Try *Dew & Bloom* free and plant your first seedling tonight."

---

## 3. Google Play 14-Day Closed Test Checklist (Personal Developer Accounts)

Google Play requires personal developer accounts created after Nov 2023 to run a closed test with at least **12 testers opted-in continuously for 14 days** before applying for Production access.

- [ ] **Build & Upload AAB:** Run `eas build --platform android --profile production` (or `aab` preview) and upload to **Closed testing → Alpha** track in Google Play Console.
- [ ] **Create Tester Group:** Add at least 15–20 real Android testers (to maintain ≥12 active opt-ins across all 14 days) via Google Group or email list.
- [ ] **Verify Opt-In Link:** Share the Play Store web opt-in URL and confirm ≥12 testers have accepted and installed the app on physical Android devices.
- [ ] **Day 1–14 Engagement Check:** Prompt testers to open the app at least 3–4 times across the 2 weeks (test Onboarding → Paywall "Continue with free basic garden", Morning Reveal, Goodnight Lantern, Shop placement, and Settings).
- [ ] **Monitor Play Console Vitals:** Confirm zero ANRs / crashes in Android Vitals and address any layout or Health Connect permission feedback.
- [ ] **Submit Production Access Questionnaire:** On Day 15+, complete the Google Play Production access form summarizing tester feedback and fixes, then promote the verified release to Production.
