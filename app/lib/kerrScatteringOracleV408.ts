import { KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406 } from "./kerrScatteringAtmosphereV407";

export const KERR_SCATTERING_ORACLE_VERSION_V408 = "v408-kerr-scattering-discrete-ordinates-oracle-v1" as const;
export const KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408 = "7fc3772ebde21ddad6beecf8487b0814055d3c133bc14048677e0160a9a6565e" as const;
export const KERR_SCATTERING_ORACLE_ARTIFACT_VERSION_V408 = "v408-kerr-scattering-discrete-ordinates-artifact-v1" as const;
export const KERR_SCATTERING_ORACLE_SUMMARY_VERSION_V408 = "v408-kerr-scattering-oracle-summary-v1" as const;
export const KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408 = "v408-kerr-scattering-oracle-response-v1" as const;
export const KERR_SCATTERING_SOURCE_ADS_SHA256_V408 = "e6f53fb301aca1378d373c13388966e8eccf923660aafd73670151028cbc0f4b" as const;
export const KERR_SCATTERING_V407_ARTIFACT_SHA256_V408 = "3b493dbf281acc6c93b72d6faaed70ec89e1b2aa12e8f3633b3bf708363c9ae7" as const;

type RayIdV408 = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type NumericalUncertaintyV408 = Readonly<{
  uAngularAbsolute: number;
  uSpatialAbsolute: number;
  uHalfSpaceAbsolute: number;
  uInterpolationAbsolute: number;
  linearSumAbsolute: number;
  linearSumRelative: number;
  combination: "linear-no-rss-no-independence-claim";
}>;

export type KerrScatteringOracleRayV408 = Readonly<{
  rayId: RayIdV408;
  spinA: number;
  muEmission: number;
  v407ApproximationFraction: number;
  v408DiscreteOrdinatesFraction: number;
  signedApproximationError: number;
  absoluteApproximationError: number;
  relativeApproximationError: number;
  numericalUncertainty: NumericalUncertaintyV408;
}>;

export type KerrScatteringOracleCurveSampleV408 = Readonly<{
  muEmission: number;
  v407ApproximationFraction: number;
  v408DiscreteOrdinatesFraction: number;
  signedApproximationError: number;
  relativeApproximationError: number;
}>;

type SolverConfigurationV408 = Readonly<{
  id: string;
  angleCount: number;
  depthCount: number;
  tauMax: number;
  minimumOutgoingMu: number;
  maximumOutgoingMu: number;
  matrixShape: readonly [number, number];
  matrixNnz: number;
  linearSystemResidual: number;
  relativeFluxDrift: number;
  kernelEquilibriumResidual: number;
  minimumIntensity: number;
}>;

export type KerrScatteringOracleViewV408 = Readonly<{
  version: typeof KERR_SCATTERING_ORACLE_VERSION_V408;
  status: "qualified-independent-discrete-ordinates-reference-envelope";
  qualified: true;
  sourceReference: Readonly<{
    title: string;
    author: "C. E. Siewert";
    journal: "The Astrophysical Journal";
    volume: "152";
    page: "835";
    year: 1968;
    doi: "10.1086/149599";
    adsBibcode: "1968ApJ...152..835S";
    adsPdfUrl: string;
    adsPdfSha256: typeof KERR_SCATTERING_SOURCE_ADS_SHA256_V408;
    verification: "crossref-metadata-and-ads-scan-equations-1-2-verified";
    equationTranscriptionSha256: string;
  }>;
  inputAuthority: Readonly<{
    v407ArtifactSha256: typeof KERR_SCATTERING_V407_ARTIFACT_SHA256_V408;
    v407Status: "qualified-sparse-scattering-atmosphere-approximation";
    diskRayCount: 4;
    exactHFunctionTableAccuracy: "not-qualified";
  }>;
  solver: Readonly<{
    equation: string;
    kernel: string;
    method: "gauss-legendre-discrete-ordinates-plus-diamond-difference-sparse-bvp";
    topBoundary: "zero-reentrant-I(0,mu-positive)";
    deepBoundary: "unit-unpolarized-I(tau-max,mu-negative)";
    normalization: "arbitrary-polarization-ratio-invariant";
    interpolation: "monotone-pchip-production-cubic-spline-cross-check";
    qualifiedMuDomain: readonly [0.05, 0.95];
    configurations: readonly SolverConfigurationV408[];
  }>;
  rayComparisons: readonly KerrScatteringOracleRayV408[];
  curveEnvelope: Readonly<{
    muDomain: readonly [0.05, 0.95];
    sampleCount: 181;
    samples: readonly KerrScatteringOracleCurveSampleV408[];
    maximumAbsoluteApproximationError: number;
    maximumRelativeApproximationError: number;
    approximationUnderestimatesAllSamples: boolean;
  }>;
  maxima: Readonly<{
    linearSystemResidual: number;
    relativeFluxDrift: number;
    kernelEquilibriumResidual: number;
    deterministicReplayDifference: 0;
    rayNumericalUncertaintyLinearSumAbsolute: number;
    rayRelativeUnderestimate: number;
  }>;
  thresholds: Readonly<{
    linearSystemResidual: 1e-10;
    relativeFluxDrift: 1e-10;
    kernelEquilibriumResidual: 1e-13;
    deterministicReplayDifference: 1e-14;
    angularConvergenceAbsolute: 2e-5;
    spatialConvergenceAbsolute: 1e-8;
    halfSpaceConvergenceAbsolute: 1e-8;
    interpolationCrossCheckAbsolute: 1e-6;
    maximumPeakRssGiB: 2;
  }>;
  gates: Readonly<Record<string, true>>;
  authorityBoundary: Readonly<{
    independentNumericalReferenceOnQualifiedMuDomain: true;
    exactChandrasekharHFunctionTableAuthority: false;
    limbEndpointMuZeroQualified: false;
    faceOnEndpointMuOneQualified: false;
    finiteSlabTruncationIncluded: true;
    v407HistoricalArtifactMutated: false;
    v407ApproximationPromotionApplied: false;
    recommendedUse: "apply-v408-error-envelope-without-rewriting-v407";
  }>;
  resource: Readonly<{ maximumPeakRssGiB: 2; qualified: true }>;
  environment: Readonly<{ python: string; numpy: string; scipy: string }>;
  networkAttempted: false;
  automaticRetryApplied: false;
  denseShardExecuted: false;
  release: Readonly<{
    formalProductPointer: "v263";
    formalProductPointerAdvanced: false;
    defaultKernel: "legacy-eih-1pn";
    workerPhysicsMutation: "not-applied";
    localShadowDefaultApplied: false;
  }>;
  boundary: "independent-finite-slab-discrete-ordinates-reference-envelope-not-exact-h-function-table-or-dense-image";
}>;

export type KerrScatteringOraclePythonResultV408 = Omit<KerrScatteringOracleViewV408, "resource"> & Readonly<{
  generatedAt: string;
  evidenceSha256: typeof KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408;
  resource: Readonly<{
    availableMemoryGiBBefore: number;
    freeDiskGiBBefore: number;
    peakRssGiB: number;
    maximumPeakRssGiB: 2;
    qualified: true;
  }>;
}>;

export type KerrScatteringOracleArtifactV408 = Readonly<{
  version: typeof KERR_SCATTERING_ORACLE_ARTIFACT_VERSION_V408;
  generatedAt: string;
  sourcePythonEvidenceSha256: typeof KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408;
  sourceArtifacts: Readonly<{
    v407ScatteringAtmosphere: typeof KERR_SCATTERING_V407_ARTIFACT_SHA256_V408;
    v406Stokes: typeof KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406;
  }>;
  view: KerrScatteringOracleViewV408;
  observedPeakRssGiB: number;
  deterministicReplay: true;
  networkAttemptedByPortableBuild: false;
  denseShardExecuted: false;
  boundary: "portable-independent-numerical-reference-envelope-no-exact-table-or-product-promotion";
  artifactSha256: string;
}>;

export type KerrScatteringOracleSummaryV408 = Readonly<{
  version: typeof KERR_SCATTERING_ORACLE_SUMMARY_VERSION_V408;
  status: KerrScatteringOracleViewV408["status"];
  artifactSha256: string;
  sourceReference: Pick<KerrScatteringOracleViewV408["sourceReference"], "title" | "author" | "year" | "doi" | "adsBibcode" | "verification">;
  solver: Readonly<{
    method: KerrScatteringOracleViewV408["solver"]["method"];
    qualifiedMuDomain: readonly [0.05, 0.95];
    productionAngleCount: 80;
    productionDepthCount: 121;
    productionTauMax: 20;
    configurationCount: 6;
  }>;
  rayComparisons: readonly KerrScatteringOracleRayV408[];
  curveEnvelope: Omit<KerrScatteringOracleViewV408["curveEnvelope"], "samples">;
  maxima: KerrScatteringOracleViewV408["maxima"];
  authorityBoundary: KerrScatteringOracleViewV408["authorityBoundary"];
  fullArtifactAvailable: true;
  browserQualification: "not-run";
  boundary: "summary-only-no-181-point-curve-or-solver-fields-in-react-state";
}>;

export type KerrScatteringOracleResponseV408 = Readonly<{
  version: typeof KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrScatteringOracleSummaryV408 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const RAY_IDS = Object.freeze(["disk-00", "disk-01", "disk-02", "disk-03"] as const);
const finite = (...values: number[]) => values.every(Number.isFinite);
const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v408-${label}`);
  return value as Record<string, unknown>;
};

function parseCommonViewV408(value: unknown, requireRawResource: boolean): Record<string, unknown> {
  const source = record(value, "view");
  const reference = record(source.sourceReference, "source-reference");
  const input = record(source.inputAuthority, "input-authority");
  const solver = record(source.solver, "solver");
  const curve = record(source.curveEnvelope, "curve-envelope");
  const maxima = record(source.maxima, "maxima");
  const thresholds = record(source.thresholds, "thresholds");
  const gates = record(source.gates, "gates");
  const boundary = record(source.authorityBoundary, "authority-boundary");
  const resource = record(source.resource, "resource");
  const release = record(source.release, "release");
  const rays = source.rayComparisons;
  const samples = curve.samples;
  const configurations = solver.configurations;

  const invalidConfiguration = !Array.isArray(configurations) || configurations.length !== 6 || configurations.some((entry) => {
    const config = record(entry, "configuration");
    const shape = config.matrixShape;
    return typeof config.id !== "string" || !finite(Number(config.angleCount), Number(config.depthCount), Number(config.tauMax), Number(config.minimumOutgoingMu), Number(config.maximumOutgoingMu), Number(config.matrixNnz), Number(config.linearSystemResidual), Number(config.relativeFluxDrift), Number(config.kernelEquilibriumResidual), Number(config.minimumIntensity)) || !Array.isArray(shape) || shape.length !== 2 || !finite(Number(shape[0]), Number(shape[1]));
  });
  const invalidRays = !Array.isArray(rays) || rays.length !== 4 || rays.map((ray) => record(ray, "ray").rayId).join(",") !== RAY_IDS.join(",") || rays.some((entry) => {
    const ray = record(entry, "ray");
    const uncertainty = record(ray.numericalUncertainty, "ray-uncertainty");
    return !finite(Number(ray.spinA), Number(ray.muEmission), Number(ray.v407ApproximationFraction), Number(ray.v408DiscreteOrdinatesFraction), Number(ray.signedApproximationError), Number(ray.absoluteApproximationError), Number(ray.relativeApproximationError), Number(uncertainty.linearSumAbsolute), Number(uncertainty.linearSumRelative)) || Number(ray.muEmission) < 0.05 || Number(ray.muEmission) > 0.95 || uncertainty.combination !== "linear-no-rss-no-independence-claim";
  });
  const invalidSamples = !Array.isArray(samples) || samples.length !== 181 || samples.some((entry) => {
    const sample = record(entry, "curve-sample");
    return !finite(Number(sample.muEmission), Number(sample.v407ApproximationFraction), Number(sample.v408DiscreteOrdinatesFraction), Number(sample.signedApproximationError), Number(sample.relativeApproximationError));
  });
  const invalidRawResource = requireRawResource && (!finite(Number(resource.availableMemoryGiBBefore), Number(resource.freeDiskGiBBefore), Number(resource.peakRssGiB)) || Number(resource.peakRssGiB) <= 0 || Number(resource.peakRssGiB) >= 2);

  if (
    source.version !== KERR_SCATTERING_ORACLE_VERSION_V408 ||
    source.status !== "qualified-independent-discrete-ordinates-reference-envelope" ||
    source.qualified !== true ||
    reference.author !== "C. E. Siewert" ||
    reference.doi !== "10.1086/149599" ||
    reference.adsBibcode !== "1968ApJ...152..835S" ||
    reference.adsPdfSha256 !== KERR_SCATTERING_SOURCE_ADS_SHA256_V408 ||
    reference.verification !== "crossref-metadata-and-ads-scan-equations-1-2-verified" ||
    !SHA.test(String(reference.equationTranscriptionSha256 ?? "")) ||
    input.v407ArtifactSha256 !== KERR_SCATTERING_V407_ARTIFACT_SHA256_V408 ||
    input.v407Status !== "qualified-sparse-scattering-atmosphere-approximation" ||
    input.diskRayCount !== 4 ||
    input.exactHFunctionTableAccuracy !== "not-qualified" ||
    solver.method !== "gauss-legendre-discrete-ordinates-plus-diamond-difference-sparse-bvp" ||
    solver.interpolation !== "monotone-pchip-production-cubic-spline-cross-check" ||
    JSON.stringify(solver.qualifiedMuDomain) !== "[0.05,0.95]" ||
    invalidConfiguration || invalidRays ||
    curve.sampleCount !== 181 || JSON.stringify(curve.muDomain) !== "[0.05,0.95]" || invalidSamples ||
    curve.approximationUnderestimatesAllSamples !== false ||
    !finite(Number(curve.maximumAbsoluteApproximationError), Number(curve.maximumRelativeApproximationError)) ||
    Number(maxima.linearSystemResidual) >= 1e-10 || Number(maxima.relativeFluxDrift) >= 1e-10 || Number(maxima.kernelEquilibriumResidual) >= 1e-13 ||
    maxima.deterministicReplayDifference !== 0 ||
    !finite(Number(maxima.rayNumericalUncertaintyLinearSumAbsolute), Number(maxima.rayRelativeUnderestimate)) ||
    thresholds.maximumPeakRssGiB !== 2 ||
    Object.keys(gates).length !== 13 || Object.values(gates).some((gate) => gate !== true) ||
    boundary.independentNumericalReferenceOnQualifiedMuDomain !== true ||
    boundary.exactChandrasekharHFunctionTableAuthority !== false ||
    boundary.limbEndpointMuZeroQualified !== false || boundary.faceOnEndpointMuOneQualified !== false ||
    boundary.finiteSlabTruncationIncluded !== true ||
    boundary.v407HistoricalArtifactMutated !== false || boundary.v407ApproximationPromotionApplied !== false ||
    boundary.recommendedUse !== "apply-v408-error-envelope-without-rewriting-v407" ||
    resource.maximumPeakRssGiB !== 2 || resource.qualified !== true || invalidRawResource ||
    source.networkAttempted !== false || source.automaticRetryApplied !== false || source.denseShardExecuted !== false ||
    release.formalProductPointer !== "v263" || release.formalProductPointerAdvanced !== false ||
    release.defaultKernel !== "legacy-eih-1pn" || release.workerPhysicsMutation !== "not-applied" || release.localShadowDefaultApplied !== false ||
    source.boundary !== "independent-finite-slab-discrete-ordinates-reference-envelope-not-exact-h-function-table-or-dense-image"
  ) throw new Error("v408-oracle-view-identity");
  return source;
}

export function parseKerrScatteringOracleViewV408(value: unknown): KerrScatteringOracleViewV408 {
  parseCommonViewV408(value, false);
  return value as KerrScatteringOracleViewV408;
}

export function parseKerrScatteringOraclePythonResultV408(value: unknown): KerrScatteringOraclePythonResultV408 {
  const source = parseCommonViewV408(value, true);
  if (source.evidenceSha256 !== KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408 || typeof source.generatedAt !== "string") throw new Error("v408-python-result-identity");
  return value as KerrScatteringOraclePythonResultV408;
}

export function createKerrScatteringOracleViewV408(value: unknown): KerrScatteringOracleViewV408 {
  const result = parseKerrScatteringOraclePythonResultV408(value);
  const { generatedAt: _generatedAt, evidenceSha256: _evidenceSha256, resource, ...stable } = result;
  void _generatedAt;
  void _evidenceSha256;
  return Object.freeze({
    ...stable,
    resource: Object.freeze({ maximumPeakRssGiB: resource.maximumPeakRssGiB, qualified: resource.qualified }),
  });
}

export function parseKerrScatteringOracleArtifactV408(value: unknown): KerrScatteringOracleArtifactV408 {
  const source = record(value, "artifact");
  const artifacts = record(source.sourceArtifacts, "source-artifacts");
  if (
    source.version !== KERR_SCATTERING_ORACLE_ARTIFACT_VERSION_V408 ||
    source.sourcePythonEvidenceSha256 !== KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408 ||
    artifacts.v407ScatteringAtmosphere !== KERR_SCATTERING_V407_ARTIFACT_SHA256_V408 ||
    artifacts.v406Stokes !== KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406 ||
    !finite(Number(source.observedPeakRssGiB)) || Number(source.observedPeakRssGiB) <= 0 || Number(source.observedPeakRssGiB) >= 2 ||
    source.deterministicReplay !== true || source.networkAttemptedByPortableBuild !== false || source.denseShardExecuted !== false ||
    source.boundary !== "portable-independent-numerical-reference-envelope-no-exact-table-or-product-promotion" ||
    !SHA.test(String(source.artifactSha256 ?? ""))
  ) throw new Error("v408-oracle-artifact-identity");
  parseKerrScatteringOracleViewV408(source.view);
  return value as KerrScatteringOracleArtifactV408;
}

export function createKerrScatteringOracleSummaryV408(artifactValue: unknown): KerrScatteringOracleSummaryV408 {
  const artifact = parseKerrScatteringOracleArtifactV408(artifactValue);
  const production = artifact.view.solver.configurations.find((config) => config.id === "production-n80-d121-t20");
  if (!production || production.angleCount !== 80 || production.depthCount !== 121 || production.tauMax !== 20) throw new Error("v408-summary-production-config");
  const { samples: _samples, ...curveEnvelope } = artifact.view.curveEnvelope;
  void _samples;
  return Object.freeze({
    version: KERR_SCATTERING_ORACLE_SUMMARY_VERSION_V408,
    status: artifact.view.status,
    artifactSha256: artifact.artifactSha256,
    sourceReference: Object.freeze({
      title: artifact.view.sourceReference.title,
      author: artifact.view.sourceReference.author,
      year: artifact.view.sourceReference.year,
      doi: artifact.view.sourceReference.doi,
      adsBibcode: artifact.view.sourceReference.adsBibcode,
      verification: artifact.view.sourceReference.verification,
    }),
    solver: Object.freeze({
      method: artifact.view.solver.method,
      qualifiedMuDomain: artifact.view.solver.qualifiedMuDomain,
      productionAngleCount: 80 as const,
      productionDepthCount: 121 as const,
      productionTauMax: 20 as const,
      configurationCount: 6 as const,
    }),
    rayComparisons: artifact.view.rayComparisons,
    curveEnvelope: Object.freeze(curveEnvelope),
    maxima: artifact.view.maxima,
    authorityBoundary: artifact.view.authorityBoundary,
    fullArtifactAvailable: true as const,
    browserQualification: "not-run" as const,
    boundary: "summary-only-no-181-point-curve-or-solver-fields-in-react-state" as const,
  });
}

export function parseKerrScatteringOracleSummaryV408(value: unknown): KerrScatteringOracleSummaryV408 {
  const source = record(value, "summary");
  const solver = record(source.solver, "summary-solver");
  const curve = record(source.curveEnvelope, "summary-curve");
  const boundary = record(source.authorityBoundary, "summary-boundary");
  if (
    source.version !== KERR_SCATTERING_ORACLE_SUMMARY_VERSION_V408 ||
    source.status !== "qualified-independent-discrete-ordinates-reference-envelope" ||
    !SHA.test(String(source.artifactSha256 ?? "")) ||
    !Array.isArray(source.rayComparisons) || source.rayComparisons.length !== 4 ||
    solver.productionAngleCount !== 80 || solver.productionDepthCount !== 121 || solver.productionTauMax !== 20 || solver.configurationCount !== 6 ||
    curve.sampleCount !== 181 || Object.hasOwn(curve, "samples") ||
    boundary.exactChandrasekharHFunctionTableAuthority !== false ||
    source.fullArtifactAvailable !== true || source.browserQualification !== "not-run" ||
    source.boundary !== "summary-only-no-181-point-curve-or-solver-fields-in-react-state"
  ) throw new Error("v408-oracle-summary-identity");
  return value as KerrScatteringOracleSummaryV408;
}

export function parseKerrScatteringOracleResponseV408(value: unknown): KerrScatteringOracleResponseV408 {
  const source = record(value, "response");
  if (source.version !== KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408) throw new Error("v408-oracle-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) {
    return { version: KERR_SCATTERING_ORACLE_RESPONSE_VERSION_V408, available: true, reason: "ready", summary: parseKerrScatteringOracleSummaryV408(source.summary) };
  }
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(String(source.reason))) return source as KerrScatteringOracleResponseV408;
  throw new Error("v408-oracle-response-identity");
}
