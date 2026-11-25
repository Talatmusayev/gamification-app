import { useRouter } from 'expo-router';
import { ArrowLeft, Cloud, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { signInWithEmail, signUpWithEmail } from '@/services/authService';
import { isSupabaseConfigured } from '@/services/supabase';
import { syncProfileGoals } from '@/services/syncService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, palette, radii, spacing } from '@/theme/tokens';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const profile = useSanctuaryStore((s) => s.profile);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const handleContinueOffline = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/sanctuary');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result =
        mode === 'signin'
          ? await signInWithEmail(trimmedEmail, password)
          : await signUpWithEmail(trimmedEmail, password);

      if (!result.ok) {
        setErrorMessage(result.error ?? 'Unable to complete request.');
        return;
      }

      if (result.user) {
        await syncProfileGoals({
          sleepGoalMin: profile.sleepGoalMin,
          stepGoal: profile.stepGoal,
          trackingMode: profile.trackingMode,
          onboardingCompleted: profile.onboardingCompleted,
        });
      }

      if (mode === 'signup' && !result.user) {
        setStatusMessage('Account created. Check your inbox to confirm your email.');
        return;
      }

      handleContinueOffline();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={handleContinueOffline}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <ArrowLeft size={20} strokeWidth={1.5} color={palette.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.header}>
            <View style={styles.badge}>
              <Cloud size={14} strokeWidth={1.5} color={palette.accentMoss} />
              <Text style={styles.badgeText}>Optional cloud sanctuary</Text>
            </View>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Welcome back to your meadow' : 'Keep your garden safe'}
            </Text>
            <Text style={styles.subtitle}>
              Sign in to back up your daily logs and garden placements, or continue offline anytime.
            </Text>
          </View>

          <View style={styles.segmented}>
            <Pressable
              onPress={() => {
                setMode('signin');
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'signin' }}
              style={[styles.segmentItem, mode === 'signin' && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'signin' && styles.segmentTextActive,
                ]}
              >
                Sign in
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('signup');
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === 'signup' }}
              style={[styles.segmentItem, mode === 'signup' && styles.segmentActive]}
            >
              <Text
                style={[
                  styles.segmentText,
                  mode === 'signup' && styles.segmentTextActive,
                ]}
              >
                Create account
              </Text>
            </Pressable>
          </View>

          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputRow}>
                <Mail size={18} strokeWidth={1.5} color={palette.textMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={palette.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  accessibilityLabel="Email address"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} strokeWidth={1.5} color={palette.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={palette.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={mode === 'signin' ? 'password' : 'newPassword'}
                  accessibilityLabel="Password"
                  style={styles.input}
                />
              </View>
            </View>

            {!configured ? (
              <Text style={styles.noticeText}>
                Cloud sync is not configured in this build. You can still use your garden offline.
              </Text>
            ) : null}

            {errorMessage ? (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {errorMessage}
              </Text>
            ) : null}

            {statusMessage ? (
              <Text style={styles.statusText} accessibilityLiveRegion="polite">
                {statusMessage}
              </Text>
            ) : null}

            <BotanicalButton
              label={
                submitting
                  ? 'Please wait...'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'
              }
              onPress={() => {
                void handleSubmit();
              }}
              disabled={submitting || !configured}
              fullWidth
            />
          </View>

          <BotanicalButton
            label="Continue offline"
            variant="secondary"
            onPress={handleContinueOffline}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  header: {
    gap: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.accentMoss,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: palette.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  segmentActive: {
    backgroundColor: palette.surfaceElevated,
  },
  segmentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: palette.textSecondary,
  },
  segmentTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: palette.textPrimary,
  },
  formCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    backgroundColor: palette.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: palette.textPrimary,
    paddingVertical: spacing.sm,
  },
  noticeText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: palette.danger,
  },
  statusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: palette.accentMoss,
  },
});
