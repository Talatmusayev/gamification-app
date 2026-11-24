import { Camera, Leaf, PlayCircle, Sparkles, Sun, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { GardenSprite } from '@/components/ui/GardenSprite';
import {
  captureOutdoorPhoto,
  getFieldSnapAllowance,
  identifyAndResolveFieldSnap,
  loadFieldSnapState,
  unlockBonusFieldSnap,
  type FieldSnapAllowance,
  type FieldSnapSuccessResult,
} from '@/services/fieldSnapService';
import { watchRewardedDewAd } from '@/services/rewardedAdsService';
import { liquidGlassSubtle, liquidGlassSurface } from '@/theme/glass';
import { fonts, palette, radii, spacing } from '@/theme/tokens';
import {
  hapticLight,
  hapticSelection,
  hapticSuccess,
  hapticWarning,
} from '@/utils/haptics';

export interface FieldSnapModalProps {
  visible: boolean;
  isPro: boolean;
  ownedItemIds: readonly string[];
  onApplyReward: (input: {
    sunlightBonus: number;
    unlockItemId?: string | null;
  }) => void;
  onPlantInMeadow: (itemId: string) => void;
  onClose: () => void;
}

export function FieldSnapModal({
  visible,
  isPro,
  ownedItemIds,
  onApplyReward,
  onPlantInMeadow,
  onClose,
}: FieldSnapModalProps) {
  const reducedMotion = useReducedMotion();
  const [allowance, setAllowance] = useState<FieldSnapAllowance>(() =>
    getFieldSnapAllowance({ isPro }),
  );
  const [busy, setBusy] = useState<'camera' | 'ad' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<FieldSnapSuccessResult | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setNotice(null);
    setResult(null);
    setBusy(null);
    let active = true;
    void loadFieldSnapState().then(() => {
      if (active) {
        setAllowance(getFieldSnapAllowance({ isPro }));
      }
    });
    return () => {
      active = false;
    };
  }, [visible, isPro]);

  if (!visible) {
    return null;
  }

  const handleTakeOutdoorPhoto = async () => {
    if (busy || allowance.remaining <= 0) {
      return;
    }
    hapticLight();
    setNotice(null);
    setBusy('camera');

    try {
      const captured = await captureOutdoorPhoto();
      if (!captured.ok) {
        if (!captured.cancelled) {
          hapticWarning();
          setNotice(captured.message);
        }
        return;
      }

      const resolved = await identifyAndResolveFieldSnap({
        imageBase64: captured.imageBase64,
        mimeType: captured.mimeType,
        isPro,
        ownedItemIds,
      });

      setAllowance(resolved.allowanceAfter);

      if (!resolved.ok) {
        hapticWarning();
        setNotice(resolved.message);
        return;
      }

      hapticSuccess();
      onApplyReward({
        sunlightBonus: resolved.sunlightBonus,
        unlockItemId: resolved.unlockItemId,
      });
      setResult(resolved);
    } finally {
      setBusy(null);
    }
  };

  const handleUnlockBonusSnap = async () => {
    if (busy || !allowance.canUnlockBonusWithAd) {
      return;
    }
    hapticSelection();
    setNotice(null);
    setBusy('ad');

    try {
      const adResult = await watchRewardedDewAd({ isPro });
      if (!adResult.ok) {
        hapticWarning();
        setNotice('Short video closed early. Finish the video to unlock +1 Field Snap.');
        return;
      }
      const nextAllowance = await unlockBonusFieldSnap();
      setAllowance(nextAllowance);
      hapticSuccess();
      setNotice('+1 bonus Field Snap unlocked for today.');
    } finally {
      setBusy(null);
    }
  };

  const handlePlantPress = () => {
    if (!result) {
      return;
    }
    hapticSelection();
    onPlantInMeadow(result.catalogItem.id);
  };

  const snapCountLabel = `${allowance.remaining} of ${allowance.limit} ${
    allowance.limit === 1 ? 'snap' : 'snaps'
  } left today`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Leaf size={15} strokeWidth={1.6} color={palette.accentMoss} />
              <Text style={styles.headerBadgeText}>Outdoor Field Snap</Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close Field Snap"
              style={styles.closeButton}
            >
              <X size={18} strokeWidth={1.6} color={palette.textSecondary} />
            </Pressable>
          </View>

          {result ? (
            <View style={styles.resultWrap}>
              <View style={styles.spriteStage}>
                <GardenSprite
                  assetKey={result.catalogItem.assetKey}
                  size={80}
                  growthStage={3}
                />
              </View>

              <Text style={styles.speciesTitle}>{result.speciesName}</Text>
              <Text style={styles.catalogMatchLabel}>
                {result.proPreview
                  ? `Pro meadow flora · ${result.catalogItem.name}`
                  : result.alreadyOwned
                    ? `In your collection · ${result.catalogItem.name}`
                    : `Unlocked · ${result.catalogItem.name}`}
              </Text>

              <View style={styles.fieldNoteCard}>
                <Text style={styles.fieldNoteHeading}>Keeper field note</Text>
                <Text style={styles.fieldNoteBody}>{result.fieldNote}</Text>
              </View>

              <View style={styles.rewardRow}>
                <View style={styles.rewardPill}>
                  <Sun size={14} strokeWidth={1.7} color={palette.accentSunlight} />
                  <Text style={styles.rewardPillText}>
                    +{result.sunlightBonus} Sunlight
                  </Text>
                </View>
                {result.unlockItemId ? (
                  <View style={styles.rewardPill}>
                    <Sparkles size={14} strokeWidth={1.7} color={palette.accentMoss} />
                    <Text style={styles.rewardPillText}>Added to collection</Text>
                  </View>
                ) : null}
              </View>

              {result.canPlantImmediately ? (
                <Pressable
                  onPress={handlePlantPress}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Plant ${result.catalogItem.name} in meadow`}
                  style={styles.primaryButton}
                >
                  <Leaf size={17} strokeWidth={1.6} color={palette.accentMossText} />
                  <Text style={styles.primaryButtonLabel}>Plant in meadow</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={onClose}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Return to meadow"
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonLabel}>Return to meadow</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.captureWrap}>
              <Text style={styles.title}>Gather wild flora on your walk</Text>
              <Text style={styles.subtitle}>
                Point your camera at real outdoor leaves, flowers, or trees to match a
                Dewy meadow plant and gather Sunlight.
              </Text>

              <View style={styles.allowancePill}>
                <Camera size={14} strokeWidth={1.6} color={palette.accentMoss} />
                <Text style={styles.allowanceText}>{snapCountLabel}</Text>
              </View>

              {notice ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>{notice}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleTakeOutdoorPhoto}
                disabled={busy !== null || allowance.remaining <= 0}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy !== null || allowance.remaining <= 0 }}
                accessibilityLabel="Take outdoor photo"
                style={[
                  styles.primaryButton,
                  (busy !== null || allowance.remaining <= 0) &&
                    styles.primaryButtonDisabled,
                ]}
              >
                {busy === 'camera' ? (
                  <ActivityIndicator size="small" color={palette.accentMossText} />
                ) : (
                  <Camera size={18} strokeWidth={1.6} color={palette.accentMossText} />
                )}
                <Text style={styles.primaryButtonLabel}>
                  {busy === 'camera' ? 'Identifying flora…' : 'Take outdoor photo'}
                </Text>
              </Pressable>

              {allowance.canUnlockBonusWithAd ? (
                <Pressable
                  onPress={handleUnlockBonusSnap}
                  disabled={busy !== null}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy !== null }}
                  accessibilityLabel="Unlock 1 bonus snap by watching a short video"
                  style={styles.secondaryButton}
                >
                  {busy === 'ad' ? (
                    <ActivityIndicator size="small" color={palette.accentMoss} />
                  ) : (
                    <PlayCircle size={17} strokeWidth={1.6} color={palette.accentMoss} />
                  )}
                  <Text style={styles.secondaryButtonLabel}>
                    {busy === 'ad'
                      ? 'Unlocking bonus snap…'
                      : 'Unlock +1 snap · Short video'}
                  </Text>
                </Pressable>
              ) : null}

              <Text style={styles.footnote}>
                Camera-only · Real outdoor plants only (screens are gently skipped).
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 25, 22, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    ...liquidGlassSurface,
    backgroundColor: 'rgba(250, 248, 244, 0.94)',
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(54, 94, 68, 0.1)',
  },
  headerBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.accentMoss,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  captureWrap: {
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: palette.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.textSecondary,
  },
  allowancePill: {
    ...liquidGlassSubtle,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
  },
  allowanceText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  noticeBox: {
    backgroundColor: 'rgba(152, 96, 26, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(152, 96, 26, 0.18)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noticeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textPrimary,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: palette.accentMoss,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.48,
  },
  primaryButtonLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: palette.accentMossText,
  },
  secondaryButton: {
    ...liquidGlassSubtle,
    minHeight: 46,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.accentMoss,
  },
  footnote: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: palette.textMuted,
    textAlign: 'center',
  },
  resultWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  spriteStage: {
    width: 108,
    height: 108,
    borderRadius: radii.xl,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  speciesTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  catalogMatchLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.accentMoss,
    textAlign: 'center',
  },
  fieldNoteCard: {
    width: '100%',
    ...liquidGlassSubtle,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
    marginTop: spacing.xs,
  },
  fieldNoteHeading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.textMuted,
  },
  fieldNoteBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textPrimary,
  },
  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rewardPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
