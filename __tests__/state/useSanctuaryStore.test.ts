import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSanctuaryStore } from '../../src/state/useSanctuaryStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('useSanctuaryStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSanctuaryStore.getState().resetAllData();
  });

  it('completes onboarding by placing starter seedling at center (3, 3) with zero starter currency', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'lavender',
      trackingMode: 'phone_only',
    });

    const state = useSanctuaryStore.getState();
    expect(state.profile.onboardingCompleted).toBe(true);
    expect(state.profile.sleepGoalMin).toBe(480);
    expect(state.profile.stepGoal).toBe(8000);
    expect(state.profile.trackingMode).toBe('phone_only');
    expect(state.profile.dewBalance).toBe(0);
    expect(state.profile.sunlightBalance).toBe(0);
    expect(state.ownedItemIds).toContain('lavender');
    expect(state.placements).toHaveLength(1);
    expect(state.placements[0]).toMatchObject({
      itemId: 'lavender',
      x: 3,
      y: 3,
    });
  });

  it('triggers Morning Reveal once per dateKey and ignores duplicate same-day calls', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'bonsai_sprout',
      trackingMode: 'health_sync',
    });

    const first = useSanctuaryStore.getState().triggerMorningReveal({
      dateKey: '2026-11-24',
      sleepMin: 480,
      steps: 8000,
      bedtimeOffsetMin: 10,
    });

    expect(first.alreadyRevealed).toBe(false);
    expect(first.dewAwarded).toBeGreaterThan(0);
    expect(first.sunlightAwarded).toBeGreaterThan(0);

    const afterFirst = useSanctuaryStore.getState();
    expect(afterFirst.profile.dewBalance).toBe(first.dewAwarded);
    expect(afterFirst.profile.sunlightBalance).toBe(first.sunlightAwarded);
    expect(afterFirst.dailyLogs['2026-11-24']).toBeDefined();
    expect(afterFirst.pendingReveal).toEqual(first);

    const second = useSanctuaryStore.getState().triggerMorningReveal({
      dateKey: '2026-11-24',
      sleepMin: 480,
      steps: 10000,
    });

    expect(second.alreadyRevealed).toBe(true);
    expect(second.dewAwarded).toBe(0);
    expect(second.sunlightAwarded).toBe(0);

    const afterSecond = useSanctuaryStore.getState();
    expect(afterSecond.profile.dewBalance).toBe(first.dewAwarded);
    expect(afterSecond.profile.sunlightBalance).toBe(first.sunlightAwarded);
  });

  it('places a catalog item, deducts currency, appends placement, and rejects invalid placements', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'lavender',
      trackingMode: 'phone_only',
    });

    // Insufficient funds before earning Dew/Sunlight
    const tooPoor = useSanctuaryStore.getState().placeCatalogItem('mossy_clover', 2, 2);
    expect(tooPoor).toEqual({ ok: false, reason: 'INSUFFICIENT_FUNDS' });

    // Earn Dew & Sunlight via Morning Reveal (480m sleep + 8000 steps)
    const reveal = useSanctuaryStore.getState().triggerMorningReveal({
      dateKey: '2026-11-24',
      sleepMin: 480,
      steps: 8000,
    });

    // mossy_clover costs 20 dew, 15 sunlight
    const placed = useSanctuaryStore.getState().placeCatalogItem('mossy_clover', 2, 2);
    expect(placed.ok).toBe(true);

    const state = useSanctuaryStore.getState();
    expect(state.profile.dewBalance).toBe(reveal.dewAwarded - 20);
    expect(state.profile.sunlightBalance).toBe(reveal.sunlightAwarded - 15);
    expect(state.ownedItemIds).toContain('mossy_clover');
    expect(state.placements).toHaveLength(2);
    expect(state.placements.some((p) => p.itemId === 'mossy_clover' && p.x === 2 && p.y === 2)).toBe(true);

    // Occupied tile rejected
    const occupied = useSanctuaryStore.getState().placeCatalogItem('stepping_stone', 3, 3);
    expect(occupied).toEqual({ ok: false, reason: 'TILE_OCCUPIED' });

    // Pro item rejected for non-pro profile
    const proBlocked = useSanctuaryStore.getState().placeCatalogItem('sakura_sapling', 1, 1);
    expect(proBlocked).toEqual({ ok: false, reason: 'PRO_REQUIRED' });
  });

  it('moves an existing placement and rejects occupied or out-of-bounds targets', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'sunlit_fern',
      trackingMode: 'phone_only',
    });

    const starterId = useSanctuaryStore.getState().placements[0].id;

    const moved = useSanctuaryStore.getState().movePlacedItem(starterId, 4, 4);
    expect(moved.ok).toBe(true);
    expect(useSanctuaryStore.getState().placements[0]).toMatchObject({
      id: starterId,
      x: 4,
      y: 4,
    });

    const oob = useSanctuaryStore.getState().movePlacedItem(starterId, 9, 0);
    expect(oob).toEqual({ ok: false, reason: 'OUT_OF_BOUNDS' });
  });

  it('runs Goodnight Lantern flow and triggers Morning Reveal only for valid rest', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'lavender',
      trackingMode: 'phone_only',
    });

    // No active lantern -> null
    expect(useSanctuaryStore.getState().finishLantern('2026-11-24T07:00:00.000Z')).toBeNull();

    // Short session (< 60 min) -> clears activeLantern, returns null, no reveal
    useSanctuaryStore.getState().startLantern('2026-11-24T06:30:00.000Z');
    expect(useSanctuaryStore.getState().activeLantern).not.toBeNull();

    const shortResult = useSanctuaryStore.getState().finishLantern('2026-11-24T07:00:00.000Z', 0);
    expect(shortResult).toBeNull();
    expect(useSanctuaryStore.getState().activeLantern).toBeNull();
    expect(useSanctuaryStore.getState().profile.dewBalance).toBe(0);

    // Valid overnight session (8 hours) -> triggers Morning Reveal
    useSanctuaryStore.getState().startLantern('2026-11-23T23:00:00.000Z');
    const validResult = useSanctuaryStore.getState().finishLantern('2026-11-24T07:00:00.000Z', 4000);
    expect(validResult).not.toBeNull();
    expect(validResult?.alreadyRevealed).toBe(false);
    expect(validResult?.log.sleepMin).toBe(480);
    expect(validResult?.log.steps).toBe(4000);
    expect(useSanctuaryStore.getState().activeLantern).toBeNull();
    expect(useSanctuaryStore.getState().profile.dewBalance).toBe(validResult?.dewAwarded);
    expect(useSanctuaryStore.getState().pendingReveal).toEqual(validResult);
  });

  it('supports dismissPendingReveal, setPendingReveal, resetAllData, and AsyncStorage persistence', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 450,
      stepGoal: 6000,
      starterItemId: 'lavender',
      trackingMode: 'manual',
    });

    const reveal = useSanctuaryStore.getState().triggerMorningReveal({
      dateKey: '2026-11-24',
      sleepMin: 450,
      steps: 6000,
    });
    expect(useSanctuaryStore.getState().pendingReveal).toEqual(reveal);

    useSanctuaryStore.getState().dismissPendingReveal();
    expect(useSanctuaryStore.getState().pendingReveal).toBeNull();

    useSanctuaryStore.getState().setPendingReveal(reveal);
    expect(useSanctuaryStore.getState().pendingReveal).toEqual(reveal);

    expect(AsyncStorage.setItem).toHaveBeenCalled();

    useSanctuaryStore.getState().resetAllData();
    const resetState = useSanctuaryStore.getState();
    expect(resetState.profile.onboardingCompleted).toBe(false);
    expect(resetState.profile.dewBalance).toBe(0);
    expect(resetState.placements).toEqual([]);
    expect(resetState.ownedItemIds).toEqual([]);
    expect(resetState.dailyLogs).toEqual({});
    expect(resetState.activeLantern).toBeNull();
    expect(resetState.pendingReveal).toBeNull();
  });
});
