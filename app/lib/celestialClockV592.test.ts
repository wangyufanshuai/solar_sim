import { describe, expect, it } from "vitest";
import {
  JULIAN_DATE_J2000_V592,
  createCelestialClockControllerV592,
  julianDateToUtcIsoV592,
  resolveJulianDateV592,
  unixMillisecondsToJulianDateV592,
} from "./celestialClockV592";

describe("CelestialClockV592", () => {
  it("maps the J2000 epoch deterministically", () => {
    expect(unixMillisecondsToJulianDateV592(Date.parse("2000-01-01T12:00:00.000Z"))).toBe(JULIAN_DATE_J2000_V592);
    expect(julianDateToUtcIsoV592(JULIAN_DATE_J2000_V592)).toBe("2000-01-01T12:00:00.000Z");
  });

  it("uses absolute anchor time for forward, paused, and reverse replay", () => {
    const base = { anchorJulianDate: JULIAN_DATE_J2000_V592, anchorMonotonicMs: 10_000, rateSecondsPerSecond: 86_400 as const, revision: 0 };
    expect(resolveJulianDateV592(base, 11_000)).toBe(JULIAN_DATE_J2000_V592 + 1);
    expect(resolveJulianDateV592({ ...base, rateSecondsPerSecond: 0 }, 99_000)).toBe(JULIAN_DATE_J2000_V592);
    expect(resolveJulianDateV592({ ...base, rateSecondsPerSecond: -86_400 }, 11_000)).toBe(JULIAN_DATE_J2000_V592 - 1);
  });

  it("reanchors rate changes without a time discontinuity", () => {
    let now = 0;
    const clock = createCelestialClockControllerV592({ initialJulianDate: JULIAN_DATE_J2000_V592, initialRate: 3_600, monotonicNow: () => now });
    now = 2_000;
    const before = clock.getJulianDate();
    clock.setRate(-3_600);
    expect(clock.getJulianDate()).toBe(before);
    now = 3_000;
    expect(clock.getJulianDate()).toBeCloseTo(before - 3_600 / 86_400, 12);
  });

  it("has no cumulative one-hour integration drift", () => {
    const clock = createCelestialClockControllerV592({ initialJulianDate: JULIAN_DATE_J2000_V592, initialRate: 60, monotonicNow: () => 0 });
    const direct = clock.getJulianDate(3_600_000);
    const state = clock.getState();
    let sampled = state.anchorJulianDate;
    for (let second = 1; second <= 3_600; second += 1) sampled = resolveJulianDateV592(state, second * 1_000);
    expect(sampled).toBe(direct);
  });
});
