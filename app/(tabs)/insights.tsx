import { useRouter } from 'expo-router';
import { Footprints, Leaf, Moon, Settings, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSleepDuration } from '@/components/MorningRevealModal';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { calculateHarmonyScore } from '@/domain/fog';
import type { DailyLog } from '@/domain/types';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, palette, radii, spacing } from '@/theme/tokens';

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

interface AnimatedBarProps {
  targetHeight: number;
  color: string;
  reducedMotion: boolean;
}

function AnimatedBar({ targetHeight, color, reducedMotion }: AnimatedBarProps) {
  const height = useSharedValue(reducedMotion ? targetHeight : 0);

  useEffect(() => {
    if (reducedMotion) {
      height.value = targetHeight;
      return;
    }
    height.value = withTiming(targetHeight, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [height, reducedMotion, targetHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.barFill,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const reducedMotion = Boolean(useReducedMotion());
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
          <View style={styles.headerRow}>
            <Text style={styles.title}>Insights</Text>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={styles.settingsButton}
            >
              <Settings size={20} strokeWidth={1.5} color={palette.textPrimary} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Your rolling seven-day rest and movement rhythm.
          </Text>
        </View>

        {allLogs.length === 0 ? (
          <View style={styles.firstBloomCard}>
            <View style={styles.iconLabelRow}>
              <Sparkles size={16} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.sectionLabel}>First Bloom · 3-Day Journey</Text>
            </View>
            <Text style={styles.firstBloomTitle}>
              Three restful mornings awaken your meadow
            </Text>
            <Text style={styles.firstBloomBody}>
              Each morning reveal clears lingering mist, gathers Dew and Sunlight
              for your clearing, and brings your first visiting critter closer to
              home.
            </Text>

            <View style={styles.milestoneRow}>
              <View style={styles.milestoneStep}>
                <View style={styles.milestoneDot}>
                  <Text style={styles.milestoneNum}>1</Text>
                </View>
                <Text style={styles.milestoneLabel}>First dew</Text>
              </View>
              <View style={styles.milestoneLine} />
              <View style={styles.milestoneStep}>
                <View style={styles.milestoneDot}>
                  <Text style={styles.milestoneNum}>2</Text>
                </View>
                <Text style={styles.milestoneLabel}>Mist clears</Text>
              </View>
              <View style={styles.milestoneLine} />
              <View style={styles.milestoneStep}>
                <View style={styles.milestoneDot}>
                  <Text style={styles.milestoneNum}>3</Text>
                </View>
                <Text style={styles.milestoneLabel}>Critter visits</Text>
              </View>
            </View>

            <BotanicalButton
              label="Open morning check-in"
              variant="primary"
              onPress={() => router.push('/(tabs)/sanctuary')}
              fullWidth
              accessibilityLabel="Open morning check-in in sanctuary"
            />
          </View>
        ) : (
          <>
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
                        <AnimatedBar
                          targetHeight={barHeight}
                          color={
                            point.sleepMin > 0 ? palette.accentDew : palette.border
                          }
                          reducedMotion={reducedMotion}
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
                        <AnimatedBar
                          targetHeight={barHeight}
                          color={
                            point.steps > 0 ? palette.accentSunlight : palette.border
                          }
                          reducedMotion={reducedMotion}
                        />
                      </View>
                      <Text style={styles.barDayLabel}>{point.dayLabel}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 26,
    letterSpacing: -0.3,
    color: palette.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textSecondary,
  },
  harmonyHeadline: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
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
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  avgValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: palette.textPrimary,
  },
  goalText: {
    fontFamily: fonts.body,
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
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textSecondary,
  },
  keeperCard: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  keeperHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.accentMoss,
  },
  keeperBody: {
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textMuted,
  },
  devFeedback: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  firstBloomCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  firstBloomTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    color: palette.textPrimary,
  },
  firstBloomBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSecondary,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  milestoneStep: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  milestoneDot: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneNum: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.accentMoss,
    fontVariant: ['tabular-nums'],
  },
  milestoneLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textSecondary,
  },
  milestoneLine: {
    flex: 1,
    height: 1,
    backgroundColor: palette.border,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.xs,
  },
});
