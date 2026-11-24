import {
  calculateDewReward,
  calculateSunlightReward,
  clampHealthInput,
} from './economy';
import { pickKeeperFallbackNote } from './keeperFallback';
import { calculateRestMomentum } from './momentum';
import type {
  DailyLog,
  FogLevel,
  MorningRevealResult,
  UserProfile,
} from './types';

const VALID_STEP_THRESHOLD = 2000;
const DEFAULT_HARMONY_WINDOW_DAYS = 7;

function isValidRestOrMovementDay(sleepMin: number, steps: number): boolean {
  return sleepMin > 0 || steps >= VALID_STEP_THRESHOLD;
}

/**
 * Maps missed days to compassionate morning fog levels (0..3) without deleting plants.
 */
export function calculateFogLevel(missedDays: number): FogLevel {
  if (!Number.isFinite(missedDays) || missedDays <= 0) {
    return 0;
  }
  const wholeDays = Math.floor(missedDays);
  if (wholeDays <= 0) {
    return 0;
  }
  if (wholeDays === 1) {
    return 1;
  }
  if (wholeDays <= 3) {
    return 2;
  }
  return 3;
}

/**
 * Calculates rolling Harmony score across the most recent unique dates in the window
 * without punitive streak resets.
 */
export function calculateHarmonyScore(
  recentLogs: DailyLog[],
  windowDays: number = DEFAULT_HARMONY_WINDOW_DAYS,
): { restfulDays: number; windowDays: number } {
  const safeWindow =
    Number.isFinite(windowDays) && windowDays > 0
      ? Math.floor(windowDays)
      : DEFAULT_HARMONY_WINDOW_DAYS;

  const uniqueByDate = new Map<string, DailyLog>();
  for (const log of recentLogs) {
    if (!uniqueByDate.has(log.dateKey)) {
      uniqueByDate.set(log.dateKey, log);
    }
  }

  const recentUnique = Array.from(uniqueByDate.values())
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, safeWindow);

  let restfulDays = 0;
  for (const log of recentUnique) {
    const clamped = clampHealthInput({ sleepMin: log.sleepMin, steps: log.steps });
    if (isValidRestOrMovementDay(clamped.sleepMin, clamped.steps)) {
      restfulDays += 1;
    }
  }

  return { restfulDays, windowDays: safeWindow };
}

/**
 * Processes an idempotent Morning Reveal for a local calendar dateKey,
 * awarding clamped Dew/Sunlight once per day and clearing fog on any valid day.
 */
export function processMorningReveal(params: {
  dateKey: string;
  existingLogs: Record<string, DailyLog>;
  sleepMin: number;
  steps: number;
  bedtimeOffsetMin?: number;
  profile: UserProfile;
}): MorningRevealResult {
  const existingLog = Object.prototype.hasOwnProperty.call(
    params.existingLogs,
    params.dateKey,
  )
    ? params.existingLogs[params.dateKey]
    : undefined;

  const momentum = calculateRestMomentum(
    Object.values(params.existingLogs),
    params.profile.sleepGoalMin,
  );

  if (existingLog) {
    return {
      alreadyRevealed: true,
      dewAwarded: 0,
      sunlightAwarded: 0,
      newFogLevel: params.profile.fogLevel,
      keeperNote:
        existingLog.aiInsight ||
        pickKeeperFallbackNote(
          existingLog.sleepMin,
          params.profile.sleepGoalMin,
          existingLog.steps,
          false,
        ),
      log: existingLog,
      momentumTier: momentum.tier,
      momentumMultiplier: momentum.multiplier,
      momentumLabel: momentum.label,
    };
  }

  const clamped = clampHealthInput({
    sleepMin: params.sleepMin,
    steps: params.steps,
  });

  const baseDew = calculateDewReward(
    clamped.sleepMin,
    params.profile.sleepGoalMin,
    params.bedtimeOffsetMin,
  );
  const dewAwarded = Math.round(baseDew * momentum.multiplier);
  const sunlightAwarded = calculateSunlightReward(
    clamped.steps,
    params.profile.stepGoal,
  );

  const validDay = isValidRestOrMovementDay(clamped.sleepMin, clamped.steps);
  const newFogLevel: FogLevel = validDay ? 0 : params.profile.fogLevel;
  const fogCleared = params.profile.fogLevel > 0 && newFogLevel === 0;

  const keeperNote = pickKeeperFallbackNote(
    clamped.sleepMin,
    params.profile.sleepGoalMin,
    clamped.steps,
    fogCleared,
  );

  const log: DailyLog = {
    dateKey: params.dateKey,
    sleepMin: clamped.sleepMin,
    steps: clamped.steps,
    dewAwarded,
    sunlightAwarded,
    revealedAt: new Date().toISOString(),
    aiInsight: keeperNote,
  };

  return {
    alreadyRevealed: false,
    dewAwarded,
    sunlightAwarded,
    newFogLevel,
    keeperNote,
    log,
    momentumTier: momentum.tier,
    momentumMultiplier: momentum.multiplier,
    momentumLabel: momentum.label,
  };
}
