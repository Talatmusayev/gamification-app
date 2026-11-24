import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface LiquidDewEmblemProps {
  size?: number;
  tone?: 'day' | 'night';
}

export function LiquidDewEmblem({ size = 64, tone = 'day' }: LiquidDewEmblemProps) {
  const reducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const breath = useSharedValue(1);
  const sheen = useSharedValue(-1);

  useEffect(() => {
    if (reducedMotion) {
      breath.value = 1;
      sheen.value = -1;
      return;
    }
    const sinEase = Easing.inOut(Easing.sin);
    breath.value = withRepeat(
      withSequence(withTiming(1.035, { duration: 2200, easing: sinEase }), withTiming(1, { duration: 2200, easing: sinEase })),
      -1,
      false,
    );
    sheen.value = withRepeat(
      withSequence(
        withDelay(900, withTiming(1.2, { duration: 1900, easing: sinEase })),
        withTiming(-1, { duration: 0 }),
        withDelay(1600, withTiming(-1, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [breath, reducedMotion, sheen]);

  const breathStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const sheenStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : 0.55,
    transform: [{ translateX: sheen.value * size }, { rotate: '-24deg' }],
  }));

  const isNight = tone === 'night';
  const [aura, top, mid, deep, caustic, leaf, rim] = isNight
    ? ['#E3B261', '#A8CCB9', '#447261', '#1E392C', '#E3B261', '#F4E4C1', 'rgba(244, 241, 234, 0.34)']
    : ['#E7CA88', '#CBE8D8', '#58937F', '#365E44', '#F6E2B3', '#FAF8F4', 'rgba(255, 255, 255, 0.62)'];

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, styles.frame, breathStyle]}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          <RadialGradient id={`aura-${uid}`} cx="50%" cy="54%" r="50%">
            <Stop offset="0%" stopColor={aura} stopOpacity={isNight ? 0.36 : 0.42} />
            <Stop offset="62%" stopColor={mid} stopOpacity={0.14} />
            <Stop offset="100%" stopColor={aura} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`drop-${uid}`} x1="20%" y1="10%" x2="82%" y2="94%">
            <Stop offset="0%" stopColor={top} />
            <Stop offset="48%" stopColor={mid} />
            <Stop offset="100%" stopColor={deep} />
          </LinearGradient>
          <RadialGradient id={`caustic-${uid}`} cx="68%" cy="74%" r="42%">
            <Stop offset="0%" stopColor={caustic} stopOpacity={0.78} />
            <Stop offset="100%" stopColor={caustic} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="32" cy="34" r="30" fill={`url(#aura-${uid})`} />
        <Path d="M32 7 C32 7 50 26.5 50 39.5 C50 49.7 41.9 57.5 32 57.5 C22.1 57.5 14 49.7 14 39.5 C14 26.5 32 7 32 7 Z" fill={`url(#drop-${uid})`} stroke={rim} strokeWidth="1.25" />
        <Path d="M32 9 C32 9 48.5 27 48.5 39.5 C48.5 48.8 41.1 56 32 56 C22.9 56 15.5 48.8 15.5 39.5 C15.5 27 32 9 32 9 Z" fill={`url(#caustic-${uid})`} />
        <Path d="M23 30 C20 35 19.5 42 22.5 47" stroke="rgba(255,255,255,0.68)" strokeWidth="2.4" strokeLinecap="round" />
        <Path d="M26 23.5 C24.8 25.2 24 26.6 23.6 27.6" stroke="rgba(255,255,255,0.75)" strokeWidth="2" strokeLinecap="round" />
        <Path d="M24 46.5 C26.5 37 33.5 32.5 41.5 33.5 C39.5 42 33 47.5 24 46.5 Z" fill={leaf} fillOpacity={0.92} />
        <Path d="M25.5 45.5 Q32.5 40.5 39 35.5" stroke={deep} strokeWidth="1.3" strokeLinecap="round" strokeOpacity={0.75} />
      </Svg>
      {!reducedMotion ? (
        <View style={[StyleSheet.absoluteFill, styles.sheenClip, { borderRadius: size / 2 }]}>
          <Animated.View style={[styles.sheenRibbon, { height: size * 1.6 }, sheenStyle]}>
            <Svg width={size * 0.44} height={size * 1.6} viewBox="0 0 28 100">
              <Defs>
                <LinearGradient id={`sheen-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#FFFDF7" stopOpacity={0} />
                  <Stop offset="50%" stopColor="#FFFDF7" stopOpacity={0.72} />
                  <Stop offset="100%" stopColor="#FFFDF7" stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="28" height="100" fill={`url(#sheen-${uid})`} />
            </Svg>
          </Animated.View>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  sheenClip: { overflow: 'hidden' },
  sheenRibbon: { position: 'absolute', top: -18, left: 0 },
});
