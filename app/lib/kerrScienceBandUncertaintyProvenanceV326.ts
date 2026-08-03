import {
  KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325,
  KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325,
  KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325,
  parseKerrScienceBandUncertaintyViewV325,
  type KerrScienceBandUncertaintyViewV325,
} from "./kerrScienceBandUncertaintyV325";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_BAND_UNCERTAINTY_PROVENANCE_VERSION_V326 = "v326-kerr-science-band-uncertainty-provenance-v1" as const;
export const KERR_SCIENCE_BAND_UNCERTAINTY_PROVENANCE_ARTIFACT_SHA256_V326 = "a342616303cac0acce8a87ae8803fe06ea21780c2a41ef5ea19521952a3f057d" as const;

export type KerrScienceBandUncertaintyProvenanceRowV326 = Readonly<{
  rayIndex: number;
  spinA: number;
  emissionRadiusM: number;
  redshiftFactor: number;
  bandId: KerrThinDiskBandIdV320;
  observedBandRadianceWM2Sr: number;
  lowerAuditEnvelopeWM2Sr: number;
  upperAuditEnvelopeWM2Sr: number;
  conservativeLinearRelativeEnvelope: number;
  bandQuadratureRelative: number;
  diskQuadratureRelative: number;
  carterKerrSchildSpectralRelative: number;
  redshiftPerturbationRelative: number;
  geometryRedshiftDifference: number;
  geometryRadiusDifferenceM: number;
}>;

export type KerrScienceBandUncertaintyProvenanceV326 = Readonly<{
  version: typeof KERR_SCIENCE_BAND_UNCERTAINTY_PROVENANCE_VERSION_V326;
  mode: "science";
  source: Readonly<{
    uncertaintyVersion: typeof KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325;
    uncertaintyArtifactSha256: typeof KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325;
    bandArtifactSha256: string;
    fullShortAuthoritySha256: string;
    denseAggregateSha256: null;
  }>;
  counts: Readonly<{ rayCount: 4; bandMeasurementCount: 12 }>;
  maxima: KerrScienceBandUncertaintyViewV325["maxima"];
  rows: readonly KerrScienceBandUncertaintyProvenanceRowV326[];
  combinationPolicy: "linear-sum-without-independence-claim-no-rss";
  interpretation: "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval";
  browserQualification: "not-run";
  boundary: "read-only-derived-twelve-row-provenance-no-raw-ray-buffer-no-screenshot-no-path-or-host";
  canonicalSha256: string;
}>;

const FORBIDDEN_KEYS = new Set(["rayBuffer", "rayPayload", "typedArrays", "screenshot", "absolutePath", "host", "pid"]);

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

export async function createKerrScienceBandUncertaintyProvenanceV326(
  value: KerrScienceBandUncertaintyViewV325,
): Promise<KerrScienceBandUncertaintyProvenanceV326> {
  const view = parseKerrScienceBandUncertaintyViewV325(value);
  const rows = view.rays.flatMap((ray) => ray.measurements.map((measurement): KerrScienceBandUncertaintyProvenanceRowV326 => Object.freeze({
    rayIndex: ray.rayIndex,
    spinA: ray.spinA,
    emissionRadiusM: ray.emissionRadiusM,
    redshiftFactor: ray.redshiftFactor,
    bandId: measurement.bandId,
    observedBandRadianceWM2Sr: measurement.observedBandRadianceWM2Sr,
    lowerAuditEnvelopeWM2Sr: measurement.lowerAuditEnvelopeWM2Sr,
    upperAuditEnvelopeWM2Sr: measurement.upperAuditEnvelopeWM2Sr,
    conservativeLinearRelativeEnvelope: measurement.conservativeLinearRelativeEnvelope,
    bandQuadratureRelative: measurement.components.bandQuadratureRelative,
    diskQuadratureRelative: measurement.components.diskQuadratureRelative,
    carterKerrSchildSpectralRelative: measurement.components.carterKerrSchildSpectralRelative,
    redshiftPerturbationRelative: measurement.components.redshiftPerturbationRelative,
    geometryRedshiftDifference: measurement.components.geometryRedshiftDifference,
    geometryRadiusDifferenceM: measurement.components.geometryRadiusDifferenceM,
  })));
  if (rows.length !== 12) throw new Error("v326-provenance-row-count");
  const unsigned = {
    version: KERR_SCIENCE_BAND_UNCERTAINTY_PROVENANCE_VERSION_V326,
    mode: "science" as const,
    source: Object.freeze({
      uncertaintyVersion: KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325,
      uncertaintyArtifactSha256: KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325,
      bandArtifactSha256: view.source.bandArtifactSha256,
      fullShortAuthoritySha256: view.source.fullShortAuthoritySha256,
      denseAggregateSha256: null,
    }),
    counts: Object.freeze({ rayCount: 4 as const, bandMeasurementCount: 12 as const }),
    maxima: view.maxima,
    rows: Object.freeze(rows),
    combinationPolicy: "linear-sum-without-independence-claim-no-rss" as const,
    interpretation: "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval" as const,
    browserQualification: "not-run" as const,
    boundary: "read-only-derived-twelve-row-provenance-no-raw-ray-buffer-no-screenshot-no-path-or-host" as const,
  };
  return Object.freeze({ ...unsigned, canonicalSha256: await sha256(JSON.stringify(canonicalize(unsigned))) });
}

export function serializeKerrScienceBandUncertaintyProvenanceJsonV326(
  value: KerrScienceBandUncertaintyProvenanceV326,
): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function serializeKerrScienceBandUncertaintyProvenanceCsvV326(
  value: KerrScienceBandUncertaintyProvenanceV326,
): string {
  const columns: readonly (keyof KerrScienceBandUncertaintyProvenanceRowV326)[] = [
    "rayIndex", "spinA", "emissionRadiusM", "redshiftFactor", "bandId",
    "observedBandRadianceWM2Sr", "lowerAuditEnvelopeWM2Sr", "upperAuditEnvelopeWM2Sr",
    "conservativeLinearRelativeEnvelope", "bandQuadratureRelative", "diskQuadratureRelative",
    "carterKerrSchildSpectralRelative", "redshiftPerturbationRelative",
    "geometryRedshiftDifference", "geometryRadiusDifferenceM",
  ];
  const header = ["version", "uncertaintyArtifactSha256", "fullShortAuthoritySha256", "combinationPolicy", "interpretation", ...columns];
  const rows = value.rows.map((row) => [
    value.version,
    value.source.uncertaintyArtifactSha256,
    value.source.fullShortAuthoritySha256,
    value.combinationPolicy,
    value.interpretation,
    ...columns.map((column) => row[column]),
  ].map((entry) => JSON.stringify(String(entry))).join(","));
  return `${[header.map((entry) => JSON.stringify(entry)).join(","), ...rows].join("\n")}\n`;
}

export function parseKerrScienceBandUncertaintyProvenanceV326(value: unknown): KerrScienceBandUncertaintyProvenanceV326 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrScienceBandUncertaintyProvenanceV326>
    : null;
  if (!source || source.version !== KERR_SCIENCE_BAND_UNCERTAINTY_PROVENANCE_VERSION_V326
    || source.mode !== "science"
    || source.source?.uncertaintyVersion !== KERR_SCIENCE_BAND_UNCERTAINTY_VERSION_V325
    || source.source.uncertaintyArtifactSha256 !== KERR_SCIENCE_BAND_UNCERTAINTY_ARTIFACT_SHA256_V325
    || source.source.denseAggregateSha256 !== null
    || source.counts?.rayCount !== 4 || source.counts.bandMeasurementCount !== 12
    || source.combinationPolicy !== "linear-sum-without-independence-claim-no-rss"
    || source.interpretation !== "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval"
    || source.browserQualification !== "not-run"
    || source.boundary !== "read-only-derived-twelve-row-provenance-no-raw-ray-buffer-no-screenshot-no-path-or-host"
    || !Array.isArray(source.rows) || source.rows.length !== 12
    || source.rows.some((row) => !["visible", "euv", "soft-x-ray"].includes(row.bandId)
      || !Number.isFinite(row.conservativeLinearRelativeEnvelope)
      || row.conservativeLinearRelativeEnvelope < 0
      || row.conservativeLinearRelativeEnvelope >= KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325)
    || !/^[a-f0-9]{64}$/.test(source.canonicalSha256 ?? "")
    || containsForbiddenKey(source)) {
    throw new Error("v326-uncertainty-provenance-identity");
  }
  return value as KerrScienceBandUncertaintyProvenanceV326;
}
