import { SUNLIT_MEADOW_CATALOG } from '../../src/domain/catalog';
import { GRID_SIZE, gridToScreen, validateAndPlaceItem, movePlacement } from '../../src/domain/grid';

describe('sanctuary grid & catalog', () => {
  it('seeds exactly 35 Sunlit Meadow catalog items (18 plants, 10 decor, 7 critters)', () => {
    expect(SUNLIT_MEADOW_CATALOG).toHaveLength(35);
    expect(SUNLIT_MEADOW_CATALOG.filter(i => i.category === 'plant')).toHaveLength(18);
    expect(SUNLIT_MEADOW_CATALOG.filter(i => i.category === 'decor')).toHaveLength(10);
    expect(SUNLIT_MEADOW_CATALOG.filter(i => i.category === 'critter')).toHaveLength(7);
  });

  it('splits catalog into 15 Free and 20 Pro items with unique slugs, no emojis, and 3 starter seedlings', () => {
    const freeItems = SUNLIT_MEADOW_CATALOG.filter(i => !i.isPro);
    const proItems = SUNLIT_MEADOW_CATALOG.filter(i => i.isPro);
    expect(freeItems).toHaveLength(15);
    expect(proItems).toHaveLength(20);

    const ids = new Set(SUNLIT_MEADOW_CATALOG.map(i => i.id));
    const assetKeys = new Set(SUNLIT_MEADOW_CATALOG.map(i => i.assetKey));
    expect(ids.size).toBe(35);
    expect(assetKeys.size).toBe(35);

    const starterIds = ['lavender', 'bonsai_sprout', 'sunlit_fern'];
    for (const starterId of starterIds) {
      const starter = SUNLIT_MEADOW_CATALOG.find(i => i.id === starterId);
      expect(starter).toBeDefined();
      expect(starter?.category).toBe('plant');
      expect(starter?.isPro).toBe(false);
      expect(starter?.assetKey).toBe(starterId);
    }

    const emojiRegex = /[\p{Extended_Pictographic}]/u;
    for (const item of SUNLIT_MEADOW_CATALOG) {
      expect(emojiRegex.test(item.id)).toBe(false);
      expect(emojiRegex.test(item.name)).toBe(false);
      expect(emojiRegex.test(item.assetKey)).toBe(false);
      expect(emojiRegex.test(item.description)).toBe(false);
      expect(item.dewCost).toBeGreaterThanOrEqual(0);
      expect(item.sunlightCost).toBeGreaterThanOrEqual(0);
    }
  });

  it('rejects out-of-bounds, occupied tile, and insufficient funds cleanly', () => {
    const freeItem = SUNLIT_MEADOW_CATALOG.find(i => !i.isPro)!;
    expect(validateAndPlaceItem({ item: freeItem, x: GRID_SIZE, y: 0, placements: [], ownedItemIds: [], dewBalance: 500, sunlightBalance: 500, isPro: false })).toEqual({ ok: false, reason: 'OUT_OF_BOUNDS' });
    expect(validateAndPlaceItem({ item: freeItem, x: -1, y: 0, placements: [], ownedItemIds: [], dewBalance: 500, sunlightBalance: 500, isPro: false })).toEqual({ ok: false, reason: 'OUT_OF_BOUNDS' });
    expect(validateAndPlaceItem({ item: freeItem, x: 0, y: GRID_SIZE, placements: [], ownedItemIds: [], dewBalance: 500, sunlightBalance: 500, isPro: false })).toEqual({ ok: false, reason: 'OUT_OF_BOUNDS' });
    expect(validateAndPlaceItem({ item: freeItem, x: 1.5, y: 2, placements: [], ownedItemIds: [], dewBalance: 500, sunlightBalance: 500, isPro: false })).toEqual({ ok: false, reason: 'OUT_OF_BOUNDS' });
    expect(validateAndPlaceItem({ item: freeItem, x: 2, y: 2, placements: [{ id: 'p1', itemId: freeItem.id, x: 2, y: 2, placedAt: '' }], ownedItemIds: [], dewBalance: 500, sunlightBalance: 500, isPro: false })).toEqual({ ok: false, reason: 'TILE_OCCUPIED' });
    expect(validateAndPlaceItem({ item: freeItem, x: 1, y: 1, placements: [], ownedItemIds: [], dewBalance: 0, sunlightBalance: 0, isPro: false })).toEqual({ ok: false, reason: 'INSUFFICIENT_FUNDS' });
  });

  it('deducts currency on first purchase and allows placing already-owned items without double-charging', () => {
    const freeItem = SUNLIT_MEADOW_CATALOG.find(i => !i.isPro && i.dewCost > 0)!;
    const first = validateAndPlaceItem({
      item: freeItem,
      x: 1,
      y: 1,
      placements: [],
      ownedItemIds: [],
      dewBalance: 200,
      sunlightBalance: 200,
      isPro: false,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(first.nextDew).toBe(200 - freeItem.dewCost);
    expect(first.nextSunlight).toBe(200 - freeItem.sunlightCost);
    expect(first.nextOwnedIds).toContain(freeItem.id);
    expect(first.nextPlacements).toHaveLength(1);
    expect(first.nextPlacements[0]).toMatchObject({ itemId: freeItem.id, x: 1, y: 1 });

    const second = validateAndPlaceItem({
      item: freeItem,
      x: 2,
      y: 2,
      placements: first.nextPlacements,
      ownedItemIds: first.nextOwnedIds,
      dewBalance: 0,
      sunlightBalance: 0,
      isPro: false,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.nextDew).toBe(0);
    expect(second.nextSunlight).toBe(0);
    expect(second.nextPlacements).toHaveLength(2);
    expect(second.nextOwnedIds).toEqual(first.nextOwnedIds);
  });

  it('blocks buying unowned Pro item when isPro=false, but allows moving already-placed Pro items', () => {
    const proItem = SUNLIT_MEADOW_CATALOG.find(i => i.isPro)!;
    expect(validateAndPlaceItem({ item: proItem, x: 1, y: 1, placements: [], ownedItemIds: [], dewBalance: 999, sunlightBalance: 999, isPro: false })).toEqual({ ok: false, reason: 'PRO_REQUIRED' });

    const proSuccess = validateAndPlaceItem({ item: proItem, x: 1, y: 1, placements: [], ownedItemIds: [], dewBalance: 999, sunlightBalance: 999, isPro: true });
    expect(proSuccess.ok).toBe(true);

    const moved = movePlacement([{ id: 'p-pro', itemId: proItem.id, x: 1, y: 1, placedAt: '' }], 'p-pro', 3, 4);
    expect(moved.ok).toBe(true);
    if (moved.ok) {
      expect(moved.nextPlacements[0]).toMatchObject({ id: 'p-pro', x: 3, y: 4 });
    }
  });

  it('validates movePlacement bounds, missing id, and occupied tiles', () => {
    const placements = [
      { id: 'p1', itemId: 'lavender', x: 0, y: 0, placedAt: '' },
      { id: 'p2', itemId: 'bonsai_sprout', x: 2, y: 2, placedAt: '' },
    ];
    expect(movePlacement(placements, 'missing', 1, 1)).toEqual({ ok: false, reason: 'NOT_FOUND' });
    expect(movePlacement(placements, 'p1', GRID_SIZE, 0)).toEqual({ ok: false, reason: 'OUT_OF_BOUNDS' });
    expect(movePlacement(placements, 'p1', 2, 2)).toEqual({ ok: false, reason: 'TILE_OCCUPIED' });
    expect(movePlacement(placements, 'p1', 0, 0)).toEqual({
      ok: true,
      nextPlacements: placements,
    });
  });

  it('converts isometric grid coordinates to 2:1 diamond screen coordinates', () => {
    expect(gridToScreen(0, 0, 64, 32)).toEqual({ sx: 0, sy: 0 });
    expect(gridToScreen(1, 0, 64, 32)).toEqual({ sx: 32, sy: 16 });
    expect(gridToScreen(0, 1, 64, 32)).toEqual({ sx: -32, sy: 16 });
  });
});
