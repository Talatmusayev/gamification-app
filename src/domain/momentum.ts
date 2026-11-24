import { clampHealthInput } from './economy';
import type { DailyLog } from './types';

export type RestMomentumTier = 0 | 1 | 2 | 3;

export interface RestMomentumResult {
  tier: RestMomentumTier;
  multiplier: number;
  label: string | null;
  consecutiveRestfulDays: number;
  graceActive: boolean;
}

export type MomentumLogInput = DailyLog & {
  metSleepGoal?: boolean;
};

const DEFAULT_SLEEP_GOAL_MIN = 480;
const RESTFUL_GOAL_RATIO = 0.85;
const MS_PER_DAY = 86_400_000;

interface TierConfig {
  tier: RestMomentumTier;
  multiplier: number;
  label: string | null;
  minNights: number;
}

const TIER_CONFIGS: readonly TierConfig[] = [
  { tier: 0, multiplier: 1.0, label: null, minNights: 0 },
  { tier: 1, multiplier: 1.15, label: 'Gentle Rhythm', minNights: 2 },
  { tier: 2, multiplier: 1.3, label: 'Blooming Rhythm', minNights: 4 },
  { tier: 3, multiplier: 1.5, label: 'Golden Canopy', minNights: 6 },
];

function tierFromEffectiveNights(effectiveNights: number): RestMomentumTier {
  if (effectiveNights >= 6) return 3;
  if (effectiveNights >= 4) return 2;
  if (effectiveNights >= 2) return 1;
  return 0;
}

function parseDateKeyUtcMs(dateKey: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  return Number.isFinite(ms) ? ms : null;
}

function isRestfulNight(log: MomentumLogInput, sleepGoalMin: number): boolean {
  if (log.metSleepGoal === true) {
    return true;
  }
  const { sleepMin } = clampHealthInput({ sleepMin: log.sleepMin, steps: 0 });
  return sleepMin >= sleepGoalMin * RESTFUL_GOAL_RATIO;
}

/**
 * Calculates compassionate Rest Momentum across chronological daily logs:
 * - Tier 0 (0-1 nights): 1.0x (no label)
 * - Tier 1 (2-3 nights): 1.15x ('Gentle Rhythm')
 * - Tier 2 (4-5 nights): 1.3x ('Blooming Rhythm')
 * - Tier 3 (6+ nights): 1.5x ('Golden Canopy')
 *
 * 1 missed night holds the current tier steady (grace buffer).
 * Each additional consecutive missed night steps down by 1 tier rather than hard-resetting.
 */
export function calculateRestMomentum(
  logs: MomentumLogInput[],
  sleepGoalMin: number = DEFAULT_SLEEP_GOAL_MIN,
): RestMomentumResult {
  const safeGoalMin =
    Number.isFinite(sleepGoalMin) && sleepGoalMin > 0
      ? sleepGoalMin
      : DEFAULT_SLEEP_GOAL_MIN;

  // Deduplicate by dateKey (latest entry wins) and sort chronologically ascending
  const byDate = new Map<string, MomentumLogInput>();
  for (const log of logs) {
    byDate.set(log.dateKey, log);
  }
  const chronological = Array.from(byDate.values()).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey),
  );

  let effectiveNights = 0;
  let tier: RestMomentumTier = 0;
  let consecutiveRestfulDays = 0;
  let consecutiveMissedDays = 0;
  let prevDateMs: number | null = null;

  const applyMissedNight = () => {
    consecutiveRestfulDays = 0;
    consecutiveMissedDays += 1;

    if (tier === 0) {
      effectiveNights = 0;
      return;
    }

    if (consecutiveMissedDays === 1) {
      // 1-night grace buffer: hold current tier steady
      return;
    }

    // 2+ consecutive missed nights: gentle step-down by 1 tier per additional missed night
    const nextTier = Math.max(0, tier - 1) as RestMomentumTier;
    tier = nextTier;
    effectiveNights = TIER_CONFIGS[nextTier].minNights;
  };

  for (const log of chronological) {
    const currDateMs = parseDateKeyUtcMs(log.dateKey);
    if (prevDateMs !== null && currDateMs !== null) {
      const gapDays = Math.round((currDateMs - prevDateMs) / MS_PER_DAY) - 1;
      for (let i = 0; i < gapDays; i += 1) {
        applyMissedNight();
      }
    }
    if (currDateMs !== null) {
      prevDateMs = currDateMs;
    }

    if (isRestfulNight(log, safeGoalMin)) {
      consecutiveMissedDays = 0;
      consecutiveRestfulDays += 1;
      effectiveNights = Math.min(6, effectiveNights + 1);
      tier = tierFromEffectiveNights(effectiveNights);
    } else {
      applyMissedNight();
    }
  }

  const config = TIER_CONFIGS[tier];
  return {
    tier: config.tier,
    multiplier: config.multiplier,
    label: config.label,
    consecutiveRestfulDays,
    graceActive: consecutiveMissedDays === 1 && tier > 0,
  };
}
