import type { GardenPlacement } from './types';

export const DUO_INVITE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const DUO_INVITE_CODE_LENGTH = 6;
export const DUO_MAX_MEMBERS = 2;

export type DuoMemberRole = 'owner' | 'partner';

export interface DuoMember {
  userId: string;
  displayName: string;
  role: DuoMemberRole;
  joinedAt: string;
}

export interface DuoPlacement extends GardenPlacement {
  placedBy?: string;
}

export interface SunlightNudge {
  id: string;
  gardenId: string;
  senderId: string;
  recipientId: string;
  nudgeDate: string;
  message: string;
  createdAt: string;
}

export interface DuoGarden {
  id: string;
  name: string;
  inviteCode: string;
  biomeId: string;
  createdBy: string;
  createdAt: string;
  members: DuoMember[];
  placements: DuoPlacement[];
  lastNudgeSentDateKey: string | null;
  lastNudgeReceived?: SunlightNudge | null;
}

const VALID_INVITE_CHAR_SET = new Set(DUO_INVITE_ALPHABET.split(''));

/**
 * Generates a 6-character unambiguous uppercase alphanumeric invite code,
 * omitting visually similar characters (0, O, 1, I, L).
 */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < DUO_INVITE_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * DUO_INVITE_ALPHABET.length);
    code += DUO_INVITE_ALPHABET.charAt(index);
  }
  return code;
}

/**
 * Normalizes user-entered invite codes by trimming whitespace,
 * removing spaces/hyphens, and uppercasing.
 */
export function normalizeInviteCode(raw: string): string {
  return raw.trim().replace(/[\s-]+/g, '').toUpperCase();
}

/**
 * Validates that a normalized code is exactly 6 characters and uses only
 * unambiguous characters from DUO_INVITE_ALPHABET.
 */
export function isValidInviteCode(code: string): boolean {
  if (code.length !== DUO_INVITE_CODE_LENGTH) {
    return false;
  }
  for (let i = 0; i < code.length; i += 1) {
    if (!VALID_INVITE_CHAR_SET.has(code.charAt(i))) {
      return false;
    }
  }
  return true;
}

/**
 * Limits warm Sunlight nudges to once per calendar day (zero spam).
 */
export function canSendDailyNudge(
  lastNudgeDateKey: string | null,
  todayDateKey: string,
): boolean {
  if (!todayDateKey) {
    return false;
  }
  if (lastNudgeDateKey === null) {
    return true;
  }
  return lastNudgeDateKey !== todayDateKey;
}

/**
 * Enforces the 2-player co-op limit on a Duo shared meadow.
 */
export function canJoinDuoGarden(memberCount: number): boolean {
  return Number.isInteger(memberCount) && memberCount >= 0 && memberCount < DUO_MAX_MEMBERS;
}
