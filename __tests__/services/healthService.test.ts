import { MAX_SLEEP_MIN, MAX_STEPS } from '@/domain/economy';
import {
  fetchDailyHealthSummary,
  getHealthPlatformInfo,
  requestHealthPermissions,
  setHealthProvider,
  type HealthProvider,
} from '@/services/healthService';

describe('healthService', () => {
  afterEach(() => {
    setHealthProvider(null);
    jest.restoreAllMocks();
  });

  it('returns native_build_required fallback when no native provider is linked', async () => {
    const info = getHealthPlatformInfo();
    expect(info.available).toBe(false);
    expect(info.reason).toBe('native_build_required');

    const perm = await requestHealthPermissions();
    expect(perm).toEqual(
      expect.objectContaining({
        granted: false,
        status: 'unavailable',
        available: false,
        reason: 'native_build_required',
      }),
    );

    const summary = await fetchDailyHealthSummary('2026-11-24');
    expect(summary).toEqual({
      available: false,
      dateKey: '2026-11-24',
      sleepMin: 0,
      steps: 0,
      source: 'fallback',
      reason: 'native_build_required',
    });
  });

  it('delegates permission request and daily summary fetch to registered provider', async () => {
    const mockProvider: HealthProvider = {
      platform: 'apple_health',
      isAvailable: () => true,
      requestPermissions: jest.fn(async () => 'granted'),
      fetchDailySummary: jest.fn(async () => ({
        sleepMin: 465,
        steps: 8420,
        bedtimeOffsetMin: -12,
      })),
    };

    setHealthProvider(mockProvider);

    expect(getHealthPlatformInfo()).toEqual({
      platform: 'apple_health',
      available: true,
    });

    const perm = await requestHealthPermissions();
    expect(mockProvider.requestPermissions).toHaveBeenCalledTimes(1);
    expect(perm).toEqual({
      granted: true,
      status: 'granted',
      platform: 'apple_health',
      available: true,
    });

    const summary = await fetchDailyHealthSummary('2026-11-24');
    expect(mockProvider.fetchDailySummary).toHaveBeenCalledWith('2026-11-24');
    expect(summary).toEqual({
      available: true,
      dateKey: '2026-11-24',
      sleepMin: 465,
      steps: 8420,
      bedtimeOffsetMin: -12,
      source: 'apple_health',
    });
  });

  it('clamps out-of-range and non-finite health readings via clampHealthInput', async () => {
    const mockProvider: HealthProvider = {
      platform: 'health_connect',
      requestPermissions: jest.fn(async () => 'granted'),
      fetchDailySummary: jest
        .fn()
        .mockResolvedValueOnce({
          sleepMin: 1800,
          steps: 99_999,
        })
        .mockResolvedValueOnce({
          sleepMin: -50,
          steps: Number.NaN,
        }),
    };

    setHealthProvider(mockProvider);

    const high = await fetchDailyHealthSummary('2026-11-24');
    expect(high.sleepMin).toBe(MAX_SLEEP_MIN);
    expect(high.steps).toBe(MAX_STEPS);

    const invalid = await fetchDailyHealthSummary('2026-11-25');
    expect(invalid.sleepMin).toBe(0);
    expect(invalid.steps).toBe(0);
  });

  it('handles permission-denied and null summary safely without throwing', async () => {
    const mockProvider: HealthProvider = {
      platform: 'apple_health',
      requestPermissions: jest.fn(async () => 'denied'),
      fetchDailySummary: jest.fn(async () => null),
    };

    setHealthProvider(mockProvider);

    const perm = await requestHealthPermissions();
    expect(perm).toEqual({
      granted: false,
      status: 'denied',
      platform: 'apple_health',
      available: true,
      reason: 'permission_denied',
    });

    const summary = await fetchDailyHealthSummary('2026-11-24');
    expect(summary).toEqual({
      available: false,
      dateKey: '2026-11-24',
      sleepMin: 0,
      steps: 0,
      source: 'fallback',
      reason: 'permission_denied',
    });
  });
});
