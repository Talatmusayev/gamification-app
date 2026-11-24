import { useRouter } from 'expo-router';
import { Check, Droplets, Lock, Plus, Sun } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { SUNLIT_MEADOW_CATALOG } from '@/domain/catalog';
import type { CatalogItem, ItemCategory } from '@/domain/types';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { fonts, palette, radii, spacing } from '@/theme/tokens';
import { hapticSelection } from '@/utils/haptics';

type FilterTab = 'all' | ItemCategory;

const FILTER_TABS: readonly { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'plant', label: 'Plants' },
  { id: 'decor', label: 'Decor' },
  { id: 'critter', label: 'Critters' },
];

export default function ShopScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const profile = useSanctuaryStore((s) => s.profile);
  const ownedItemIds = useSanctuaryStore((s) => s.ownedItemIds);

  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') {
      return SUNLIT_MEADOW_CATALOG;
    }
    return SUNLIT_MEADOW_CATALOG.filter(
      (item) => item.category === selectedFilter,
    );
  }, [selectedFilter]);

  const handleSelectItem = (item: CatalogItem, isProLocked: boolean) => {
    hapticSelection();
    if (isProLocked) {
      router.push('/paywall');
      return;
    }
    router.push({
      pathname: '/(tabs)/sanctuary',
      params: { placeItemId: item.id },
    });
  };

  const renderItem = ({ item, index }: { item: CatalogItem; index: number }) => {
    const isOwned = ownedItemIds.includes(item.id);
    const isProLocked = item.isPro && !profile.isPro && !isOwned;
    const canAfford =
      isOwned ||
      (profile.dewBalance >= item.dewCost &&
        profile.sunlightBalance >= item.sunlightCost);
    const canPlace = !isProLocked && canAfford;
    const entering =
      !reducedMotion && index < 6
        ? FadeInDown.delay(index * 35).duration(220)
        : undefined;

    return (
      <Animated.View entering={entering} style={styles.seedPacketCard}>
        <View style={styles.portraitFrame}>
          {isOwned ? (
            <View style={[styles.statusBadge, styles.ownedTag]}>
              <Check size={11} strokeWidth={2} color={palette.accentMoss} />
              <Text style={styles.ownedTagText}>Owned</Text>
            </View>
          ) : item.isPro ? (
            <View style={[styles.statusBadge, styles.proTag]}>
              <Lock size={11} strokeWidth={1.7} color={palette.textMuted} />
              <Text style={styles.proTagText}>Pro</Text>
            </View>
          ) : null}
          <GardenSprite assetKey={item.assetKey} size={66} />
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <View style={styles.costRow}>
          <View style={styles.costItem}>
            <Droplets size={12} strokeWidth={1.6} color={palette.accentDew} />
            <Text style={styles.costValue}>{item.dewCost}</Text>
          </View>
          <View style={styles.costItem}>
            <Sun size={12} strokeWidth={1.6} color={palette.accentSunlight} />
            <Text style={styles.costValue}>{item.sunlightCost}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => handleSelectItem(item, isProLocked)}
          disabled={!canPlace && !isProLocked}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={
            isProLocked
              ? `Try Sanctuary Pro to unlock ${item.name}`
              : canPlace
                ? `Place ${item.name} in sanctuary`
                : `Not enough Dew or Sunlight for ${item.name}`
          }
          accessibilityState={{ disabled: !canPlace && !isProLocked }}
          style={({ pressed }) => [
            styles.placeButton,
            !canPlace && !isProLocked && styles.placeButtonDisabled,
            pressed && !reducedMotion && styles.placeButtonPressed,
          ]}
        >
          {isProLocked ? (
            <Lock size={14} strokeWidth={1.6} color={palette.textMuted} />
          ) : (
            <Plus
              size={15}
              strokeWidth={1.8}
              color={canPlace ? palette.accentMossText : palette.textMuted}
            />
          )}
          <Text
            style={[
              styles.placeButtonText,
              !canPlace && styles.placeButtonTextDisabled,
            ]}
          >
            {isOwned ? 'Plant' : isProLocked ? 'Pro' : 'Plant'}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.balanceRow}>
          <View
            style={styles.balancePill}
            accessible
            accessibilityLabel={`${profile.dewBalance} Dew`}
          >
            <Droplets size={15} strokeWidth={1.5} color={palette.accentDew} />
            <Text style={styles.balanceValue}>{profile.dewBalance}</Text>
          </View>
          <View
            style={styles.balancePill}
            accessible
            accessibilityLabel={`${profile.sunlightBalance} Sunlight`}
          >
            <Sun size={15} strokeWidth={1.5} color={palette.accentSunlight} />
            <Text style={styles.balanceValue}>{profile.sunlightBalance}</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => {
          const active = tab.id === selectedFilter;
          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                if (tab.id !== selectedFilter) {
                  hapticSelection();
                }
                setSelectedFilter(tab.id);
              }}
              hitSlop={4}
              accessibilityRole="tab"
              accessibilityLabel={`Filter by ${tab.label}`}
              accessibilityState={{ selected: active }}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredItems}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        columnWrapperStyle={styles.columnRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 26,
    letterSpacing: -0.3,
    color: palette.textPrimary,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 34,
  },
  balanceValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterPill: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: palette.accentMoss,
    borderColor: palette.accentMoss,
  },
  filterText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textSecondary,
  },
  filterTextActive: {
    fontFamily: fonts.bodySemiBold,
    color: palette.accentMossText,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  columnRow: {
    gap: spacing.md,
  },
  seedPacketCard: {
    flex: 1,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  portraitFrame: {
    height: 100,
    borderRadius: radii.md,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.xs + 2,
    right: spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: 'rgba(250, 248, 244, 0.88)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  itemInfo: {
    gap: 2,
    minHeight: 54,
  },
  itemName: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    color: palette.textPrimary,
  },
  ownedTag: {},
  ownedTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: palette.accentMoss,
  },
  proTag: {},
  proTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: palette.textMuted,
  },
  itemDescription: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: palette.textSecondary,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 2,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  placeButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.accentMoss,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  placeButtonDisabled: {
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  placeButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.accentMossText,
  },
  placeButtonTextDisabled: {
    color: palette.textMuted,
  },
});
