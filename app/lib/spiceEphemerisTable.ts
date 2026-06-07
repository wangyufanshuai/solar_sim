import type { MissionBodyId } from "./missionDesignerTypes";

export type SpiceBodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn";

export type SpiceEphemerisManifest = {
  version: 1;
  generatedAt: string;
  source: string;
  sourceUrls: Record<string, string>;
  frame: string;
  observer: string;
  aberration: string;
  epochJdTdb: number;
  startSimDay: number;
  stopSimDay: number;
  stepDays: number;
  rowCount: number;
  componentsPerRow: 6;
  bodyOrder: SpiceBodyId[];
  binaryPath: string;
  binaryBytes: number;
  binarySha256: string;
  interpolation: string;
  caveat: string;
};

export type SpiceInterpolatedState = {
  id: MissionBodyId;
  simDay: number;
  positionAu: [number, number, number];
  velocityAuPerDay: [number, number, number];
  source: "spice-table";
  bracket: [number, number];
};

type LoadedSpiceTable = {
  manifest: SpiceEphemerisManifest;
  values: Float64Array;
  bodyIndex: Map<string, number>;
};

let loadedTable: LoadedSpiceTable | null = null;
let loadingPromise: Promise<LoadedSpiceTable> | null = null;

function hermite(p0: number, p1: number, v0: number, v1: number, t: number, h: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p0 +
    (t3 - 2 * t2 + t) * h * v0 +
    (-2 * t3 + 3 * t2) * p1 +
    (t3 - t2) * h * v1
  );
}

function hermiteVelocity(p0: number, p1: number, v0: number, v1: number, t: number, h: number): number {
  const t2 = t * t;
  return (
    ((6 * t2 - 6 * t) * p0 +
      (3 * t2 - 4 * t + 1) * h * v0 +
      (-6 * t2 + 6 * t) * p1 +
      (3 * t2 - 2 * t) * h * v1) /
    h
  );
}

export async function loadSpiceEphemerisTable(): Promise<LoadedSpiceTable> {
  if (loadedTable) return loadedTable;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const manifestResponse = await fetch("/data/spice-ephemeris-v1-manifest.json", { cache: "force-cache" });
    if (!manifestResponse.ok) throw new Error(`SPICE manifest ${manifestResponse.status}`);
    const manifest = (await manifestResponse.json()) as SpiceEphemerisManifest;
    const binaryResponse = await fetch(manifest.binaryPath, { cache: "force-cache" });
    if (!binaryResponse.ok) throw new Error(`SPICE binary ${binaryResponse.status}`);
    const buffer = await binaryResponse.arrayBuffer();
    if (buffer.byteLength !== manifest.binaryBytes) {
      throw new Error(`SPICE binary size mismatch ${buffer.byteLength}/${manifest.binaryBytes}`);
    }
    const values = new Float64Array(buffer);
    const bodyIndex = new Map(manifest.bodyOrder.map((id, index) => [id, index]));
    loadedTable = { manifest, values, bodyIndex };
    return loadedTable;
  })();
  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

export function installSpiceEphemerisForTests(
  manifest: SpiceEphemerisManifest,
  values: Float64Array,
): void {
  loadedTable = {
    manifest,
    values,
    bodyIndex: new Map(manifest.bodyOrder.map((id, index) => [id, index])),
  };
}

export function getLoadedSpiceManifest(): SpiceEphemerisManifest | null {
  return loadedTable?.manifest ?? null;
}

export function interpolateSpiceState(
  id: MissionBodyId,
  simDay: number,
): SpiceInterpolatedState | { id: MissionBodyId; simDay: number; reason: string } {
  const table = loadedTable;
  if (!table) return { id, simDay, reason: "SPICE table is not loaded" };
  const bodyIndex = table.bodyIndex.get(id);
  if (bodyIndex === undefined) return { id, simDay, reason: `SPICE table missing body ${id}` };
  const { manifest, values } = table;
  const tolerance = 1e-9;
  if (simDay < manifest.startSimDay - tolerance || simDay > manifest.stopSimDay + tolerance) {
    return {
      id,
      simDay,
      reason: `SPICE table coverage ${manifest.startSimDay}-${manifest.stopSimDay} d does not include ${simDay.toFixed(1)} d`,
    };
  }
  const raw = (simDay - manifest.startSimDay) / manifest.stepDays;
  const index = Math.max(0, Math.min(manifest.rowCount - 2, Math.floor(raw)));
  const nextIndex = Math.min(manifest.rowCount - 1, index + 1);
  const aDay = manifest.startSimDay + index * manifest.stepDays;
  const bDay = manifest.startSimDay + nextIndex * manifest.stepDays;
  const h = Math.max(manifest.stepDays, bDay - aDay);
  const t = nextIndex === index ? 0 : (simDay - aDay) / h;
  const stride = manifest.rowCount * manifest.componentsPerRow;
  const offsetA = bodyIndex * stride + index * 6;
  const offsetB = bodyIndex * stride + nextIndex * 6;
  const positionAu = [0, 1, 2].map((axis) =>
    hermite(
      values[offsetA + axis]!,
      values[offsetB + axis]!,
      values[offsetA + 3 + axis]!,
      values[offsetB + 3 + axis]!,
      t,
      h,
    ),
  ) as [number, number, number];
  const velocityAuPerDay = [0, 1, 2].map((axis) =>
    hermiteVelocity(
      values[offsetA + axis]!,
      values[offsetB + axis]!,
      values[offsetA + 3 + axis]!,
      values[offsetB + 3 + axis]!,
      t,
      h,
    ),
  ) as [number, number, number];
  return {
    id,
    simDay,
    positionAu,
    velocityAuPerDay,
    source: "spice-table",
    bracket: [aDay, bDay],
  };
}
