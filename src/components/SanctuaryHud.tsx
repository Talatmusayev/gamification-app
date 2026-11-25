import { Droplets, Leaf, Settings, Sun } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { liquidGlassSurface } from '@/theme/glass';
import { fonts, palette, radii, spacing, springs } from '@/theme/tokens';
import { hapticSelection } from '@/utils/haptics';

export interface SanctuaryHudProps {
  dewBalance: number;
  sunlightBalance: number;
  restfulDays: number;
  windowDays: number;
  onSettingsPress?: () => void;
}

function useRewardPulse(value: number, reducedMotion: boolean) {
  const prevRef = useRef(value);
  const iconScale = useSharedValue(1);
  const valueScale = useSharedValue(1);
  const valueTranslateY = useSharedValue(0);

  useEffect(() => {
    const prev = prevRef.current;
    if (value !== prev && !reducedMotion) {
      if (value > prev) {
        iconScale.value = withSequence(
          withTiming(1.14, { duration: 95, easing: Easing.out(Easing.quad) }),
          withSpring(1, springs.pop),
        );
        // Secondary action (/ux-motion #7): quieter tabular-num lift right after icon pop
        valueScale.value = withDelay(
          35,
          withSequence(
            withTiming(1.06, { duration: 100, easing: Easing.out(Easing.quad) }),
            withSpring(1, springs.gentle),
          ),
        );
        valueTranslateY.value = withDelay(
          35,
          withSequence(
            withTiming(-1.8, { duration: 100, easing: Easing.out(Easing.quad) }),
            withSpring(0, springs.gentle),
          ),
        );
      } else {
        valueScale.value = withSequence(
          withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) }),
          withSpring(1, springs.gentle),
        );
      }
    }
    prevRef.current = value;
  }, [iconScale, reducedMotion, value, valueScale, valueTranslateY]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const valueStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: valueTranslateY.value },
      { scale: valueScale.value },
    ],
  }));

  return { iconStyle, valueStyle };
}

export function SanctuaryHud({
  dewBalance,
  sunlightBalance,
  restfulDays,
  windowDays,
  onSettingsPress,
}: SanctuaryHudProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const dewPulse = useRewardPulse(dewBalance, reducedMotion);
  const sunlightPulse = useRewardPulse(sunlightBalance, reducedMotion);

  return (
    <View style={styles.container}>
      <View style={styles.currencyRow}>
        <View
          style={styles.pill}
          accessible
          accessibilityLabel={`${dewBalance} Dew`}
        >
          <Animated.View style={dewPulse.iconStyle}>
            <Droplets size={16} strokeWidth={1.5} color={palette.accentDew} />
          </Animated.View>
          <Animated.Text style={[styles.currencyValue, dewPulse.valueStyle]}>
            {dewBalance}
          </Animated.Text>
        </View>

        <View
          style={styles.pill}
          accessible
          accessibilityLabel={`${sunlightBalance} Sunlight`}
        >
          <Animated.View style={sunlightPulse.iconStyle}>
            <Sun size={16} strokeWidth={1.5} color={palette.accentSunlight} />
          </Animated.View>
          <Animated.Text
            style={[styles.currencyValue, sunlightPulse.valueStyle]}
          >
            {sunlightBalance}
          </Animated.Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        <View
          style={[styles.pill, styles.harmonyPill]}
          accessible
          accessibilityLabel={`${restfulDays} of ${windowDays} restful days`}
        >
          <Leaf size={16} strokeWidth={1.5} color={palette.accentMoss} />
          <Text style={styles.harmonyText} numberOfLines={1}>
            {restfulDays} of {windowDays} restful days
          </Text>
        </View>

        {onSettingsPress ? (
          <Pressable
            onPress={() => {
              hapticSelection();
              onSettingsPress();
            }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={({ pressed }) => [
              styles.settingsPill,
              pressed && styles.settingsPillPressed,
            ]}
          >
            <Settings size={18} strokeWidth={1.6} color={palette.textSecondary} />
          </Pressable>
        ) : null}
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
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  pill: {
    ...liquidGlassSurface,
    minHeight: 38,
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
  settingsPill: {
    ...liquidGlassSurface,
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPillPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
});
