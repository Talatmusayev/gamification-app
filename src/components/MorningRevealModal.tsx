import * as Haptics from 'expo-haptics';
import { Droplets, Footprints, Moon, Sparkles, Sun } from 'lucide-react-native';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import type { MorningRevealResult } from '@/domain/types';
import { palette, radii, spacing } from '@/theme/tokens';

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
  if (!visible || !reveal) {
    return null;
  }

  const handleClearMist = () => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    onClearMist();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClearMist}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.headerRow}>
            <View style={styles.eyebrowPill}>
              <Sparkles size={14} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.eyebrowText}>{reveal.log.dateKey}</Text>
            </View>
          </View>

          <Text style={styles.title}>Morning reveal</Text>
          <Text style={styles.subtitle}>
            Your sanctuary gathered quiet rest and movement from yesterday.
          </Text>

          <View style={styles.summaryGrid}>
            <View style={styles.metricCard}>
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
                  +{reveal.dewAwarded}
                </Text>
                <Text style={styles.rewardUnit}>Dew</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
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
                  +{reveal.sunlightAwarded}
                </Text>
                <Text style={styles.rewardUnit}>Sunlight</Text>
              </View>
            </View>
          </View>

          <View style={styles.keeperCard}>
            <Text style={styles.keeperLabel}>Garden keeper</Text>
            <Text style={styles.keeperNote}>{reveal.keeperNote}</Text>
          </View>

          <BotanicalButton
            label="Clear morning mist"
            onPress={handleClearMist}
            fullWidth
            accessibilityLabel="Clear morning mist"
            accessibilityHint="Collect your morning rewards and return to the sunlit meadow"
          />
        </View>
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
    fontSize: 12,
    fontWeight: '500',
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: palette.textPrimary,
    marginTop: -spacing.sm,
  },
  subtitle: {
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
    fontSize: 13,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dewText: {
    color: palette.accentDew,
  },
  sunlightText: {
    color: palette.accentSunlight,
  },
  rewardUnit: {
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
    fontSize: 12,
    fontWeight: '600',
    color: palette.accentMoss,
    letterSpacing: 0.2,
  },
  keeperNote: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textPrimary,
  },
});
