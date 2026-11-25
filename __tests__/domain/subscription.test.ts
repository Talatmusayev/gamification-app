import {
  computeGuestPassExpiry,
  getGuestPassRemainingLabel,
  GUEST_PASS_DURATION_HOURS,
  hasProAccess,
  isGuestPassActive,
  ZERO_GUILT_EXPIRY_POLICY,
} from '../../src/domain/subscription';

describe('subscription domain', () => {
  it('defines a 72-hour no-card Sunlit Guest Pass with zero-guilt expiry policy', () => {
    expect(GUEST_PASS_DURATION_HOURS).toBe(72);
    expect(ZERO_GUILT_EXPIRY_POLICY).toEqual({
      keepPlacedProItemsForever: true,
      deletePlantsOnExpiry: false,
      requiresCardForGuestPass: false,
    });
  });

  it('computes a 72-hour ISO expiry timestamp from nowIso', () => {
    const startIso = '2026-11-24T08:00:00.000Z';
    const endsAt = computeGuestPassExpiry(startIso);
    expect(endsAt).toBe('2026-11-27T08:00:00.000Z');
  });

  it('detects active vs expired guest pass windows cleanly', () => {
    const endsAt = '2026-11-27T08:00:00.000Z';
    const beforeExpiry = Date.parse('2026-11-26T20:00:00.000Z');
    const exactExpiry = Date.parse('2026-11-27T08:00:00.000Z');
    const afterExpiry = Date.parse('2026-11-27T08:01:00.000Z');

    expect(isGuestPassActive(endsAt, beforeExpiry)).toBe(true);
    expect(isGuestPassActive(endsAt, exactExpiry)).toBe(false);
    expect(isGuestPassActive(endsAt, afterExpiry)).toBe(false);
    expect(isGuestPassActive(null, beforeExpiry)).toBe(false);
    expect(isGuestPassActive(undefined, beforeExpiry)).toBe(false);
    expect(isGuestPassActive('not-a-date', beforeExpiry)).toBe(false);
  });

  it('grants Pro access for paid Pro or active Guest Pass and revokes after expiry', () => {
    const endsAt = '2026-11-27T08:00:00.000Z';
    const activeMs = Date.parse('2026-11-25T08:00:00.000Z');
    const expiredMs = Date.parse('2026-11-27T09:00:00.000Z');

    expect(hasProAccess({ isPro: true, guestPassEndsAt: null }, expiredMs)).toBe(true);
    expect(hasProAccess({ isPro: false, guestPassEndsAt: endsAt }, activeMs)).toBe(true);
    expect(hasProAccess({ isPro: false, guestPassEndsAt: endsAt }, expiredMs)).toBe(false);
    expect(hasProAccess({ isPro: false, guestPassEndsAt: undefined }, activeMs)).toBe(false);
  });

  it('formats remaining Guest Pass hours and returns null when expired', () => {
    const startMs = Date.parse('2026-11-24T08:00:00.000Z');
    const endsAt = computeGuestPassExpiry('2026-11-24T08:00:00.000Z');

    expect(getGuestPassRemainingLabel(endsAt, startMs)).toBe('72h left');
    expect(
      getGuestPassRemainingLabel(endsAt, Date.parse('2026-11-27T07:45:00.000Z')),
    ).toBe('1h left');
    expect(
      getGuestPassRemainingLabel(endsAt, Date.parse('2026-11-27T08:00:00.000Z')),
    ).toBeNull();
    expect(getGuestPassRemainingLabel(null, startMs)).toBeNull();
  });
});
