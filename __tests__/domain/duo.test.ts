import {
  DUO_INVITE_ALPHABET,
  DUO_INVITE_CODE_LENGTH,
  canJoinDuoGarden,
  canSendDailyNudge,
  generateInviteCode,
  isValidInviteCode,
  normalizeInviteCode,
  type DuoGarden,
  type DuoMember,
  type SunlightNudge,
} from '@/domain/duo';

describe('duo domain', () => {
  describe('generateInviteCode', () => {
    it('generates a 6-character uppercase code using only unambiguous characters', () => {
      const forbidden = new Set(['0', 'O', '1', 'I', 'L']);
      for (let i = 0; i < 100; i += 1) {
        const code = generateInviteCode();
        expect(code).toHaveLength(DUO_INVITE_CODE_LENGTH);
        expect(isValidInviteCode(code)).toBe(true);
        for (const ch of code) {
          expect(forbidden.has(ch)).toBe(false);
          expect(DUO_INVITE_ALPHABET.includes(ch)).toBe(true);
        }
      }
    });
  });

  describe('normalizeInviteCode', () => {
    it('trims whitespace, removes spaces/hyphens, and uppercases', () => {
      expect(normalizeInviteCode('  ab3-k7m  ')).toBe('AB3K7M');
      expect(normalizeInviteCode('x9p 2wq')).toBe('X9P2WQ');
      expect(normalizeInviteCode('m4n8rt')).toBe('M4N8RT');
    });
  });

  describe('isValidInviteCode', () => {
    it('accepts valid 6-character codes', () => {
      expect(isValidInviteCode('AB3K7M')).toBe(true);
      expect(isValidInviteCode('234567')).toBe(true);
      expect(isValidInviteCode('XYZ982')).toBe(true);
    });

    it('rejects codes with wrong length or ambiguous/invalid characters', () => {
      expect(isValidInviteCode('')).toBe(false);
      expect(isValidInviteCode('ABC23')).toBe(false);
      expect(isValidInviteCode('ABC2345')).toBe(false);
      expect(isValidInviteCode('AB0K7M')).toBe(false);
      expect(isValidInviteCode('ABOK7M')).toBe(false);
      expect(isValidInviteCode('AB1K7M')).toBe(false);
      expect(isValidInviteCode('ABIK7M')).toBe(false);
      expect(isValidInviteCode('ABLK7M')).toBe(false);
      expect(isValidInviteCode('ab3k7m')).toBe(false);
      expect(isValidInviteCode('AB3-K7')).toBe(false);
    });
  });

  describe('canSendDailyNudge', () => {
    it('allows sending when no nudge has been sent yet', () => {
      expect(canSendDailyNudge(null, '2026-11-24')).toBe(true);
    });

    it('blocks sending a second nudge on the same day', () => {
      expect(canSendDailyNudge('2026-11-24', '2026-11-24')).toBe(false);
    });

    it('allows sending again on a new day', () => {
      expect(canSendDailyNudge('2026-11-23', '2026-11-24')).toBe(true);
    });

    it('returns false when todayDateKey is empty', () => {
      expect(canSendDailyNudge(null, '')).toBe(false);
    });
  });

  describe('canJoinDuoGarden', () => {
    it('allows joining when garden has 0 or 1 member', () => {
      expect(canJoinDuoGarden(0)).toBe(true);
      expect(canJoinDuoGarden(1)).toBe(true);
    });

    it('blocks joining when garden already has 2 or more members or invalid counts', () => {
      expect(canJoinDuoGarden(2)).toBe(false);
      expect(canJoinDuoGarden(3)).toBe(false);
      expect(canJoinDuoGarden(-1)).toBe(false);
      expect(canJoinDuoGarden(1.5)).toBe(false);
    });
  });

  describe('domain types smoke check', () => {
    it('constructs DuoMember, DuoGarden, and SunlightNudge cleanly', () => {
      const member: DuoMember = {
        userId: 'user-1',
        displayName: 'You',
        role: 'owner',
        joinedAt: '2026-11-24T12:00:00.000Z',
      };
      const nudge: SunlightNudge = {
        id: 'nudge-1',
        gardenId: 'garden-1',
        senderId: 'user-1',
        recipientId: 'user-2',
        nudgeDate: '2026-11-24',
        message: 'Warm sunlight sent to your meadow',
        createdAt: '2026-11-24T12:05:00.000Z',
      };
      const garden: DuoGarden = {
        id: 'garden-1',
        name: 'Shared Sunlit Meadow',
        inviteCode: 'AB3K7M',
        biomeId: 'sunlit_meadow',
        createdBy: 'user-1',
        createdAt: '2026-11-24T12:00:00.000Z',
        members: [member],
        placements: [],
        lastNudgeSentDateKey: nudge.nudgeDate,
        lastNudgeReceived: null,
      };
      expect(garden.members).toHaveLength(1);
      expect(garden.lastNudgeSentDateKey).toBe('2026-11-24');
    });
  });
});
