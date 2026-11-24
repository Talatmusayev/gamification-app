import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import {
  getOfferingById,
  setPurchasesProvider,
  type EntitlementStatus,
  type PlanId,
  type PurchaseOffering,
  type PurchaseResult,
  type PurchasesProvider,
} from '@/services/purchasesService';

export interface NativePurchasesRegistrationResult {
  registered: boolean;
  platform: 'ios' | 'android' | 'unsupported';
  reason?: string;
}

interface RevenueCatEntitlementInfo {
  identifier?: string;
  productIdentifier?: string;
  periodType?: string;
  isActive?: boolean;
}

interface RevenueCatCustomerInfo {
  entitlements?: {
    active?: Record<string, RevenueCatEntitlementInfo>;
  };
}

interface RevenueCatPackage {
  identifier: string;
  packageType?: string;
  product: {
    identifier: string;
    price: number;
    priceString: string;
    title?: string;
  };
}

interface RevenueCatOfferings {
  current?: {
    identifier?: string;
    availablePackages?: RevenueCatPackage[];
  } | null;
}

interface RevenueCatModule {
  configure: (config: { apiKey: string }) => void;
  getOfferings: () => Promise<RevenueCatOfferings>;
  purchasePackage: (
    pkg: RevenueCatPackage,
  ) => Promise<{ customerInfo: RevenueCatCustomerInfo }>;
  restorePurchases: () => Promise<RevenueCatCustomerInfo>;
  getCustomerInfo: () => Promise<RevenueCatCustomerInfo>;
}

const REVENUECAT_MODULE_NAME = 'react-native-purchases';

function loadRevenueCatModule(): RevenueCatModule | null {
  try {
    const dynamicRequire = require as (id: string) => unknown;
    const loaded = dynamicRequire(REVENUECAT_MODULE_NAME) as
      | ({ default?: RevenueCatModule } & Partial<RevenueCatModule>)
      | null
      | undefined;
    const candidate = (loaded?.default ?? loaded) as Partial<RevenueCatModule> | null | undefined;
    if (
      !candidate ||
      typeof candidate.configure !== 'function' ||
      typeof candidate.getOfferings !== 'function' ||
      typeof candidate.purchasePackage !== 'function' ||
      typeof candidate.restorePurchases !== 'function' ||
      typeof candidate.getCustomerInfo !== 'function'
    ) {
      return null;
    }
    return candidate as RevenueCatModule;
  } catch {
    return null;
  }
}

function inferPlanId(identifier?: string | null): PlanId | null {
  if (!identifier) {
    return null;
  }
  const normalized = identifier.toLowerCase();
  if (normalized.includes('annual') || normalized.includes('year')) {
    return 'annual_pro';
  }
  if (normalized.includes('month')) {
    return 'monthly_pro';
  }
  if (normalized.includes('lifetime') || normalized.includes('forever')) {
    return 'lifetime_pro';
  }
  return null;
}

function mapCustomerInfoToEntitlement(
  customerInfo: RevenueCatCustomerInfo | null | undefined,
): EntitlementStatus {
  const activeMap = customerInfo?.entitlements?.active ?? {};
  const activeEntries = Object.values(activeMap);
  const proEntitlement =
    activeMap.pro ??
    activeEntries.find((entry) => entry?.isActive !== false) ??
    null;

  if (!proEntitlement) {
    return {
      isPro: false,
      isTrial: false,
      activePlanId: null,
      source: 'revenuecat',
    };
  }

  return {
    isPro: true,
    isTrial: proEntitlement.periodType?.toUpperCase() === 'TRIAL',
    activePlanId:
      inferPlanId(proEntitlement.productIdentifier) ??
      inferPlanId(proEntitlement.identifier),
    source: 'revenuecat',
  };
}

function findMatchingPackage(
  packages: ReadonlyArray<RevenueCatPackage>,
  planId: PlanId,
): RevenueCatPackage | null {
  for (const pkg of packages) {
    const inferred =
      inferPlanId(pkg.identifier) ??
      inferPlanId(pkg.packageType) ??
      inferPlanId(pkg.product?.identifier);
    if (inferred === planId) {
      return pkg;
    }
  }
  return null;
}

function mapPackageToOffering(
  pkg: RevenueCatPackage,
  offeringId: string,
): PurchaseOffering | null {
  const planId =
    inferPlanId(pkg.identifier) ??
    inferPlanId(pkg.packageType) ??
    inferPlanId(pkg.product?.identifier);

  if (!planId) {
    return null;
  }

  const base = getOfferingById(planId);
  return {
    ...base,
    offeringId,
    priceUsd:
      typeof pkg.product?.price === 'number' && Number.isFinite(pkg.product.price)
        ? pkg.product.price
        : base.priceUsd,
    priceLabel: pkg.product?.priceString || base.priceLabel,
  };
}

function createRevenueCatProvider(rc: RevenueCatModule): PurchasesProvider {
  return {
    getOfferings: async () => {
      const offerings = await rc.getOfferings();
      const current = offerings?.current;
      const available = current?.availablePackages ?? [];
      const offeringId = current?.identifier || 'default';
      const mapped: PurchaseOffering[] = [];

      for (const pkg of available) {
        const item = mapPackageToOffering(pkg, offeringId);
        if (item) {
          mapped.push(item);
        }
      }

      return mapped;
    },

    purchasePlan: async (planId: PlanId): Promise<PurchaseResult> => {
      const offerings = await rc.getOfferings();
      const packages = offerings?.current?.availablePackages ?? [];
      const pkg = findMatchingPackage(packages, planId);

      if (!pkg) {
        const entitlement = mapCustomerInfoToEntitlement(
          await rc.getCustomerInfo().catch(() => null),
        );
        return {
          ok: false,
          planId,
          entitlement,
          error: 'Selected plan is currently unavailable.',
        };
      }

      try {
        const { customerInfo } = await rc.purchasePackage(pkg);
        const entitlement = mapCustomerInfoToEntitlement(customerInfo);
        return {
          ok: entitlement.isPro,
          planId,
          entitlement,
        };
      } catch (error) {
        const cancelled = Boolean(
          error &&
            typeof error === 'object' &&
            'userCancelled' in error &&
            (error as { userCancelled?: boolean }).userCancelled,
        );
        const entitlement = mapCustomerInfoToEntitlement(
          await rc.getCustomerInfo().catch(() => null),
        );
        return {
          ok: false,
          cancelled,
          planId,
          entitlement,
          error: cancelled
            ? undefined
            : error instanceof Error
              ? error.message
              : 'Unable to complete purchase.',
        };
      }
    },

    restorePurchases: async (): Promise<EntitlementStatus> => {
      const customerInfo = await rc.restorePurchases();
      return mapCustomerInfoToEntitlement(customerInfo);
    },

    getEntitlementStatus: async (): Promise<EntitlementStatus> => {
      const customerInfo = await rc.getCustomerInfo();
      return mapCustomerInfoToEntitlement(customerInfo);
    },
  };
}

/**
 * Registers the native RevenueCat purchases adapter when running in a custom
 * native/standalone iOS or Android build with an API key configured.
 * Gracefully stays in local sandbox mode in Expo Go, Web, and Jest.
 */
export function registerNativePurchasesProvider(): NativePurchasesRegistrationResult {
  if (
    (Platform.OS !== 'ios' && Platform.OS !== 'android') ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return {
      registered: false,
      platform: 'unsupported',
      reason: 'expo_go_or_web',
    };
  }

  const platform = Platform.OS;
  const apiKey = (
    platform === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
  )?.trim();

  if (!apiKey) {
    return {
      registered: false,
      platform,
      reason: 'missing_api_key',
    };
  }

  const rc = loadRevenueCatModule();
  if (!rc) {
    return {
      registered: false,
      platform,
      reason: 'native_module_unavailable',
    };
  }

  try {
    rc.configure({ apiKey });
    setPurchasesProvider(createRevenueCatProvider(rc));
    return {
      registered: true,
      platform,
    };
  } catch {
    return {
      registered: false,
      platform,
      reason: 'configure_failed',
    };
  }
}
