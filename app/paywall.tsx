import { useRouter } from 'expo-router';
import { Check, Sparkles, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { trackEvent } from '@/services/analyticsService';
import {
  getOfferings,
  purchasePlan,
  restorePurchases,
  type PlanId,
  type PurchaseOffering,
} from '@/services/purchasesService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, motion, palette, radii, spacing } from '@/theme/tokens';
import { hapticSelection, hapticSuccess } from '@/utils/haptics';

const PRO_BENEFITS = [
  'All botanical flora, stone lanterns, and meadow critters',
  'Deeper sleep and movement patterns with Keeper reflections',
  'All Home Screen widget sizes synced with time of day',
  'Cloud backup across devices with zero ads, ever',
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const isPro = useSanctuaryStore((s) => s.profile.isPro);

  const [offerings, setOfferings] = useState<PurchaseOffering[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('annual_pro');
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getOfferings().then((items) => {
      if (active) {
        setOfferings(items);
        const recommended = items.find((item) => item.recommended);
        if (recommended) {
          setSelectedPlanId(recommended.id);
        }
      }
    });

    trackEvent('paywall_viewed', {
      placement: 'onboarding',
      offering_id: 'default',
    });

    return () => {
      active = false;
    };
  }, []);

  const selectedOffering =
    offerings.find((item) => item.id === selectedPlanId) ?? offerings[0];

  const primaryCtaLabel = (() => {
    if (isPro) {
      return 'Return to your sanctuary';
    }
    if (!selectedOffering) {
      return 'Start 7-day free trial';
    }
    if (selectedOffering.trialDays > 0) {
      return 'Start 7-day free trial';
    }
    if (selectedOffering.id === 'lifetime_pro') {
      return 'Unlock Lifetime Pro';
    }
    return 'Continue with Monthly Pro';
  })();

  const navigateToSanctuary = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/sanctuary');
    }
  };

  const handlePurchase = async () => {
    if (isPro) {
      navigateToSanctuary();
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await purchasePlan(selectedPlanId);
      if (!result.ok || !result.entitlement.isPro) {
        setFeedback(result.error ?? 'Purchase was not completed. Nothing was charged.');
        return;
      }

      useSanctuaryStore.setState((state) => ({
        profile: {
          ...state.profile,
          isPro: true,
        },
      }));

      const planInfo = offerings.find((item) => item.id === result.planId);
      const eventName = result.entitlement.isTrial
        ? 'trial_started'
        : 'subscription_purchased';

      trackEvent(eventName, {
        plan: planInfo?.analyticsPlan ?? 'annual',
        price_usd: planInfo?.priceUsd ?? 19.99,
      });

      hapticSuccess();
      navigateToSanctuary();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setFeedback(null);
    try {
      const entitlement = await restorePurchases();
      if (entitlement.isPro) {
        useSanctuaryStore.setState((state) => ({
          profile: {
            ...state.profile,
            isPro: true,
          },
        }));
        hapticSuccess();
        setFeedback('Pro sanctuary restored on this device.');
      } else {
        setFeedback('No active Pro subscription found for this account.');
      }
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={navigateToSanctuary}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close paywall and continue with free basic garden"
            style={styles.closeButton}
          >
            <X size={20} strokeWidth={1.5} color={palette.textSecondary} />
          </Pressable>
        </View>

        <Animated.View
          entering={
            reducedMotion ? undefined : FadeInDown.duration(motion.enterMs)
          }
          style={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.eyebrowPill}>
              <Sparkles size={14} strokeWidth={1.5} color={palette.accentMoss} />
              <Text style={styles.eyebrowText}>Dew & Bloom Pro</Text>
            </View>
            <Text style={styles.title}>Grow a deeper sanctuary</Text>
            <Text style={styles.subtitle}>
              Try Pro free for 7 days. Cancel anytime, or stay on the free meadow forever.
            </Text>
          </View>

          <View style={styles.benefitsCard}>
            {PRO_BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <View style={styles.checkBadge}>
                  <Check size={14} strokeWidth={1.75} color={palette.accentMoss} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plansStack}>
            {offerings.map((plan) => {
              const selected = plan.id === selectedPlanId;
              const isRecommended = plan.recommended;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => {
                    if (plan.id !== selectedPlanId) {
                      hapticSelection();
                    }
                    setSelectedPlanId(plan.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${plan.title}, ${plan.priceLabel}`}
                  style={[
                    styles.planCard,
                    isRecommended && styles.planCardRecommended,
                    selected && styles.planCardSelected,
                  ]}
                >
                  <View style={styles.planLeft}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      {plan.badgeLabel ? (
                        <View style={styles.recommendedPill}>
                          <Text style={styles.recommendedPillText}>
                            {plan.badgeLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {plan.trialLabel ? (
                      <Text style={styles.planMeta}>{plan.trialLabel}</Text>
                    ) : (
                      <Text style={styles.planMeta}>
                        {plan.id === 'lifetime_pro'
                          ? 'One-time unlock, no renewal'
                          : 'Billed monthly, cancel anytime'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.planRight}>
                    <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                    {plan.subPriceLabel ? (
                      <Text style={styles.planSubPrice}>{plan.subPriceLabel}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

          <View style={styles.actions}>
            <BotanicalButton
              label={submitting ? 'Starting trial...' : primaryCtaLabel}
              onPress={handlePurchase}
              disabled={submitting || restoring}
              fullWidth
              testID="paywall-primary-cta"
            />
            <BotanicalButton
              label="Continue with free basic garden"
              onPress={navigateToSanctuary}
              variant="ghost"
              disabled={submitting || restoring}
              fullWidth
              testID="paywall-free-cta"
            />
          </View>

          <Pressable
            onPress={handleRestore}
            disabled={submitting || restoring}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Restore purchases"
            style={styles.restoreButton}
          >
            <Text style={styles.restoreText}>
              {restoring ? 'Checking purchases...' : 'Restore purchases'}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  content: {
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  eyebrowText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: palette.accentMoss,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: palette.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  benefitsCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textPrimary,
  },
  plansStack: {
    gap: spacing.md,
  },
  planCard: {
    minHeight: 72,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  planCardRecommended: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.accentMoss,
  },
  planCardSelected: {
    backgroundColor: palette.surfaceElevated,
    borderWidth: 2,
    borderColor: palette.accentMoss,
  },
  planLeft: {
    flex: 1,
    gap: spacing.xs,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  planTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: palette.textPrimary,
  },
  recommendedPill: {
    backgroundColor: palette.accentMoss,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  recommendedPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
    color: palette.accentMossText,
  },
  planMeta: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  planPrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  planSubPrice: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  feedbackText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  restoreButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
  },
  restoreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
  },
});
