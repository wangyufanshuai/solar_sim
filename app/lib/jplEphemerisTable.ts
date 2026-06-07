import rawTable from "../../public/data/jpl-ephemeris-v2.json";
import type { MissionBodyId, MissionPhysicsSnapshot } from "./missionDesignerTypes";

export type JplEphemerisRow = {
  simDay: number;
  positionAu: [number, number, number];
  velocityAuPerDay: [number, number, number];
};

export type JplEphemerisBody = {
  id: string;
  name: string;
  command: string;
  rows: JplEphemerisRow[];
};

export type JplEphemerisTable = {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  model: string;
  center: string;
  epochJdTdb: number;
  startSimDay: number;
  stopSimDay: number;
  stepDays: number;
  interpolation: string;
  caveat: string;
  checksum: string;
  bodies: Record<string, JplEphemerisBody>;
};

export type JplInterpolatedState = {
  id: MissionBodyId;
  simDay: number;
  positionAu: [number, number, number];
  velocityAuPerDay: [number, number, number];
  source: "jpl-table";
  bracket: [number, number];
};

export type JplInterpolationFailure = {
  id: MissionBodyId;
  simDay: number;
  reason: string;
};

export const JPL_EPHEMERIS_TABLE = rawTable as unknown as JplEphemerisTable;

function hermite(
  p0: number,
  p1: number,
  v0: number,
  v1: number,
  t: number,
  h: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p0 +
    (t3 - 2 * t2 + t) * h * v0 +
    (-2 * t3 + 3 * t2) * p1 +
    (t3 - t2) * h * v1
  );
}

function hermiteVelocity(
  p0: number,
  p1: number,
  v0: number,
  v1: number,
  t: number,
  h: number,
): number {
  const t2 = t * t;
  return (
    ((6 * t2 - 6 * t) * p0 +
      (3 * t2 - 4 * t + 1) * h * v0 +
      (-6 * t2 + 6 * t) * p1 +
      (3 * t2 - 2 * t) * h * v1) /
    h
  );
}

export function interpolateJplState(
  id: MissionBodyId,
  simDay: number,
  table: JplEphemerisTable = JPL_EPHEMERIS_TABLE,
): JplInterpolatedState | JplInterpolationFailure {
  const body = table.bodies[id];
  if (!body?.rows?.length) return { id, simDay, reason: `JPL table missing body ${id}` };
  const rows = body.rows;
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  const tolerance = 1e-9;
  if (simDay < first.simDay - tolerance || simDay > last.simDay + tolerance) {
    return {
      id,
      simDay,
      reason: `JPL table coverage ${first.simDay.toFixed(1)}-${last.simDay.toFixed(1)} d does not include ${simDay.toFixed(1)} d`,
    };
  }
  if (Math.abs(simDay - last.simDay) <= tolerance) {
    return {
      id,
      simDay,
      positionAu: [...last.positionAu],
      velocityAuPerDay: [...last.velocityAuPerDay],
      source: "jpl-table",
      bracket: [last.simDay, last.simDay],
    };
  }
  const step = table.stepDays;
  const rawIndex = Math.floor((simDay - first.simDay) / step);
  const index = Math.max(0, Math.min(rows.length - 2, rawIndex));
  const a = rows[index]!;
  const b = rows[index + 1]!;
  const h = b.simDay - a.simDay;
  if (h <= 0) return { id, simDay, reason: `JPL table has invalid bracket for ${id}` };
  const t = (simDay - a.simDay) / h;
  const positionAu = [0, 1, 2].map((axis) =>
    hermite(a.positionAu[axis]!, b.positionAu[axis]!, a.velocityAuPerDay[axis]!, b.velocityAuPerDay[axis]!, t, h),
  ) as [number, number, number];
  const velocityAuPerDay = [0, 1, 2].map((axis) =>
    hermiteVelocity(a.positionAu[axis]!, b.positionAu[axis]!, a.velocityAuPerDay[axis]!, b.velocityAuPerDay[axis]!, t, h),
  ) as [number, number, number];
  return { id, simDay, positionAu, velocityAuPerDay, source: "jpl-table", bracket: [a.simDay, b.simDay] };
}

export function jplStateDeltaKm(
  id: MissionBodyId,
  simDay: number,
  live: MissionPhysicsSnapshot,
): { positionDeltaKm: number; velocityDeltaMps: number } | null {
  const jpl = interpolateJplState(id, simDay);
  if ("reason" in jpl) return null;
  const body = live.bodies[id];
  const auKm = 149_597_870.7;
  const auDayToMps = 149_597_870_700 / 86400;
  const dp = Math.hypot(
    (jpl.positionAu[0] - body.posAu[0]) * auKm,
    (jpl.positionAu[1] - body.posAu[1]) * auKm,
    (jpl.positionAu[2] - body.posAu[2]) * auKm,
  );
  const dv = Math.hypot(
    (jpl.velocityAuPerDay[0] - body.velAuPerDay[0]) * auDayToMps,
    (jpl.velocityAuPerDay[1] - body.velAuPerDay[1]) * auDayToMps,
    (jpl.velocityAuPerDay[2] - body.velAuPerDay[2]) * auDayToMps,
  );
  return { positionDeltaKm: dp, velocityDeltaMps: dv };
}
