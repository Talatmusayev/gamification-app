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
  GreenhouseWarmthWisps,
  MeadowButterfly,
  PondCaustics,
  PondShimmer,
  SatelliteIslet,
  TileTapRipple,
  VolumetricFogLayer,
  WaterfallMist,
} from '@/components/garden/GardenAmbientLife';
import {
  GardenBackdrop,
  getTimeOfDayAtmosphere,
} from '@/components/garden/GardenBackdrop';
import {
  GardenIslandSvg,
  getIslandLandmarkAnchors,
} from '@/components/garden/GardenIslandSvg';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { SanctuaryCompanion } from '@/components/ui/SanctuaryCompanion';
import { getCatalogItemById } from '@/domain/catalog';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import { getGrowthScale, getGrowthStage } from '@/domain/growth';
import {
  getAvailablePipWaypoints,
  getSanctuaryLandmarks,
} from '@/domain/landmarks';
import type { FogLevel, GardenPlacement } from '@/domain/types';
import { liquidGlassSurface } from '@/theme/glass';
import { palette, radii, spacing, springs } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

const TILE_WIDTH = 72;
const TILE_HEIGHT = 38;
const CANVAS_WIDTH = GRID_SIZE * TILE_WIDTH + 164; // 740
const CANVAS_HEIGHT = GRID_SIZE * TILE_HEIGHT + 216; // 520
const ORIGIN_X = CANVAS_WIDTH / 2;
const ORIGIN_Y = 76;
const CLIFF_DEPTH = 42;

const DEFAULT_SCALE = 0.86;
const MIN_SCALE = 0.54;
const MAX_SCALE = 2.35;
const SOFT_PAN_BOUND = 230;
const RUBBER_BAND_SIZE = 88;

const HERO_ITEM_SCALES: Record<string, number> = {
  glass_greenhouse: 1.42,
  cedar_gazebo: 1.38,
  koi_pond: 1.34,
  weeping_willow: 1.36,
  golden_ginkgo: 1.34,
  amber_maple: 1.34,
  sakura_sapling: 1.32,
  silver_olive: 1.28,
};

const LANDMARK_ANCHORS = getIslandLandmarkAnchors({
  originX: ORIGIN_X,
  originY: ORIGIN_Y,
  tileWidth: TILE_WIDTH,
  tileHeight: TILE_HEIGHT,
});

export interface IsometricCanvasProps {
  placements: GardenPlacement[];
  fogLevel: FogLevel;
  placingItemId?: string | null;
  movingPlacementId?: string | null;
  selectedPlacementId?: string | null;
  recentlyWateredId?: string | null;
  isSleeping?: boolean;
  daysTended?: number;
  harmonyDays?: number;
  hasPendingReveal?: boolean;
  onTilePress: (x: number, y: number) => void;
  onPlacementPress: (placement: GardenPlacement) => void;
  onPostboxPress?: () => void;
  onGreenhousePress?: () => void;
  onPierPress?: () => void;
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

interface GoldenPetalSpec {
  id: string;
  angleRad: number;
  distance: number;
  liftY: number;
  color: string;
  rotationDeg: number;
  size: number;
}

const GOLDEN_BLOOM_PETALS: readonly GoldenPetalSpec[] = [
  { id: 'gp1', angleRad: -Math.PI * 0.9, distance: 34, liftY: -18, color: '#E3B261', rotationDeg: -34, size: 7 },
  { id: 'gp2', angleRad: -Math.PI * 0.68, distance: 38, liftY: -26, color: '#F5D88E', rotationDeg: -14, size: 6.5 },
  { id: 'gp3', angleRad: -Math.PI * 0.45, distance: 40, liftY: -30, color: '#FAF2D8', rotationDeg: 10, size: 6 },
  { id: 'gp4', angleRad: -Math.PI * 0.24, distance: 37, liftY: -24, color: '#E3B261', rotationDeg: 28, size: 7 },
  { id: 'gp5', angleRad: -Math.PI * 0.05, distance: 32, liftY: -14, color: '#F5D88E', rotationDeg: 44, size: 6 },
  { id: 'gp6', angleRad: Math.PI * 0.18, distance: 28, liftY: -10, color: '#7FA67E', rotationDeg: -22, size: 5.5 },
  { id: 'gp7', angleRad: Math.PI * 0.82, distance: 28, liftY: -12, color: '#F5D88E', rotationDeg: 26, size: 6 },
  { id: 'gp8', angleRad: -Math.PI * 0.55, distance: 26, liftY: -34, color: '#E3B261', rotationDeg: 5, size: 7.5 },
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

function GoldenPetalBurstParticle({
  spec,
  reducedMotion,
}: {
  spec: GoldenPetalSpec;
  reducedMotion: boolean;
}) {
  const xProg = useSharedValue(0);
  const yProg = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    xProg.value = 0;
    yProg.value = 0;
    xProg.value = withTiming(1, {
      duration: 660,
      easing: Easing.out(Easing.cubic),
    });
    yProg.value = withSequence(
      withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }),
      withTiming(0.35, { duration: 340, easing: Easing.in(Easing.quad) }),
    );
  }, [reducedMotion, xProg, yProg]);

  const animatedStyle = useAnimatedStyle(() => {
    const dist = spec.distance * xProg.value;
    const tx = Math.cos(spec.angleRad) * dist;
    const ty = Math.sin(spec.angleRad) * dist + spec.liftY * yProg.value;
    const opacity = xProg.value < 0.65 ? 0.95 : (1 - xProg.value) / 0.35;
    const scale = 0.7 + 0.55 * (1 - xProg.value * 0.5);
    return {
      opacity,
      transform: [
        { translateX: tx },
        { translateY: ty },
        { rotate: `${spec.rotationDeg + xProg.value * 45}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.goldenPetal,
        {
          width: spec.size,
          height: spec.size * 0.62,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        animatedStyle,
      ]}
    />
  );
}

function FullBloomCelebration({
  triggerKey,
  reducedMotion,
}: {
  triggerKey: number;
  reducedMotion: boolean;
}) {
  const haloProgress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion || triggerKey === 0) {
      return;
    }
    haloProgress.value = 0;
    haloProgress.value = withTiming(1, {
      duration: 680,
      easing: Easing.out(Easing.cubic),
    });
  }, [haloProgress, reducedMotion, triggerKey]);

  const haloStyle = useAnimatedStyle(() => {
    const scale = 0.45 + haloProgress.value * 1.45;
    const opacity = (1 - haloProgress.value) * 0.85;
    return {
      opacity,
      transform: [{ scaleX: scale * 1.3 }, { scaleY: scale * 0.75 }],
    };
  });

  if (reducedMotion || triggerKey === 0) {
    return null;
  }

  return (
    <View style={styles.effectCenter} pointerEvents="none">
      <Animated.View style={[styles.bloomHaloRing, haloStyle]} />
      {GOLDEN_BLOOM_PETALS.map((petal) => (
        <GoldenPetalBurstParticle
          key={`${petal.id}_${triggerKey}`}
          spec={petal}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
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
  const bloomTriggerRef = useRef(0);
  const lastWateredRef = useRef<string | undefined>(lastWateredAt);
  const prevStageRef = useRef<1 | 2 | 3>(growthStage);

  if (
    isRecentlyWatered &&
    (lastWateredAt !== lastWateredRef.current || waterTriggerRef.current === 0)
  ) {
    waterTriggerRef.current += 1;
    lastWateredRef.current = lastWateredAt;
    if (isPlant && growthStage === 3) {
      bloomTriggerRef.current += 1;
    }
  } else if (isPlant && prevStageRef.current < 3 && growthStage === 3) {
    bloomTriggerRef.current += 1;
  }
  prevStageRef.current = growthStage;

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
    const peakScaleX = isPlant && growthStage === 3 && isRecentlyWatered ? 1.22 : 1.16;
    const peakScaleY = isPlant && growthStage === 3 && isRecentlyWatered ? 0.80 : 0.84;
    scaleX.value = withSequence(
      withTiming(peakScaleX, { duration: 95, easing: Easing.out(Easing.quad) }),
      withSpring(1, springs.pop),
    );
    scaleY.value = withSequence(
      withTiming(peakScaleY, { duration: 95, easing: Easing.out(Easing.quad) }),
      withSpring(1, springs.pop),
    );
  }, [growthStage, isNew, isPlant, isRecentlyWatered, lastWateredAt, reducedMotion, scaleX, scaleY]);

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

      <FullBloomCelebration
        triggerKey={bloomTriggerRef.current}
        reducedMotion={reducedMotion}
      />
    </View>
  );
}

interface LandmarkHotspotProps {
  centerX: number;
  centerY: number;
  size: number;
  accessibilityLabel: string;
  reducedMotion: boolean;
  onPress: () => void;
}

function LandmarkHotspot({
  centerX,
  centerY,
  size,
  accessibilityLabel,
  reducedMotion,
  onPress,
}: LandmarkHotspotProps) {
  const pulseScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handlePress = () => {
    hapticLight();
    if (!reducedMotion) {
      pulseScale.value = withSequence(
        withTiming(0.92, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(1, springs.pop),
      );
    }
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.landmarkHotspotWrap,
        {
          left: centerX - size / 2,
          top: centerY - size / 2,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={handlePress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={styles.landmarkHotspotButton}
      />
    </Animated.View>
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
  daysTended = 0,
  harmonyDays = 0,
  hasPendingReveal = false,
  onTilePress,
  onPlacementPress,
  onPostboxPress,
  onGreenhousePress,
  onPierPress,
}: IsometricCanvasProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const atmosphere = useMemo(
    () => getTimeOfDayAtmosphere(new Date().getHours()),
    [],
  );

  const landmarks = useMemo(
    () =>
      getSanctuaryLandmarks({
        daysTended,
        harmonyDays,
        placementCount: placements.length,
      }),
    [daysTended, harmonyDays, placements.length],
  );

  const availableWaypoints = useMemo(
    () => getAvailablePipWaypoints(placements),
    [placements],
  );

  const [waypointIndex, setWaypointIndex] = useState(0);
  const [pipHopTrigger, setPipHopTrigger] = useState(0);
  const [pipHopDir, setPipHopDir] = useState<-1 | 1>(1);
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

  const isInteractiveMode = Boolean(placingItemId || movingPlacementId);
  const pipSize = 68;
  const spriteSize = 62;

  const pipCoord =
    availableWaypoints[waypointIndex % availableWaypoints.length] ?? {
      x: 3,
      y: 4,
    };
  const pipScreen = gridToScreen(
    pipCoord.x,
    pipCoord.y,
    TILE_WIDTH,
    TILE_HEIGHT,
  );
  const pipTargetLeft = ORIGIN_X + pipScreen.sx - pipSize / 2;
  const pipTargetTop = ORIGIN_Y + pipScreen.sy - pipSize + 16;

  const pipLeft = useSharedValue(pipTargetLeft);
  const pipTop = useSharedValue(pipTargetTop);
  const pipArcLiftY = useSharedValue(0);
  const pipLandSquashX = useSharedValue(1);
  const pipLandSquashY = useSharedValue(1);
  const prevPipTargetLeftRef = useRef(pipTargetLeft);

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

  // Wandering Pip patrol interval (disabled when sleeping, night, reducedMotion, or placing/moving)
  const canPipWander =
    !reducedMotion &&
    !isSleeping &&
    !atmosphere.isNight &&
    !isInteractiveMode &&
    availableWaypoints.length > 1;

  useEffect(() => {
    if (!canPipWander) {
      return;
    }
    const intervalId = setInterval(() => {
      setWaypointIndex((prev) => (prev + 1) % availableWaypoints.length);
    }, 4800);
    return () => {
      clearInterval(intervalId);
    };
  }, [availableWaypoints.length, canPipWander]);

  // Moving in arcs (/ux-motion #6): curved arc hops between waypoints + squash on landing
  useEffect(() => {
    if (reducedMotion) {
      pipLeft.value = pipTargetLeft;
      pipTop.value = pipTargetTop;
      pipArcLiftY.value = 0;
      pipLandSquashX.value = 1;
      pipLandSquashY.value = 1;
      prevPipTargetLeftRef.current = pipTargetLeft;
      return;
    }

    const deltaX = pipTargetLeft - prevPipTargetLeftRef.current;
    if (Math.abs(deltaX) < 0.5 && Math.abs(pipTop.value - pipTargetTop) < 0.5) {
      return;
    }

    const nextDir: -1 | 1 = deltaX >= 0 ? 1 : -1;
    prevPipTargetLeftRef.current = pipTargetLeft;
    setPipHopDir(nextDir);
    setPipHopTrigger((prev) => prev + 1);

    // Distinct X & Y easings create a natural curved arc trajectory across tiles
    pipLeft.value = withTiming(pipTargetLeft, {
      duration: 640,
      easing: Easing.out(Easing.cubic),
    });
    pipTop.value = withTiming(pipTargetTop, {
      duration: 640,
      easing: Easing.inOut(Easing.quad),
    });
    pipArcLiftY.value = withSequence(
      withTiming(-13, { duration: 290, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }),
    );
    pipLandSquashX.value = withDelay(
      580,
      withSequence(
        withTiming(1.1, { duration: 85, easing: Easing.out(Easing.quad) }),
        withSpring(1, springs.pop),
      ),
    );
    pipLandSquashY.value = withDelay(
      580,
      withSequence(
        withTiming(0.9, { duration: 85, easing: Easing.out(Easing.quad) }),
        withSpring(1, springs.pop),
      ),
    );
  }, [
    pipArcLiftY,
    pipLandSquashX,
    pipLandSquashY,
    pipLeft,
    pipTargetLeft,
    pipTargetTop,
    pipTop,
    reducedMotion,
  ]);

  const pipAnimatedStyle = useAnimatedStyle(() => ({
    left: pipLeft.value,
    top: pipTop.value,
    transform: [
      { translateY: pipArcLiftY.value },
      { scaleX: pipLandSquashX.value },
      { scaleY: pipLandSquashY.value },
    ],
  }));

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

  const boardAnimatedStyle = useAnimatedStyle(() => {
    if (reducedMotion) {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value + islandFloatY.value },
          { scale: scale.value },
        ],
      };
    }
    const rotateYDeg = -(translateX.value / SOFT_PAN_BOUND) * 4.5;
    const rotateXDeg = (translateY.value / SOFT_PAN_BOUND) * 3.5;
    return {
      transform: [
        { perspective: 900 },
        { translateX: translateX.value },
        { translateY: translateY.value + islandFloatY.value },
        { rotateX: `${rotateXDeg}deg` },
        { rotateY: `${rotateYDeg}deg` },
        { scale: scale.value },
      ],
    };
  });

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
      {/* Full-bleed atmospheric sky, drifting clouds, distant valley hills, sunbeams & stars */}
      <GardenBackdrop
        atmosphere={atmosphere}
        reducedMotion={reducedMotion}
      />

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.canvasStage, boardAnimatedStyle]}>
          {/* Floating companion satellite islets flanking the main meadow */}
          <SatelliteIslet
            left={72}
            top={36}
            variant="pine"
            isNight={atmosphere.isNight}
            delayMs={0}
            reducedMotion={reducedMotion}
          />
          <SatelliteIslet
            left={CANVAS_WIDTH - 172}
            top={CANVAS_HEIGHT - 132}
            variant="cairn"
            isNight={atmosphere.isNight}
            delayMs={1100}
            reducedMotion={reducedMotion}
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
            landmarks={landmarks}
            hasPendingReveal={hasPendingReveal}
          />

          {/* Animated concentric water caustics & drifting golden koi over the lotus pond */}
          <PondCaustics
            left={LANDMARK_ANCHORS.pond.x}
            top={LANDMARK_ANCHORS.pond.y + 1}
            reducedMotion={reducedMotion}
          />
          <PondShimmer
            left={LANDMARK_ANCHORS.pond.x}
            top={LANDMARK_ANCHORS.pond.y}
            isNight={atmosphere.isNight}
            reducedMotion={reducedMotion}
          />

          {/* Gentle warmth wisps above restored / tended conservatory */}
          <GreenhouseWarmthWisps
            left={LANDMARK_ANCHORS.greenhouseVent.x}
            top={LANDMARK_ANCHORS.greenhouseVent.y}
            active={landmarks.greenhouseStage !== 'overgrown'}
            isWarmTone={atmosphere.isNight || atmosphere.isDusk}
            reducedMotion={reducedMotion}
          />

          {/* Animated waterfall mist puffs at the right cliff waterfall base */}
          <WaterfallMist
            left={LANDMARK_ANCHORS.waterfallMist.x}
            top={LANDMARK_ANCHORS.waterfallMist.y}
            reducedMotion={reducedMotion}
          />

          {/* Interactive Tap Targets Layer (64 buildable tiles + 3 scenic landmark hotspots) */}
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
                  hitSlop={8}
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

            {!isInteractiveMode ? (
              <>
                <LandmarkHotspot
                  centerX={LANDMARK_ANCHORS.postbox.x}
                  centerY={LANDMARK_ANCHORS.postbox.y - 10}
                  size={48}
                  accessibilityLabel={
                    hasPendingReveal
                      ? 'Keeper postbox. New morning reveal ready.'
                      : 'Keeper postbox'
                  }
                  reducedMotion={reducedMotion}
                  onPress={() => {
                    triggerTileRipple(
                      LANDMARK_ANCHORS.postbox.x,
                      LANDMARK_ANCHORS.postbox.y + 2,
                    );
                    onPostboxPress?.();
                  }}
                />
                <LandmarkHotspot
                  centerX={LANDMARK_ANCHORS.greenhouse.x}
                  centerY={LANDMARK_ANCHORS.greenhouse.y - 8}
                  size={52}
                  accessibilityLabel={`Corner conservatory, ${landmarks.greenhouseStage}`}
                  reducedMotion={reducedMotion}
                  onPress={() => {
                    triggerTileRipple(
                      LANDMARK_ANCHORS.greenhouse.x,
                      LANDMARK_ANCHORS.greenhouse.y + 8,
                    );
                    onGreenhousePress?.();
                  }}
                />
                <LandmarkHotspot
                  centerX={LANDMARK_ANCHORS.pier.x + 8}
                  centerY={LANDMARK_ANCHORS.pier.y - 6}
                  size={48}
                  accessibilityLabel={`Brookside pier, ${landmarks.pierStage}`}
                  reducedMotion={reducedMotion}
                  onPress={() => {
                    triggerTileRipple(
                      LANDMARK_ANCHORS.pier.x,
                      LANDMARK_ANCHORS.pier.y,
                    );
                    onPierPress?.();
                  }}
                />
              </>
            ) : null}
          </View>

          {/* Tactile meadow ripple when touching open grass or landmarks */}
          {tapRipple ? (
            <TileTapRipple
              key={tapRipple.id}
              x={tapRipple.x}
              y={tapRipple.y}
              reducedMotion={reducedMotion}
            />
          ) : null}

          {/* Painter-Sorted Botanical Sprites & Wandering Pip Companion Layer */}
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
              const heroMultiplier = HERO_ITEM_SCALES[item.assetKey] ?? 1;
              const resolvedSize = Math.round(spriteSize * heroMultiplier);
              const swayPhaseOffset = (placement.x * 3 + placement.y * 5) % 6;
              const isHeroScale = heroMultiplier > 1;
              const baseAnchorTop =
                ORIGIN_Y + sy - Math.round(0.84 * resolvedSize) + 4;

              return (
                <View
                  key={placement.id}
                  pointerEvents="none"
                  style={[
                    styles.spriteAnchor,
                    {
                      left: ORIGIN_X + sx - resolvedSize / 2,
                      top: baseAnchorTop,
                      width: resolvedSize,
                      height: resolvedSize,
                      zIndex: placement.x + placement.y + 1,
                    },
                    isSelected && styles.spriteSelected,
                  ]}
                >
                  {isHeroScale ? (
                    <View
                      style={[
                        styles.heroCastShadow,
                        {
                          width: Math.round(resolvedSize * 0.62),
                          height: Math.round(resolvedSize * 0.24),
                        },
                      ]}
                    />
                  ) : null}
                  <AnimatedPlacementSprite
                    assetKey={item.assetKey}
                    size={resolvedSize}
                    category={item.category}
                    growthScale={growthScale}
                    growthStage={growthStage}
                    swayPhaseOffset={swayPhaseOffset}
                    isNew={!seenPlacementIdsRef.current?.has(placement.id)}
                    isRecentlyWatered={placement.id === recentlyWateredId}
                    lastWateredAt={placement.lastWateredAt}
                    reducedMotion={reducedMotion}
                  />
                </View>
              );
            })}

            {/* Pip the Meadow Spirit gently wandering across open meadow waypoints */}
            <Animated.View
              key="pip_companion"
              pointerEvents="box-none"
              style={[
                styles.companionAnchor,
                {
                  width: pipSize,
                  height: pipSize,
                  zIndex: pipCoord.x + pipCoord.y + 2,
                },
                pipAnimatedStyle,
              ]}
            >
              <SanctuaryCompanion
                isSleeping={isSleeping || atmosphere.isNight}
                size={pipSize}
                hasPendingReveal={hasPendingReveal}
                fogLevel={fogLevel}
                hopTrigger={pipHopTrigger}
                hopDirection={pipHopDir}
              />
            </Animated.View>
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
            reducedMotion={reducedMotion}
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
            reducedMotion={reducedMotion}
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
            reducedMotion={reducedMotion}
          />
        </Animated.View>
      </GestureDetector>

      {/* Subtle Floating Camera Controls (Zoom In / Out / Re-center — 44x44 Fitts's Law) */}
      <View style={styles.cameraControls}>
        <Pressable
          onPress={() => handleZoomBy(0.25)}
          hitSlop={8}
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
          hitSlop={8}
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
          hitSlop={8}
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

      {/* Compassionate Volumetric Morning Fog Veil */}
      <VolumetricFogLayer
        fogLevel={fogLevel}
        reducedMotion={reducedMotion}
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
  landmarkHotspotWrap: {
    position: 'absolute',
    borderRadius: 26,
  },
  landmarkHotspotButton: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  spriteAnchor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCastShadow: {
    position: 'absolute',
    bottom: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(28, 42, 30, 0.16)',
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
  goldenPetal: {
    position: 'absolute',
  },
  bloomHaloRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.8,
    borderColor: '#E3B261',
    backgroundColor: 'rgba(227, 178, 97, 0.18)',
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
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
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
});
