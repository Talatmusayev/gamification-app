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

  it('completes onboarding with Starter Welcome Pouch (60 Dew / 60 Sunlight) and 3-item Starter Nook', () => {
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
    expect(state.profile.dewBalance).toBe(60);
    expect(state.profile.sunlightBalance).toBe(60);
    expect(state.ownedItemIds).toEqual(
      expect.arrayContaining(['lavender', 'stepping_stone', 'meadow_daisy']),
    );
    expect(state.placements).toHaveLength(3);
    expect(state.placements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ itemId: 'lavender', x: 3, y: 3 }),
        expect.objectContaining({ itemId: 'stepping_stone', x: 4, y: 3 }),
        expect.objectContaining({ itemId: 'meadow_daisy', x: 2, y: 4 }),
      ]),
    );
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
    expect(afterFirst.profile.dewBalance).toBe(60 + first.dewAwarded);
    expect(afterFirst.profile.sunlightBalance).toBe(60 + first.sunlightAwarded);
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
    expect(afterSecond.profile.dewBalance).toBe(60 + first.dewAwarded);
    expect(afterSecond.profile.sunlightBalance).toBe(60 + first.sunlightAwarded);
  });

  it('places a catalog item, deducts currency, appends placement, and rejects invalid placements', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'lavender',
      trackingMode: 'phone_only',
    });

    // Spend starter pouch on wooden_bench (35 dew, 45 sunlight -> 25 dew, 15 sunlight remaining)
    const boughtWithPouch = useSanctuaryStore.getState().placeCatalogItem('wooden_bench', 1, 2);
    expect(boughtWithPouch.ok).toBe(true);

    // Insufficient funds for garden_robin (40 dew, 45 sunlight)
    const tooPoor = useSanctuaryStore.getState().placeCatalogItem('garden_robin', 2, 2);
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
    expect(state.profile.dewBalance).toBe(25 + reveal.dewAwarded - 20);
    expect(state.profile.sunlightBalance).toBe(15 + reveal.sunlightAwarded - 15);
    expect(state.ownedItemIds).toContain('mossy_clover');
    expect(state.placements).toHaveLength(5);
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
    expect(useSanctuaryStore.getState().profile.dewBalance).toBe(60);

    // Award bedtime dew when lighting the lantern
    useSanctuaryStore.getState().awardBedtimeDew();
    expect(useSanctuaryStore.getState().profile.dewBalance).toBe(70);

    // Valid overnight session (8 hours) -> triggers Morning Reveal
    useSanctuaryStore.getState().startLantern('2026-11-23T23:00:00.000Z');
    const validResult = useSanctuaryStore.getState().finishLantern('2026-11-24T07:00:00.000Z', 4000);
    expect(validResult).not.toBeNull();
    expect(validResult?.alreadyRevealed).toBe(false);
    expect(validResult?.log.sleepMin).toBe(480);
    expect(validResult?.log.steps).toBe(4000);
    expect(useSanctuaryStore.getState().activeLantern).toBeNull();
    expect(useSanctuaryStore.getState().profile.dewBalance).toBe(70 + (validResult?.dewAwarded ?? 0));
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

  it('waters a placed plant through stages 1 -> 2 -> 3 and deducts 15 Dew each time', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'lavender',
      trackingMode: 'phone_only',
    });

    const lavender = useSanctuaryStore
      .getState()
      .placements.find((p) => p.itemId === 'lavender');
    expect(lavender).toBeDefined();
    if (!lavender) return;

    const first = useSanctuaryStore
      .getState()
      .waterPlacedItem(lavender.id, '2026-11-24T09:00:00.000Z');
    expect(first).toMatchObject({ ok: true, newStage: 2, nextDew: 45 });

    const second = useSanctuaryStore
      .getState()
      .waterPlacedItem(lavender.id, '2026-11-24T10:00:00.000Z');
    expect(second).toMatchObject({ ok: true, newStage: 3, nextDew: 30 });

    const third = useSanctuaryStore.getState().waterPlacedItem(lavender.id);
    expect(third).toEqual({ ok: false, reason: 'ALREADY_FULL_BLOOM' });
    expect(useSanctuaryStore.getState().profile.dewBalance).toBe(30);
  });

  it('activates a one-time 72h Sunlit Guest Pass, unlocks Pro placement while active, and locks new Pro items after expiry', () => {
    const startIso = '2026-11-24T08:00:00.000Z';
    const activeMs = Date.parse('2026-11-25T08:00:00.000Z');
    const expiredMs = Date.parse('2026-11-27T09:00:00.000Z');
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(activeMs);

    try {
      useSanctuaryStore.getState().completeOnboarding({
        sleepGoalMin: 480,
        stepGoal: 8000,
        starterItemId: 'lavender',
        trackingMode: 'phone_only',
      });

      // Earn enough Dew/Sunlight for Pro items (sakura_sapling costs 80 Dew / 70 Sunlight)
      useSanctuaryStore.getState().triggerMorningReveal({
        dateKey: '2026-11-24',
        sleepMin: 480,
        steps: 8000,
        bedtimeOffsetMin: 5,
      });

      // First Guest Pass activation succeeds
      const firstActivate = useSanctuaryStore.getState().activateGuestPass(startIso);
      expect(firstActivate).toBe(true);
      expect(useSanctuaryStore.getState().profile.guestPassEndsAt).toBe(
        '2026-11-27T08:00:00.000Z',
      );
      expect(useSanctuaryStore.getState().profile.guestPassUsed).toBe(true);

      // Second activation is blocked by one-time guard
      const secondActivate = useSanctuaryStore
        .getState()
        .activateGuestPass('2026-12-01T08:00:00.000Z');
      expect(secondActivate).toBe(false);
      expect(useSanctuaryStore.getState().profile.guestPassEndsAt).toBe(
        '2026-11-27T08:00:00.000Z',
      );

      // Pro placement succeeds during active Guest Pass
      const placedPro = useSanctuaryStore
        .getState()
        .placeCatalogItem('sakura_sapling', 1, 1);
      expect(placedPro.ok).toBe(true);

      // Advance time past expiry -> placed Pro item stays, new Pro item is locked
      nowSpy.mockReturnValue(expiredMs);
      expect(
        useSanctuaryStore.getState().activateGuestPass('2026-11-28T08:00:00.000Z'),
      ).toBe(false);

      expect(
        useSanctuaryStore
          .getState()
          .placements.some((p) => p.itemId === 'sakura_sapling'),
      ).toBe(true);

      // Earn extra Dew/Sunlight so funds aren't the blocker
      useSanctuaryStore.getState().triggerMorningReveal({
        dateKey: '2026-11-27',
        sleepMin: 480,
        steps: 9000,
      });

      const lockedAfterExpiry = useSanctuaryStore
        .getState()
        .placeCatalogItem('stone_lantern', 1, 2);
      expect(lockedAfterExpiry).toEqual({ ok: false, reason: 'PRO_REQUIRED' });
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('updates trialReminderOptIn and live AI Keeper reflection cleanly', () => {
    useSanctuaryStore.getState().completeOnboarding({
      sleepGoalMin: 480,
      stepGoal: 8000,
      starterItemId: 'lavender',
      trackingMode: 'health_sync',
    });

    useSanctuaryStore.getState().setTrialReminderOptIn(true);
    expect(useSanctuaryStore.getState().profile.trialReminderOptIn).toBe(true);

    useSanctuaryStore.getState().triggerMorningReveal({
      dateKey: '2026-11-24',
      sleepMin: 460,
      steps: 7800,
    });

    useSanctuaryStore
      .getState()
      .updateRevealKeeperNote(
        '2026-11-24',
        'A steady bedtime brought gentle clarity to your meadow.',
      );

    expect(useSanctuaryStore.getState().dailyLogs['2026-11-24']?.aiInsight).toBe(
      'A steady bedtime brought gentle clarity to your meadow.',
    );
    expect(useSanctuaryStore.getState().pendingReveal?.keeperNote).toBe(
      'A steady bedtime brought gentle clarity to your meadow.',
    );
    expect(useSanctuaryStore.getState().pendingReveal?.log.aiInsight).toBe(
      'A steady bedtime brought gentle clarity to your meadow.',
    );
  });
});
