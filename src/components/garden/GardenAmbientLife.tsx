import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  Polygon,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import type { FogLevel } from '@/domain/types';

export interface SatelliteIsletProps {
  left: number;
  top: number;
  variant: 'pine' | 'cairn';
  isNight: boolean;
  delayMs: number;
  reducedMotion: boolean;
}

export function SatelliteIslet({
  left,
  top,
  variant,
  isNight,
  delayMs,
  reducedMotion,
}: SatelliteIsletProps) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      floatY.value = 0;
      return;
    }
    floatY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 3100, easing: Easing.inOut(Easing.sin) }),
          withTiming(5, { duration: 3100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [delayMs, floatY, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const grassTop = isNight ? '#2F4838' : '#CFE0BF';
  const rockLeft = isNight ? '#444038' : '#A69076';
  const rockRight = isNight ? '#312E29' : '#85715A';

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.absolute, { left, top }, animStyle]}
    >
      <Svg width={92} height={86} viewBox="0 0 92 86">
        {/* Shadow */}
        <Ellipse cx={46} cy={76} rx={26} ry={6} fill="rgba(26, 34, 28, 0.14)" />
        {/* Underside rock cone */}
        <Polygon points="16,44 46,58 46,72 28,56" fill={rockLeft} />
        <Polygon points="46,58 76,44 64,56 46,72" fill={rockRight} />
        {/* Mossy diamond top */}
        <Polygon points="46,30 76,44 46,58 16,44" fill={grassTop} />

        {variant === 'pine' ? (
          <G>
            {/* Miniature cedar pine */}
            <Path d="M44 42 L44 34" stroke="#6E523A" strokeWidth={3} strokeLinecap="round" />
            <Polygon points="44,12 56,28 32,28" fill={isNight ? '#294934' : '#4C7A56'} />
            <Polygon points="44,20 58,36 30,36" fill={isNight ? '#233F2D' : '#3F6B49'} />
            <Ellipse cx={58} cy={45} rx={5.5} ry={3} fill={isNight ? '#4D554E' : '#B5B0A2'} />
          </G>
        ) : (
          <G>
            {/* Zen stone cairn & wild grass */}
            <Ellipse cx={45} cy={43} rx={9} ry={4.5} fill={isNight ? '#565F57' : '#C2BCB0'} />
            <Ellipse cx={45} cy={38} rx={6.5} ry={3.5} fill={isNight ? '#646E65' : '#D5D0C3'} />
            <Ellipse cx={45} cy={34} rx={4} ry={2.4} fill={isNight ? '#737E74' : '#E3DFD3'} />
            <Path d="M31 45 Q28 38 25 41" stroke="#5A875E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Path d="M60 44 Q64 37 66 41" stroke="#6A986E" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}

export interface WaterfallMistProps {
  left: number;
  top: number;
  reducedMotion: boolean;
}

export function WaterfallMist({ left, top, reducedMotion }: WaterfallMistProps) {
  const pulseA = useSharedValue(0);
  const pulseB = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulseA.value = 0.4;
      pulseB.value = 0.2;
      return;
    }
    pulseA.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    pulseB.value = withDelay(
      900,
      withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [pulseA, pulseB, reducedMotion]);

  const styleA = useAnimatedStyle(() => ({
    opacity: (1 - pulseA.value) * 0.65,
    transform: [
      { translateY: -pulseA.value * 14 },
      { scale: 0.7 + pulseA.value * 0.9 },
    ],
  }));

  const styleB = useAnimatedStyle(() => ({
    opacity: (1 - pulseB.value) * 0.55,
    transform: [
      { translateX: pulseB.value * 6 - 3 },
      { translateY: -pulseB.value * 12 },
      { scale: 0.6 + pulseB.value * 0.85 },
    ],
  }));

  return (
    <View pointerEvents="none" style={[styles.absolute, { left, top }]}>
      <Animated.View style={[styles.mistPuff, styleA]} />
      <Animated.View style={[styles.mistPuffSmall, styleB]} />
    </View>
  );
}

export interface MeadowButterflyProps {
  startX: number;
  startY: number;
  rangeX: number;
  rangeY: number;
  durationMs: number;
  delayMs: number;
  wingColor: string;
  isNight: boolean;
  reducedMotion: boolean;
}

export function MeadowButterfly({
  startX,
  startY,
  rangeX,
  rangeY,
  durationMs,
  delayMs,
  wingColor,
  isNight,
  reducedMotion,
}: MeadowButterflyProps) {
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const flap = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      posX.value = 0;
      posY.value = 0;
      flap.value = 1;
      return;
    }

    posX.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(rangeX, {
            duration: durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-rangeX * 0.65, {
            duration: Math.round(durationMs * 1.1),
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: Math.round(durationMs * 0.9),
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );

    posY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-rangeY, {
            duration: Math.round(durationMs * 0.55),
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(rangeY * 0.6, {
            duration: Math.round(durationMs * 0.6),
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: Math.round(durationMs * 0.55),
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );

    flap.value = withRepeat(
      withSequence(
        withTiming(0.28, { duration: 150, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [delayMs, durationMs, flap, posX, posY, rangeX, rangeY, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }],
  }));

  const wingStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: flap.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.absolute, { left: startX, top: startY }, containerStyle]}
    >
      {isNight ? (
        // Warm glowing evening firefly wisp
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Circle cx={9} cy={9} r={7} fill="#E8BF6E" opacity={0.25} />
          <Circle cx={9} cy={9} r={3} fill="#FFF2B8" />
        </Svg>
      ) : (
        <Animated.View style={wingStyle}>
          <Svg width={20} height={16} viewBox="0 0 20 16">
            <Path
              d="M10 8 C6 1, 1 3, 2 8 C1 12, 6 14, 10 9 Z"
              fill={wingColor}
            />
            <Path
              d="M10 8 C14 1, 19 3, 18 8 C19 12, 14 14, 10 9 Z"
              fill={wingColor}
            />
            <Path
              d="M10 5 L10 12"
              stroke="#4A3B31"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export interface TileTapRippleProps {
  x: number;
  y: number;
  reducedMotion: boolean;
}

export function TileTapRipple({ x, y, reducedMotion }: TileTapRippleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, reducedMotion]);

  const ringStyle = useAnimatedStyle(() => {
    const scale = 0.35 + progress.value * 1.15;
    const opacity = (1 - progress.value) * 0.65;
    return {
      opacity,
      transform: [{ scaleX: scale * 1.45 }, { scaleY: scale * 0.78 }],
    };
  });

  if (reducedMotion) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.tapRipple,
        {
          left: x - 18,
          top: y - 18,
        },
        ringStyle,
      ]}
    />
  );
}

export interface PondCausticsProps {
  left: number;
  top: number;
  reducedMotion: boolean;
}

const POND_CAUSTIC_WIDTH = 72;
const POND_CAUSTIC_HEIGHT = 32;

export function PondCaustics({
  left,
  top,
  reducedMotion,
}: PondCausticsProps) {
  const pulseA = useSharedValue(0);
  const pulseB = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulseA.value = 0.35;
      pulseB.value = 0.68;
      return;
    }
    pulseA.value = 0;
    pulseB.value = 0;
    pulseA.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    pulseB.value = withDelay(
      1300,
      withRepeat(
        withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [pulseA, pulseB, reducedMotion]);

  const rippleAStyle = useAnimatedStyle(() => {
    const p = pulseA.value;
    const opacity =
      p < 0.15 ? (p / 0.15) * 0.62 : (1 - (p - 0.15) / 0.85) * 0.62;
    return {
      opacity,
      transform: [{ scale: 0.26 + p * 0.74 }],
    };
  });

  const rippleBStyle = useAnimatedStyle(() => {
    const p = pulseB.value;
    const opacity =
      p < 0.15 ? (p / 0.15) * 0.52 : (1 - (p - 0.15) / 0.85) * 0.52;
    return {
      opacity,
      transform: [{ scale: 0.26 + p * 0.74 }],
    };
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.pondCausticsAnchor,
        {
          left: left - POND_CAUSTIC_WIDTH / 2,
          top: top - POND_CAUSTIC_HEIGHT / 2,
        },
      ]}
    >
      <Animated.View style={[styles.causticRingLayer, rippleAStyle]}>
        <Svg
          width={POND_CAUSTIC_WIDTH}
          height={POND_CAUSTIC_HEIGHT}
          viewBox={`0 0 ${POND_CAUSTIC_WIDTH} ${POND_CAUSTIC_HEIGHT}`}
        >
          <Ellipse
            cx={POND_CAUSTIC_WIDTH / 2}
            cy={POND_CAUSTIC_HEIGHT / 2}
            rx={32}
            ry={13.5}
            fill="none"
            stroke="rgba(242, 253, 255, 0.88)"
            strokeWidth={1.35}
          />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.causticRingLayer, rippleBStyle]}>
        <Svg
          width={POND_CAUSTIC_WIDTH}
          height={POND_CAUSTIC_HEIGHT}
          viewBox={`0 0 ${POND_CAUSTIC_WIDTH} ${POND_CAUSTIC_HEIGHT}`}
        >
          <Ellipse
            cx={POND_CAUSTIC_WIDTH / 2}
            cy={POND_CAUSTIC_HEIGHT / 2}
            rx={32}
            ry={13.5}
            fill="none"
            stroke="rgba(175, 232, 242, 0.82)"
            strokeWidth={1.15}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const VOLUMETRIC_FOG_OPACITY: Record<FogLevel, number> = {
  0: 0,
  1: 0.22,
  2: 0.48,
  3: 0.72,
};

interface FogWispSpec {
  id: string;
  topPct: `${number}%`;
  leftPct: `${number}%`;
  width: number;
  height: number;
  driftRange: number;
  durationMs: number;
  delayMs: number;
  wispOpacity: number;
}

const FOG_WISPS: readonly FogWispSpec[] = [
  {
    id: 'mist_upper',
    topPct: '14%',
    leftPct: '-16%',
    width: 340,
    height: 120,
    driftRange: 54,
    durationMs: 14000,
    delayMs: 0,
    wispOpacity: 0.72,
  },
  {
    id: 'mist_mid_left',
    topPct: '36%',
    leftPct: '18%',
    width: 380,
    height: 136,
    driftRange: -62,
    durationMs: 17000,
    delayMs: 900,
    wispOpacity: 0.82,
  },
  {
    id: 'mist_mid_right',
    topPct: '56%',
    leftPct: '-10%',
    width: 360,
    height: 128,
    driftRange: 48,
    durationMs: 15500,
    delayMs: 1800,
    wispOpacity: 0.76,
  },
  {
    id: 'mist_low',
    topPct: '74%',
    leftPct: '12%',
    width: 390,
    height: 132,
    driftRange: -46,
    durationMs: 18500,
    delayMs: 600,
    wispOpacity: 0.68,
  },
];

function FogMistWisp({
  spec,
  active,
  reducedMotion,
}: {
  spec: FogWispSpec;
  active: boolean;
  reducedMotion: boolean;
}) {
  const driftX = useSharedValue(0);

  useEffect(() => {
    if (!active || reducedMotion) {
      driftX.value = 0;
      return;
    }
    driftX.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(spec.driftRange, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(-spec.driftRange * 0.6, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: Math.round(spec.durationMs * 0.8),
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [active, driftX, reducedMotion, spec.delayMs, spec.driftRange, spec.durationMs]);

  const wispStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: driftX.value }],
  }));

  const gradId = `fogWispGrad_${spec.id}`;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.absolute,
        {
          top: spec.topPct,
          left: spec.leftPct,
          opacity: spec.wispOpacity,
        },
        wispStyle,
      ]}
    >
      <Svg
        width={spec.width}
        height={spec.height}
        viewBox="0 0 360 120"
      >
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FAF8F2" stopOpacity={0.92} />
            <Stop offset="55%" stopColor="#F2EFE6" stopOpacity={0.58} />
            <Stop offset="100%" stopColor="#ECEAE0" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={118} cy={66} rx={104} ry={40} fill={`url(#${gradId})`} />
        <Ellipse cx={208} cy={52} rx={116} ry={44} fill={`url(#${gradId})`} />
        <Ellipse cx={264} cy={70} rx={88} ry={34} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
}

export interface VolumetricFogLayerProps {
  fogLevel: FogLevel;
  reducedMotion: boolean;
}

export function VolumetricFogLayer({
  fogLevel,
  reducedMotion,
}: VolumetricFogLayerProps) {
  const layerOpacity = useSharedValue(VOLUMETRIC_FOG_OPACITY[fogLevel]);

  useEffect(() => {
    const target = VOLUMETRIC_FOG_OPACITY[fogLevel];
    if (reducedMotion) {
      layerOpacity.value = target;
    } else {
      layerOpacity.value = withTiming(target, {
        duration: 520,
        easing: Easing.inOut(Easing.quad),
      });
    }
  }, [fogLevel, layerOpacity, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: layerOpacity.value,
  }));

  const isActive = fogLevel > 0;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.volumetricFogContainer, containerStyle]}
    >
      {isActive ? (
        <>
          <View style={styles.volumetricFogTint} />
          {FOG_WISPS.map((wisp) => (
            <FogMistWisp
              key={wisp.id}
              spec={wisp}
              active={isActive}
              reducedMotion={reducedMotion}
            />
          ))}
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
  pondCausticsAnchor: {
    position: 'absolute',
    width: POND_CAUSTIC_WIDTH,
    height: POND_CAUSTIC_HEIGHT,
  },
  causticRingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: POND_CAUSTIC_WIDTH,
    height: POND_CAUSTIC_HEIGHT,
  },
  volumetricFogContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  volumetricFogTint: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(243, 240, 232, 0.56)',
  },
  mistPuff: {
    position: 'absolute',
    width: 22,
    height: 14,
    borderRadius: 11,
    backgroundColor: 'rgba(235, 248, 250, 0.75)',
  },
  mistPuffSmall: {
    position: 'absolute',
    left: 6,
    top: 4,
    width: 14,
    height: 10,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  tapRipple: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#5B8A67',
    backgroundColor: 'rgba(124, 166, 128, 0.14)',
  },
});
