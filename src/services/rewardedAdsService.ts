import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

interface AsyncStorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

function getOptionalAsyncStorage(): AsyncStorageLike | null {
  try {
    const dynamicRequire = require as (id: string) => unknown;
    const mod = dynamicRequire('@react-native-async-storage/async-storage') as
      | { default?: AsyncStorageLike }
      | AsyncStorageLike
      | null
      | undefined;
    const candidate =
      mod && 'default' in mod && mod.default ? mod.default : (mod as AsyncStorageLike | null);
    if (
      candidate &&
      typeof candidate.getItem === 'function' &&
      typeof candidate.setItem === 'function'
    ) {
      return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

export const REWARDED_DEW_AMOUNT = 20;
export const MAX_DAILY_REWARDED_ADS = 3;
/**
 * Strict Apple App Store Guideline 5.1.3 & Google Health Connect compliance:
 * zero health data is ever passed to ad networks and all requests are
 * strictly non-personalized.
 */
export const NON_PERSONALIZED_ONLY = true;

const REWARDED_ADS_STORAGE_KEY = 'dew-and-bloom-rewarded-ads-v1';
const ADMOB_MODULE_NAME = 'react-native-google-mobile-ads';
const SIMULATION_DELAY_MS = 600;

export interface CanWatchRewardedDewInput {
  isPro: boolean;
  watchedToday: number;
}

export interface WatchRewardedDewAdInput {
  isPro: boolean;
  dateKey?: string;
  simulationDelayMs?: number;
}

export interface RewardedDewAdResult {
  ok: boolean;
  dewAwarded: number;
  remainingToday: number;
  source: 'admob' | 'simulation' | 'blocked';
  reason?: 'pro_user' | 'daily_cap_reached' | 'dismissed' | 'ad_failed';
}

interface RewardedAdInstance {
  addAdEventListener: (eventType: string, listener: () => void) => () => void;
  load: () => void;
  show: () => Promise<void> | void;
}

interface GoogleMobileAdsModule {
  RewardedAd: {
    createForAdRequest: (
      adUnitId: string,
      requestOptions?: { requestNonPersonalizedAdsOnly?: boolean },
    ) => RewardedAdInstance;
  };
  RewardedAdEventType?: {
    LOADED?: string;
    EARNED_REWARD?: string;
  };
  AdEventType?: {
    CLOSED?: string;
    ERROR?: string;
  };
}

let watchedCountByDate: Record<string, number> = {};

/**
 * Formats a Date into a local calendar `YYYY-MM-DD` key.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pure check for whether a user is eligible to watch a Cozy Rewarded Dew ad.
 * Pro users never see ads; free users are capped at MAX_DAILY_REWARDED_ADS/day.
 */
export function canWatchRewardedDew({
  isPro,
  watchedToday,
}: CanWatchRewardedDewInput): boolean {
  if (isPro) {
    return false;
  }
  const normalized = Number.isFinite(watchedToday) ? Math.max(0, watchedToday) : 0;
  return normalized < MAX_DAILY_REWARDED_ADS;
}

export function getRemainingRewardedAds(watchedToday: number): number {
  const normalized = Number.isFinite(watchedToday) ? Math.max(0, watchedToday) : 0;
  return Math.max(0, MAX_DAILY_REWARDED_ADS - normalized);
}

export function getWatchedTodayCount(dateKey: string = getLocalDateKey()): number {
  return watchedCountByDate[dateKey] ?? 0;
}

/**
 * Hydrates today's watched count from AsyncStorage (best-effort) and returns it.
 */
export async function loadWatchedTodayCount(
  dateKey: string = getLocalDateKey(),
): Promise<number> {
  try {
    const storage = getOptionalAsyncStorage();
    const raw = storage ? await storage.getItem(REWARDED_ADS_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const storedCount = parsed?.[dateKey];
      if (typeof storedCount === 'number' && Number.isFinite(storedCount) && storedCount >= 0) {
        watchedCountByDate[dateKey] = Math.max(
          watchedCountByDate[dateKey] ?? 0,
          Math.floor(storedCount),
        );
      }
    }
  } catch {
    // Fall back to in-memory counter if AsyncStorage is unavailable.
  }

  return watchedCountByDate[dateKey] ?? 0;
}

async function persistWatchedCount(dateKey: string, count: number): Promise<void> {
  watchedCountByDate[dateKey] = count;
  try {
    const storage = getOptionalAsyncStorage();
    if (storage) {
      await storage.setItem(
        REWARDED_ADS_STORAGE_KEY,
        JSON.stringify({ [dateKey]: count }),
      );
    }
  } catch {
    // Keep in-memory state even if storage write fails.
  }
}

/**
 * Resets in-memory daily watch tracking (primarily for deterministic unit tests).
 */
export function resetRewardedAdsState(): void {
  watchedCountByDate = {};
}

function getConfiguredAdUnitId(): string | null {
  if (
    (Platform.OS !== 'ios' && Platform.OS !== 'android') ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return null;
  }

  const raw =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_IOS
      : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID_ANDROID;

  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

function loadGoogleMobileAdsModule(): GoogleMobileAdsModule | null {
  try {
    const dynamicRequire = require as (id: string) => unknown;
    const loaded = dynamicRequire(ADMOB_MODULE_NAME) as
      | ({ default?: GoogleMobileAdsModule } & Partial<GoogleMobileAdsModule>)
      | null
      | undefined;
    const candidate = (loaded?.default ?? loaded) as
      | Partial<GoogleMobileAdsModule>
      | null
      | undefined;
    if (
      !candidate?.RewardedAd ||
      typeof candidate.RewardedAd.createForAdRequest !== 'function'
    ) {
      return null;
    }
    return candidate as GoogleMobileAdsModule;
  } catch {
    return null;
  }
}

function runNativeRewardedAd(
  ads: GoogleMobileAdsModule,
  adUnitId: string,
): Promise<{ earned: boolean; failed?: boolean }> {
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const unsubscribers: Array<() => void> = [];

    const finish = (result: { earned: boolean; failed?: boolean }) => {
      if (settled) {
        return;
      }
      settled = true;
      for (const unsub of unsubscribers) {
        try {
          unsub();
        } catch {
          // Ignore listener cleanup errors.
        }
      }
      resolve(result);
    };

    try {
      const rewarded = ads.RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: NON_PERSONALIZED_ONLY,
      });

      const loadedEvent = ads.RewardedAdEventType?.LOADED ?? 'loaded';
      const earnedEvent = ads.RewardedAdEventType?.EARNED_REWARD ?? 'earned_reward';
      const closedEvent = ads.AdEventType?.CLOSED ?? 'closed';
      const errorEvent = ads.AdEventType?.ERROR ?? 'error';

      unsubscribers.push(
        rewarded.addAdEventListener(loadedEvent, () => {
          void Promise.resolve(rewarded.show()).catch(() => {
            finish({ earned: false, failed: true });
          });
        }),
      );

      unsubscribers.push(
        rewarded.addAdEventListener(earnedEvent, () => {
          earned = true;
        }),
      );

      unsubscribers.push(
        rewarded.addAdEventListener(closedEvent, () => {
          finish({ earned });
        }),
      );

      unsubscribers.push(
        rewarded.addAdEventListener(errorEvent, () => {
          finish({ earned: false, failed: true });
        }),
      );

      rewarded.load();
    } catch {
      finish({ earned: false, failed: true });
    }
  });
}

/**
 * Plays an opt-in Cozy Rewarded Dew video ad (strictly non-personalized,
 * zero health data shared). Falls back to a clean 600ms preview simulation
 * in Expo Go, Web, Jest, or when AdMob unit IDs are not configured.
 */
export async function watchRewardedDewAd({
  isPro,
  dateKey = getLocalDateKey(),
  simulationDelayMs = SIMULATION_DELAY_MS,
}: WatchRewardedDewAdInput): Promise<RewardedDewAdResult> {
  if (isPro) {
    return {
      ok: false,
      dewAwarded: 0,
      remainingToday: 0,
      source: 'blocked',
      reason: 'pro_user',
    };
  }

  const watchedToday = getWatchedTodayCount(dateKey);
  if (!canWatchRewardedDew({ isPro, watchedToday })) {
    return {
      ok: false,
      dewAwarded: 0,
      remainingToday: 0,
      source: 'blocked',
      reason: 'daily_cap_reached',
    };
  }

  const adUnitId = getConfiguredAdUnitId();
  const adsModule = adUnitId ? loadGoogleMobileAdsModule() : null;

  if (adUnitId && adsModule) {
    const outcome = await runNativeRewardedAd(adsModule, adUnitId);
    if (!outcome.earned) {
      return {
        ok: false,
        dewAwarded: 0,
        remainingToday: getRemainingRewardedAds(watchedToday),
        source: 'admob',
        reason: outcome.failed ? 'ad_failed' : 'dismissed',
      };
    }

    const nextWatched = watchedToday + 1;
    await persistWatchedCount(dateKey, nextWatched);
    return {
      ok: true,
      dewAwarded: REWARDED_DEW_AMOUNT,
      remainingToday: getRemainingRewardedAds(nextWatched),
      source: 'admob',
    };
  }

  if (simulationDelayMs > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, simulationDelayMs);
    });
  }

  const nextWatched = watchedToday + 1;
  await persistWatchedCount(dateKey, nextWatched);

  return {
    ok: true,
    dewAwarded: REWARDED_DEW_AMOUNT,
    remainingToday: getRemainingRewardedAds(nextWatched),
    source: 'simulation',
  };
}
