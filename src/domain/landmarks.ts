import { GRID_SIZE, isWithinGrid } from './grid';

export type GreenhouseStage = 'overgrown' | 'tended' | 'restored';
export type PierStage = 'weathered' | 'restored';

export interface SanctuaryLandmarks {
  postboxReady: boolean;
  greenhouseStage: GreenhouseStage;
  pierStage: PierStage;
  wellActive: boolean;
}

export interface SanctuaryLandmarksInput {
  daysTended: number;
  harmonyDays: number;
  placementCount: number;
}

export interface MeadowWaypoint {
  x: number;
  y: number;
}

const PIP_SCENIC_WAYPOINTS: readonly MeadowWaypoint[] = [
  { x: 3, y: 4 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
  { x: 5, y: 3 },
  { x: 5, y: 2 },
  { x: 4, y: 2 },
  { x: 3, y: 2 },
  { x: 2, y: 2 },
  { x: 2, y: 3 },
  { x: 3, y: 5 },
];

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

/**
 * Computes progressive Hay Day-style restoration stages for permanent
 * Sanctuary rim landmarks based on tending history, harmony, and placements.
 */
export function getSanctuaryLandmarks({
  daysTended,
  harmonyDays,
  placementCount,
}: SanctuaryLandmarksInput): SanctuaryLandmarks {
  const safeDays = sanitizeCount(daysTended);
  const safeHarmony = sanitizeCount(harmonyDays);
  const safePlacements = sanitizeCount(placementCount);

  let greenhouseStage: GreenhouseStage = 'overgrown';
  if (safeDays >= 4 || safePlacements >= 6) {
    greenhouseStage = 'restored';
  } else if (safeDays >= 2) {
    greenhouseStage = 'tended';
  }

  const pierStage: PierStage =
    safePlacements >= 5 || safeDays >= 5 ? 'restored' : 'weathered';

  const wellActive = safeHarmony >= 3;

  return {
    postboxReady: true,
    greenhouseStage,
    pierStage,
    wellActive,
  };
}

/**
 * Returns an ordered loop of scenic open-meadow coordinates for Pip's
 * gentle patrol around the sanctuary clearing and stepping-stone trail.
 */
export function getPipWanderWaypoints(): MeadowWaypoint[] {
  return PIP_SCENIC_WAYPOINTS.map((coord) => ({ ...coord }));
}

/**
 * Filters Pip's patrol waypoints against occupied garden placements so Pip
 * hops exclusively between clear meadow tiles.
 */
export function getAvailablePipWaypoints(
  placements: ReadonlyArray<{ x: number; y: number }>,
): MeadowWaypoint[] {
  const occupied = new Set(placements.map((p) => `${p.x},${p.y}`));
  const scenicOpen = PIP_SCENIC_WAYPOINTS.filter(
    (coord) => !occupied.has(`${coord.x},${coord.y}`),
  );

  if (scenicOpen.length > 0) {
    return scenicOpen.map((coord) => ({ ...coord }));
  }

  // Fallback to any unoccupied tile on the 8x8 meadow if all scenic waypoints are filled
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (isWithinGrid(x, y) && !occupied.has(`${x},${y}`)) {
        return [{ x, y }];
      }
    }
  }

  return [{ x: 3, y: 4 }];
}
