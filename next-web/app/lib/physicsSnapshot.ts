import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { AU_METERS, DAY_SECONDS } from "./physicalConstants";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";

/** File / JSON schema for export–import. */
export const SNAPSHOT_FILE_SCHEMA = "solar-sim-system-state";
export const SNAPSHOT_FORMAT_VERSION = 1;

export type SolarSystemSnapshotFile = {
  schema: typeof SNAPSHOT_FILE_SCHEMA;
  formatVersion: typeof SNAPSHOT_FORMAT_VERSION;
  simDays: number;
  bodyIds: string[];
  massKg: number[];
  posAu: number[];
  velAuPerDay: number[];
};

export type HistoryEntry = {
  simDays: number;
  posAu: Float64Array;
  velAuPerDay: Float64Array;
  massKg: Float64Array;
};

export function captureHistoryEntry(
  p: SolarSystemPhysicsRef,
  simDays: number,
  n: number = p.n,
): HistoryEntry {
  const posAu = new Float64Array(n * 3);
  const velAuPerDay = new Float64Array(n * 3);
  const massKg = new Float64Array(n);
  writeHistoryEntryFromPhysics(p, simDays, n, {
    simDays,
    posAu,
    velAuPerDay,
    massKg,
  });
  return { simDays, posAu, velAuPerDay, massKg };
}

/** Fill preallocated `out` from current physics buffers (no heap alloc). */
export function writeHistoryEntryFromPhysics(
  p: SolarSystemPhysicsRef,
  simDays: number,
  n: number,
  out: HistoryEntry,
): void {
  out.simDays = simDays;
  for (let i = 0; i < n * 3; i++) {
    out.posAu[i] = p.posAu[i]!;
    out.velAuPerDay[i] = (p.velM[i]! * DAY_SECONDS) / AU_METERS;
  }
  for (let i = 0; i < n; i++) out.massKg[i] = p.mass[i]!;
}

export function duplicateHistoryEntry(e: HistoryEntry): HistoryEntry {
  return {
    simDays: e.simDays,
    posAu: new Float64Array(e.posAu),
    velAuPerDay: new Float64Array(e.velAuPerDay),
    massKg: new Float64Array(e.massKg),
  };
}

export function lerpHistoryEntry(
  a: HistoryEntry,
  b: HistoryEntry,
  t: number,
  out: HistoryEntry,
): void {
  const n = a.massKg.length;
  out.simDays = a.simDays + (b.simDays - a.simDays) * t;
  for (let i = 0; i < n * 3; i++) {
    out.posAu[i] = a.posAu[i]! + (b.posAu[i]! - a.posAu[i]!) * t;
    out.velAuPerDay[i] =
      a.velAuPerDay[i]! + (b.velAuPerDay[i]! - a.velAuPerDay[i]!) * t;
  }
  for (let i = 0; i < n; i++) {
    out.massKg[i] = a.massKg[i]! + (b.massKg[i]! - a.massKg[i]!) * t;
  }
}

/**
 * Interpolate along recorded history: `u=0` oldest, `u=1` copies frozen `live` tip.
 * `live` must be the last known forward state before scrub (caller freezes while !suspended).
 */
export function fillInterpolatedHistory(
  snaps: readonly HistoryEntry[],
  live: HistoryEntry,
  u: number,
  out: HistoryEntry,
): void {
  const uClamped = Math.min(1, Math.max(0, u));
  if (uClamped >= 1 - 1e-9) {
    copyHistoryEntry(live, out);
    return;
  }

  if (snaps.length === 0) {
    copyHistoryEntry(live, out);
    return;
  }

  const oldest = snaps[0]!;
  const tMin = oldest.simDays;
  const tMax = live.simDays;
  if (tMax <= tMin + 1e-12) {
    copyHistoryEntry(live, out);
    return;
  }

  const targetT = tMin + uClamped * (tMax - tMin);

  let leftIdx = -1;
  for (let i = 0; i < snaps.length; i++) {
    if (snaps[i]!.simDays <= targetT) leftIdx = i;
    else break;
  }

  if (leftIdx < 0) {
    copyHistoryEntry(snaps[0]!, out);
    return;
  }

  const left = snaps[leftIdx]!;
  if (leftIdx === snaps.length - 1) {
    const right = live;
    const span = right.simDays - left.simDays;
    const alpha = span > 1e-12 ? (targetT - left.simDays) / span : 1;
    const tt = Math.min(1, Math.max(0, alpha));
    lerpHistoryEntry(left, right, tt, out);
    return;
  }

  const right = snaps[leftIdx + 1]!;
  const span = right.simDays - left.simDays;
  const alpha = span > 1e-12 ? (targetT - left.simDays) / span : 0;
  const tt = Math.min(1, Math.max(0, alpha));
  lerpHistoryEntry(left, right, tt, out);
}

export function copyHistoryEntry(src: HistoryEntry, out: HistoryEntry): void {
  out.simDays = src.simDays;
  const n = src.massKg.length;
  for (let i = 0; i < n * 3; i++) {
    out.posAu[i] = src.posAu[i]!;
    out.velAuPerDay[i] = src.velAuPerDay[i]!;
  }
  for (let i = 0; i < n; i++) out.massKg[i] = src.massKg[i]!;
}

export function snapshotToFilePayload(
  entry: HistoryEntry,
  simDays: number,
): SolarSystemSnapshotFile {
  const n = entry.massKg.length;
  const bodyIds = SOLAR_SYSTEM_BODIES.slice(0, n).map((b) => b.id);
  return {
    schema: SNAPSHOT_FILE_SCHEMA,
    formatVersion: SNAPSHOT_FORMAT_VERSION,
    simDays,
    bodyIds,
    massKg: Array.from(entry.massKg),
    posAu: Array.from(entry.posAu),
    velAuPerDay: Array.from(entry.velAuPerDay),
  };
}

export function parseSnapshotFile(json: unknown): SolarSystemSnapshotFile | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.schema !== SNAPSHOT_FILE_SCHEMA) return null;
  if (o.formatVersion !== SNAPSHOT_FORMAT_VERSION) return null;
  if (typeof o.simDays !== "number") return null;
  if (!Array.isArray(o.bodyIds) || !Array.isArray(o.massKg)) return null;
  if (!Array.isArray(o.posAu) || !Array.isArray(o.velAuPerDay)) return null;
  const n = (o.massKg as unknown[]).length;
  if (n < 1) return null;
  if ((o.posAu as unknown[]).length !== n * 3) return null;
  if ((o.velAuPerDay as unknown[]).length !== n * 3) return null;
  return o as unknown as SolarSystemSnapshotFile;
}

export function filePayloadToHistoryEntry(f: SolarSystemSnapshotFile): HistoryEntry {
  const n = f.massKg.length;
  const posAu = Float64Array.from(f.posAu);
  const velAuPerDay = Float64Array.from(f.velAuPerDay);
  const massKg = Float64Array.from(f.massKg);
  return { simDays: f.simDays, posAu, velAuPerDay, massKg };
}
