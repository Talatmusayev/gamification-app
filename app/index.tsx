import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSanctuaryStore } from '@/state/useSanctuaryStore';
import { palette } from '@/theme/tokens';

export default function IndexScreen() {
  const onboardingCompleted = useSanctuaryStore(
    (s) => s.profile.onboardingCompleted,
  );
  const [hydrated, setHydrated] = useState<boolean>(() =>
    useSanctuaryStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useSanctuaryStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsubscribe = useSanctuaryStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsubscribe;
  }, []);

  if (!hydrated) {
    return <View style={styles.loadingSurface} />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/sanctuary" />;
}

const styles = StyleSheet.create({
  loadingSurface: {
    flex: 1,
    backgroundColor: palette.bg,
  },
});
