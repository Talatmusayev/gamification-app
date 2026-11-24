import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Copy,
  Share2,
  Sprout,
  Sun,
  Users,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IsometricCanvas } from '@/components/IsometricCanvas';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { getCatalogItemById, SUNLIT_MEADOW_CATALOG } from '@/domain/catalog';
import {
  canSendDailyNudge,
  normalizeInviteCode,
  type DuoGarden,
} from '@/domain/duo';
import type { GardenPlacement } from '@/domain/types';
import {
  createDuoGarden,
  getMyDuoGarden,
  getTodayDateKey,
  joinDuoGarden,
  placeDuoItem,
  sendSunlightNudge,
} from '@/services/duoService';
import { fonts, motion, palette, radii, spacing } from '@/theme/tokens';
import {
  hapticLight,
  hapticMedium,
  hapticSelection,
  hapticSuccess,
  hapticWarning,
} from '@/utils/haptics';

const FREE_MEADOW_FLOWERS = SUNLIT_MEADOW_CATALOG.filter(
  (item) => !item.isPro && item.category === 'plant',
).slice(0, 4);

export default function DuoScreen() {
  const router = useRouter();
  const reducedMotion = Boolean(useReducedMotion());

  const [garden, setGarden] = useState<DuoGarden | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(
    FREE_MEADOW_FLOWERS[0]?.id ?? 'lavender',
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getMyDuoGarden().then((loaded) => {
      if (!active) {
        return;
      }
      setGarden(loaded);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const todayKey = getTodayDateKey();
  const canNudgeToday = garden
    ? canSendDailyNudge(garden.lastNudgeSentDateKey, todayKey)
    : false;

  const selectedFlower = useMemo(
    () => (selectedFlowerId ? getCatalogItemById(selectedFlowerId) ?? null : null),
    [selectedFlowerId],
  );

  const handleBack = () => {
    hapticSelection();
    router.back();
  };

  const handleCreateGarden = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    const result = await createDuoGarden();
    setBusy(false);
    if (result.ok) {
      hapticSuccess();
      setGarden(result.data);
      setNotice('Shared meadow ready. Share your invite code with a friend.');
    } else {
      hapticWarning();
      setErrorMessage(result.error);
    }
  };

  const handleJoinGarden = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    setNotice(null);
    const result = await joinDuoGarden({ inviteCode: inviteInput });
    setBusy(false);
    if (result.ok) {
      hapticSuccess();
      setGarden(result.data);
      setInviteInput('');
      setNotice('Joined the shared meadow.');
    } else {
      hapticWarning();
      setErrorMessage(result.error);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!garden) {
      return;
    }
    hapticSelection();
    setErrorMessage(null);
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      try {
        await navigator.clipboard.writeText(garden.inviteCode);
        setNotice(`Copied invite code ${garden.inviteCode}.`);
        return;
      } catch {
        // Fall through to share sheet.
      }
    }
    try {
      await Share.share({
        message: `Join my Dewy shared meadow with invite code ${garden.inviteCode}.`,
      });
      setNotice(`Invite code ${garden.inviteCode} ready to share.`);
    } catch {
      setNotice(`Invite code: ${garden.inviteCode}`);
    }
  };

  const handleShareInviteCode = async () => {
    if (!garden) {
      return;
    }
    hapticSelection();
    setErrorMessage(null);
    try {
      await Share.share({
        message: `Grow a shared meadow with me in Dewy. Invite code: ${garden.inviteCode}`,
      });
    } catch {
      setNotice(`Share code ${garden.inviteCode} with your partner.`);
    }
  };

  const handleSendSunlight = async () => {
    if (!garden || busy || !canNudgeToday) {
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    const result = await sendSunlightNudge(garden.id);
    setBusy(false);
    if (result.ok) {
      hapticSuccess();
      setGarden(result.data.garden);
      setNotice("Warm sunlight sent to your partner's meadow");
    } else {
      hapticWarning();
      setErrorMessage(result.error);
    }
  };

  const handleTilePress = async (x: number, y: number) => {
    if (!garden || !selectedFlower || busy) {
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    const result = await placeDuoItem({
      gardenId: garden.id,
      itemId: selectedFlower.id,
      x,
      y,
    });
    setBusy(false);
    if (result.ok) {
      hapticMedium();
      setGarden(result.data);
      setNotice(`Planted ${selectedFlower.name} in the shared meadow.`);
    } else {
      hapticWarning();
      setErrorMessage(result.error);
    }
  };

  const handlePlacementPress = (placement: GardenPlacement) => {
    hapticLight();
    const item = getCatalogItemById(placement.itemId);
    if (item) {
      setNotice(`${item.name} is growing in your shared meadow.`);
    }
  };

  const ownerMember = garden?.members[0] ?? null;
  const partnerMember = garden?.members[1] ?? null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to sanctuary"
          style={styles.backButton}
        >
          <ArrowLeft size={20} strokeWidth={1.6} color={palette.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>
            {garden ? garden.name : 'Duo shared meadow'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {garden
              ? 'Co-op sanctuary for two keepers'
              : 'Gentle co-op rest and daily steps'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Users size={16} strokeWidth={1.5} color={palette.accentMoss} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.card}>
            <Text style={styles.bodyText}>Opening your shared meadow...</Text>
          </View>
        ) : !garden ? (
          <Animated.View
            entering={
              reducedMotion ? undefined : FadeInDown.duration(motion.enterMs)
            }
            style={styles.emptyStack}
          >
            <View style={styles.card}>
              <View style={styles.iconPill}>
                <Users size={18} strokeWidth={1.5} color={palette.accentMoss} />
                <Text style={styles.iconPillLabel}>Two-player co-op</Text>
              </View>
              <Text style={styles.cardTitle}>
                Tend one meadow together
              </Text>
              <Text style={styles.bodyText}>
                Grow one shared meadow with a partner, best friend, or family member.
                Plant flowers side by side and send a quiet ray of sunlight once a day.
              </Text>
              <BotanicalButton
                label="Create shared meadow"
                onPress={() => void handleCreateGarden()}
                disabled={busy}
                fullWidth
                iconLeft={
                  <Sprout
                    size={18}
                    strokeWidth={1.6}
                    color={palette.accentMossText}
                  />
                }
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Join with 6-letter code</Text>
              <Text style={styles.bodyText}>
                Enter the code from your partner to step into their meadow.
              </Text>
              <TextInput
                value={inviteInput}
                onChangeText={(text) =>
                  setInviteInput(normalizeInviteCode(text).slice(0, 6))
                }
                placeholder="AB3K7M"
                placeholderTextColor={palette.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                accessibilityLabel="Six-character invite code"
                style={styles.codeInput}
              />
              <BotanicalButton
                label="Join shared meadow"
                variant="secondary"
                onPress={() => void handleJoinGarden()}
                disabled={busy || inviteInput.trim().length < 6}
                fullWidth
              />
            </View>
          </Animated.View>
        ) : (
          <Animated.View
            entering={
              reducedMotion ? undefined : FadeInDown.duration(motion.enterMs)
            }
            style={styles.activeStack}
          >
            <View style={styles.memberRow}>
              <View style={styles.memberPill}>
                <View style={styles.memberDotActive} />
                <Text style={styles.memberName}>
                  {ownerMember?.displayName ?? 'You'}
                </Text>
              </View>
              <View style={styles.memberPill}>
                <View
                  style={
                    partnerMember
                      ? styles.memberDotActive
                      : styles.memberDotWaiting
                  }
                />
                <Text
                  style={
                    partnerMember
                      ? styles.memberName
                      : styles.memberNameWaiting
                  }
                >
                  {partnerMember?.displayName ?? 'Waiting for friend'}
                </Text>
              </View>
            </View>

            <View style={styles.inviteBar}>
              <View style={styles.inviteCodeWrap}>
                <Text style={styles.inviteLabel}>Invite code</Text>
                <Text style={styles.inviteCode}>{garden.inviteCode}</Text>
              </View>
              <View style={styles.inviteActions}>
                <Pressable
                  onPress={() => void handleCopyInviteCode()}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Copy invite code"
                  style={styles.iconActionButton}
                >
                  <Copy
                    size={16}
                    strokeWidth={1.6}
                    color={palette.textPrimary}
                  />
                  <Text style={styles.iconActionLabel}>Copy</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleShareInviteCode()}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Share invite code"
                  style={styles.iconActionButton}
                >
                  <Share2
                    size={16}
                    strokeWidth={1.6}
                    color={palette.textPrimary}
                  />
                  <Text style={styles.iconActionLabel}>Share</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.canvasCard}>
              <IsometricCanvas
                placements={garden.placements}
                fogLevel={0}
                placingItemId={selectedFlower?.id ?? null}
                onTilePress={(x, y) => void handleTilePress(x, y)}
                onPlacementPress={handlePlacementPress}
              />
            </View>

            <View style={styles.card}>
              <View style={styles.pickerHeader}>
                <Sprout
                  size={16}
                  strokeWidth={1.6}
                  color={palette.accentMoss}
                />
                <Text style={styles.sectionTitle}>
                  Plant a free meadow flower
                </Text>
              </View>
              <Text style={styles.captionText}>
                Choose a seedling below, then tap any open patch on the meadow.
              </Text>
              <View style={styles.flowerRow}>
                {FREE_MEADOW_FLOWERS.map((flower) => {
                  const selected = selectedFlowerId === flower.id;
                  return (
                    <Pressable
                      key={flower.id}
                      onPress={() => {
                        hapticSelection();
                        setSelectedFlowerId(flower.id);
                      }}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${flower.name}`}
                      accessibilityState={{ selected }}
                      style={[
                        styles.flowerChip,
                        selected && styles.flowerChipSelected,
                      ]}
                    >
                      <GardenSprite assetKey={flower.assetKey} size={28} />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.flowerLabel,
                          selected && styles.flowerLabelSelected,
                        ]}
                      >
                        {flower.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.nudgeHeader}>
                <Sun
                  size={18}
                  strokeWidth={1.6}
                  color={palette.accentSunlight}
                />
                <View style={styles.nudgeCopy}>
                  <Text style={styles.sectionTitle}>Co-op sunlight</Text>
                  <Text style={styles.captionText}>
                    One gentle daily greeting, never competitive.
                  </Text>
                </View>
              </View>
              <BotanicalButton
                label={
                  canNudgeToday
                    ? 'Send warm sunlight'
                    : 'Warm sunlight sent today'
                }
                variant={canNudgeToday ? 'primary' : 'secondary'}
                onPress={() => void handleSendSunlight()}
                disabled={busy || !canNudgeToday}
                fullWidth
                iconLeft={
                  <Sun
                    size={18}
                    strokeWidth={1.6}
                    color={
                      canNudgeToday
                        ? palette.accentMossText
                        : palette.textSecondary
                    }
                  />
                }
              />
            </View>
          </Animated.View>
        )}

        {notice ? (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: palette.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  headerBadge: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  emptyStack: {
    gap: spacing.lg,
  },
  activeStack: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.surface,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  iconPillLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.accentMoss,
  },
  cardTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: palette.textPrimary,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 24,
    color: palette.textPrimary,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  captionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textMuted,
  },
  codeInput: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    letterSpacing: 3,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  memberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  memberPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  memberDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accentMoss,
  },
  memberDotWaiting: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.textMuted,
  },
  memberName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: palette.textPrimary,
  },
  memberNameWaiting: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.textMuted,
  },
  inviteBar: {
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
  inviteCodeWrap: {
    gap: 2,
  },
  inviteLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textMuted,
  },
  inviteCode: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    letterSpacing: 2,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  inviteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconActionButton: {
    minHeight: 44,
    minWidth: 44,
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
  iconActionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textPrimary,
  },
  canvasCard: {
    height: 300,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flowerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flowerChip: {
    minHeight: 48,
    minWidth: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  flowerChipSelected: {
    backgroundColor: palette.surfaceElevated,
    borderColor: palette.accentMoss,
  },
  flowerLabel: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textSecondary,
  },
  flowerLabelSelected: {
    fontFamily: fonts.bodySemiBold,
    color: palette.accentMoss,
  },
  nudgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nudgeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeBanner: {
    backgroundColor: palette.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  noticeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: palette.accentMoss,
  },
  errorBanner: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.danger,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: palette.danger,
  },
});
