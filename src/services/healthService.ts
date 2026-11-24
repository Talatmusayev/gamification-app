import { Platform } from 'react-native';
import { clampHealthInput } from '@/domain/economy';

export type HealthPlatform = 'apple_health' | 'health_connect' | 'none';

export type HealthPermissionStatus = 'granted' | 'denied' | 'unavailable';

export type HealthUnavailableReason =
  | 'native_build_required'
  | 'permission_denied'
  | 'provider_error';

export interface RawHealthSummary {
  sleepMin: number;
  steps: number;
  bedtimeOffsetMin?: number;
}

export interface HealthProvider {
  platform: Exclude<HealthPlatform, 'none'>;
  isAvailable?: () => boolean;
  requestPermissions: () => Promise<'granted' | 'denied'>;
  fetchDailySummary: (dateKey: string) => Promise<RawHealthSummary | null>;
}

export interface HealthPlatformInfo {
  platform: HealthPlatform;
  available: boolean;
  reason?: HealthUnavailableReason;
}

export interface HealthPermissionResult {
  granted: boolean;
  status: HealthPermissionStatus;
  platform: HealthPlatform;
  available: boolean;
  reason?: HealthUnavailableReason;
}

export interface DailyHealthSummary {
  available: boolean;
  dateKey: string;
  sleepMin: number;
  steps: number;
  bedtimeOffsetMin?: number;
  source: HealthPlatform | 'fallback';
  reason?: HealthUnavailableReason;
}

let activeProvider: HealthProvider | null = null;

function resolveTargetPlatform(): HealthPlatform {
  if (Platform.OS === 'ios') {
    return 'apple_health';
  }
  if (Platform.OS === 'android') {
    return 'health_connect';
  }
  return 'none';
}

function isProviderReady(provider: HealthProvider | null): provider is HealthProvider {
  if (!provider) {
    return false;
  }
  if (Platform.OS === 'web') {
    return false;
  }
  if (typeof provider.isAvailable === 'function') {
    try {
      return provider.isAvailable();
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Registers or clears the optional native HealthKit / Health Connect bridge.
 * In Expo Go or Web, no native bridge is registered and calls fall back safely.
 */
export function setHealthProvider(provider: HealthProvider | null): void {
  activeProvider = provider;
}

export function getHealthProvider(): HealthProvider | null {
  return activeProvider;
}

/**
 * Reports whether passive OS health sync is available on the current runtime.
 */
export function getHealthPlatformInfo(): HealthPlatformInfo {
  if (isProviderReady(activeProvider)) {
    return {
      platform: activeProvider.platform,
      available: true,
    };
  }

  return {
    platform: resolveTargetPlatform(),
    available: false,
    reason: 'native_build_required',
  };
}

/**
 * Requests read permissions from Apple HealthKit or Android Health Connect
 * when a native bridge is linked, or returns a safe unavailable fallback.
 */
export async function requestHealthPermissions(): Promise<HealthPermissionResult> {
  if (!isProviderReady(activeProvider)) {
    return {
      granted: false,
      status: 'unavailable',
      platform: resolveTargetPlatform(),
      available: false,
      reason: 'native_build_required',
    };
  }

  try {
    const status = await activeProvider.requestPermissions();
    if (status === 'granted') {
      return {
        granted: true,
        status: 'granted',
        platform: activeProvider.platform,
        available: true,
      };
    }

    return {
      granted: false,
      status: 'denied',
      platform: activeProvider.platform,
      available: true,
      reason: 'permission_denied',
    };
  } catch {
    return {
      granted: false,
      status: 'denied',
      platform: activeProvider.platform,
      available: true,
      reason: 'provider_error',
    };
  }
}

/**
 * Fetches passive sleep and step totals for a local dateKey (YYYY-MM-DD)
 * and clamps all values through `clampHealthInput` before returning.
 */
export async function fetchDailyHealthSummary(
  dateKey: string,
): Promise<DailyHealthSummary> {
  if (!isProviderReady(activeProvider)) {
    return {
      available: false,
      dateKey,
      sleepMin: 0,
      steps: 0,
      source: 'fallback',
      reason: 'native_build_required',
    };
  }

  try {
    const raw = await activeProvider.fetchDailySummary(dateKey);
    if (!raw) {
      return {
        available: false,
        dateKey,
        sleepMin: 0,
        steps: 0,
        source: 'fallback',
        reason: 'permission_denied',
      };
    }

    const clamped = clampHealthInput({
      sleepMin: raw.sleepMin,
      steps: raw.steps,
    });

    const bedtimeOffsetMin =
      raw.bedtimeOffsetMin !== undefined && Number.isFinite(raw.bedtimeOffsetMin)
        ? raw.bedtimeOffsetMin
        : undefined;

    return {
      available: true,
      dateKey,
      sleepMin: clamped.sleepMin,
      steps: clamped.steps,
      bedtimeOffsetMin,
      source: activeProvider.platform,
    };
  } catch {
    return {
      available: false,
      dateKey,
      sleepMin: 0,
      steps: 0,
      source: 'fallback',
      reason: 'provider_error',
    };
  }
}
