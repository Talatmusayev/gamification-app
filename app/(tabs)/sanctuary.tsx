import { useLocalSearchParams, useRouter } from 'expo-router';
import { Moon, Move, Share2, Sparkles, Sun, Users, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoodnightLanternModal } from '@/components/GoodnightLanternModal';
import { IsometricCanvas } from '@/components/IsometricCanvas';
import { MorningRevealModal } from '@/components/MorningRevealModal';
import { SanctuaryHud } from '@/components/SanctuaryHud';
import { ShareProgressCard } from '@/components/ShareProgressCard';
import { getCatalogItemById, SUNLIT_MEADOW_CATALOG } from '@/domain/catalog';
import { calculateHarmonyScore } from '@/domain/fog';
import type { GardenPlacement } from '@/domain/types';
import { trackEvent } from '@/services/analyticsService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, nightPalette, palette, radii, spacing } from '@/theme/tokens';
import {
  hapticLight,
  hapticMedium,
  hapticSelection,
  hapticSuccess,
  hapticWarning,
} from '@/utils/haptics';

interface RestPreset {
  id: string;
  label: string;
  sublabel: string;
  sleepMin: number;
}

interface StepPreset {
  id: string;
  label: string;
  sublabel: string;
  steps: number;
}

const REST_PRESETS: readonly RestPreset[] = [
  { id: 'restful', label: 'Restful', sublabel: '8h', sleepMin: 480 },
  { id: 'steady', label: 'Steady', sublabel: '6.5h', sleepMin: 390 },
  { id: 'short', label: 'Short', sublabel: '5h', sleepMin: 300 },
];

const STEP_PRESETS: readonly StepPreset[] = [
  { id: 'light', label: 'Light walk', sublabel: '3,000', steps: 3000 },
  { id: 'active', label: 'Active', sublabel: '6,500', steps: 6500 },
  { id: 'long', label: 'Long walk', sublabel: '10,000', steps: 10000 },
];

function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SanctuaryScreen() {
  const router = useRouter();
  const { placeItemId } = useLocalSearchParams<{ placeItemId?: string }>();

  const profile = useSanctuaryStore((s) => s.profile);
  const placements = useSanctuaryStore((s) => s.placements);
  const ownedItemIds = useSanctuaryStore((s) => s.ownedItemIds);
  const dailyLogs = useSanctuaryStore((s) => s.dailyLogs);
  const activeLantern = useSanctuaryStore((s) => s.activeLantern);
  const pendingReveal = useSanctuaryStore((s) => s.pendingReveal);

  const reducedMotion = useReducedMotion();
  const placeCatalogItem = useSanctuaryStore((s) => s.placeCatalogItem);
  const movePlacedItem = useSanctuaryStore((s) => s.movePlacedItem);
  const startLantern = useSanctuaryStore((s) => s.startLantern);
  const awardBedtimeDew = useSanctuaryStore((s) => s.awardBedtimeDew);
  const finishLantern = useSanctuaryStore((s) => s.finishLantern);
  const triggerMorningReveal = useSanctuaryStore((s) => s.triggerMorningReveal);
  const dismissPendingReveal = useSanctuaryStore((s) => s.dismissPendingReveal);
  const setPendingReveal = useSanctuaryStore((s) => s.setPendingReveal);

  const [placingItemId, setPlacingItemId] = useState<string | null>(null);
  const [movingPlacementId, setMovingPlacementId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [lanternModalOpen, setLanternModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [selectedRestId, setSelectedRestId] = useState<string>('restful');
  const [selectedStepId, setSelectedStepId] = useState<string>('active');

  useEffect(() => {
    if (typeof placeItemId === 'string' && getCatalogItemById(placeItemId)) {
      setPlacingItemId(placeItemId);
      setMovingPlacementId(null);
      setFeedbackMessage(null);
    }
  }, [placeItemId]);

  const harmony = useMemo(
    () => calculateHarmonyScore(Object.values(dailyLogs)),
    [dailyLogs],
  );

  const placingItem = placingItemId
    ? getCatalogItemById(placingItemId) ?? null
    : null;

  const movingPlacement = movingPlacementId
    ? placements.find((p) => p.id === movingPlacementId) ?? null
    : null;
  const movingItem = movingPlacement
    ? getCatalogItemById(movingPlacement.itemId) ?? null
    : null;

  const clearSelection = () => {
    setPlacingItemId(null);
    setMovingPlacementId(null);
    setFeedbackMessage(null);
    if (placeItemId) {
      router.setParams({ placeItemId: undefined });
    }
  };

  const handleTilePress = (x: number, y: number) => {
    if (placingItemId && placingItem) {
      const result = placeCatalogItem(placingItemId, x, y);
      if (result.ok) {
        hapticMedium();
        trackEvent('garden_item_placed', { item_slug: placingItem.id });
        setPlacingItemId(null);
        if (placeItemId) {
          router.setParams({ placeItemId: undefined });
        }
        setFeedbackMessage(`Placed ${placingItem.name} in your meadow.`);
      } else if (result.reason === 'TILE_OCCUPIED') {
        hapticWarning();
        setFeedbackMessage('That patch already holds something. Tap an open tile.');
      } else if (result.reason === 'INSUFFICIENT_FUNDS') {
        hapticWarning();
        setFeedbackMessage('Gather a bit more Dew or Sunlight to place this item.');
      } else if (result.reason === 'PRO_REQUIRED') {
        hapticWarning();
        setFeedbackMessage('This item is part of Sanctuary Pro.');
      }
      return;
    }

    if (movingPlacementId && movingItem) {
      const result = movePlacedItem(movingPlacementId, x, y);
      if (result.ok) {
        hapticMedium();
        setMovingPlacementId(null);
        setFeedbackMessage(`Moved ${movingItem.name} to a new spot.`);
      } else if (result.reason === 'TILE_OCCUPIED') {
        hapticWarning();
        setFeedbackMessage('That patch is occupied. Tap an open meadow tile.');
      }
    }
  };

  const handlePlacementPress = (placement: GardenPlacement) => {
    setFeedbackMessage(null);
    if (movingPlacementId === placement.id) {
      setMovingPlacementId(null);
      return;
    }
    hapticLight();
    setPlacingItemId(null);
    setMovingPlacementId(placement.id);
  };

  const nextUnlockWhisper = useMemo(() => {
    const candidates = SUNLIT_MEADOW_CATALOG.filter(
      (item) => (!item.isPro || profile.isPro) && !ownedItemIds.includes(item.id),
    );
    if (candidates.length === 0) {
      return null;
    }

    let bestItem = candidates[0];
    let bestDeficit = Infinity;
    let bestMissingDew = 0;
    let bestMissingSun = 0;

    for (const item of candidates) {
      const missingDew = Math.max(0, item.dewCost - profile.dewBalance);
      const missingSun = Math.max(0, item.sunlightCost - profile.sunlightBalance);
      const totalDeficit = missingDew + missingSun;
      if (totalDeficit < bestDeficit) {
        bestDeficit = totalDeficit;
        bestItem = item;
        bestMissingDew = missingDew;
        bestMissingSun = missingSun;
      }
    }

    if (bestDeficit === 0) {
      return `${bestItem.name} · Ready to plant`;
    }
    if (bestMissingSun >= bestMissingDew && bestMissingSun > 0) {
      return `${bestItem.name} · ${bestMissingSun} Sunlight away`;
    }
    return `${bestItem.name} · ${bestMissingDew} Dew away`;
  }, [ownedItemIds, profile.dewBalance, profile.isPro, profile.sunlightBalance]);

  const handleRevealTrigger = () => {
    setFeedbackMessage(null);
    if (pendingReveal) {
      return;
    }
    const todayKey = getTodayDateKey();
    const existingLog = dailyLogs[todayKey];
    if (existingLog) {
      const result = triggerMorningReveal({
        dateKey: todayKey,
        sleepMin: existingLog.sleepMin,
        steps: existingLog.steps,
      });
      if (result.alreadyRevealed) {
        setPendingReveal(result);
      }
      return;
    }
    hapticLight();
    setCheckInModalOpen(true);
  };

  const handleConfirmCheckIn = () => {
    const restPreset =
      REST_PRESETS.find((preset) => preset.id === selectedRestId) ?? REST_PRESETS[0];
    const stepPreset =
      STEP_PRESETS.find((preset) => preset.id === selectedStepId) ?? STEP_PRESETS[1];
    setCheckInModalOpen(false);

    const todayKey = getTodayDateKey();
    const result = triggerMorningReveal({
      dateKey: todayKey,
      sleepMin: restPreset.sleepMin,
      steps: stepPreset.steps,
    });
    if (result.alreadyRevealed) {
      setPendingReveal(result);
    } else {
      hapticSuccess();
    }
  };

  const handleFinishLantern = () => {
    const result = finishLantern(new Date().toISOString(), 0);
    setLanternModalOpen(false);
    if (!result) {
      setFeedbackMessage(
        'Lantern closed. Rest sessions over 1 hour gather morning dew.',
      );
    } else if (result.alreadyRevealed) {
      setPendingReveal(result);
    }
  };

  const handleClearMist = () => {
    if (pendingReveal && !pendingReveal.alreadyRevealed) {
      trackEvent('morning_reveal_completed', {
        fog_cleared: pendingReveal.newFogLevel === 0,
      });
    }
    dismissPendingReveal();
  };

  const isPlacingOwned = placingItem
    ? ownedItemIds.includes(placingItem.id)
    : false;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <SanctuaryHud
        dewBalance={profile.dewBalance}
        sunlightBalance={profile.sunlightBalance}
        restfulDays={harmony.restfulDays}
        windowDays={harmony.windowDays}
      />

      <View style={styles.canvasWrap}>
        <IsometricCanvas
          placements={placements}
          fogLevel={profile.fogLevel}
          placingItemId={placingItemId}
          movingPlacementId={movingPlacementId}
          isSleeping={Boolean(activeLantern)}
          onTilePress={handleTilePress}
          onPlacementPress={handlePlacementPress}
        />

        <Pressable
          onPress={() => {
            hapticSelection();
            router.push('/duo');
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open Duo shared meadow"
          style={styles.duoPill}
        >
          <Users size={16} strokeWidth={1.6} color={palette.accentMoss} />
          <Text style={styles.duoPillText}>Duo</Text>
        </Pressable>

        {placingItem ? (
          <View style={styles.modeBanner}>
            <View style={styles.modeBannerCopy}>
              <Text style={styles.modeBannerTitle}>
                Tap an open tile to place {placingItem.name}
              </Text>
              <Text style={styles.modeBannerSub}>
                {isPlacingOwned
                  ? 'Already in your collection'
                  : `${placingItem.dewCost} Dew · ${placingItem.sunlightCost} Sunlight`}
              </Text>
            </View>
            <Pressable
              onPress={clearSelection}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel placement"
              style={styles.bannerClose}
            >
              <X size={16} strokeWidth={1.6} color={palette.textSecondary} />
            </Pressable>
          </View>
        ) : movingItem ? (
          <View style={styles.modeBanner}>
            <View style={styles.modeBannerRow}>
              <Move size={16} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.modeBannerTitle}>
                Tap an open tile to move {movingItem.name}
              </Text>
            </View>
            <Pressable
              onPress={clearSelection}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cancel move"
              style={styles.bannerClose}
            >
              <X size={16} strokeWidth={1.6} color={palette.textSecondary} />
            </Pressable>
          </View>
        ) : feedbackMessage ? (
          <View style={styles.feedbackToast}>
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            <Pressable
              onPress={() => setFeedbackMessage(null)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notice"
              style={styles.bannerClose}
            >
              <X size={14} strokeWidth={1.6} color={palette.textMuted} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {nextUnlockWhisper && !placingItem && !movingItem ? (
        <View style={styles.whisperBar}>
          <Pressable
            onPress={() => {
              hapticSelection();
              router.push('/(tabs)/shop');
            }}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Next bloom: ${nextUnlockWhisper}`}
            style={styles.whisperPill}
          >
            <Sparkles size={14} strokeWidth={1.6} color={palette.accentMoss} />
            <Text style={styles.whisperLabel}>Next bloom</Text>
            <Text style={styles.whisperValue} numberOfLines={1}>
              {nextUnlockWhisper}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.actionBar}>
        <Pressable
          onPress={() => setLanternModalOpen(true)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={
            activeLantern ? 'Open active goodnight lantern' : 'Open goodnight lantern'
          }
          style={styles.actionButton}
        >
          <View style={styles.actionIconWrap}>
            <Moon size={18} strokeWidth={1.5} color={palette.textPrimary} />
            {activeLantern ? <View style={styles.lanternDot} /> : null}
          </View>
          <Text style={styles.actionLabel}>Lantern</Text>
        </Pressable>

        <Pressable
          onPress={handleRevealTrigger}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Open morning reveal"
          style={[styles.actionButton, styles.actionButtonPrimary]}
        >
          <Sun size={18} strokeWidth={1.6} color={palette.accentMossText} />
          <Text style={styles.actionLabelPrimary}>Morning reveal</Text>
        </Pressable>

        <Pressable
          onPress={() => setShareModalOpen(true)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Share sanctuary card"
          style={styles.actionButton}
        >
          <Share2 size={18} strokeWidth={1.5} color={palette.textPrimary} />
          <Text style={styles.actionLabel}>Share</Text>
        </Pressable>
      </View>

      <MorningRevealModal
        visible={Boolean(pendingReveal)}
        reveal={pendingReveal}
        onClearMist={handleClearMist}
      />

      <GoodnightLanternModal
        visible={lanternModalOpen}
        activeLantern={activeLantern}
        onStartLantern={() => {
          startLantern();
          awardBedtimeDew(10);
          hapticSuccess();
          setLanternModalOpen(false);
          setFeedbackMessage('+10 Bedtime Dew gathered. Goodnight lantern is lit.');
        }}
        onFinishLantern={handleFinishLantern}
        onClose={() => setLanternModalOpen(false)}
      />

      <Modal
        visible={checkInModalOpen}
        transparent
        animationType={reducedMotion ? 'none' : 'fade'}
        onRequestClose={() => setCheckInModalOpen(false)}
      >
        <View style={styles.checkInBackdrop}>
          <View style={styles.checkInSheet} accessibilityViewIsModal>
            <View style={styles.checkInHeader}>
              <Text style={styles.checkInTitle}>How did you rest last night?</Text>
              <Pressable
                onPress={() => setCheckInModalOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close morning check-in"
                style={styles.bannerClose}
              >
                <X size={18} strokeWidth={1.5} color={palette.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.presetRow}>
              {REST_PRESETS.map((preset) => {
                const selected = preset.id === selectedRestId;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      hapticSelection();
                      setSelectedRestId(preset.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.presetPill,
                      selected && styles.presetPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetLabel,
                        selected && styles.presetLabelSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text
                      style={[
                        styles.presetSublabel,
                        selected && styles.presetSublabelSelected,
                      ]}
                    >
                      {preset.sublabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.checkInSectionLabel}>Yesterday&apos;s pace</Text>
            <View style={styles.presetRow}>
              {STEP_PRESETS.map((preset) => {
                const selected = preset.id === selectedStepId;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      hapticSelection();
                      setSelectedStepId(preset.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.presetPill,
                      selected && styles.presetPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetLabel,
                        selected && styles.presetLabelSelected,
                      ]}
                    >
                      {preset.label}
                    </Text>
                    <Text
                      style={[
                        styles.presetSublabel,
                        selected && styles.presetSublabelSelected,
                      ]}
                    >
                      {preset.sublabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleConfirmCheckIn}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Reveal morning"
              style={styles.checkInConfirmButton}
            >
              <Sun size={18} strokeWidth={1.6} color={palette.accentMossText} />
              <Text style={styles.checkInConfirmLabel}>Reveal morning</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ShareProgressCard
        visible={shareModalOpen}
        placements={placements}
        dewBalance={profile.dewBalance}
        sunlightBalance={profile.sunlightBalance}
        restfulDays={harmony.restfulDays}
        windowDays={harmony.windowDays}
        onClose={() => setShareModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
  },
  duoPill: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  duoPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textPrimary,
  },
  modeBanner: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modeBannerCopy: {
    flex: 1,
    gap: 2,
  },
  modeBannerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modeBannerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
  },
  modeBannerSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  bannerClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  feedbackToast: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  feedbackText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textSecondary,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  actionButton: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: palette.accentMoss,
    borderColor: palette.accentMoss,
  },
  actionIconWrap: {
    position: 'relative',
  },
  lanternDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: nightPalette.accentLantern,
  },
  actionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: palette.textPrimary,
  },
  actionLabelPrimary: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.accentMossText,
  },
  whisperBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  whisperPill: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  whisperLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.accentMoss,
  },
  whisperValue: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  checkInBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 25, 22, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  checkInSheet: {
    backgroundColor: palette.bg,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.md,
  },
  checkInHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  checkInTitle: {
    flex: 1,
    fontFamily: fonts.displaySemiBold,
    fontSize: 20,
    lineHeight: 26,
    color: palette.textPrimary,
  },
  checkInSectionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textSecondary,
    marginTop: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetPill: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  presetPillSelected: {
    backgroundColor: palette.accentMoss,
    borderColor: palette.accentMoss,
  },
  presetLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.textPrimary,
  },
  presetLabelSelected: {
    color: palette.accentMossText,
  },
  presetSublabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  presetSublabelSelected: {
    color: palette.accentMossText,
    opacity: 0.9,
  },
  checkInConfirmButton: {
    marginTop: spacing.sm,
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: palette.accentMoss,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  checkInConfirmLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: palette.accentMossText,
  },
});
