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

## 3. Morning Reveal — Problem və Həll

### Problem

Mövcud kod `sanctuary.tsx`-də mount zamanı **bugünün** (`todayKey`) health məlumatını çəkir:

```ts
// KÖHNƏ — YANLIŞDIR
const summary = await fetchDailyHealthSummary(todayKey);
```

**Niyə yanlışdır?**  
Səhər tətbiqi ilk açılanda gün yeni başlamışdır — addımlar 0, uyqu isə tam bitməmişdir. Bu məlumatı reveal etmək mənasızdır.

Bundan əlavə, `Lantern.finishLantern()` çağırışı steps dəyərini `0` olaraq hardcode edir:

```ts
// KÖHNƏ — YANLIŞ
finishLantern(new Date().toISOString(), 0); // addımlar həmişə 0
```

### Razılaşdırılmış həll — "Dünənki Reveal"

**Prinsip:** Reveal həmişə dünənin (complete) məlumatını göstərir.

**Axış:**
1. İstifadəçi ilk dəfə tətbiqi qurduğu gün `startedDateKey = today` yazılır.
2. Hər gün səhər tətbiq açılanda avtomatik `yesterdayKey` hesablanır.
3. `yesterdayKey >= profile.startedDateKey` şərti yoxlanır — ilk gündən əvvəlki tarixlər göstərilmir.
4. Dünənin tam uyqu + addım məlumatı (00:00–23:59 arası) çəkilir.
5. Reveal kartı dünənin tarixini göstərərək açılır.
6. İstifadəçi "Reveal" düyməsinə basmır — **avtomatikdir.**

**Ediləcək dəyişikliklər:**

```
src/domain/types.ts
  → UserProfile tipinə startedDateKey: string əlavə et

src/state/useSanctuaryStore.ts
  → createInitialState(): startedDateKey: ''
  → completeOnboarding(): startedDateKey = getTodayDateKey()

app/(tabs)/sanctuary.tsx
  → autoHealthCheckedRef məntiqini yesterdayKey ilə yenilə
  → fetchDailyHealthSummary(yesterdayKey) çağır
  → yesterdayKey >= profile.startedDateKey şərtini əlavə et
```

**İlk gün kənar vəziyyəti:**  
Tətbiqi bugün qurubsa dünənin məlumatı yoxdur — bu normaldır, Reveal göstərilmir. Böyük problem deyil.

---

## 4. Lantern — Problem və Həll

### Mövcud mexanika

Goodnight Lantern: istifadəçi axşam "Fənəri yandır" düyməsinə basır → taymer başlayır → səhər "Söndür" düyməsinə basır → uyqu müddəti hesablanır.

### Problem

1. **Aktiv hərəkət tələb edir.** İstifadəçi fənəri yandırmağı unuda bilər, yorğun olar, ya da istəməz. Bu mexanika etibarlı deyil.

2. **Dew exploit.** `awardBedtimeDew(10)` hər Lantern başladıqda verilir, günlük limit yoxdur — istifadəçi düyməyə dəfələrlə basaraq Dew qazana bilər.

3. **Addımlar sıfırlanır.** `finishLantern(timestamp, 0)` həmişə steps=0 yazır, buna görə həmin günün addım məlumatı itirilir.

4. **Smartwatch olmayan istifadəçilər** üçün uyqu məlumatı tamamilə Lantern-ə bağlıdır — düyməyə basmasa heç bir uyqu datası olmur.

### Razılaşdırılmış həll

**Lantern → İstəyə bağlı axşam rituali** (ölçmə vasitəsi deyil)

| Ssenari | Nə baş verir |
|---|---|
| Smartwatch / Health app var | Real uyqu məlumatı Health API-dən gəlir, Lantern gerekmez |
| Smartwatch yoxdur + Lantern yandırıb | Bonus +Dew qazanır (axşam rituali) |
| Smartwatch yoxdur + Lantern yandırmayıb | Səhər 1-toxunuşlu uyqu sualı görünür |

**Səhər sual kartı (phone-only istifadəçilər üçün):**

```
"Dünən necə yatdın?"
  Yaxşı (7-8 saat)   ·   Normal (5-6)   ·   Pis (4-dən az)
```

İstifadəçi özü uyqusunu daha yaxşı bilir — bu sadə seçim Lantern taymerindən daha etibarlıdır.

**Ediləcək dəyişikliklər:**
- Lantern-i silmək yox — optional olaraq saxla, sadəcə məcburi deyil.
- Lantern Dew mükafatına günlük limit əlavə et (exploit fix).
- `finishLantern()` üçün hardcoded `steps=0` əvəzinə real health data istifadə et.
- Smartwatch yoxdursa → səhər Reveal-dən əvvəl 1-toxunuşlu uyqu sualı göstər.
- Mövcud `checkInModalOpen` / `handleConfirmCheckIn` mexanizması artıq `sanctuary.tsx`-də var — bunu genişləndir.

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
