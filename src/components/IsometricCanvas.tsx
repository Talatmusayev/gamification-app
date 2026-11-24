import { LocateFixed, Minus, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  MeadowButterfly,
  SatelliteIslet,
  TileTapRipple,
  WaterfallMist,
} from '@/components/garden/GardenAmbientLife';
import {
  GardenBackdrop,
  getTimeOfDayAtmosphere,
} from '@/components/garden/GardenBackdrop';
import { GardenIslandSvg } from '@/components/garden/GardenIslandSvg';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { SanctuaryCompanion } from '@/components/ui/SanctuaryCompanion';
import { getCatalogItemById } from '@/domain/catalog';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import { getGrowthScale, getGrowthStage } from '@/domain/growth';
import type { FogLevel, GardenPlacement } from '@/domain/types';
import { liquidGlassSurface } from '@/theme/glass';
import { motion, palette, radii, spacing, springs } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

const TILE_WIDTH = 72;
const TILE_HEIGHT = 38;
const CANVAS_WIDTH = GRID_SIZE * TILE_WIDTH + 164; // 740
const CANVAS_HEIGHT = GRID_SIZE * TILE_HEIGHT + 216; // 520
const ORIGIN_X = CANVAS_WIDTH / 2;
const ORIGIN_Y = 76;
const CLIFF_DEPTH = 42;

const DEFAULT_SCALE = 0.62;
const MIN_SCALE = 0.48;
const MAX_SCALE = 2.15;
const SOFT_PAN_BOUND = 230;
const RUBBER_BAND_SIZE = 88;

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
  selectedPlacementId?: string | null;
  recentlyWateredId?: string | null;
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

interface LeafParticleSpec {
  id: string;
  angleRad: number;
  distance: number;
  color: string;
  rotationDeg: number;
}

const LEAF_PARTICLES: readonly LeafParticleSpec[] = [
  { id: 'l1', angleRad: -Math.PI * 0.85, distance: 24, color: '#365E44', rotationDeg: -28 },
  { id: 'l2', angleRad: -Math.PI * 0.55, distance: 28, color: '#5A835F', rotationDeg: 14 },
  { id: 'l3', angleRad: -Math.PI * 0.2, distance: 26, color: '#7FA67E', rotationDeg: 36 },
  { id: 'l4', angleRad: Math.PI * 0.12, distance: 22, color: '#4D7452', rotationDeg: -18 },
  { id: 'l5', angleRad: Math.PI * 0.88, distance: 23, color: '#6E9671', rotationDeg: 24 },
];

interface WaterDropletSpec {
  id: string;
  dx: number;
  peakY: number;
  endY: number;
  size: number;
  color: string;
}

const WATER_DROPLETS: readonly WaterDropletSpec[] = [
  { id: 'd1', dx: -20, peakY: -22, endY: -5, size: 5, color: '#376675' },
  { id: 'd2', dx: -8, peakY: -28, endY: -9, size: 4.5, color: '#6397A8' },
  { id: 'd3', dx: 9, peakY: -26, endY: -7, size: 5, color: '#376675' },
  { id: 'd4', dx: 21, peakY: -19, endY: -4, size: 4.5, color: '#6397A8' },
];

interface ShimmerDotSpec {
  id: string;
  x: number;
  y: number;
  size: number;
  delayMs: number;
}

const BLOOM_SHIMMER_DOTS: readonly ShimmerDotSpec[] = [
  { id: 'b1', x: -16, y: -20, size: 4, delayMs: 0 },
  { id: 'b2', x: 17, y: -15, size: 3.5, delayMs: 550 },
  { id: 'b3', x: 2, y: -28, size: 4, delayMs: 1100 },
];

function FullBloomShimmer({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <View style={styles.effectCenter} pointerEvents="none">
      {BLOOM_SHIMMER_DOTS.map((dot) => (
        <BloomShimmerDot key={dot.id} spec={dot} reducedMotion={reducedMotion} />
      ))}
    </View>
  );
}

function BloomShimmerDot({
  spec,
  reducedMotion,
}: {
  spec: ShimmerDotSpec;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 0.65 : 0.3);
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.65;
      floatY.value = 0;
      return;
    }
    opacity.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(0.92, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.26, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    floatY.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(-3.5, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [floatY, opacity, reducedMotion, spec.delayMs]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: spec.x }, { translateY: spec.y + floatY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.shimmerDot,
        {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

function SoilBurstParticle({
  spec,
  reducedMotion,
}: {
  spec: LeafParticleSpec;
  reducedMotion: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const dist = spec.distance * progress.value;
    const tx = Math.cos(spec.angleRad) * dist;
    const ty = Math.sin(spec.angleRad) * dist - (1 - progress.value) * 4;
    const opacity = progress.value < 0.7 ? 0.95 : (1 - progress.value) / 0.3;
    const scale = 0.75 + 0.35 * (1 - progress.value);
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${spec.rotationDeg}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.leafParticle,
        { backgroundColor: spec.color },
        animatedStyle,
      ]}
    />
  );
}

function WaterSplashEffect({
  triggerKey,
  reducedMotion,
}: {
  triggerKey: number;
  reducedMotion: boolean;
}) {
  const rippleProgress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion || triggerKey === 0) {
      return;
    }
    rippleProgress.value = 0;
    rippleProgress.value = withTiming(1, {
      duration: 480,
      easing: Easing.out(Easing.cubic),
    });
  }, [reducedMotion, rippleProgress, triggerKey]);

  const outerRingStyle = useAnimatedStyle(() => {
    const scale = 0.35 + rippleProgress.value * 1.25;
    const opacity = (1 - rippleProgress.value) * 0.78;
    return {
      opacity,
      transform: [{ scaleX: scale * 1.3 }, { scaleY: scale * 0.7 }],
    };
  });

  const innerRingStyle = useAnimatedStyle(() => {
    const delayed = Math.max(0, (rippleProgress.value - 0.16) / 0.84);
    const scale = 0.25 + delayed * 1.05;
    const opacity = delayed > 0 ? (1 - delayed) * 0.58 : 0;
    return {
      opacity,
      transform: [{ scaleX: scale * 1.3 }, { scaleY: scale * 0.7 }],
    };
  });

  if (reducedMotion || triggerKey === 0) {
    return null;
  }

  return (
    <View style={styles.effectCenter} pointerEvents="none">
      <Animated.View style={[styles.dewRippleRing, outerRingStyle]} />
      <Animated.View style={[styles.dewRippleRingInner, innerRingStyle]} />
      {WATER_DROPLETS.map((droplet) => (
        <WaterDropletParticle
          key={`${droplet.id}_${triggerKey}`}
          spec={droplet}
        />
      ))}
    </View>
  );
}

function WaterDropletParticle({ spec }: { spec: WaterDropletSpec }) {
  const xProgress = useSharedValue(0);
  const yProgress = useSharedValue(0);

  useEffect(() => {
    xProgress.value = 0;
    yProgress.value = 0;
    xProgress.value = withTiming(1, {
      duration: 480,
      easing: Easing.out(Easing.quad),
    });
    yProgress.value = withSequence(
      withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) }),
      withTiming(0.2, { duration: 240, easing: Easing.in(Easing.quad) }),
    );
  }, [xProgress, yProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const tx = spec.dx * xProgress.value;
    const ty = spec.peakY * yProgress.value + spec.endY * xProgress.value;
    const opacity = xProgress.value < 0.72 ? 0.95 : (1 - xProgress.value) / 0.28;
    return {
      opacity,
      transform: [{ translateX: tx }, { translateY: ty }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.waterDroplet,
        {
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        animatedStyle,
      ]}
    />
  );
}

interface AnimatedPlacementSpriteProps {
  assetKey: string;
  size: number;
  category: 'plant' | 'decor' | 'critter';
  growthScale: number;
  growthStage: 1 | 2 | 3;
  swayPhaseOffset: number;
  isNew: boolean;
  isRecentlyWatered: boolean;
  lastWateredAt?: string;
  reducedMotion: boolean;
}

function AnimatedPlacementSprite({
  assetKey,
  size,
  category,
  growthScale,
  growthStage,
  swayPhaseOffset,
  isNew,
  isRecentlyWatered,
  lastWateredAt,
  reducedMotion,
}: AnimatedPlacementSpriteProps) {
  const isPlant = category === 'plant';
  const isCritter = category === 'critter';

  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const stageScale = useSharedValue(growthScale);
  const swayDeg = useSharedValue(0);
  const critterHopY = useSharedValue(0);
  const waterTriggerRef = useRef(0);
  const lastWateredRef = useRef<string | undefined>(lastWateredAt);

  if (
    isRecentlyWatered &&
    (lastWateredAt !== lastWateredRef.current || waterTriggerRef.current === 0)
  ) {
    waterTriggerRef.current += 1;
    lastWateredRef.current = lastWateredAt;
  }

  useEffect(() => {
    if (reducedMotion) {
      stageScale.value = growthScale;
      return;
    }
    stageScale.value = withSpring(growthScale, springs.pop);
  }, [growthScale, reducedMotion, stageScale]);

  useEffect(() => {
    if ((!isNew && !isRecentlyWatered) || reducedMotion) {
      return;
    }
    scaleX.value = withSequence(
      withTiming(1.16, { duration: 95, easing: Easing.out(Easing.quad) }),
      withSpring(1, springs.pop),
    );
    scaleY.value = withSequence(
      withTiming(0.84, { duration: 95, easing: Easing.out(Easing.quad) }),
      withSpring(1, springs.pop),
    );
  }, [isNew, isRecentlyWatered, lastWateredAt, reducedMotion, scaleX, scaleY]);

  useEffect(() => {
    if (!isPlant || reducedMotion) {
      swayDeg.value = 0;
      return;
    }
    swayDeg.value = withDelay(
      swayPhaseOffset * 380,
      withRepeat(
        withSequence(
          withTiming(2.8, {
            duration: 2700,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-2.8, {
            duration: 2700,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [isPlant, reducedMotion, swayDeg, swayPhaseOffset]);

  // Critters do a gentle periodic hop/bob so the garden feels alive
  useEffect(() => {
    if (!isCritter || reducedMotion) {
      critterHopY.value = 0;
      return;
    }
    critterHopY.value = withDelay(
      swayPhaseOffset * 520,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 2400 }),
          withTiming(-5, { duration: 260, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) }),
          withTiming(-2.5, { duration: 180, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [critterHopY, isCritter, reducedMotion, swayPhaseOffset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: critterHopY.value },
      { scale: stageScale.value },
      { scaleX: scaleX.value },
      { scaleY: scaleY.value },
      { rotate: `${swayDeg.value}deg` },
    ],
  }));

  return (
    <View style={styles.spriteStack} pointerEvents="none">
      {isPlant && growthStage === 3 ? (
        <FullBloomShimmer reducedMotion={reducedMotion} />
      ) : null}

      <Animated.View style={animatedStyle}>
        <GardenSprite assetKey={assetKey} size={size} growthStage={growthStage} />
      </Animated.View>

      {isNew && isPlant && !reducedMotion ? (
        <View style={styles.soilBurstAnchor} pointerEvents="none">
          {LEAF_PARTICLES.map((particle) => (
            <SoilBurstParticle
              key={particle.id}
              spec={particle}
              reducedMotion={reducedMotion}
            />
          ))}
        </View>
      ) : null}

      <WaterSplashEffect
        triggerKey={waterTriggerRef.current}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}

interface TapRippleState {
  id: number;
  x: number;
  y: number;
}

export function IsometricCanvas({
  placements,
  fogLevel,
  placingItemId = null,
  movingPlacementId = null,
  selectedPlacementId = null,
  recentlyWateredId = null,
  isSleeping = false,
  onTilePress,
  onPlacementPress,
}: IsometricCanvasProps) {
  const reducedMotion = useReducedMotion();
  const atmosphere = useMemo(
    () => getTimeOfDayAtmosphere(new Date().getHours()),
    [],
  );

  const [tapRipple, setTapRipple] = useState<TapRippleState | null>(null);
  const rippleCounterRef = useRef(0);
  const rippleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const scale = useSharedValue(DEFAULT_SCALE);
  const savedScale = useSharedValue(DEFAULT_SCALE);
  const islandFloatY = useSharedValue(0);

  const fogOpacity = useSharedValue(FOG_OPACITY_BY_LEVEL[fogLevel]);

  useEffect(() => {
    return () => {
      if (rippleTimerRef.current) {
        clearTimeout(rippleTimerRef.current);
      }
    };
  }, []);

  // Gentle floating diorama levitation
  useEffect(() => {
    if (reducedMotion) {
      islandFloatY.value = 0;
      return;
    }
    islandFloatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [islandFloatY, reducedMotion]);

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

  const handleZoomBy = (delta: number) => {
    hapticLight();
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value + delta));
    savedScale.value = next;
    scale.value = reducedMotion ? next : withSpring(next, springs.gentle);
  };

  const handleRecenter = () => {
    hapticLight();
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    savedScale.value = DEFAULT_SCALE;
    if (reducedMotion) {
      translateX.value = 0;
      translateY.value = 0;
      scale.value = DEFAULT_SCALE;
    } else {
      translateX.value = withSpring(0, springs.gentle);
      translateY.value = withSpring(0, springs.gentle);
      scale.value = withSpring(DEFAULT_SCALE, springs.gentle);
    }
  };

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
      { translateY: translateY.value + islandFloatY.value },
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

  const pipScreen = gridToScreen(3, 4, TILE_WIDTH, TILE_HEIGHT);
  const pipSize = 68;
  const spriteSize = 62;

  const triggerTileRipple = (cx: number, cy: number) => {
    rippleCounterRef.current += 1;
    setTapRipple({ id: rippleCounterRef.current, x: cx, y: cy });
    if (rippleTimerRef.current) {
      clearTimeout(rippleTimerRef.current);
    }
    rippleTimerRef.current = setTimeout(() => {
      setTapRipple(null);
    }, 560);
  };

  return (
    <View style={styles.viewport}>
      {/* Full-bleed atmospheric sky, drifting clouds, sunbeams, petals & fireflies */}
      <GardenBackdrop
        atmosphere={atmosphere}
        reducedMotion={Boolean(reducedMotion)}
      />

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.canvasStage, boardAnimatedStyle]}>
          {/* Floating companion satellite islets flanking the main meadow */}
          <SatelliteIslet
            left={76}
            top={38}
            variant="pine"
            isNight={atmosphere.isNight}
            delayMs={0}
            reducedMotion={Boolean(reducedMotion)}
          />
          <SatelliteIslet
            left={CANVAS_WIDTH - 178}
            top={CANVAS_HEIGHT - 134}
            variant="cairn"
            isNight={atmosphere.isNight}
            delayMs={1100}
            reducedMotion={Boolean(reducedMotion)}
          />

          {/* Sculpted Multi-Strata Floating Meadow Island SVG */}
          <GardenIslandSvg
            canvasWidth={CANVAS_WIDTH}
            canvasHeight={CANVAS_HEIGHT}
            originX={ORIGIN_X}
            originY={ORIGIN_Y}
            tileWidth={TILE_WIDTH}
            tileHeight={TILE_HEIGHT}
            cliffDepth={CLIFF_DEPTH}
            allTiles={ALL_TILES}
            placementByCoord={placementByCoord}
            isInteractiveMode={isInteractiveMode}
            movingPlacementId={movingPlacementId}
            isNight={atmosphere.isNight}
            isDusk={atmosphere.isDusk}
          />

          {/* Animated waterfall mist puffs at the right cliff waterfall base */}
          <WaterfallMist
            left={ORIGIN_X + 194}
            top={ORIGIN_Y + 266}
            reducedMotion={Boolean(reducedMotion)}
          />

          {/* Interactive Tap Targets Layer */}
          <View style={styles.overlayLayer}>
            {ALL_TILES.map(({ x, y }) => {
              const { sx, sy } = gridToScreen(x, y, TILE_WIDTH, TILE_HEIGHT);
              const cx = ORIGIN_X + sx;
              const cy = ORIGIN_Y + sy;
              const left = cx - TILE_WIDTH * 0.42;
              const top = cy - TILE_HEIGHT * 0.45;
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
                      triggerTileRipple(cx, cy);
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

          {/* Tactile meadow ripple when touching open grass */}
          {tapRipple ? (
            <TileTapRipple
              key={tapRipple.id}
              x={tapRipple.x}
              y={tapRipple.y}
              reducedMotion={Boolean(reducedMotion)}
            />
          ) : null}

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
              const isSelected =
                placement.id === movingPlacementId ||
                placement.id === selectedPlacementId;
              const isPlant = item.category === 'plant';
              const growthStage = getGrowthStage(placement, item);
              const growthScale = isPlant ? getGrowthScale(growthStage) : 1;
              const swayPhaseOffset = (placement.x * 3 + placement.y * 5) % 6;

              return (
                <View
                  key={placement.id}
                  pointerEvents="none"
                  style={[
                    styles.spriteAnchor,
                    {
                      left: ORIGIN_X + sx - spriteSize / 2,
                      top: ORIGIN_Y + sy - spriteSize + 14,
                      width: spriteSize,
                      height: spriteSize,
                    },
                    isSelected && styles.spriteSelected,
                  ]}
                >
                  <AnimatedPlacementSprite
                    assetKey={item.assetKey}
                    size={spriteSize}
                    category={item.category}
                    growthScale={growthScale}
                    growthStage={growthStage}
                    swayPhaseOffset={swayPhaseOffset}
                    isNew={!seenPlacementIdsRef.current?.has(placement.id)}
                    isRecentlyWatered={placement.id === recentlyWateredId}
                    lastWateredAt={placement.lastWateredAt}
                    reducedMotion={Boolean(reducedMotion)}
                  />
                </View>
              );
            })}

            {/* Pip the Meadow Spirit perched on the sunlit clearing */}
            <View
              pointerEvents="box-none"
              style={[
                styles.companionAnchor,
                {
                  left: ORIGIN_X + pipScreen.sx - pipSize / 2,
                  top: ORIGIN_Y + pipScreen.sy - pipSize + 16,
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

          {/* Ambient fluttering butterflies (day) / glowing firefly wisps (night) */}
          <MeadowButterfly
            startX={ORIGIN_X - 78}
            startY={ORIGIN_Y + 92}
            rangeX={95}
            rangeY={26}
            durationMs={5400}
            delayMs={0}
            wingColor="#F2C864"
            isNight={atmosphere.isNight}
            reducedMotion={Boolean(reducedMotion)}
          />
          <MeadowButterfly
            startX={ORIGIN_X + 68}
            startY={ORIGIN_Y + 132}
            rangeX={-82}
            rangeY={22}
            durationMs={6200}
            delayMs={1300}
            wingColor="#F1B7BC"
            isNight={atmosphere.isNight}
            reducedMotion={Boolean(reducedMotion)}
          />
          <MeadowButterfly
            startX={ORIGIN_X + 18}
            startY={ORIGIN_Y + 62}
            rangeX={56}
            rangeY={18}
            durationMs={4900}
            delayMs={2400}
            wingColor="#AED7E2"
            isNight={atmosphere.isNight}
            reducedMotion={Boolean(reducedMotion)}
          />
        </Animated.View>
      </GestureDetector>

      {/* Subtle Floating Camera Controls (Zoom In / Out / Re-center) */}
      <View style={styles.cameraControls}>
        <Pressable
          onPress={() => handleZoomBy(0.25)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Zoom in garden"
          style={({ pressed }) => [
            styles.cameraBtn,
            pressed && styles.cameraBtnPressed,
          ]}
        >
          <Plus size={16} strokeWidth={1.7} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.cameraDivider} />
        <Pressable
          onPress={() => handleZoomBy(-0.25)}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Zoom out garden"
          style={({ pressed }) => [
            styles.cameraBtn,
            pressed && styles.cameraBtnPressed,
          ]}
        >
          <Minus size={16} strokeWidth={1.7} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.cameraDivider} />
        <Pressable
          onPress={handleRecenter}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Recenter garden view"
          style={({ pressed }) => [
            styles.cameraBtn,
            pressed && styles.cameraBtnPressed,
          ]}
        >
          <LocateFixed size={15} strokeWidth={1.7} color={palette.accentMoss} />
        </Pressable>
      </View>

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
    borderRadius: 16,
  },
  spriteAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spriteStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soilBurstAnchor: {
    position: 'absolute',
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafParticle: {
    position: 'absolute',
    width: 6,
    height: 3.5,
    borderRadius: 2,
  },
  shimmerDot: {
    position: 'absolute',
    backgroundColor: '#E3B261',
  },
  dewRippleRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.6,
    borderColor: palette.accentDew,
    backgroundColor: 'rgba(55, 102, 117, 0.14)',
  },
  dewRippleRingInner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.3,
    borderColor: '#6397A8',
  },
  waterDroplet: {
    position: 'absolute',
  },
  companionAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  spriteSelected: {
    transform: [{ translateY: -5 }],
  },
  cameraControls: {
    ...liquidGlassSurface,
    position: 'absolute',
    right: spacing.lg,
    bottom: 136,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  cameraBtn: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnPressed: {
    backgroundColor: palette.surface,
  },
  cameraDivider: {
    height: 1,
    backgroundColor: palette.border,
    marginHorizontal: 8,
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
