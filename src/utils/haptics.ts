import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function runHaptic(task: () => Promise<void>): void {
  if (Platform.OS === 'web') {
    return;
  }
  void task().catch(() => {});
}

/** Subtle selection tick for filter chips, tab switches, plan cards, and goal steppers. */
export function hapticSelection(): void {
  runHaptic(() => Haptics.selectionAsync());
}

/** Light impact for subtle taps and selecting an existing plant to move. */
export function hapticLight(): void {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Medium impact for planting or moving flora onto the isometric meadow. */
export function hapticMedium(): void {
  runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Success notification for completed trials, purchases, reveals, or lantern starts. */
export function hapticSuccess(): void {
  runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
}

/** Warning notification when placement fails (occupied tile or insufficient funds). */
export function hapticWarning(): void {
  runHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  );
}
