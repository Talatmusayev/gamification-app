import { clampHealthInput } from './economy';
import type { LanternSession } from './types';

export const MIN_VALID_REST_MIN = 60;

const MS_PER_MINUTE = 60_000;

export interface CompleteLanternResult {
  sleepMin: number;
  isValidRest: boolean;
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
 */
export function completeLanternSession(
  session: LanternSession,
  endedAtIso: string,
): CompleteLanternResult {
  const startMs = Date.parse(session.startedAt);
  const endMs = Date.parse(endedAtIso);

  const rawSleepMin =
    Number.isFinite(startMs) && Number.isFinite(endMs)
      ? Math.floor((endMs - startMs) / MS_PER_MINUTE)
      : 0;

  const { sleepMin } = clampHealthInput({ sleepMin: rawSleepMin, steps: 0 });

  return {
    sleepMin,
    isValidRest: sleepMin >= MIN_VALID_REST_MIN,
  };
}
