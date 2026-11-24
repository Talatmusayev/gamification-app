import { Droplets, Leaf, Sun } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, palette, radii, spacing } from '@/theme/tokens';

export interface SanctuaryHudProps {
  dewBalance: number;
  sunlightBalance: number;
  restfulDays: number;
  windowDays: number;
}

export function SanctuaryHud({
  dewBalance,
  sunlightBalance,
  restfulDays,
  windowDays,
}: SanctuaryHudProps) {
  return (
    <View style={styles.container}>
      <View style={styles.currencyRow}>
        <View
          style={styles.pill}
          accessible
          accessibilityLabel={`${dewBalance} Dew`}
        >
          <Droplets size={16} strokeWidth={1.5} color={palette.accentDew} />
          <Text style={styles.currencyValue}>{dewBalance}</Text>
        </View>

        <View
          style={styles.pill}
          accessible
          accessibilityLabel={`${sunlightBalance} Sunlight`}
        >
          <Sun size={16} strokeWidth={1.5} color={palette.accentSunlight} />
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
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
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
