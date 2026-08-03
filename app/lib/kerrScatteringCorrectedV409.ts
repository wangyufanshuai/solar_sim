import { KERR_SCATTERING_V407_ARTIFACT_SHA256_V408, KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408 } from "./kerrScatteringOracleV408";

export const KERR_SCATTERING_CORRECTED_VERSION_V409 = "v409-kerr-sparse-stokes-scattering-correction-v1" as const;
export const KERR_SCATTERING_CORRECTED_ARTIFACT_VERSION_V409 = "v409-kerr-sparse-stokes-scattering-correction-artifact-v1" as const;
export const KERR_SCATTERING_CORRECTED_SUMMARY_VERSION_V409 = "v409-kerr-sparse-stokes-correction-summary-v1" as const;
export const KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409 = "v409-kerr-sparse-stokes-correction-response-v1" as const;
export const KERR_SCATTERING_ORACLE_ARTIFACT_SHA256_V408 = "64d2f99dc15f1f3512117e0485e89e0d1a28f526d3bc4bb055f433723d5a7b25" as const;

type RayIdV409 = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type TransportMethodV409 = "walker-penrose" | "independent-ks-parallel-transport";
type FrequencyV409 = 1e16 | 1e17 | 1e18;

export type KerrScatteringCorrectedSampleV409 = Readonly<{
  rayId: RayIdV409;
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  muEmission: number;
  observedFrequencyHz: FrequencyV409;
  emittedFrequencyHz: number;
  redshiftFactor: number;
  transportMethod: TransportMethodV409;
  evpaDeg: number;
  sourceFractions: Readonly<{
    v407Approximation: number;
    v408DiscreteOrdinates: number;
    multiplicativeCorrection: number;
    relativeApproximationError: number;
  }>;
  emittedStokes: Readonly<{ i: number; q: number; u: 0; linearAmplitude: number; linearFraction: number }>;
  observedStokes: Readonly<{ i: number; q: number; u: number; linearAmplitude: number; linearFraction: number }>;
  numericalUncertainty: Readonly<{
    polarizationFractionAbsolute: number;
    polarizationFractionRelative: number;
    emittedQAbsolute: number;
    observedQAbsolute: number;
    observedUAbsolute: number;
    observedLinearAmplitudeAbsolute: number;
    combination: "linear-no-rss-no-independence-claim";
  }>;
  inheritedUncertainty: Readonly<{
    diskQuadratureRelative: number;
    formulaSpectralRelative: number;
    geometryRadiusDifferenceM: number;
    geometryRedshiftDifference: number;
  }>;
  residuals: Readonly<{
    observedLinearFractionAbsolute: number;
    emittedLinearFractionAbsolute: number;
    scaledOriginalQuRelative: number;
    intensityDifferenceFromV407: 0;
    evpaReconstructionDeg: number;
  }>;
}>;

export type KerrScatteringCorrectedPathComparisonV409 = Readonly<{
  rayId: RayIdV409;
  observedFrequencyHz: FrequencyV409;
  evpaDifferenceDeg: number;
  normalizedStokesQuDifference: number;
}>;

export type KerrScatteringCorrectedViewV409 = Readonly<{
  version: typeof KERR_SCATTERING_CORRECTED_VERSION_V409;
  status: "qualified-v408-error-envelope-applied-to-24-sparse-stokes-samples";
  authority: Readonly<{
    v407ScatteringAtmosphereArtifactSha256: typeof KERR_SCATTERING_V407_ARTIFACT_SHA256_V408;
    v408PythonOracleEvidenceSha256: typeof KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408;
    v408PortableOracleArtifactSha256: typeof KERR_SCATTERING_ORACLE_ARTIFACT_SHA256_V408;
    denseAggregateSha256: null;
  }>;
  model: Readonly<{
    correction: "replace-v407-closed-form-fraction-with-v408-discrete-ordinates-four-ray-reference";
    propagation: "vacuum-geometric-optics-preserve-v407-intensity-redshift-and-evpa";
    stokesReconstruction: "Q=I*p*cos(2*EVPA),U=I*p*sin(2*EVPA)";
    uncertaintyCombination: "linear-no-rss-no-independence-claim";
    interpolationApplied: false;
    exactHFunctionTableAuthority: false;
    endpointMuZeroOrOneQualified: false;
    denseImageAuthority: false;
  }>;
  counts: Readonly<{
    diskRayCount: 4;
    frequencyCount: 3;
    transportMethodCount: 2;
    stokesSampleCount: 24;
    pathComparisonCount: 12;
    curveSampleCountConsumedByPayload: 0;
  }>;
  samples: readonly KerrScatteringCorrectedSampleV409[];
  pathComparisons: readonly KerrScatteringCorrectedPathComparisonV409[];
  maxima: Readonly<{
    correctionFactor: number;
    numericalPolarizationFractionAbsolute: number;
    observedLinearFractionAbsolute: number;
    emittedLinearFractionAbsolute: number;
    scaledOriginalQuRelative: number;
    intensityDifferenceFromV407: 0;
    evpaReconstructionDeg: number;
    pathEvpaDifferenceDeg: number;
    normalizedStokesQuDifference: number;
    deterministicReplayDifference: 0;
  }>;
  thresholds: Readonly<{
    stokesReconstruction: 1e-12;
    intensityPreservation: 1e-15;
    evpaReconstructionDeg: 1e-9;
    pathEvpaReleaseDeg: 0.5;
    normalizedStokesQuDifference: 1e-10;
  }>;
  gates: Readonly<Record<string, true>>;
  release: Readonly<{
    formalProductPointer: "v263";
    formalProductPointerAdvanced: false;
    defaultKernel: "legacy-eih-1pn";
    workerPhysicsMutation: "not-applied";
    localShadowDefaultApplied: false;
  }>;
  networkAttempted: false;
  automaticRetryApplied: false;
  denseShardExecuted: false;
  boundary: "four-ray-24-sample-corrected-science-payload-not-181-point-dense-image-or-exact-h-table";
}>;

export type KerrScatteringCorrectedArtifactV409 = Readonly<{
  version: typeof KERR_SCATTERING_CORRECTED_ARTIFACT_VERSION_V409;
  generatedAt: string;
  view: KerrScatteringCorrectedViewV409;
  deterministicReplay: true;
  v407HistoricalArtifactMutated: false;
  networkAttemptedByBuild: false;
  denseShardExecuted: false;
  artifactSha256: string;
}>;

export type KerrScatteringCorrectedRaySummaryV409 = Readonly<{
  rayId: RayIdV409;
  spinA: number;
  muEmission: number;
  v407Approximation: number;
  v408DiscreteOrdinates: number;
  multiplicativeCorrection: number;
  relativeApproximationError: number;
  numericalUncertaintyAbsolute: number;
}>;

export type KerrScatteringCorrectedSummaryV409 = Readonly<{
  version: typeof KERR_SCATTERING_CORRECTED_SUMMARY_VERSION_V409;
  status: KerrScatteringCorrectedViewV409["status"];
  artifactSha256: string;
  authority: KerrScatteringCorrectedViewV409["authority"];
  model: Pick<KerrScatteringCorrectedViewV409["model"], "correction" | "propagation" | "uncertaintyCombination" | "interpolationApplied" | "exactHFunctionTableAuthority" | "denseImageAuthority">;
  counts: KerrScatteringCorrectedViewV409["counts"];
  rayCorrections: readonly KerrScatteringCorrectedRaySummaryV409[];
  maxima: KerrScatteringCorrectedViewV409["maxima"];
  fullArtifactAvailable: true;
  browserQualification: "not-run";
  boundary: "summary-only-no-24-sample-or-path-comparison-arrays-in-react-state";
}>;

export type KerrScatteringCorrectedResponseV409 = Readonly<{
  version: typeof KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrScatteringCorrectedSummaryV409 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const finite = (...values: number[]) => values.every(Number.isFinite);
const record = (value: unknown, label: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v409-${label}`);
  return value as Record<string, unknown>;
};

export function parseKerrScatteringCorrectedViewV409(value: unknown): KerrScatteringCorrectedViewV409 {
  const source = record(value, "view");
  const authority = record(source.authority, "authority");
  const model = record(source.model, "model");
  const counts = record(source.counts, "counts");
  const maxima = record(source.maxima, "maxima");
  const thresholds = record(source.thresholds, "thresholds");
  const gates = record(source.gates, "gates");
  const release = record(source.release, "release");
  const samples = source.samples;
  const comparisons = source.pathComparisons;
  const invalidSamples = !Array.isArray(samples) || samples.length !== 24 || samples.some((entry) => {
    const sample = record(entry, "sample");
    const fractions = record(sample.sourceFractions, "source-fractions");
    const emitted = record(sample.emittedStokes, "emitted-stokes");
    const observed = record(sample.observedStokes, "observed-stokes");
    const uncertainty = record(sample.numericalUncertainty, "numerical-uncertainty");
    const residuals = record(sample.residuals, "residuals");
    return !finite(Number(sample.spinA), Number(sample.muEmission), Number(sample.observedFrequencyHz), Number(sample.emittedFrequencyHz), Number(sample.redshiftFactor), Number(sample.evpaDeg), Number(fractions.v407Approximation), Number(fractions.v408DiscreteOrdinates), Number(fractions.multiplicativeCorrection), Number(fractions.relativeApproximationError), Number(emitted.i), Number(emitted.q), Number(emitted.linearAmplitude), Number(emitted.linearFraction), Number(observed.i), Number(observed.q), Number(observed.u), Number(observed.linearAmplitude), Number(observed.linearFraction), Number(uncertainty.polarizationFractionAbsolute), Number(uncertainty.polarizationFractionRelative), Number(residuals.observedLinearFractionAbsolute), Number(residuals.emittedLinearFractionAbsolute), Number(residuals.scaledOriginalQuRelative), Number(residuals.evpaReconstructionDeg)) ||
      Number(fractions.multiplicativeCorrection) <= 1 || Number(fractions.v408DiscreteOrdinates) <= Number(fractions.v407Approximation) ||
      uncertainty.combination !== "linear-no-rss-no-independence-claim" || residuals.intensityDifferenceFromV407 !== 0;
  });
  const invalidComparisons = !Array.isArray(comparisons) || comparisons.length !== 12 || comparisons.some((entry) => {
    const comparison = record(entry, "path-comparison");
    return !finite(Number(comparison.observedFrequencyHz), Number(comparison.evpaDifferenceDeg), Number(comparison.normalizedStokesQuDifference));
  });
  if (
    source.version !== KERR_SCATTERING_CORRECTED_VERSION_V409 ||
    source.status !== "qualified-v408-error-envelope-applied-to-24-sparse-stokes-samples" ||
    authority.v407ScatteringAtmosphereArtifactSha256 !== KERR_SCATTERING_V407_ARTIFACT_SHA256_V408 ||
    authority.v408PythonOracleEvidenceSha256 !== KERR_SCATTERING_ORACLE_PYTHON_SHA256_V408 ||
    authority.v408PortableOracleArtifactSha256 !== KERR_SCATTERING_ORACLE_ARTIFACT_SHA256_V408 || authority.denseAggregateSha256 !== null ||
    model.correction !== "replace-v407-closed-form-fraction-with-v408-discrete-ordinates-four-ray-reference" ||
    model.propagation !== "vacuum-geometric-optics-preserve-v407-intensity-redshift-and-evpa" ||
    model.interpolationApplied !== false || model.exactHFunctionTableAuthority !== false || model.endpointMuZeroOrOneQualified !== false || model.denseImageAuthority !== false ||
    counts.diskRayCount !== 4 || counts.frequencyCount !== 3 || counts.transportMethodCount !== 2 || counts.stokesSampleCount !== 24 || counts.pathComparisonCount !== 12 || counts.curveSampleCountConsumedByPayload !== 0 ||
    invalidSamples || invalidComparisons ||
    !finite(Number(maxima.correctionFactor), Number(maxima.numericalPolarizationFractionAbsolute), Number(maxima.observedLinearFractionAbsolute), Number(maxima.emittedLinearFractionAbsolute), Number(maxima.scaledOriginalQuRelative), Number(maxima.evpaReconstructionDeg), Number(maxima.pathEvpaDifferenceDeg), Number(maxima.normalizedStokesQuDifference)) ||
    Number(maxima.observedLinearFractionAbsolute) >= 1e-12 || Number(maxima.emittedLinearFractionAbsolute) >= 1e-12 || Number(maxima.scaledOriginalQuRelative) >= 1e-12 || maxima.intensityDifferenceFromV407 !== 0 || Number(maxima.evpaReconstructionDeg) >= 1e-9 || Number(maxima.pathEvpaDifferenceDeg) >= 0.5 || Number(maxima.normalizedStokesQuDifference) >= 1e-10 || maxima.deterministicReplayDifference !== 0 ||
    thresholds.stokesReconstruction !== 1e-12 || thresholds.intensityPreservation !== 1e-15 ||
    Object.keys(gates).length !== 10 || Object.values(gates).some((gate) => gate !== true) ||
    release.formalProductPointer !== "v263" || release.formalProductPointerAdvanced !== false || release.defaultKernel !== "legacy-eih-1pn" || release.workerPhysicsMutation !== "not-applied" || release.localShadowDefaultApplied !== false ||
    source.networkAttempted !== false || source.automaticRetryApplied !== false || source.denseShardExecuted !== false ||
    source.boundary !== "four-ray-24-sample-corrected-science-payload-not-181-point-dense-image-or-exact-h-table"
  ) throw new Error("v409-corrected-view-identity");
  return value as KerrScatteringCorrectedViewV409;
}

export function parseKerrScatteringCorrectedArtifactV409(value: unknown): KerrScatteringCorrectedArtifactV409 {
  const source = record(value, "artifact");
  if (source.version !== KERR_SCATTERING_CORRECTED_ARTIFACT_VERSION_V409 || typeof source.generatedAt !== "string" || source.deterministicReplay !== true || source.v407HistoricalArtifactMutated !== false || source.networkAttemptedByBuild !== false || source.denseShardExecuted !== false || !SHA.test(String(source.artifactSha256 ?? ""))) throw new Error("v409-corrected-artifact-identity");
  parseKerrScatteringCorrectedViewV409(source.view);
  return value as KerrScatteringCorrectedArtifactV409;
}

export function createKerrScatteringCorrectedSummaryV409(artifactValue: unknown): KerrScatteringCorrectedSummaryV409 {
  const artifact = parseKerrScatteringCorrectedArtifactV409(artifactValue);
  const rayCorrections = (["disk-00", "disk-01", "disk-02", "disk-03"] as const).map((rayId) => {
    const sample = artifact.view.samples.find((entry) => entry.rayId === rayId);
    if (!sample) throw new Error(`v409-summary-ray-${rayId}`);
    return Object.freeze({
      rayId,
      spinA: sample.spinA,
      muEmission: sample.muEmission,
      v407Approximation: sample.sourceFractions.v407Approximation,
      v408DiscreteOrdinates: sample.sourceFractions.v408DiscreteOrdinates,
      multiplicativeCorrection: sample.sourceFractions.multiplicativeCorrection,
      relativeApproximationError: sample.sourceFractions.relativeApproximationError,
      numericalUncertaintyAbsolute: sample.numericalUncertainty.polarizationFractionAbsolute,
    });
  });
  return Object.freeze({
    version: KERR_SCATTERING_CORRECTED_SUMMARY_VERSION_V409,
    status: artifact.view.status,
    artifactSha256: artifact.artifactSha256,
    authority: artifact.view.authority,
    model: Object.freeze({ correction: artifact.view.model.correction, propagation: artifact.view.model.propagation, uncertaintyCombination: artifact.view.model.uncertaintyCombination, interpolationApplied: artifact.view.model.interpolationApplied, exactHFunctionTableAuthority: artifact.view.model.exactHFunctionTableAuthority, denseImageAuthority: artifact.view.model.denseImageAuthority }),
    counts: artifact.view.counts,
    rayCorrections: Object.freeze(rayCorrections),
    maxima: artifact.view.maxima,
    fullArtifactAvailable: true as const,
    browserQualification: "not-run" as const,
    boundary: "summary-only-no-24-sample-or-path-comparison-arrays-in-react-state" as const,
  });
}

export function parseKerrScatteringCorrectedSummaryV409(value: unknown): KerrScatteringCorrectedSummaryV409 {
  const source = record(value, "summary");
  const model = record(source.model, "summary-model");
  const counts = record(source.counts, "summary-counts");
  if (source.version !== KERR_SCATTERING_CORRECTED_SUMMARY_VERSION_V409 || source.status !== "qualified-v408-error-envelope-applied-to-24-sparse-stokes-samples" || !SHA.test(String(source.artifactSha256 ?? "")) || !Array.isArray(source.rayCorrections) || source.rayCorrections.length !== 4 || model.interpolationApplied !== false || model.exactHFunctionTableAuthority !== false || model.denseImageAuthority !== false || counts.stokesSampleCount !== 24 || source.fullArtifactAvailable !== true || source.browserQualification !== "not-run" || source.boundary !== "summary-only-no-24-sample-or-path-comparison-arrays-in-react-state" || Object.hasOwn(source, "samples") || Object.hasOwn(source, "pathComparisons")) throw new Error("v409-corrected-summary-identity");
  return value as KerrScatteringCorrectedSummaryV409;
}

export function parseKerrScatteringCorrectedResponseV409(value: unknown): KerrScatteringCorrectedResponseV409 {
  const source = record(value, "response");
  if (source.version !== KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409) throw new Error("v409-corrected-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) return { version: KERR_SCATTERING_CORRECTED_RESPONSE_VERSION_V409, available: true, reason: "ready", summary: parseKerrScatteringCorrectedSummaryV409(source.summary) };
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(String(source.reason))) return source as KerrScatteringCorrectedResponseV409;
  throw new Error("v409-corrected-response-identity");
}
