import { Platform } from 'react-native';
import { getCatalogItemById, SUNLIT_MEADOW_CATALOG } from '../domain/catalog';
import type { CatalogItem } from '../domain/types';
import { getLocalDateKey, watchRewardedDewAd } from './rewardedAdsService';

export const FREE_DAILY_SNAPS = 1;
export const FREE_REWARDED_BONUS_SNAPS = 1;
export const PRO_DAILY_SNAPS = 5;

const FIELD_SNAP_STORAGE_KEY = 'dew-and-bloom-field-snap-v1';
const IMAGE_PICKER_MODULE_NAME = 'expo-image-picker';

export const NOT_OUTDOOR_NATURE_MESSAGE =
  'Step outside and point at real leaves, flowers, or trees.';

interface AsyncStorageLike {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

interface DailyFieldSnapRecord {
  snapsUsedToday: number;
  bonusSnapUnlockedToday: boolean;
}

export interface FieldSnapAllowance {
  remaining: number;
  limit: number;
  canUnlockBonusWithAd: boolean;
}

export interface CaptureOutdoorPhotoSuccess {
  ok: true;
  imageBase64: string;
  mimeType: string;
  source: 'camera' | 'simulation';
}

export interface CaptureOutdoorPhotoFailure {
  ok: false;
  cancelled?: boolean;
  reason: 'CANCELLED' | 'PERMISSION_DENIED' | 'CAMERA_UNAVAILABLE';
  message: string;
}

export type CaptureOutdoorPhotoResult =
  | CaptureOutdoorPhotoSuccess
  | CaptureOutdoorPhotoFailure;

export interface PlantVisionResponse {
  isOutdoorNature: boolean;
  isScreenOrFake: boolean;
  matchedCatalogId: string | null;
  speciesName: string;
  fieldNote: string;
}

export interface IdentifyAndResolveFieldSnapInput {
  imageBase64: string;
  mimeType: string;
  isPro: boolean;
  ownedItemIds: readonly string[];
  dateKey?: string;
}

export interface FieldSnapSuccessResult {
  ok: true;
  catalogItem: CatalogItem;
  speciesName: string;
  fieldNote: string;
  sunlightBonus: number;
  unlockItemId: string | null;
  canPlantImmediately: boolean;
  proPreview: boolean;
  alreadyOwned: boolean;
  source: 'edge' | 'local';
  allowanceAfter: FieldSnapAllowance;
}

export interface FieldSnapFailureResult {
  ok: false;
  reason: 'NOT_OUTDOOR_NATURE' | 'DAILY_LIMIT_REACHED';
  message: string;
  allowanceAfter: FieldSnapAllowance;
}

export type FieldSnapResult = FieldSnapSuccessResult | FieldSnapFailureResult;

interface ExpoImagePickerModule {
  requestCameraPermissionsAsync?: () => Promise<{ granted?: boolean; status?: string }>;
  launchCameraAsync?: (options?: Record<string, unknown>) => Promise<{
    canceled?: boolean;
    assets?: Array<{ base64?: string | null; mimeType?: string | null }>;
  }>;
}

let recordsByDate: Record<string, DailyFieldSnapRecord> = {};

const PLANT_CATALOG: readonly CatalogItem[] = SUNLIT_MEADOW_CATALOG.filter(
  (item) => item.category === 'plant',
);

const PLANT_CATALOG_IDS: readonly string[] = PLANT_CATALOG.map((item) => item.id);

const FALLBACK_FIELD_NOTES: Record<string, { speciesName: string; fieldNote: string }> = {
  lavender: {
    speciesName: 'English Lavender',
    fieldNote: 'Soft violet spikes thriving in open sunlight—an easy match for your meadow.',
  },
  bonsai_sprout: {
    speciesName: 'Dwarf Pine Sapling',
    fieldNote: 'Sturdy needles shaped by outdoor air and patient, steady light.',
  },
  sunlit_fern: {
    speciesName: 'Woodland Fern',
    fieldNote: 'Feathered green fronds catching dappled afternoon light.',
  },
  mossy_clover: {
    speciesName: 'Wild White Clover',
    fieldNote: 'Low, soft groundcover humming with quiet outdoor warmth.',
  },
  meadow_daisy: {
    speciesName: 'Oxeye Meadow Daisy',
    fieldNote: 'Bright cream petals turning naturally toward the afternoon sun.',
  },
  chamomile_tuft: {
    speciesName: 'Wild Chamomile',
    fieldNote: 'Delicate golden-centered blossoms with a calm, herbal presence.',
  },
  rosemary_sprig: {
    speciesName: 'Garden Rosemary',
    fieldNote: 'Aromatic evergreen stems rooted in crisp outdoor air.',
  },
  morning_glory: {
    speciesName: 'Sky Morning Glory',
    fieldNote: 'Trumpet-shaped petals that greet fresh morning daylight.',
  },
};

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

function getRecord(dateKey: string): DailyFieldSnapRecord {
  return (
    recordsByDate[dateKey] ?? {
      snapsUsedToday: 0,
      bonusSnapUnlockedToday: false,
    }
  );
}

async function persistRecord(dateKey: string, record: DailyFieldSnapRecord): Promise<void> {
  recordsByDate[dateKey] = record;
  try {
    const storage = getOptionalAsyncStorage();
    if (storage) {
      await storage.setItem(FIELD_SNAP_STORAGE_KEY, JSON.stringify({ [dateKey]: record }));
    }
  } catch {
    // Keep in-memory state if AsyncStorage is unavailable.
  }
}

export async function loadFieldSnapState(
  dateKey: string = getLocalDateKey(),
): Promise<DailyFieldSnapRecord> {
  try {
    const storage = getOptionalAsyncStorage();
    const raw = storage ? await storage.getItem(FIELD_SNAP_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, Partial<DailyFieldSnapRecord>>;
      const stored = parsed?.[dateKey];
      if (stored && typeof stored === 'object') {
        const current = getRecord(dateKey);
        const storedUsed =
          typeof stored.snapsUsedToday === 'number' &&
          Number.isFinite(stored.snapsUsedToday) &&
          stored.snapsUsedToday >= 0
            ? Math.floor(stored.snapsUsedToday)
            : 0;
        recordsByDate[dateKey] = {
          snapsUsedToday: Math.max(current.snapsUsedToday, storedUsed),
          bonusSnapUnlockedToday:
            current.bonusSnapUnlockedToday || Boolean(stored.bonusSnapUnlockedToday),
        };
      }
    }
  } catch {
    // Ignore storage read failures and rely on in-memory state.
  }

  return getRecord(dateKey);
}

export function resetFieldSnapState(): void {
  recordsByDate = {};
}

export function getFieldSnapAllowance({
  isPro,
  dateKey = getLocalDateKey(),
}: {
  isPro: boolean;
  dateKey?: string;
}): FieldSnapAllowance {
  const record = getRecord(dateKey);
  if (isPro) {
    const limit = PRO_DAILY_SNAPS;
    return {
      remaining: Math.max(0, limit - record.snapsUsedToday),
      limit,
      canUnlockBonusWithAd: false,
    };
  }

  const limit =
    FREE_DAILY_SNAPS + (record.bonusSnapUnlockedToday ? FREE_REWARDED_BONUS_SNAPS : 0);
  const remaining = Math.max(0, limit - record.snapsUsedToday);

  return {
    remaining,
    limit,
    canUnlockBonusWithAd: !record.bonusSnapUnlockedToday && remaining === 0,
  };
}

export async function unlockBonusFieldSnap(
  dateKey: string = getLocalDateKey(),
): Promise<FieldSnapAllowance> {
  const current = getRecord(dateKey);
  if (!current.bonusSnapUnlockedToday) {
    await persistRecord(dateKey, {
      ...current,
      bonusSnapUnlockedToday: true,
    });
  }
  return getFieldSnapAllowance({ isPro: false, dateKey });
}

export async function unlockBonusFieldSnapWithAd({
  isPro,
  dateKey = getLocalDateKey(),
  simulationDelayMs,
}: {
  isPro: boolean;
  dateKey?: string;
  simulationDelayMs?: number;
}): Promise<{ ok: boolean; allowance: FieldSnapAllowance; reason?: string }> {
  const allowance = getFieldSnapAllowance({ isPro, dateKey });
  if (isPro || !allowance.canUnlockBonusWithAd) {
    return { ok: false, allowance, reason: 'not_eligible' };
  }

  const adResult = await watchRewardedDewAd({
    isPro,
    dateKey,
    simulationDelayMs,
  });

  if (!adResult.ok) {
    return { ok: false, allowance, reason: adResult.reason ?? 'ad_failed' };
  }

  const updatedAllowance = await unlockBonusFieldSnap(dateKey);
  return { ok: true, allowance: updatedAllowance };
}

function loadImagePickerModule(): ExpoImagePickerModule | null {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    const dynamicRequire = require as (id: string) => unknown;
    const mod = dynamicRequire(IMAGE_PICKER_MODULE_NAME) as
      | ({ default?: ExpoImagePickerModule } & Partial<ExpoImagePickerModule>)
      | null
      | undefined;
    const candidate = (mod?.default ?? mod) as ExpoImagePickerModule | null | undefined;
    if (candidate && typeof candidate.launchCameraAsync === 'function') {
      return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Captures a live outdoor photo via camera only (never opens photo library/gallery).
 * Falls back to a deterministic botanical sample in Expo Go, Web, or Jest.
 */
export async function captureOutdoorPhoto(): Promise<CaptureOutdoorPhotoResult> {
  const picker = loadImagePickerModule();

  if (picker && typeof picker.launchCameraAsync === 'function') {
    try {
      if (typeof picker.requestCameraPermissionsAsync === 'function') {
        const permission = await picker.requestCameraPermissionsAsync();
        const granted = permission?.granted ?? permission?.status === 'granted';
        if (!granted) {
          return {
            ok: false,
            reason: 'PERMISSION_DENIED',
            message: 'Allow camera access in Settings to snap outdoor plants.',
          };
        }
      }

      const result = await picker.launchCameraAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.65,
        allowsEditing: false,
      });

      if (result.canceled) {
        return {
          ok: false,
          cancelled: true,
          reason: 'CANCELLED',
          message: 'Camera capture cancelled.',
        };
      }

      const asset = result.assets?.[0];
      if (asset?.base64) {
        return {
          ok: true,
          imageBase64: asset.base64,
          mimeType: asset.mimeType || 'image/jpeg',
          source: 'camera',
        };
      }
    } catch {
      // Fall through to clean simulation fallback when native camera is unavailable.
    }
  }

  const sampleSeed = `outdoor-meadow-leaf-${Date.now()}`;
  return {
    ok: true,
    imageBase64: sampleSeed,
    mimeType: 'image/jpeg',
    source: 'simulation',
  };
}

function deterministicLocalVisionMatch(
  imageBase64: string,
  ownedItemIds: readonly string[],
): PlantVisionResponse {
  let hash = 0;
  for (let i = 0; i < imageBase64.length; i += 1) {
    hash = (hash * 31 + imageBase64.charCodeAt(i)) >>> 0;
  }

  const freePlants = PLANT_CATALOG.filter((item) => !item.isPro);
  const unownedFreePlants = freePlants.filter((item) => !ownedItemIds.includes(item.id));
  const pool = unownedFreePlants.length > 0 ? unownedFreePlants : freePlants;
  const matched = pool[hash % pool.length] ?? PLANT_CATALOG[0];
  const noteMeta = FALLBACK_FIELD_NOTES[matched.id];

  return {
    isOutdoorNature: true,
    isScreenOrFake: false,
    matchedCatalogId: matched.id,
    speciesName: noteMeta?.speciesName ?? matched.name,
    fieldNote: noteMeta?.fieldNote ?? matched.description,
  };
}

async function callIdentifyPlantEdgeFunction(
  imageBase64: string,
  mimeType: string,
): Promise<PlantVisionResponse | null> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    return null;
  }

  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }

  try {
    const response = await fetch(`${baseUrl}/functions/v1/identify-plant`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        imageBase64,
        mimeType,
        catalogIds: PLANT_CATALOG_IDS,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const parsed = (await response.json()) as Partial<PlantVisionResponse>;
    if (typeof parsed.isOutdoorNature !== 'boolean') {
      return null;
    }

    return {
      isOutdoorNature: parsed.isOutdoorNature,
      isScreenOrFake: Boolean(parsed.isScreenOrFake),
      matchedCatalogId:
        typeof parsed.matchedCatalogId === 'string' ? parsed.matchedCatalogId : null,
      speciesName: typeof parsed.speciesName === 'string' ? parsed.speciesName : '',
      fieldNote: typeof parsed.fieldNote === 'string' ? parsed.fieldNote : '',
    };
  } catch {
    return null;
  }
}

export async function identifyAndResolveFieldSnap({
  imageBase64,
  mimeType,
  isPro,
  ownedItemIds,
  dateKey = getLocalDateKey(),
}: IdentifyAndResolveFieldSnapInput): Promise<FieldSnapResult> {
  const allowanceBefore = getFieldSnapAllowance({ isPro, dateKey });
  if (allowanceBefore.remaining <= 0) {
    return {
      ok: false,
      reason: 'DAILY_LIMIT_REACHED',
      message: isPro
        ? 'You have used all 5 Field Snaps for today. Return tomorrow for fresh finds.'
        : 'You have used your daily Field Snap. Watch a short video for +1 bonus snap.',
      allowanceAfter: allowanceBefore,
    };
  }

  const edgeVision = await callIdentifyPlantEdgeFunction(imageBase64, mimeType);
  const source: 'edge' | 'local' = edgeVision ? 'edge' : 'local';
  const vision = edgeVision ?? deterministicLocalVisionMatch(imageBase64, ownedItemIds);

  if (!vision.isOutdoorNature || vision.isScreenOrFake) {
    return {
      ok: false,
      reason: 'NOT_OUTDOOR_NATURE',
      message: NOT_OUTDOOR_NATURE_MESSAGE,
      allowanceAfter: allowanceBefore,
    };
  }

  const matchedItem =
    (vision.matchedCatalogId ? getCatalogItemById(vision.matchedCatalogId) : undefined) ??
    PLANT_CATALOG[0];

  const currentRecord = getRecord(dateKey);
  await persistRecord(dateKey, {
    ...currentRecord,
    snapsUsedToday: currentRecord.snapsUsedToday + 1,
  });
  const allowanceAfter = getFieldSnapAllowance({ isPro, dateKey });

  const speciesName = vision.speciesName.trim() || matchedItem.name;
  const fieldNote = vision.fieldNote.trim() || matchedItem.description;

  if (matchedItem.isPro && !isPro) {
    return {
      ok: true,
      catalogItem: matchedItem,
      speciesName,
      fieldNote,
      sunlightBonus: 35,
      unlockItemId: null,
      canPlantImmediately: false,
      proPreview: true,
      alreadyOwned: false,
      source,
      allowanceAfter,
    };
  }

  const alreadyOwned = ownedItemIds.includes(matchedItem.id);
  if (alreadyOwned) {
    return {
      ok: true,
      catalogItem: matchedItem,
      speciesName,
      fieldNote,
      sunlightBonus: 25,
      unlockItemId: null,
      canPlantImmediately: true,
      proPreview: false,
      alreadyOwned: true,
      source,
      allowanceAfter,
    };
  }

  return {
    ok: true,
    catalogItem: matchedItem,
    speciesName,
    fieldNote,
    sunlightBonus: 20,
    unlockItemId: matchedItem.id,
    canPlantImmediately: true,
    proPreview: false,
    alreadyOwned: false,
    source,
    allowanceAfter,
  };
}
