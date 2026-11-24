import { Tabs } from 'expo-router';
import { BarChart2, Sprout, Store } from 'lucide-react-native';
import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, palette, spacing } from '@/theme/tokens';
import { hapticSelection } from '@/utils/haptics';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.sm);

  return (
    <Tabs
      screenListeners={{
        tabPress: () => hapticSelection(),
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accentMoss,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(250, 248, 244, 0.88)',
          borderTopColor: 'rgba(30, 36, 30, 0.08)',
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 62 + bottomInset,
          paddingTop: spacing.xs,
          paddingBottom: bottomInset,
          elevation: 0,
          ...(Platform.OS === 'web'
            ? ({
                backdropFilter: 'blur(16px) saturate(150%)',
                WebkitBackdropFilter: 'blur(16px) saturate(150%)',
              } as ViewStyle)
            : {}),
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 12,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="sanctuary"
        options={{
          title: 'Sanctuary',
          tabBarAccessibilityLabel: 'Sanctuary tab',
          tabBarIcon: ({ color }) => (
            <Sprout size={20} strokeWidth={1.5} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarAccessibilityLabel: 'Shop tab',
          tabBarIcon: ({ color }) => (
            <Store size={20} strokeWidth={1.5} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarAccessibilityLabel: 'Insights tab',
          tabBarIcon: ({ color }) => (
            <BarChart2 size={20} strokeWidth={1.5} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
