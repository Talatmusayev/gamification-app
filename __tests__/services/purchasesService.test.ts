import {
  getEntitlementStatus,
  getOfferings,
  purchasePlan,
  resetPurchasesSandbox,
  restorePurchases,
  setPurchasesProvider,
  type PurchasesProvider,
} from '@/services/purchasesService';

describe('purchasesService', () => {
  beforeEach(() => {
    setPurchasesProvider(null);
    resetPurchasesSandbox();
  });

  it('returns all 3 Pro offerings with exact PRD pricing and trial metadata', async () => {
    const offerings = await getOfferings();
    expect(offerings).toHaveLength(3);

    const annual = offerings.find((item) => item.id === 'annual_pro');
    const monthly = offerings.find((item) => item.id === 'monthly_pro');
    const lifetime = offerings.find((item) => item.id === 'lifetime_pro');

    expect(annual).toEqual(
      expect.objectContaining({
        id: 'annual_pro',
        priceUsd: 19.99,
        priceLabel: '$19.99/yr',
        subPriceLabel: '$1.66 / month',
        trialDays: 7,
        recommended: true,
      }),
    );

    expect(monthly).toEqual(
      expect.objectContaining({
        id: 'monthly_pro',
        priceUsd: 2.99,
        priceLabel: '$2.99/mo',
        trialDays: 0,
        recommended: false,
      }),
    );

    expect(lifetime).toEqual(
      expect.objectContaining({
        id: 'lifetime_pro',
        priceUsd: 39.99,
        priceLabel: '$39.99 once',
        trialDays: 0,
        recommended: false,
      }),
    );
  });

  it('starts a 7-day trial on annual_pro and updates entitlement in sandbox mode', async () => {
    const initial = await getEntitlementStatus();
    expect(initial).toEqual({
      isPro: false,
      isTrial: false,
      activePlanId: null,
      source: 'sandbox',
    });

    const result = await purchasePlan('annual_pro');
    expect(result).toEqual({
      ok: true,
      planId: 'annual_pro',
      entitlement: {
        isPro: true,
        isTrial: true,
        activePlanId: 'annual_pro',
        source: 'sandbox',
      },
    });

    const current = await getEntitlementStatus();
    expect(current.isPro).toBe(true);
    expect(current.isTrial).toBe(true);
    expect(current.activePlanId).toBe('annual_pro');
  });

  it('marks non-trial purchases as non-trial Pro entitlements', async () => {
    const result = await purchasePlan('lifetime_pro');
    expect(result.ok).toBe(true);
    expect(result.entitlement).toEqual({
      isPro: true,
      isTrial: false,
      activePlanId: 'lifetime_pro',
      source: 'sandbox',
    });
  });

  it('restores sandbox purchases and delegates to native provider when linked', async () => {
    await purchasePlan('monthly_pro');
    const sandboxRestored = await restorePurchases();
    expect(sandboxRestored).toEqual({
      isPro: true,
      isTrial: false,
      activePlanId: 'monthly_pro',
      source: 'sandbox',
    });

    const nativeProvider: PurchasesProvider = {
      purchasePlan: jest.fn(async (planId) => ({
        ok: true,
        planId,
        entitlement: {
          isPro: true,
          isTrial: planId === 'annual_pro',
          activePlanId: planId,
          source: 'revenuecat' as const,
        },
      })),
      restorePurchases: jest.fn(async () => ({
        isPro: true,
        isTrial: false,
        activePlanId: 'lifetime_pro' as const,
        source: 'revenuecat' as const,
      })),
      getEntitlementStatus: jest.fn(async () => ({
        isPro: true,
        isTrial: false,
        activePlanId: 'lifetime_pro' as const,
        source: 'revenuecat' as const,
      })),
    };

    setPurchasesProvider(nativeProvider);

    const restored = await restorePurchases();
    expect(nativeProvider.restorePurchases).toHaveBeenCalledTimes(1);
    expect(restored).toEqual({
      isPro: true,
      isTrial: false,
      activePlanId: 'lifetime_pro',
      source: 'revenuecat',
    });
  });
});
