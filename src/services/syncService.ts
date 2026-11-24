import { pickKeeperFallbackNote } from '@/domain/keeperFallback';
import type { DailyLog, TrackingMode } from '@/domain/types';
import { supabase } from './supabase';

const INSIGHT_TIMEOUT_MS = 3000;

export interface SyncMorningRevealInput {
  dateKey: string;
  sleepMin: number;
  steps: number;
  bedtimeOffsetMin?: number;
  source?: string;
  sleepGoalMin: number;
  stepGoal: number;
  fogCleared: boolean;
}

export type SyncMorningRevealResult =
  | { synced: false }
  | {
      synced: true;
      alreadyRevealed: boolean;
      dewAwarded: number;
      sunlightAwarded: number;
      newFogLevel: number;
      dewBalance: number;
      sunlightBalance: number;
    };

export interface FetchGardenKeeperInsightInput {
  sleepGoalMin: number;
  stepGoal: number;
  recentLogs: DailyLog[];
  fogCleared: boolean;
}

export interface FetchGardenKeeperInsightResult {
  insight: string;
  source: 'ai' | 'fallback';
  moodTag?: string;
}

export interface SyncProfileGoalsInput {
  sleepGoalMin: number;
  stepGoal: number;
  trackingMode: TrackingMode;
  onboardingCompleted: boolean;
}

interface EdgeInsightResponse {
  insight?: string;
  mood_tag?: string;
  source?: string;
}

function toDbTrackingMode(mode: TrackingMode): 'phone_only' | 'health_sync' {
  if (mode === 'health_sync' || mode === 'apple_health' || mode === 'health_connect') {
    return 'health_sync';
  }
  return 'phone_only';
}

function getLatestLog(logs: DailyLog[]): DailyLog | null {
  if (logs.length === 0) {
    return null;
  }
  return [...logs].sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0] ?? null;
}

function buildFallbackInsight(input: FetchGardenKeeperInsightInput): FetchGardenKeeperInsightResult {
  const latest = getLatestLog(input.recentLogs);
  return {
    insight: pickKeeperFallbackNote(
      latest?.sleepMin ?? 0,
      input.sleepGoalMin,
      latest?.steps ?? 0,
      input.fogCleared,
    ),
    source: 'fallback',
  };
}

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!supabase) {
    return null;
  }
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user.id;
  } catch {
    return null;
  }
}

export async function syncMorningReveal(
  input: SyncMorningRevealInput,
): Promise<SyncMorningRevealResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) {
    return { synced: false };
  }

  try {
    const { data, error } = await supabase.rpc('dew_claim_morning_reveal', {
      p_log_date: input.dateKey,
      p_sleep_min: input.sleepMin,
      p_steps: input.steps,
      p_bedtime_offset_min: input.bedtimeOffsetMin ?? null,
      p_source: input.source ?? 'phone_only',
    });

    if (error || !data) {
      return { synced: false };
    }

    return {
      synced: true,
      alreadyRevealed: Boolean(data.already_revealed),
      dewAwarded: data.dew_awarded,
      sunlightAwarded: data.sunlight_awarded,
      newFogLevel: data.new_fog_level,
      dewBalance: data.dew_balance,
      sunlightBalance: data.sunlight_balance,
    };
  } catch {
    return { synced: false };
  }
}

export async function fetchGardenKeeperInsight(
  input: FetchGardenKeeperInsightInput,
): Promise<FetchGardenKeeperInsightResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) {
    return buildFallbackInsight(input);
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const anonymizedLogs = [...input.recentLogs]
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      .slice(0, 7)
      .map((log) => ({
        date: log.dateKey,
        sleep_min: log.sleepMin,
        steps: log.steps,
      }));

    const invokePromise = supabase.functions.invoke<EdgeInsightResponse>(
      'dew-garden-keeper-insight',
      {
        body: {
          sleep_goal_min: input.sleepGoalMin,
          step_goal: input.stepGoal,
          fog_cleared: input.fogCleared,
          recent_logs: anonymizedLogs,
        },
      },
    );

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Garden keeper insight timeout'));
      }, INSIGHT_TIMEOUT_MS);
    });

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    if (error || !data?.insight || typeof data.insight !== 'string') {
      return buildFallbackInsight(input);
    }

    return {
      insight: data.insight.trim(),
      source: data.source === 'fallback' ? 'fallback' : 'ai',
      moodTag: data.mood_tag,
    };
  } catch {
    return buildFallbackInsight(input);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export async function syncProfileGoals(
  input: SyncProfileGoalsInput,
): Promise<{ synced: boolean }> {
  const userId = await getAuthenticatedUserId();
  if (!userId || !supabase) {
    return { synced: false };
  }

  try {
    const { error } = await supabase.from('dew_profiles').upsert(
      {
        user_id: userId,
        sleep_goal_min: input.sleepGoalMin,
        step_goal: input.stepGoal,
        tracking_mode: toDbTrackingMode(input.trackingMode),
        onboarding_completed: input.onboardingCompleted,
      },
      { onConflict: 'user_id' },
    );

    return { synced: !error };
  } catch {
    return { synced: false };
  }
}
