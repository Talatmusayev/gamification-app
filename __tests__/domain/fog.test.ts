import { calculateFogLevel, calculateHarmonyScore, processMorningReveal } from '../../src/domain/fog';
import { KEEPER_FALLBACK_NOTES, pickKeeperFallbackNote } from '../../src/domain/keeperFallback';

describe('fog & morning reveal', () => {
  it('maps missed days to compassionate fog levels 0..3', () => {
    expect(calculateFogLevel(0)).toBe(0);
    expect(calculateFogLevel(1)).toBe(1);
    expect(calculateFogLevel(2)).toBe(2);
    expect(calculateFogLevel(3)).toBe(2);
    expect(calculateFogLevel(4)).toBe(3);
    expect(calculateFogLevel(20)).toBe(3);
  });

  it('clears fog to 0 on any valid day and returns non-empty keeper note', () => {
    const res = processMorningReveal({
      dateKey: '2026-11-24',
      existingLogs: {},
      sleepMin: 460,
      steps: 6500,
      profile: {
        sleepGoalMin: 450,
        stepGoal: 6000,
        fogLevel: 3,
        dewBalance: 0,
        sunlightBalance: 0,
        isPro: false,
        trackingMode: 'phone_only',
        onboardingCompleted: true,
      },
    });
    expect(res.alreadyRevealed).toBe(false);
    expect(res.newFogLevel).toBe(0);
    expect(res.dewAwarded).toBe(100);
    expect(res.sunlightAwarded).toBe(90);
    expect(res.keeperNote.length).toBeGreaterThan(10);
  });

  it('is strictly idempotent if Morning Reveal already ran for the same local dateKey', () => {
    const existingLog = {
      dateKey: '2026-11-24',
      sleepMin: 450,
      steps: 6000,
      dewAwarded: 100,
      sunlightAwarded: 90,
      revealedAt: '2026-11-24T08:00:00Z',
      aiInsight: 'Nice rest!',
    };
    const res = processMorningReveal({
      dateKey: '2026-11-24',
      existingLogs: { '2026-11-24': existingLog },
      sleepMin: 480,
      steps: 8000,
      profile: {
        sleepGoalMin: 450,
        stepGoal: 6000,
        fogLevel: 0,
        dewBalance: 100,
        sunlightBalance: 90,
        isPro: false,
        trackingMode: 'phone_only',
        onboardingCompleted: true,
      },
    });
    expect(res.alreadyRevealed).toBe(true);
    expect(res.dewAwarded).toBe(0);
    expect(res.sunlightAwarded).toBe(0);
  });

  it('calculates rolling 7-day Harmony score without strict streak resets', () => {
    const logs = Array.from({ length: 5 }, (_, i) => ({
      dateKey: `2026-11-2${i}`,
      sleepMin: 420,
      steps: 5000,
      dewAwarded: 100,
      sunlightAwarded: 50,
      revealedAt: '2026-11-20T08:00:00Z',
      aiInsight: '',
    }));
    expect(calculateHarmonyScore(logs, 7)).toEqual({ restfulDays: 5, windowDays: 7 });
  });

  it('provides 20+ warm, guilt-free keeper fallback notes within 22 words and no exclamation marks', () => {
    expect(KEEPER_FALLBACK_NOTES.length).toBeGreaterThanOrEqual(20);
    for (const note of KEEPER_FALLBACK_NOTES) {
      expect(note).not.toContain('!');
      expect(note.trim().split(/\s+/).length).toBeLessThanOrEqual(22);
      expect(note.length).toBeGreaterThan(10);
    }

    const fogNote = pickKeeperFallbackNote(300, 450, 2500, true);
    const gentleNote = pickKeeperFallbackNote(180, 450, 1200, false);
    expect(fogNote.length).toBeGreaterThan(10);
    expect(gentleNote.length).toBeGreaterThan(10);
  });
});
