import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
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
import { palette, radii, spacing, springs, typography } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

export interface SanctuaryCompanionProps {
  isSleeping?: boolean;
  size?: number;
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

export function SanctuaryCompanion({
  isSleeping = false,
  size = 56,
}: SanctuaryCompanionProps) {
  const reducedMotion = useReducedMotion();
  const [whisperIndex, setWhisperIndex] = useState(0);
  const [showWhisper, setShowWhisper] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const breathScaleY = useSharedValue(1);
  const hopY = useSharedValue(0);
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      breathScaleY.value = 1;
      return;
    }

    breathScaleY.value = withRepeat(
      withSequence(
        withTiming(1.04, {
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(1.0, {
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [breathScaleY, reducedMotion]);

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
    setWhisperIndex((prev) => (prev + 1) % PIP_WHISPERS.length);
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
  };

  const animatedBodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hopY.value },
      { scaleX: squashX.value },
      { scaleY: breathScaleY.value * squashY.value },
    ],
  }));

  const currentWhisper = PIP_WHISPERS[whisperIndex] ?? PIP_WHISPERS[0];

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
        <Animated.View style={animatedBodyStyle}>
          <Svg width={size} height={size} viewBox="0 0 64 64">
            <Defs>
              <RadialGradient id="pipBodyGrad" cx="42%" cy="35%" r="65%">
                <Stop offset="0%" stopColor="#FAF6EC" />
                <Stop offset="68%" stopColor="#EAE3D2" />
                <Stop offset="100%" stopColor="#D6CEBA" />
              </RadialGradient>
              <LinearGradient id="pipLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#6D9B76" />
                <Stop offset="55%" stopColor="#487553" />
                <Stop offset="100%" stopColor="#32563C" />
              </LinearGradient>
              <RadialGradient id="pipDewGrad" cx="35%" cy="30%" r="70%">
                <Stop offset="0%" stopColor="#E6F4F7" />
                <Stop offset="60%" stopColor="#8CC2D0" />
                <Stop offset="100%" stopColor="#4C8696" />
              </RadialGradient>
              <RadialGradient id="pipShadowGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="rgba(30, 36, 30, 0.24)" />
                <Stop offset="100%" stopColor="rgba(30, 36, 30, 0)" />
              </RadialGradient>
            </Defs>

            {/* Soft ground shadow */}
            <Ellipse cx="32" cy="56" rx="16" ry="5" fill="url(#pipShadowGrad)" />

            {/* Plump woodland spirit body */}
            <Path
              d="M17 42 C17 29, 23 21, 32 21 C41 21, 47 29, 47 42 C47 50, 41 54, 32 54 C23 54, 17 50, 17 42 Z"
              fill="url(#pipBodyGrad)"
              stroke="#C9BFA9"
              strokeWidth={1}
            />

            {/* Tiny stubby feet */}
            <Ellipse cx="25.5" cy="53" rx="3.4" ry="2.2" fill="#D5CCB6" />
            <Ellipse cx="38.5" cy="53" rx="3.4" ry="2.2" fill="#D5CCB6" />

            {/* Soft curled leaf cap */}
            <Path
              d="M15 26 C18 15, 29 10, 41 13 C48 15, 51 22, 46 26 C40 24, 34 25, 27 25 C22 25, 18 27, 15 26 Z"
              fill="url(#pipLeafGrad)"
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
              fill="url(#pipDewGrad)"
              stroke="rgba(255, 255, 255, 0.65)"
              strokeWidth={0.6}
            />
            <Circle cx="45.1" cy="14.9" r="0.8" fill="#FFFFFF" opacity={0.9} />

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
          </Svg>
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
