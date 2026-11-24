import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyLog, GardenPlacement, UserProfile } from '@/domain/types';
import {
  buildWidgetSnapshot,
  MAX_WIDGET_TOP_ASSETS,
  persistWidgetSnapshot,
  setWidgetReloadHook,
  WIDGET_SNAPSHOT_STORAGE_KEY,
} from '@/services/widgetBridge';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const sampleProfile: UserProfile = {
  sleepGoalMin: 480,
  stepGoal: 8000,
  trackingMode: 'apple_health',
  dewBalance: 240,
  sunlightBalance: 185,
  fogLevel: 1,
  isPro: true,
  onboardingCompleted: true,
};

const sampleLogs: Record<string, DailyLog> = {
  '2026-11-22': {
    dateKey: '2026-11-22',
    sleepMin: 460,
    steps: 7200,
    dewAwarded: 100,
    sunlightAwarded: 70,
    revealedAt: '2026-11-22T07:15:00.000Z',
    aiInsight: 'Steady rest.',
  },
  '2026-11-23': {
    dateKey: '2026-11-23',
    sleepMin: 0,
    steps: 1200,
    dewAwarded: 40,
    sunlightAwarded: 10,
    revealedAt: '2026-11-23T08:00:00.000Z',
    aiInsight: 'Quiet day.',
  },
  '2026-11-24': {
    dateKey: '2026-11-24',
    sleepMin: 480,
    steps: 8500,
    dewAwarded: 125,
    sunlightAwarded: 110,
    revealedAt: '2026-11-24T07:05:00.000Z',
    aiInsight: 'Morning clarity.',
  },
};

function makePlacement(id: string, itemId: string, x: number, y: number): GardenPlacement {
  return {
    id,
    itemId,
    x,
    y,
    placedAt: '2026-11-24T07:10:00.000Z',
  };
}

describe('widgetBridge', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    setWidgetReloadHook(null);
    jest.clearAllMocks();
  });

  it('builds a compact widget snapshot with harmony score and capped topAssetKeys', () => {
    const placements: GardenPlacement[] = [
      makePlacement('p1', 'lavender', 0, 0),
      makePlacement('p2', 'lavender', 0, 1), // duplicate assetKey should dedupe
      makePlacement('p3', 'bonsai_sprout', 1, 0),
      makePlacement('p4', 'sunlit_fern', 1, 1),
      makePlacement('p5', 'mossy_clover', 2, 0),
      makePlacement('p6', 'meadow_daisy', 2, 1),
      makePlacement('p7', 'chamomile_tuft', 3, 0),
    ];

    const snapshot = buildWidgetSnapshot({
      profile: sampleProfile,
      placements,
      dailyLogs: sampleLogs,
      nowIso: '2026-11-24T07:30:00.000Z',
    });

    expect(snapshot).toEqual({
      dewBalance: 240,
      sunlightBalance: 185,
      fogLevel: 1,
      harmonyDays: 2,
      harmonyWindow: 7,
      placedCount: 7,
      topAssetKeys: [
        'lavender',
        'bonsai_sprout',
        'sunlit_fern',
        'mossy_clover',
        'meadow_daisy',
      ],
      updatedAt: '2026-11-24T07:30:00.000Z',
    });
    expect(snapshot.topAssetKeys.length).toBeLessThanOrEqual(MAX_WIDGET_TOP_ASSETS);
  });

  it('persists snapshot to AsyncStorage and triggers optional native widget reload hook', async () => {
    const reloadHook = jest.fn();
    setWidgetReloadHook(reloadHook);

    const snapshot = buildWidgetSnapshot({
      profile: sampleProfile,
      placements: [makePlacement('p1', 'lavender', 3, 3)],
      dailyLogs: sampleLogs,
      nowIso: '2026-11-24T07:30:00.000Z',
    });

    const result = await persistWidgetSnapshot(snapshot);
    expect(result).toEqual({ persisted: true, reloadedNative: true });

    const stored = await AsyncStorage.getItem(WIDGET_SNAPSHOT_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toEqual(snapshot);
    expect(reloadHook).toHaveBeenCalledWith(snapshot);
  });
});
