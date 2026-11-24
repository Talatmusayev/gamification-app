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

export type DayPalette = typeof palette;
export type NightPalette = typeof nightPalette;
export type Spacing = typeof spacing;
export type Radii = typeof radii;
export type Motion = typeof motion;
