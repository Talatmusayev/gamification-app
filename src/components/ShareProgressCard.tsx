import * as Sharing from 'expo-sharing';
import { Droplets, Leaf, Share2, Sprout, Sun, X } from 'lucide-react-native';
import { type ComponentRef, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { getCatalogItemById } from '@/domain/catalog';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import type { GardenPlacement } from '@/domain/types';
import { palette, radii, spacing } from '@/theme/tokens';

export interface ShareProgressCardProps {
  visible: boolean;
  placements: GardenPlacement[];
  dewBalance: number;
  sunlightBalance: number;
  restfulDays: number;
  windowDays: number;
  onClose: () => void;
}

const MINI_TILE_W = 26;
const MINI_TILE_H = 14;
const MINI_WIDTH = GRID_SIZE * MINI_TILE_W + 24;
const MINI_HEIGHT = GRID_SIZE * MINI_TILE_H + 36;
const MINI_ORIGIN_X = MINI_WIDTH / 2;
const MINI_ORIGIN_Y = 20;

const MINI_COORDS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, idx) => ({
  x: Math.floor(idx / GRID_SIZE),
  y: idx % GRID_SIZE,
})).sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x);

function miniDiamond(cx: number, cy: number): string {
  const hw = MINI_TILE_W / 2;
  const hh = MINI_TILE_H / 2;
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
}

export function ShareProgressCard({
  visible,
  placements,
  dewBalance,
  sunlightBalance,
  restfulDays,
  windowDays,
  onClose,
}: ShareProgressCardProps) {
  const viewShotRef = useRef<ComponentRef<typeof ViewShot>>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  if (!visible) {
    return null;
  }

  const sortedPlacements = [...placements].sort(
    (a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x,
  );

  const handleShare = async () => {
    setSharing(true);
    setStatusMessage(null);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        setStatusMessage(
          'Sharing is unavailable on this device. You can take a screenshot of this card.',
        );
        return;
      }

      const uri = await viewShotRef.current?.capture?.();
      if (!uri) {
        setStatusMessage('Unable to capture sanctuary card right now.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share sanctuary card',
      });
    } catch {
      setStatusMessage(
        'Sharing is unavailable in this environment. You can screenshot this card instead.',
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Share sanctuary</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close share card"
              style={styles.closeButton}
            >
              <X size={18} strokeWidth={1.5} color={palette.textSecondary} />
            </Pressable>
          </View>

          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 0.95 }}
            style={styles.cardFrame}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.brandRow}>
                <Sprout size={16} strokeWidth={1.6} color={palette.accentMoss} />
                <Text style={styles.brandText}>Dew &amp; Bloom</Text>
              </View>
              <Text style={styles.cardCaption}>Sunlit Meadow</Text>
            </View>

            <View style={styles.previewWrap}>
              <View style={{ width: MINI_WIDTH, height: MINI_HEIGHT }}>
                <Svg
                  width={MINI_WIDTH}
                  height={MINI_HEIGHT}
                  viewBox={`0 0 ${MINI_WIDTH} ${MINI_HEIGHT}`}
                >
                  {MINI_COORDS.map(({ x, y }) => {
                    const { sx, sy } = gridToScreen(x, y, MINI_TILE_W, MINI_TILE_H);
                    const fill = (x + y) % 2 === 0 ? '#DCE7D4' : '#D2E0C8';
                    return (
                      <Polygon
                        key={`mini_${x}_${y}`}
                        points={miniDiamond(MINI_ORIGIN_X + sx, MINI_ORIGIN_Y + sy)}
                        fill={fill}
                        stroke="rgba(54, 94, 68, 0.14)"
                        strokeWidth={0.6}
                      />
                    );
                  })}
                </Svg>

                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {sortedPlacements.map((placement) => {
                    const item = getCatalogItemById(placement.itemId);
                    if (!item) {
                      return null;
                    }
                    const { sx, sy } = gridToScreen(
                      placement.x,
                      placement.y,
                      MINI_TILE_W,
                      MINI_TILE_H,
                    );
                    const spriteSize = 24;
                    return (
                      <View
                        key={`mini_sprite_${placement.id}`}
                        style={{
                          position: 'absolute',
                          left: MINI_ORIGIN_X + sx - spriteSize / 2,
                          top: MINI_ORIGIN_Y + sy - spriteSize + 6,
                        }}
                      >
                        <GardenSprite assetKey={item.assetKey} size={spriteSize} />
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <View style={styles.statIconRow}>
                  <Leaf size={14} strokeWidth={1.6} color={palette.accentMoss} />
                  <Text style={styles.statLabel}>Harmony</Text>
                </View>
                <Text style={styles.statValue}>
                  {restfulDays} of {windowDays} days
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBlock}>
                <View style={styles.statIconRow}>
                  <Droplets size={14} strokeWidth={1.6} color={palette.accentDew} />
                  <Sun size={14} strokeWidth={1.6} color={palette.accentSunlight} />
                  <Text style={styles.statLabel}>Sanctuary</Text>
                </View>
                <Text style={styles.statValue}>
                  {placements.length} placed · {dewBalance}/{sunlightBalance}
                </Text>
              </View>
            </View>
          </ViewShot>

          {statusMessage ? (
            <Text style={styles.statusMessage}>{statusMessage}</Text>
          ) : null}

          <BotanicalButton
            label={sharing ? 'Preparing card...' : 'Share sanctuary card'}
            onPress={() => {
              void handleShare();
            }}
            disabled={sharing}
            fullWidth
            iconLeft={
              <Share2 size={16} strokeWidth={1.6} color={palette.accentMossText} />
            }
            accessibilityLabel="Share sanctuary card"
          />
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
    backgroundColor: palette.bg,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  cardFrame: {
    backgroundColor: '#F6F2E9',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  cardCaption: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textMuted,
  },
  previewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statBlock: {
    flex: 1,
    gap: 2,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: palette.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: palette.border,
    marginHorizontal: spacing.md,
  },
  statusMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
