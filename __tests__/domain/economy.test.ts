import { clampHealthInput, calculateDewReward, calculateSunlightReward } from '../../src/domain/economy';

describe('economy', () => {
  it('awards 100 Dew for >=85% sleep goal, 70 for 65-84%, 40 for <65%', () => {
    expect(calculateDewReward(450, 450)).toBe(100);
    expect(calculateDewReward(383, 450)).toBe(100); // 85.1%
    expect(calculateDewReward(300, 450)).toBe(70);  // 66.7%
    expect(calculateDewReward(200, 450)).toBe(40);  // 44.4%
  });

  it('adds +25 Dew bedtime bonus when within +/-45 min of target', () => {
    expect(calculateDewReward(450, 450, 30)).toBe(125);
    expect(calculateDewReward(450, 450, -45)).toBe(125);
    expect(calculateDewReward(450, 450, 46)).toBe(100);
  });

  it('awards 10 Sunlight per 1,000 steps, capped at 150 base, +30 step goal bonus', () => {
    expect(calculateSunlightReward(3500, 6000)).toBe(30);
    expect(calculateSunlightReward(6000, 6000)).toBe(90);   // 60 + 30
    expect(calculateSunlightReward(20000, 6000)).toBe(180); // 150 cap + 30
  });

  it('clamps impossible/tampered or NaN health inputs safely', () => {
    expect(clampHealthInput({ sleepMin: -50, steps: -100 })).toEqual({ sleepMin: 0, steps: 0 });
    expect(clampHealthInput({ sleepMin: 1500, steps: 99999 })).toEqual({ sleepMin: 960, steps: 60000 });
    expect(clampHealthInput({ sleepMin: Number.NaN, steps: Number.NaN })).toEqual({ sleepMin: 0, steps: 0 });
  });
});
