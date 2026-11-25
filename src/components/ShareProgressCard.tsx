import * as Sharing from 'expo-sharing';
import { Droplets, Leaf, Share2, Sprout, Sun, X } from 'lucide-react-native';
import { type ComponentRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { BotanicalButton } from '@/components/ui/BotanicalButton';
import { GardenSprite } from '@/components/ui/GardenSprite';
import { getCatalogItemById } from '@/domain/catalog';
import { GRID_SIZE, gridToScreen } from '@/domain/grid';
import { getGrowthStage } from '@/domain/growth';
import { getAvailablePipWaypoints } from '@/domain/landmarks';
import type { GardenPlacement } from '@/domain/types';
import { trackEvent } from '@/services/analyticsService';
import { fonts, palette, radii, spacing } from '@/theme/tokens';

export interface ShareProgressCardProps {
  visible: boolean;
  placements: GardenPlacement[];
  dewBalance: number;
  sunlightBalance: number;
  restfulDays: number;
  windowDays: number;
  onClose: () => void;
}

const MINI_TILE_W = 32;
const MINI_TILE_H = 16.5;
const MINI_WIDTH = GRID_SIZE * MINI_TILE_W + 46; // 302
const MINI_HEIGHT = GRID_SIZE * MINI_TILE_H + 56; // 188
const MINI_ORIGIN_X = MINI_WIDTH / 2;
const MINI_ORIGIN_Y = 26;

const HERO_MINI_SCALES: Record<string, number> = {
  glass_greenhouse: 1.24,
  cedar_gazebo: 1.22,
  koi_pond: 1.2,
  weeping_willow: 1.22,
  golden_ginkgo: 1.2,
  amber_maple: 1.2,
  sakura_sapling: 1.18,
  silver_olive: 1.16,
};

function MiniPipBadge({ size = 24 }: { size?: number }) {
  const rawId = useId();
  const uid = `minipip_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={`${uid}_body`} cx="42%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FAF6EC" />
          <Stop offset="70%" stopColor="#EAE3D2" />
          <Stop offset="100%" stopColor="#D6CEBA" />
        </RadialGradient>
        <LinearGradient id={`${uid}_leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6D9B76" />
          <Stop offset="100%" stopColor="#32563C" />
        </LinearGradient>
      </Defs>
      <Ellipse cx="32" cy="56" rx="15" ry="4.5" fill="rgba(30, 36, 30, 0.22)" />
      <Path
        d="M17 42 C17 29, 23 21, 32 21 C41 21, 47 29, 47 42 C47 50, 41 54, 32 54 C23 54, 17 50, 17 42 Z"
        fill={`url(#${uid}_body)`}
        stroke="#C9BFA9"
        strokeWidth={1.2}
      />
      <Path
        d="M15 26 C18 15, 29 10, 41 13 C48 15, 51 22, 46 26 C40 24, 34 25, 27 25 C22 25, 18 27, 15 26 Z"
        fill={`url(#${uid}_leaf)`}
        stroke="#2C4C35"
        strokeWidth={1}
      />
      <Circle cx="26.2" cy="35" r="2.2" fill="#2A332A" />
      <Circle cx="37.8" cy="35" r="2.2" fill="#2A332A" />
      <Path
        d="M30 39.2 Q32 41 34 39.2"
        fill="none"
        stroke="#4D574D"
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MiniDioramaIsland({ uid }: { uid: string }) {
  const hw = MINI_TILE_W / 2;
  const hh = MINI_TILE_H / 2;

  const topX = MINI_ORIGIN_X;
  const topY = MINI_ORIGIN_Y - hh;
  const rightX = MINI_ORIGIN_X + GRID_SIZE * hw;
  const rightY = MINI_ORIGIN_Y + (GRID_SIZE - 1) * hh;
  const bottomX = MINI_ORIGIN_X;
  const bottomY = MINI_ORIGIN_Y + (GRID_SIZE * 2 - 1) * hh;
  const leftX = MINI_ORIGIN_X - GRID_SIZE * hw;
  const leftY = MINI_ORIGIN_Y + (GRID_SIZE - 1) * hh;

  const padX = 16;
  const padY = 9;
  const oTopX = topX;
  const oTopY = topY - padY;
  const oRightX = rightX + padX;
  const oRightY = rightY;
  const oBottomX = bottomX;
  const oBottomY = bottomY + padY;
  const oLeftX = leftX - padX;
  const oLeftY = leftY;

  const rimD = 4.5;
  const soilD = 9;
  const rockD = 18;
  const underY = oBottomY + rockD + 14;

  const pondCx = oRightX - 50;
  const pondCy = oRightY + 26;
  const wfLipX = pondCx + 15;
  const wfLipY = pondCy + 3;

  return (
    <Svg
      width={MINI_WIDTH}
      height={MINI_HEIGHT}
      viewBox={`0 0 ${MINI_WIDTH} ${MINI_HEIGHT}`}
    >
      <Defs>
        <RadialGradient id={`${uid}_sh`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="rgba(26, 34, 28, 0.22)" />
          <Stop offset="100%" stopColor="rgba(26, 34, 28, 0)" />
        </RadialGradient>
        <LinearGradient id={`${uid}_gr`} x1="12%" y1="0%" x2="88%" y2="100%">
          <Stop offset="0%" stopColor="#E7F1DC" />
          <Stop offset="52%" stopColor="#D3E3C5" />
          <Stop offset="100%" stopColor="#BCD2AE" />
        </LinearGradient>
        <LinearGradient id={`${uid}_wf`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#A9DDE6" stopOpacity={0.95} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.08} />
        </LinearGradient>
      </Defs>

      {/* Floating island drop shadow */}
      <Ellipse
        cx={MINI_ORIGIN_X}
        cy={underY + 10}
        rx={GRID_SIZE * hw * 0.84}
        ry={8.5}
        fill={`url(#${uid}_sh)`}
      />

      {/* Tapered limestone underside */}
      <Polygon
        points={`${oLeftX + 12},${oLeftY + rockD + 3} ${oBottomX},${oBottomY + rockD} ${oBottomX},${underY} ${oLeftX + 44},${oLeftY + rockD + 14}`}
        fill="#7B6753"
      />
      <Polygon
        points={`${oBottomX},${oBottomY + rockD} ${oRightX - 12},${oRightY + rockD + 3} ${oRightX - 44},${oRightY + rockD + 14} ${oBottomX},${underY}`}
        fill="#625140"
      />

      {/* Weathered cliff walls */}
      <Polygon
        points={`${oLeftX + 3},${oLeftY + soilD} ${oBottomX},${oBottomY + soilD} ${oBottomX},${oBottomY + rockD} ${oLeftX + 12},${oLeftY + rockD + 3}`}
        fill="#9E8971"
      />
      <Polygon
        points={`${oBottomX},${oBottomY + soilD} ${oRightX - 3},${oRightY + soilD} ${oRightX - 12},${oRightY + rockD + 3} ${oBottomX},${oBottomY + rockD}`}
        fill="#806C57"
      />

      {/* Terracotta topsoil band */}
      <Polygon
        points={`${oLeftX},${oLeftY + rimD} ${oBottomX},${oBottomY + rimD} ${oBottomX},${oBottomY + soilD} ${oLeftX + 3},${oLeftY + soilD}`}
        fill="#AF825D"
      />
      <Polygon
        points={`${oBottomX},${oBottomY + rimD} ${oRightX},${oRightY + rimD} ${oRightX - 3},${oRightY + soilD} ${oBottomX},${oBottomY + soilD}`}
        fill="#916849"
      />

      {/* Lush overhanging moss rim */}
      <Polygon
        points={`${oLeftX},${oLeftY} ${oBottomX},${oBottomY} ${oBottomX},${oBottomY + rimD} ${oLeftX},${oLeftY + rimD}`}
        fill="#7CA26E"
      />
      <Polygon
        points={`${oBottomX},${oBottomY} ${oRightX},${oRightY} ${oRightX},${oRightY + rimD} ${oBottomX},${oBottomY + rimD}`}
        fill="#648A5A"
      />

      {/* Outer meadow verge & inner plateau */}
      <Polygon
        points={`${oTopX},${oTopY} ${oRightX},${oRightY} ${oBottomX},${oBottomY} ${oLeftX},${oLeftY}`}
        fill="#C4D7B3"
        stroke="rgba(54, 94, 68, 0.16)"
        strokeWidth={0.8}
      />
      <Polygon
        points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
        fill={`url(#${uid}_gr)`}
        stroke="rgba(54, 94, 68, 0.14)"
        strokeWidth={0.7}
      />

      {/* Gentle lawn clearings & stepping stones */}
      <Ellipse cx={MINI_ORIGIN_X - 28} cy={MINI_ORIGIN_Y + 54} rx={26} ry={11} fill="#E5F0D8" opacity={0.7} />
      <Ellipse cx={MINI_ORIGIN_X + 24} cy={MINI_ORIGIN_Y + 72} rx={22} ry={9.5} fill="#C3D7B2" opacity={0.55} />
      {[
        { cx: MINI_ORIGIN_X - 36, cy: MINI_ORIGIN_Y + 64 },
        { cx: MINI_ORIGIN_X - 18, cy: MINI_ORIGIN_Y + 71 },
        { cx: MINI_ORIGIN_X + 2, cy: MINI_ORIGIN_Y + 76 },
        { cx: MINI_ORIGIN_X + 22, cy: MINI_ORIGIN_Y + 72 },
      ].map((st, idx) => (
        <Ellipse
          key={`ms_${idx}`}
          cx={st.cx}
          cy={st.cy}
          rx={5}
          ry={2.6}
          fill="#DED8CA"
          stroke="#C2BBA8"
          strokeWidth={0.5}
        />
      ))}

      {/* Back-left birch trees & upper moss terrace accent */}
      <G>
        <Circle cx={oLeftX + 42} cy={oLeftY - 14} r={5.5} fill="#5B8C60" />
        <Circle cx={oLeftX + 48} cy={oLeftY - 18} r={5} fill="#76A878" />
        <Circle cx={oTopX + 12} cy={oTopY + 7} r={4.2} fill="#4E7D58" />
        <Circle cx={oTopX + 17} cy={oTopY + 9} r={3.5} fill="#67966C" />
      </G>

      {/* Mini back-right conservatory silhouette */}
      <G>
        <Polygon
          points={`${oTopX + 76},${oTopY + 26} ${oTopX + 86},${oTopY + 31} ${oTopX + 96},${oTopY + 26} ${oTopX + 86},${oTopY + 21}`}
          fill="#C2D9DE"
          stroke="#5C7B65"
          strokeWidth={0.7}
        />
        <Polygon
          points={`${oTopX + 77},${oTopY + 25} ${oTopX + 86},${oTopY + 17} ${oTopX + 95},${oTopY + 25}`}
          fill="#DCEFF2"
          stroke="#5C7B65"
          strokeWidth={0.7}
        />
      </G>

      {/* Mini lotus pond & cascading waterfall */}
      <Ellipse cx={pondCx} cy={pondCy} rx={17} ry={8} fill="#B9B5A6" />
      <Ellipse cx={pondCx} cy={pondCy + 0.5} rx={15} ry={6.8} fill="#6CAEC0" />
      <Ellipse cx={pondCx - 5} cy={pondCy + 1} rx={3} ry={1.6} fill="#5C9160" />
      <Path
        d={`M ${wfLipX - 3} ${wfLipY + 1} C ${wfLipX - 3} ${wfLipY + 14}, ${wfLipX - 4} ${wfLipY + 26}, ${wfLipX - 2} ${wfLipY + 35} L ${wfLipX + 3} ${wfLipY + 33} C ${wfLipX + 2} ${wfLipY + 24}, ${wfLipX + 4} ${wfLipY + 12}, ${wfLipX + 3} ${wfLipY - 1} Z`}
        fill={`url(#${uid}_wf)`}
      />
    </Svg>
  );
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
  const rawId = useId();
  const uid = `share_${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const reducedMotion = Boolean(useReducedMotion());
  const viewShotRef = useRef<ComponentRef<typeof ViewShot>>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStatusMessage(null);
    }
  }, [visible]);

  const pipCoord = useMemo(
    () => getAvailablePipWaypoints(placements)[0] ?? { x: 3, y: 4 },
    [placements],
  );

  const handleClose = () => {
    setStatusMessage(null);
    onClose();
  };

  if (!visible) {
    return null;
  }

  const sortedPlacements = [...placements].sort(
    (a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x,
  );

  const pipPos = gridToScreen(pipCoord.x, pipCoord.y, MINI_TILE_W, MINI_TILE_H);
  const pipSize = 26;

  const morningNoun = restfulDays === 1 ? 'morning' : 'mornings';
  const botanicalNoun = placements.length === 1 ? 'botanical' : 'botanicals';

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
      trackEvent('progress_card_shared', { days_tended: restfulDays });
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
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Share sanctuary</Text>
            <Pressable
              onPress={handleClose}
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
            {/* Studio Postcard Window: Soft Atmospheric Sky + Multi-Strata Meadow Diorama */}
            <View style={styles.postcardStage}>
              <Svg
                style={StyleSheet.absoluteFill}
                width="100%"
                height="100%"
                viewBox="0 0 340 220"
                preserveAspectRatio="none"
              >
                <Defs>
                  <LinearGradient id={`${uid}_sky`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#DCEAE7" />
                    <Stop offset="55%" stopColor="#EDF3EC" />
                    <Stop offset="100%" stopColor="#FAF4E6" />
                  </LinearGradient>
                  <RadialGradient id={`${uid}_sun`} cx="82%" cy="18%" r="48%">
                    <Stop offset="0%" stopColor="#FFF6DC" stopOpacity={0.72} />
                    <Stop offset="100%" stopColor="#FFF6DC" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect x={0} y={0} width={340} height={220} fill={`url(#${uid}_sky)`} />
                <Rect x={0} y={0} width={340} height={220} fill={`url(#${uid}_sun)`} />
                {/* Soft drifting studio clouds */}
                <Path
                  d="M 26 42 C 18 42, 16 34, 22 31 C 24 23, 35 21, 42 25 C 48 18, 62 18, 68 25 C 76 23, 86 28, 86 35 C 94 35, 96 42, 88 42 Z"
                  fill="#FFFFFF"
                  opacity={0.72}
                />
                <Path
                  d="M 244 34 C 238 34, 236 28, 241 26 C 243 20, 251 19, 256 22 C 261 17, 271 17, 276 23 C 283 22, 289 27, 287 34 Z"
                  fill="#FFFFFF"
                  opacity={0.62}
                />
                {/* Distant horizon hills */}
                <Path
                  d="M 0 182 Q 86 164 178 176 T 340 170 L 340 220 L 0 220 Z"
                  fill="#D6E4D5"
                  opacity={0.55}
                />
              </Svg>

              <View style={styles.cardTopRow}>
                <View style={styles.brandBadge}>
                  <Sprout size={14} strokeWidth={1.7} color={palette.accentMoss} />
                  <Text style={styles.brandText}>Dewy</Text>
                </View>
                <Text style={styles.cardCaption}>Sunlit Meadow</Text>
              </View>

              <View style={styles.previewWrap}>
                <View style={{ width: MINI_WIDTH, height: MINI_HEIGHT }}>
                  <MiniDioramaIsland uid={uid} />

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
                      const growthStage = getGrowthStage(placement, item);
                      const heroScale = HERO_MINI_SCALES[item.assetKey] ?? 1;
                      const spriteSize = Math.round(26 * heroScale);
                      return (
                        <View
                          key={`mini_sprite_${placement.id}`}
                          style={{
                            position: 'absolute',
                            left: MINI_ORIGIN_X + sx - spriteSize / 2,
                            top: MINI_ORIGIN_Y + sy - Math.round(0.82 * spriteSize) + 2,
                            zIndex: placement.x + placement.y + 1,
                          }}
                        >
                          <GardenSprite
                            assetKey={item.assetKey}
                            size={spriteSize}
                            growthStage={growthStage}
                          />
                        </View>
                      );
                    })}

                    {/* Pip the Meadow Spirit resting on the scenic meadow */}
                    <View
                      style={{
                        position: 'absolute',
                        left: MINI_ORIGIN_X + pipPos.sx - pipSize / 2,
                        top: MINI_ORIGIN_Y + pipPos.sy - pipSize + 6,
                        zIndex: pipCoord.x + pipCoord.y + 2,
                      }}
                    >
                      <MiniPipBadge size={pipSize} />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Editorial Lora Keepsake Headline & Stats Strip */}
            <View style={styles.postcardFooter}>
              <View style={styles.headlineBlock}>
                <Text style={styles.milestoneHeadline}>
                  {restfulDays} restful {morningNoun} grew this meadow
                </Text>
                <Text style={styles.milestoneSubline}>
                  {placements.length} {botanicalNoun} tending
                </Text>
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
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
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
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  postcardStage: {
    position: 'relative',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  brandText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: palette.textPrimary,
  },
  cardCaption: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: palette.textSecondary,
  },
  previewWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  postcardFooter: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  headlineBlock: {
    gap: 2,
  },
  milestoneHeadline: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 17,
    lineHeight: 23,
    color: palette.textPrimary,
  },
  milestoneSubline: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
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
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.textMuted,
  },
  statValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
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
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
