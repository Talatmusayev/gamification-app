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

  const handleSelectItem = (item: CatalogItem) => {
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
      <Animated.View entering={entering} style={styles.itemCard}>
        <View style={styles.spriteBox}>
          <GardenSprite assetKey={item.assetKey} size={50} />
        </View>

        <View style={styles.itemInfo}>
          <View style={styles.itemTitleRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            {isOwned ? (
              <View style={styles.ownedTag}>
                <Check size={12} strokeWidth={1.8} color={palette.accentMoss} />
                <Text style={styles.ownedTagText}>Owned</Text>
              </View>
            ) : item.isPro ? (
              <View style={styles.proTag}>
                <Lock size={12} strokeWidth={1.6} color={palette.textMuted} />
                <Text style={styles.proTagText}>Pro</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.costRow}>
            <View style={styles.costItem}>
              <Droplets size={13} strokeWidth={1.6} color={palette.accentDew} />
              <Text style={styles.costValue}>{item.dewCost}</Text>
            </View>
            <View style={styles.costItem}>
              <Sun size={13} strokeWidth={1.6} color={palette.accentSunlight} />
              <Text style={styles.costValue}>{item.sunlightCost}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => handleSelectItem(item)}
          disabled={!canPlace}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={
            isProLocked
              ? `${item.name} requires Sanctuary Pro`
              : canPlace
                ? `Place ${item.name} in sanctuary`
                : `Not enough Dew or Sunlight for ${item.name}`
          }
          accessibilityState={{ disabled: !canPlace }}
          style={[
            styles.placeButton,
            !canPlace && styles.placeButtonDisabled,
          ]}
        >
          {isProLocked ? (
            <Lock size={15} strokeWidth={1.6} color={palette.textMuted} />
          ) : (
            <Plus
              size={16}
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
            {isOwned ? 'Place' : isProLocked ? 'Pro' : 'Place'}
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
              onPress={() => setSelectedFilter(tab.id)}
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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
    borderWidth: 1,
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
    borderWidth: 1,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  spriteBox: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: palette.textPrimary,
    flexShrink: 1,
  },
  ownedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ownedTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.accentMoss,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  proTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textMuted,
  },
  itemDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  placeButton: {
    minHeight: 44,
    minWidth: 74,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: palette.accentMoss,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  placeButtonDisabled: {
    backgroundColor: palette.surface,
    borderWidth: 1,
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
