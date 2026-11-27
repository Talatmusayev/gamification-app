# Dewy — Design Decisions & Product Notes

> Bu sənəd Pasha və Talat-ın birlikdə apardığı planlaşdırma sessiyasının qısa xülasəsidir.  
> Tarix: 2026-11-27 · Branch: `talat.branch`

---

## 1. Tətbiq haqqında ümumi ideya

**Dewy (Dew & Bloom)** — uyqu və addım məlumatlarından passiv olaraq böyüyən izometrik bir bağça oyunu.

Əsas mexanika:
- İstifadəçi hər gün yuxusunu yatır, addımlarını atır.
- Tətbiq HealthKit / Health Connect vasitəsilə bu məlumatları oxuyur.
- Əldə edilən **Dew (şeh)** nöqtələri ilə bağçaya bitkiler, dekorasiyalar, fənərlər əlavə edilir.
- Oyun heç bir aktiv "oyna" tələb etmir — sağlam həyat tərzi avtomatik olaraq bağçanı böyüdür.

Əsas dəyər təklifi: **sağlam olmaq → bağçanı böyütmək → motivasiya.**

---

## 2. Yayımlama üçün vacib funksiyalar (MVP)

Tətbiqin ilk versiyası üçün aşağıdakılar mütləq işlək olmalıdır:

| # | Funksiya | Vəziyyət |
|---|---|---|
| 1 | Onboarding axışı (4 addım) | ✅ Hazır |
| 2 | Sanctuary (bağça) ekranı | ✅ Hazır |
| 3 | HealthKit / Health Connect inteqrasiyası | ✅ Hazır (nativeProviders) |
| 4 | Dünənki Reveal sistemi (aşağıya bax) | 🔧 Yenidən qurulmalı |
| 5 | Dew ekonomikası (awardDew, spendDew) | ✅ Hazır |
| 6 | Bitki kataloqu və əkmə | ✅ Hazır |
| 7 | Supabase sinxronizasiyası | ✅ Hazır (syncService) |
| 8 | RevenueCat (premium) inteqrasiyası | ❌ Qurulmayıb |
| 9 | Push bildirişlər | ❌ Qurulmayıb |
| 10 | Favicon / App Icon (Dewy loqosu) | ❌ Hələ Expo default-dur |

---

## 3. Morning Reveal — Problem and Solution

### Problem

The current app triggers a "Morning Reveal" when the user opens the app in the morning. However, the new day starts at **00:00**, and by that time the user has not yet walked or lived their day. This means the reveal cannot include the user's steps, making the data incomplete and misleading.

> **In short:** Morning Reveal fires too early — the day has just begun, so there are no steps to show yet.

Additionally, `Lantern.finishLantern()` hardcodes steps as `0`:

```ts
// OLD — WRONG
finishLantern(new Date().toISOString(), 0); // steps always 0
```

### Solution

> *Imagine that the day starts at 00:00. The user wakes up in the morning, then continues their life — walks, works, etc. At **23:59**, Dewy makes a full report of that day (sleep + steps). The next morning, when the user opens the app, they see the report of **yesterday** and how many points they earned.*

**Flow:**
1. The day begins at 00:00.
2. The user lives their day — steps are tracked passively throughout.
3. At **23:59** Dewy compiles the day's full report (sleep + steps → Dew points).
4. The next morning when the user opens the app, they see **yesterday's rapport** — complete with all steps and sleep data.
5. No manual "Reveal" button needed — it appears automatically.

**Code changes required:**

```
src/domain/types.ts
  → Add startedDateKey: string to UserProfile

src/state/useSanctuaryStore.ts
  → createInitialState(): startedDateKey: ''
  → completeOnboarding(): startedDateKey = getTodayDateKey()

app/(tabs)/sanctuary.tsx
  → Replace todayKey logic with yesterdayKey
  → fetchDailyHealthSummary(yesterdayKey)
  → Guard: only show if yesterdayKey >= profile.startedDateKey
```

**Edge case — first day:**  
If the user just installed the app today, there is no yesterday to show. This is expected — no reveal on day one. Not a significant problem.

---

## 4. Lantern — Problem və Həll

### Mövcud mexanika

Goodnight Lantern: istifadəçi axşam "Fənəri yandır" düyməsinə basır → taymer başlayır → səhər "Söndür" düyməsinə basır → uyqu müddəti hesablanır.

### Problem

1. **Aktiv hərəkət tələb edir.** İstifadəçi fənəri yandırmağı unuda bilər, yorğun olar, ya da istəməz. Bu mexanika etibarlı deyil.

2. **Dew exploit.** `awardBedtimeDew(10)` hər Lantern başladıqda verilir, günlük limit yoxdur — istifadəçi düyməyə dəfələrlə basaraq Dew qazana bilər.

3. **Addımlar sıfırlanır.** `finishLantern(timestamp, 0)` həmişə steps=0 yazır, buna görə həmin günün addım məlumatı itirilir.

4. **Smartwatch olmayan istifadəçilər** üçün uyqu məlumatı tamamilə Lantern-ə bağlıdır — düyməyə basmasa heç bir uyqu datası olmur.

### Qərar — açıq məsələ (hələ həll edilməyib)

Lantern mexanikasının **ölçmə vasitəsi kimi işlədilməsi məntiqsizdir** — istifadəçi fənəri yandırmağı unuda bilər.

**Müəyyənləşdirilmiş problemlər:**
- Lantern-i ölçmə vasitəsi kimi istifadə etmək istifadəçi hərəkətindən asılıdır — etibarlı deyil.
- Lantern Dew mükafatına (`awardBedtimeDew(10)`) günlük limit yoxdur → exploit riski.
- `finishLantern(timestamp, 0)` həmişə steps=0 yazır → həmin günün addım məlumatı itirilir.

**Araşdırılan alternativ (hələ qərar verilməyib):**  
Lantern-i ölçmə funksiyasından çıxarıb yalnız **isteğe bağlı axşam rituali** kimi saxlamaq. Smartwatch olmayan istifadəçilər üçün ayrıca bir mexanizm tapılmalıdır.

> ⚠️ Bu məsələ hələ açıqdır. Həll razılaşdırıldıqdan sonra bu bölmə yenilənəcək.

---

## 5. Digər tapılmış texniki problemlər

| Problem | Fəsad | Prioritet |
|---|---|---|
| `identify-plant` Edge Function-da JWT yoxlaması yoxdur | İstənilən şəxs API açarını pulsuz istifadə edə bilər | Yüksək |
| `dew_duo_members` RLS policy self-reference | Postgres rekursiya riski | Orta |
| `favicon.png` hələ Expo default-dur | Tab-da yanlış loqo görünür | Aşağı |
| `.env` faylı yoxdur (yalnız `.env.example`) | RevenueCat, AdMob işləmir | Yüksək (deploy öncəsi) |
| `react-native-purchases` package.json-da yoxdur | RevenueCat tamamilə qurulmayıb | Yüksək (deploy öncəsi) |

---

*Sənəd `talat.branch` üçündür. `main` branch-ə birləşdirilməsin.*
