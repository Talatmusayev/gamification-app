import { useLocalSearchParams, useRouter } from 'expo-router';
import { Moon, Move, Share2, Sun, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoodnightLanternModal } from '@/components/GoodnightLanternModal';
import { IsometricCanvas } from '@/components/IsometricCanvas';
import { MorningRevealModal } from '@/components/MorningRevealModal';
import { SanctuaryHud } from '@/components/SanctuaryHud';
import { ShareProgressCard } from '@/components/ShareProgressCard';
import { getCatalogItemById } from '@/domain/catalog';
import { calculateHarmonyScore } from '@/domain/fog';
import type { GardenPlacement } from '@/domain/types';
import { trackEvent } from '@/services/analyticsService';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, nightPalette, palette, radii, spacing } from '@/theme/tokens';
import { hapticLight, hapticMedium, hapticWarning } from '@/utils/haptics';

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

  const placeCatalogItem = useSanctuaryStore((s) => s.placeCatalogItem);
  const movePlacedItem = useSanctuaryStore((s) => s.movePlacedItem);
  const startLantern = useSanctuaryStore((s) => s.startLantern);
  const finishLantern = useSanctuaryStore((s) => s.finishLantern);
  const triggerMorningReveal = useSanctuaryStore((s) => s.triggerMorningReveal);
  const dismissPendingReveal = useSanctuaryStore((s) => s.dismissPendingReveal);
  const setPendingReveal = useSanctuaryStore((s) => s.setPendingReveal);

  const [placingItemId, setPlacingItemId] = useState<string | null>(null);
  const [movingPlacementId, setMovingPlacementId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [lanternModalOpen, setLanternModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

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

  const handleRevealTrigger = () => {
    setFeedbackMessage(null);
    if (pendingReveal) {
      return;
    }
    const todayKey = getTodayDateKey();
    const result = triggerMorningReveal({
      dateKey: todayKey,
      sleepMin: profile.sleepGoalMin,
      steps: Math.round(profile.stepGoal * 0.85),
    });
    if (result.alreadyRevealed) {
      setPendingReveal(result);
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
          onTilePress={handleTilePress}
          onPlacementPress={handlePlacementPress}
        />

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
          setLanternModalOpen(false);
          setFeedbackMessage('Goodnight lantern is lit. Rest well.');
        }}
        onFinishLantern={handleFinishLantern}
        onClose={() => setLanternModalOpen(false)}
      />

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
});
