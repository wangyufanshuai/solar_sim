import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312, parseKerrCorrectedAuthorityV312 } from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313, parseKerrPolarizationRequalificationV313 } from "./kerrAuthorityV313";
import { parseKerrStokesTransferArtifactV406, type KerrStokesTransferArtifactV406 } from "./kerrStokesTransferV406";

export const KERR_SCATTERING_ATMOSPHERE_VERSION_V407 = "v407-kerr-sparse-scattering-atmosphere-v1" as const;
export const KERR_SCATTERING_ATMOSPHERE_ARTIFACT_VERSION_V407 = "v407-kerr-sparse-scattering-atmosphere-artifact-v1" as const;
export const KERR_SCATTERING_ATMOSPHERE_SUMMARY_VERSION_V407 = "v407-kerr-scattering-atmosphere-summary-v1" as const;
export const KERR_SCATTERING_ATMOSPHERE_RESPONSE_VERSION_V407 = "v407-kerr-scattering-atmosphere-response-v1" as const;
export const KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406 = "92830ac3ac89856664fcfbfd00f698b02aa6daa851463de9dc019bfc207e8038" as const;
export const KERR_SCATTERING_POLARIZATION_MAXIMUM_V407 = 0.1171 as const;
export const KERR_SCATTERING_POLARIZATION_DENOMINATOR_V407 = 3.582 as const;

type RayIdV407 = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type TransportMethodV407 = "walker-penrose" | "independent-ks-parallel-transport";
type Vector4V407 = readonly [number, number, number, number];
type Matrix4V407 = readonly (readonly number[])[];

type RawPolarizationExecutionV407 = Readonly<{
  rayId: RayIdV407;
  spin: number;
  toleranceClass: "release" | "internal";
  branch: "A" | "B";
}>;

type RawGeometryExecutionV407 = Readonly<{
  rayId: RayIdV407;
  classification: "disk-hit";
  formulation: string;
  toleranceClass: "release" | "internal";
  branch: "A" | "B";
  polarizationSeed: Readonly<{
    coordinatesBl: Vector4V407;
    wavevectorBl: Vector4V407;
    emitterModel: "projected-disk-normal";
  }>;
}>;

export type KerrScatteringEmissionAngleV407 = Readonly<{
  rayId: RayIdV407;
  spinA: number;
  emissionRadiusM: number;
  emitterPhotonFrequencyGeometric: number;
  muEmission: number;
  linearPolarizationFraction: number;
  residuals: Readonly<{
    emitterNorm: number;
    directionNorm: number;
    diskNormalNorm: number;
    directionEmitterOrthogonality: number;
    diskNormalEmitterOrthogonality: number;
    toleranceMuDifference: number;
    abCanonicalMuDifference: 0;
  }>;
}>;

export type KerrScatteringStokesSampleV407 = Readonly<{
  rayId: RayIdV407;
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  muEmission: number;
  linearPolarizationFraction: number;
  observedFrequencyHz: 1e16 | 1e17 | 1e18;
  emittedFrequencyHz: number;
  redshiftFactor: number;
  transportMethod: TransportMethodV407;
  evpaDeg: number;
  emittedStokes: Readonly<{ i: number; q: number; u: 0; linearAmplitude: number; linearFraction: number }>;
  observedStokes: Readonly<{ i: number; q: number; u: number; linearAmplitude: number; linearFraction: number }>;
  residuals: Readonly<{
    intensityInvariantRelative: number;
    linearAmplitudeInvariantRelative: number;
    linearFractionAbsolute: number;
    inverseRotationRelative: number;
    rotationNormRelative: number;
  }>;
  sourceUncertainty: Readonly<{
    diskQuadratureRelative: number;
    formulaSpectralRelative: number;
    geometryRadiusDifferenceM: number;
    geometryRedshiftDifference: number;
  }>;
}>;

export type KerrScatteringPathComparisonV407 = Readonly<{
  rayId: RayIdV407;
  observedFrequencyHz: KerrScatteringStokesSampleV407["observedFrequencyHz"];
  evpaDifferenceDeg: number;
  normalizedStokesQuDifference: number;
}>;

export type KerrScatteringAtmosphereViewV407 = Readonly<{
  version: typeof KERR_SCATTERING_ATMOSPHERE_VERSION_V407;
  status: "qualified-sparse-scattering-atmosphere-approximation";
  authority: Readonly<{
    geometryEvidenceSha256: typeof KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312;
    polarizationEvidenceSha256: typeof KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313;
    v406StokesArtifactSha256: typeof KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406;
    denseAggregateSha256: null;
  }>;
  model: Readonly<{
    family: "semi-infinite-pure-electron-scattering-atmosphere";
    lineage: "chandrasekhar-sobolev-style-closed-form-approximation";
    approximation: "p(mu)=0.1171*(1-mu)/(1+3.582*mu)";
    qualification: "closed-form-approximation-boundary-only";
    exactHFunctionTableAccuracy: "not-qualified";
    emissionAngle: "local-emitter-frame-disk-normal-dot-photon-direction";
    observerInclinationSubstituted: false;
    screenBetaSubstituted: false;
    historicalV406FixedFraction: 0.12;
    emittedBasis: "projected-disk-normal";
    propagation: "vacuum-geometric-optics-no-emission-absorption-scattering-after-disk";
    circularPolarization: "unavailable-not-modeled";
    faradayRotation: "unavailable-not-modeled";
    absorptionOpacity: "unavailable-not-modeled";
  }>;
  references: readonly Readonly<{
    citation: string;
    role: "problem-family" | "secondary-context";
    verification: "bibliographic-family-only-no-exact-coefficient-fit-claim" | "metadata-only-no-coefficient-validation";
  }>[];
  angleAudit: Readonly<{
    records: readonly KerrScatteringEmissionAngleV407[];
    curveSampleCount: 4097;
    endpointFaceOn: 0;
    endpointLimb: 0.1171;
    maxMonotonicIncrease: 0;
    minimumMu: number;
    maximumMu: number;
    minimumFraction: number;
    maximumFraction: number;
    maxToleranceMuDifference: number;
    maxAbCanonicalMuDifference: 0;
    maxLocalFrameResidual: number;
  }>;
  counts: Readonly<{
    canonicalRayCount: 16;
    diskRayCount: 4;
    unavailableCaptureEscapeRayCount: 12;
    frequencyCount: 3;
    transportMethodCount: 2;
    stokesSampleCount: 24;
    pathComparisonCount: 12;
    sourceGeometryDiskExecutionCount: 16;
  }>;
  samples: readonly KerrScatteringStokesSampleV407[];
  pathComparisons: readonly KerrScatteringPathComparisonV407[];
  maxima: Readonly<{
    intensityInvariantRelative: number;
    linearAmplitudeInvariantRelative: number;
    linearFractionAbsolute: number;
    inverseRotationRelative: number;
    rotationNormRelative: number;
    releaseEvpaDifferenceDeg: number;
    internalEvpaDifferenceDeg: number;
    normalizedStokesQuDifference: number;
    abCanonicalDifference: 0;
  }>;
  thresholds: Readonly<{
    localFrameResidual: 1e-12;
    toleranceMuDifference: 1e-12;
    invariantRelative: 1e-12;
    linearFractionAbsolute: 1e-12;
    inverseRotationRelative: 1e-12;
    normalizedStokesQuDifference: 1e-10;
    releaseEvpaDifferenceDeg: 0.5;
    internalEvpaDifferenceDeg: 0.1;
  }>;
  units: Readonly<{ frequency: "Hz"; spectralStokes: "W m^-2 sr^-1 Hz^-1"; evpa: "deg modulo 180"; muEmission: "dimensionless" }>;
  uncertaintyCombination: "componentwise-no-rss-no-scalar-total";
  displayBoundary: "science-linear-immutable-stokes-cinematic-must-not-mutate";
  boundary: "four-authority-disk-rays-angle-dependent-scattering-approximation-not-exact-table-or-dense-image";
}>;

export type KerrScatteringAtmosphereArtifactV407 = Readonly<{
  version: typeof KERR_SCATTERING_ATMOSPHERE_ARTIFACT_VERSION_V407;
  generatedAt: string;
  sourceFiles: Readonly<{ geometry: string; polarization: string }>;
  sourceArtifacts: Readonly<{ v406StokesCanonical: typeof KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406 }>;
  view: KerrScatteringAtmosphereViewV407;
  deterministicReplay: true;
  networkAttemptedByBuild: false;
  denseShardExecuted: false;
  boundary: "immutable-derived-sparse-scattering-atmosphere-no-dense-or-product-promotion";
  artifactSha256: string;
}>;

export type KerrScatteringAtmosphereSummaryV407 = Readonly<{
  version: typeof KERR_SCATTERING_ATMOSPHERE_SUMMARY_VERSION_V407;
  status: KerrScatteringAtmosphereViewV407["status"];
  artifactSha256: string;
  authority: KerrScatteringAtmosphereViewV407["authority"];
  model: KerrScatteringAtmosphereViewV407["model"];
  angleAudit: Omit<KerrScatteringAtmosphereViewV407["angleAudit"], "records">;
  counts: KerrScatteringAtmosphereViewV407["counts"];
  maxima: KerrScatteringAtmosphereViewV407["maxima"];
  referenceBandHz: 1e17;
  referenceRays: readonly Readonly<{
    rayId: RayIdV407;
    spinA: number;
    muEmission: number;
    linearPolarizationFraction: number;
    walkerPenrose: Readonly<{ qOverI: number; uOverI: number; evpaDeg: number }>;
    parallelTransport: Readonly<{ qOverI: number; uOverI: number; evpaDeg: number }>;
    evpaDifferenceDeg: number;
    normalizedStokesQuDifference: number;
  }>[];
  fullArtifactAvailable: true;
  denseAggregateAvailable: false;
  browserQualification: "not-run";
  boundary: "summary-only-no-angle-execution-or-full-sample-arrays-in-react-state";
}>;

export type KerrScatteringAtmosphereResponseV407 = Readonly<{
  version: typeof KERR_SCATTERING_ATMOSPHERE_RESPONSE_VERSION_V407;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrScatteringAtmosphereSummaryV407 | null;
}>;

const RAY_IDS = Object.freeze(["disk-00", "disk-01", "disk-02", "disk-03"] as const);
const finite = (...values: number[]) => values.every(Number.isFinite);
const relativeDifference = (first: number, second: number) => Math.abs(first - second) / Math.max(1e-300, Math.abs(first), Math.abs(second));
const invariant = (stokes: number, frequencyHz: number) => stokes / frequencyHz ** 3;
const evpaDistance = (first: number, second: number) => { const delta = Math.abs(first - second) % 180; return Math.min(delta, 180 - delta); };

function bilinear(first: Vector4V407, metric: Matrix4V407, second: Vector4V407): number {
  return first.reduce((sum, value, row) => sum + value * second.reduce((inner, entry, column) => inner + metric[row][column] * entry, 0), 0);
}

function blMetricCovariant(radius: number, theta: number, spin: number): Matrix4V407 {
  const sigma = radius * radius + spin * spin * Math.cos(theta) ** 2;
  const delta = radius * radius - 2 * radius + spin * spin;
  const sineSquared = Math.max(1e-15, Math.sin(theta) ** 2);
  if (!finite(sigma, delta, sineSquared) || sigma <= 0 || delta <= 0) throw new Error("v407-metric-domain");
  const metric = Array.from({ length: 4 }, () => Array<number>(4).fill(0));
  metric[0][0] = -(1 - 2 * radius / sigma);
  metric[0][3] = metric[3][0] = -2 * spin * radius * sineSquared / sigma;
  metric[1][1] = sigma / delta;
  metric[2][2] = sigma;
  metric[3][3] = sineSquared * (radius * radius + spin * spin + 2 * spin * spin * radius * sineSquared / sigma);
  return metric;
}

export function evaluateKerrScatteringPolarizationFractionV407(muEmission: number): number {
  if (!Number.isFinite(muEmission) || muEmission < 0 || muEmission > 1) throw new Error("v407-mu-domain");
  return KERR_SCATTERING_POLARIZATION_MAXIMUM_V407 * (1 - muEmission) / (1 + KERR_SCATTERING_POLARIZATION_DENOMINATOR_V407 * muEmission);
}

function deriveAngle(execution: RawGeometryExecutionV407, spin: number): KerrScatteringEmissionAngleV407 {
  const { coordinatesBl, wavevectorBl, emitterModel } = execution.polarizationSeed;
  if (emitterModel !== "projected-disk-normal" || coordinatesBl.length !== 4 || wavevectorBl.length !== 4 || !finite(...coordinatesBl, ...wavevectorBl, spin)) throw new Error("v407-polarization-seed");
  const radius = coordinatesBl[1];
  const metric = blMetricCovariant(radius, coordinatesBl[2], spin);
  const omega = 1 / (radius ** 1.5 + spin);
  const normalization = -(metric[0][0] + 2 * omega * metric[0][3] + omega * omega * metric[3][3]);
  if (!Number.isFinite(normalization) || normalization <= 0) throw new Error("v407-emitter-domain");
  const uT = 1 / Math.sqrt(normalization);
  const emitter = [uT, 0, 0, omega * uT] as const;
  const frequency = -bilinear(emitter, metric, wavevectorBl);
  if (!Number.isFinite(frequency) || frequency <= 1e-14) throw new Error("v407-emitter-frequency");
  const direction = wavevectorBl.map((value, index) => value / frequency - emitter[index]) as unknown as Vector4V407;
  const normal = [0, 0, 1 / radius, 0] as const;
  const muEmission = Math.abs(bilinear(normal, metric, direction));
  const emitterNorm = Math.abs(bilinear(emitter, metric, emitter) + 1);
  const directionNorm = Math.abs(bilinear(direction, metric, direction) - 1);
  const diskNormalNorm = Math.abs(bilinear(normal, metric, normal) - 1);
  const directionEmitterOrthogonality = Math.abs(bilinear(direction, metric, emitter));
  const diskNormalEmitterOrthogonality = Math.abs(bilinear(normal, metric, emitter));
  if (!finite(muEmission, emitterNorm, directionNorm, diskNormalNorm, directionEmitterOrthogonality, diskNormalEmitterOrthogonality) || muEmission < 0 || muEmission > 1) throw new Error("v407-emission-angle");
  return Object.freeze({ rayId: execution.rayId, spinA: spin, emissionRadiusM: radius, emitterPhotonFrequencyGeometric: frequency, muEmission, linearPolarizationFraction: evaluateKerrScatteringPolarizationFractionV407(muEmission), residuals: Object.freeze({ emitterNorm, directionNorm, diskNormalNorm, directionEmitterOrthogonality, diskNormalEmitterOrthogonality, toleranceMuDifference: 0, abCanonicalMuDifference: 0 as const }) });
}

function createAngleAudit(geometryValue: unknown, polarizationValue: unknown): KerrScatteringAtmosphereViewV407["angleAudit"] {
  parseKerrCorrectedAuthorityV312(geometryValue);
  parseKerrPolarizationRequalificationV313(polarizationValue);
  const geometry = geometryValue as { executions?: readonly RawGeometryExecutionV407[] };
  const polarization = polarizationValue as { payloads?: readonly RawPolarizationExecutionV407[] };
  if (!Array.isArray(geometry.executions) || !Array.isArray(polarization.payloads)) throw new Error("v407-authority-arrays");
  const diskExecutions = geometry.executions.filter((entry) => entry.classification === "disk-hit" && entry.formulation === "carter-mino-dop853-constraint-stabilized-v312");
  if (diskExecutions.length !== 16) throw new Error("v407-disk-execution-count");
  const spinByRay = new Map<RayIdV407, number>();
  for (const rayId of RAY_IDS) {
    const sources = polarization.payloads.filter((entry) => entry.rayId === rayId);
    if (sources.length !== 4 || sources.some((entry) => !Number.isFinite(entry.spin) || entry.spin !== sources[0].spin)) throw new Error("v407-spin-source");
    spinByRay.set(rayId, sources[0].spin);
  }
  const all = diskExecutions.map((execution) => deriveAngle(execution, spinByRay.get(execution.rayId) ?? Number.NaN));
  const records = RAY_IDS.map((rayId) => {
    const executions = diskExecutions.filter((entry) => entry.rayId === rayId);
    const angles = executions.map((entry, index) => ({ execution: entry, angle: all[diskExecutions.indexOf(entry)] ?? all[index] }));
    const releaseA = angles.find((entry) => entry.execution.toleranceClass === "release" && entry.execution.branch === "A");
    const releaseB = angles.find((entry) => entry.execution.toleranceClass === "release" && entry.execution.branch === "B");
    const internalA = angles.find((entry) => entry.execution.toleranceClass === "internal" && entry.execution.branch === "A");
    const internalB = angles.find((entry) => entry.execution.toleranceClass === "internal" && entry.execution.branch === "B");
    if (!releaseA || !releaseB || !internalA || !internalB) throw new Error("v407-angle-ladder");
    const abCanonicalMuDifference = Math.max(Math.abs(releaseA.angle.muEmission - releaseB.angle.muEmission), Math.abs(internalA.angle.muEmission - internalB.angle.muEmission));
    const toleranceMuDifference = Math.abs(releaseA.angle.muEmission - internalA.angle.muEmission);
    if (abCanonicalMuDifference !== 0 || toleranceMuDifference >= 1e-12) throw new Error("v407-angle-convergence");
    return Object.freeze({ ...releaseA.angle, residuals: Object.freeze({ ...releaseA.angle.residuals, toleranceMuDifference, abCanonicalMuDifference: 0 as const }) });
  });
  const curve = Array.from({ length: 4097 }, (_, index) => evaluateKerrScatteringPolarizationFractionV407(index / 4096));
  const maxMonotonicIncrease = Math.max(0, ...curve.slice(1).map((value, index) => value - curve[index]));
  const endpointFaceOn = evaluateKerrScatteringPolarizationFractionV407(1);
  const endpointLimb = evaluateKerrScatteringPolarizationFractionV407(0);
  const maxLocalFrameResidual = Math.max(...records.flatMap((record) => [record.residuals.emitterNorm, record.residuals.directionNorm, record.residuals.diskNormalNorm, record.residuals.directionEmitterOrthogonality, record.residuals.diskNormalEmitterOrthogonality]));
  if (endpointFaceOn !== 0 || endpointLimb !== 0.1171 || maxMonotonicIncrease !== 0 || maxLocalFrameResidual >= 1e-12) throw new Error("v407-atmosphere-curve-gate");
  return Object.freeze({ records: Object.freeze(records), curveSampleCount: 4097 as const, endpointFaceOn: 0 as const, endpointLimb: 0.1171 as const, maxMonotonicIncrease: 0 as const, minimumMu: Math.min(...records.map((record) => record.muEmission)), maximumMu: Math.max(...records.map((record) => record.muEmission)), minimumFraction: Math.min(...records.map((record) => record.linearPolarizationFraction)), maximumFraction: Math.max(...records.map((record) => record.linearPolarizationFraction)), maxToleranceMuDifference: Math.max(...records.map((record) => record.residuals.toleranceMuDifference)), maxAbCanonicalMuDifference: 0 as const, maxLocalFrameResidual });
}

function createSample(source: KerrStokesTransferArtifactV406["view"]["samples"][number], angleRecord: KerrScatteringEmissionAngleV407): KerrScatteringStokesSampleV407 {
  const emittedI = source.emittedStokes.i;
  const observedI = source.observedStokes.i;
  const fraction = angleRecord.linearPolarizationFraction;
  const emittedL = emittedI * fraction;
  const observedL = observedI * fraction;
  const angle = source.evpaDeg * Math.PI / 180;
  const cosine = Math.cos(2 * angle);
  const sine = Math.sin(2 * angle);
  const observedQ = observedL * cosine;
  const observedU = observedL * sine;
  const recoveredQ = observedQ * cosine + observedU * sine;
  const recoveredU = -observedQ * sine + observedU * cosine;
  const observedNorm = Math.hypot(observedQ, observedU);
  const residuals = Object.freeze({ intensityInvariantRelative: relativeDifference(invariant(emittedI, source.emittedFrequencyHz), invariant(observedI, source.observedFrequencyHz)), linearAmplitudeInvariantRelative: relativeDifference(invariant(emittedL, source.emittedFrequencyHz), invariant(observedNorm, source.observedFrequencyHz)), linearFractionAbsolute: Math.max(Math.abs(emittedL / emittedI - fraction), Math.abs(observedNorm / observedI - fraction)), inverseRotationRelative: Math.hypot(recoveredQ - observedL, recoveredU) / Math.max(1e-300, observedL), rotationNormRelative: relativeDifference(observedNorm, observedL) });
  if (!finite(observedQ, observedU, ...Object.values(residuals))) throw new Error("v407-stokes-non-finite");
  return Object.freeze({ rayId: source.rayId, rayIndex: source.rayIndex, spinA: source.spinA, muEmission: angleRecord.muEmission, linearPolarizationFraction: fraction, observedFrequencyHz: source.observedFrequencyHz, emittedFrequencyHz: source.emittedFrequencyHz, redshiftFactor: source.redshiftFactor, transportMethod: source.transportMethod, evpaDeg: source.evpaDeg, emittedStokes: Object.freeze({ i: emittedI, q: emittedL, u: 0 as const, linearAmplitude: emittedL, linearFraction: fraction }), observedStokes: Object.freeze({ i: observedI, q: observedQ, u: observedU, linearAmplitude: observedNorm, linearFraction: observedNorm / observedI }), residuals, sourceUncertainty: source.sourceUncertainty });
}

export function createKerrScatteringAtmosphereViewV407(geometryValue: unknown, polarizationValue: unknown, stokesArtifactValue: unknown): KerrScatteringAtmosphereViewV407 {
  const stokesArtifact = parseKerrStokesTransferArtifactV406(stokesArtifactValue);
  if (stokesArtifact.artifactSha256 !== KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406) throw new Error("v407-v406-artifact-lock");
  const angleAudit = createAngleAudit(geometryValue, polarizationValue);
  const angleByRay = new Map(angleAudit.records.map((record) => [record.rayId, record]));
  const samples = stokesArtifact.view.samples.map((source) => createSample(source, angleByRay.get(source.rayId) ?? (() => { throw new Error("v407-angle-source"); })()));
  const pathComparisons = RAY_IDS.flatMap((rayId) => ([1e16, 1e17, 1e18] as const).map((observedFrequencyHz) => {
    const wp = samples.find((sample) => sample.rayId === rayId && sample.observedFrequencyHz === observedFrequencyHz && sample.transportMethod === "walker-penrose");
    const pt = samples.find((sample) => sample.rayId === rayId && sample.observedFrequencyHz === observedFrequencyHz && sample.transportMethod === "independent-ks-parallel-transport");
    if (!wp || !pt) throw new Error("v407-path-comparison-source");
    return Object.freeze({ rayId, observedFrequencyHz, evpaDifferenceDeg: evpaDistance(wp.evpaDeg, pt.evpaDeg), normalizedStokesQuDifference: Math.hypot(wp.observedStokes.q - pt.observedStokes.q, wp.observedStokes.u - pt.observedStokes.u) / Math.max(1e-300, wp.observedStokes.linearAmplitude) });
  }));
  const maxima = Object.freeze({ intensityInvariantRelative: Math.max(...samples.map((sample) => sample.residuals.intensityInvariantRelative)), linearAmplitudeInvariantRelative: Math.max(...samples.map((sample) => sample.residuals.linearAmplitudeInvariantRelative)), linearFractionAbsolute: Math.max(...samples.map((sample) => sample.residuals.linearFractionAbsolute)), inverseRotationRelative: Math.max(...samples.map((sample) => sample.residuals.inverseRotationRelative)), rotationNormRelative: Math.max(...samples.map((sample) => sample.residuals.rotationNormRelative)), releaseEvpaDifferenceDeg: stokesArtifact.view.maxima.releaseEvpaDifferenceDeg, internalEvpaDifferenceDeg: stokesArtifact.view.maxima.internalEvpaDifferenceDeg, normalizedStokesQuDifference: Math.max(...pathComparisons.map((entry) => entry.normalizedStokesQuDifference)), abCanonicalDifference: 0 as const });
  if (samples.length !== 24 || pathComparisons.length !== 12 || angleAudit.records.length !== 4 || maxima.intensityInvariantRelative >= 1e-12 || maxima.linearAmplitudeInvariantRelative >= 1e-12 || maxima.linearFractionAbsolute >= 1e-12 || maxima.inverseRotationRelative >= 1e-12 || maxima.rotationNormRelative >= 1e-12 || maxima.normalizedStokesQuDifference >= 1e-10 || maxima.releaseEvpaDifferenceDeg >= 0.5 || maxima.internalEvpaDifferenceDeg >= 0.1) throw new Error(`v407-scattering-qualification:${JSON.stringify(maxima)}`);
  return Object.freeze({
    version: KERR_SCATTERING_ATMOSPHERE_VERSION_V407,
    status: "qualified-sparse-scattering-atmosphere-approximation",
    authority: Object.freeze({ geometryEvidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312, polarizationEvidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313, v406StokesArtifactSha256: KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406, denseAggregateSha256: null }),
    model: Object.freeze({ family: "semi-infinite-pure-electron-scattering-atmosphere", lineage: "chandrasekhar-sobolev-style-closed-form-approximation", approximation: "p(mu)=0.1171*(1-mu)/(1+3.582*mu)", qualification: "closed-form-approximation-boundary-only", exactHFunctionTableAccuracy: "not-qualified", emissionAngle: "local-emitter-frame-disk-normal-dot-photon-direction", observerInclinationSubstituted: false as const, screenBetaSubstituted: false as const, historicalV406FixedFraction: 0.12 as const, emittedBasis: "projected-disk-normal", propagation: "vacuum-geometric-optics-no-emission-absorption-scattering-after-disk", circularPolarization: "unavailable-not-modeled", faradayRotation: "unavailable-not-modeled", absorptionOpacity: "unavailable-not-modeled" }),
    references: Object.freeze([
      Object.freeze({ citation: "Chandrasekhar, S. (1960), Radiative Transfer, Dover.", role: "problem-family" as const, verification: "bibliographic-family-only-no-exact-coefficient-fit-claim" as const }),
      Object.freeze({ citation: "Sobolev, V. V. (1963), A Treatise on Radiative Transfer, Van Nostrand.", role: "problem-family" as const, verification: "bibliographic-family-only-no-exact-coefficient-fit-claim" as const }),
      Object.freeze({ citation: "Phillips & Meszaros (1986), Polarization and Beaming of Accretion Disk Radiation, doi:10.1086/164682.", role: "secondary-context" as const, verification: "metadata-only-no-coefficient-validation" as const }),
    ]),
    angleAudit,
    counts: Object.freeze({ canonicalRayCount: 16 as const, diskRayCount: 4 as const, unavailableCaptureEscapeRayCount: 12 as const, frequencyCount: 3 as const, transportMethodCount: 2 as const, stokesSampleCount: 24 as const, pathComparisonCount: 12 as const, sourceGeometryDiskExecutionCount: 16 as const }),
    samples: Object.freeze(samples), pathComparisons: Object.freeze(pathComparisons), maxima,
    thresholds: Object.freeze({ localFrameResidual: 1e-12 as const, toleranceMuDifference: 1e-12 as const, invariantRelative: 1e-12 as const, linearFractionAbsolute: 1e-12 as const, inverseRotationRelative: 1e-12 as const, normalizedStokesQuDifference: 1e-10 as const, releaseEvpaDifferenceDeg: 0.5 as const, internalEvpaDifferenceDeg: 0.1 as const }),
    units: Object.freeze({ frequency: "Hz" as const, spectralStokes: "W m^-2 sr^-1 Hz^-1" as const, evpa: "deg modulo 180" as const, muEmission: "dimensionless" as const }),
    uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
    displayBoundary: "science-linear-immutable-stokes-cinematic-must-not-mutate",
    boundary: "four-authority-disk-rays-angle-dependent-scattering-approximation-not-exact-table-or-dense-image",
  });
}

export function parseKerrScatteringAtmosphereViewV407(value: unknown): KerrScatteringAtmosphereViewV407 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScatteringAtmosphereViewV407> : null;
  if (!source || source.version !== KERR_SCATTERING_ATMOSPHERE_VERSION_V407 || source.status !== "qualified-sparse-scattering-atmosphere-approximation" || source.authority?.geometryEvidenceSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 || source.authority.polarizationEvidenceSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 || source.authority.v406StokesArtifactSha256 !== KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406 || source.authority.denseAggregateSha256 !== null || source.model?.lineage !== "chandrasekhar-sobolev-style-closed-form-approximation" || source.model.qualification !== "closed-form-approximation-boundary-only" || source.model.exactHFunctionTableAccuracy !== "not-qualified" || source.model.observerInclinationSubstituted !== false || source.model.screenBetaSubstituted !== false || source.model.historicalV406FixedFraction !== 0.12 || source.model.circularPolarization !== "unavailable-not-modeled" || source.model.faradayRotation !== "unavailable-not-modeled" || source.model.absorptionOpacity !== "unavailable-not-modeled" || !Array.isArray(source.angleAudit?.records) || source.angleAudit.records.length !== 4 || source.angleAudit.curveSampleCount !== 4097 || source.angleAudit.endpointFaceOn !== 0 || source.angleAudit.endpointLimb !== 0.1171 || source.angleAudit.maxMonotonicIncrease !== 0 || source.angleAudit.maxToleranceMuDifference >= 1e-12 || source.angleAudit.maxAbCanonicalMuDifference !== 0 || source.angleAudit.maxLocalFrameResidual >= 1e-12 || source.angleAudit.records.some((record) => !finite(record.muEmission, record.linearPolarizationFraction) || record.muEmission < 0 || record.muEmission > 1 || record.linearPolarizationFraction < 0 || record.linearPolarizationFraction > 0.1171) || source.counts?.stokesSampleCount !== 24 || source.counts.pathComparisonCount !== 12 || source.counts.sourceGeometryDiskExecutionCount !== 16 || !Array.isArray(source.samples) || source.samples.length !== 24 || !Array.isArray(source.pathComparisons) || source.pathComparisons.length !== 12 || !source.maxima || source.maxima.intensityInvariantRelative >= 1e-12 || source.maxima.linearAmplitudeInvariantRelative >= 1e-12 || source.maxima.linearFractionAbsolute >= 1e-12 || source.maxima.inverseRotationRelative >= 1e-12 || source.maxima.rotationNormRelative >= 1e-12 || source.maxima.normalizedStokesQuDifference >= 1e-10 || source.maxima.releaseEvpaDifferenceDeg >= 0.5 || source.maxima.internalEvpaDifferenceDeg >= 0.1 || source.maxima.abCanonicalDifference !== 0 || source.uncertaintyCombination !== "componentwise-no-rss-no-scalar-total" || source.displayBoundary !== "science-linear-immutable-stokes-cinematic-must-not-mutate" || source.boundary !== "four-authority-disk-rays-angle-dependent-scattering-approximation-not-exact-table-or-dense-image") throw new Error("v407-scattering-view-identity");
  return value as KerrScatteringAtmosphereViewV407;
}

export function parseKerrScatteringAtmosphereArtifactV407(value: unknown): KerrScatteringAtmosphereArtifactV407 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScatteringAtmosphereArtifactV407> : null;
  if (!source || source.version !== KERR_SCATTERING_ATMOSPHERE_ARTIFACT_VERSION_V407 || !source.sourceFiles || !Object.values(source.sourceFiles).every((entry) => /^[a-f0-9]{64}$/.test(entry)) || source.sourceArtifacts?.v406StokesCanonical !== KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406 || !source.view || source.deterministicReplay !== true || source.networkAttemptedByBuild !== false || source.denseShardExecuted !== false || source.boundary !== "immutable-derived-sparse-scattering-atmosphere-no-dense-or-product-promotion" || !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")) throw new Error("v407-scattering-artifact-identity");
  parseKerrScatteringAtmosphereViewV407(source.view);
  return value as KerrScatteringAtmosphereArtifactV407;
}

export function createKerrScatteringAtmosphereSummaryV407(artifactValue: unknown): KerrScatteringAtmosphereSummaryV407 {
  const artifact = parseKerrScatteringAtmosphereArtifactV407(artifactValue);
  const referenceRays = artifact.view.angleAudit.records.map((angleRecord) => {
    const wp = artifact.view.samples.find((sample) => sample.rayId === angleRecord.rayId && sample.observedFrequencyHz === 1e17 && sample.transportMethod === "walker-penrose");
    const pt = artifact.view.samples.find((sample) => sample.rayId === angleRecord.rayId && sample.observedFrequencyHz === 1e17 && sample.transportMethod === "independent-ks-parallel-transport");
    const comparison = artifact.view.pathComparisons.find((entry) => entry.rayId === angleRecord.rayId && entry.observedFrequencyHz === 1e17);
    if (!wp || !pt || !comparison) throw new Error("v407-summary-reference-ray");
    return Object.freeze({ rayId: angleRecord.rayId, spinA: angleRecord.spinA, muEmission: angleRecord.muEmission, linearPolarizationFraction: angleRecord.linearPolarizationFraction, walkerPenrose: Object.freeze({ qOverI: wp.observedStokes.q / wp.observedStokes.i, uOverI: wp.observedStokes.u / wp.observedStokes.i, evpaDeg: wp.evpaDeg }), parallelTransport: Object.freeze({ qOverI: pt.observedStokes.q / pt.observedStokes.i, uOverI: pt.observedStokes.u / pt.observedStokes.i, evpaDeg: pt.evpaDeg }), evpaDifferenceDeg: comparison.evpaDifferenceDeg, normalizedStokesQuDifference: comparison.normalizedStokesQuDifference });
  });
  const boundedAngleAudit = Object.freeze({
    curveSampleCount: artifact.view.angleAudit.curveSampleCount,
    endpointFaceOn: artifact.view.angleAudit.endpointFaceOn,
    endpointLimb: artifact.view.angleAudit.endpointLimb,
    maxMonotonicIncrease: artifact.view.angleAudit.maxMonotonicIncrease,
    minimumMu: artifact.view.angleAudit.minimumMu,
    maximumMu: artifact.view.angleAudit.maximumMu,
    minimumFraction: artifact.view.angleAudit.minimumFraction,
    maximumFraction: artifact.view.angleAudit.maximumFraction,
    maxToleranceMuDifference: artifact.view.angleAudit.maxToleranceMuDifference,
    maxAbCanonicalMuDifference: artifact.view.angleAudit.maxAbCanonicalMuDifference,
    maxLocalFrameResidual: artifact.view.angleAudit.maxLocalFrameResidual,
  });
  return Object.freeze({ version: KERR_SCATTERING_ATMOSPHERE_SUMMARY_VERSION_V407, status: artifact.view.status, artifactSha256: artifact.artifactSha256, authority: artifact.view.authority, model: artifact.view.model, angleAudit: Object.freeze(boundedAngleAudit), counts: artifact.view.counts, maxima: artifact.view.maxima, referenceBandHz: 1e17 as const, referenceRays: Object.freeze(referenceRays), fullArtifactAvailable: true as const, denseAggregateAvailable: false as const, browserQualification: "not-run" as const, boundary: "summary-only-no-angle-execution-or-full-sample-arrays-in-react-state" as const });
}

export function parseKerrScatteringAtmosphereSummaryV407(value: unknown): KerrScatteringAtmosphereSummaryV407 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScatteringAtmosphereSummaryV407> : null;
  if (!source || source.version !== KERR_SCATTERING_ATMOSPHERE_SUMMARY_VERSION_V407 || source.status !== "qualified-sparse-scattering-atmosphere-approximation" || !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "") || source.model?.exactHFunctionTableAccuracy !== "not-qualified" || source.angleAudit?.curveSampleCount !== 4097 || source.counts?.stokesSampleCount !== 24 || source.referenceBandHz !== 1e17 || !Array.isArray(source.referenceRays) || source.referenceRays.length !== 4 || source.referenceRays.some((ray) => !finite(ray.spinA, ray.muEmission, ray.linearPolarizationFraction, ray.walkerPenrose.qOverI, ray.walkerPenrose.uOverI, ray.walkerPenrose.evpaDeg, ray.parallelTransport.qOverI, ray.parallelTransport.uOverI, ray.parallelTransport.evpaDeg, ray.evpaDifferenceDeg, ray.normalizedStokesQuDifference)) || source.fullArtifactAvailable !== true || source.denseAggregateAvailable !== false || source.browserQualification !== "not-run" || source.boundary !== "summary-only-no-angle-execution-or-full-sample-arrays-in-react-state") throw new Error("v407-scattering-summary-identity");
  return value as KerrScatteringAtmosphereSummaryV407;
}

export function parseKerrScatteringAtmosphereResponseV407(value: unknown): KerrScatteringAtmosphereResponseV407 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScatteringAtmosphereResponseV407> : null;
  if (!source || source.version !== KERR_SCATTERING_ATMOSPHERE_RESPONSE_VERSION_V407) throw new Error("v407-scattering-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) return { version: KERR_SCATTERING_ATMOSPHERE_RESPONSE_VERSION_V407, available: true, reason: "ready", summary: parseKerrScatteringAtmosphereSummaryV407(source.summary) };
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrScatteringAtmosphereResponseV407;
  throw new Error("v407-scattering-response-identity");
}
