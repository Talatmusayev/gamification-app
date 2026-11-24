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
import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';

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

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
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
