import { Droplets, Leaf, Sun } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { liquidGlassSurface } from '@/theme/glass';
import { fonts, palette, radii, spacing, springs } from '@/theme/tokens';

export interface SanctuaryHudProps {
  dewBalance: number;
  sunlightBalance: number;
  restfulDays: number;
  windowDays: number;
}

function useRewardPulse(value: number, reducedMotion: boolean) {
  const prevRef = useRef(value);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (value > prevRef.current && !reducedMotion) {
      scale.value = withSequence(
        withTiming(1.08, { duration: 90 }),
        withSpring(1, springs.pop),
      );
    }
    prevRef.current = value;
  }, [value, reducedMotion, scale]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

export function SanctuaryHud({
  dewBalance,
  sunlightBalance,
  restfulDays,
  windowDays,
}: SanctuaryHudProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const dewIconStyle = useRewardPulse(dewBalance, reducedMotion);
  const sunlightIconStyle = useRewardPulse(sunlightBalance, reducedMotion);

  return (
    <View style={styles.container}>
      <View style={styles.currencyRow}>
        <View
          style={styles.pill}
          accessible
          accessibilityLabel={`${dewBalance} Dew`}
        >
          <Animated.View style={dewIconStyle}>
            <Droplets size={16} strokeWidth={1.5} color={palette.accentDew} />
          </Animated.View>
          <Text style={styles.currencyValue}>{dewBalance}</Text>
        </View>

        <View
          style={styles.pill}
          accessible
          accessibilityLabel={`${sunlightBalance} Sunlight`}
        >
          <Animated.View style={sunlightIconStyle}>
            <Sun size={16} strokeWidth={1.5} color={palette.accentSunlight} />
          </Animated.View>
          <Text style={styles.currencyValue}>{sunlightBalance}</Text>
        </View>
      </View>

      <View
        style={[styles.pill, styles.harmonyPill]}
        accessible
        accessibilityLabel={`${restfulDays} of ${windowDays} restful days`}
      >
        <Leaf size={16} strokeWidth={1.5} color={palette.accentMoss} />
        <Text style={styles.harmonyText}>
          {restfulDays} of {windowDays} restful days
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pill: {
    ...liquidGlassSurface,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  currencyValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  harmonyPill: {
    flexShrink: 1,
  },
  harmonyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
