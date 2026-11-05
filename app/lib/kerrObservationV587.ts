import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const KERR_OBSERVATION_V587_VERSION = "ObservationSummaryV3" as const;
export const KERR_OBSERVATION_V587_ROOT = "/data/kerr-observation-v587" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const TERMINAL_CLASSES = new Set([
  "disk_hit",
  "capture",
  "escape",
  "incomplete",
  "numerical_failure",
]);
const FIELD_NAMES = new Set(["classification", "validity", "redshift", "delay", "evpa"]);

export type KerrObservationModeV587 = "science" | "cinematic";
export type KerrObservationVariantV587 = "desktop" | "mobile";
export type KerrObservationTerminalClassV587 =
  | "disk_hit"
  | "capture"
  | "escape"
  | "incomplete"
  | "numerical_failure";

export type KerrObservationSampleV587 = Readonly<{
  rayIndex: number;
  alphaM: number;
  betaM: number;
  classification: KerrObservationTerminalClassV587;
  redshiftFactor: number | null;
  relativeDelayM: number | null;
  evpaRad: number | null;
  sampleAreaM2: number;
}>;

export type KerrObservationFieldV587 = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
  dtype: "uint8" | "float32-le";
  shape: readonly [number, number];
  variant: KerrObservationVariantV587;
  field: "classification" | "validity" | "redshift" | "delay" | "evpa";
  units: string;
  coordinateFrame: string;
  presentationOnly: true;
}>;

export type KerrObservationSummaryV587 = Readonly<{
  version: typeof KERR_OBSERVATION_V587_VERSION;
  status: string;
  presentationOnly: true;
  authorityReference: string;
  engineVersion: "v3-kerr-observation-reference";
  metric: "kerr";
  spin: string;
  observer: Readonly<{
    radiusM: string;
    inclinationDeg: string;
    azimuthDeg: string;
    frame: "zamo";
  }>;
  camera: Readonly<{
    alphaMinM: string;
    alphaMaxM: string;
    betaMinM: string;
    betaMaxM: string;
    orientation: "north-up-east-right";
  }>;
  coordinateFrame: string;
  screenFrame: string;
  counts: Readonly<{
    rayCount: number;
    eventCount: number;
    cellCount: number;
    leafCellCount: number;
    unresolvedCellCount: number;
    boundaryCellCount: number;
    boundaryResolvedCellCount: number;
    observableDiscontinuityResolvedCellCount: number;
    projectionMaskedCellCount: number;
    projectionMaskedAreaM2: number;
    classification: Readonly<Record<KerrObservationTerminalClassV587, number>>;
  }>;
  authority: Readonly<{
    geometryReferenceGranted: boolean;
    polarizationTransportReferenceGranted: boolean;
    radiativeTransferGranted: false;
    measuredAuthorityGranted: false;
    gpuAuthorityGranted: false;
    sciencePayloadMutationAllowed: false;
  }>;
  benchmarks: Readonly<{
    version: string;
    maxNormalizedHamiltonian: number;
    maxRelativeCarterDrift: number;
    maxWalkerPenroseReconstructionResidual: number;
    kerrSchildOracle: Readonly<{
      status: string;
      requiredRayCount: number;
      requestedRayCount: number;
      executedRayCount: number;
      maxEndpointDifferenceM: number;
      maxRedshiftRelativeDifference: number;
      maxEvpaDifferenceRad: number;
      maxNormalizedHamiltonian: number;
      maxRegularNormalizedHamiltonian: number;
      maxSeparatrixNormalizedHamiltonian: number;
      maxWalkerPenroseRelativeDrift: number;
      classificationAgreement: boolean;
      parallelTransportQualified: boolean;
      qualified: boolean;
      selection: Readonly<{
        stratificationQualified: boolean;
        selectedRadialTurnCount: number;
        selectedPolarTurnCount: number;
        selectedSeparatrixCount: number;
      }>;
    }>;
  }>;
  samples: readonly KerrObservationSampleV587[];
  fields: readonly KerrObservationFieldV587[];
  fits: Readonly<{ path: "observables.fits"; bytes: number; sha256: string }>;
  boundary: string;
  summarySha256: string;
}>;

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error("v587-canonical-number");
  if (Object.is(value, -0) || value === 0) return "0.0000000000000000e+0";
  const [mantissa, exponent] = value.toExponential(16).split("e");
  return `${mantissa}e${Number(exponent) >= 0 ? "+" : ""}${Number(exponent)}`;
}

function canonicalizeBound(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return canonicalNumber(value);
  if (Array.isArray(value)) return value.map(canonicalizeBound);
  const source = object(value);
  if (!source) throw new Error("v587-canonical-value");
  return Object.fromEntries(
    Object.keys(source).sort().map((key) => [key, canonicalizeBound(source[key])]),
  );
}

export function canonicalKerrObservationSummaryV587(value: unknown): string {
  const source = object(value);
  if (!source) throw new Error("v587-summary-object");
  const unsigned = { ...source };
  delete unsigned.summarySha256;
  return JSON.stringify(canonicalizeBound(unsigned));
}

export function parseKerrObservationSummaryV587(value: unknown): KerrObservationSummaryV587 {
  const source = object(value);
  const observer = object(source?.observer);
  const camera = object(source?.camera);
  const counts = object(source?.counts);
  const classification = object(counts?.classification);
  const authority = object(source?.authority);
  const benchmarks = object(source?.benchmarks);
  const oracle = object(benchmarks?.kerrSchildOracle);
  const oracleSelection = object(oracle?.selection);
  const fits = object(source?.fits);
  const samples = source?.samples;
  const fields = source?.fields;
  if (
    !source
    || source.version !== KERR_OBSERVATION_V587_VERSION
    || source.presentationOnly !== true
    || source.status !== "qualified-cpu-float64-kerr-observation-reference"
    || source.engineVersion !== "v3-kerr-observation-reference"
    || source.metric !== "kerr"
    || !SHA256.test(String(source.authorityReference ?? ""))
    || !SHA256.test(String(source.summarySha256 ?? ""))
    || observer?.frame !== "zamo"
    || camera?.orientation !== "north-up-east-right"
    || !counts
    || !classification
    || !finite(counts.rayCount)
    || !finite(counts.eventCount)
    || !finite(counts.cellCount)
    || !finite(counts.leafCellCount)
    || !finite(counts.unresolvedCellCount)
    || counts.unresolvedCellCount !== 0
    || !finite(counts.boundaryCellCount)
    || !finite(counts.boundaryResolvedCellCount)
    || !finite(counts.observableDiscontinuityResolvedCellCount)
    || !finite(counts.projectionMaskedCellCount)
    || counts.projectionMaskedCellCount <= 0
    || !finite(counts.projectionMaskedAreaM2)
    || counts.projectionMaskedAreaM2 <= 0
    || !authority
    || authority.geometryReferenceGranted !== true
    || authority.polarizationTransportReferenceGranted !== true
    || authority.radiativeTransferGranted !== false
    || authority.measuredAuthorityGranted !== false
    || authority.gpuAuthorityGranted !== false
    || authority.sciencePayloadMutationAllowed !== false
    || !benchmarks
    || !oracle
    || oracle.status !== "qualified"
    || oracle.requiredRayCount !== 64
    || oracle.requestedRayCount !== 64
    || oracle.executedRayCount !== 64
    || oracle.classificationAgreement !== true
    || oracle.parallelTransportQualified !== true
    || oracle.qualified !== true
    || !finite(oracle.maxEndpointDifferenceM)
    || oracle.maxEndpointDifferenceM > 1e-5
    || !finite(oracle.maxRedshiftRelativeDifference)
    || oracle.maxRedshiftRelativeDifference > 1e-6
    || !finite(oracle.maxEvpaDifferenceRad)
    || oracle.maxEvpaDifferenceRad > 1e-5
    || !finite(oracle.maxRegularNormalizedHamiltonian)
    || oracle.maxRegularNormalizedHamiltonian > 1e-9
    || !finite(oracle.maxSeparatrixNormalizedHamiltonian)
    || oracle.maxSeparatrixNormalizedHamiltonian > 1e-7
    || !finite(oracle.maxWalkerPenroseRelativeDrift)
    || oracle.maxWalkerPenroseRelativeDrift > 1e-8
    || !oracleSelection
    || oracleSelection.stratificationQualified !== true
    || !finite(oracleSelection.selectedRadialTurnCount)
    || oracleSelection.selectedRadialTurnCount <= 0
    || !finite(oracleSelection.selectedPolarTurnCount)
    || oracleSelection.selectedPolarTurnCount <= 0
    || !finite(oracleSelection.selectedSeparatrixCount)
    || oracleSelection.selectedSeparatrixCount < 8
    || !Array.isArray(samples)
    || samples.length === 0
    || !Array.isArray(fields)
    || fields.length !== 10
    || !fits
    || fits.path !== "observables.fits"
    || !SHA256.test(String(fits.sha256 ?? ""))
  ) throw new Error("v587-summary-contract");

  for (const terminalClass of TERMINAL_CLASSES) {
    if (!finite(classification[terminalClass])) throw new Error("v587-classification-counts");
  }
  if (
    [...TERMINAL_CLASSES].reduce((total, terminalClass) => total + Number(classification[terminalClass]), 0)
    !== counts.rayCount
  ) throw new Error("v587-classification-total");
  for (const entry of samples) {
    const sample = object(entry);
    if (
      !sample
      || !finite(sample.rayIndex)
      || !finite(sample.alphaM)
      || !finite(sample.betaM)
      || !TERMINAL_CLASSES.has(String(sample.classification))
      || (sample.redshiftFactor !== null && !finite(sample.redshiftFactor))
      || (sample.relativeDelayM !== null && !finite(sample.relativeDelayM))
      || (sample.evpaRad !== null && !finite(sample.evpaRad))
      || !finite(sample.sampleAreaM2)
    ) throw new Error("v587-sample-contract");
  }
  const identities = new Set<string>();
  for (const entry of fields) {
    const field = object(entry);
    const shape = field?.shape;
    if (
      !field
      || typeof field.path !== "string"
      || field.path.includes("..")
      || !finite(field.bytes)
      || !SHA256.test(String(field.sha256 ?? ""))
      || !["uint8", "float32-le"].includes(String(field.dtype))
      || !Array.isArray(shape)
      || shape.length !== 2
      || !shape.every((dimension) => finite(dimension) && dimension > 0)
      || !["desktop", "mobile"].includes(String(field.variant))
      || !FIELD_NAMES.has(String(field.field))
      || field.presentationOnly !== true
    ) throw new Error("v587-field-contract");
    const identity = `${field.variant}:${field.field}`;
    if (identities.has(identity)) throw new Error("v587-field-duplicate");
    identities.add(identity);
  }
  if (identities.size !== 10) throw new Error("v587-field-coverage");
  const actualSha = sha256Utf8HexV566(canonicalKerrObservationSummaryV587(source));
  if (actualSha !== source.summarySha256) throw new Error("v587-summary-sha");
  return Object.freeze(source) as KerrObservationSummaryV587;
}

export function fieldForKerrObservationV587(
  summary: KerrObservationSummaryV587,
  variant: KerrObservationVariantV587,
  field: KerrObservationFieldV587["field"],
): KerrObservationFieldV587 {
  const match = summary.fields.find((entry) => entry.variant === variant && entry.field === field);
  if (!match) throw new Error(`v587-field-missing:${variant}:${field}`);
  return match;
}

export function nearestKerrObservationSampleV587(
  summary: KerrObservationSummaryV587,
  alphaM: number,
  betaM: number,
): KerrObservationSampleV587 {
  let nearest = summary.samples[0]!;
  let distance = Number.POSITIVE_INFINITY;
  for (const sample of summary.samples) {
    const dx = sample.alphaM - alphaM;
    const dy = sample.betaM - betaM;
    const next = dx * dx + dy * dy;
    if (next < distance) {
      nearest = sample;
      distance = next;
    }
  }
  return nearest;
}
