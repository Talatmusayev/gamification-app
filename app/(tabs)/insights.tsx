import { Footprints, Leaf, Moon, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSleepDuration } from '@/components/MorningRevealModal';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { calculateHarmonyScore } from '@/domain/fog';
import type { DailyLog } from '@/domain/types';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { palette, radii, spacing } from '@/theme/tokens';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const BAR_MAX_HEIGHT = 92;

interface DaySeriesPoint {
  dateKey: string;
  dayLabel: string;
  sleepMin: number;
  steps: number;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildLastSevenDays(dailyLogs: Record<string, DailyLog>): DaySeriesPoint[] {
  const today = new Date();
  const points: DaySeriesPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const dateKey = formatDateKey(date);
    const log = dailyLogs[dateKey];
    points.push({
      dateKey,
      dayLabel: DAY_LABELS[date.getDay()],
      sleepMin: log?.sleepMin ?? 0,
      steps: log?.steps ?? 0,
    });
  }

  return points;
}

function formatCompactSteps(steps: number): string {
  if (steps <= 0) {
    return '0';
  }
  if (steps >= 1000) {
    return `${(steps / 1000).toFixed(1)}k`;
  }
  return String(steps);
}

export default function InsightsScreen() {
  const profile = useSanctuaryStore((s) => s.profile);
  const dailyLogs = useSanctuaryStore((s) => s.dailyLogs);
  const triggerMorningReveal = useSanctuaryStore((s) => s.triggerMorningReveal);

  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  const allLogs = useMemo(() => Object.values(dailyLogs), [dailyLogs]);
  const harmony = useMemo(() => calculateHarmonyScore(allLogs), [allLogs]);
  const sevenDaySeries = useMemo(() => buildLastSevenDays(dailyLogs), [dailyLogs]);

  const latestLog = useMemo(() => {
    if (allLogs.length === 0) {
      return null;
    }
    return [...allLogs].sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
  }, [allLogs]);

  const averages = useMemo(() => {
    const activePoints = sevenDaySeries.filter(
      (p) => p.sleepMin > 0 || p.steps > 0,
    );
    if (activePoints.length === 0) {
      return { avgSleepMin: 0, avgSteps: 0 };
    }
    const totalSleep = activePoints.reduce((acc, p) => acc + p.sleepMin, 0);
    const totalSteps = activePoints.reduce((acc, p) => acc + p.steps, 0);
    return {
      avgSleepMin: Math.round(totalSleep / activePoints.length),
      avgSteps: Math.round(totalSteps / activePoints.length),
    };
  }, [sevenDaySeries]);

  const maxSleepMin = Math.max(
    profile.sleepGoalMin * 1.15,
    ...sevenDaySeries.map((p) => p.sleepMin),
    480,
  );
  const maxSteps = Math.max(
    profile.stepGoal * 1.15,
    ...sevenDaySeries.map((p) => p.steps),
    8000,
  );

  const handleSimulateReveal = () => {
    const today = new Date();
    let targetDateKey = formatDateKey(today);
    for (let offset = 0; offset < 7; offset += 1) {
      const candidate = new Date(today);
      candidate.setDate(today.getDate() - offset);
      const key = formatDateKey(candidate);
      if (!dailyLogs[key]) {
        targetDateKey = key;
        break;
      }
    }

    const dayIndex = Object.keys(dailyLogs).length;
    const sampleSleepMin = 420 + ((dayIndex * 18) % 85);
    const sampleSteps = 6400 + ((dayIndex * 750) % 3400);

    const result = triggerMorningReveal({
      dateKey: targetDateKey,
      sleepMin: sampleSleepMin,
      steps: sampleSteps,
      bedtimeOffsetMin: 10,
    });

    if (result.alreadyRevealed) {
      setSimFeedback('All 7 recent days already have morning reveals.');
    } else {
      setSimFeedback(
        `Simulated ${targetDateKey}: +${result.dewAwarded} Dew, +${result.sunlightAwarded} Sunlight.`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
          <Text style={styles.subtitle}>
            Your rolling seven-day rest and movement rhythm.
          </Text>
        </View>

        <View style={styles.harmonyCard}>
          <View style={styles.harmonyTop}>
            <View style={styles.iconLabelRow}>
              <Leaf size={16} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.sectionLabel}>Rolling harmony</Text>
            </View>
            <Text style={styles.harmonyHeadline}>
              {harmony.restfulDays} of {harmony.windowDays} restful days
            </Text>
          </View>

          <View style={styles.avgRow}>
            <View style={styles.avgCell}>
              <Text style={styles.avgLabel}>Average rest</Text>
              <Text style={styles.avgValue}>
                {averages.avgSleepMin > 0
                  ? formatSleepDuration(averages.avgSleepMin)
                  : '—'}
              </Text>
            </View>
            <View style={styles.avgDivider} />
            <View style={styles.avgCell}>
              <Text style={styles.avgLabel}>Average steps</Text>
              <Text style={styles.avgValue}>
                {averages.avgSteps > 0 ? averages.avgSteps.toLocaleString() : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* 7-day Sleep Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.iconLabelRow}>
              <Moon size={16} strokeWidth={1.5} color={palette.accentDew} />
              <Text style={styles.chartTitle}>Rest</Text>
            </View>
            <Text style={styles.goalText}>
              Goal {formatSleepDuration(profile.sleepGoalMin)}
            </Text>
          </View>

          <View style={styles.barsRow}>
            {sevenDaySeries.map((point) => {
              const barHeight =
                point.sleepMin > 0
                  ? Math.max(8, Math.round((point.sleepMin / maxSleepMin) * BAR_MAX_HEIGHT))
                  : 4;
              const hoursLabel =
                point.sleepMin > 0
                  ? `${(point.sleepMin / 60).toFixed(1)}h`
                  : '—';

              return (
                <View key={`sleep_${point.dateKey}`} style={styles.barColumn}>
                  <Text style={styles.barTopValue}>{hoursLabel}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor:
                            point.sleepMin > 0 ? palette.accentDew : palette.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDayLabel}>{point.dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 7-day Steps Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.iconLabelRow}>
              <Footprints size={16} strokeWidth={1.5} color={palette.accentSunlight} />
              <Text style={styles.chartTitle}>Steps</Text>
            </View>
            <Text style={styles.goalText}>
              Goal {profile.stepGoal.toLocaleString()}
            </Text>
          </View>

          <View style={styles.barsRow}>
            {sevenDaySeries.map((point) => {
              const barHeight =
                point.steps > 0
                  ? Math.max(8, Math.round((point.steps / maxSteps) * BAR_MAX_HEIGHT))
                  : 4;

              return (
                <View key={`steps_${point.dateKey}`} style={styles.barColumn}>
                  <Text style={styles.barTopValue}>
                    {point.steps > 0 ? formatCompactSteps(point.steps) : '—'}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: barHeight,
                          backgroundColor:
                            point.steps > 0 ? palette.accentSunlight : palette.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDayLabel}>{point.dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Garden Keeper Insight Card */}
        <View style={styles.keeperCard}>
          <View style={styles.iconLabelRow}>
            <Sparkles size={15} strokeWidth={1.6} color={palette.accentMoss} />
            <Text style={styles.keeperHeading}>Garden keeper note</Text>
          </View>
          <Text style={styles.keeperBody}>
            {latestLog?.aiInsight ??
              'Your meadow is quiet and ready. Complete your first morning reveal to hear from the garden keeper.'}
          </Text>
        </View>

        {__DEV__ ? (
          <View style={styles.devCard}>
            <Text style={styles.devLabel}>Developer preview</Text>
            <BotanicalButton
              label="Simulate morning reveal"
              variant="secondary"
              onPress={handleSimulateReveal}
              fullWidth
              accessibilityLabel="Simulate morning reveal"
            />
            {simFeedback ? (
              <Text style={styles.devFeedback}>{simFeedback}</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  harmonyCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  harmonyTop: {
    gap: spacing.xs,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  harmonyHeadline: {
    fontSize: 22,
    fontWeight: '600',
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  avgCell: {
    flex: 1,
    gap: 2,
  },
  avgLabel: {
    fontSize: 12,
    color: palette.textMuted,
  },
  avgValue: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  avgDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: palette.border,
    marginHorizontal: spacing.md,
  },
  chartCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  goalText: {
    fontSize: 12,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  barTopValue: {
    fontSize: 11,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    width: 18,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: radii.sm,
  },
  barDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  keeperCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  keeperHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.accentMoss,
  },
  keeperBody: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textPrimary,
  },
  devCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  devLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textMuted,
  },
  devFeedback: {
    fontSize: 13,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
