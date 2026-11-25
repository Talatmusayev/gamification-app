import type { UserProfile } from './types';

export const GUEST_PASS_DURATION_HOURS = 72;
const HOUR_MS = 60 * 60 * 1000;
const GUEST_PASS_DURATION_MS = GUEST_PASS_DURATION_HOURS * HOUR_MS;

export const ZERO_GUILT_EXPIRY_POLICY = {
  keepPlacedProItemsForever: true,
  deletePlantsOnExpiry: false,
  requiresCardForGuestPass: false,
} as const;

function parseTimestampMs(isoString?: string | null): number | null {
  if (!isoString || typeof isoString !== 'string') {
    return null;
  }
  const parsed = Date.parse(isoString);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Computes the ISO-8601 expiry timestamp 72 hours from `nowIso` (or current time).
 */
export function computeGuestPassExpiry(nowIso?: string): string {
  const parsedStart = parseTimestampMs(nowIso);
  const startMs = parsedStart ?? Date.now();
  return new Date(startMs + GUEST_PASS_DURATION_MS).toISOString();
}

/**
 * Returns true while the no-card 3-day Sunlit Guest Pass has time remaining.
 */
export function isGuestPassActive(
  guestPassEndsAt?: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (!Number.isFinite(nowMs)) {
    return false;
  }
  const endsAtMs = parseTimestampMs(guestPassEndsAt);
  if (endsAtMs === null) {
    return false;
  }
  return endsAtMs > nowMs;
}

/**
 * Grants Pro feature access when the user holds a paid Pro entitlement
 * or an active 3-day Sunlit Guest Pass.
 * Once expired, already-placed Pro items remain in the meadow forever.
 */
export function hasProAccess(
  profile: Pick<UserProfile, 'isPro' | 'guestPassEndsAt'>,
  nowMs: number = Date.now(),
): boolean {
  return Boolean(profile.isPro) || isGuestPassActive(profile.guestPassEndsAt, nowMs);
}

/**
 * Formats remaining Guest Pass hours (e.g. "72h left"), or null when inactive.
 */
export function getGuestPassRemainingLabel(
  guestPassEndsAt?: string | null,
  nowMs: number = Date.now(),
): string | null {
  if (!isGuestPassActive(guestPassEndsAt, nowMs)) {
    return null;
  }
  const endsAtMs = parseTimestampMs(guestPassEndsAt);
  if (endsAtMs === null) {
    return null;
  }
  const remainingHours = Math.max(1, Math.ceil((endsAtMs - nowMs) / HOUR_MS));
  return `${remainingHours}h left`;
}
