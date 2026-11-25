import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  Minus,
  Moon,
  Plus,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import {
  BotanicalIllustration,
  type BotanicalIllustrationVariant,
} from '@/components/ui/BotanicalIllustration';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { LiquidDewEmblem } from '@/components/ui/LiquidDewEmblem';
import { SanctuaryCompanion } from '@/components/ui/SanctuaryCompanion';
import { SUNLIT_MEADOW_CATALOG } from '@/domain/catalog';
import {
  calculateDewReward,
  calculateSunlightReward,
} from '@/domain/economy';
import type { CatalogItem, TrackingMode } from '@/domain/types';
import { trackEvent } from '@/services/analyticsService';
import { requestHealthPermissions } from '@/services/healthService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, palette, radii, spacing, springs } from '@/theme/tokens';

const TOTAL_STEPS = 4;

const MIN_SLEEP_MIN = 360; // 6.0h
const MAX_SLEEP_MIN = 600; // 10.0h
const SLEEP_STEP_MIN = 30; // 0.5h
const DEFAULT_SLEEP_MIN = 450; // 7.5h

const MIN_STEP_GOAL = 2000;
const MAX_STEP_GOAL = 15000;
const STEP_INCREMENT = 500;
const DEFAULT_STEP_GOAL = 6000;

const STARTER_IDS = ['lavender', 'bonsai_sprout', 'sunlit_fern'] as const;
type StarterId = (typeof STARTER_IDS)[number];

const SANCTUARY_PRESETS = [
  'Sunlit Meadow',
  'Moss Hollow',
  'Morning Glade',
  'Cedar Nook',
] as const;

function triggerLightHaptic() {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

function formatSleepHours(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(1)} hrs`;
}

function formatSteps(steps: number): string {
  return steps.toLocaleString('en-US');
}

export default function OnboardingScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const completeOnboarding = useSanctuaryStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<number>(1);
  const [sanctuaryName, setSanctuaryName] = useState<string>('Sunlit Meadow');
  const [sleepGoalMin, setSleepGoalMin] = useState<number>(DEFAULT_SLEEP_MIN);
  const [stepGoal, setStepGoal] = useState<number>(DEFAULT_STEP_GOAL);
  const [starterItemId, setStarterItemId] = useState<StarterId>('lavender');
  const [starterWatered, setStarterWatered] = useState<boolean>(false);
  const [pipHopCount, setPipHopCount] = useState<number>(0);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('phone_only');
  const [submitting, setSubmitting] = useState(false);

  const sproutScale = useSharedValue(1);
  const dropRingOpacity = useSharedValue(0);
  const dropRingScale = useSharedValue(0.7);

  useEffect(() => {
    trackEvent('onboarding_started');
  }, []);

  const starterItems = useMemo<CatalogItem[]>(() => {
    return STARTER_IDS.map((id) =>
      SUNLIT_MEADOW_CATALOG.find((item) => item.id === id),
    ).filter((item): item is CatalogItem => Boolean(item));
  }, []);

  const selectedStarter = useMemo(
    () =>
      starterItems.find((item) => item.id === starterItemId) ?? starterItems[0],
    [starterItemId, starterItems],
  );

  const projectedDew = useMemo(
    () => calculateDewReward(sleepGoalMin, sleepGoalMin, 0),
    [sleepGoalMin],
  );
  const projectedSunlight = useMemo(
    () => calculateSunlightReward(stepGoal, stepGoal),
    [stepGoal],
  );

  const handleBack = () => {
    if (step <= 1 || submitting) {
      return;
    }
    triggerLightHaptic();
    setStep((prev) => prev - 1);
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      triggerLightHaptic();
      setStep((prev) => prev + 1);
      return;
    }

    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      let resolvedTrackingMode: TrackingMode = trackingMode;
      if (trackingMode === 'health_sync') {
        const permission = await requestHealthPermissions();
        trackEvent('health_permission_result', {
          platform: permission.platform,
          status: permission.status,
        });
        if (!permission.granted) {
          resolvedTrackingMode = 'phone_only';
        }
      }

      completeOnboarding({
        sanctuaryName: sanctuaryName.trim() || 'Sunlit Meadow',
        sleepGoalMin,
        stepGoal,
        starterItemId,
        trackingMode: resolvedTrackingMode,
        starterWatered,
      });
      trackEvent('onboarding_completed', {
        tracking_mode: resolvedTrackingMode,
      });
      router.replace('/paywall?source=onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  const adjustSleep = (delta: number) => {
    const next = Math.min(
      MAX_SLEEP_MIN,
      Math.max(MIN_SLEEP_MIN, sleepGoalMin + delta),
    );
    if (next !== sleepGoalMin) {
      triggerLightHaptic();
      setSleepGoalMin(next);
    }
  };

  const adjustSteps = (delta: number) => {
    const next = Math.min(
      MAX_STEP_GOAL,
      Math.max(MIN_STEP_GOAL, stepGoal + delta),
    );
    if (next !== stepGoal) {
      triggerLightHaptic();
      setStepGoal(next);
    }
  };

  const handleSelectStarter = (id: StarterId) => {
    if (id !== starterItemId) {
      triggerLightHaptic();
      setStarterItemId(id);
      setStarterWatered(false);
    }
  };

  const handleWaterStarterPreview = () => {
    triggerLightHaptic();
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setStarterWatered(true);
    setPipHopCount((prev) => prev + 1);

    if (!reducedMotion) {
      sproutScale.value = withSequence(
        withTiming(1.16, { duration: 150, easing: Easing.out(Easing.quad) }),
        withSpring(1, springs.pop),
      );
      dropRingScale.value = 0.72;
      dropRingOpacity.value = 0.85;
      dropRingScale.value = withTiming(1.45, {
        duration: 540,
        easing: Easing.out(Easing.cubic),
      });
      dropRingOpacity.value = withTiming(0, {
        duration: 540,
        easing: Easing.out(Easing.cubic),
      });
    }
  };

  const handleSelectTracking = (mode: TrackingMode) => {
    if (mode !== trackingMode) {
      triggerLightHaptic();
      setTrackingMode(mode);
    }
  };

  const sproutAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sproutScale.value }],
  }));

  const dropRingAnimStyle = useAnimatedStyle(() => ({
    opacity: dropRingOpacity.value,
    transform: [{ scale: dropRingScale.value }],
  }));

  const enteringAnim = reducedMotion ? undefined : FadeInDown.duration(240);

  const ctaLabel =
    step === 1
      ? 'Begin your sanctuary'
      : step === TOTAL_STEPS
        ? trackingMode === 'health_sync'
          ? 'Allow health access & continue'
          : 'Plant & enter meadow'
        : 'Continue';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Top navigation & quiet progress bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {step > 1 ? (
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressedSoft,
              ]}
            >
              <ChevronLeft
                size={20}
                strokeWidth={1.5}
                color={palette.textPrimary}
              />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
        </View>

        <View
          style={styles.progressTrack}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
            const segmentStep = index + 1;
            const filled = segmentStep <= step;
            return (
              <View
                key={segmentStep}
                style={[
                  styles.progressSegment,
                  filled && styles.progressSegmentActive,
                ]}
              />
            );
          })}
        </View>

        <Text style={styles.stepCounter} accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}`}>
          {step}/{TOTAL_STEPS}
        </Text>
      </View>

      {/* Main step body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <Animated.View
          key={`onboarding-step-${step}`}
          entering={enteringAnim}
          style={styles.stepBody}
        >
          {step === 1 && (
            <View style={styles.welcomeContainer}>
              <View style={styles.emblemWrap}>
                <LiquidDewEmblem size={68} />
              </View>

              <View style={styles.illustrationFrame}>
                <BotanicalIllustration variant="welcome_sanctuary" size={248} />
              </View>

              <View style={styles.copyBlock}>
                <Text style={styles.eyebrow}>Dewy</Text>
                <Text style={styles.heading}>
                  Your sleep &amp; steps grow a living sanctuary
                </Text>
                <Text style={styles.body}>
                  Restful nights gather morning dew and daily walks bring warm
                  sunlight. No punishing streaks, just a quiet meadow that
                  blooms at your own pace.
                </Text>
              </View>

              <View style={styles.pipGreetingCard}>
                <SanctuaryCompanion size={50} />
                <View style={styles.pipGreetingCopy}>
                  <Text style={styles.pipGreetingTitle}>
                    Pip is waiting in {sanctuaryName.trim() || 'Sunlit Meadow'}
                  </Text>
                  <Text style={styles.pipGreetingText}>
                    A quiet clearing kept by your pocket garden sprite. Nothing here resets to zero.
                  </Text>
                </View>
              </View>

              <View style={styles.namingCard}>
                <Text style={styles.namingLabel}>Name your sanctuary</Text>
                <TextInput
                  value={sanctuaryName}
                  onChangeText={setSanctuaryName}
                  placeholder="Sunlit Meadow"
                  placeholderTextColor={palette.textMuted}
                  maxLength={28}
                  accessibilityLabel="Sanctuary name"
                  style={styles.namingInput}
                />
                <View style={styles.presetRow}>
                  {SANCTUARY_PRESETS.map((preset) => {
                    const active = sanctuaryName.trim() === preset;
                    return (
                      <Pressable
                        key={preset}
                        onPress={() => {
                          triggerLightHaptic();
                          setSanctuaryName(preset);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        style={({ pressed }) => [
                          styles.presetChip,
                          active && styles.presetChipActive,
                          pressed && styles.pressedSoft,
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            active && styles.presetChipTextActive,
                          ]}
                        >
                          {preset}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.resourceList}>
                <View style={styles.resourceRow}>
                  <View style={[styles.resourceIconWrap, styles.dewTint]}>
                    <Droplets
                      size={18}
                      strokeWidth={1.5}
                      color={palette.accentDew}
                    />
                  </View>
                  <View style={styles.resourceText}>
                    <Text style={styles.resourceTitle}>Morning dew</Text>
                    <Text style={styles.resourceCaption}>
                      Earned from steady, restorative sleep
                    </Text>
                  </View>
                </View>

                <View style={styles.resourceDivider} />

                <View style={styles.resourceRow}>
                  <View style={[styles.resourceIconWrap, styles.sunTint]}>
                    <Sun
                      size={18}
                      strokeWidth={1.5}
                      color={palette.accentSunlight}
                    />
                  </View>
                  <View style={styles.resourceText}>
                    <Text style={styles.resourceTitle}>Warm sunlight</Text>
                    <Text style={styles.resourceCaption}>
                      Gathered gently from your daily steps
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.sectionContainer}>
              <View style={styles.copyBlock}>
                <Text style={styles.heading}>Set your daily rhythm</Text>
                <Text style={styles.body}>
                  Choose targets that feel sustainable. You can adjust them
                  anytime as your weeks change.
                </Text>
              </View>

              {/* Sleep goal card */}
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={[styles.resourceIconWrap, styles.dewTint]}>
                    <Moon
                      size={18}
                      strokeWidth={1.5}
                      color={palette.accentDew}
                    />
                  </View>
                  <View style={styles.goalTitleWrap}>
                    <Text style={styles.goalLabel}>Sleep goal</Text>
                    <Text style={styles.goalHint}>Between 6.0 and 10.0 hours</Text>
                  </View>
                </View>

                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => adjustSleep(-SLEEP_STEP_MIN)}
                    disabled={sleepGoalMin <= MIN_SLEEP_MIN}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease sleep goal by 30 minutes"
                    accessibilityState={{
                      disabled: sleepGoalMin <= MIN_SLEEP_MIN,
                    }}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      sleepGoalMin <= MIN_SLEEP_MIN && styles.stepperDisabled,
                      pressed && styles.pressedSoft,
                    ]}
                  >
                    <Minus
                      size={18}
                      strokeWidth={1.5}
                      color={palette.textPrimary}
                    />
                  </Pressable>

                  <Text
                    style={styles.goalValue}
                    accessibilityLiveRegion="polite"
                  >
                    {formatSleepHours(sleepGoalMin)}
                  </Text>

                  <Pressable
                    onPress={() => adjustSleep(SLEEP_STEP_MIN)}
                    disabled={sleepGoalMin >= MAX_SLEEP_MIN}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Increase sleep goal by 30 minutes"
                    accessibilityState={{
                      disabled: sleepGoalMin >= MAX_SLEEP_MIN,
                    }}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      sleepGoalMin >= MAX_SLEEP_MIN && styles.stepperDisabled,
                      pressed && styles.pressedSoft,
                    ]}
                  >
                    <Plus
                      size={18}
                      strokeWidth={1.5}
                      color={palette.textPrimary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Step goal card */}
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={[styles.resourceIconWrap, styles.sunTint]}>
                    <Footprints
                      size={18}
                      strokeWidth={1.5}
                      color={palette.accentSunlight}
                    />
                  </View>
                  <View style={styles.goalTitleWrap}>
                    <Text style={styles.goalLabel}>Daily step goal</Text>
                    <Text style={styles.goalHint}>
                      Between 2,000 and 15,000 steps
                    </Text>
                  </View>
                </View>

                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => adjustSteps(-STEP_INCREMENT)}
                    disabled={stepGoal <= MIN_STEP_GOAL}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease daily step goal by 500 steps"
                    accessibilityState={{ disabled: stepGoal <= MIN_STEP_GOAL }}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      stepGoal <= MIN_STEP_GOAL && styles.stepperDisabled,
                      pressed && styles.pressedSoft,
                    ]}
                  >
                    <Minus
                      size={18}
                      strokeWidth={1.5}
                      color={palette.textPrimary}
                    />
                  </Pressable>

                  <Text
                    style={styles.goalValue}
                    accessibilityLiveRegion="polite"
                  >
                    {formatSteps(stepGoal)}
                  </Text>

                  <Pressable
                    onPress={() => adjustSteps(STEP_INCREMENT)}
                    disabled={stepGoal >= MAX_STEP_GOAL}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Increase daily step goal by 500 steps"
                    accessibilityState={{ disabled: stepGoal >= MAX_STEP_GOAL }}
                    style={({ pressed }) => [
                      styles.stepperButton,
                      stepGoal >= MAX_STEP_GOAL && styles.stepperDisabled,
                      pressed && styles.pressedSoft,
                    ]}
                  >
                    <Plus
                      size={18}
                      strokeWidth={1.5}
                      color={palette.textPrimary}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Positive projected morning payout */}
              <View style={styles.rhythmPreviewCard}>
                <View style={styles.rhythmPreviewBadge}>
                  <Sparkles size={14} strokeWidth={1.6} color={palette.accentMoss} />
                  <Text style={styles.rhythmPreviewHeading}>
                    Your morning reward preview
                  </Text>
                </View>
                <Text style={styles.rhythmPreviewCopy}>
                  At this gentle rhythm, a restful night gathers up to{' '}
                  <Text style={styles.rhythmPreviewNum}>{projectedDew} Dew</Text> and{' '}
                  <Text style={styles.rhythmPreviewNum}>
                    {projectedSunlight} Sunlight
                  </Text>{' '}
                  for {sanctuaryName.trim() || 'your sanctuary'} — zero streak penalties if you miss a day.
                </Text>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.sectionContainer}>
              <View style={styles.copyBlock}>
                <Text style={styles.heading}>Choose your first seedling</Text>
                <Text style={styles.body}>
                  We will plant it at the heart of your sunlit meadow to welcome
                  your first morning.
                </Text>
              </View>

              <View style={styles.cardStack}>
                {starterItems.map((item) => {
                  const isSelected = item.id === starterItemId;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectStarter(item.id as StarterId)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.name}. ${item.description}`}
                      accessibilityState={{ selected: isSelected }}
                      style={({ pressed }) => [
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                        pressed && styles.pressedSoft,
                      ]}
                    >
                      <BotanicalIllustration
                        variant={item.assetKey as BotanicalIllustrationVariant}
                        size={60}
                      />

                      <View style={styles.optionCopy}>
                        <Text style={styles.optionTitle}>{item.name}</Text>
                        <Text style={styles.optionDescription}>
                          {item.description}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.checkCircle,
                          isSelected && styles.checkCircleSelected,
                        ]}
                      >
                        {isSelected ? (
                          <Check
                            size={14}
                            strokeWidth={2}
                            color={palette.accentMossText}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Interactive First Clearing Moment (Endowment + Reward before Paywall) */}
              {selectedStarter ? (
                <View style={styles.firstDropStage}>
                  <View style={styles.firstDropStageTop}>
                    <SanctuaryCompanion size={46} hopTrigger={pipHopCount} />
                    <View style={styles.firstDropSpriteWrap}>
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.firstDropRing, dropRingAnimStyle]}
                      />
                      <Animated.View style={sproutAnimStyle}>
                        <GardenSprite
                          assetKey={selectedStarter.assetKey}
                          size={72}
                          growthStage={starterWatered ? 2 : 1}
                        />
                      </Animated.View>
                    </View>
                  </View>

                  <Text style={styles.firstDropTitle}>
                    {starterWatered
                      ? `${selectedStarter.name} · Budding (2/3)`
                      : `${selectedStarter.name} · Seeded (1/3)`}
                  </Text>
                  <Text style={styles.firstDropCaption}>
                    {starterWatered
                      ? 'Your first morning drop awakened a new bud. It stays bloomed inside your clearing.'
                      : 'Tap once below to give your first welcome drop before entering the full meadow.'}
                  </Text>

                  <Pressable
                    onPress={handleWaterStarterPreview}
                    disabled={starterWatered}
                    accessibilityRole="button"
                    accessibilityLabel={
                      starterWatered
                        ? `${selectedStarter.name} welcomed with morning dew`
                        : `Give first morning drop to ${selectedStarter.name}`
                    }
                    style={({ pressed }) => [
                      styles.firstDropButton,
                      starterWatered && styles.firstDropButtonDone,
                      pressed && !starterWatered && styles.pressedSoft,
                    ]}
                  >
                    <Droplets
                      size={16}
                      strokeWidth={1.7}
                      color={
                        starterWatered ? palette.accentMoss : palette.accentMossText
                      }
                    />
                    <Text
                      style={[
                        styles.firstDropButtonText,
                        starterWatered && styles.firstDropButtonTextDone,
                      ]}
                    >
                      {starterWatered
                        ? 'First morning drop given'
                        : 'Give first morning drop · Free gift'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}

          {step === 4 && (
            <View style={styles.sectionContainer}>
              <View style={styles.copyBlock}>
                <Text style={styles.heading}>How would you like to track</Text>
                <Text style={styles.body}>
                  Start with your phone right away using Goodnight Lantern, or
                  connect Apple Health and Health Connect for automatic sync.
                </Text>
              </View>

              <View style={styles.cardStack}>
                <Pressable
                  onPress={() => handleSelectTracking('phone_only')}
                  accessibilityRole="button"
                  accessibilityLabel="Phone-Only Goodnight Lantern, ready today"
                  accessibilityState={{
                    selected: trackingMode === 'phone_only',
                  }}
                  style={({ pressed }) => [
                    styles.trackingCard,
                    trackingMode === 'phone_only' && styles.optionCardSelected,
                    pressed && styles.pressedSoft,
                  ]}
                >
                  <View style={styles.trackingTopRow}>
                    <View style={[styles.resourceIconWrap, styles.mossTint]}>
                      <Flame
                        size={18}
                        strokeWidth={1.5}
                        color={palette.accentMoss}
                      />
                    </View>
                    <View style={styles.readyBadge}>
                      <Text style={styles.readyBadgeText}>Ready today</Text>
                    </View>
                    <View style={styles.spacer} />
                    <View
                      style={[
                        styles.checkCircle,
                        trackingMode === 'phone_only' &&
                          styles.checkCircleSelected,
                      ]}
                    >
                      {trackingMode === 'phone_only' ? (
                        <Check
                          size={14}
                          strokeWidth={2}
                          color={palette.accentMossText}
                        />
                      ) : null}
                    </View>
                  </View>

                  <Text style={styles.optionTitle}>
                    Phone-Only Goodnight Lantern
                  </Text>
                  <Text style={styles.optionDescription}>
                    Light your bedside lantern before sleep and greet the
                    morning reveal when you wake. No wearable needed.
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectTracking('health_sync')}
                  accessibilityRole="button"
                  accessibilityLabel="Health Sync, automatic Apple Health and Health Connect"
                  accessibilityState={{
                    selected: trackingMode === 'health_sync',
                  }}
                  style={({ pressed }) => [
                    styles.trackingCard,
                    trackingMode === 'health_sync' && styles.optionCardSelected,
                    pressed && styles.pressedSoft,
                  ]}
                >
                  <View style={styles.trackingTopRow}>
                    <View style={[styles.resourceIconWrap, styles.dewTint]}>
                      <HeartPulse
                        size={18}
                        strokeWidth={1.5}
                        color={palette.accentDew}
                      />
                    </View>
                    <View style={styles.mutedBadge}>
                      <Text style={styles.mutedBadgeText}>
                        Automatic
                      </Text>
                    </View>
                    <View style={styles.spacer} />
                    <View
                      style={[
                        styles.checkCircle,
                        trackingMode === 'health_sync' &&
                          styles.checkCircleSelected,
                      ]}
                    >
                      {trackingMode === 'health_sync' ? (
                        <Check
                          size={14}
                          strokeWidth={2}
                          color={palette.accentMossText}
                        />
                      ) : null}
                    </View>
                  </View>

                  <Text style={styles.optionTitle}>Health Sync</Text>
                  <Text style={styles.optionDescription}>
                    Read sleep and daily steps automatically from Apple Health
                    or Android Health Connect, with Goodnight Lantern anytime.
                  </Text>
                </Pressable>
              </View>

              {trackingMode === 'health_sync' ? (
                <View style={styles.privacyPledgeCard}>
                  <View style={styles.privacyPledgeHeader}>
                    <ShieldCheck
                      size={18}
                      strokeWidth={1.6}
                      color={palette.accentDew}
                    />
                    <Text style={styles.privacyPledgeTitle}>
                      Read-only health privacy pledge
                    </Text>
                  </View>
                  <Text style={styles.privacyPledgeBody}>
                    Dewy reads only sleep duration and daily step count. Your records stay on your device or private backup — never sold and never shared with ad networks. Declining still opens {sanctuaryName.trim() || 'your sanctuary'} with Goodnight Lantern.
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom anchored CTA */}
      <View style={styles.footer}>
        <BotanicalButton
          label={submitting ? 'Setting up sanctuary...' : ctaLabel}
          onPress={() => {
            void handleNext();
          }}
          disabled={submitting}
          fullWidth
          iconRight={
            step < TOTAL_STEPS ? (
              <ArrowRight
                size={18}
                strokeWidth={1.5}
                color={palette.accentMossText}
              />
            ) : undefined
          }
          accessibilityLabel={ctaLabel}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerLeft: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  backPlaceholder: {
    width: 44,
    height: 44,
  },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
  },
  progressSegmentActive: {
    backgroundColor: palette.accentMoss,
  },
  stepCounter: {
    width: 36,
    textAlign: 'right',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stepBody: {
    flex: 1,
  },
  welcomeContainer: {
    gap: spacing.xl,
  },
  emblemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionContainer: {
    gap: spacing.xl,
  },
  copyBlock: {
    gap: spacing.sm,
  },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.accentMoss,
  },
  heading: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    lineHeight: 35,
    color: palette.textPrimary,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  resourceList: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resourceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dewTint: {
    backgroundColor: 'rgba(55, 102, 117, 0.10)',
  },
  sunTint: {
    backgroundColor: 'rgba(168, 109, 36, 0.11)',
  },
  mossTint: {
    backgroundColor: 'rgba(54, 94, 68, 0.11)',
  },
  resourceText: {
    flex: 1,
    gap: 2,
  },
  resourceTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: palette.textPrimary,
  },
  resourceCaption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
  },
  resourceDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
  },
  goalCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  goalTitleWrap: {
    flex: 1,
    gap: 2,
  },
  goalLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: palette.textPrimary,
  },
  goalHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textMuted,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.xs,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisabled: {
    opacity: 0.35,
  },
  goalValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  cardStack: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.lg,
    minHeight: 88,
  },
  optionCardSelected: {
    borderColor: palette.accentMoss,
    backgroundColor: '#F6F9F6',
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: palette.textPrimary,
  },
  optionDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surfaceElevated,
  },
  checkCircleSelected: {
    backgroundColor: palette.accentMoss,
    borderColor: palette.accentMoss,
  },
  trackingCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  trackingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  readyBadge: {
    backgroundColor: 'rgba(54, 94, 68, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  readyBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.accentMoss,
  },
  mutedBadge: {
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  mutedBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textMuted,
  },
  spacer: {
    flex: 1,
  },
  pressedSoft: {
    opacity: 0.85,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.bg,
  },
  pipGreetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pipGreetingCopy: {
    flex: 1,
    gap: 2,
  },
  pipGreetingTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  pipGreetingText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  namingCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  namingLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  namingInput: {
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: palette.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: palette.accentMoss,
    borderColor: palette.accentMoss,
  },
  presetChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textSecondary,
  },
  presetChipTextActive: {
    color: palette.accentMossText,
  },
  rhythmPreviewCard: {
    backgroundColor: 'rgba(54, 94, 68, 0.08)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(54, 94, 68, 0.2)',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  rhythmPreviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rhythmPreviewHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.accentMoss,
  },
  rhythmPreviewCopy: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
  },
  rhythmPreviewNum: {
    fontFamily: fonts.bodySemiBold,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  firstDropStage: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  firstDropStageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xs,
  },
  firstDropSpriteWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstDropRing: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: palette.accentDew,
    backgroundColor: 'rgba(55, 102, 117, 0.12)',
  },
  firstDropTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 17,
    color: palette.textPrimary,
  },
  firstDropCaption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  firstDropButton: {
    marginTop: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: palette.accentDew,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  firstDropButtonDone: {
    backgroundColor: 'rgba(54, 94, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(54, 94, 68, 0.25)',
  },
  firstDropButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.accentMossText,
  },
  firstDropButtonTextDone: {
    color: palette.accentMoss,
  },
  privacyPledgeCard: {
    backgroundColor: 'rgba(55, 102, 117, 0.08)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(55, 102, 117, 0.22)',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  privacyPledgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  privacyPledgeTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.accentDew,
  },
  privacyPledgeBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
  },
});
