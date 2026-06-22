import type { MutableRefObject } from "react";

export const TELEMETRY_RING_CAPACITY = 512;

export type TelemetrySample = {
  simDays: number;
  radialVelocityMs: number;
  sunDistanceAu: number;
  eccentricity: number | null;
  eccentricityRel: number | null;
  pnAccelFraction: number | null;
  accelTotMs2: number;
  /** Kepler period from osculating a (sim days); null if unbound */
  orbitalPeriodDays: number | null;
};

export type TelemetrySeriesState = {
  bodyIndex: number | null;
  bodyId: string | null;
  capacity: number;
  /** Number of valid samples (<= capacity) */
  count: number;
  /** Next write index when count === capacity */
  write: number;
  ring: TelemetrySample[];
  meanDeltaSimDays: number;
  eccBaseline: number | null;
};

export function createEmptyTelemetrySeries(): TelemetrySeriesState {
  return {
    bodyIndex: null,
    bodyId: null,
    capacity: TELEMETRY_RING_CAPACITY,
    count: 0,
    write: 0,
    ring: [],
    meanDeltaSimDays: 0,
    eccBaseline: null,
  };
}

export function resetTelemetrySeries(
  state: TelemetrySeriesState,
  bodyIndex: number,
  bodyId: string
): void {
  state.bodyIndex = bodyIndex;
  state.bodyId = bodyId;
  state.count = 0;
  state.write = 0;
  state.ring = [];
  state.meanDeltaSimDays = 0;
  state.eccBaseline = null;
}

export function pushTelemetrySample(
  state: TelemetrySeriesState,
  sample: TelemetrySample,
  prevSimDays: number
): void {
  const cap = state.capacity;
  const d = Math.abs(sample.simDays - prevSimDays);
  if (state.count === 0) {
    state.meanDeltaSimDays = Math.max(d, 1e-9);
  } else {
    state.meanDeltaSimDays = state.meanDeltaSimDays * 0.92 + d * 0.08;
  }

  if (state.count < cap) {
    state.ring.push({ ...sample });
    state.count = state.ring.length;
    return;
  }
  state.ring[state.write] = { ...sample };
  state.write = (state.write + 1) % cap;
}

/** Most recently pushed sample, or null if empty. */
export function getLatestTelemetrySample(
  state: TelemetrySeriesState
): TelemetrySample | null {
  if (state.count === 0) return null;
  if (state.count < state.capacity) {
    return state.ring[state.count - 1] ?? null;
  }
  const cap = state.capacity;
  const idx = (state.write - 1 + cap) % cap;
  return state.ring[idx] ?? null;
}

export function telemetrySamplesChronological(
  state: TelemetrySeriesState
): TelemetrySample[] {
  if (state.count === 0) return [];
  if (state.count < state.capacity) {
    return [...state.ring];
  }
  const out: TelemetrySample[] = [];
  for (let k = 0; k < state.capacity; k++) {
    out.push(state.ring[(state.write + k) % state.capacity]!);
  }
  return out;
}

export type TelemetrySeriesRef = MutableRefObject<TelemetrySeriesState | null>;
