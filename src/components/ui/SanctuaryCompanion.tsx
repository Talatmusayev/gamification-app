import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
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
  RadialGradient,
  Stop,
} from 'react-native-svg';
import type { FogLevel } from '@/domain/types';
import { palette, radii, spacing, springs, typography } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

export interface SanctuaryCompanionProps {
  isSleeping?: boolean;
  size?: number;
  hasPendingReveal?: boolean;
  fogLevel?: FogLevel;
  hopTrigger?: number;
  hopDirection?: -1 | 1;
}

const PIP_WHISPERS: readonly string[] = [
  'Soft sunlight suits your meadow today.',
  'Your moss glows brightest after steady rest.',
  'Take your time. The meadow never rushes.',
  'Every quiet step leaves a trail of warmth.',
  'Dew gathers gently while the world is still.',
  'A calm breath is enough for this afternoon.',
  'New petals open best without hurry.',
  'The clearing feels softer with you here.',
];

const PIP_POSTBOX_WHISPERS: readonly string[] = [
  'A fresh morning note is waiting at the postbox.',
  'Your postbox flag is raised with morning dew.',
  'Yesterday left a quiet story by the meadow gate.',
];

const PIP_MIST_WHISPERS: readonly string[] = [
  'Soft morning mist rests lightly over the clover.',
  'Take a quiet breath while the mist lifts.',
  'Gentle fog softens the edges of the garden.',
];

const PIP_SLEEP_WHISPERS: readonly string[] = [
  'Resting quietly beneath a curled leaf.',
  'May tonight bring unhurried sleep.',
  'Lantern light keeps watch over the meadow.',
];

export function SanctuaryCompanion({
  isSleeping = false,
  size = 56,
  hasPendingReveal = false,
  fogLevel = 0,
  hopTrigger = 0,
  hopDirection = 1,
}: SanctuaryCompanionProps) {
  const rawId = useId();
  const uid = `pip_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const reducedMotion = Boolean(useReducedMotion());
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [showWhisper, setShowWhisper] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHopRef = useRef(hopTrigger);

  const breathScaleY = useSharedValue(1);
  const hopY = useSharedValue(0);
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);
  const leafTiltDeg = useSharedValue(0);
  const leafLagY = useSharedValue(0);

  const activeWhispers = useMemo(() => {
    if (isSleeping) {
      return PIP_SLEEP_WHISPERS;
    }
    if (hasPendingReveal) {
      return PIP_POSTBOX_WHISPERS;
    }
    if (fogLevel > 0) {
      return PIP_MIST_WHISPERS;
    }
    return PIP_WHISPERS;
  }, [fogLevel, hasPendingReveal, isSleeping]);

  useEffect(() => {
    if (reducedMotion) {
      breathScaleY.value = 1;
      return;
    }

    breathScaleY.value = withRepeat(
      withSequence(
        withTiming(isSleeping ? 1.028 : 1.04, {
          duration: isSleeping ? 1850 : 1400,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1.0, {
          duration: isSleeping ? 1850 : 1400,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [breathScaleY, isSleeping, reducedMotion]);

  // Subtle leaf-cap follow-through whenever Pip hops between waypoints
  useEffect(() => {
    if (hopTrigger === prevHopRef.current) {
      return;
    }
    prevHopRef.current = hopTrigger;
    if (reducedMotion) {
      return;
    }

    const dir = hopDirection >= 0 ? 1 : -1;
    leafTiltDeg.value = withDelay(
      35,
      withSequence(
        withTiming(8.5 * dir, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(-4 * dir, { duration: 140, easing: Easing.inOut(Easing.sin) }),
        withSpring(0, { damping: 12, stiffness: 220, mass: 0.7 }),
      ),
    );
    leafLagY.value = withDelay(
      30,
      withSequence(
        withTiming(-2.5, { duration: 130, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 13, stiffness: 240, mass: 0.7 }),
      ),
    );
  }, [hopDirection, hopTrigger, leafLagY, leafTiltDeg, reducedMotion]);

  useEffect(() => {
    if (isSleeping || reducedMotion) {
      setIsBlinking(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const intervalId = setInterval(() => {
      setIsBlinking(true);
      timeoutId = setTimeout(() => {
        setIsBlinking(false);
      }, 140);
    }, 4200);

    return () => {
      clearInterval(intervalId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSleeping, reducedMotion]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handlePet = () => {
    hapticLight();
    setWhisperIndex((prev) => (prev + 1) % activeWhispers.length);
    setShowWhisper(true);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowWhisper(false);
    }, 3600);

    if (reducedMotion) {
      return;
    }

    squashX.value = withSequence(
      withTiming(1.12, { duration: 90 }),
      withSpring(1, springs.pop),
    );
    squashY.value = withSequence(
      withTiming(0.88, { duration: 90 }),
      withSpring(1, springs.pop),
    );
    hopY.value = withSequence(
      withTiming(-9, { duration: 110, easing: Easing.out(Easing.cubic) }),
      withSpring(0, springs.tactile),
    );
    // Leaf-cap follow-through lag (35ms)
    leafTiltDeg.value = withDelay(
      35,
      withSequence(
        withTiming(9, { duration: 110, easing: Easing.out(Easing.quad) }),
        withTiming(-4.5, { duration: 120, easing: Easing.inOut(Easing.sin) }),
        withSpring(0, { damping: 12, stiffness: 220, mass: 0.7 }),
      ),
    );
    leafLagY.value = withDelay(
      35,
      withSequence(
        withTiming(-3, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(0, { damping: 13, stiffness: 240, mass: 0.7 }),
      ),
    );
  };

  const animatedBodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hopY.value },
      { scaleX: squashX.value },
      { scaleY: breathScaleY.value * squashY.value },
    ],
  }));

  const animatedLeafStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: leafLagY.value },
      { rotate: `${leafTiltDeg.value}deg` },
    ],
  }));

  const currentWhisper =
    activeWhispers[whisperIndex % activeWhispers.length] ?? activeWhispers[0];

  return (
    <View style={styles.root}>
      {showWhisper ? (
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(180)}
          exiting={reducedMotion ? undefined : FadeOut.duration(140)}
          style={styles.whisperBubble}
          pointerEvents="none"
        >
          <Text style={styles.whisperText}>{currentWhisper}</Text>
        </Animated.View>
      ) : null}

      <Pressable
        onPress={handlePet}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Pip the meadow spirit. Tap to pet."
        style={({ pressed }) => [
          styles.touchTarget,
          pressed && styles.touchPressed,
        ]}
      >
        <Animated.View style={[styles.spriteWrap, { width: size, height: size }, animatedBodyStyle]}>
          <Svg width={size} height={size} viewBox="0 0 64 64">
            <Defs>
              <RadialGradient id={`${uid}_body`} cx="42%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#FAF6EC" />
                <Stop offset="68%" stopColor="#EAE3D2" />
                <Stop offset="100%" stopColor="#D6CEBA" />
              </RadialGradient>
              <LinearGradient id={`${uid}_blanket`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#6B9873" />
                <Stop offset="55%" stopColor="#4A7554" />
                <Stop offset="100%" stopColor="#35583E" />
              </LinearGradient>
              <RadialGradient id={`${uid}_shadow`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="rgba(30, 36, 30, 0.24)" />
                <Stop offset="100%" stopColor="rgba(30, 36, 30, 0)" />
              </RadialGradient>
            </Defs>

            {/* Soft ground shadow */}
            <Ellipse cx="32" cy="56" rx="16" ry="5" fill={`url(#${uid}_shadow)`} />

            {/* Plump woodland spirit body */}
            <Path
              d="M17 42 C17 29, 23 21, 32 21 C41 21, 47 29, 47 42 C47 50, 41 54, 32 54 C23 54, 17 50, 17 42 Z"
              fill={`url(#${uid}_body)`}
              stroke="#C9BFA9"
              strokeWidth={1}
            />

            {/* Tiny stubby feet (tucked under leaf blanket when sleeping) */}
            {!isSleeping ? (
              <>
                <Ellipse cx="25.5" cy="53" rx="3.4" ry="2.2" fill="#D5CCB6" />
                <Ellipse cx="38.5" cy="53" rx="3.4" ry="2.2" fill="#D5CCB6" />
              </>
            ) : null}

            {/* Rosy warm cheeks */}
            <Ellipse
              cx="23"
              cy="39.5"
              rx="3.2"
              ry="1.8"
              fill="#DF9C8E"
              opacity={0.55}
            />
            <Ellipse
              cx="41"
              cy="39.5"
              rx="3.2"
              ry="1.8"
              fill="#DF9C8E"
              opacity={0.55}
            />

            {/* Eyes: sleeping crescent, blinking line, or gentle open eyes */}
            {isSleeping || isBlinking ? (
              <>
                <Path
                  d="M24 35.5 Q26.2 37.3 28.4 35.5"
                  fill="none"
                  stroke="#364036"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <Path
                  d="M35.6 35.5 Q37.8 37.3 40 35.5"
                  fill="none"
                  stroke="#364036"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <Circle cx="26.2" cy="35" r="2.1" fill="#2A332A" />
                <Circle cx="37.8" cy="35" r="2.1" fill="#2A332A" />
                <Circle cx="26.9" cy="34.2" r="0.7" fill="#FFFFFF" />
                <Circle cx="38.5" cy="34.2" r="0.7" fill="#FFFFFF" />
              </>
            )}

            {/* Gentle smile */}
            <Path
              d="M30 39.2 Q32 41 34 39.2"
              fill="none"
              stroke="#4D574D"
              strokeWidth={1.2}
              strokeLinecap="round"
            />

            {/* Cozy curled botanical leaf blanket when sleeping */}
            {isSleeping ? (
              <>
                <Path
                  d="M15.5 41.5 C21 37.5, 43 37.5, 48.5 41.5 C48 50.5, 41.5 55, 32 55 C22.5 55, 16 50.5, 15.5 41.5 Z"
                  fill={`url(#${uid}_blanket)`}
                  stroke="#2C4C35"
                  strokeWidth={0.95}
                />
                <Path
                  d="M21 44.5 Q32 48.5 43 44.5 M25 49 Q32 51.5 39 49"
                  fill="none"
                  stroke="rgba(244, 241, 234, 0.28)"
                  strokeWidth={0.95}
                  strokeLinecap="round"
                />
              </>
            ) : null}
          </Svg>

          {/* Independent leaf-cap layer for springy follow-through tilt */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, animatedLeafStyle]}
          >
            <Svg width={size} height={size} viewBox="0 0 64 64">
              <Defs>
                <LinearGradient id={`${uid}_leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#6D9B76" />
                  <Stop offset="55%" stopColor="#487553" />
                  <Stop offset="100%" stopColor="#32563C" />
                </LinearGradient>
                <RadialGradient id={`${uid}_dew`} cx="35%" cy="30%" r="70%">
                  <Stop offset="0%" stopColor="#E6F4F7" />
                  <Stop offset="60%" stopColor="#8CC2D0" />
                  <Stop offset="100%" stopColor="#4C8696" />
                </RadialGradient>
              </Defs>

              {/* Soft curled leaf cap */}
              <Path
                d="M15 26 C18 15, 29 10, 41 13 C48 15, 51 22, 46 26 C40 24, 34 25, 27 25 C22 25, 18 27, 15 26 Z"
                fill={`url(#${uid}_leaf)`}
                stroke="#2C4C35"
                strokeWidth={0.9}
              />
              {/* Leaf rib */}
              <Path
                d="M21 23 C28 18, 36 16, 44 18"
                fill="none"
                stroke="rgba(244, 241, 234, 0.35)"
                strokeWidth={1}
                strokeLinecap="round"
              />
              {/* Curled stem */}
              <Path
                d="M36 13 C38 8, 44 8, 45 11"
                fill="none"
                stroke="#3D6647"
                strokeWidth={1.6}
                strokeLinecap="round"
              />

              {/* Glowing dewdrop perched on leaf tip */}
              <Path
                d="M46 12 C48.2 14.5, 48.8 16.5, 46.5 18.2 C44.2 19.6, 42.2 17.5, 43.3 15 C44 13.4, 45.2 12.6, 46 12 Z"
                fill={`url(#${uid}_dew)`}
                stroke="rgba(255, 255, 255, 0.65)"
                strokeWidth={0.6}
              />
              <Circle cx="45.1" cy="14.9" r="0.8" fill="#FFFFFF" opacity={0.9} />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  touchTarget: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchPressed: {
    opacity: 0.92,
  },
  spriteWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whisperBubble: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: spacing.xs,
    width: 196,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#1E241E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  whisperText: {
    ...typography.caption,
    color: palette.textPrimary,
    textAlign: 'center',
  },
});
