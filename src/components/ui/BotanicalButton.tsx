import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { fonts, palette, radii, spacing, springs } from '@/theme/tokens';
import { hapticLight } from '@/utils/haptics';

export type BotanicalButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface BotanicalButtonProps {
  label: string;
  onPress: () => void;
  variant?: BotanicalButtonVariant;
  disabled?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BotanicalButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  iconLeft,
  iconRight,
  accessibilityLabel,
  accessibilityHint,
  fullWidth = false,
  haptic = true,
  style,
  testID,
}: BotanicalButtonProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const pressedOpacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0.45 : pressedOpacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    if (disabled) {
      return;
    }
    if (reducedMotion) {
      pressedOpacity.value = withTiming(0.75, { duration: 110 });
      return;
    }
    scale.value = withTiming(0.975, { duration: 110 });
    translateY.value = withTiming(1.5, { duration: 110 });
  };

  const handlePressOut = () => {
    if (reducedMotion) {
      pressedOpacity.value = withTiming(1, { duration: 110 });
      return;
    }
    scale.value = withSpring(1, springs.tactile);
    translateY.value = withSpring(0, springs.tactile);
  };

  const handlePress = () => {
    if (disabled) {
      return;
    }
    if (haptic) {
      hapticLight();
    }
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      testID={testID}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {iconLeft ? <View style={styles.iconSlot}>{iconLeft}</View> : null}
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.labelPrimary,
          variant === 'secondary' && styles.labelSecondary,
          variant === 'ghost' && styles.labelGhost,
        ]}
      >
        {label}
      </Text>
      {iconRight ? <View style={styles.iconSlot}>{iconRight}</View> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: palette.accentMoss,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#1E241E',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  secondary: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  labelPrimary: {
    color: palette.accentMossText,
  },
  labelSecondary: {
    color: palette.textPrimary,
  },
  labelGhost: {
    color: palette.textSecondary,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
