import { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { MAX_SLEEP_MIN, MAX_STEPS } from '@/domain/economy';
import { getHealthProvider, setHealthProvider } from '@/services/healthService';
import {
  aggregateHealthConnectSleepMinutes,
  aggregateHealthKitSleepMinutes,
  getLocalDateWindow,
  registerNativeHealthProvider,
  sumMergedIntervalMinutes,
} from '@/services/nativeProviders';

describe('nativeProviders', () => {
  const originalPlatformOS = Platform.OS;

  afterEach(() => {
    setHealthProvider(null);
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatformOS,
    });
    jest.resetModules();
    jest.restoreAllMocks();
  });

  describe('getLocalDateWindow', () => {
    it('returns local midnight start and end of day for YYYY-MM-DD', () => {
      const { start, end } = getLocalDateWindow('2026-11-24');
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(10);
      expect(start.getDate()).toBe(24);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(10);
      expect(end.getDate()).toBe(24);
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);
    });
  });

  describe('sleep-duration aggregation math', () => {
    it('merges overlapping intervals and ignores invalid ranges', () => {
      const minutes = sumMergedIntervalMinutes([
        {
          start: '2026-11-24T01:00:00.000Z',
          end: '2026-11-24T03:00:00.000Z',
        },
        {
          // Overlaps by 1 hour with first interval -> total 3h = 180m
          start: '2026-11-24T02:00:00.000Z',
          end: '2026-11-24T04:00:00.000Z',
        },
        {
          // Separate 45-minute nap -> total 225m
          start: '2026-11-24T14:00:00.000Z',
          end: '2026-11-24T14:45:00.000Z',
        },
        {
          // Invalid reversed interval -> ignored
          start: '2026-11-24T16:00:00.000Z',
          end: '2026-11-24T15:00:00.000Z',
        },
      ]);

      expect(minutes).toBe(225);
    });

    it('aggregates only asleep HealthKit category values (excluding inBed=0 and awake=2)', () => {
      const sleepMin = aggregateHealthKitSleepMinutes([
        {
          value: 0, // inBed
          startDate: new Date('2026-11-24T00:00:00.000Z'),
          endDate: new Date('2026-11-24T08:00:00.000Z'),
        },
        {
          value: 3, // asleepCore: 240m
          startDate: new Date('2026-11-24T00:30:00.000Z'),
          endDate: new Date('2026-11-24T04:30:00.000Z'),
        },
        {
          value: 2, // awake: excluded
          startDate: new Date('2026-11-24T04:30:00.000Z'),
          endDate: new Date('2026-11-24T05:00:00.000Z'),
        },
        {
          value: 4, // asleepDeep: 90m
          startDate: new Date('2026-11-24T05:00:00.000Z'),
          endDate: new Date('2026-11-24T06:30:00.000Z'),
        },
        {
          value: 5, // asleepREM: 60m
          startDate: new Date('2026-11-24T06:30:00.000Z'),
          endDate: new Date('2026-11-24T07:30:00.000Z'),
        },
      ]);

      expect(sleepMin).toBe(390);
    });

    it('aggregates Health Connect sleep sessions using stages when present and session bounds otherwise', () => {
      const sleepMin = aggregateHealthConnectSleepMinutes([
        {
          startTime: '2026-11-24T00:00:00.000Z',
          endTime: '2026-11-24T06:00:00.000Z',
          stages: [
            {
              stage: 4, // LIGHT: 120m
              startTime: '2026-11-24T00:00:00.000Z',
              endTime: '2026-11-24T02:00:00.000Z',
            },
            {
              stage: 3, // AWAKE: excluded
              startTime: '2026-11-24T02:00:00.000Z',
              endTime: '2026-11-24T02:30:00.000Z',
            },
            {
              stage: 5, // DEEP: 90m
              startTime: '2026-11-24T02:30:00.000Z',
              endTime: '2026-11-24T04:00:00.000Z',
            },
          ],
        },
        {
          // No stages -> uses full session interval: 30m
          startTime: '2026-11-24T13:00:00.000Z',
          endTime: '2026-11-24T13:30:00.000Z',
        },
      ]);

      expect(sleepMin).toBe(240);
    });
  });

  describe('registerNativeHealthProvider safety guards', () => {
    it('skips native require on Expo Go (StoreClient) without throwing', () => {
      jest.isolateModules(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: { executionEnvironment: ExecutionEnvironment.StoreClient },
          ExecutionEnvironment,
        }));
        const mockHealthKitRequire = jest.fn();
        jest.doMock('@kingstinct/react-native-healthkit', () => {
          mockHealthKitRequire();
          return {};
        });

        const { Platform: MockedPlatform } = require('react-native') as typeof import('react-native');
        Object.defineProperty(MockedPlatform, 'OS', { configurable: true, value: 'ios' });

        const { registerNativeHealthProvider: register } =
          require('@/services/nativeProviders') as typeof import('@/services/nativeProviders');
        const { getHealthProvider: getProvider } =
          require('@/services/healthService') as typeof import('@/services/healthService');

        const result = register();
        expect(result).toEqual({
          registered: false,
          platform: 'unsupported',
          reason: 'expo_go_or_web',
        });
        expect(mockHealthKitRequire).not.toHaveBeenCalled();
        expect(getProvider()).toBeNull();
      });
    });

    it('skips native require on Web without throwing', () => {
      jest.isolateModules(() => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: { executionEnvironment: ExecutionEnvironment.Bare },
          ExecutionEnvironment,
        }));
        const mockHealthKitRequire = jest.fn();
        jest.doMock('@kingstinct/react-native-healthkit', () => {
          mockHealthKitRequire();
          return {};
        });

        const { Platform: MockedPlatform } = require('react-native') as typeof import('react-native');
        Object.defineProperty(MockedPlatform, 'OS', { configurable: true, value: 'web' });

        const { registerNativeHealthProvider: register } =
          require('@/services/nativeProviders') as typeof import('@/services/nativeProviders');
        const { getHealthProvider: getProvider } =
          require('@/services/healthService') as typeof import('@/services/healthService');

        const result = register();
        expect(result).toEqual({
          registered: false,
          platform: 'unsupported',
          reason: 'expo_go_or_web',
        });
        expect(mockHealthKitRequire).not.toHaveBeenCalled();
        expect(getProvider()).toBeNull();
      });
    });
  });

  describe('native provider registration and clamping', () => {
    it('registers Apple HealthKit provider on iOS standalone build and clamps summary', async () => {
      await jest.isolateModulesAsync(async () => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: { executionEnvironment: ExecutionEnvironment.Standalone },
          ExecutionEnvironment,
        }));

        const mockRequestAuthorization = jest.fn(async () => true);
        const mockQueryQuantitySamples = jest.fn(async () => [
          { quantity: 4200 },
          { quantity: 99_999 },
        ]);
        const mockQueryCategorySamples = jest.fn(async () => [
          {
            value: 3,
            startDate: new Date('2026-11-24T00:00:00.000Z'),
            endDate: new Date('2026-11-24T07:00:00.000Z'),
          },
        ]);

        jest.doMock('@kingstinct/react-native-healthkit', () => ({
          isHealthDataAvailable: () => true,
          requestAuthorization: mockRequestAuthorization,
          queryQuantitySamples: mockQueryQuantitySamples,
          queryCategorySamples: mockQueryCategorySamples,
        }));

        const { Platform: MockedPlatform } = require('react-native') as typeof import('react-native');
        Object.defineProperty(MockedPlatform, 'OS', { configurable: true, value: 'ios' });

        const { registerNativeHealthProvider: register } =
          require('@/services/nativeProviders') as typeof import('@/services/nativeProviders');
        const { getHealthProvider: getProvider } =
          require('@/services/healthService') as typeof import('@/services/healthService');

        const result = register();
        expect(result).toEqual({ registered: true, platform: 'ios' });

        const provider = getProvider();
        expect(provider?.platform).toBe('apple_health');
        expect(await provider?.requestPermissions()).toBe('granted');
        expect(mockRequestAuthorization).toHaveBeenCalledWith({
          toRead: [
            'HKQuantityTypeIdentifierStepCount',
            'HKCategoryTypeIdentifierSleepAnalysis',
          ],
        });

        const summary = await provider?.fetchDailySummary('2026-11-24');
        expect(summary).toEqual({
          sleepMin: 420,
          steps: MAX_STEPS,
        });
      });
    });

    it('registers Android Health Connect provider on Android standalone build and clamps summary', async () => {
      await jest.isolateModulesAsync(async () => {
        jest.doMock('expo-constants', () => ({
          __esModule: true,
          default: { executionEnvironment: ExecutionEnvironment.Standalone },
          ExecutionEnvironment,
        }));

        const mockInitialize = jest.fn(async () => true);
        const mockRequestPermission = jest.fn(async () => [
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'SleepSession' },
        ]);
        const mockReadRecords = jest.fn(async (recordType: string) => {
          if (recordType === 'Steps') {
            return { records: [{ count: 5500 }, { count: 2100 }] };
          }
          return {
            records: [
              {
                startTime: '2026-11-24T00:00:00.000Z',
                endTime: '2026-11-25T06:00:00.000Z',
              },
            ],
          };
        });

        jest.doMock('react-native-health-connect', () => ({
          initialize: mockInitialize,
          requestPermission: mockRequestPermission,
          readRecords: mockReadRecords,
        }));

        const { Platform: MockedPlatform } = require('react-native') as typeof import('react-native');
        Object.defineProperty(MockedPlatform, 'OS', { configurable: true, value: 'android' });

        const { registerNativeHealthProvider: register } =
          require('@/services/nativeProviders') as typeof import('@/services/nativeProviders');
        const { getHealthProvider: getProvider } =
          require('@/services/healthService') as typeof import('@/services/healthService');

        const result = register();
        expect(result).toEqual({ registered: true, platform: 'android' });

        const provider = getProvider();
        expect(provider?.platform).toBe('health_connect');
        expect(await provider?.requestPermissions()).toBe('granted');
        expect(mockRequestPermission).toHaveBeenCalledWith([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'SleepSession' },
        ]);

        const summary = await provider?.fetchDailySummary('2026-11-24');
        expect(summary).toEqual({
          sleepMin: MAX_SLEEP_MIN,
          steps: 7600,
        });
      });
    });
  });

  it('leaves healthService fallback intact when registerNativeHealthProvider is called in default test env', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const result = registerNativeHealthProvider();
    expect(result.registered).toBe(false);
    expect(getHealthProvider()).toBeNull();
  });
});
