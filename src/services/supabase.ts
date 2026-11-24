import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type DewProfileRow = {
  user_id: string;
  timezone: string;
  sleep_goal_min: number;
  step_goal: number;
  bedtime_target_min: number | null;
  tracking_mode: 'phone_only' | 'health_sync';
  dew_balance: number;
  sunlight_balance: number;
  fog_level: number;
  is_pro: boolean;
  onboarding_completed: boolean;
  last_ai_insight_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DewProfileUpsert = {
  user_id: string;
  timezone?: string;
  sleep_goal_min?: number;
  step_goal?: number;
  bedtime_target_min?: number | null;
  tracking_mode?: 'phone_only' | 'health_sync';
  onboarding_completed?: boolean;
};

export type DewDailyLogRow = {
  id: string;
  user_id: string;
  log_date: string;
  sleep_min: number;
  steps: number;
  source: string;
  dew_awarded: number;
  sunlight_awarded: number;
  revealed_at: string;
  ai_insight: string;
};

export type DewDuoGardenRow = {
  id: string;
  name: string;
  invite_code: string;
  biome_id: string;
  created_by: string;
  created_at: string;
};

export type DewDuoMemberRow = {
  garden_id: string;
  user_id: string;
  display_name: string;
  role: 'owner' | 'partner';
  joined_at: string;
};

export type DewDuoPlacementRow = {
  id: string;
  garden_id: string;
  placed_by: string;
  item_id: string;
  grid_x: number;
  grid_y: number;
  placed_at: string;
};

export type DewSunlightNudgeRow = {
  id: string;
  garden_id: string;
  sender_id: string;
  recipient_id: string;
  nudge_date: string;
  message: string;
  created_at: string;
};

export type DewDatabase = {
  public: {
    Tables: {
      dew_profiles: {
        Row: DewProfileRow;
        Insert: DewProfileUpsert;
        Update: Partial<DewProfileUpsert>;
        Relationships: [];
      };
      dew_daily_logs: {
        Row: DewDailyLogRow;
        Insert: Record<string, never>;
        Update: Record<string, never>;
        Relationships: [];
      };
      dew_duo_gardens: {
        Row: DewDuoGardenRow;
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          biome_id?: string;
          created_by: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      dew_duo_members: {
        Row: DewDuoMemberRow;
        Insert: {
          garden_id: string;
          user_id: string;
          display_name: string;
          role: 'owner' | 'partner';
        };
        Update: {
          display_name?: string;
        };
        Relationships: [];
      };
      dew_duo_placements: {
        Row: DewDuoPlacementRow;
        Insert: {
          id?: string;
          garden_id: string;
          placed_by: string;
          item_id: string;
          grid_x: number;
          grid_y: number;
        };
        Update: {
          grid_x?: number;
          grid_y?: number;
        };
        Relationships: [];
      };
      dew_sunlight_nudges: {
        Row: DewSunlightNudgeRow;
        Insert: {
          id?: string;
          garden_id: string;
          sender_id: string;
          recipient_id: string;
          nudge_date: string;
          message: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      dew_claim_morning_reveal: {
        Args: {
          p_log_date: string;
          p_sleep_min: number;
          p_steps: number;
          p_bedtime_offset_min?: number | null;
          p_source?: string;
        };
        Returns: {
          already_revealed: boolean;
          dew_awarded: number;
          sunlight_awarded: number;
          new_fog_level: number;
          dew_balance: number;
          sunlight_balance: number;
          log: DewDailyLogRow;
        };
      };
      dew_join_duo_garden: {
        Args: {
          p_invite_code: string;
          p_display_name: string;
        };
        Returns: DewDuoGardenRow;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

const memoryStorage = new Map<string, string>();

const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return memoryStorage.get(key) ?? null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return memoryStorage.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStorage.set(key, value);
    if (Platform.OS === 'web') {
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Fallback to in-memory storage when SecureStore is unavailable (e.g., Jest).
    }
  },

  async removeItem(key: string): Promise<void> {
    memoryStorage.delete(key);
    if (Platform.OS === 'web') {
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore in environments without SecureStore.
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export const supabase: SupabaseClient<DewDatabase> | null = isSupabaseConfigured()
  ? createClient<DewDatabase>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: secureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
