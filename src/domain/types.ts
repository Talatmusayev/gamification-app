export type TrackingMode = 'apple_health' | 'health_connect' | 'manual';

export type FogLevel = 'clear' | 'light_mist' | 'cozy_fog';

export type ItemCategory = 'flora' | 'decor' | 'lantern' | 'companion' | 'terrain';

export interface UserProfile {
  sleepGoalMin: number;
  stepGoal: number;
  bedtimeTargetMin?: number;
  trackingMode: TrackingMode;
  dewBalance: number;
  sunlightBalance: number;
  fogLevel: FogLevel;
  isPro: boolean;
  onboardingCompleted: boolean;
}

export interface DailyLog {
  dateKey: string;
  sleepMin: number;
  steps: number;
  dewAwarded: number;
  sunlightAwarded: number;
  revealedAt: string;
  aiInsight: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  category: ItemCategory;
  dewCost: number;
  sunlightCost: number;
  description: string;
  isProOnly?: boolean;
}

export interface GardenPlacement {
  id: string;
  itemId: string;
  x: number;
  y: number;
  placedAt: string;
}

export interface LanternSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMin: number;
  completed: boolean;
  bonusDewAwarded: number;
}

export interface MorningRevealInput {
  dateKey: string;
  sleepMin: number;
  steps: number;
  sleepGoalMin: number;
  stepGoal: number;
  bedtimeTargetMin?: number;
  actualBedtimeMin?: number;
  currentFogLevel: FogLevel;
  missedDays?: number;
}

export interface MorningRevealResult {
  dewAwarded: number;
  sunlightAwarded: number;
  nextFogLevel: FogLevel;
  sleepRatio: number;
  stepRatio: number;
  aiInsight: string;
}
