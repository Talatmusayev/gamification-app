import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getCatalogItemById } from '../domain/catalog';
import { processMorningReveal } from '../domain/fog';
import { movePlacement, validateAndPlaceItem } from '../domain/grid';
import { completeLanternSession, startLanternSession } from '../domain/lantern';
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
  startLantern: (nowIso?: string) => void;
  finishLantern: (nowIso?: string, steps?: number) => MorningRevealResult | null;
  dismissPendingReveal: () => void;
  setPendingReveal: (reveal: MorningRevealResult | null) => void;
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

export const useSanctuaryStore = create<SanctuaryStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      completeOnboarding: (input) => {
        const starterItem = getCatalogItemById(input.starterItemId);
        let placements: GardenPlacement[] = [];
        let ownedItemIds: string[] = [];

        if (starterItem) {
          ownedItemIds = [starterItem.id];
          const placed = validateAndPlaceItem({
            item: starterItem,
            x: CENTER_TILE_X,
            y: CENTER_TILE_Y,
            placements: [],
            ownedItemIds,
            dewBalance: 0,
            sunlightBalance: 0,
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
            dewBalance: 0,
            sunlightBalance: 0,
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
        }

        return result;
      },

      startLantern: (nowIso) => {
        const session = startLanternSession(nowIso ?? new Date().toISOString());
        set({ activeLantern: session });
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
