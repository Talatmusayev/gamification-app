export const MAX_SLEEP_MIN = 960; // 16 hours
export const MAX_STEPS = 60_000;

const BEDTIME_BONUS_WINDOW_MIN = 45;
const BEDTIME_BONUS_DEW = 25;

const SUNLIGHT_PER_1000_STEPS = 10;
const MAX_BASE_SUNLIGHT = 150;
const STEP_GOAL_BONUS_SUNLIGHT = 30;

export interface HealthInput {
  sleepMin: number;
  steps: number;
}

function clampFiniteNonNegative(value: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(max, Math.max(0, value));
}

/**
 * Clamps raw health inputs to sanity bounds (0–960 sleep minutes, 0–60,000 steps)
 * and safely converts non-finite/NaN values to 0.
 */
export function clampHealthInput(input: HealthInput): HealthInput {
  return {
    sleepMin: clampFiniteNonNegative(input.sleepMin, MAX_SLEEP_MIN),
    steps: clampFiniteNonNegative(input.steps, MAX_STEPS),
  };
}

/**
 * Calculates daily Dew earned from sleep duration relative to goal,
 * plus an optional bedtime consistency bonus within +/-45 minutes.
 */
export function calculateDewReward(
  sleepMin: number,
  sleepGoalMin: number,
  bedtimeOffsetMin?: number,
): number {
  const { sleepMin: clampedSleepMin } = clampHealthInput({ sleepMin, steps: 0 });
  const ratio =
    Number.isFinite(sleepGoalMin) && sleepGoalMin > 0
      ? clampedSleepMin / sleepGoalMin
      : 0;

  let baseDew = 40;
  if (ratio >= 0.85) {
    baseDew = 100;
  } else if (ratio >= 0.65) {
    baseDew = 70;
  }

  const hasBedtimeBonus =
    bedtimeOffsetMin !== undefined &&
    Number.isFinite(bedtimeOffsetMin) &&
    Math.abs(bedtimeOffsetMin) <= BEDTIME_BONUS_WINDOW_MIN;

  return baseDew + (hasBedtimeBonus ? BEDTIME_BONUS_DEW : 0);
}

/**
 * Calculates daily Sunlight earned from steps (10 per 1,000 steps, capped at 150 base)
 * plus a +30 bonus when meeting or exceeding the personal step goal.
 */
export function calculateSunlightReward(steps: number, stepGoal: number): number {
  const { steps: clampedSteps } = clampHealthInput({ sleepMin: 0, steps });
  const baseSunlight = Math.min(
    MAX_BASE_SUNLIGHT,
    Math.floor(clampedSteps / 1000) * SUNLIGHT_PER_1000_STEPS,
  );

  const metStepGoal =
    Number.isFinite(stepGoal) && stepGoal > 0 && clampedSteps >= stepGoal;

  return baseSunlight + (metStepGoal ? STEP_GOAL_BONUS_SUNLIGHT : 0);
}
