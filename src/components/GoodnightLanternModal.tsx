import { Moon, Sunrise, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { MIN_VALID_REST_MIN } from '@/domain/lantern';
import type { LanternSession } from '@/domain/types';
import { fonts, nightPalette, radii, spacing } from '@/theme/tokens';

export interface GoodnightLanternModalProps {
  visible: boolean;
  activeLantern: LanternSession | null;
  onStartLantern: () => void;
  onFinishLantern: () => void;
  onClose: () => void;
}

function formatElapsed(startedAtIso: string, nowMs: number): {
  label: string;
  elapsedMin: number;
} {
  const startMs = Date.parse(startedAtIso);
  const diffMs = Number.isFinite(startMs) ? Math.max(0, nowMs - startMs) : 0;
  const elapsedMin = Math.floor(diffMs / 60_000);
  const hours = Math.floor(elapsedMin / 60);
  const mins = elapsedMin % 60;
  const label = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return { label, elapsedMin };
}

function LanternSvg() {
  return (
    <Svg width={104} height={104} viewBox="0 0 104 104" fill="none">
      <Circle cx="52" cy="54" r="42" fill={nightPalette.accentLantern} fillOpacity={0.09} />
      <Circle cx="52" cy="54" r="28" fill={nightPalette.accentLantern} fillOpacity={0.14} />
      <Circle cx="22" cy="24" r="1.5" fill={nightPalette.textSecondary} fillOpacity={0.6} />
      <Circle cx="82" cy="28" r="1.8" fill={nightPalette.textSecondary} fillOpacity={0.5} />
      <Circle cx="76" cy="78" r="1.3" fill={nightPalette.textSecondary} fillOpacity={0.45} />
      <Path
        d="M42 32 Q52 20 62 32"
        stroke={nightPalette.textSecondary}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <Rect x="36" y="32" width="32" height="4" rx="2" fill="#46514B" />
      <Rect
        x="38"
        y="36"
        width="28"
        height="34"
        rx="8"
        fill={nightPalette.surfaceElevated}
        stroke="#57635C"
        strokeWidth="1.5"
      />
      <Rect
        x="43"
        y="41"
        width="18"
        height="24"
        rx="5"
        fill={nightPalette.accentLantern}
        fillOpacity={0.85}
      />
      <Circle cx="52" cy="53" r="4.5" fill="#FFF4D6" />
      <Rect x="36" y="70" width="32" height="5" rx="2.5" fill="#46514B" />
    </Svg>
  );
}

export function GoodnightLanternModal({
  visible,
  activeLantern,
  onStartLantern,
  onFinishLantern,
  onClose,
}: GoodnightLanternModalProps) {
  const reducedMotion = useReducedMotion();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!visible || !activeLantern) {
      return;
    }
    setNowMs(Date.now());
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => clearInterval(interval);
  }, [visible, activeLantern]);

  if (!visible) {
    return null;
  }

  const elapsed = activeLantern
    ? formatElapsed(activeLantern.startedAt, nowMs)
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.topBar}>
            <View style={styles.statusRow}>
              <Moon size={16} strokeWidth={1.5} color={nightPalette.accentLantern} />
              <Text style={styles.statusLabel}>
                {activeLantern ? 'Lantern glowing' : 'Evening wind-down'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close goodnight lantern"
              style={styles.closeButton}
            >
              <X size={18} strokeWidth={1.5} color={nightPalette.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.illustrationWrap}>
            <LanternSvg />
          </View>

          <Text style={styles.title}>
            {activeLantern ? 'Rest well tonight' : 'Goodnight lantern'}
          </Text>

          {activeLantern && elapsed ? (
            <View style={styles.elapsedBlock}>
              <Text style={styles.elapsedValue}>{elapsed.label}</Text>
              <Text style={styles.body}>
                {elapsed.elapsedMin < MIN_VALID_REST_MIN
                  ? 'Sessions over 1 hour gather morning dew when you wake.'
                  : 'Your lantern is ready to gather morning dew whenever you wake.'}
              </Text>
            </View>
          ) : (
            <Text style={styles.body}>
              Set your phone beside you as you wind down. In the morning, return
              here to clear the mist and gather dew for your meadow.
            </Text>
          )}

          <View style={styles.actions}>
            {activeLantern ? (
              <>
                <Pressable
                  onPress={onFinishLantern}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="I am awake — reveal morning"
                  style={styles.primaryLanternButton}
                >
                  <Sunrise size={18} strokeWidth={1.6} color={nightPalette.bg} />
                  <Text style={styles.primaryLanternLabel}>
                    I am awake — reveal morning
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Keep lantern lit"
                  style={styles.secondaryLanternButton}
                >
                  <Text style={styles.secondaryLanternLabel}>
                    Keep lantern lit
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  onPress={onStartLantern}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Start goodnight lantern"
                  style={styles.primaryLanternButton}
                >
                  <Moon size={18} strokeWidth={1.6} color={nightPalette.bg} />
                  <Text style={styles.primaryLanternLabel}>
                    Start goodnight lantern
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Not tonight"
                  style={styles.secondaryLanternButton}
                >
                  <Text style={styles.secondaryLanternLabel}>Not tonight</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 12, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: nightPalette.bg,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: nightPalette.border,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: nightPalette.textSecondary,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  title: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 24,
    letterSpacing: -0.3,
    color: nightPalette.textPrimary,
    textAlign: 'center',
  },
  elapsedBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  elapsedValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 32,
    color: nightPalette.accentLantern,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: nightPalette.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryLanternButton: {
    minHeight: 48,
    backgroundColor: nightPalette.accentLantern,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  primaryLanternLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: nightPalette.bg,
  },
  secondaryLanternButton: {
    minHeight: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryLanternLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: nightPalette.textSecondary,
  },
});
