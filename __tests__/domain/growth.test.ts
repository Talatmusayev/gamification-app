import { CATALOG_BY_ID } from '../../src/domain/catalog';
import {
  WATER_DEW_COST,
  getGrowthLabel,
  getGrowthScale,
  getGrowthStage,
  waterPlacement,
} from '../../src/domain/growth';
import type { GardenPlacement } from '../../src/domain/types';

describe('growth & watering domain', () => {
  const plantPlacement: GardenPlacement = {
    id: 'p_lavender',
    itemId: 'lavender',
    x: 3,
    y: 3,
    placedAt: '2026-11-24T08:00:00.000Z',
  };

  const decorPlacement: GardenPlacement = {
    id: 'p_stone',
    itemId: 'stepping_stone',
    x: 4,
    y: 3,
    placedAt: '2026-11-24T08:00:00.000Z',
  };

  const critterPlacement: GardenPlacement = {
    id: 'p_robin',
    itemId: 'garden_robin',
    x: 2,
    y: 2,
    placedAt: '2026-11-24T08:00:00.000Z',
  };

  it('defaults plants to stage 1 and decor/critters to stage 3', () => {
    expect(getGrowthStage(plantPlacement, CATALOG_BY_ID.lavender)).toBe(1);
    expect(getGrowthStage(decorPlacement, CATALOG_BY_ID.stepping_stone)).toBe(3);
    expect(getGrowthStage(critterPlacement, CATALOG_BY_ID.garden_robin)).toBe(3);
  });

  it('maps growth stages to labels and scales', () => {
    expect(getGrowthLabel(1)).toBe('Sprout');
    expect(getGrowthLabel(2)).toBe('Budding');
    expect(getGrowthLabel(3)).toBe('Full Bloom');

    expect(getGrowthScale(1)).toBe(0.74);
    expect(getGrowthScale(2)).toBe(0.94);
    expect(getGrowthScale(3)).toBe(1.14);
  });

  it('waters a plant through stages 1 -> 2 -> 3, deducting 15 Dew and stamping lastWateredAt', () => {
    const first = waterPlacement({
      placementId: 'p_lavender',
      placements: [plantPlacement, decorPlacement],
      dewBalance: 40,
      catalogById: CATALOG_BY_ID,
      nowIso: '2026-11-24T09:00:00.000Z',
    });

    expect(first.ok).toBe(true);
    if (!first.ok) return;

    expect(first.newStage).toBe(2);
    expect(first.nextDew).toBe(40 - WATER_DEW_COST);
    expect(first.nextPlacements[0]).toMatchObject({
      id: 'p_lavender',
      growthStage: 2,
      lastWateredAt: '2026-11-24T09:00:00.000Z',
    });

    const second = waterPlacement({
      placementId: 'p_lavender',
      placements: first.nextPlacements,
      dewBalance: first.nextDew,
      catalogById: CATALOG_BY_ID,
      nowIso: '2026-11-24T10:00:00.000Z',
    });

    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.newStage).toBe(3);
    expect(second.nextDew).toBe(40 - WATER_DEW_COST * 2);
    expect(second.nextPlacements[0]).toMatchObject({
      id: 'p_lavender',
      growthStage: 3,
      lastWateredAt: '2026-11-24T10:00:00.000Z',
    });
  });

  it('rejects watering when already Full Bloom', () => {
    const fullBloom: GardenPlacement = {
      ...plantPlacement,
      growthStage: 3,
    };

    const result = waterPlacement({
      placementId: 'p_lavender',
      placements: [fullBloom],
      dewBalance: 50,
      catalogById: CATALOG_BY_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'ALREADY_FULL_BLOOM' });
  });

  it('rejects watering when Dew balance is below 15', () => {
    const result = waterPlacement({
      placementId: 'p_lavender',
      placements: [plantPlacement],
      dewBalance: 14,
      catalogById: CATALOG_BY_ID,
    });

    expect(result).toEqual({ ok: false, reason: 'INSUFFICIENT_DEW' });
  });

  it('rejects watering decor, critters, and missing placements', () => {
    expect(
      waterPlacement({
        placementId: 'p_stone',
        placements: [decorPlacement],
        dewBalance: 50,
        catalogById: CATALOG_BY_ID,
      }),
    ).toEqual({ ok: false, reason: 'NOT_A_PLANT' });

    expect(
      waterPlacement({
        placementId: 'p_robin',
        placements: [critterPlacement],
        dewBalance: 50,
        catalogById: CATALOG_BY_ID,
      }),
    ).toEqual({ ok: false, reason: 'NOT_A_PLANT' });

    expect(
      waterPlacement({
        placementId: 'missing_id',
        placements: [plantPlacement],
        dewBalance: 50,
        catalogById: CATALOG_BY_ID,
      }),
    ).toEqual({ ok: false, reason: 'NOT_FOUND' });
  });
});
