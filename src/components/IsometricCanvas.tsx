import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { SanctuaryCompanion } from '@/components/ui/SanctuaryCompanion';
import { getCatalogItemById } from '@/domain/catalog';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import type { FogLevel, GardenPlacement } from '@/domain/types';
import { motion, nightPalette, springs } from '@/theme/tokens';

const TILE_WIDTH = 52;
const TILE_HEIGHT = 28;
const HALF_W = TILE_WIDTH / 2;
const HALF_H = TILE_HEIGHT / 2;
const CANVAS_WIDTH = GRID_SIZE * TILE_WIDTH + 48;
const CANVAS_HEIGHT = GRID_SIZE * TILE_HEIGHT + 112;
const ORIGIN_X = CANVAS_WIDTH / 2;
const ORIGIN_Y = 44;
const CLIFF_DEPTH = 22;

const MIN_SCALE = 0.75;
const MAX_SCALE = 1.85;
const SOFT_PAN_BOUND = 120;
const RUBBER_BAND_SIZE = 72;

const FOG_OPACITY_BY_LEVEL: Record<FogLevel, number> = {
  0: 0,
  1: 0.18,
  2: 0.42,
  3: 0.65,
};

interface TimeOfDayAtmosphere {
  skyBg: string;
  isNight: boolean;
  isDusk: boolean;
}

function getTimeOfDayAtmosphere(hour: number): TimeOfDayAtmosphere {
  if (hour >= 5 && hour < 8) {
    return { skyBg: '#F9EFE6', isNight: false, isDusk: false };
  }
  if (hour >= 8 && hour < 12) {
    return { skyBg: '#F4F7F2', isNight: false, isDusk: false };
  }
  if (hour >= 12 && hour < 17) {
    return { skyBg: '#FAF6EE', isNight: false, isDusk: false };
  }
  if (hour >= 17 && hour < 20) {
    return { skyBg: '#F7EDE0', isNight: false, isDusk: true };
  }
  return { skyBg: nightPalette.bg, isNight: true, isDusk: false };
}

interface AmbientMoteSpec {
  id: string;
  leftPct: number;
  topPct: number;
  size: number;
  driftX: number;
  driftY: number;
  durationMs: number;
  delayMs: number;
}

const AMBIENT_MOTES: readonly AmbientMoteSpec[] = [
  { id: 'm1', leftPct: 16, topPct: 24, size: 4, driftX: 10, driftY: -18, durationMs: 4200, delayMs: 0 },
  { id: 'm2', leftPct: 78, topPct: 20, size: 3.5, driftX: -12, driftY: -14, durationMs: 4800, delayMs: 400 },
  { id: 'm3', leftPct: 30, topPct: 48, size: 5, driftX: 14, driftY: -22, durationMs: 5200, delayMs: 800 },
  { id: 'm4', leftPct: 68, topPct: 44, size: 3.5, driftX: -8, driftY: -16, durationMs: 4500, delayMs: 1200 },
  { id: 'm5', leftPct: 22, topPct: 66, size: 4, driftX: 9, driftY: -20, durationMs: 5000, delayMs: 600 },
  { id: 'm6', leftPct: 82, topPct: 60, size: 4.5, driftX: -11, driftY: -18, durationMs: 4600, delayMs: 1400 },
  { id: 'm7', leftPct: 48, topPct: 30, size: 3.5, driftX: 8, driftY: -15, durationMs: 4400, delayMs: 300 },
  { id: 'm8', leftPct: 56, topPct: 72, size: 4, driftX: -10, driftY: -20, durationMs: 5100, delayMs: 950 },
];

const STAR_COORDS: readonly { cx: number; cy: number; r: number; opacity: number }[] = [
  { cx: 48, cy: 36, r: 1.2, opacity: 0.55 },
  { cx: 120, cy: 22, r: 1.6, opacity: 0.7 },
  { cx: 210, cy: 48, r: 1.1, opacity: 0.45 },
  { cx: 298, cy: 28, r: 1.5, opacity: 0.65 },
  { cx: 365, cy: 52, r: 1.2, opacity: 0.5 },
  { cx: 84, cy: 86, r: 1.0, opacity: 0.4 },
  { cx: 340, cy: 96, r: 1.3, opacity: 0.55 },
  { cx: 412, cy: 34, r: 1.4, opacity: 0.6 },
];

export interface IsometricCanvasProps {
  placements: GardenPlacement[];
  fogLevel: FogLevel;
  placingItemId?: string | null;
  movingPlacementId?: string | null;
  isSleeping?: boolean;
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
  return [
    `${cx},${cy - HALF_H}`,
    `${cx + HALF_W},${cy}`,
    `${cx},${cy + HALF_H}`,
    `${cx - HALF_W},${cy}`,
  ].join(' ');
}

function clampWorklet(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function rubberBandWorklet(
  value: number,
  limit: number,
  bandSize: number,
): number {
  'worklet';
  if (value >= -limit && value <= limit) {
    return value;
  }
  const sign = value > limit ? 1 : -1;
  const excess = Math.abs(value) - limit;
  const damped = (1 - 1 / ((excess * 0.55) / bandSize + 1)) * bandSize;
  return sign * (limit + damped);
}

interface AmbientMoteProps {
  spec: AmbientMoteSpec;
  isFirefly: boolean;
  reducedMotion: boolean;
}

function AmbientMote({ spec, isFirefly, reducedMotion }: AmbientMoteProps) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const opacity = useSharedValue(isFirefly ? 0.35 : 0.4);

  useEffect(() => {
    if (reducedMotion) {
      offsetX.value = 0;
      offsetY.value = 0;
      opacity.value = isFirefly ? 0.55 : 0.45;
      return;
    }

    offsetX.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(spec.driftX, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );

    offsetY.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(spec.driftY, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(isFirefly ? 0.9 : 0.72, {
            duration: Math.round(spec.durationMs * 0.55),
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(isFirefly ? 0.2 : 0.25, {
            duration: Math.round(spec.durationMs * 0.45),
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [isFirefly, offsetX, offsetY, opacity, reducedMotion, spec]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ambientMote,
        {
          left: `${spec.leftPct}%`,
          top: `${spec.topPct}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: isFirefly ? '#E3B261' : '#FFF7DA',
        },
        animatedStyle,
      ]}
    />
  );
}

interface AnimatedPlacementSpriteProps {
  assetKey: string;
  size: number;
  isNew: boolean;
  reducedMotion: boolean;
}

function AnimatedPlacementSprite({
  assetKey,
  size,
  isNew,
  reducedMotion,
}: AnimatedPlacementSpriteProps) {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  useEffect(() => {
    if (!isNew || reducedMotion) {
      return;
    }
    scaleX.value = withSequence(
      withTiming(1.12, { duration: 90 }),
      withSpring(1, springs.pop),
    );
    scaleY.value = withSequence(
      withTiming(0.88, { duration: 90 }),
      withSpring(1, springs.pop),
    );
  }, [isNew, reducedMotion, scaleX, scaleY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }, { scaleY: scaleY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <GardenSprite assetKey={assetKey} size={size} />
    </Animated.View>
  );
}

export function IsometricCanvas({
  placements,
  fogLevel,
  placingItemId = null,
  movingPlacementId = null,
  isSleeping = false,
  onTilePress,
  onPlacementPress,
}: IsometricCanvasProps) {
  const reducedMotion = useReducedMotion();
  const atmosphere = useMemo(
    () => getTimeOfDayAtmosphere(new Date().getHours()),
    [],
  );

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
      .onStart(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate((event) => {
        const nextX = savedTranslateX.value + event.translationX;
        const nextY = savedTranslateY.value + event.translationY;
        if (reducedMotion) {
          translateX.value = clampWorklet(nextX, -SOFT_PAN_BOUND, SOFT_PAN_BOUND);
          translateY.value = clampWorklet(nextY, -SOFT_PAN_BOUND, SOFT_PAN_BOUND);
        } else {
          translateX.value = rubberBandWorklet(
            nextX,
            SOFT_PAN_BOUND,
            RUBBER_BAND_SIZE,
          );
          translateY.value = rubberBandWorklet(
            nextY,
            SOFT_PAN_BOUND,
            RUBBER_BAND_SIZE,
          );
        }
      })
      .onEnd(() => {
        const clampedX = clampWorklet(
          translateX.value,
          -SOFT_PAN_BOUND,
          SOFT_PAN_BOUND,
        );
        const clampedY = clampWorklet(
          translateY.value,
          -SOFT_PAN_BOUND,
          SOFT_PAN_BOUND,
        );
        if (reducedMotion) {
          translateX.value = clampedX;
          translateY.value = clampedY;
        } else {
          translateX.value =
            translateX.value === clampedX
              ? clampedX
              : withSpring(clampedX, springs.gentle);
          translateY.value =
            translateY.value === clampedY
              ? clampedY
              : withSpring(clampedY, springs.gentle);
        }
        savedTranslateX.value = clampedX;
        savedTranslateY.value = clampedY;
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
    reducedMotion,
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

  const seenPlacementIdsRef = useRef<Set<string> | null>(null);
  if (seenPlacementIdsRef.current === null) {
    seenPlacementIdsRef.current = new Set(placements.map((p) => p.id));
  }

  useEffect(() => {
    seenPlacementIdsRef.current = new Set(placements.map((p) => p.id));
  }, [placements]);

  const sortedPlacements = useMemo(
    () =>
      [...placements].sort(
        (a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x,
      ),
    [placements],
  );

  const isInteractiveMode = Boolean(placingItemId || movingPlacementId);

  const islandTopX = ORIGIN_X;
  const islandTopY = ORIGIN_Y - HALF_H;
  const islandRightX = ORIGIN_X + GRID_SIZE * HALF_W;
  const islandRightY = ORIGIN_Y + (GRID_SIZE - 1) * HALF_H;
  const islandBottomX = ORIGIN_X;
  const islandBottomY = ORIGIN_Y + (GRID_SIZE * 2 - 1) * HALF_H;
  const islandLeftX = ORIGIN_X - GRID_SIZE * HALF_W;
  const islandLeftY = ORIGIN_Y + (GRID_SIZE - 1) * HALF_H;

  const islandTopPoints = [
    `${islandTopX},${islandTopY}`,
    `${islandRightX},${islandRightY}`,
    `${islandBottomX},${islandBottomY}`,
    `${islandLeftX},${islandLeftY}`,
  ].join(' ');

  const leftCliffPoints = [
    `${islandLeftX},${islandLeftY}`,
    `${islandBottomX},${islandBottomY}`,
    `${islandBottomX},${islandBottomY + CLIFF_DEPTH}`,
    `${islandLeftX},${islandLeftY + CLIFF_DEPTH}`,
  ].join(' ');

  const rightCliffPoints = [
    `${islandBottomX},${islandBottomY}`,
    `${islandRightX},${islandRightY}`,
    `${islandRightX},${islandRightY + CLIFF_DEPTH}`,
    `${islandBottomX},${islandBottomY + CLIFF_DEPTH}`,
  ].join(' ');

  const pipScreen = gridToScreen(3, 4, TILE_WIDTH, TILE_HEIGHT);
  const pipSize = 54;

  return (
    <View style={[styles.viewport, { backgroundColor: atmosphere.skyBg }]}>
      {atmosphere.isNight ? (
        <Svg
          pointerEvents="none"
          style={styles.starfield}
          viewBox="0 0 440 220"
          preserveAspectRatio="xMidYMin slice"
        >
          {STAR_COORDS.map((star, index) => (
            <Circle
              key={`star_${index}`}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              fill="#F4F1EA"
              opacity={star.opacity}
            />
          ))}
        </Svg>
      ) : null}

      {/* Ambient Drifting Pollen Motes / Fireflies */}
      <View style={styles.overlayLayer} pointerEvents="none">
        {AMBIENT_MOTES.map((spec) => (
          <AmbientMote
            key={spec.id}
            spec={spec}
            isFirefly={atmosphere.isNight || atmosphere.isDusk}
            reducedMotion={Boolean(reducedMotion)}
          />
        ))}
      </View>

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.canvasStage, boardAnimatedStyle]}>
          {/* Floating Sunlit Meadow Island SVG */}
          <Svg
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          >
            <Defs>
              <RadialGradient id="islandShadowGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="rgba(30, 36, 30, 0.20)" />
                <Stop offset="65%" stopColor="rgba(30, 36, 30, 0.08)" />
                <Stop offset="100%" stopColor="rgba(30, 36, 30, 0)" />
              </RadialGradient>
              <LinearGradient id="islandGrassGrad" x1="15%" y1="0%" x2="85%" y2="100%">
                <Stop offset="0%" stopColor="#E4EEDB" />
                <Stop offset="50%" stopColor="#D5E3CA" />
                <Stop offset="100%" stopColor="#C1D4B4" />
              </LinearGradient>
              <LinearGradient id="leftCliffGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#B89F82" />
                <Stop offset="55%" stopColor="#A68B6F" />
                <Stop offset="100%" stopColor="#8E755B" />
              </LinearGradient>
              <LinearGradient id="rightCliffGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#9C8469" />
                <Stop offset="55%" stopColor="#897259" />
                <Stop offset="100%" stopColor="#725D47" />
              </LinearGradient>
            </Defs>

            {/* Soft elliptical floating ground shadow */}
            <Ellipse
              cx={ORIGIN_X}
              cy={islandBottomY + CLIFF_DEPTH + 14}
              rx={GRID_SIZE * HALF_W * 0.78}
              ry={16}
              fill="url(#islandShadowGrad)"
            />

            {/* Weathered terracotta & mossy cliff ledges */}
            <Polygon points={leftCliffPoints} fill="url(#leftCliffGrad)" />
            <Polygon points={rightCliffPoints} fill="url(#rightCliffGrad)" />

            {/* Mossy top surface */}
            <Polygon
              points={islandTopPoints}
              fill="url(#islandGrassGrad)"
              stroke="rgba(54, 94, 68, 0.14)"
              strokeWidth={1}
            />

            {/* Organic mossy meadow patches when resting */}
            {!isInteractiveMode ? (
              <>
                <Ellipse
                  cx={ORIGIN_X - 38}
                  cy={ORIGIN_Y + 95}
                  rx={36}
                  ry={15}
                  fill="#DDE9D3"
                  opacity={0.7}
                />
                <Ellipse
                  cx={ORIGIN_X + 52}
                  cy={ORIGIN_Y + 115}
                  rx={28}
                  ry={12}
                  fill="#C8D9BA"
                  opacity={0.55}
                />
              </>
            ) : null}

            {/* Hanging mossy vines along front cliff rims */}
            <Path
              d={`M ${islandLeftX + 44} ${islandLeftY + 23} Q ${islandLeftX + 46} ${islandLeftY + 34} ${islandLeftX + 42} ${islandLeftY + 40}`}
              fill="none"
              stroke="#5A835F"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
            <Path
              d={`M ${islandLeftX + 98} ${islandLeftY + 52} Q ${islandLeftX + 100} ${islandLeftY + 64} ${islandLeftX + 96} ${islandLeftY + 69}`}
              fill="none"
              stroke="#4D7452"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d={`M ${islandBottomX + 58} ${islandBottomY - 31} Q ${islandBottomX + 60} ${islandBottomY - 19} ${islandBottomX + 57} ${islandBottomY - 13}`}
              fill="none"
              stroke="#476B4C"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Path
              d={`M ${islandBottomX + 124} ${islandBottomY - 66} Q ${islandBottomX + 125} ${islandBottomY - 56} ${islandBottomX + 122} ${islandBottomY - 50}`}
              fill="none"
              stroke="#5A835F"
              strokeWidth={1.8}
              strokeLinecap="round"
            />

            {/* Isometric tile grid lines: only shown while placing or moving */}
            {isInteractiveMode
              ? ALL_TILES.map(({ x, y }) => {
                  const { sx, sy } = gridToScreen(x, y, TILE_WIDTH, TILE_HEIGHT);
                  const cx = ORIGIN_X + sx;
                  const cy = ORIGIN_Y + sy;
                  const isChecker = (x + y) % 2 === 0;
                  const occupant = placementByCoord.get(`${x},${y}`);
                  const isMovingTarget =
                    occupant && occupant.id === movingPlacementId;
                  const highlightAvailable = !occupant;

                  let fill = isChecker
                    ? 'rgba(229, 239, 224, 0.55)'
                    : 'rgba(219, 232, 212, 0.55)';
                  if (isMovingTarget) {
                    fill = 'rgba(239, 228, 200, 0.85)';
                  }

                  return (
                    <Polygon
                      key={`tile_${x}_${y}`}
                      points={diamondPoints(cx, cy)}
                      fill={fill}
                      stroke={
                        highlightAvailable
                          ? 'rgba(54, 94, 68, 0.32)'
                          : 'rgba(54, 94, 68, 0.16)'
                      }
                      strokeWidth={highlightAvailable ? 1.1 : 0.75}
                    />
                  );
                })
              : null}
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

          {/* Painter-Sorted Botanical Sprites & Pip Companion Layer */}
          <View style={styles.overlayLayer} pointerEvents="box-none">
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
                  pointerEvents="none"
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
                  <AnimatedPlacementSprite
                    assetKey={item.assetKey}
                    size={spriteSize}
                    isNew={!seenPlacementIdsRef.current?.has(placement.id)}
                    reducedMotion={Boolean(reducedMotion)}
                  />
                </View>
              );
            })}

            {/* Pip the Meadow Spirit perched on the clearing */}
            <View
              pointerEvents="box-none"
              style={[
                styles.companionAnchor,
                {
                  left: ORIGIN_X + pipScreen.sx - pipSize / 2,
                  top: ORIGIN_Y + pipScreen.sy - pipSize + 12,
                  width: pipSize,
                  height: pipSize,
                },
              ]}
            >
              <SanctuaryCompanion
                isSleeping={isSleeping || atmosphere.isNight}
                size={pipSize}
              />
            </View>
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
  },
  starfield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
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
  ambientMote: {
    position: 'absolute',
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
  companionAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
