import { powerSpectrumCyclesPerDay } from "./fftPowerSpectrum";
import type { TelemetrySample } from "./telemetryTypes";

export type OrbitSpectrumComputed = {
  pts: { f: number; p: number }[];
  /** Kepler harmonic reference frequencies (cycles/day) from osculating period */
  harmonics: number[];
  /** Strongest non-DC spectral line (cycles/day) */
  dominantFreqCpd: number | null;
  /** 1 / dominantFreqCpd (sim days) */
  dominantPeriodDays: number | null;
  /** 1 / T_kepler from last sample (cycles/day) */
  keplerFundamentalCpd: number | null;
};

/**
 * FFT (Hann window) of heliocentric distance r(t) sampled at ~uniform sim-day spacing.
 * Orange reference lines: harmonics of instantaneous two-body Kepler frequency (perturbations shift energy).
 */
export function computeOrbitSpectrum(
  rows: TelemetrySample[],
  meanDeltaSimDays: number,
  harmonicCount = 4,
): OrbitSpectrumComputed | null {
  if (rows.length < 16 || meanDeltaSimDays <= 0) return null;
  const dist = rows.map((r) => r.sunDistanceAu);
  const spec = powerSpectrumCyclesPerDay(dist, meanDeltaSimDays);
  if (!spec) return null;

  const pts = Array.from({ length: spec.freqCpd.length }, (_, i) => ({
    f: spec.freqCpd[i]!,
    p: spec.power[i]!,
  }));

  let maxK = 1;
  let maxP = spec.power[1] ?? 0;
  const lastK = spec.power.length - 1;
  for (let k = 2; k < lastK; k++) {
    const p = spec.power[k]!;
    if (p > maxP) {
      maxP = p;
      maxK = k;
    }
  }
  const domF = spec.freqCpd[maxK]!;
  const domPeriod = domF > 1e-12 ? 1 / domF : null;

  const last = rows[rows.length - 1]!;
  const T = last.orbitalPeriodDays;
  const harmonics: number[] = [];
  let keplerF0: number | null = null;
  if (T !== null && T > 1e-6) {
    keplerF0 = 1 / T;
    for (let k = 1; k <= harmonicCount; k++) {
      harmonics.push(k * keplerF0);
    }
  }

  return {
    pts,
    harmonics,
    dominantFreqCpd: domF > 0 ? domF : null,
    dominantPeriodDays: domPeriod,
    keplerFundamentalCpd: keplerF0,
  };
}
