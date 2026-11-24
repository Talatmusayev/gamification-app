import { startLanternSession, completeLanternSession } from '../../src/domain/lantern';

describe('Goodnight Lantern', () => {
  it('computes accurate sleep minutes across midnight', () => {
    const s = startLanternSession('2026-11-24T22:30:00Z');
    const res = completeLanternSession(s, '2026-11-25T06:30:00Z');
    expect(res).toEqual({ sleepMin: 480, isValidRest: true });
  });

  it('clamps forgotten wake (>16h) to 960 minutes and rejects negative duration', () => {
    const s = startLanternSession('2026-11-24T22:00:00Z');
    expect(completeLanternSession(s, '2026-11-26T10:00:00Z')).toEqual({ sleepMin: 960, isValidRest: true });
    expect(completeLanternSession(s, '2026-11-24T21:00:00Z')).toEqual({ sleepMin: 0, isValidRest: false });
  });
});
