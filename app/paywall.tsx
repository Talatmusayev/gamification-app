import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, Check, Sparkles, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShaderAtmosphere } from '@/components/garden/ShaderAtmosphere';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { LiquidDewEmblem } from '@/components/ui/LiquidDewEmblem';
import { getCatalogItemById } from '@/domain/catalog';
import {
  getGuestPassRemainingLabel,
  isGuestPassActive,
} from '@/domain/subscription';
import { trackEvent } from '@/services/analyticsService';
import {
  formatTrialTimelineCopy,
  getOfferings,
  getRecommendedOffering,
  purchasePlan,
  restorePurchases,
  type PlanId,
  type PurchaseOffering,
} from '@/services/purchasesService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { liquidGlassSurface } from '@/theme/glass';
import { fonts, motion, palette, radii, spacing } from '@/theme/tokens';
import { hapticSelection, hapticSuccess } from '@/utils/haptics';

const FALLBACK_PREVIEW_KEYS = [
  'lavender',
  'garden_robin',
  'sakura_sapling',
] as const;

export default function PaywallScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const isFromOnboarding = source === 'onboarding';
  const reducedMotion = useReducedMotion();

  const isPro = useSanctuaryStore((s) => s.profile.isPro);
  const guestPassEndsAt = useSanctuaryStore((s) => s.profile.guestPassEndsAt);
  const guestPassUsed = useSanctuaryStore((s) => s.profile.guestPassUsed);
  const trialReminderOptIn = useSanctuaryStore(
    (s) => Boolean(s.profile.trialReminderOptIn),
  );
  const placements = useSanctuaryStore((s) => s.placements);
  const activateGuestPass = useSanctuaryStore((s) => s.activateGuestPass);
  const setTrialReminderOptIn = useSanctuaryStore(
    (s) => s.setTrialReminderOptIn,
  );

  const [offerings, setOfferings] = useState<PurchaseOffering[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('annual_pro');
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getOfferings().then((items) => {
      if (!active) {
        return;
      }
      setOfferings(items);
      const recommended = getRecommendedOffering(items);
      if (recommended) {
        setSelectedPlanId(recommended.id);
      }
    });

    trackEvent('paywall_viewed', {
      placement:
        isFromOnboarding
          ? 'onboarding'
          : source === 'insights'
            ? 'insights'
            : 'shop',
      offering_id: 'default',
    });

    return () => {
      active = false;
    };
  }, [isFromOnboarding, source]);

  const primaryPlans = useMemo(
    () =>
      offerings.filter(
        (item) => item.id === 'annual_pro' || item.id === 'monthly_pro',
      ),
    [offerings],
  );
  const lifetimePlan = useMemo(
    () => offerings.find((item) => item.id === 'lifetime_pro') ?? null,
    [offerings],
  );

  const selectedOffering =
    offerings.find((item) => item.id === selectedPlanId) ??
    getRecommendedOffering(offerings);

  const previewSprites = useMemo(() => {
    const uniqueAssets: Array<{ assetKey: string; label: string }> = [];
    const seen = new Set<string>();

    for (const placement of placements) {
      const catalogItem = getCatalogItemById(placement.itemId);
      if (!catalogItem || seen.has(catalogItem.assetKey)) {
        continue;
      }
      seen.add(catalogItem.assetKey);
      uniqueAssets.push({
        assetKey: catalogItem.assetKey,
        label: catalogItem.name,
      });
      if (uniqueAssets.length >= 3) {
        break;
      }
    }

    for (const fallbackId of FALLBACK_PREVIEW_KEYS) {
      if (uniqueAssets.length >= 3) {
        break;
      }
      const fallbackItem = getCatalogItemById(fallbackId);
      if (!fallbackItem || seen.has(fallbackItem.assetKey)) {
        continue;
      }
      seen.add(fallbackItem.assetKey);
      uniqueAssets.push({
        assetKey: fallbackItem.assetKey,
        label: fallbackItem.name,
      });
    }

    return uniqueAssets;
  }, [placements]);

  const trialTimeline = useMemo(
    () => formatTrialTimelineCopy(selectedOffering?.trialDays ?? 0),
    [selectedOffering?.trialDays],
  );

  const guestPassActive = !isPro && isGuestPassActive(guestPassEndsAt);
  const guestPassRemaining = guestPassActive
    ? getGuestPassRemainingLabel(guestPassEndsAt)
    : null;

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
    if (isFromOnboarding) {
      router.replace('/(tabs)/sanctuary');
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/sanctuary');
    }
  };

  const handleContinueFree = () => {
    if (isFromOnboarding && !isPro) {
      activateGuestPass();
    }
    navigateToSanctuary();
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
        setFeedback(
          result.error ?? 'Purchase was not completed. Nothing was charged.',
        );
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
        trial_reminder_opt_in: trialReminderOptIn,
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
      <ShaderAtmosphere variant="pro" style={styles.headerAtmosphere} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          {guestPassRemaining ? (
            <View style={styles.guestPassBadge}>
              <Sparkles size={13} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.guestPassBadgeText}>
                Sunlit Guest Pass · {guestPassRemaining}
              </Text>
            </View>
          ) : (
            <View />
          )}

          <Pressable
            onPress={handleContinueFree}
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
            <View style={styles.previewStrip}>
              <LiquidDewEmblem size={46} />
              <View style={styles.floraStrip}>
                {previewSprites.map((sprite) => (
                  <View
                    key={sprite.assetKey}
                    style={styles.floraThumb}
                    accessible
                    accessibilityLabel={sprite.label}
                  >
                    <GardenSprite assetKey={sprite.assetKey} size={36} />
                  </View>
                ))}
              </View>
              <View style={styles.eyebrowPill}>
                <Sparkles size={13} strokeWidth={1.5} color={palette.accentMoss} />
                <Text style={styles.eyebrowText}>Dewy Pro</Text>
              </View>
            </View>

            <Text style={styles.title}>
              Grow a calmer sleep &amp; walk ritual in 60 seconds a morning
            </Text>
            <Text style={styles.subtitle}>
              {isPro
                ? 'Your sanctuary Pro pass is active across this meadow.'
                : isFromOnboarding
                  ? 'Unlock all 35+ plants, 30-day Keeper insights, and an ad-free meadow for 7 days free.'
                  : 'Unlock all 35+ botanical species, deeper Keeper insights, and an ad-free meadow.'}
            </Text>
          </View>

          <View style={styles.plansStack}>
            {primaryPlans.map((plan) => {
              const selected = plan.id === selectedPlanId;
              const isRecommended = plan.recommended;
              const subLine = plan.subPriceLabel
                ? plan.savingsLabel
                  ? `${plan.subPriceLabel} · ${plan.savingsLabel}`
                  : plan.subPriceLabel
                : undefined;

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
                  accessibilityLabel={`${plan.title}, ${plan.priceLabel}${plan.trialLabel ? `, ${plan.trialLabel}` : ''}`}
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
                    <Text style={styles.planMeta}>
                      {plan.trialLabel ?? 'Billed monthly, cancel anytime'}
                    </Text>
                  </View>

                  <View style={styles.planRight}>
                    <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                    {subLine ? (
                      <Text style={styles.planSubPrice}>{subLine}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {lifetimePlan ? (
            <Pressable
              onPress={() => {
                if (selectedPlanId !== lifetimePlan.id) {
                  hapticSelection();
                }
                setSelectedPlanId(lifetimePlan.id);
              }}
              hitSlop={6}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPlanId === lifetimePlan.id }}
              accessibilityLabel={`${lifetimePlan.title}, ${lifetimePlan.priceLabel}`}
              style={[
                styles.lifetimePill,
                selectedPlanId === lifetimePlan.id && styles.lifetimePillSelected,
              ]}
            >
              <Text style={styles.lifetimeLabel}>
                Prefer one-time access?{' '}
                <Text style={styles.lifetimeTitle}>{lifetimePlan.title}</Text>
              </Text>
              <Text style={styles.lifetimePrice}>{lifetimePlan.priceLabel}</Text>
            </Pressable>
          ) : null}

          {trialTimeline.length > 0 ? (
            <View style={styles.timelineCard}>
              <Text style={styles.timelineHeading}>How your free trial works</Text>
              <View style={styles.timelineList}>
                {trialTimeline.map((step, index) => (
                  <View key={step.id} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          index === 0 && styles.timelineDotActive,
                        ]}
                      />
                      {index < trialTimeline.length - 1 ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>
                    <View style={styles.timelineCopy}>
                      <Text style={styles.timelineDay}>
                        {step.dayLabel} · {step.title}
                      </Text>
                      <Text style={styles.timelineDesc}>{step.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => {
                  hapticSelection();
                  setTrialReminderOptIn(!trialReminderOptIn);
                }}
                hitSlop={4}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: trialReminderOptIn }}
                accessibilityLabel="Remind me 2 days before trial ends"
                style={styles.reminderRow}
              >
                <View style={styles.reminderLeft}>
                  <Bell size={16} strokeWidth={1.6} color={palette.accentMoss} />
                  <Text style={styles.reminderText}>
                    Remind me 2 days before trial ends
                  </Text>
                </View>
                <View
                  style={[
                    styles.reminderCheckbox,
                    trialReminderOptIn && styles.reminderCheckboxChecked,
                  ]}
                >
                  {trialReminderOptIn ? (
                    <Check
                      size={13}
                      strokeWidth={2}
                      color={palette.accentMossText}
                    />
                  ) : null}
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={styles.honestNoteCard}>
              <Text style={styles.honestNoteTitle}>
                {selectedOffering?.id === 'lifetime_pro'
                  ? 'Pay once, tend forever'
                  : 'Flexible monthly renewal'}
              </Text>
              <Text style={styles.honestNoteBody}>
                {selectedOffering?.id === 'lifetime_pro'
                  ? 'Full access to all 35+ species, 30-day Keeper insights, Duo hosting, and an ad-free meadow with zero recurring bills.'
                  : 'Unlock all 35+ plants, 30-day Keeper patterns, and an ad-free meadow today. Cancel anytime in store settings.'}
              </Text>
            </View>
          )}

          {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

          <View style={styles.actions}>
            <BotanicalButton
              label={
                submitting
                  ? selectedOffering?.trialDays
                    ? 'Starting trial...'
                    : 'Confirming...'
                  : primaryCtaLabel
              }
              onPress={() => {
                void handlePurchase();
              }}
              disabled={submitting || restoring}
              fullWidth
              testID="paywall-primary-cta"
            />
            <BotanicalButton
              label="Continue with free basic garden"
              onPress={handleContinueFree}
              variant="ghost"
              disabled={submitting || restoring}
              fullWidth
              testID="paywall-free-cta"
            />
            {isFromOnboarding && !isPro && !guestPassUsed ? (
              <Text style={styles.guestPassHint}>
                Includes a 3-day Sunlit Guest Pass · No card required
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              void handleRestore();
            }}
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
  headerAtmosphere: {
    height: 260,
    bottom: undefined,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  guestPassBadge: {
    ...liquidGlassSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  guestPassBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.accentMoss,
    fontVariant: ['tabular-nums'],
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
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  previewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  floraStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  floraThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowPill: {
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
    fontSize: 26,
    lineHeight: 33,
    letterSpacing: -0.3,
    color: palette.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  plansStack: {
    gap: spacing.md,
  },
  planCard: {
    minHeight: 76,
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
  lifetimePill: {
    minHeight: 46,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lifetimePillSelected: {
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1.5,
    borderColor: palette.accentMoss,
  },
  lifetimeLabel: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textSecondary,
  },
  lifetimeTitle: {
    fontFamily: fonts.bodySemiBold,
    color: palette.textPrimary,
  },
  lifetimePrice: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.accentMoss,
    fontVariant: ['tabular-nums'],
  },
  timelineCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  timelineHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  timelineList: {
    gap: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  timelineRail: {
    width: 14,
    alignItems: 'center',
    paddingTop: 5,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.accentMoss,
  },
  timelineDotActive: {
    backgroundColor: palette.accentMoss,
  },
  timelineLine: {
    width: 1.5,
    height: 24,
    backgroundColor: palette.border,
    marginTop: 4,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: spacing.xs,
    gap: 2,
  },
  timelineDay: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.textPrimary,
  },
  timelineDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: palette.textSecondary,
  },
  reminderRow: {
    minHeight: 44,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  reminderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reminderText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textPrimary,
  },
  reminderCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderCheckboxChecked: {
    backgroundColor: palette.accentMoss,
    borderColor: palette.accentMoss,
  },
  honestNoteCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  honestNoteTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  honestNoteBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
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
  guestPassHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: palette.textMuted,
    textAlign: 'center',
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
