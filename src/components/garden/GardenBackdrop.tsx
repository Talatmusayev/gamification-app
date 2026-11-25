import { useEffect, useId } from 'react';
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
    // Dawn — soft mist-sage & warm apricot horizon
    return {
      skyTop: '#E4ECE8',
      skyMid: '#F4EDE4',
      skyBottom: '#FBF2E4',
      cloudColor: '#FFF7F0',
      cloudOpacity: 0.74,
      sunbeamColor: '#FFE5BD',
      sunbeamOpacity: 0.25,
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
      sunbeamOpacity: 0.27,
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
      cloudOpacity: 0.76,
      sunbeamColor: '#FFF1C7',
      sunbeamOpacity: 0.30,
      isNight: false,
      isDusk: false,
    };
  }
  if (hour >= 17 && hour < 20) {
    // Dusk — warm sandstone-amber golden hour
    return {
      skyTop: '#D9D6CA',
      skyMid: '#EAD3BD',
      skyBottom: '#F6DFC2',
      cloudColor: '#FDE9D2',
      cloudOpacity: 0.66,
      sunbeamColor: '#F4BC78',
      sunbeamOpacity: 0.28,
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
    cloudOpacity: 0.36,
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

interface StarSpec {
  id: string;
  leftPct: number;
  topPct: number;
  size: number;
  baseOpacity: number;
  delayMs: number;
}

const TWILIGHT_STARS: readonly StarSpec[] = [
  { id: 's1', leftPct: 10, topPct: 6, size: 3, baseOpacity: 0.72, delayMs: 0 },
  { id: 's2', leftPct: 26, topPct: 4, size: 3.5, baseOpacity: 0.85, delayMs: 450 },
  { id: 's3', leftPct: 43, topPct: 9, size: 2.5, baseOpacity: 0.60, delayMs: 900 },
  { id: 's4', leftPct: 58, topPct: 5, size: 3.5, baseOpacity: 0.80, delayMs: 200 },
  { id: 's5', leftPct: 73, topPct: 11, size: 2.5, baseOpacity: 0.65, delayMs: 1100 },
  { id: 's6', leftPct: 18, topPct: 16, size: 2.5, baseOpacity: 0.50, delayMs: 700 },
  { id: 's7', leftPct: 81, topPct: 18, size: 3, baseOpacity: 0.68, delayMs: 350 },
  { id: 's8', leftPct: 92, topPct: 6, size: 3, baseOpacity: 0.75, delayMs: 1400 },
  { id: 's9', leftPct: 34, topPct: 15, size: 2.2, baseOpacity: 0.52, delayMs: 600 },
  { id: 's10', leftPct: 65, topPct: 17, size: 2.5, baseOpacity: 0.58, delayMs: 1050 },
];

function TwinklingStar({
  spec,
  dimFactor,
  reducedMotion,
}: {
  spec: StarSpec;
  dimFactor: number;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(spec.baseOpacity * dimFactor);

  useEffect(() => {
    const rest = spec.baseOpacity * dimFactor;
    if (reducedMotion) {
      opacity.value = rest;
      return;
    }
    opacity.value = withDelay(
      spec.delayMs,
      withRepeat(
        withSequence(
          withTiming(Math.min(1, rest * 1.25), {
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(rest * 0.35, {
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
  }, [dimFactor, opacity, reducedMotion, spec.baseOpacity, spec.delayMs]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.starDot,
        {
          left: `${spec.leftPct}%`,
          top: `${spec.topPct}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
        },
        animStyle,
      ]}
    />
  );
}

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
  const rawId = useId();
  const uid = `bg_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
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
        withTiming(atmosphere.sunbeamOpacity * 0.78, {
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

  const farHillColor = atmosphere.isNight
    ? '#17221C'
    : atmosphere.isDusk
      ? '#DFCBB2'
      : '#CFE0D5';
  const nearHillColor = atmosphere.isNight
    ? '#1E2C24'
    : atmosphere.isDusk
      ? '#E7D5BA'
      : '#DAE7D9';
  const cloudBankColor = atmosphere.isNight
    ? '#25352C'
    : atmosphere.isDusk
      ? '#FBE7CF'
      : '#FAF8F1';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Rich multi-stop atmospheric sky gradient + distant cloud banks & rolling horizon hills */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 400 700"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={`${uid}_sky`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={atmosphere.skyTop} />
            <Stop offset="52%" stopColor={atmosphere.skyMid} />
            <Stop offset="100%" stopColor={atmosphere.skyBottom} />
          </LinearGradient>
          <RadialGradient id={`${uid}_sunGlow`} cx="78%" cy="14%" r="52%">
            <Stop
              offset="0%"
              stopColor={
                atmosphere.isNight
                  ? '#F4E8C6'
                  : atmosphere.isDusk
                    ? '#FFE1A8'
                    : '#FFF6DC'
              }
              stopOpacity={atmosphere.isNight ? 0.14 : atmosphere.isDusk ? 0.72 : 0.65}
            />
            <Stop
              offset="60%"
              stopColor={
                atmosphere.isNight
                  ? '#E3B261'
                  : atmosphere.isDusk
                    ? '#F4BC78'
                    : '#FFF1C8'
              }
              stopOpacity={atmosphere.isNight ? 0.04 : 0.22}
            />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`${uid}_horizonMist`} x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={cloudBankColor} stopOpacity={0} />
            <Stop offset="65%" stopColor={cloudBankColor} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={atmosphere.skyBottom} stopOpacity={0.85} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={400} height={700} fill={`url(#${uid}_sky)`} />
        <Rect x={0} y={0} width={400} height={700} fill={`url(#${uid}_sunGlow)`} />

        {/* Distant layered cloud banks hovering low across the valley horizon */}
        <G opacity={atmosphere.isNight ? 0.42 : 0.68}>
          <Ellipse cx={75} cy={512} rx={96} ry={28} fill={cloudBankColor} />
          <Ellipse cx={185} cy={520} rx={118} ry={32} fill={cloudBankColor} />
          <Ellipse cx={312} cy={508} rx={104} ry={28} fill={cloudBankColor} />
        </G>

        {/* Soft distant rolling meadow hills silhouette */}
        <Path
          d="M 0 568 Q 76 526 164 552 T 326 538 Q 368 532 400 546 L 400 700 L 0 700 Z"
          fill={farHillColor}
          opacity={atmosphere.isNight ? 0.65 : 0.56}
        />
        <Path
          d="M 0 598 Q 98 564 206 588 T 400 576 L 400 700 L 0 700 Z"
          fill={nearHillColor}
          opacity={atmosphere.isNight ? 0.72 : 0.64}
        />

        {/* Soft valley mist blending hills gently into lower edge */}
        <Rect x={0} y={530} width={400} height={170} fill={`url(#${uid}_horizonMist)`} />
      </Svg>

      {/* Twinkling twilight & night starfield + crescent moon */}
      {atmosphere.isNight || atmosphere.isDusk ? (
        <View style={styles.starLayer} pointerEvents="none">
          {TWILIGHT_STARS.map((star) => (
            <TwinklingStar
              key={star.id}
              spec={star}
              dimFactor={atmosphere.isNight ? 1 : 0.42}
              reducedMotion={reducedMotion}
            />
          ))}
          {atmosphere.isNight ? (
            <Svg
              pointerEvents="none"
              style={styles.starfield}
              viewBox="0 0 440 240"
              preserveAspectRatio="xMidYMin slice"
            >
              <G opacity={0.86}>
                <Circle cx={356} cy={54} r={17} fill="#F5E9C8" opacity={0.14} />
                <Path
                  d="M360 44 A11 11 0 1 0 366 62 A8.5 8.5 0 1 1 360 44 Z"
                  fill="#F6EED9"
                />
              </G>
            </Svg>
          ) : null}
        </View>
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

      {/* Richer diagonal golden-hour & morning sunbeams filtering across the sanctuary */}
      {atmosphere.sunbeamOpacity > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, beamStyle]}>
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 400 700"
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id={`${uid}_beam`} x1="80%" y1="0%" x2="25%" y2="82%">
                <Stop offset="0%" stopColor={atmosphere.sunbeamColor} stopOpacity={0.88} />
                <Stop offset="100%" stopColor={atmosphere.sunbeamColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Polygon points="205,0 260,0 70,500 18,500" fill={`url(#${uid}_beam)`} opacity={0.55} />
            <Polygon points="255,0 340,0 160,540 75,540" fill={`url(#${uid}_beam)`} />
            <Polygon points="350,0 400,0 265,480 205,480" fill={`url(#${uid}_beam)`} opacity={0.68} />
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
  starLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  starfield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  starDot: {
    position: 'absolute',
    backgroundColor: '#F4F1EA',
  },
  cloudAnchor: {
    position: 'absolute',
    left: 0,
  },
  ambientMote: {
    position: 'absolute',
  },
});
