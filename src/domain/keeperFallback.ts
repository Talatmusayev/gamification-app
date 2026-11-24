import { clampHealthInput } from './economy';

const FOG_CLEARED_NOTES: readonly string[] = [
  'The morning mist parts softly over your meadow, revealing every leaf waiting just as you left it.',
  'Quiet sunlight filters through the clearing haze, waking the moss and small ferns at your pace.',
  'A gentle breeze lifts the valley fog, leaving fresh dew gleaming across your resting garden.',
  'The meadow kept everything safe beneath the mist, and the soft morning light welcomes you back.',
  'Warm air sweeps the quiet fog aside, letting tiny blooms greet the new day unhurried.',
  'Even after quiet days away, the garden rests intact beneath lifting silver mist and soft sky.',
];

const HIGH_SLEEP_NOTES: readonly string[] = [
  'Deep, unhurried rest gathered plenty of cool dew across the clover and mossy stepping stones.',
  'Your garden drank in a full night of calm, leaving every fern tip bright with morning dew.',
  'Steady hours of rest settled like soft rain over the meadow, nourishing roots both old and new.',
  'The lantern burned low and peaceful through the night, filling your garden basin with clear dew.',
  'A restful night leaves the meadow lush and still, ready for whatever gentle pace today brings.',
  'Quiet hours carried you smoothly toward dawn, gifting your sanctuary a generous harvest of morning dew.',
];

const STEADY_SLEEP_NOTES: readonly string[] = [
  'A steady night of rest brings gentle dew to the leaves and a calm start to morning.',
  'Soft twilight lingered long enough to gather quiet dew along the meadow grass and garden stones.',
  'Your sanctuary welcomes this steady morning, with cool dew resting lightly on each unfolded leaf.',
  'Moderate rest still waters the soil well, keeping your lavender and ferns content in the morning shade.',
  'A calm night settles into soft daylight, offering fresh dew and an unhurried path through today.',
  'The garden appreciates every quiet hour you found last night, turning rest into gentle morning dew.',
];

const GENTLE_SLEEP_NOTES: readonly string[] = [
  'Even on shorter nights, showing up brings warm dew and a soft place for your thoughts to land.',
  'The meadow asks nothing heavy today, only offering quiet green shade and a gentle measure of dew.',
  'Brief rest still leaves silver drops on the moss, because every quiet moment in the garden counts.',
  'Take today slowly, like water soaking into warm earth, while your sanctuary holds space for your rest.',
  'Shorter nights happen, and the garden keeps glowing softly with fresh dew just for checking in today.',
  'Rest comes in seasons, and this small morning gift of dew is here to meet you gently.',
];

const BRIGHT_STEPS_NOTES: readonly string[] = [
  'Unfolded footsteps brought bright afternoon warmth into the meadow, helping every sunlit blossom open wide.',
  'Your steady walking wove golden light across the tiles, filling the sanctuary with abundant morning sunlight.',
  'Miles of quiet movement sent warm beams drifting over the clover, inviting little critters to linger.',
  'Each step outside added golden warmth here, painting long peaceful sunbeams across your favorite garden corner.',
  'A bright day on your feet fills the sky above the meadow with gentle, lasting sunlight.',
  'Warm strides carried sunshine back to the sanctuary, leaving your moss paths glowing through the afternoon.',
];

export const KEEPER_FALLBACK_NOTES: readonly string[] = [
  ...FOG_CLEARED_NOTES,
  ...HIGH_SLEEP_NOTES,
  ...STEADY_SLEEP_NOTES,
  ...GENTLE_SLEEP_NOTES,
  ...BRIGHT_STEPS_NOTES,
];

function selectPool(sleepRatio: number, steps: number, fogCleared: boolean): readonly string[] {
  if (fogCleared) {
    return FOG_CLEARED_NOTES;
  }
  if (steps >= 8000 && sleepRatio >= 0.65) {
    return BRIGHT_STEPS_NOTES;
  }
  if (sleepRatio >= 0.85) {
    return HIGH_SLEEP_NOTES;
  }
  if (sleepRatio >= 0.65) {
    return STEADY_SLEEP_NOTES;
  }
  return GENTLE_SLEEP_NOTES;
}

/**
 * Selects a warm, guilt-free Garden Keeper fallback note deterministically
 * from sleep tier, step milestone, and fog-cleared state.
 */
export function pickKeeperFallbackNote(
  sleepMin: number,
  sleepGoalMin: number,
  steps: number,
  fogCleared: boolean,
): string {
  const clamped = clampHealthInput({ sleepMin, steps });
  const sleepRatio =
    Number.isFinite(sleepGoalMin) && sleepGoalMin > 0
      ? clamped.sleepMin / sleepGoalMin
      : 0;

  const pool = selectPool(sleepRatio, clamped.steps, fogCleared);
  const index = Math.abs(Math.round(clamped.sleepMin) + Math.round(clamped.steps)) % pool.length;
  return pool[index];
}
