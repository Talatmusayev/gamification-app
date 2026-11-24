import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { getCatalogItemById } from '@/domain/catalog';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import type { FogLevel, GardenPlacement } from '@/domain/types';
import { motion, palette } from '@/theme/tokens';

const TILE_WIDTH = 52;
const TILE_HEIGHT = 28;
const CANVAS_WIDTH = GRID_SIZE * TILE_WIDTH + 48;
const CANVAS_HEIGHT = GRID_SIZE * TILE_HEIGHT + 96;
const ORIGIN_X = CANVAS_WIDTH / 2;
const ORIGIN_Y = 44;
const ISLAND_DEPTH = 12;

const MIN_SCALE = 0.75;
const MAX_SCALE = 1.85;
const MAX_PAN_X = 160;
const MAX_PAN_Y = 140;

const FOG_OPACITY_BY_LEVEL: Record<FogLevel, number> = {
  0: 0,
  1: 0.18,
  2: 0.42,
  3: 0.65,
};

export interface IsometricCanvasProps {
  placements: GardenPlacement[];
  fogLevel: FogLevel;
  placingItemId?: string | null;
  movingPlacementId?: string | null;
  onTilePress: (x: number, y: number) => void;
  onPlacementPress: (placement: GardenPlacement) => void;
}

interface GridCoord {
  x: number;
  y: number;
}

const ALL_TILES: readonly GridCoord[] = Array.from(
  { length: GRID_SIZE * GRID_SIZE },
  (_, index) => ({
    x: Math.floor(index / GRID_SIZE),
    y: index % GRID_SIZE,
  }),
).sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);

function diamondPoints(cx: number, cy: number): string {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  return [
    `${cx},${cy - halfH}`,
    `${cx + halfW},${cy}`,
    `${cx},${cy + halfH}`,
    `${cx - halfW},${cy}`,
  ].join(' ');
}

function leftBevelPoints(cx: number, cy: number): string {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  return [
    `${cx - halfW},${cy}`,
    `${cx},${cy + halfH}`,
    `${cx},${cy + halfH + ISLAND_DEPTH}`,
    `${cx - halfW},${cy + ISLAND_DEPTH}`,
  ].join(' ');
}

function rightBevelPoints(cx: number, cy: number): string {
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;
  return [
    `${cx},${cy + halfH}`,
    `${cx + halfW},${cy}`,
    `${cx + halfW},${cy + ISLAND_DEPTH}`,
    `${cx},${cy + halfH + ISLAND_DEPTH}`,
  ].join(' ');
}

function clampWorklet(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export function IsometricCanvas({
  placements,
  fogLevel,
  placingItemId = null,
  movingPlacementId = null,
  onTilePress,
  onPlacementPress,
}: IsometricCanvasProps) {
  const reducedMotion = useReducedMotion();

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const fogOpacity = useSharedValue(FOG_OPACITY_BY_LEVEL[fogLevel]);

  useEffect(() => {
    const targetOpacity = FOG_OPACITY_BY_LEVEL[fogLevel];
    if (reducedMotion) {
      fogOpacity.value = targetOpacity;
    } else {
      fogOpacity.value = withTiming(targetOpacity, {
        duration: motion.enterMs * 2,
      });
    }
  }, [fogLevel, fogOpacity, reducedMotion]);

  const composedGesture = useMemo(() => {
    const panGesture = Gesture.Pan()
      .minDistance(6)
      .onUpdate((event) => {
        translateX.value = clampWorklet(
          savedTranslateX.value + event.translationX,
          -MAX_PAN_X,
          MAX_PAN_X,
        );
        translateY.value = clampWorklet(
          savedTranslateY.value + event.translationY,
          -MAX_PAN_Y,
          MAX_PAN_Y,
        );
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        scale.value = clampWorklet(
          savedScale.value * event.scale,
          MIN_SCALE,
          MAX_SCALE,
        );
      })
      .onEnd(() => {
        savedScale.value = scale.value;
      });

    return Gesture.Simultaneous(panGesture, pinchGesture);
  }, [
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
    scale,
    savedScale,
  ]);

  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const fogAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fogOpacity.value,
  }));

  const placementByCoord = useMemo(() => {
    const map = new Map<string, GardenPlacement>();
    for (const placement of placements) {
      map.set(`${placement.x},${placement.y}`, placement);
    }
    return map;
  }, [placements]);

  const sortedPlacements = useMemo(
    () =>
      [...placements].sort(
        (a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x,
      ),
    [placements],
  );

  const isInteractiveMode = Boolean(placingItemId || movingPlacementId);

  return (
    <View style={styles.viewport}>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.canvasStage, boardAnimatedStyle]}>
          {/* Isometric 8x8 Sunlit Meadow Base */}
          <Svg
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          >
            {ALL_TILES.map(({ x, y }) => {
              const { sx, sy } = gridToScreen(x, y, TILE_WIDTH, TILE_HEIGHT);
              const cx = ORIGIN_X + sx;
              const cy = ORIGIN_Y + sy;
              const isChecker = (x + y) % 2 === 0;
              const occupant = placementByCoord.get(`${x},${y}`);
              const isMovingTarget =
                occupant && occupant.id === movingPlacementId;
              const highlightAvailable = isInteractiveMode && !occupant;

              let fill = isChecker ? '#DCE7D4' : '#D2E0C8';
              if (highlightAvailable) {
                fill = isChecker ? '#E5EFE0' : '#DBE8D4';
              }
              if (isMovingTarget) {
                fill = '#EFE4C8';
              }

              return (
                <Polygon
                  key={`tile_${x}_${y}`}
                  points={diamondPoints(cx, cy)}
                  fill={fill}
                  stroke={
                    highlightAvailable
                      ? 'rgba(54, 94, 68, 0.30)'
                      : 'rgba(54, 94, 68, 0.14)'
                  }
                  strokeWidth={highlightAvailable ? 1.1 : 0.75}
                />
              );
            })}

            {/* Warm earthy diorama bevel along front edges */}
            {ALL_TILES.filter(({ x, y }) => y === GRID_SIZE - 1).map(
              ({ x, y }) => {
                const { sx, sy } = gridToScreen(x, y, TILE_WIDTH, TILE_HEIGHT);
                return (
                  <Polygon
                    key={`bevel_left_${x}_${y}`}
                    points={leftBevelPoints(ORIGIN_X + sx, ORIGIN_Y + sy)}
                    fill="#B9AE9A"
                    stroke="rgba(30, 36, 30, 0.08)"
                    strokeWidth={0.5}
                  />
                );
              },
            )}
            {ALL_TILES.filter(({ x, y }) => x === GRID_SIZE - 1).map(
              ({ x, y }) => {
                const { sx, sy } = gridToScreen(x, y, TILE_WIDTH, TILE_HEIGHT);
                return (
                  <Polygon
                    key={`bevel_right_${x}_${y}`}
                    points={rightBevelPoints(ORIGIN_X + sx, ORIGIN_Y + sy)}
                    fill="#A69A86"
                    stroke="rgba(30, 36, 30, 0.08)"
                    strokeWidth={0.5}
                  />
                );
              },
            )}
          </Svg>

          {/* Interactive Tap Targets Layer */}
          <View style={styles.overlayLayer}>
            {ALL_TILES.map(({ x, y }) => {
              const { sx, sy } = gridToScreen(x, y, TILE_WIDTH, TILE_HEIGHT);
              const left = ORIGIN_X + sx - TILE_WIDTH * 0.42;
              const top = ORIGIN_Y + sy - TILE_HEIGHT * 0.45;
              const occupant = placementByCoord.get(`${x},${y}`);
              const item = occupant
                ? getCatalogItemById(occupant.itemId)
                : undefined;

              return (
                <Pressable
                  key={`hit_${x}_${y}`}
                  onPress={() => {
                    if (occupant && !placingItemId) {
                      onPlacementPress(occupant);
                    } else {
                      onTilePress(x, y);
                    }
                  }}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item
                      ? `${item.name} at row ${y + 1}, column ${x + 1}`
                      : `Empty meadow tile row ${y + 1}, column ${x + 1}`
                  }
                  style={[
                    styles.tileHitTarget,
                    {
                      left,
                      top,
                      width: TILE_WIDTH * 0.84,
                      height: TILE_HEIGHT * 0.9,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Painter-Sorted Botanical Sprites Layer */}
          <View style={styles.overlayLayer} pointerEvents="none">
            {sortedPlacements.map((placement) => {
              const item = getCatalogItemById(placement.itemId);
              if (!item) {
                return null;
              }
              const { sx, sy } = gridToScreen(
                placement.x,
                placement.y,
                TILE_WIDTH,
                TILE_HEIGHT,
              );
              const spriteSize = 46;
              const isSelected = placement.id === movingPlacementId;

              return (
                <View
                  key={placement.id}
                  style={[
                    styles.spriteAnchor,
                    {
                      left: ORIGIN_X + sx - spriteSize / 2,
                      top: ORIGIN_Y + sy - spriteSize + 10,
                      width: spriteSize,
                      height: spriteSize,
                    },
                    isSelected && styles.spriteSelected,
                  ]}
                >
                  <GardenSprite assetKey={item.assetKey} size={spriteSize} />
                </View>
              );
            })}
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Compassionate Morning Fog Veil */}
      <Animated.View
        pointerEvents="none"
        style={[styles.fogOverlay, fogAnimatedStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: palette.bg,
  },
  canvasStage: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  overlayLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  tileHitTarget: {
    position: 'absolute',
    borderRadius: 12,
  },
  spriteAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteSelected: {
    transform: [{ translateY: -4 }],
  },
  fogOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#F3F0E8',
  },
});
