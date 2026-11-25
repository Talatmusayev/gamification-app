export type TrackingMode = 'health_sync' | 'phone_only' | 'apple_health' | 'health_connect' | 'manual';

export type FogLevel = 0 | 1 | 2 | 3;

export type ItemCategory = 'plant' | 'decor' | 'critter';

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
  guestPassEndsAt?: string | null;
  guestPassUsed?: boolean;
  trialReminderOptIn?: boolean;
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
  isPro: boolean;
  assetKey: string;
  description: string;
}

export type GrowthStage = 1 | 2 | 3;

export interface GardenPlacement {
  id: string;
  itemId: string;
  x: number;
  y: number;
  placedAt: string;
  growthStage?: GrowthStage;
  lastWateredAt?: string;
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
  alreadyRevealed: boolean;
  dewAwarded: number;
  sunlightAwarded: number;
  newFogLevel: FogLevel;
  keeperNote: string;
  log: DailyLog;
  momentumTier?: 0 | 1 | 2 | 3;
  momentumMultiplier?: number;
  momentumLabel?: string | null;
}
