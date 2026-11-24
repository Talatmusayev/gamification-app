import { processMorningReveal } from '../../src/domain/fog';
import {
  CLOCK_DRIFT_TOLERANCE_MS,
  completeLanternSession,
  hasRewardedLanternForDate,
  startLanternSession,
} from '../../src/domain/lantern';
import { calculateRestMomentum } from '../../src/domain/momentum';
import type { DailyLog, UserProfile } from '../../src/domain/types';

function makeLog(dateKey: string, sleepMin: number, dewAwarded = 100): DailyLog {
  return {
    dateKey,
    sleepMin,
    steps: 6000,
    dewAwarded,
    sunlightAwarded: 60,
    revealedAt: `${dateKey}T07:30:00.000Z`,
    aiInsight: 'A quiet morning settled across the clover.',
  };
}

const BASE_PROFILE: UserProfile = {
  sleepGoalMin: 480,
  stepGoal: 8000,
  trackingMode: 'phone_only',
  dewBalance: 0,
  sunlightBalance: 0,
  fogLevel: 0,
  isPro: false,
  onboardingCompleted: true,
};

describe('Rest Momentum Engine', () => {
  it('returns Tier 0 (1.0x, null label) for 0 or 1 restful nights', () => {
    expect(calculateRestMomentum([], 480)).toEqual({
      tier: 0,
      multiplier: 1.0,
      label: null,
      consecutiveRestfulDays: 0,
      graceActive: false,
    });

    expect(calculateRestMomentum([makeLog('2026-11-20', 420)], 480)).toEqual({
      tier: 0,
      multiplier: 1.0,
      label: null,
      consecutiveRestfulDays: 1,
      graceActive: false,
    });
  });

  it('progresses cleanly through Tier 1, Tier 2, and Tier 3 across consecutive restful nights', () => {
    const goal = 480; // 85% = 408 min
    const twoNights = [makeLog('2026-11-20', 410), makeLog('2026-11-21', 420)];
    expect(calculateRestMomentum(twoNights, goal)).toEqual({
      tier: 1,
      multiplier: 1.15,
      label: 'Gentle Rhythm',
      consecutiveRestfulDays: 2,
      graceActive: false,
    });

    const fourNights = [
      ...twoNights,
      makeLog('2026-11-22', 450),
      makeLog('2026-11-23', 480),
    ];
    expect(calculateRestMomentum(fourNights, goal)).toEqual({
      tier: 2,
      multiplier: 1.3,
      label: 'Blooming Rhythm',
      consecutiveRestfulDays: 4,
      graceActive: false,
    });

    // Unsorted logs still evaluate chronologically up to Tier 3
    const sixNightsUnsorted = [
      makeLog('2026-11-25', 460),
      makeLog('2026-11-20', 410),
      makeLog('2026-11-24', 440),
      makeLog('2026-11-22', 450),
      makeLog('2026-11-21', 420),
      makeLog('2026-11-23', 480),
    ];
    expect(calculateRestMomentum(sixNightsUnsorted, goal)).toEqual({
      tier: 3,
      multiplier: 1.5,
      label: 'Golden Canopy',
      consecutiveRestfulDays: 6,
      graceActive: false,
    });
  });

  it('holds the current tier steady on a single missed night (1-night grace buffer)', () => {
    const logsWithOneMissed = [
      makeLog('2026-11-18', 450),
      makeLog('2026-11-19', 460),
      makeLog('2026-11-20', 470),
      makeLog('2026-11-21', 480), // Tier 2 (Blooming Rhythm)
      makeLog('2026-11-22', 240), // Missed night (< 85% of 480)
    ];

    expect(calculateRestMomentum(logsWithOneMissed, 480)).toEqual({
      tier: 2,
      multiplier: 1.3,
      label: 'Blooming Rhythm',
      consecutiveRestfulDays: 0,
      graceActive: true,
    });

    // Resuming after a 1-day calendar gap keeps momentum rather than wiping it
    const logsWithCalendarGap = [
      makeLog('2026-11-18', 450),
      makeLog('2026-11-19', 460),
      makeLog('2026-11-20', 470),
      makeLog('2026-11-21', 480), // Tier 2
      // 2026-11-22 unlogged -> 1-night grace hold
      makeLog('2026-11-23', 460), // Resumes at Tier 2 (effective 5 nights)
    ];
    const resumed = calculateRestMomentum(logsWithCalendarGap, 480);
    expect(resumed.tier).toBe(2);
    expect(resumed.multiplier).toBe(1.3);
    expect(resumed.graceActive).toBe(false);
    expect(resumed.consecutiveRestfulDays).toBe(1);
  });

  it('gently steps down by 1 tier per additional consecutive missed night', () => {
    const sixRestful = [
      makeLog('2026-11-14', 460),
      makeLog('2026-11-15', 460),
      makeLog('2026-11-16', 460),
      makeLog('2026-11-17', 460),
      makeLog('2026-11-18', 460),
      makeLog('2026-11-19', 460), // Tier 3
    ];

    // 2 consecutive missed nights: 1st holds Tier 3, 2nd steps down to Tier 2
    const twoMissed = [
      ...sixRestful,
      makeLog('2026-11-20', 180),
      makeLog('2026-11-21', 180),
    ];
    expect(calculateRestMomentum(twoMissed, 480)).toMatchObject({
      tier: 2,
      multiplier: 1.3,
      label: 'Blooming Rhythm',
      graceActive: false,
    });

    // 3 consecutive missed nights -> Tier 1
    const threeMissed = [...twoMissed, makeLog('2026-11-22', 180)];
    expect(calculateRestMomentum(threeMissed, 480)).toMatchObject({
      tier: 1,
      multiplier: 1.15,
      label: 'Gentle Rhythm',
      graceActive: false,
    });

    // 4 consecutive missed nights -> Tier 0
    const fourMissed = [...threeMissed, makeLog('2026-11-23', 180)];
    expect(calculateRestMomentum(fourMissed, 480)).toMatchObject({
      tier: 0,
      multiplier: 1.0,
      label: null,
      graceActive: false,
    });
  });

  it('applies Rest Momentum multiplier to Dew in processMorningReveal when tier >= 1', () => {
    const existingLogs: Record<string, DailyLog> = {
      '2026-11-20': makeLog('2026-11-20', 460),
      '2026-11-21': makeLog('2026-11-21', 460),
      '2026-11-22': makeLog('2026-11-22', 460),
      '2026-11-23': makeLog('2026-11-23', 460),
    };

    const res = processMorningReveal({
      dateKey: '2026-11-24',
      existingLogs,
      sleepMin: 480,
      steps: 8000,
      profile: BASE_PROFILE,
    });

    expect(res.alreadyRevealed).toBe(false);
    expect(res.momentumTier).toBe(2);
    expect(res.momentumMultiplier).toBe(1.3);
    expect(res.momentumLabel).toBe('Blooming Rhythm');
    expect(res.dewAwarded).toBe(130); // 100 base * 1.3
    expect(res.log.dewAwarded).toBe(130);
  });
});

describe('Goodnight Lantern Anti-Cheat Guardrails', () => {
  it('rejects clock tampering when wall-clock delta exceeds monotonicElapsedMs + 15m tolerance', () => {
    const session = startLanternSession('2026-11-24T22:00:00.000Z');
    // Wall clock claims 8 hours, monotonic clock only saw 5 minutes
    const tampered = completeLanternSession(session, '2026-11-25T06:00:00.000Z', {
      monotonicElapsedMs: 5 * 60_000,
    });
    expect(tampered).toEqual({
      sleepMin: 0,
      isValidRest: false,
      reason: 'CLOCK_TAMPERED',
    });

    // Within 15-minute tolerance is accepted
    const legitimate = completeLanternSession(session, '2026-11-25T06:00:00.000Z', {
      monotonicElapsedMs: 8 * 60 * 60_000 - CLOCK_DRIFT_TOLERANCE_MS,
    });
    expect(legitimate).toEqual({
      sleepMin: 480,
      isValidRest: true,
    });
  });

  it('enforces max 1 rewarded rest reveal per calendar day via hasRewardedLanternForDate', () => {
    const logs: Record<string, DailyLog> = {
      '2026-11-24': makeLog('2026-11-24', 450, 100),
      '2026-11-25': makeLog('2026-11-25', 0, 0),
    };

    expect(hasRewardedLanternForDate(logs, '2026-11-24')).toBe(true);
    expect(hasRewardedLanternForDate(logs, '2026-11-25')).toBe(false);
    expect(hasRewardedLanternForDate(logs, '2026-11-26')).toBe(false);
  });
});
