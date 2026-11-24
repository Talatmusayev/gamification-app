import { Platform, type ViewStyle } from 'react-native';

// ponytail: zero-dep translucent liquid glass; swap in expo-blur BlurView when cutting native EAS builds.
export const liquidGlassSurface: ViewStyle = {
  backgroundColor: 'rgba(252, 250, 246, 0.78)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.72)',
  shadowColor: '#1E241E',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
  ...(Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      } as ViewStyle)
    : {}),
};

export const liquidGlassSubtle: ViewStyle = {
  backgroundColor: 'rgba(252, 250, 246, 0.68)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.62)',
  shadowColor: '#1E241E',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
  ...(Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(14px) saturate(150%)',
        WebkitBackdropFilter: 'blur(14px) saturate(150%)',
      } as ViewStyle)
    : {}),
};
