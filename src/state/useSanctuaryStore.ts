import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  CATALOG_BY_ID,
  getCatalogItemById,
  SUNLIT_MEADOW_CATALOG,
} from '../domain/catalog';
import { processMorningReveal } from '../domain/fog';
import { movePlacement, validateAndPlaceItem } from '../domain/grid';
import { waterPlacement } from '../domain/growth';
import { completeLanternSession, startLanternSession } from '../domain/lantern';
import {
  buildWidgetSnapshot,
  persistWidgetSnapshot,
} from '../services/widgetBridge';
import type {
  DailyLog,
  GardenPlacement,
  LanternSession,
  MorningRevealResult,
  TrackingMode,
  UserProfile,
} from '../domain/types';

export const SANCTUARY_STORAGE_KEY = 'dew-and-bloom-sanctuary-v1';

const CENTER_TILE_X = 3;
const CENTER_TILE_Y = 3;
const STARTER_DEW_POUCH = 60;
const STARTER_SUNLIGHT_POUCH = 60;
const DEFAULT_BEDTIME_DEW = 10;

export interface CompleteOnboardingInput {
  sleepGoalMin: number;
  stepGoal: number;
  starterItemId: string;
  trackingMode: TrackingMode;
}

export interface TriggerMorningRevealInput {
  dateKey: string;
  sleepMin: number;
  steps: number;
  bedtimeOffsetMin?: number;
}

export interface SanctuaryDataState {
  profile: UserProfile;
  placements: GardenPlacement[];
  ownedItemIds: string[];
  dailyLogs: Record<string, DailyLog>;
  activeLantern: LanternSession | null;
  pendingReveal: MorningRevealResult | null;
}

export interface SanctuaryActions {
  completeOnboarding: (input: CompleteOnboardingInput) => void;
  triggerMorningReveal: (input: TriggerMorningRevealInput) => MorningRevealResult;
  placeCatalogItem: (
    itemId: string,
    x: number,
    y: number,
  ) => ReturnType<typeof validateAndPlaceItem>;
  movePlacedItem: (
    placementId: string,
    toX: number,
    toY: number,
  ) => ReturnType<typeof movePlacement>;
  waterPlacedItem: (
    placementId: string,
    nowIso?: string,
  ) => ReturnType<typeof waterPlacement>;
  startLantern: (nowIso?: string) => void;
  awardBedtimeDew: (amount?: number) => void;
  finishLantern: (nowIso?: string, steps?: number) => MorningRevealResult | null;
  dismissPendingReveal: () => void;
  setPendingReveal: (reveal: MorningRevealResult | null) => void;
  updateGoals: (sleepGoalMin: number, stepGoal: number) => void;
  resetAllData: () => void;
}

export type SanctuaryStore = SanctuaryDataState & SanctuaryActions;

function createInitialState(): SanctuaryDataState {
  return {
    profile: {
      sleepGoalMin: 480,
      stepGoal: 8000,
      trackingMode: 'phone_only',
      dewBalance: 0,
      sunlightBalance: 0,
      fogLevel: 0,
      isPro: false,
      onboardingCompleted: false,
    },
    placements: [],
    ownedItemIds: [],
    dailyLogs: {},
    activeLantern: null,
    pendingReveal: null,
  };
}

function toLocalDateKey(isoString: string): string {
  const parsed = new Date(isoString);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function syncWidgetSnapshot(
  state: Pick<SanctuaryDataState, 'profile' | 'placements' | 'dailyLogs'>,
): void {
  void persistWidgetSnapshot(
    buildWidgetSnapshot({
      profile: state.profile,
      placements: state.placements,
      dailyLogs: state.dailyLogs,
    }),
  ).catch(() => {});
}

export const useSanctuaryStore = create<SanctuaryStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      completeOnboarding: (input) => {
        const starterItem = getCatalogItemById(input.starterItemId);
        const starterDecor =
          getCatalogItemById('stepping_stone') ??
          SUNLIT_MEADOW_CATALOG.find(
            (item) => item.category === 'decor' && !item.isPro,
          );
        const starterFlora =
          (input.starterItemId !== 'meadow_daisy'
            ? getCatalogItemById('meadow_daisy')
            : undefined) ??
          SUNLIT_MEADOW_CATALOG.find(
            (item) =>
              item.category === 'plant' &&
              !item.isPro &&
              item.id !== input.starterItemId,
          );

        const starterNook: Array<{
          item: ReturnType<typeof getCatalogItemById>;
          x: number;
          y: number;
        }> = [
          { item: starterItem, x: CENTER_TILE_X, y: CENTER_TILE_Y },
          { item: starterDecor, x: 4, y: 3 },
          { item: starterFlora, x: 2, y: 4 },
        ];

        let placements: GardenPlacement[] = [];
        let ownedItemIds: string[] = [];

        for (const entry of starterNook) {
          if (!entry.item) {
            continue;
          }
          if (!ownedItemIds.includes(entry.item.id)) {
            ownedItemIds = [...ownedItemIds, entry.item.id];
          }
          const placed = validateAndPlaceItem({
            item: entry.item,
            x: entry.x,
            y: entry.y,
            placements,
            ownedItemIds,
            dewBalance: STARTER_DEW_POUCH,
            sunlightBalance: STARTER_SUNLIGHT_POUCH,
            isPro: false,
          });
          if (placed.ok) {
            placements = placed.nextPlacements;
            ownedItemIds = placed.nextOwnedIds;
          }
        }

        set({
          profile: {
            sleepGoalMin: input.sleepGoalMin,
            stepGoal: input.stepGoal,
            trackingMode: input.trackingMode,
            dewBalance: STARTER_DEW_POUCH,
            sunlightBalance: STARTER_SUNLIGHT_POUCH,
            fogLevel: 0,
            isPro: false,
            onboardingCompleted: true,
          },
          placements,
          ownedItemIds,
          dailyLogs: {},
          activeLantern: null,
          pendingReveal: null,
        });
        syncWidgetSnapshot(get());
      },

      triggerMorningReveal: (input) => {
        const state = get();
        const result = processMorningReveal({
          dateKey: input.dateKey,
          existingLogs: state.dailyLogs,
          sleepMin: input.sleepMin,
          steps: input.steps,
          bedtimeOffsetMin: input.bedtimeOffsetMin,
          profile: state.profile,
        });

        if (!result.alreadyRevealed) {
          set({
            profile: {
              ...state.profile,
              dewBalance: state.profile.dewBalance + result.dewAwarded,
              sunlightBalance: state.profile.sunlightBalance + result.sunlightAwarded,
              fogLevel: result.newFogLevel,
            },
            dailyLogs: {
              ...state.dailyLogs,
              [input.dateKey]: result.log,
            },
            pendingReveal: result,
          });
          syncWidgetSnapshot(get());
        }

        return result;
      },

      placeCatalogItem: (itemId, x, y) => {
        const item = getCatalogItemById(itemId);
        if (!item) {
          return { ok: false, reason: 'OUT_OF_BOUNDS' };
        }

        const state = get();
        const result = validateAndPlaceItem({
          item,
          x,
          y,
          placements: state.placements,
          ownedItemIds: state.ownedItemIds,
          dewBalance: state.profile.dewBalance,
          sunlightBalance: state.profile.sunlightBalance,
          isPro: state.profile.isPro,
        });

        if (result.ok) {
          set({
            placements: result.nextPlacements,
            ownedItemIds: result.nextOwnedIds,
            profile: {
              ...state.profile,
              dewBalance: result.nextDew,
              sunlightBalance: result.nextSunlight,
            },
          });
          syncWidgetSnapshot(get());
        }

        return result;
      },

      movePlacedItem: (placementId, toX, toY) => {
        const state = get();
        const result = movePlacement(state.placements, placementId, toX, toY);

        if (result.ok) {
          set({
            placements: result.nextPlacements,
          });
          syncWidgetSnapshot(get());
        }

        return result;
      },

      waterPlacedItem: (placementId, nowIso) => {
        const state = get();
        const result = waterPlacement({
          placementId,
          placements: state.placements,
          dewBalance: state.profile.dewBalance,
          catalogById: CATALOG_BY_ID,
          nowIso,
        });

        if (result.ok) {
          set({
            placements: result.nextPlacements,
            profile: {
              ...state.profile,
              dewBalance: result.nextDew,
            },
          });
          syncWidgetSnapshot(get());
        }

        return result;
      },

      startLantern: (nowIso) => {
        const session = startLanternSession(nowIso ?? new Date().toISOString());
        set({ activeLantern: session });
      },

      awardBedtimeDew: (amount = DEFAULT_BEDTIME_DEW) => {
        const bonus = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));
        if (bonus === 0) {
          return;
        }
        set((state) => ({
          profile: {
            ...state.profile,
            dewBalance: state.profile.dewBalance + bonus,
          },
        }));
        syncWidgetSnapshot(get());
      },

      finishLantern: (nowIso, steps = 0) => {
        const { activeLantern } = get();
        if (!activeLantern) {
          return null;
        }

        const endedAt = nowIso ?? new Date().toISOString();
        const completion = completeLanternSession(activeLantern, endedAt);

        set({ activeLantern: null });

        if (!completion.isValidRest) {
          return null;
        }

        const dateKey = toLocalDateKey(endedAt);
        return get().triggerMorningReveal({
          dateKey,
          sleepMin: completion.sleepMin,
          steps,
        });
      },

      dismissPendingReveal: () => {
        set({ pendingReveal: null });
      },

      setPendingReveal: (reveal) => {
        set({ pendingReveal: reveal });
      },

      updateGoals: (sleepGoalMin, stepGoal) => {
        const clampedSleep = Math.min(720, Math.max(300, Math.round(sleepGoalMin)));
        const clampedSteps = Math.min(30000, Math.max(1000, Math.round(stepGoal)));
        set((state) => ({
          profile: {
            ...state.profile,
            sleepGoalMin: clampedSleep,
            stepGoal: clampedSteps,
          },
        }));
      },

      resetAllData: () => {
        set(createInitialState());
      },
    }),
    {
      name: SANCTUARY_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): SanctuaryDataState => ({
        profile: state.profile,
        placements: state.placements,
        ownedItemIds: state.ownedItemIds,
        dailyLogs: state.dailyLogs,
        activeLantern: state.activeLantern,
        pendingReveal: state.pendingReveal,
      }),
    },
  ),
);
