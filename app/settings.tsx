import type { User } from '@supabase/supabase-js';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Cloud,
  Footprints,
  Minus,
  Moon,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatSleepDuration } from '@/components/MorningRevealModal';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { deleteAccount, getCurrentUser, signOut } from '@/services/authService';
import { syncProfileGoals } from '@/services/syncService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, palette, radii, spacing } from '@/theme/tokens';

const MIN_SLEEP_MIN = 300;
const MAX_SLEEP_MIN = 720;
const SLEEP_STEP_MIN = 15;

const MIN_STEPS = 1000;
const MAX_STEPS = 30000;
const STEPS_INCREMENT = 500;

export default function SettingsScreen() {
  const router = useRouter();
  const profile = useSanctuaryStore((s) => s.profile);
  const updateGoals = useSanctuaryStore((s) => s.updateGoals);

  const [sleepGoalMin, setSleepGoalMin] = useState(profile.sleepGoalMin);
  const [stepGoal, setStepGoal] = useState(profile.stepGoal);
  const [goalsFeedback, setGoalsFeedback] = useState<string | null>(null);
  const [savingGoals, setSavingGoals] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoadingUser(true);
      void getCurrentUser().then((current) => {
        if (active) {
          setUser(current);
          setLoadingUser(false);
        }
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/insights');
    }
  };

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    setGoalsFeedback(null);
    try {
      updateGoals(sleepGoalMin, stepGoal);
      const { synced } = await syncProfileGoals({
        sleepGoalMin,
        stepGoal,
        trackingMode: profile.trackingMode,
        onboardingCompleted: profile.onboardingCompleted,
      });
      setGoalsFeedback(
        synced ? 'Goals saved and synced to your cloud sanctuary.' : 'Goals saved on this device.',
      );
    } finally {
      setSavingGoals(false);
    }
  };

  const handleSignOut = async () => {
    setAuthFeedback(null);
    const result = await signOut();
    if (result.ok) {
      setUser(null);
      setAuthFeedback('Signed out. Your garden remains saved on this device.');
    } else {
      setAuthFeedback(result.error ?? 'Unable to sign out right now.');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      if (user) {
        const result = await deleteAccount();
        if (!result.ok || !result.deleted) {
          setDeleteError(result.error ?? 'Unable to delete cloud account right now.');
          return;
        }
      }

      useSanctuaryStore.getState().resetAllData();
      router.replace('/onboarding');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back to insights"
            style={styles.backButton}
          >
            <ArrowLeft size={20} strokeWidth={1.5} color={palette.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Daily Goals Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily rhythm goals</Text>
          <Text style={styles.cardSubtitle}>
            Gentle targets shape your morning dew and sunlight rewards.
          </Text>

          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <View style={styles.iconLabelRow}>
                <Moon size={16} strokeWidth={1.5} color={palette.accentDew} />
                <Text style={styles.goalLabel}>Sleep goal</Text>
              </View>
              <Text style={styles.goalValue}>{formatSleepDuration(sleepGoalMin)}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                onPress={() =>
                  setSleepGoalMin((prev) => Math.max(MIN_SLEEP_MIN, prev - SLEEP_STEP_MIN))
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Decrease sleep goal by 15 minutes"
                style={styles.stepperButton}
              >
                <Minus size={18} strokeWidth={1.5} color={palette.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() =>
                  setSleepGoalMin((prev) => Math.min(MAX_SLEEP_MIN, prev + SLEEP_STEP_MIN))
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Increase sleep goal by 15 minutes"
                style={styles.stepperButton}
              >
                <Plus size={18} strokeWidth={1.5} color={palette.textPrimary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <View style={styles.iconLabelRow}>
                <Footprints size={16} strokeWidth={1.5} color={palette.accentSunlight} />
                <Text style={styles.goalLabel}>Step goal</Text>
              </View>
              <Text style={styles.goalValue}>{stepGoal.toLocaleString()}</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                onPress={() =>
                  setStepGoal((prev) => Math.max(MIN_STEPS, prev - STEPS_INCREMENT))
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Decrease step goal by 500 steps"
                style={styles.stepperButton}
              >
                <Minus size={18} strokeWidth={1.5} color={palette.textPrimary} />
              </Pressable>
              <Pressable
                onPress={() =>
                  setStepGoal((prev) => Math.min(MAX_STEPS, prev + STEPS_INCREMENT))
                }
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Increase step goal by 500 steps"
                style={styles.stepperButton}
              >
                <Plus size={18} strokeWidth={1.5} color={palette.textPrimary} />
              </Pressable>
            </View>
          </View>

          {goalsFeedback ? (
            <Text style={styles.feedbackText} accessibilityLiveRegion="polite">
              {goalsFeedback}
            </Text>
          ) : null}

          <BotanicalButton
            label={savingGoals ? 'Saving...' : 'Save goals'}
            onPress={() => {
              void handleSaveGoals();
            }}
            disabled={savingGoals}
            fullWidth
          />
        </View>

        {/* Cloud Sync / Account Card */}
        <View style={styles.card}>
          <View style={styles.iconLabelRow}>
            <Cloud size={16} strokeWidth={1.5} color={palette.accentMoss} />
            <Text style={styles.cardTitle}>Cloud sanctuary</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {loadingUser
              ? 'Checking account status...'
              : user
                ? `Signed in as ${user.email ?? 'your account'}.`
                : 'Offline mode. Your garden is saved locally on this device.'}
          </Text>

          {authFeedback ? (
            <Text style={styles.feedbackText} accessibilityLiveRegion="polite">
              {authFeedback}
            </Text>
          ) : null}

          {!loadingUser ? (
            user ? (
              <BotanicalButton
                label="Sign out"
                variant="secondary"
                onPress={() => {
                  void handleSignOut();
                }}
                fullWidth
              />
            ) : (
              <BotanicalButton
                label="Sign in or create account"
                variant="secondary"
                onPress={() => router.push('/auth')}
                fullWidth
              />
            )
          ) : null}
        </View>

        {/* Danger Zone: Delete Account & All Data */}
        <View style={styles.dangerCard}>
          <View style={styles.iconLabelRow}>
            <Trash2 size={16} strokeWidth={1.5} color={palette.danger} />
            <Text style={styles.dangerTitle}>Delete account & all data</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Permanently remove your cloud account, daily logs, and local garden data from this device.
          </Text>

          {deleteError ? (
            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {deleteError}
            </Text>
          ) : null}

          {confirmingDelete ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                This action cannot be undone. Are you sure you want to delete everything?
              </Text>
              <View style={styles.confirmActions}>
                <BotanicalButton
                  label="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setConfirmingDelete(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  style={styles.flexButton}
                />
                <Pressable
                  onPress={() => {
                    void handleConfirmDelete();
                  }}
                  disabled={deleting}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm delete account and all data"
                  style={[styles.dangerButton, styles.flexButton, deleting && styles.disabled]}
                >
                  <Text style={styles.dangerButtonText}>
                    {deleting ? 'Deleting...' : 'Confirm deletion'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setConfirmingDelete(true)}
              accessibilityRole="button"
              accessibilityLabel="Delete account and all data"
              style={styles.dangerOutlineButton}
            >
              <Text style={styles.dangerOutlineText}>Delete account & all data</Text>
            </Pressable>
          )}
        </View>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backButton: {
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
  card: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
    color: palette.textPrimary,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  goalInfo: {
    gap: 2,
  },
  goalLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: palette.textSecondary,
  },
  goalValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
  },
  feedbackText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: palette.accentMoss,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: palette.danger,
  },
  dangerCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dangerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: palette.danger,
  },
  dangerOutlineButton: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  dangerOutlineText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: palette.danger,
  },
  confirmBox: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  confirmText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textPrimary,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  dangerButton: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  dangerButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: palette.accentMossText,
  },
  disabled: {
    opacity: 0.45,
  },
});
