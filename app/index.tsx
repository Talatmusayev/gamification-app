import { StyleSheet, Text, View } from 'react-native';
import { palette, spacing } from '@/theme/tokens';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dew &amp; Bloom</Text>
      <Text style={styles.subtitle}>Your restorative sanctuary is waking up.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.bg,
    padding: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: 'center',
  },
});
