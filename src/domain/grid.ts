import type { CatalogItem, GardenPlacement } from './types';

export const GRID_SIZE = 8;

export function isWithinGrid(x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < GRID_SIZE &&
    y >= 0 &&
    y < GRID_SIZE
  );
}

export function gridToScreen(
  x: number,
  y: number,
  tileWidth: number,
  tileHeight: number
): { sx: number; sy: number } {
  const sx = (x - y) * (tileWidth / 2);
  const sy = (x + y) * (tileHeight / 2);
  return {
    sx: sx === 0 ? 0 : sx,
    sy: sy === 0 ? 0 : sy,
  };
}

export type PlaceItemParams = {
  item: CatalogItem;
  x: number;
  y: number;
  placements: GardenPlacement[];
  ownedItemIds: string[];
  dewBalance: number;
  sunlightBalance: number;
  isPro: boolean;
};

export type PlaceItemResult =
  | {
      ok: true;
      nextPlacements: GardenPlacement[];
      nextDew: number;
      nextSunlight: number;
      nextOwnedIds: string[];
    }
  | {
      ok: false;
      reason: 'OUT_OF_BOUNDS' | 'TILE_OCCUPIED' | 'INSUFFICIENT_FUNDS' | 'PRO_REQUIRED';
    };

export function validateAndPlaceItem(params: PlaceItemParams): PlaceItemResult {
  const { item, x, y, placements, ownedItemIds, dewBalance, sunlightBalance, isPro } = params;

  if (!isWithinGrid(x, y)) {
    return { ok: false, reason: 'OUT_OF_BOUNDS' };
  }

  const occupied = placements.some((p) => p.x === x && p.y === y);
  if (occupied) {
    return { ok: false, reason: 'TILE_OCCUPIED' };
  }

  const isOwned = ownedItemIds.includes(item.id);
  let nextDew = dewBalance;
  let nextSunlight = sunlightBalance;
  let nextOwnedIds = [...ownedItemIds];

  if (!isOwned) {
    if (item.isPro && !isPro) {
      return { ok: false, reason: 'PRO_REQUIRED' };
    }

    if (dewBalance < item.dewCost || sunlightBalance < item.sunlightCost) {
      return { ok: false, reason: 'INSUFFICIENT_FUNDS' };
    }

    nextDew = dewBalance - item.dewCost;
    nextSunlight = sunlightBalance - item.sunlightCost;
    nextOwnedIds = [...ownedItemIds, item.id];
  }

  const newPlacement: GardenPlacement = {
    id: `placement_${item.id}_${x}_${y}_${placements.length + 1}_${Date.now()}`,
    itemId: item.id,
    x,
    y,
    placedAt: new Date().toISOString(),
  };

  return {
    ok: true,
    nextPlacements: [...placements, newPlacement],
    nextDew,
    nextSunlight,
    nextOwnedIds,
  };
}

export type MovePlacementResult =
  | { ok: true; nextPlacements: GardenPlacement[] }
  | { ok: false; reason: 'NOT_FOUND' | 'OUT_OF_BOUNDS' | 'TILE_OCCUPIED' };

export function movePlacement(
  placements: GardenPlacement[],
  placementId: string,
  toX: number,
  toY: number
): MovePlacementResult {
  const existing = placements.find((p) => p.id === placementId);
  if (!existing) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  if (!isWithinGrid(toX, toY)) {
    return { ok: false, reason: 'OUT_OF_BOUNDS' };
  }

  const occupied = placements.some((p) => p.id !== placementId && p.x === toX && p.y === toY);
  if (occupied) {
    return { ok: false, reason: 'TILE_OCCUPIED' };
  }

  return {
    ok: true,
    nextPlacements: placements.map((p) =>
      p.id === placementId ? { ...p, x: toX, y: toY } : p
    ),
  };
}
