import { useRouter } from 'expo-router';
import {
  Footprints,
  LayoutGrid,
  Lock,
  Moon,
  RefreshCw,
  Settings,
  Sparkles,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { GardenSprite } from '@/components/ui/GardenSprite';
import { calculateHarmonyScore } from '@/domain/fog';
import { calculateRestMomentum } from '@/domain/momentum';
import {
  getGuestPassRemainingLabel,
  hasProAccess,
} from '@/domain/subscription';
import type { DailyLog } from '@/domain/types';
import { fetchGardenKeeperInsight } from '@/services/syncService';
import { buildWidgetSnapshot } from '@/services/widgetBridge';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, palette, radii, spacing } from '@/theme/tokens';
import { hapticSelection } from '@/utils/haptics';

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
  const placements = useSanctuaryStore((s) => s.placements);
  const dailyLogs = useSanctuaryStore((s) => s.dailyLogs);
  const triggerMorningReveal = useSanctuaryStore((s) => s.triggerMorningReveal);
  const updateRevealKeeperNote = useSanctuaryStore(
    (s) => s.updateRevealKeeperNote,
  );

  const [simFeedback, setSimFeedback] = useState<string | null>(null);
  const [refreshingInsight, setRefreshingInsight] = useState(false);
  const [insightSource, setInsightSource] = useState<'ai' | 'fallback' | null>(
    null,
  );
  const lastFetchedKeyRef = useRef<string | null>(null);

  const hasPro = hasProAccess(profile);
  const guestPassLabel = !profile.isPro
    ? getGuestPassRemainingLabel(profile.guestPassEndsAt)
    : null;

  const allLogs = useMemo(() => Object.values(dailyLogs), [dailyLogs]);
  const harmony = useMemo(() => calculateHarmonyScore(allLogs), [allLogs]);
  const momentum = useMemo(
    () => calculateRestMomentum(allLogs, profile.sleepGoalMin),
    [allLogs, profile.sleepGoalMin],
  );
  const sevenDaySeries = useMemo(() => buildLastSevenDays(dailyLogs), [dailyLogs]);
  const widgetSnapshot = useMemo(
    () => buildWidgetSnapshot({ profile, placements, dailyLogs }),
    [profile, placements, dailyLogs],
  );

  const latestLog = useMemo(() => {
    if (allLogs.length === 0) {
      return null;
    }
    return [...allLogs].sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
  }, [allLogs]);

  const thirtyDaySummary = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffKey = formatDateKey(cutoff);
    const recent30 = allLogs.filter((log) => log.dateKey >= cutoffKey);
    const restfulNights = recent30.filter(
      (log) => log.sleepMin >= profile.sleepGoalMin * 0.85,
    ).length;
    const goalStepDays = recent30.filter(
      (log) => log.steps >= profile.stepGoal,
    ).length;
    return {
      loggedDays: recent30.length,
      restfulNights,
      goalStepDays,
    };
  }, [allLogs, profile.sleepGoalMin, profile.stepGoal]);

  const refreshKeeperNote = useCallback(async () => {
    if (!latestLog) {
      return;
    }
    setRefreshingInsight(true);
    try {
      const result = await fetchGardenKeeperInsight({
        sleepGoalMin: profile.sleepGoalMin,
        stepGoal: profile.stepGoal,
        recentLogs: allLogs,
        fogCleared: profile.fogLevel === 0,
      });
      setInsightSource(result.source);
      if (result.insight && result.insight !== latestLog.aiInsight) {
        updateRevealKeeperNote(latestLog.dateKey, result.insight);
      }
    } finally {
      setRefreshingInsight(false);
    }
  }, [
    allLogs,
    latestLog,
    profile.fogLevel,
    profile.sleepGoalMin,
    profile.stepGoal,
    updateRevealKeeperNote,
  ]);

  useEffect(() => {
    if (!latestLog) {
      return;
    }
    const fetchKey = `${latestLog.dateKey}:${allLogs.length}`;
    if (lastFetchedKeyRef.current === fetchKey) {
      return;
    }
    lastFetchedKeyRef.current = fetchKey;

    let active = true;
    void fetchGardenKeeperInsight({
      sleepGoalMin: profile.sleepGoalMin,
      stepGoal: profile.stepGoal,
      recentLogs: allLogs,
      fogCleared: profile.fogLevel === 0,
    }).then((result) => {
      if (!active) {
        return;
      }
      setInsightSource(result.source);
      if (result.source === 'ai' && result.insight) {
        updateRevealKeeperNote(latestLog.dateKey, result.insight);
      }
    });

    return () => {
      active = false;
    };
  }, [
    allLogs,
    latestLog,
    profile.fogLevel,
    profile.sleepGoalMin,
    profile.stepGoal,
    updateRevealKeeperNote,
  ]);

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
            <Text style={styles.title}>Meadow Almanac</Text>
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
            {hasPro
              ? 'Your 7-day rhythm and 30-day deeper meadow patterns.'
              : 'Your rolling 7-day rest and movement almanac.'}
          </Text>
          <View style={styles.tierRow}>
            <View
              style={[
                styles.tierPill,
                hasPro && styles.tierPillPro,
              ]}
            >
              <Sparkles
                size={12}
                strokeWidth={1.6}
                color={hasPro ? palette.accentMoss : palette.textMuted}
              />
              <Text
                style={[
                  styles.tierPillText,
                  hasPro && styles.tierPillTextPro,
                ]}
              >
                {profile.isPro
                  ? 'Dewy Pro · 30-day patterns'
                  : guestPassLabel
                    ? `Sunlit Guest Pass · ${guestPassLabel}`
                    : 'Free · 7-day Almanac'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {allLogs.length === 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.almanacHeading}>
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
            <View style={styles.sectionBlock}>
              <Text style={styles.harmonyHeadline}>
                {harmony.restfulDays} of {harmony.windowDays} restful days
              </Text>

              {momentum.multiplier > 1 && momentum.label ? (
                <View style={styles.momentumBadge}>
                  <Text style={styles.momentumBadgeText}>
                    {`${momentum.label} · ${momentum.multiplier}x Dew`}
                    {momentum.graceActive ? ' · Grace night' : ''}
                  </Text>
                </View>
              ) : null}

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

            <View style={styles.sectionDivider} />

            {/* 7-day Sleep Chart */}
            <View style={styles.sectionBlock}>
              <View style={styles.chartHeader}>
                <View style={styles.iconLabelRow}>
                  <Moon size={16} strokeWidth={1.5} color={palette.accentDew} />
                  <Text style={styles.almanacHeading}>Rest</Text>
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

            <View style={styles.sectionDivider} />

            {/* 7-day Steps Chart */}
            <View style={styles.sectionBlock}>
              <View style={styles.chartHeader}>
                <View style={styles.iconLabelRow}>
                  <Footprints size={16} strokeWidth={1.5} color={palette.accentSunlight} />
                  <Text style={styles.almanacHeading}>Steps</Text>
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

        <View style={styles.sectionDivider} />

        {/* Garden Keeper Almanac Note */}
        <View style={styles.keeperSection}>
          <View style={styles.keeperHeaderRow}>
            <View style={styles.iconLabelRow}>
              <Text style={styles.almanacHeading}>Garden keeper</Text>
              {insightSource === 'ai' ? (
                <View style={styles.liveAiPill}>
                  <Text style={styles.liveAiPillText}>Live note</Text>
                </View>
              ) : null}
            </View>
            {latestLog ? (
              <Pressable
                onPress={() => {
                  hapticSelection();
                  void refreshKeeperNote();
                }}
                disabled={refreshingInsight}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Refresh garden keeper reflection"
                style={styles.refreshNoteButton}
              >
                <RefreshCw
                  size={14}
                  strokeWidth={1.6}
                  color={palette.accentMoss}
                />
                <Text style={styles.refreshNoteText}>
                  {refreshingInsight ? 'Refreshing...' : 'Refresh'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.keeperBody}>
            {latestLog?.aiInsight ??
              'Your meadow is quiet and ready. Complete your first morning reveal to hear from the garden keeper.'}
          </Text>
        </View>

        <View style={styles.sectionDivider} />

        {/* 30-Day Deeper Pattern Insights: Free CTA vs Pro/Guest Pass */}
        {hasPro ? (
          <View style={styles.patternCard}>
            <View style={styles.patternHeader}>
              <View style={styles.iconLabelRow}>
                <Sparkles size={16} strokeWidth={1.6} color={palette.accentMoss} />
                <Text style={styles.almanacHeading}>30-day meadow rhythm</Text>
              </View>
              <Text style={styles.goalText}>
                {profile.isPro ? 'Pro' : 'Guest pass'}
              </Text>
            </View>
            <View style={styles.avgRow}>
              <View style={styles.avgCell}>
                <Text style={styles.avgLabel}>Days tended</Text>
                <Text style={styles.avgValue}>
                  {thirtyDaySummary.loggedDays}
                </Text>
              </View>
              <View style={styles.avgDivider} />
              <View style={styles.avgCell}>
                <Text style={styles.avgLabel}>Restful nights</Text>
                <Text style={styles.avgValue}>
                  {thirtyDaySummary.restfulNights}
                </Text>
              </View>
              <View style={styles.avgDivider} />
              <View style={styles.avgCell}>
                <Text style={styles.avgLabel}>Goal walk days</Text>
                <Text style={styles.avgValue}>
                  {thirtyDaySummary.goalStepDays}
                </Text>
              </View>
            </View>
            <Text style={styles.patternSummary}>
              {thirtyDaySummary.loggedDays === 0
                ? 'Your 30-day sleep and step trends will unfold here as morning reveals build.'
                : `${thirtyDaySummary.restfulNights} of ${thirtyDaySummary.loggedDays} tended mornings met your sleep window and ${thirtyDaySummary.goalStepDays} reached your daily walk goal.`}
            </Text>
          </View>
        ) : (
          <View style={styles.proInsightCtaCard}>
            <View style={styles.patternHeader}>
              <View style={styles.iconLabelRow}>
                <Lock size={16} strokeWidth={1.6} color={palette.accentMoss} />
                <Text style={styles.almanacHeading}>
                  30-day deeper patterns
                </Text>
              </View>
              <Text style={styles.goalText}>Pro</Text>
            </View>
            <Text style={styles.firstBloomBody}>
              Your free Almanac tracks your rolling 7 days. Unlock 30-day sleep
              and step correlations and unlimited meadow species with Dewy Pro.
            </Text>
            <BotanicalButton
              label="Explore 30-day insights"
              variant="secondary"
              onPress={() => router.push('/paywall?source=insights')}
              fullWidth
              accessibilityLabel="Explore 30-day insights with Dewy Pro"
            />
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* Home Screen Widget Sync Status Card */}
        <View style={styles.widgetCard}>
          <View style={styles.patternHeader}>
            <View style={styles.iconLabelRow}>
              <LayoutGrid size={16} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.almanacHeading}>Home Screen Widget</Text>
            </View>
            <View style={styles.widgetStatusPill}>
              <Text style={styles.widgetStatusText}>Live snapshot</Text>
            </View>
          </View>

          <View style={styles.widgetPreviewRow}>
            {widgetSnapshot.topAssetKeys.length > 0 ? (
              <View style={styles.widgetSprites}>
                {widgetSnapshot.topAssetKeys.slice(0, 4).map((assetKey) => (
                  <View key={assetKey} style={styles.widgetSpriteThumb}>
                    <GardenSprite assetKey={assetKey} size={28} />
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.widgetStatsCopy}>
              <Text style={styles.widgetStatsPrimary}>
                {widgetSnapshot.placedCount} placed · {widgetSnapshot.harmonyDays} of{' '}
                {widgetSnapshot.harmonyWindow} restful days
              </Text>
              <Text style={styles.widgetStatsSecondary}>
                {widgetSnapshot.dewBalance} Dew · {widgetSnapshot.sunlightBalance}{' '}
                Sunlight · Mist {widgetSnapshot.fogLevel}
              </Text>
            </View>
          </View>

          <Text style={styles.widgetCaption}>
            Synced automatically for iOS WidgetKit and Android Glance. Long-press
            your home screen and search Dewy to pin it.
          </Text>
        </View>

        {__DEV__ ? (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.devSection}>
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
          </>
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
    paddingBottom: spacing.xxl + spacing.lg,
    gap: spacing.xl,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    letterSpacing: -0.3,
    color: palette.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  tierRow: {
    flexDirection: 'row',
    paddingTop: spacing.xs,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tierPillPro: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.accentMoss,
  },
  tierPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  tierPillTextPro: {
    color: palette.accentMoss,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  almanacHeading: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.2,
    color: palette.textPrimary,
  },
  harmonyHeadline: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 24,
    lineHeight: 30,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.25,
  },
  momentumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  momentumBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.accentDew,
    fontVariant: ['tabular-nums'],
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
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
    fontSize: 18,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  avgDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: palette.border,
    marginHorizontal: spacing.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
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
  keeperSection: {
    gap: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: palette.accentMoss,
    paddingLeft: spacing.md,
  },
  keeperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  liveAiPill: {
    backgroundColor: palette.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  liveAiPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: palette.accentMoss,
  },
  refreshNoteButton: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  refreshNoteText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.accentMoss,
  },
  keeperBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: palette.textSecondary,
  },
  patternCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  proInsightCtaCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  patternSummary: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  widgetCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  widgetStatusPill: {
    backgroundColor: palette.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  widgetStatusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: palette.accentMoss,
  },
  widgetPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  widgetSprites: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  widgetSpriteThumb: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetStatsCopy: {
    flex: 1,
    gap: 2,
  },
  widgetStatsPrimary: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  widgetStatsSecondary: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  widgetCaption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  devSection: {
    gap: spacing.sm,
  },
  devFeedback: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  firstBloomBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
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
    borderWidth: StyleSheet.hairlineWidth,
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
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
    marginBottom: spacing.lg,
    marginHorizontal: spacing.xs,
  },
});
