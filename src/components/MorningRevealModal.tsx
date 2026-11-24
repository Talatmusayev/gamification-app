import * as Haptics from 'expo-haptics';
import { Droplets, Footprints, Moon, Sparkles, Sun } from 'lucide-react-native';
import { useEffect } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import type { MorningRevealResult } from '@/domain/types';
import { fonts, motion, palette, radii, spacing, springs } from '@/theme/tokens';

export interface MorningRevealModalProps {
  visible: boolean;
  reveal: MorningRevealResult | null;
  onClearMist: () => void;
}

export function formatSleepDuration(sleepMin: number): string {
  const safeMin = Math.max(0, Math.round(sleepMin));
  const hours = Math.floor(safeMin / 60);
  const mins = safeMin % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function MorningRevealModal({
  visible,
  reveal,
  onClearMist,
}: MorningRevealModalProps) {
  const reducedMotion = useReducedMotion();

  const sheetOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const sheetTranslateY = useSharedValue(reducedMotion ? 0 : 18);
  const restTileOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const restTileTranslateY = useSharedValue(reducedMotion ? 0 : 12);
  const stepsTileOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const stepsTileTranslateY = useSharedValue(reducedMotion ? 0 : 12);
  const keeperOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (!visible || !reveal) {
      return;
    }
    if (reducedMotion) {
      sheetOpacity.value = 1;
      sheetTranslateY.value = 0;
      restTileOpacity.value = 1;
      restTileTranslateY.value = 0;
      stepsTileOpacity.value = 1;
      stepsTileTranslateY.value = 0;
      keeperOpacity.value = 1;
      return;
    }

    sheetOpacity.value = 0;
    sheetTranslateY.value = 18;
    restTileOpacity.value = 0;
    restTileTranslateY.value = 12;
    stepsTileOpacity.value = 0;
    stepsTileTranslateY.value = 12;
    keeperOpacity.value = 0;

    sheetOpacity.value = withTiming(1, { duration: motion.enterMs });
    sheetTranslateY.value = withSpring(0, springs.gentle);

    restTileOpacity.value = withDelay(45, withTiming(1, { duration: 220 }));
    restTileTranslateY.value = withDelay(45, withSpring(0, springs.gentle));

    stepsTileOpacity.value = withDelay(90, withTiming(1, { duration: 220 }));
    stepsTileTranslateY.value = withDelay(90, withSpring(0, springs.gentle));

    keeperOpacity.value = withDelay(135, withTiming(1, { duration: 220 }));
  }, [
    visible,
    reveal,
    reducedMotion,
    sheetOpacity,
    sheetTranslateY,
    restTileOpacity,
    restTileTranslateY,
    stepsTileOpacity,
    stepsTileTranslateY,
    keeperOpacity,
  ]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const restTileAnimatedStyle = useAnimatedStyle(() => ({
    opacity: restTileOpacity.value,
    transform: [{ translateY: restTileTranslateY.value }],
  }));

  const stepsTileAnimatedStyle = useAnimatedStyle(() => ({
    opacity: stepsTileOpacity.value,
    transform: [{ translateY: stepsTileTranslateY.value }],
  }));

  const keeperAnimatedStyle = useAnimatedStyle(() => ({
    opacity: keeperOpacity.value,
  }));

  if (!visible || !reveal) {
    return null;
  }

  const handleClearMist = () => {
    if (!reducedMotion) {
      sheetOpacity.value = withTiming(0, { duration: 140 });
    }
    if (!reveal.alreadyRevealed && Platform.OS !== 'web') {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    onClearMist();
  };

  const displayedDew = reveal.alreadyRevealed
    ? reveal.log.dewAwarded
    : reveal.dewAwarded;
  const displayedSunlight = reveal.alreadyRevealed
    ? reveal.log.sunlightAwarded
    : reveal.sunlightAwarded;
  const subtitle = reveal.alreadyRevealed
    ? 'Collected earlier today.'
    : 'Your sanctuary gathered quiet rest and movement from yesterday.';
  const ctaLabel = reveal.alreadyRevealed
    ? 'Return to meadow'
    : 'Clear morning mist';

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={handleClearMist}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[styles.sheet, sheetAnimatedStyle]}
          accessibilityViewIsModal
        >
          <View style={styles.headerRow}>
            <View style={styles.eyebrowPill}>
              <Sparkles size={14} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.eyebrowText}>{reveal.log.dateKey}</Text>
            </View>
          </View>

          <Text style={styles.title}>Morning reveal</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.summaryGrid}>
            <Animated.View style={[styles.metricCard, restTileAnimatedStyle]}>
              <View style={styles.metricLabelRow}>
                <Moon size={16} strokeWidth={1.5} color={palette.accentDew} />
                <Text style={styles.metricLabel}>Rest</Text>
              </View>
              <Text style={styles.metricValue}>
                {formatSleepDuration(reveal.log.sleepMin)}
              </Text>
              <View style={styles.rewardBadge}>
                <Droplets size={14} strokeWidth={1.6} color={palette.accentDew} />
                <Text style={[styles.rewardText, styles.dewText]}>
                  +{displayedDew}
                </Text>
                <Text style={styles.rewardUnit}>Dew</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.metricCard, stepsTileAnimatedStyle]}>
              <View style={styles.metricLabelRow}>
                <Footprints size={16} strokeWidth={1.5} color={palette.accentSunlight} />
                <Text style={styles.metricLabel}>Steps</Text>
              </View>
              <Text style={styles.metricValue}>
                {reveal.log.steps.toLocaleString()}
              </Text>
              <View style={styles.rewardBadge}>
                <Sun size={14} strokeWidth={1.6} color={palette.accentSunlight} />
                <Text style={[styles.rewardText, styles.sunlightText]}>
                  +{displayedSunlight}
                </Text>
                <Text style={styles.rewardUnit}>Sunlight</Text>
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.keeperCard, keeperAnimatedStyle]}>
            <Text style={styles.keeperLabel}>Garden keeper</Text>
            <Text style={styles.keeperNote}>{reveal.keeperNote}</Text>
          </Animated.View>

          <BotanicalButton
            label={ctaLabel}
            onPress={handleClearMist}
            fullWidth
            haptic={false}
            accessibilityLabel={ctaLabel}
            accessibilityHint="Return to the sunlit meadow"
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 25, 22, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: palette.bg,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  eyebrowText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 24,
    letterSpacing: -0.3,
    color: palette.textPrimary,
    marginTop: -spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
    marginTop: -spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textSecondary,
  },
  metricValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  rewardText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  dewText: {
    color: palette.accentDew,
  },
  sunlightText: {
    color: palette.accentSunlight,
  },
  rewardUnit: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
  keeperCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  keeperLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.accentMoss,
    letterSpacing: 0.2,
  },
  keeperNote: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textPrimary,
  },
});
