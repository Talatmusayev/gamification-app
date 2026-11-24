import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { clampHealthInput } from '@/domain/economy';
import { setHealthProvider, type HealthProvider } from '@/services/healthService';

export interface NativeHealthRegistrationResult {
  registered: boolean;
  platform: 'ios' | 'android' | 'unsupported';
  reason?: string;
}

export interface LocalDateWindow {
  start: Date;
  end: Date;
}

export interface TimeIntervalInput {
  start: Date | string | number;
  end: Date | string | number;
}

export interface HealthKitSleepSample {
  startDate: Date | string | number;
  endDate: Date | string | number;
  value: number;
}

export interface HealthKitQuantitySample {
  quantity: number;
}

export interface HealthConnectStepsRecord {
  count: number;
}

export interface HealthConnectSleepStage {
  startTime: string;
  endTime: string;
  stage: number;
}

export interface HealthConnectSleepSessionRecord {
  startTime: string;
  endTime: string;
  stages?: HealthConnectSleepStage[];
}

interface HealthKitModule {
  isHealthDataAvailable: () => boolean;
  requestAuthorization: (toRequest: {
    toRead?: readonly string[];
    toShare?: readonly string[];
  }) => Promise<boolean>;
  queryQuantitySamples: (
    identifier: 'HKQuantityTypeIdentifierStepCount',
    options: {
      limit: number;
      filter?: {
        date?: {
          startDate?: Date;
          endDate?: Date;
        };
      };
    },
  ) => Promise<readonly HealthKitQuantitySample[]>;
  queryCategorySamples: (
    identifier: 'HKCategoryTypeIdentifierSleepAnalysis',
    options: {
      limit: number;
      filter?: {
        date?: {
          startDate?: Date;
          endDate?: Date;
        };
      };
    },
  ) => Promise<readonly HealthKitSleepSample[]>;
}

interface HealthConnectModule {
  initialize: (providerPackageName?: string) => Promise<boolean>;
  requestPermission: (
    permissions: Array<{ accessType: 'read' | 'write'; recordType: 'Steps' | 'SleepSession' }>,
  ) => Promise<Array<{ accessType: string; recordType: string }>>;
  readRecords: <T extends 'Steps' | 'SleepSession'>(
    recordType: T,
    options: {
      timeRangeFilter: {
        operator: 'between';
        startTime: string;
        endTime: string;
      };
    },
  ) => Promise<{
    records: T extends 'Steps'
      ? HealthConnectStepsRecord[]
      : HealthConnectSleepSessionRecord[];
  }>;
}

/**
 * HealthKit CategoryValueSleepAnalysis asleep values:
 * 1 = asleep / asleepUnspecified, 3 = asleepCore, 4 = asleepDeep, 5 = asleepREM.
 * Excludes 0 (inBed) and 2 (awake).
 */
const HEALTHKIT_ASLEEP_VALUES = new Set<number>([1, 3, 4, 5]);

/**
 * Health Connect SleepStageType values that represent actual sleep:
 * 1 = SLEEPING, 4 = LIGHT, 5 = DEEP, 6 = REM.
 * Excludes 0 (UNKNOWN), 2 = AWAKE / OUT_OF_BED, 3 = AWAKE.
 */
const HEALTH_CONNECT_ASLEEP_STAGES = new Set<number>([1, 4, 5, 6]);

/**
 * Parses a local `YYYY-MM-DD` dateKey into local calendar day start/end bounds.
 */
export function getLocalDateWindow(dateKey: string): LocalDateWindow {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
    };
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  return {
    start: new Date(year, monthIndex, day, 0, 0, 0, 0),
    end: new Date(year, monthIndex, day, 23, 59, 59, 999),
  };
}

/**
 * Merges overlapping time intervals and returns total duration in rounded minutes.
 */
export function sumMergedIntervalMinutes(
  intervals: ReadonlyArray<TimeIntervalInput>,
): number {
  const ranges: Array<{ startMs: number; endMs: number }> = [];

  for (const item of intervals) {
    const startMs = new Date(item.start).getTime();
    const endMs = new Date(item.end).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      continue;
    }
    ranges.push({ startMs, endMs });
  }

  if (ranges.length === 0) {
    return 0;
  }

  ranges.sort((a, b) => a.startMs - b.startMs);

  let totalMs = 0;
  let currentStart = ranges[0].startMs;
  let currentEnd = ranges[0].endMs;

  for (let i = 1; i < ranges.length; i += 1) {
    const next = ranges[i];
    if (next.startMs <= currentEnd) {
      if (next.endMs > currentEnd) {
        currentEnd = next.endMs;
      }
    } else {
      totalMs += currentEnd - currentStart;
      currentStart = next.startMs;
      currentEnd = next.endMs;
    }
  }

  totalMs += currentEnd - currentStart;
  return Math.round(totalMs / 60_000);
}

/**
 * Aggregates HealthKit sleep category samples, counting only asleep stages.
 */
export function aggregateHealthKitSleepMinutes(
  samples: ReadonlyArray<HealthKitSleepSample>,
): number {
  const asleepIntervals: TimeIntervalInput[] = [];
  for (const sample of samples) {
    if (HEALTHKIT_ASLEEP_VALUES.has(sample.value)) {
      asleepIntervals.push({ start: sample.startDate, end: sample.endDate });
    }
  }
  return sumMergedIntervalMinutes(asleepIntervals);
}

/**
 * Aggregates Android Health Connect sleep sessions, using asleep stages when present
 * or falling back to the session interval when stages are unavailable.
 */
export function aggregateHealthConnectSleepMinutes(
  records: ReadonlyArray<HealthConnectSleepSessionRecord>,
): number {
  const intervals: TimeIntervalInput[] = [];

  for (const record of records) {
    if (record.stages && record.stages.length > 0) {
      const asleepStages = record.stages.filter((stage) =>
        HEALTH_CONNECT_ASLEEP_STAGES.has(stage.stage),
      );
      for (const stage of asleepStages) {
        intervals.push({ start: stage.startTime, end: stage.endTime });
      }
    } else {
      intervals.push({ start: record.startTime, end: record.endTime });
    }
  }

  return sumMergedIntervalMinutes(intervals);
}

function createAppleHealthProvider(healthkit: HealthKitModule): HealthProvider {
  return {
    platform: 'apple_health',
    isAvailable: () => {
      try {
        return Boolean(healthkit.isHealthDataAvailable());
      } catch {
        return false;
      }
    },
    requestPermissions: async () => {
      const authorized = await healthkit.requestAuthorization({
        toRead: [
          'HKQuantityTypeIdentifierStepCount',
          'HKCategoryTypeIdentifierSleepAnalysis',
        ],
      });
      return authorized ? 'granted' : 'denied';
    },
    fetchDailySummary: async (dateKey: string) => {
      const { start, end } = getLocalDateWindow(dateKey);
      const [stepSamples, sleepSamples] = await Promise.all([
        healthkit.queryQuantitySamples('HKQuantityTypeIdentifierStepCount', {
          limit: -1,
          filter: {
            date: {
              startDate: start,
              endDate: end,
            },
          },
        }),
        healthkit.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
          limit: -1,
          filter: {
            date: {
              startDate: start,
              endDate: end,
            },
          },
        }),
      ]);

      let rawSteps = 0;
      for (const sample of stepSamples) {
        if (Number.isFinite(sample.quantity) && sample.quantity > 0) {
          rawSteps += sample.quantity;
        }
      }

      const rawSleepMin = aggregateHealthKitSleepMinutes(sleepSamples);
      return clampHealthInput({
        sleepMin: rawSleepMin,
        steps: rawSteps,
      });
    },
  };
}

function createHealthConnectProvider(healthConnect: HealthConnectModule): HealthProvider {
  return {
    platform: 'health_connect',
    isAvailable: () => true,
    requestPermissions: async () => {
      const initialized = await healthConnect.initialize();
      if (!initialized) {
        return 'denied';
      }
      const granted = await healthConnect.requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'SleepSession' },
      ]);
      return granted.length > 0 ? 'granted' : 'denied';
    },
    fetchDailySummary: async (dateKey: string) => {
      const initialized = await healthConnect.initialize();
      if (!initialized) {
        return null;
      }

      const { start, end } = getLocalDateWindow(dateKey);
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };

      const [stepsResult, sleepResult] = await Promise.all([
        healthConnect.readRecords('Steps', { timeRangeFilter }),
        healthConnect.readRecords('SleepSession', { timeRangeFilter }),
      ]);

      let rawSteps = 0;
      for (const record of stepsResult.records) {
        if (Number.isFinite(record.count) && record.count > 0) {
          rawSteps += record.count;
        }
      }

      const rawSleepMin = aggregateHealthConnectSleepMinutes(sleepResult.records);
      return clampHealthInput({
        sleepMin: rawSleepMin,
        steps: rawSteps,
      });
    },
  };
}

/**
 * Registers the native Apple HealthKit or Android Health Connect provider when running
 * inside a custom native/standalone build. Safely no-ops in Expo Go and Web.
 */
export function registerNativeHealthProvider(): NativeHealthRegistrationResult {
  if (
    Platform.OS === 'web' ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return {
      registered: false,
      platform: 'unsupported',
      reason: 'expo_go_or_web',
    };
  }

  if (Platform.OS === 'ios') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const healthkit = require('@kingstinct/react-native-healthkit') as HealthKitModule;
      if (
        !healthkit ||
        typeof healthkit.isHealthDataAvailable !== 'function' ||
        typeof healthkit.requestAuthorization !== 'function' ||
        typeof healthkit.queryQuantitySamples !== 'function' ||
        typeof healthkit.queryCategorySamples !== 'function'
      ) {
        return {
          registered: false,
          platform: 'ios',
          reason: 'native_module_unavailable',
        };
      }

      setHealthProvider(createAppleHealthProvider(healthkit));
      return {
        registered: true,
        platform: 'ios',
      };
    } catch {
      return {
        registered: false,
        platform: 'ios',
        reason: 'native_module_unavailable',
      };
    }
  }

  if (Platform.OS === 'android') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const healthConnect = require('react-native-health-connect') as HealthConnectModule;
      if (
        !healthConnect ||
        typeof healthConnect.initialize !== 'function' ||
        typeof healthConnect.requestPermission !== 'function' ||
        typeof healthConnect.readRecords !== 'function'
      ) {
        return {
          registered: false,
          platform: 'android',
          reason: 'native_module_unavailable',
        };
      }

      setHealthProvider(createHealthConnectProvider(healthConnect));
      return {
        registered: true,
        platform: 'android',
      };
    } catch {
      return {
        registered: false,
        platform: 'android',
        reason: 'native_module_unavailable',
      };
    }
  }

  return {
    registered: false,
    platform: 'unsupported',
    reason: 'unsupported_platform',
  };
}
