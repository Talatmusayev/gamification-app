import { pickKeeperFallbackNote } from '@/domain/keeperFallback';
import type { DailyLog } from '@/domain/types';
import {
  fetchGardenKeeperInsight,
  syncMorningReveal,
  syncProfileGoals,
} from '@/services/syncService';
import { supabase } from '@/services/supabase';

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

const mockGetUser = supabase!.auth.getUser as jest.Mock;
const mockRpc = supabase!.rpc as jest.Mock;
const mockFrom = supabase!.from as jest.Mock;
const mockInvoke = supabase!.functions.invoke as jest.Mock;

const sampleLog: DailyLog = {
  dateKey: '2026-11-24',
  sleepMin: 465,
  steps: 8400,
  dewAwarded: 125,
  sunlightAwarded: 110,
  revealedAt: '2026-11-24T07:30:00.000Z',
  aiInsight: 'Quiet morning light across the clover.',
};

describe('syncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('syncMorningReveal', () => {
    it('returns { synced: false } when user is unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await syncMorningReveal({
        dateKey: '2026-11-24',
        sleepMin: 465,
        steps: 8400,
        bedtimeOffsetMin: 10,
        source: 'phone_only',
        sleepGoalMin: 480,
        stepGoal: 8000,
        fogCleared: false,
      });

      expect(result).toEqual({ synced: false });
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('maps RPC success payload cleanly when authenticated and online', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockRpc.mockResolvedValue({
        data: {
          already_revealed: false,
          dew_awarded: 125,
          sunlight_awarded: 110,
          new_fog_level: 0,
          dew_balance: 225,
          sunlight_balance: 310,
        },
        error: null,
      });

      const result = await syncMorningReveal({
        dateKey: '2026-11-24',
        sleepMin: 465,
        steps: 8400,
        bedtimeOffsetMin: 10,
        source: 'phone_only',
        sleepGoalMin: 480,
        stepGoal: 8000,
        fogCleared: true,
      });

      expect(mockRpc).toHaveBeenCalledWith('dew_claim_morning_reveal', {
        p_log_date: '2026-11-24',
        p_sleep_min: 465,
        p_steps: 8400,
        p_bedtime_offset_min: 10,
        p_source: 'phone_only',
      });
      expect(result).toEqual({
        synced: true,
        alreadyRevealed: false,
        dewAwarded: 125,
        sunlightAwarded: 110,
        newFogLevel: 0,
        dewBalance: 225,
        sunlightBalance: 310,
      });
    });

    it('returns { synced: false } without throwing when RPC errors or rejects', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockRpc.mockRejectedValue(new Error('Network offline'));

      const result = await syncMorningReveal({
        dateKey: '2026-11-24',
        sleepMin: 465,
        steps: 8400,
        sleepGoalMin: 480,
        stepGoal: 8000,
        fogCleared: false,
      });

      expect(result).toEqual({ synced: false });
    });
  });

  describe('fetchGardenKeeperInsight', () => {
    it('returns AI insight when authenticated and Edge Function succeeds', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockInvoke.mockResolvedValue({
        data: {
          insight: 'Soft mist settled over the clover while your rest held steady.',
          mood_tag: 'calm',
          source: 'ai',
        },
        error: null,
      });

      const result = await fetchGardenKeeperInsight({
        sleepGoalMin: 480,
        stepGoal: 8000,
        recentLogs: [sampleLog],
        fogCleared: false,
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        'dew-garden-keeper-insight',
        expect.objectContaining({
          body: expect.objectContaining({
            sleep_goal_min: 480,
            step_goal: 8000,
            fog_cleared: false,
          }),
        }),
      );
      expect(result).toEqual({
        insight: 'Soft mist settled over the clover while your rest held steady.',
        source: 'ai',
        moodTag: 'calm',
      });
    });

    it('falls back to pickKeeperFallbackNote when unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await fetchGardenKeeperInsight({
        sleepGoalMin: 480,
        stepGoal: 8000,
        recentLogs: [sampleLog],
        fogCleared: false,
      });

      expect(mockInvoke).not.toHaveBeenCalled();
      expect(result).toEqual({
        insight: pickKeeperFallbackNote(465, 480, 8400, false),
        source: 'fallback',
      });
    });

    it('falls back to pickKeeperFallbackNote when Edge Function errors', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const result = await fetchGardenKeeperInsight({
        sleepGoalMin: 480,
        stepGoal: 8000,
        recentLogs: [sampleLog],
        fogCleared: true,
      });

      expect(result).toEqual({
        insight: pickKeeperFallbackNote(465, 480, 8400, true),
        source: 'fallback',
      });
    });

    it('falls back to pickKeeperFallbackNote when Edge Function exceeds 3s timeout', async () => {
      jest.useFakeTimers();
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockInvoke.mockImplementation(
        () =>
          new Promise(() => {
            // Never resolves within 3s
          }),
      );

      const promise = fetchGardenKeeperInsight({
        sleepGoalMin: 480,
        stepGoal: 8000,
        recentLogs: [sampleLog],
        fogCleared: false,
      });

      await jest.advanceTimersByTimeAsync(3100);
      const result = await promise;

      expect(result).toEqual({
        insight: pickKeeperFallbackNote(465, 480, 8400, false),
        source: 'fallback',
      });
    });
  });

  describe('syncProfileGoals', () => {
    it('upserts dew_profiles without protected balance fields when authenticated', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const result = await syncProfileGoals({
        sleepGoalMin: 450,
        stepGoal: 7000,
        trackingMode: 'apple_health',
        onboardingCompleted: true,
      });

      expect(mockFrom).toHaveBeenCalledWith('dew_profiles');
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: 'user-123',
          sleep_goal_min: 450,
          step_goal: 7000,
          tracking_mode: 'health_sync',
          onboarding_completed: true,
        },
        { onConflict: 'user_id' },
      );
      expect(result).toEqual({ synced: true });
    });

    it('returns { synced: false } when unauthenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const result = await syncProfileGoals({
        sleepGoalMin: 450,
        stepGoal: 7000,
        trackingMode: 'phone_only',
        onboardingCompleted: true,
      });

      expect(result).toEqual({ synced: false });
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
