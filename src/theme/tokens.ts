export const palette = {
  bg: '#FAF8F4',
  surface: '#F2EFE9',
  surfaceElevated: '#FFFFFF',
  border: 'rgba(30, 36, 30, 0.08)',
  textPrimary: '#1E241E',
  textSecondary: '#545E54',
  textMuted: '#5E685E',
  accentMoss: '#365E44',
  accentMossText: '#FFFFFF',
  accentDew: '#376675',
  accentSunlight: '#98601A',
  danger: '#B6423A',
} as const;

export const nightPalette = {
  bg: '#141916',
  surface: '#1D2420',
  surfaceElevated: '#252E29',
  border: 'rgba(245, 242, 235, 0.10)',
  textPrimary: '#F4F1EA',
  textSecondary: '#B9C0B7',
  textMuted: '#929C90',
  accentLantern: '#E3B261',
} as const;

export const fonts = {
  display: 'Lora_500Medium',
  displaySemiBold: 'Lora_600SemiBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
} as const;

export const typography = {
  displayLg: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  displayMd: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  displaySm: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const motion = {
  pressMs: 120,
  enterMs: 260,
  exitMs: 180,
} as const;

export const springs = {
  tactile: { damping: 18, stiffness: 280, mass: 0.8 },
  gentle: { damping: 20, stiffness: 180, mass: 0.9 },
  pop: { damping: 14, stiffness: 260, mass: 0.7 },
} as const;

/**
 * Cubic-bezier curves following slow-in, slow-out motion:
 * - enter: ease-out for elements entering view
 * - exit: ease-in for elements leaving view
 * - move: ease-in-out for elements moving between positions
 */
export const easings = {
  enter: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
  move: [0.65, 0, 0.35, 1],
} as const;

export type DayPalette = typeof palette;
export type NightPalette = typeof nightPalette;
export type Fonts = typeof fonts;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Motion = typeof motion;
export type Springs = typeof springs;
export type Easings = typeof easings;
