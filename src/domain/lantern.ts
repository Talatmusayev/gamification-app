import { clampHealthInput } from './economy';
import type { DailyLog, LanternSession } from './types';

export const MIN_VALID_REST_MIN = 60;
export const CLOCK_DRIFT_TOLERANCE_MS = 15 * 60_000;

const MS_PER_MINUTE = 60_000;

export interface CompleteLanternOptions {
  monotonicElapsedMs?: number;
}

export interface CompleteLanternResult {
  sleepMin: number;
  isValidRest: boolean;
  reason?: 'CLOCK_TAMPERED';
}

/**
 * Starts a phone-only Goodnight Lantern sleep session anchored at the given ISO-8601 timestamp.
 */
export function startLanternSession(startedAtIso: string): LanternSession {
  return {
    id: `lantern_${startedAtIso}`,
    startedAt: startedAtIso,
    durationMin: 0,
    completed: false,
    bonusDewAwarded: 0,
  };
}

/**
 * Completes a Goodnight Lantern session using the UTC epoch delta between start and end timestamps.
 * Clamps elapsed minutes to [0, 960] via `clampHealthInput` and requires >= 60 minutes for valid rest.
 * When `options?.monotonicElapsedMs` is provided, rejects clock-tampering if wall-clock elapsed time
 * exceeds `monotonicElapsedMs + 15 * 60_000`.
 */
export function completeLanternSession(
  session: LanternSession,
  endedAtIso: string,
  options?: CompleteLanternOptions,
): CompleteLanternResult {
  const startMs = Date.parse(session.startedAt);
  const endMs = Date.parse(endedAtIso);
  const hasValidTimestamps = Number.isFinite(startMs) && Number.isFinite(endMs);
  const wallDeltaMs = hasValidTimestamps ? endMs - startMs : 0;

  if (
    options?.monotonicElapsedMs !== undefined &&
    Number.isFinite(options.monotonicElapsedMs) &&
    hasValidTimestamps &&
    wallDeltaMs > Math.max(0, options.monotonicElapsedMs) + CLOCK_DRIFT_TOLERANCE_MS
  ) {
    return {
      sleepMin: 0,
      isValidRest: false,
      reason: 'CLOCK_TAMPERED',
    };
  }

  const rawSleepMin = hasValidTimestamps
    ? Math.floor(wallDeltaMs / MS_PER_MINUTE)
    : 0;

  const { sleepMin } = clampHealthInput({ sleepMin: rawSleepMin, steps: 0 });

  return {
    sleepMin,
    isValidRest: sleepMin >= MIN_VALID_REST_MIN,
  };
}

/**
 * Enforces max 1 rewarded rest reveal per local calendar dateKey.
 */
export function hasRewardedLanternForDate(
  dailyLogs: Record<string, DailyLog>,
  dateKey: string,
): boolean {
  if (!dateKey || !Object.prototype.hasOwnProperty.call(dailyLogs, dateKey)) {
    return false;
  }
  const existing = dailyLogs[dateKey];
  return Boolean(
    existing && (existing.dewAwarded > 0 || existing.sleepMin >= MIN_VALID_REST_MIN),
  );
}
