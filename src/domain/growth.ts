import type { CatalogItem, GardenPlacement, GrowthStage } from './types';

export const WATER_DEW_COST = 15;

export type GrowthLabel = 'Sprout' | 'Budding' | 'Full Bloom';

const GROWTH_LABELS: Record<GrowthStage, GrowthLabel> = {
  1: 'Sprout',
  2: 'Budding',
  3: 'Full Bloom',
};

const GROWTH_SCALES: Record<GrowthStage, number> = {
  1: 0.74,
  2: 0.94,
  3: 1.14,
};

/**
 * Returns the effective growth stage for a placed item.
 * Decor and critters are always Full Bloom (3); plants default to Sprout (1).
 */
export function getGrowthStage(
  placement: GardenPlacement,
  item?: CatalogItem,
): GrowthStage {
  if (item && item.category !== 'plant') {
    return 3;
  }
  const stage = placement.growthStage;
  if (stage === 1 || stage === 2 || stage === 3) {
    return stage;
  }
  return 1;
}

/**
 * Returns the human-readable botanical label for a growth stage.
 */
export function getGrowthLabel(stage: GrowthStage): GrowthLabel {
  return GROWTH_LABELS[stage];
}

/**
 * Returns the visual scale multiplier for a growth stage.
 */
export function getGrowthScale(stage: GrowthStage): number {
  return GROWTH_SCALES[stage];
}

export type WaterPlacementFailureReason =
  | 'NOT_FOUND'
  | 'ALREADY_FULL_BLOOM'
  | 'NOT_A_PLANT'
  | 'INSUFFICIENT_DEW';

export type WaterPlacementResult =
  | {
      ok: true;
      nextPlacements: GardenPlacement[];
      nextDew: number;
      newStage: GrowthStage;
    }
  | {
      ok: false;
      reason: WaterPlacementFailureReason;
    };

export interface WaterPlacementParams {
  placementId: string;
  placements: GardenPlacement[];
  dewBalance: number;
  catalogById: Record<string, CatalogItem>;
  nowIso?: string;
}

/**
 * Waters a placed plant with Dew, advancing its growth stage from 1 -> 2 -> 3.
 */
export function waterPlacement(params: WaterPlacementParams): WaterPlacementResult {
  const { placementId, placements, dewBalance, catalogById, nowIso } = params;

  const target = placements.find((p) => p.id === placementId);
  if (!target) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  const item = catalogById[target.itemId];
  if (!item || item.category !== 'plant') {
    return { ok: false, reason: 'NOT_A_PLANT' };
  }

  const currentStage = getGrowthStage(target, item);
  if (currentStage >= 3) {
    return { ok: false, reason: 'ALREADY_FULL_BLOOM' };
  }

  if (dewBalance < WATER_DEW_COST) {
    return { ok: false, reason: 'INSUFFICIENT_DEW' };
  }

  const newStage: GrowthStage = currentStage === 1 ? 2 : 3;
  const wateredAt = nowIso ?? new Date().toISOString();

  const nextPlacements = placements.map((p) =>
    p.id === placementId
      ? { ...p, growthStage: newStage, lastWateredAt: wateredAt }
      : p,
  );

  return {
    ok: true,
    nextPlacements,
    nextDew: dewBalance - WATER_DEW_COST,
    newStage,
  };
}
