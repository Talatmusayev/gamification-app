import { useEffect, useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

export type ShaderAtmosphereVariant = 'meadow' | 'lantern' | 'pro';

export interface ShaderAtmosphereProps {
  variant: ShaderAtmosphereVariant;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_PALETTES: Record<ShaderAtmosphereVariant, { colors: [string, string, string]; opacity: number }> = {
  meadow: { colors: ['#A8C8A2', '#F2DEC0', '#E5BE74'], opacity: 0.42 },
  pro: { colors: ['#E8C170', '#95B99C', '#F3DFBC'], opacity: 0.46 },
  lantern: { colors: ['#E3B261', '#2E513B', '#C98A3E'], opacity: 0.44 },
};

function RadialOrb({ id, size, color, opacity }: { id: string; size: number; color: string; opacity: number }) {
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="65%" stopColor={color} stopOpacity={opacity * 0.28} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={r} cy={r} r={r} fill={`url(#${id})`} />
    </Svg>
  );
}

export function ShaderAtmosphere({ variant, style }: ShaderAtmosphereProps) {
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const { colors, opacity } = VARIANT_PALETTES[variant];
  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);
  const driftC = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      driftA.value = 0;
      driftB.value = 0;
      driftC.value = 0;
      return;
    }
    const loop = (duration: number) =>
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    driftA.value = loop(5400);
    driftB.value = loop(6800);
    driftC.value = loop(7600);
  }, [driftA, driftB, driftC, reducedMotion]);

  const orbAStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (driftA.value - 0.5) * 28 }, { translateY: (driftA.value - 0.5) * 16 }, { scale: 0.96 + driftA.value * 0.1 }],
  }));
  const orbBStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (0.5 - driftB.value) * 24 }, { translateY: (driftB.value - 0.5) * 20 }, { scale: 1.04 - driftB.value * 0.08 }],
  }));
  const orbCStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (driftC.value - 0.5) * 18 }, { translateY: (0.5 - driftC.value) * 18 }, { scale: 0.95 + driftC.value * 0.09 }],
  }));

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.container, style]}
    >
      <Animated.View style={[styles.orbA, orbAStyle]}>
        <RadialOrb id={`orbA-${uid}`} size={240} color={colors[0]} opacity={opacity} />
      </Animated.View>
      <Animated.View style={[styles.orbB, orbBStyle]}>
        <RadialOrb id={`orbB-${uid}`} size={220} color={colors[1]} opacity={opacity} />
      </Animated.View>
      <Animated.View style={[styles.orbC, orbCStyle]}>
        <RadialOrb id={`orbC-${uid}`} size={200} color={colors[2]} opacity={opacity * 0.85} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  orbA: { position: 'absolute', top: -64, left: -56 },
  orbB: { position: 'absolute', top: -48, right: -64 },
  orbC: { position: 'absolute', top: 36, left: '24%' },
});
