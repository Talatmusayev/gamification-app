import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCatalogItemById } from '@/domain/catalog';
import { calculateHarmonyScore } from '@/domain/fog';
import type {
  DailyLog,
  FogLevel,
  GardenPlacement,
  UserProfile,
} from '@/domain/types';

export const WIDGET_SNAPSHOT_STORAGE_KEY = 'dew-bloom-widget-snapshot-v1';
export const MAX_WIDGET_TOP_ASSETS = 5;

export interface WidgetSnapshotInput {
  profile: UserProfile;
  placements: GardenPlacement[];
  dailyLogs: Record<string, DailyLog>;
  nowIso?: string;
}

export interface WidgetSnapshot {
  dewBalance: number;
  sunlightBalance: number;
  fogLevel: FogLevel;
  harmonyDays: number;
  harmonyWindow: number;
  placedCount: number;
  topAssetKeys: string[];
  updatedAt: string;
}

export type WidgetReloadHook = (snapshot: WidgetSnapshot) => Promise<void> | void;

let nativeReloadHook: WidgetReloadHook | null = null;

/**
 * Registers or clears an optional native WidgetKit (iOS AppGroup) / Android Glance reload hook.
 */
export function setWidgetReloadHook(hook: WidgetReloadHook | null): void {
  nativeReloadHook = hook;
}

/**
 * Builds a compact JSON-serializable snapshot for Home Screen Widgets.
 */
export function buildWidgetSnapshot(input: WidgetSnapshotInput): WidgetSnapshot {
  const harmony = calculateHarmonyScore(Object.values(input.dailyLogs));

  const topAssetKeys: string[] = [];
  const seenAssets = new Set<string>();

  for (const placement of input.placements) {
    const catalogItem = getCatalogItemById(placement.itemId);
    const assetKey = catalogItem?.assetKey;
    if (!assetKey || seenAssets.has(assetKey)) {
      continue;
    }
    seenAssets.add(assetKey);
    topAssetKeys.push(assetKey);
    if (topAssetKeys.length >= MAX_WIDGET_TOP_ASSETS) {
      break;
    }
  }

  return {
    dewBalance: input.profile.dewBalance,
    sunlightBalance: input.profile.sunlightBalance,
    fogLevel: input.profile.fogLevel,
    harmonyDays: harmony.restfulDays,
    harmonyWindow: harmony.windowDays,
    placedCount: input.placements.length,
    topAssetKeys,
    updatedAt: input.nowIso ?? new Date().toISOString(),
  };
}

/**
 * Persists the live widget snapshot to AsyncStorage and notifies any linked native widget bridge.
 */
export async function persistWidgetSnapshot(
  snapshot: WidgetSnapshot,
): Promise<{ persisted: boolean; reloadedNative: boolean }> {
  let persisted = false;
  let reloadedNative = false;

  try {
    await AsyncStorage.setItem(
      WIDGET_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
    persisted = true;
  } catch {
    persisted = false;
  }

  if (nativeReloadHook) {
    try {
      await nativeReloadHook(snapshot);
      reloadedNative = true;
    } catch {
      reloadedNative = false;
    }
  }

  return { persisted, reloadedNative };
}
