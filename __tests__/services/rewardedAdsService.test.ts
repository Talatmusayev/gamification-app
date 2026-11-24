import {
  canWatchRewardedDew,
  MAX_DAILY_REWARDED_ADS,
  NON_PERSONALIZED_ONLY,
  resetRewardedAdsState,
  REWARDED_DEW_AMOUNT,
  watchRewardedDewAd,
} from '@/services/rewardedAdsService';

describe('rewardedAdsService', () => {
  const TEST_DATE_KEY = '2026-11-24';

  beforeEach(() => {
    resetRewardedAdsState();
  });

  it('enforces non-personalized ads only for Apple 5.1.3 and Health Connect compliance', () => {
    expect(NON_PERSONALIZED_ONLY).toBe(true);
    expect(REWARDED_DEW_AMOUNT).toBe(20);
    expect(MAX_DAILY_REWARDED_ADS).toBe(3);
  });

  it('bypasses rewarded ads completely for Pro users', async () => {
    expect(canWatchRewardedDew({ isPro: true, watchedToday: 0 })).toBe(false);

    const result = await watchRewardedDewAd({
      isPro: true,
      dateKey: TEST_DATE_KEY,
      simulationDelayMs: 0,
    });

    expect(result).toEqual({
      ok: false,
      dewAwarded: 0,
      remainingToday: 0,
      source: 'blocked',
      reason: 'pro_user',
    });
  });

  it('awards +20 Dew per watch and enforces the 3-per-day cap', async () => {
    expect(canWatchRewardedDew({ isPro: false, watchedToday: 0 })).toBe(true);
    expect(canWatchRewardedDew({ isPro: false, watchedToday: 2 })).toBe(true);
    expect(canWatchRewardedDew({ isPro: false, watchedToday: 3 })).toBe(false);

    const first = await watchRewardedDewAd({
      isPro: false,
      dateKey: TEST_DATE_KEY,
      simulationDelayMs: 0,
    });
    expect(first).toEqual({
      ok: true,
      dewAwarded: 20,
      remainingToday: 2,
      source: 'simulation',
    });

    const second = await watchRewardedDewAd({
      isPro: false,
      dateKey: TEST_DATE_KEY,
      simulationDelayMs: 0,
    });
    expect(second).toEqual({
      ok: true,
      dewAwarded: 20,
      remainingToday: 1,
      source: 'simulation',
    });

    const third = await watchRewardedDewAd({
      isPro: false,
      dateKey: TEST_DATE_KEY,
      simulationDelayMs: 0,
    });
    expect(third).toEqual({
      ok: true,
      dewAwarded: 20,
      remainingToday: 0,
      source: 'simulation',
    });

    const fourth = await watchRewardedDewAd({
      isPro: false,
      dateKey: TEST_DATE_KEY,
      simulationDelayMs: 0,
    });
    expect(fourth).toEqual({
      ok: false,
      dewAwarded: 0,
      remainingToday: 0,
      source: 'blocked',
      reason: 'daily_cap_reached',
    });
  });
});
