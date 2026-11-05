export const JULIAN_DATE_UNIX_EPOCH_V592 = 2_440_587.5 as const;
export const JULIAN_DATE_J2000_V592 = 2_451_545.0 as const;
export const MILLISECONDS_PER_DAY_V592 = 86_400_000 as const;
export const SECONDS_PER_DAY_V592 = 86_400 as const;

export const CELESTIAL_TIME_RATES_V592 = Object.freeze([
  -86_400,
  -3_600,
  0,
  1,
  60,
  3_600,
  86_400,
] as const);

export type CelestialTimeRateV592 = (typeof CELESTIAL_TIME_RATES_V592)[number];

export type CelestialClockStateV592 = Readonly<{
  anchorJulianDate: number;
  anchorMonotonicMs: number;
  rateSecondsPerSecond: CelestialTimeRateV592;
  revision: number;
}>;

export type CelestialClockReadoutV592 = Readonly<{
  julianDate: number;
  daysSinceJ2000: number;
  julianCenturiesSinceJ2000: number;
  utcIso: string;
  rateSecondsPerSecond: CelestialTimeRateV592;
  paused: boolean;
  revision: number;
}>;

export function unixMillisecondsToJulianDateV592(unixMilliseconds: number): number {
  if (!Number.isFinite(unixMilliseconds)) throw new Error("v592-clock-unix-ms");
  return unixMilliseconds / MILLISECONDS_PER_DAY_V592 + JULIAN_DATE_UNIX_EPOCH_V592;
}

export function julianDateToUnixMillisecondsV592(julianDate: number): number {
  if (!Number.isFinite(julianDate)) throw new Error("v592-clock-julian-date");
  return (julianDate - JULIAN_DATE_UNIX_EPOCH_V592) * MILLISECONDS_PER_DAY_V592;
}

export function julianDateToUtcIsoV592(julianDate: number): string {
  return new Date(julianDateToUnixMillisecondsV592(julianDate)).toISOString();
}

export function resolveJulianDateV592(
  state: CelestialClockStateV592,
  monotonicNowMs: number,
): number {
  if (!Number.isFinite(monotonicNowMs)) throw new Error("v592-clock-monotonic-ms");
  const elapsedRealSeconds = Math.max(0, monotonicNowMs - state.anchorMonotonicMs) / 1_000;
  return state.anchorJulianDate
    + elapsedRealSeconds * state.rateSecondsPerSecond / SECONDS_PER_DAY_V592;
}

export function createCelestialClockReadoutV592(
  state: CelestialClockStateV592,
  monotonicNowMs: number,
): CelestialClockReadoutV592 {
  const julianDate = resolveJulianDateV592(state, monotonicNowMs);
  const daysSinceJ2000 = julianDate - JULIAN_DATE_J2000_V592;
  return Object.freeze({
    julianDate,
    daysSinceJ2000,
    julianCenturiesSinceJ2000: daysSinceJ2000 / 36_525,
    utcIso: julianDateToUtcIsoV592(julianDate),
    rateSecondsPerSecond: state.rateSecondsPerSecond,
    paused: state.rateSecondsPerSecond === 0,
    revision: state.revision,
  });
}

export type CelestialClockControllerV592 = Readonly<{
  getState: () => CelestialClockStateV592;
  getJulianDate: (monotonicNowMs?: number) => number;
  getReadout: (monotonicNowMs?: number) => CelestialClockReadoutV592;
  setRate: (rate: CelestialTimeRateV592, monotonicNowMs?: number) => void;
  setJulianDate: (julianDate: number, monotonicNowMs?: number) => void;
  subscribe: (listener: () => void) => () => void;
}>;

export function createCelestialClockControllerV592(options: Readonly<{
  initialJulianDate?: number;
  initialRate?: CelestialTimeRateV592;
  monotonicNow?: () => number;
}> = {}): CelestialClockControllerV592 {
  const monotonicNow = options.monotonicNow ?? (() => performance.now());
  const initialRate = options.initialRate ?? 1;
  if (!CELESTIAL_TIME_RATES_V592.includes(initialRate)) throw new Error("v592-clock-initial-rate");
  let state: CelestialClockStateV592 = Object.freeze({
    anchorJulianDate: options.initialJulianDate ?? unixMillisecondsToJulianDateV592(Date.now()),
    anchorMonotonicMs: monotonicNow(),
    rateSecondsPerSecond: initialRate,
    revision: 0,
  });
  const listeners = new Set<() => void>();
  const resolveNow = (value?: number) => value ?? monotonicNow();
  const publish = () => listeners.forEach((listener) => listener());
  const reanchor = (
    julianDate: number,
    rateSecondsPerSecond: CelestialTimeRateV592,
    monotonicMs: number,
  ) => {
    state = Object.freeze({
      anchorJulianDate: julianDate,
      anchorMonotonicMs: monotonicMs,
      rateSecondsPerSecond,
      revision: state.revision + 1,
    });
    publish();
  };
  return Object.freeze({
    getState: () => state,
    getJulianDate: (monotonicNowMs?: number) => resolveJulianDateV592(state, resolveNow(monotonicNowMs)),
    getReadout: (monotonicNowMs?: number) => createCelestialClockReadoutV592(state, resolveNow(monotonicNowMs)),
    setRate: (rate: CelestialTimeRateV592, monotonicNowMs?: number) => {
      if (!CELESTIAL_TIME_RATES_V592.includes(rate)) throw new Error("v592-clock-rate");
      const now = resolveNow(monotonicNowMs);
      reanchor(resolveJulianDateV592(state, now), rate, now);
    },
    setJulianDate: (julianDate: number, monotonicNowMs?: number) => {
      if (!Number.isFinite(julianDate)) throw new Error("v592-clock-set-julian-date");
      reanchor(julianDate, state.rateSecondsPerSecond, resolveNow(monotonicNowMs));
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}

export function formatCelestialTimeRateV592(rate: CelestialTimeRateV592): string {
  if (rate === 0) return "PAUSED";
  if (rate === 1) return "1×";
  if (rate === 60) return "60×";
  if (rate === 3_600) return "1 HOUR / S";
  if (rate === 86_400) return "1 DAY / S";
  if (rate === -3_600) return "−1 HOUR / S";
  return "−1 DAY / S";
}
