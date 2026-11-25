import { isWithinGrid } from '../../src/domain/grid';
import {
  getAvailablePipWaypoints,
  getPipWanderWaypoints,
  getSanctuaryLandmarks,
} from '../../src/domain/landmarks';

describe('sanctuary landmarks & Pip patrol domain', () => {
  describe('getSanctuaryLandmarks', () => {
    it('always marks postboxReady as true', () => {
      expect(
        getSanctuaryLandmarks({ daysTended: 0, harmonyDays: 0, placementCount: 0 })
          .postboxReady,
      ).toBe(true);
      expect(
        getSanctuaryLandmarks({ daysTended: 10, harmonyDays: 7, placementCount: 12 })
          .postboxReady,
      ).toBe(true);
    });

    it('progresses greenhouseStage across overgrown (0-1d), tended (2-3d), and restored (4+d or 6+ placements)', () => {
      expect(
        getSanctuaryLandmarks({ daysTended: 0, harmonyDays: 0, placementCount: 3 })
          .greenhouseStage,
      ).toBe('overgrown');
      expect(
        getSanctuaryLandmarks({ daysTended: 1, harmonyDays: 1, placementCount: 5 })
          .greenhouseStage,
      ).toBe('overgrown');

      expect(
        getSanctuaryLandmarks({ daysTended: 2, harmonyDays: 1, placementCount: 3 })
          .greenhouseStage,
      ).toBe('tended');
      expect(
        getSanctuaryLandmarks({ daysTended: 3, harmonyDays: 2, placementCount: 5 })
          .greenhouseStage,
      ).toBe('tended');

      expect(
        getSanctuaryLandmarks({ daysTended: 4, harmonyDays: 2, placementCount: 2 })
          .greenhouseStage,
      ).toBe('restored');
      expect(
        getSanctuaryLandmarks({ daysTended: 0, harmonyDays: 0, placementCount: 6 })
          .greenhouseStage,
      ).toBe('restored');
    });

    it('progresses pierStage from weathered (0-4 placements & <5d) to restored (5+ placements or 5+ days tended)', () => {
      expect(
        getSanctuaryLandmarks({ daysTended: 0, harmonyDays: 0, placementCount: 0 })
          .pierStage,
      ).toBe('weathered');
      expect(
        getSanctuaryLandmarks({ daysTended: 4, harmonyDays: 4, placementCount: 4 })
          .pierStage,
      ).toBe('weathered');

      expect(
        getSanctuaryLandmarks({ daysTended: 1, harmonyDays: 1, placementCount: 5 })
          .pierStage,
      ).toBe('restored');
      expect(
        getSanctuaryLandmarks({ daysTended: 5, harmonyDays: 1, placementCount: 2 })
          .pierStage,
      ).toBe('restored');
    });

    it('activates wishing well only when harmonyDays >= 3', () => {
      expect(
        getSanctuaryLandmarks({ daysTended: 5, harmonyDays: 0, placementCount: 8 })
          .wellActive,
      ).toBe(false);
      expect(
        getSanctuaryLandmarks({ daysTended: 5, harmonyDays: 2, placementCount: 8 })
          .wellActive,
      ).toBe(false);
      expect(
        getSanctuaryLandmarks({ daysTended: 3, harmonyDays: 3, placementCount: 3 })
          .wellActive,
      ).toBe(true);
      expect(
        getSanctuaryLandmarks({ daysTended: 7, harmonyDays: 7, placementCount: 10 })
          .wellActive,
      ).toBe(true);
    });

    it('clamps negative and non-finite inputs safely to zero', () => {
      expect(
        getSanctuaryLandmarks({
          daysTended: -3,
          harmonyDays: Number.NaN,
          placementCount: -1,
        }),
      ).toEqual({
        postboxReady: true,
        greenhouseStage: 'overgrown',
        pierStage: 'weathered',
        wellActive: false,
      });
    });
  });

  describe('getPipWanderWaypoints', () => {
    it('returns multiple ordered meadow coordinates strictly within the 8x8 grid', () => {
      const waypoints = getPipWanderWaypoints();
      expect(waypoints.length).toBeGreaterThanOrEqual(6);
      expect(waypoints[0]).toEqual({ x: 3, y: 4 });

      for (const wp of waypoints) {
        expect(isWithinGrid(wp.x, wp.y)).toBe(true);
      }
    });

    it('returns fresh coordinate objects on every call', () => {
      const first = getPipWanderWaypoints();
      const second = getPipWanderWaypoints();
      first[0].x = 99;
      expect(second[0].x).toBe(3);
    });

    it('avoids starter nook placements and filters dynamically occupied tiles', () => {
      const starterCoords = [
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 2, y: 4 },
      ];
      const baseWaypoints = getPipWanderWaypoints();
      for (const starter of starterCoords) {
        expect(baseWaypoints).not.toContainEqual(starter);
      }

      const filtered = getAvailablePipWaypoints([
        ...starterCoords,
        { x: 3, y: 4 },
        { x: 4, y: 4 },
      ]);
      expect(filtered).not.toContainEqual({ x: 3, y: 4 });
      expect(filtered).not.toContainEqual({ x: 4, y: 4 });
      expect(filtered.length).toBe(baseWaypoints.length - 2);
    });

    it('falls back to another open grid tile if all scenic waypoints are occupied', () => {
      const allScenic = getPipWanderWaypoints();
      const fallback = getAvailablePipWaypoints(allScenic);
      expect(fallback).toHaveLength(1);
      expect(isWithinGrid(fallback[0].x, fallback[0].y)).toBe(true);
      expect(allScenic).not.toContainEqual(fallback[0]);
    });
  });
});
