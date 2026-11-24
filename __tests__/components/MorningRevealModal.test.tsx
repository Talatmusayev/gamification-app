import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { MorningRevealModal } from '@/components/MorningRevealModal';
import type { MorningRevealResult } from '@/domain/types';

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);
  return {
    Droplets: Icon,
    Footprints: Icon,
    Moon: Icon,
    Sparkles: Icon,
    Sun: Icon,
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'Light' },
  NotificationFeedbackType: { Success: 'Success' },
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Pressable } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component: React.ComponentType<unknown>) =>
        Component === Pressable ? Pressable : View,
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: (fn: () => Record<string, unknown>) => fn(),
    useReducedMotion: () => true,
    withTiming: (v: unknown) => v,
  };
});

const SAMPLE_REVEAL: MorningRevealResult = {
  alreadyRevealed: false,
  dewAwarded: 68,
  sunlightAwarded: 42,
  newFogLevel: 0,
  keeperNote: 'Seven restful hours settled into morning dew across the clover.',
  log: {
    dateKey: '2026-11-24',
    sleepMin: 450,
    steps: 8240,
    dewAwarded: 68,
    sunlightAwarded: 42,
    revealedAt: '2026-11-24T07:15:00.000Z',
    aiInsight: 'Seven restful hours settled into morning dew across the clover.',
  },
};

describe('MorningRevealModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sleep summary, steps summary, Dew and Sunlight earned, and Garden Keeper note', async () => {
    const onClearMist = jest.fn();
    await render(
      <MorningRevealModal
        visible
        reveal={SAMPLE_REVEAL}
        onClearMist={onClearMist}
      />,
    );

    expect(screen.getByText('Morning reveal')).toBeTruthy();
    expect(screen.getByText('7h 30m')).toBeTruthy();
    expect(screen.getByText('8,240')).toBeTruthy();
    expect(screen.getByText('+68')).toBeTruthy();
    expect(screen.getByText('+42')).toBeTruthy();
    expect(
      screen.getByText('Seven restful hours settled into morning dew across the clover.'),
    ).toBeTruthy();
  });

  it('calls onClearMist and triggers success haptics when Clear morning mist is pressed', async () => {
    const onClearMist = jest.fn();
    await render(
      <MorningRevealModal
        visible
        reveal={SAMPLE_REVEAL}
        onClearMist={onClearMist}
      />,
    );

    const button = screen.getByRole('button', { name: 'Clear morning mist' });
    fireEvent.press(button);

    expect(onClearMist).toHaveBeenCalledTimes(1);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });

  it('renders nothing when reveal is null', async () => {
    await render(
      <MorningRevealModal visible reveal={null} onClearMist={jest.fn()} />,
    );

    expect(screen.queryByText('Morning reveal')).toBeNull();
  });
});
