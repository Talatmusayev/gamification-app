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
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { nightPalette } from '@/theme/tokens';

export interface TimeOfDayAtmosphere {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  cloudColor: string;
  cloudOpacity: number;
  sunbeamColor: string;
  sunbeamOpacity: number;
  isNight: boolean;
  isDusk: boolean;
}

export function getTimeOfDayAtmosphere(hour: number): TimeOfDayAtmosphere {
  if (hour >= 5 && hour < 8) {
    // Dawn — soft rose-apricot horizon fading into morning mist
    return {
      skyTop: '#EAE8F0',
      skyMid: '#F5ECE5',
      skyBottom: '#FBF2E4',
      cloudColor: '#FFF7F0',
      cloudOpacity: 0.72,
      sunbeamColor: '#FFE5BD',
      sunbeamOpacity: 0.24,
      isNight: false,
      isDusk: false,
    };
  }
  if (hour >= 8 && hour < 12) {
    // Morning — fresh botanical sage-sky & warm cream light
    return {
      skyTop: '#DCEAE7',
      skyMid: '#ECF3EC',
      skyBottom: '#F7F6EE',
      cloudColor: '#FFFFFF',
      cloudOpacity: 0.78,
      sunbeamColor: '#FFF5D6',
      sunbeamOpacity: 0.26,
      isNight: false,
      isDusk: false,
    };
  }
  if (hour >= 12 && hour < 17) {
    // Afternoon — sunlit linen sky with soft golden warmth
    return {
      skyTop: '#DDE9E2',
      skyMid: '#EFF2E8',
      skyBottom: '#FAF5E8',
      cloudColor: '#FFFDF8',
      cloudOpacity: 0.75,
      sunbeamColor: '#FFF1C7',
      sunbeamOpacity: 0.28,
      isNight: false,
      isDusk: false,
    };
  }
  if (hour >= 17 && hour < 20) {
    // Dusk — warm terracotta-amber twilight
    return {
      skyTop: '#CFC6D0',
      skyMid: '#E9D2BE',
      skyBottom: '#F6DFC2',
      cloudColor: '#FDE9D2',
      cloudOpacity: 0.65,
      sunbeamColor: '#F4BC78',
      sunbeamOpacity: 0.22,
      isNight: false,
      isDusk: true,
    };
  }
  // Night — deep serene forest sky
  return {
    skyTop: '#0E1412',
    skyMid: nightPalette.bg,
    skyBottom: '#1C2621',
    cloudColor: '#2B3A32',
    cloudOpacity: 0.35,
    sunbeamColor: '#E3B261',
    sunbeamOpacity: 0,
    isNight: true,
    isDusk: false,
  };
}

interface CloudSpec {
  id: string;
  topPct: number;
  startX: number;
  driftRange: number;
  scale: number;
  durationMs: number;
  delayMs: number;
  opacityScale: number;
}

const CLOUDS: readonly CloudSpec[] = [
  { id: 'c1', topPct: 7, startX: -45, driftRange: 95, scale: 1.05, durationMs: 22000, delayMs: 0, opacityScale: 0.9 },
  { id: 'c2', topPct: 16, startX: 190, driftRange: 80, scale: 0.78, durationMs: 28000, delayMs: 1800, opacityScale: 0.72 },
  { id: 'c3', topPct: 26, startX: 25, driftRange: 70, scale: 0.65, durationMs: 32000, delayMs: 3400, opacityScale: 0.55 },
  { id: 'c4', topPct: 12, startX: 300, driftRange: 85, scale: 0.88, durationMs: 25000, delayMs: 900, opacityScale: 0.68 },
];

interface AmbientMoteSpec {
  id: string;
  leftPct: number;
  topPct: number;
  size: number;
  driftX: number;
  driftY: number;
  durationMs: number;
  delayMs: number;
  kind: 'mote' | 'petal';
}

const AMBIENT_PARTICLES: readonly AmbientMoteSpec[] = [
  { id: 'm1', leftPct: 12, topPct: 20, size: 4, driftX: 16, driftY: -22, durationMs: 4600, delayMs: 0, kind: 'mote' },
  { id: 'm2', leftPct: 82, topPct: 18, size: 3.5, driftX: -14, driftY: -18, durationMs: 5200, delayMs: 400, kind: 'mote' },
  { id: 'm3', leftPct: 28, topPct: 44, size: 5, driftX: 18, driftY: -26, durationMs: 5600, delayMs: 800, kind: 'mote' },
  { id: 'm4', leftPct: 72, topPct: 40, size: 4, driftX: -12, driftY: -20, durationMs: 4900, delayMs: 1200, kind: 'mote' },
  { id: 'm5', leftPct: 18, topPct: 68, size: 4.5, driftX: 12, driftY: -24, durationMs: 5400, delayMs: 600, kind: 'mote' },
  { id: 'm6', leftPct: 86, topPct: 62, size: 4.5, driftX: -15, driftY: -22, durationMs: 4800, delayMs: 1400, kind: 'mote' },
  { id: 'm7', leftPct: 48, topPct: 26, size: 3.5, driftX: 10, driftY: -18, durationMs: 4500, delayMs: 300, kind: 'mote' },
  { id: 'm8', leftPct: 58, topPct: 74, size: 4, driftX: -12, driftY: -24, durationMs: 5100, delayMs: 950, kind: 'mote' },
  // Gentle drifting blossom petals
  { id: 'p1', leftPct: 22, topPct: 14, size: 6, driftX: 46, driftY: 58, durationMs: 8200, delayMs: 200, kind: 'petal' },
  { id: 'p2', leftPct: 66, topPct: 10, size: 5.5, driftX: 38, driftY: 64, durationMs: 9400, delayMs: 2200, kind: 'petal' },
  { id: 'p3', leftPct: 42, topPct: 18, size: 5, driftX: 52, driftY: 54, durationMs: 8800, delayMs: 4400, kind: 'petal' },
  { id: 'p4', leftPct: 78, topPct: 28, size: 5.5, driftX: 34, driftY: 60, durationMs: 9000, delayMs: 1500, kind: 'petal' },
];

const STAR_COORDS: readonly { cx: number; cy: number; r: number; opacity: number; delayMs: number }[] = [
  { cx: 42, cy: 32, r: 1.3, opacity: 0.65, delayMs: 0 },
  { cx: 112, cy: 20, r: 1.7, opacity: 0.8, delayMs: 450 },
  { cx: 188, cy: 48, r: 1.1, opacity: 0.55, delayMs: 900 },
  { cx: 256, cy: 26, r: 1.6, opacity: 0.75, delayMs: 200 },
  { cx: 318, cy: 56, r: 1.2, opacity: 0.6, delayMs: 1100 },
  { cx: 76, cy: 84, r: 1.1, opacity: 0.45, delayMs: 700 },
  { cx: 354, cy: 92, r: 1.4, opacity: 0.65, delayMs: 350 },
  { cx: 404, cy: 30, r: 1.5, opacity: 0.7, delayMs: 1400 },
  { cx: 150, cy: 78, r: 1.0, opacity: 0.5, delayMs: 600 },
  { cx: 286, cy: 86, r: 1.2, opacity: 0.55, delayMs: 1050 },
];

function DriftingCloud({
  spec,
  color,
  baseOpacity,
  reducedMotion,
}: {
  spec: CloudSpec;
  color: string;
  baseOpacity: number;
  reducedMotion: boolean;
}) {
  const translateX = useSharedValue(spec.startX);

  useEffect(() => {
    if (reducedMotion) {
      translateX.value = spec.startX;
      return;
    }
    translateX.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(spec.startX + spec.driftRange, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(spec.startX, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [reducedMotion, spec, translateX]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: spec.scale }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.cloudAnchor,
        { top: `${spec.topPct}%`, opacity: baseOpacity * spec.opacityScale },
        animStyle,
      ]}
    >
      <Svg width={140} height={48} viewBox="0 0 140 48">
        <Path
          d="M22 38 C10 38, 6 28, 15 23 C17 13, 30 9, 41 14 C48 5, 68 4, 78 13 C90 9, 106 14, 108 24 C120 24, 126 35, 114 38 Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

function AmbientParticle({
  spec,
  isFirefly,
  isNight,
  reducedMotion,
}: {
  spec: AmbientMoteSpec;
  isFirefly: boolean;
  isNight: boolean;
  reducedMotion: boolean;
}) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const opacity = useSharedValue(isFirefly ? 0.35 : 0.45);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      offsetX.value = 0;
      offsetY.value = 0;
      opacity.value = isFirefly ? 0.55 : 0.45;
      rotate.value = 0;
      return;
    }

    if (spec.kind === 'petal' && !isNight) {
      offsetX.value = withDelay(
        spec.delayMs,
        withRepeat(
          withTiming(spec.driftX, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          false,
        ),
      );
      offsetY.value = withDelay(
        spec.delayMs,
        withRepeat(
          withTiming(spec.driftY, {
            duration: spec.durationMs,
            easing: Easing.linear,
          }),
          -1,
          false,
        ),
      );
      rotate.value = withDelay(
        spec.delayMs,
        withRepeat(
          withTiming(180, {
            duration: spec.durationMs,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          false,
        ),
      );
      opacity.value = withDelay(
        spec.delayMs,
        withRepeat(
          withSequence(
            withTiming(0.75, { duration: Math.round(spec.durationMs * 0.25) }),
            withTiming(0.65, { duration: Math.round(spec.durationMs * 0.5) }),
            withTiming(0, { duration: Math.round(spec.durationMs * 0.25) }),
          ),
          -1,
          false,
        ),
      );
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
          withTiming(isFirefly ? 0.95 : 0.72, {
            duration: Math.round(spec.durationMs * 0.55),
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(isFirefly ? 0.18 : 0.22, {
            duration: Math.round(spec.durationMs * 0.45),
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [isFirefly, isNight, offsetX, offsetY, opacity, reducedMotion, rotate, spec]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const isPetal = spec.kind === 'petal' && !isNight;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ambientMote,
        {
          left: `${spec.leftPct}%`,
          top: `${spec.topPct}%`,
          width: isPetal ? spec.size * 1.45 : spec.size,
          height: isPetal ? spec.size * 0.85 : spec.size,
          borderRadius: spec.size,
          backgroundColor: isPetal
            ? '#F6D3D1'
            : isFirefly
              ? '#E8BF6E'
              : '#FFF7DA',
        },
        animatedStyle,
      ]}
    />
  );
}

export interface GardenBackdropProps {
  atmosphere: TimeOfDayAtmosphere;
  reducedMotion: boolean;
}

export function GardenBackdrop({
  atmosphere,
  reducedMotion,
}: GardenBackdropProps) {
  const beamPulse = useSharedValue(atmosphere.sunbeamOpacity);

  useEffect(() => {
    if (reducedMotion || atmosphere.sunbeamOpacity <= 0) {
      beamPulse.value = atmosphere.sunbeamOpacity;
      return;
    }
    beamPulse.value = withRepeat(
      withSequence(
        withTiming(atmosphere.sunbeamOpacity * 1.35, {
          duration: 4600,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(atmosphere.sunbeamOpacity * 0.75, {
          duration: 4600,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [atmosphere.sunbeamOpacity, beamPulse, reducedMotion]);

  const beamStyle = useAnimatedStyle(() => ({
    opacity: beamPulse.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Rich multi-stop atmospheric sky gradient */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 400 700"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={atmosphere.skyTop} />
            <Stop offset="52%" stopColor={atmosphere.skyMid} />
            <Stop offset="100%" stopColor={atmosphere.skyBottom} />
          </LinearGradient>
          <RadialGradient id="sunGlow" cx="78%" cy="14%" r="48%">
            <Stop
              offset="0%"
              stopColor={atmosphere.isNight ? '#F4E8C6' : '#FFF6DC'}
              stopOpacity={atmosphere.isNight ? 0.14 : 0.65}
            />
            <Stop
              offset="60%"
              stopColor={atmosphere.isNight ? '#E3B261' : '#FFF1C8'}
              stopOpacity={atmosphere.isNight ? 0.04 : 0.18}
            />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={400} height={700} fill="url(#skyGradient)" />
        <Rect x={0} y={0} width={400} height={700} fill="url(#sunGlow)" />
      </Svg>

      {/* Night starfield + crescent moon */}
      {atmosphere.isNight ? (
        <Svg
          pointerEvents="none"
          style={styles.starfield}
          viewBox="0 0 440 240"
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
          {/* Soft crescent moon */}
          <G opacity={0.85}>
            <Circle cx={356} cy={54} r={16} fill="#F5E9C8" opacity={0.14} />
            <Path
              d="M360 44 A11 11 0 1 0 366 62 A8.5 8.5 0 1 1 360 44 Z"
              fill="#F6EED9"
            />
          </G>
        </Svg>
      ) : null}

      {/* Layered drifting sky clouds */}
      {CLOUDS.map((cloud) => (
        <DriftingCloud
          key={cloud.id}
          spec={cloud}
          color={atmosphere.cloudColor}
          baseOpacity={atmosphere.cloudOpacity}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Soft diagonal sunbeams filtering across the sanctuary */}
      {atmosphere.sunbeamOpacity > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, beamStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 700"
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="sunbeamGrad" x1="80%" y1="0%" x2="25%" y2="80%">
                <Stop offset="0%" stopColor={atmosphere.sunbeamColor} stopOpacity={0.85} />
                <Stop offset="100%" stopColor={atmosphere.sunbeamColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Polygon points="255,0 340,0 160,520 75,520" fill="url(#sunbeamGrad)" />
            <Polygon points="355,0 400,0 260,460 205,460" fill="url(#sunbeamGrad)" opacity={0.6} />
          </Svg>
        </Animated.View>
      ) : null}

      {/* Drifting pollen motes, blossom petals, and evening fireflies */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {AMBIENT_PARTICLES.map((spec) => (
          <AmbientParticle
            key={spec.id}
            spec={spec}
            isFirefly={atmosphere.isNight || atmosphere.isDusk}
            isNight={atmosphere.isNight}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  starfield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  cloudAnchor: {
    position: 'absolute',
    left: 0,
  },
  ambientMote: {
    position: 'absolute',
  },
});
