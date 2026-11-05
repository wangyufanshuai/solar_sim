import {
  KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328,
  KERR_SCIENCE_PHOTON_BANDS_VERSION_V328,
  KERR_SCIENCE_PHOTON_QUADRATURE_LIMIT_V328,
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_PHOTON_PROVENANCE_VERSION_V331 = "v331-kerr-science-photon-observable-provenance-v1" as const;
export const KERR_SCIENCE_PHOTON_PROVENANCE_ARTIFACT_SHA256_V331 = "9dcde548ce12520602e9af099baa11b48a09560f5f7a441a4b077a777c82a6b5" as const;
export const KERR_SCIENCE_PHOTON_PROVENANCE_CANONICAL_SHA256_V331 = "2f89001e93cfda06962eee0cf1f75d9732387f97f9f523f5b3553dbc8fb09fdb" as const;

export type KerrSciencePhotonProvenanceRowV331 = Readonly<{
  rayIndex: number;
  spinA: number;
  redshiftFactor: number;
  effectiveTemperatureK: number;
  bandId: KerrThinDiskBandIdV320;
  observedEnergyRadianceWM2Sr: number;
  observedPhotonRadiancePerSM2Sr: number;
  coarsePhotonRadiancePerSM2Sr: number;
  quadratureRelativeDifference: number;
  meanObservedPhotonEnergyJ: number;
  meanObservedFrequencyHz: number;
  bandLowerFrequencyHz: number;
  bandUpperFrequencyHz: number;
}>;

export type KerrSciencePhotonProvenanceV331 = Readonly<{
  version: typeof KERR_SCIENCE_PHOTON_PROVENANCE_VERSION_V331;
  mode: "science";
  source: Readonly<{
    photonVersion: typeof KERR_SCIENCE_PHOTON_BANDS_VERSION_V328;
    photonArtifactSha256: typeof KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328;
    bandArtifactSha256: string;
    fullShortAuthoritySha256: string;
    denseAggregateSha256: null;
  }>;
  counts: Readonly<{ rayCount: 4; bandMeasurementCount: 12 }>;
  rows: readonly KerrSciencePhotonProvenanceRowV331[];
  units: KerrSciencePhotonBandViewV328["units"];
  integration: KerrSciencePhotonBandViewV328["integration"];
  detectorAssumption: KerrSciencePhotonBandViewV328["detectorAssumption"];
  interpretation: "detector-independent-radiance-not-photon-count-rate";
  browserQualification: "not-run";
  boundary: "read-only-derived-twelve-row-photon-provenance-no-raw-ray-buffer-no-screenshot-no-path-host-pid";
  canonicalSha256: string;
}>;

const FORBIDDEN_KEYS = new Set(["rayBuffer", "rayPayload", "typedArrays", "screenshot", "absolutePath", "host", "pid", "collectingArea", "exposureTime", "throughput"]);
const provenanceCache = new WeakMap<KerrSciencePhotonBandViewV328, Promise<KerrSciencePhotonProvenanceV331>>();

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "canonicalSha256")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function containsForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(([key, entry]) => FORBIDDEN_KEYS.has(key) || containsForbiddenKey(entry));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((entry) => entry.toString(16).padStart(2, "0")).join("");
}

export async function createKerrSciencePhotonProvenanceV331(
  value: KerrSciencePhotonBandViewV328,
): Promise<KerrSciencePhotonProvenanceV331> {
  const view = parseKerrSciencePhotonBandViewV328(value);
  const rows = view.rays.flatMap((ray) => ray.measurements.map((measurement): KerrSciencePhotonProvenanceRowV331 => Object.freeze({
    rayIndex: ray.rayIndex,
    spinA: ray.spinA,
    redshiftFactor: ray.redshiftFactor,
    effectiveTemperatureK: ray.effectiveTemperatureK,
    bandId: measurement.bandId,
    observedEnergyRadianceWM2Sr: measurement.observedEnergyRadianceWM2Sr,
    observedPhotonRadiancePerSM2Sr: measurement.observedPhotonRadiancePerSM2Sr,
    coarsePhotonRadiancePerSM2Sr: measurement.coarsePhotonRadiancePerSM2Sr,
    quadratureRelativeDifference: measurement.quadratureRelativeDifference,
    meanObservedPhotonEnergyJ: measurement.meanObservedPhotonEnergyJ,
    meanObservedFrequencyHz: measurement.meanObservedFrequencyHz,
    bandLowerFrequencyHz: measurement.bandLowerFrequencyHz,
    bandUpperFrequencyHz: measurement.bandUpperFrequencyHz,
  })));
  if (rows.length !== 12) throw new Error("v331-photon-provenance-row-count");
  const unsigned = {
    version: KERR_SCIENCE_PHOTON_PROVENANCE_VERSION_V331,
    mode: "science" as const,
    source: Object.freeze({
      photonVersion: KERR_SCIENCE_PHOTON_BANDS_VERSION_V328,
      photonArtifactSha256: KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328,
      bandArtifactSha256: view.source.bandArtifactSha256,
      fullShortAuthoritySha256: view.source.fullShortAuthoritySha256,
      denseAggregateSha256: null,
    }),
    counts: Object.freeze({ rayCount: 4 as const, bandMeasurementCount: 12 as const }),
    rows: Object.freeze(rows),
    units: view.units,
    integration: view.integration,
    detectorAssumption: view.detectorAssumption,
    interpretation: "detector-independent-radiance-not-photon-count-rate" as const,
    browserQualification: "not-run" as const,
    boundary: "read-only-derived-twelve-row-photon-provenance-no-raw-ray-buffer-no-screenshot-no-path-host-pid" as const,
  };
  return Object.freeze({ ...unsigned, canonicalSha256: await sha256(JSON.stringify(canonicalize(unsigned))) });
}

export function getKerrSciencePhotonProvenanceV331(
  value: KerrSciencePhotonBandViewV328,
): Promise<KerrSciencePhotonProvenanceV331> {
  const cached = provenanceCache.get(value);
  if (cached) return cached;
  const promise = createKerrSciencePhotonProvenanceV331(value).catch((error: unknown) => {
    provenanceCache.delete(value);
    throw error;
  });
  provenanceCache.set(value, promise);
  return promise;
}

export function serializeKerrSciencePhotonProvenanceJsonV331(value: KerrSciencePhotonProvenanceV331): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function serializeKerrSciencePhotonProvenanceCsvV331(value: KerrSciencePhotonProvenanceV331): string {
  const columns: readonly (keyof KerrSciencePhotonProvenanceRowV331)[] = [
    "rayIndex", "spinA", "redshiftFactor", "effectiveTemperatureK", "bandId",
    "observedEnergyRadianceWM2Sr", "observedPhotonRadiancePerSM2Sr", "coarsePhotonRadiancePerSM2Sr",
    "quadratureRelativeDifference", "meanObservedPhotonEnergyJ", "meanObservedFrequencyHz",
    "bandLowerFrequencyHz", "bandUpperFrequencyHz",
  ];
  const header = ["version", "photonArtifactSha256", "fullShortAuthoritySha256", "integration", "detectorAssumption", "interpretation", ...columns];
  const rows = value.rows.map((row) => [
    value.version,
    value.source.photonArtifactSha256,
    value.source.fullShortAuthoritySha256,
    value.integration,
    value.detectorAssumption,
    value.interpretation,
    ...columns.map((column) => row[column]),
  ].map((entry) => JSON.stringify(String(entry))).join(","));
  return `${[header.map((entry) => JSON.stringify(entry)).join(","), ...rows].join("\n")}\n`;
}

export function parseKerrSciencePhotonProvenanceV331(value: unknown): KerrSciencePhotonProvenanceV331 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrSciencePhotonProvenanceV331> : null;
  if (!source || source.version !== KERR_SCIENCE_PHOTON_PROVENANCE_VERSION_V331
    || source.mode !== "science"
    || source.source?.photonVersion !== KERR_SCIENCE_PHOTON_BANDS_VERSION_V328
    || source.source.photonArtifactSha256 !== KERR_SCIENCE_PHOTON_BANDS_ARTIFACT_SHA256_V328
    || source.source.denseAggregateSha256 !== null
    || source.counts?.rayCount !== 4 || source.counts.bandMeasurementCount !== 12
    || source.units?.photonRadiance !== "photons s^-1 m^-2 sr^-1"
    || source.integration !== "fixed-simpson-512-with-256-componentwise-audit"
    || source.detectorAssumption !== "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time"
    || source.interpretation !== "detector-independent-radiance-not-photon-count-rate"
    || source.browserQualification !== "not-run"
    || source.boundary !== "read-only-derived-twelve-row-photon-provenance-no-raw-ray-buffer-no-screenshot-no-path-host-pid"
    || !Array.isArray(source.rows) || source.rows.length !== 12
    || source.rows.some((row) => !["visible", "euv", "soft-x-ray"].includes(row.bandId)
      || !Number.isFinite(row.observedPhotonRadiancePerSM2Sr) || row.observedPhotonRadiancePerSM2Sr <= 0
      || !Number.isFinite(row.quadratureRelativeDifference) || row.quadratureRelativeDifference < 0 || row.quadratureRelativeDifference >= KERR_SCIENCE_PHOTON_QUADRATURE_LIMIT_V328
      || row.meanObservedFrequencyHz < row.bandLowerFrequencyHz || row.meanObservedFrequencyHz > row.bandUpperFrequencyHz)
    || !/^[a-f0-9]{64}$/.test(source.canonicalSha256 ?? "")
    || containsForbiddenKey(source)) throw new Error("v331-photon-provenance-identity");
  return value as KerrSciencePhotonProvenanceV331;
}
