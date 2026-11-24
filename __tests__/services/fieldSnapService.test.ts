import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  captureOutdoorPhoto,
  FREE_DAILY_SNAPS,
  FREE_REWARDED_BONUS_SNAPS,
  getFieldSnapAllowance,
  identifyAndResolveFieldSnap,
  NOT_OUTDOOR_NATURE_MESSAGE,
  PRO_DAILY_SNAPS,
  resetFieldSnapState,
  unlockBonusFieldSnapWithAd,
} from '@/services/fieldSnapService';
import { resetRewardedAdsState } from '@/services/rewardedAdsService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('fieldSnapService', () => {
  const TEST_DATE_KEY = '2026-11-24';
  const originalSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    await AsyncStorage.clear();
    resetFieldSnapState();
    resetRewardedAdsState();
    useSanctuaryStore.getState().resetAllData();
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    global.fetch = originalFetch;
  });

  afterAll(() => {
    if (originalSupabaseUrl !== undefined) {
      process.env.EXPO_PUBLIC_SUPABASE_URL = originalSupabaseUrl;
    } else {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    }
    global.fetch = originalFetch;
  });

  it('enforces the free 1/day cap and allows unlocking +1 bonus snap via rewarded video', async () => {
    expect(FREE_DAILY_SNAPS).toBe(1);
    expect(FREE_REWARDED_BONUS_SNAPS).toBe(1);

    expect(getFieldSnapAllowance({ isPro: false, dateKey: TEST_DATE_KEY })).toEqual({
      remaining: 1,
      limit: 1,
      canUnlockBonusWithAd: false,
    });

    const first = await identifyAndResolveFieldSnap({
      imageBase64: 'outdoor-leaf-sample-1',
      mimeType: 'image/jpeg',
      isPro: false,
      ownedItemIds: [],
      dateKey: TEST_DATE_KEY,
    });

    expect(first.ok).toBe(true);
    expect(first.allowanceAfter).toEqual({
      remaining: 0,
      limit: 1,
      canUnlockBonusWithAd: true,
    });

    const blocked = await identifyAndResolveFieldSnap({
      imageBase64: 'outdoor-leaf-sample-2',
      mimeType: 'image/jpeg',
      isPro: false,
      ownedItemIds: [],
      dateKey: TEST_DATE_KEY,
    });

    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.reason).toBe('DAILY_LIMIT_REACHED');
    }

    const bonus = await unlockBonusFieldSnapWithAd({
      isPro: false,
      dateKey: TEST_DATE_KEY,
      simulationDelayMs: 0,
    });
    expect(bonus.ok).toBe(true);
    expect(bonus.allowance).toEqual({
      remaining: 1,
      limit: 2,
      canUnlockBonusWithAd: false,
    });

    const second = await identifyAndResolveFieldSnap({
      imageBase64: 'outdoor-leaf-sample-3',
      mimeType: 'image/jpeg',
      isPro: false,
      ownedItemIds: [],
      dateKey: TEST_DATE_KEY,
    });
    expect(second.ok).toBe(true);
    expect(second.allowanceAfter).toEqual({
      remaining: 0,
      limit: 2,
      canUnlockBonusWithAd: false,
    });
  });

  it('enforces the Pro 5/day cap without rewarded ad upsell', async () => {
    expect(PRO_DAILY_SNAPS).toBe(5);

    expect(getFieldSnapAllowance({ isPro: true, dateKey: TEST_DATE_KEY })).toEqual({
      remaining: 5,
      limit: 5,
      canUnlockBonusWithAd: false,
    });

    for (let i = 0; i < 5; i += 1) {
      const res = await identifyAndResolveFieldSnap({
        imageBase64: `pro-walk-plant-${i}`,
        mimeType: 'image/jpeg',
        isPro: true,
        ownedItemIds: [],
        dateKey: TEST_DATE_KEY,
      });
      expect(res.ok).toBe(true);
    }

    expect(getFieldSnapAllowance({ isPro: true, dateKey: TEST_DATE_KEY })).toEqual({
      remaining: 0,
      limit: 5,
      canUnlockBonusWithAd: false,
    });

    const sixth = await identifyAndResolveFieldSnap({
      imageBase64: 'pro-walk-plant-6',
      mimeType: 'image/jpeg',
      isPro: true,
      ownedItemIds: [],
      dateKey: TEST_DATE_KEY,
    });
    expect(sixth.ok).toBe(false);
    if (!sixth.ok) {
      expect(sixth.reason).toBe('DAILY_LIMIT_REACHED');
    }
  });

  it('rejects screens or indoor non-nature photos without burning a daily snap', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        isOutdoorNature: false,
        isScreenOrFake: true,
        matchedCatalogId: null,
        speciesName: '',
        fieldNote: 'Looks like a monitor screen.',
      }),
    }) as unknown as typeof fetch;

    const rejected = await identifyAndResolveFieldSnap({
      imageBase64: 'monitor-photo',
      mimeType: 'image/jpeg',
      isPro: false,
      ownedItemIds: [],
      dateKey: TEST_DATE_KEY,
    });

    expect(rejected).toEqual({
      ok: false,
      reason: 'NOT_OUTDOOR_NATURE',
      message: NOT_OUTDOOR_NATURE_MESSAGE,
      allowanceAfter: {
        remaining: 1,
        limit: 1,
        canUnlockBonusWithAd: false,
      },
    });
    expect(getFieldSnapAllowance({ isPro: false, dateKey: TEST_DATE_KEY }).remaining).toBe(1);
  });

  it('resolves rewards for unowned free, already-owned, and Pro preview matches', async () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';

    // 1. Unowned free item -> unlocks item + 20 Sunlight + canPlantImmediately
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isOutdoorNature: true,
        isScreenOrFake: false,
        matchedCatalogId: 'lavender',
        speciesName: 'Wild Lavender',
        fieldNote: 'Fragrant violet spikes swaying in warm light.',
      }),
    }) as unknown as typeof fetch;

    const unownedFree = await identifyAndResolveFieldSnap({
      imageBase64: 'lavender-photo',
      mimeType: 'image/jpeg',
      isPro: false,
      ownedItemIds: ['meadow_daisy'],
      dateKey: '2026-11-24',
    });

    expect(unownedFree.ok).toBe(true);
    if (unownedFree.ok) {
      expect(unownedFree.catalogItem.id).toBe('lavender');
      expect(unownedFree.sunlightBonus).toBe(20);
      expect(unownedFree.unlockItemId).toBe('lavender');
      expect(unownedFree.canPlantImmediately).toBe(true);
      expect(unownedFree.proPreview).toBe(false);
    }

    // 2. Already-owned item -> 25 Sunlight
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isOutdoorNature: true,
        isScreenOrFake: false,
        matchedCatalogId: 'meadow_daisy',
        speciesName: 'Oxeye Daisy',
        fieldNote: 'Bright cream petals opening to the sun.',
      }),
    }) as unknown as typeof fetch;

    const alreadyOwned = await identifyAndResolveFieldSnap({
      imageBase64: 'daisy-photo',
      mimeType: 'image/jpeg',
      isPro: false,
      ownedItemIds: ['meadow_daisy'],
      dateKey: '2026-11-25',
    });

    expect(alreadyOwned.ok).toBe(true);
    if (alreadyOwned.ok) {
      expect(alreadyOwned.catalogItem.id).toBe('meadow_daisy');
      expect(alreadyOwned.sunlightBonus).toBe(25);
      expect(alreadyOwned.unlockItemId).toBeNull();
      expect(alreadyOwned.alreadyOwned).toBe(true);
      expect(alreadyOwned.proPreview).toBe(false);
    }

    // 3. Pro catalog item when !isPro -> 35 Sunlight + proPreview: true
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isOutdoorNature: true,
        isScreenOrFake: false,
        matchedCatalogId: 'sakura_sapling',
        speciesName: 'Cherry Blossom',
        fieldNote: 'Soft pink spring blossoms overhead.',
      }),
    }) as unknown as typeof fetch;

    const proPreview = await identifyAndResolveFieldSnap({
      imageBase64: 'sakura-photo',
      mimeType: 'image/jpeg',
      isPro: false,
      ownedItemIds: [],
      dateKey: '2026-11-26',
    });

    expect(proPreview.ok).toBe(true);
    if (proPreview.ok) {
      expect(proPreview.catalogItem.id).toBe('sakura_sapling');
      expect(proPreview.sunlightBonus).toBe(35);
      expect(proPreview.unlockItemId).toBeNull();
      expect(proPreview.canPlantImmediately).toBe(false);
      expect(proPreview.proPreview).toBe(true);
    }
  });

  it('provides a clean simulation fallback for captureOutdoorPhoto in Jest/Web', async () => {
    const capture = await captureOutdoorPhoto();
    expect(capture.ok).toBe(true);
    if (capture.ok) {
      expect(capture.source).toBe('simulation');
      expect(capture.imageBase64.length).toBeGreaterThan(0);
    }
  });

  it('applies field snap rewards cleanly to useSanctuaryStore without duplicating owned items', () => {
    const store = useSanctuaryStore.getState();
    store.applyFieldSnapReward({ sunlightBonus: 20, unlockItemId: 'lavender' });

    expect(useSanctuaryStore.getState().profile.sunlightBalance).toBe(20);
    expect(useSanctuaryStore.getState().ownedItemIds).toEqual(['lavender']);

    store.applyFieldSnapReward({ sunlightBonus: 25, unlockItemId: 'lavender' });
    expect(useSanctuaryStore.getState().profile.sunlightBalance).toBe(45);
    expect(useSanctuaryStore.getState().ownedItemIds).toEqual(['lavender']);
  });
});
