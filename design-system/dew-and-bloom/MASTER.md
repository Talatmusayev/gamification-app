# Dew & Bloom — Master Design System (`MASTER.md`)

> **Version:** 1.0 (Locked)  
> **Figma Design File:** https://www.figma.com/design/kWT8rNHi5C7hcQ3qT1mX1i  
> **Stack:** React Native + Expo Router + Reanimated + `react-native-svg` + `lucide-react-native`  
> **Source of Truth:** Every screen, component, widget, and future subagent MUST read this file and consume `src/theme/tokens.ts` rather than inventing ad-hoc hex values, fonts, or timings.

---

## 1. Brand Direction (`unslop-ui` 5 Lines)

- **Product:** Passive sleep and daily steps grow a living isometric garden on your phone.
- **Character:** Warm, botanical, unhurried.
- **World:** Botanical field journal, warm linen paper, terracotta, morning mist, and evening lantern light.
- **Moments:** The 8x8 isometric *Sunlit Meadow* canvas (daylight & gentle mist) and the *Morning Reveal* ritual card.
- **Signature:** Handcrafted botanical SVG flora/critters + the rolling 7-day *Garden Harmony* botanical pill (`X of 7 restful days`).

---

## 2. Color System (WCAG AA >= 4.5:1 Verified)

### Day / Sanctuary Palette (`palette`)
| Token | Hex | Role & Usage |
|---|---|---|
| `bg` | `#FAF8F4` | Warm linen paper canvas (root screen background) |
| `surface` | `#F2EFE9` | Quiet secondary cards, segmented controls, HUD pills |
| `surfaceElevated` | `#FFFFFF` | Modals, elevated sheets, active tabs |
| `border` | `rgba(30, 36, 30, 0.08)` | Quiet 1px hairlines (never neon or thick colored borders) |
| `textPrimary` | `#1E241E` | Deep botanical ink — headings, primary figures |
| `textSecondary` | `#545E54` | Body copy, descriptions |
| `textMuted` | `#5E685E` | Captions, metadata (>= 5.0:1 on bg & surface) |
| `accentMoss` | `#365E44` | Primary action & active navigation (single lead chrome accent) |
| `accentMossText` | `#FFFFFF` | Text on `accentMoss` |
| `accentDew` | `#376675` | Sleep / Morning Dew figures & indicators |
| `accentSunlight` | `#98601A` | Steps / Warm Sunlight figures & indicators (>= 4.55:1 on surface) |
| `danger` | `#B6423A` | Destructive actions only (e.g., Delete Account) |

### Twilight / Goodnight Lantern Palette (`nightPalette`)
| Token | Hex | Role & Usage |
|---|---|---|
| `bg` | `#141916` | Deep forest night background |
| `surface` | `#1D2420` | Elevated night cards |
| `surfaceElevated` | `#252E29` | Active night containers |
| `border` | `rgba(245, 242, 235, 0.10)` | Quiet twilight hairlines |
| `textPrimary` | `#F4F1EA` | Warm parchment night ink |
| `textSecondary` | `#B9C0B7` | Night secondary copy |
| `textMuted` | `#929C90` | Night metadata (>= 4.9:1 on `surfaceElevated`) |
| `accentLantern` | `#E3B261` | Warm candlelit lantern glow & night CTA |

**Strict Ban:** Zero purple gradients, zero gradient text, zero colored drop shadows or glows, zero radial color blobs.

---

## 3. Typography (`fonts` & `typography`)

- **Display / Editorial Headings:** **Lora** (`Lora_500Medium`, `Lora_600SemiBold`) — warm literary botanical serif for screen titles, modal headlines, and the Morning Reveal greeting.
- **Interface & Numbers:** **Plus Jakarta Sans** (`PlusJakartaSans_400Regular`, `PlusJakartaSans_500Medium`, `PlusJakartaSans_600SemiBold`) — crisp, warm geometric sans for body, buttons, HUD counters, and charts.
- **Rules:**
  - Sentence case everywhere (no `UPPERCASE` wide-tracked shouty labels).
  - Weights `400`–`600` only (no heavy `700`–`900` headings, no italic for emphasis).
  - `fontVariant: ['tabular-nums']` on every numeric counter, timer, step count, and chart figure.
  - Zero exclamation marks (`!`) in UI chrome; zero guilt-shaming copy.

---

## 4. Spacing, Radii & Touch Targets

- **Spacing Grid (`spacing`):** Strictly 4px/8px increments (`xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32`).
- **Nested Radii (`radii`):** Controls `sm: 8` / `md: 12`, cards `lg: 16`, modal sheets `xl: 20`, pills `full: 9999`.
- **Touch Targets:** Minimum `44pt` (iOS) / `48dp` (Android) on all interactive controls, using `Pressable` (never `TouchableOpacity`) with `hitSlop` on compact icon controls.

---

## 5. Icons & Illustrations

- **UI Chrome Icons:** `lucide-react-native` exclusively (`16px`–`20px`, `strokeWidth={1.5}`), inheriting text role color.
- **Garden Artwork:** Custom handcrafted `react-native-svg` sprites (`src/components/ui/GardenSprite.tsx` & `BotanicalIllustration.tsx`).
- **Strict Ban:** Zero emojis anywhere in UI chrome, labels, or catalog cards.

---

## 6. Motion & Haptics (`motion`)

- **Engine:** `react-native-reanimated` + `react-native-gesture-handler` + `expo-haptics` (native 60/120fps equivalent to `motion.dev`).
- **Timings:**
  - `pressMs: 120` — subtle press scale (`0.97`–`0.98`), never shifting layout bounds.
  - `enterMs: 260` — calm cubic-out fade + slight rise (`FadeInDown`), at most one entrance per screen.
  - `exitMs: 180` — exits faster than enters.
- **Accessibility:** Every animation and `<Modal>` MUST respect `useReducedMotion()` (`animationType={reducedMotion ? 'none' : 'fade'}`).
- **Strict Ban:** No looping `animate-pulse`, no bouncy springs, no parallax gimmicks, no double-firing haptics on a single tap.
