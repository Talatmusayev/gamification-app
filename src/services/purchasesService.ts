export type PlanId = 'annual_pro' | 'monthly_pro' | 'lifetime_pro';

export type AnalyticsPlanName = 'annual' | 'monthly' | 'lifetime';

export interface PurchaseOffering {
  id: PlanId;
  offeringId: string;
  title: string;
  priceUsd: number;
  priceLabel: string;
  subPriceLabel?: string;
  trialDays: number;
  trialLabel?: string;
  recommended: boolean;
  badgeLabel?: string;
  analyticsPlan: AnalyticsPlanName;
}

export interface EntitlementStatus {
  isPro: boolean;
  isTrial: boolean;
  activePlanId: PlanId | null;
  source: 'revenuecat' | 'sandbox';
}

export interface PurchaseResult {
  ok: boolean;
  cancelled?: boolean;
  planId: PlanId;
  entitlement: EntitlementStatus;
  error?: string;
}

export interface PurchasesProvider {
  getOfferings?: () => Promise<PurchaseOffering[]>;
  purchasePlan: (planId: PlanId) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<EntitlementStatus>;
  getEntitlementStatus: () => Promise<EntitlementStatus>;
}

const DEFAULT_OFFERING_ID = 'default';

const OFFERING_CATALOG: readonly PurchaseOffering[] = [
  {
    id: 'annual_pro',
    offeringId: DEFAULT_OFFERING_ID,
    title: 'Annual Pro',
    priceUsd: 19.99,
    priceLabel: '$19.99/yr',
    subPriceLabel: '$1.66 / month',
    trialDays: 7,
    trialLabel: '7-day free trial',
    recommended: true,
    badgeLabel: 'Best value',
    analyticsPlan: 'annual',
  },
  {
    id: 'monthly_pro',
    offeringId: DEFAULT_OFFERING_ID,
    title: 'Monthly Pro',
    priceUsd: 2.99,
    priceLabel: '$2.99/mo',
    trialDays: 0,
    recommended: false,
    analyticsPlan: 'monthly',
  },
  {
    id: 'lifetime_pro',
    offeringId: DEFAULT_OFFERING_ID,
    title: 'Lifetime Pro',
    priceUsd: 39.99,
    priceLabel: '$39.99 once',
    trialDays: 0,
    recommended: false,
    analyticsPlan: 'lifetime',
  },
] as const;

let activeProvider: PurchasesProvider | null = null;

let sandboxEntitlement: EntitlementStatus = {
  isPro: false,
  isTrial: false,
  activePlanId: null,
  source: 'sandbox',
};

/**
 * Registers or clears an optional native RevenueCat bridge.
 * When unset (Expo Go, Web, or unit tests), safe local sandbox mode is used.
 */
export function setPurchasesProvider(provider: PurchasesProvider | null): void {
  activeProvider = provider;
}

/**
 * Resets the local sandbox entitlement state (primarily for tests).
 */
export function resetPurchasesSandbox(): void {
  sandboxEntitlement = {
    isPro: false,
    isTrial: false,
    activePlanId: null,
    source: 'sandbox',
  };
}

/**
 * Returns the Pro offering catalog matching PRD §10 and Figma Screen 5.
 */
export async function getOfferings(): Promise<PurchaseOffering[]> {
  if (activeProvider?.getOfferings) {
    try {
      const remote = await activeProvider.getOfferings();
      if (remote.length > 0) {
        return remote;
      }
    } catch {
      // Fall back to the local catalog so the paywall remains usable.
    }
  }

  return OFFERING_CATALOG.map((item) => ({ ...item }));
}

export function getOfferingById(planId: PlanId): PurchaseOffering {
  const match = OFFERING_CATALOG.find((item) => item.id === planId);
  return match ? { ...match } : { ...OFFERING_CATALOG[0] };
}

/**
 * Purchases a Pro plan or starts the 7-day trial on `annual_pro`.
 */
export async function purchasePlan(planId: PlanId): Promise<PurchaseResult> {
  if (activeProvider) {
    try {
      return await activeProvider.purchasePlan(planId);
    } catch (error) {
      return {
        ok: false,
        planId,
        entitlement: await getEntitlementStatus(),
        error: error instanceof Error ? error.message : 'Unable to complete purchase.',
      };
    }
  }

  const offering = getOfferingById(planId);
  sandboxEntitlement = {
    isPro: true,
    isTrial: offering.trialDays > 0,
    activePlanId: offering.id,
    source: 'sandbox',
  };

  return {
    ok: true,
    planId: offering.id,
    entitlement: { ...sandboxEntitlement },
  };
}

/**
 * Restores previous Pro entitlements via RevenueCat or local sandbox state.
 */
export async function restorePurchases(): Promise<EntitlementStatus> {
  if (activeProvider) {
    try {
      return await activeProvider.restorePurchases();
    } catch {
      return {
        isPro: false,
        isTrial: false,
        activePlanId: null,
        source: 'revenuecat',
      };
    }
  }

  return { ...sandboxEntitlement };
}

/**
 * Reads the current Pro entitlement status.
 */
export async function getEntitlementStatus(): Promise<EntitlementStatus> {
  if (activeProvider) {
    try {
      return await activeProvider.getEntitlementStatus();
    } catch {
      return {
        isPro: false,
        isTrial: false,
        activePlanId: null,
        source: 'revenuecat',
      };
    }
  }

  return { ...sandboxEntitlement };
}
