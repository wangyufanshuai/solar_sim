import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312 } from "./kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313, parseKerrPolarizationRequalificationV313 } from "./kerrAuthorityV313";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314, KERR_FULL_SHORT_AUTHORITY_SHA256_V314 } from "./kerrCampaignV314";
import { parseKerrThinDiskSpectralViewV319, type KerrThinDiskSpectralViewV319 } from "./kerrThinDiskSpectralV319";

export const KERR_STOKES_TRANSFER_VERSION_V406 = "v406-kerr-sparse-stokes-transfer-v1" as const;
export const KERR_STOKES_TRANSFER_ARTIFACT_VERSION_V406 = "v406-kerr-sparse-stokes-transfer-artifact-v1" as const;
export const KERR_THIN_DISK_SPECTRUM_ARTIFACT_SHA256_V319 = "2ac07e869b609dcb086906508bbd4e23ef1756caefd4e503a4d428021d62cf45" as const;
export const KERR_STOKES_OBSERVED_FREQUENCIES_HZ_V406 = Object.freeze([1e16, 1e17, 1e18] as const);

type ToleranceClassV406 = "release" | "internal";
type TransportMethodV406 = "walker-penrose" | "independent-ks-parallel-transport";
type PolarizationExecutionV406 = Readonly<{
  rayId: string;
  spin: number;
  toleranceClass: ToleranceClassV406;
  branch: "A" | "B";
  walkerPenroseEvpaDeg: number;
  parallelTransportEvpaDeg: number;
  evpaDifferenceDeg: number;
  applicability: "applicable-disk-hit";
  passed: true;
}>;

export type KerrStokesTransferSampleV406 = Readonly<{
  rayId: "disk-00" | "disk-01" | "disk-02" | "disk-03";
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  observedFrequencyHz: 1e16 | 1e17 | 1e18;
  emittedFrequencyHz: number;
  redshiftFactor: number;
  transportMethod: TransportMethodV406;
  evpaDeg: number;
  emittedStokes: Readonly<{ i: number; q: number; u: 0; linearAmplitude: number; linearFraction: 0.12 }>;
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

export type KerrStokesPathComparisonV406 = Readonly<{
  rayId: KerrStokesTransferSampleV406["rayId"];
  observedFrequencyHz: KerrStokesTransferSampleV406["observedFrequencyHz"];
  evpaDifferenceDeg: number;
  normalizedStokesQuDifference: number;
}>;

export type KerrStokesTransferViewV406 = Readonly<{
  version: typeof KERR_STOKES_TRANSFER_VERSION_V406;
  status: "qualified-sparse-derived-stokes-transfer";
  authority: Readonly<{
    fullShortAuthoritySha256: typeof KERR_FULL_SHORT_AUTHORITY_SHA256_V314;
    geometryEvidenceSha256: typeof KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312;
    polarizationEvidenceSha256: typeof KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313;
    rayPlanSha256: typeof KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314;
    v319SpectrumArtifactSha256: typeof KERR_THIN_DISK_SPECTRUM_ARTIFACT_SHA256_V319;
    denseAggregateSha256: null;
  }>;
  model: Readonly<{
    emittedLinearPolarizationFraction: 0.12;
    emittedReferenceEvpaDeg: 0;
    emittedBasis: "projected-disk-normal";
    propagation: "vacuum-geometric-optics-no-emission-absorption-scattering-after-disk";
    circularPolarization: "unavailable-not-modeled";
    faradayRotation: "unavailable-not-modeled";
  }>;
  counts: Readonly<{
    canonicalRayCount: 16;
    diskRayCount: 4;
    unavailableCaptureEscapeRayCount: 12;
    frequencyCount: 3;
    transportMethodCount: 2;
    stokesSampleCount: 24;
    pathComparisonCount: 12;
    sourcePolarizationExecutionCount: 16;
  }>;
  samples: readonly KerrStokesTransferSampleV406[];
  pathComparisons: readonly KerrStokesPathComparisonV406[];
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
    invariantRelative: 1e-12;
    linearFractionAbsolute: 1e-12;
    inverseRotationRelative: 1e-12;
    normalizedStokesQuDifference: 1e-10;
    releaseEvpaDifferenceDeg: 0.5;
    internalEvpaDifferenceDeg: 0.1;
  }>;
  units: Readonly<{ frequency: "Hz"; spectralStokes: "W m^-2 sr^-1 Hz^-1"; evpa: "deg modulo 180" }>;
  uncertaintyCombination: "componentwise-no-rss-no-scalar-total";
  displayBoundary: "science-linear-immutable-stokes-cinematic-must-not-mutate";
  boundary: "four-authority-disk-rays-three-bands-derived-stokes-not-dense-image";
}>;

export type KerrStokesTransferArtifactV406 = Readonly<{
  version: typeof KERR_STOKES_TRANSFER_ARTIFACT_VERSION_V406;
  generatedAt: string;
  sourceFiles: Readonly<{ geometry: string; polarization: string; rayPlan: string; v319Spectrum: string }>;
  view: KerrStokesTransferViewV406;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  boundary: "immutable-derived-sparse-stokes-no-dense-or-product-promotion";
  artifactSha256: string;
}>;

export const KERR_STOKES_TRANSFER_SUMMARY_VERSION_V406 = "v406-kerr-stokes-transfer-summary-v1" as const;
export const KERR_STOKES_TRANSFER_RESPONSE_VERSION_V406 = "v406-kerr-stokes-transfer-response-v1" as const;
export type KerrStokesTransferSummaryV406 = Readonly<{
  version: typeof KERR_STOKES_TRANSFER_SUMMARY_VERSION_V406;
  status: "qualified-sparse-derived-stokes-transfer";
  artifactSha256: string;
  authority: KerrStokesTransferViewV406["authority"];
  model: KerrStokesTransferViewV406["model"];
  counts: KerrStokesTransferViewV406["counts"];
  maxima: KerrStokesTransferViewV406["maxima"];
  observedFrequenciesHz: typeof KERR_STOKES_OBSERVED_FREQUENCIES_HZ_V406;
  referenceBandHz: 1e17;
  referenceRays: readonly Readonly<{
    rayId: KerrStokesTransferSampleV406["rayId"];
    spinA: number;
    walkerPenrose: Readonly<{ i: number; q: number; u: number; evpaDeg: number }>;
    parallelTransport: Readonly<{ i: number; q: number; u: number; evpaDeg: number }>;
    evpaDifferenceDeg: number;
    normalizedStokesQuDifference: number;
  }>[];
  fullArtifactAvailable: true;
  denseAggregateAvailable: false;
  browserQualification: "not-run";
  boundary: "summary-only-no-full-sample-array-in-react-state";
}>;
export type KerrStokesTransferResponseV406 = Readonly<{
  version: typeof KERR_STOKES_TRANSFER_RESPONSE_VERSION_V406;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrStokesTransferSummaryV406 | null;
}>;

type RawPolarizationAuthorityV406 = Readonly<{ payloads?: readonly PolarizationExecutionV406[] }>;
const relativeDifference = (first: number, second: number) => Math.abs(first - second) / Math.max(1e-300, Math.abs(first), Math.abs(second));
const evpaDistance = (first: number, second: number) => { const delta = Math.abs(first - second) % 180; return Math.min(delta, 180 - delta); };
const invariant = (stokes: number, frequencyHz: number) => stokes / frequencyHz ** 3;
const finite = (...values: number[]) => values.every(Number.isFinite);

function extractPolarizationExecutions(value: unknown): readonly PolarizationExecutionV406[] {
  parseKerrPolarizationRequalificationV313(value);
  const payloads = (value as RawPolarizationAuthorityV406).payloads;
  if (!Array.isArray(payloads) || payloads.length !== 16) throw new Error("v406-polarization-payload-count");
  for (const execution of payloads) {
    if (!/^disk-0[0-3]$/.test(execution.rayId) || !["release", "internal"].includes(execution.toleranceClass)
      || !["A", "B"].includes(execution.branch) || execution.applicability !== "applicable-disk-hit" || execution.passed !== true
      || !finite(execution.spin, execution.walkerPenroseEvpaDeg, execution.parallelTransportEvpaDeg, execution.evpaDifferenceDeg)) {
      throw new Error("v406-polarization-payload-identity");
    }
  }
  return payloads;
}

function createSample(
  rayId: KerrStokesTransferSampleV406["rayId"],
  rayIndex: KerrStokesTransferSampleV406["rayIndex"],
  spectrum: KerrThinDiskSpectralViewV319,
  evpaDeg: number,
  transportMethod: TransportMethodV406,
): KerrStokesTransferSampleV406 {
  const source = spectrum.samples[rayIndex];
  if (!source.applicable || source.classification !== "disk-hit" || source.emittedSpectralRadiance === null
    || source.observedSpectralRadiance === null || source.emittedFrequencyHz === null || source.redshiftFactor === null
    || source.errorBudget.diskQuadratureRelative === null || source.errorBudget.formulaSpectralRelative === null
    || source.errorBudget.geometryRadiusDifferenceM === null || source.errorBudget.geometryRedshiftDifference === null) {
    throw new Error("v406-spectrum-disk-source");
  }
  const emittedI = source.emittedSpectralRadiance;
  const observedI = source.observedSpectralRadiance;
  const emittedL = emittedI * 0.12;
  const observedL = observedI * 0.12;
  const angle = evpaDeg * Math.PI / 180;
  const cos2 = Math.cos(2 * angle);
  const sin2 = Math.sin(2 * angle);
  const observedQ = observedL * cos2;
  const observedU = observedL * sin2;
  const recoveredQ = observedQ * cos2 + observedU * sin2;
  const recoveredU = -observedQ * sin2 + observedU * cos2;
  const observedNorm = Math.hypot(observedQ, observedU);
  const intensityInvariantRelative = relativeDifference(invariant(emittedI, source.emittedFrequencyHz), invariant(observedI, spectrum.scenario.observedFrequencyHz));
  const linearAmplitudeInvariantRelative = relativeDifference(invariant(emittedL, source.emittedFrequencyHz), invariant(observedNorm, spectrum.scenario.observedFrequencyHz));
  const linearFractionAbsolute = Math.abs(observedNorm / observedI - 0.12);
  const inverseRotationRelative = Math.hypot(recoveredQ - observedL, recoveredU) / Math.max(1e-300, observedL);
  const rotationNormRelative = relativeDifference(observedNorm, observedL);
  if (!finite(observedQ, observedU, intensityInvariantRelative, linearAmplitudeInvariantRelative, linearFractionAbsolute, inverseRotationRelative, rotationNormRelative)) throw new Error("v406-stokes-non-finite");
  return Object.freeze({
    rayId, rayIndex, spinA: source.spinA, observedFrequencyHz: spectrum.scenario.observedFrequencyHz as 1e16 | 1e17 | 1e18,
    emittedFrequencyHz: source.emittedFrequencyHz, redshiftFactor: source.redshiftFactor, transportMethod, evpaDeg,
    emittedStokes: Object.freeze({ i: emittedI, q: emittedL, u: 0 as const, linearAmplitude: emittedL, linearFraction: 0.12 as const }),
    observedStokes: Object.freeze({ i: observedI, q: observedQ, u: observedU, linearAmplitude: observedNorm, linearFraction: observedNorm / observedI }),
    residuals: Object.freeze({ intensityInvariantRelative, linearAmplitudeInvariantRelative, linearFractionAbsolute, inverseRotationRelative, rotationNormRelative }),
    sourceUncertainty: Object.freeze({ diskQuadratureRelative: source.errorBudget.diskQuadratureRelative, formulaSpectralRelative: source.errorBudget.formulaSpectralRelative, geometryRadiusDifferenceM: source.errorBudget.geometryRadiusDifferenceM, geometryRedshiftDifference: source.errorBudget.geometryRedshiftDifference }),
  });
}

export function createKerrStokesTransferViewV406(
  spectra: readonly KerrThinDiskSpectralViewV319[],
  polarizationAuthority: unknown,
): KerrStokesTransferViewV406 {
  if (spectra.length !== 3) throw new Error("v406-spectrum-count");
  const parsedSpectra = spectra.map(parseKerrThinDiskSpectralViewV319);
  parsedSpectra.forEach((spectrum, index) => {
    if (spectrum.scenario.observedFrequencyHz !== KERR_STOKES_OBSERVED_FREQUENCIES_HZ_V406[index]
      || spectrum.authority.denseAggregateSha256 !== null || spectrum.counts.applicableDiskRayCount !== 4) throw new Error("v406-spectrum-authority-boundary");
  });
  const executions = extractPolarizationExecutions(polarizationAuthority);
  const rayIds = ["disk-00", "disk-01", "disk-02", "disk-03"] as const;
  let abCanonicalDifference = 0;
  for (const rayId of rayIds) for (const toleranceClass of ["release", "internal"] as const) {
    const branches = executions.filter((entry) => entry.rayId === rayId && entry.toleranceClass === toleranceClass);
    if (branches.length !== 2 || branches[0].branch === branches[1].branch) throw new Error("v406-polarization-ab-pair");
    abCanonicalDifference = Math.max(abCanonicalDifference,
      Math.abs(branches[0].walkerPenroseEvpaDeg - branches[1].walkerPenroseEvpaDeg),
      Math.abs(branches[0].parallelTransportEvpaDeg - branches[1].parallelTransportEvpaDeg));
  }
  const samples: KerrStokesTransferSampleV406[] = [];
  const pathComparisons: KerrStokesPathComparisonV406[] = [];
  let maxReleaseEvpa = 0; let maxInternalEvpa = 0;
  for (const execution of executions) {
    if (execution.toleranceClass === "release") maxReleaseEvpa = Math.max(maxReleaseEvpa, execution.evpaDifferenceDeg);
    else maxInternalEvpa = Math.max(maxInternalEvpa, execution.evpaDifferenceDeg);
  }
  rayIds.forEach((rayId, offset) => {
    const execution = executions.find((entry) => entry.rayId === rayId && entry.toleranceClass === "release" && entry.branch === "A");
    if (!execution) throw new Error("v406-polarization-release-source");
    const rayIndex = (12 + offset) as 12 | 13 | 14 | 15;
    parsedSpectra.forEach((spectrum) => {
      const wp = createSample(rayId, rayIndex, spectrum, execution.walkerPenroseEvpaDeg, "walker-penrose");
      const pt = createSample(rayId, rayIndex, spectrum, execution.parallelTransportEvpaDeg, "independent-ks-parallel-transport");
      samples.push(wp, pt);
      pathComparisons.push(Object.freeze({ rayId, observedFrequencyHz: wp.observedFrequencyHz, evpaDifferenceDeg: evpaDistance(wp.evpaDeg, pt.evpaDeg), normalizedStokesQuDifference: Math.hypot(wp.observedStokes.q - pt.observedStokes.q, wp.observedStokes.u - pt.observedStokes.u) / Math.max(1e-300, wp.observedStokes.linearAmplitude) }));
    });
  });
  const maxima = Object.freeze({
    intensityInvariantRelative: Math.max(...samples.map((sample) => sample.residuals.intensityInvariantRelative)),
    linearAmplitudeInvariantRelative: Math.max(...samples.map((sample) => sample.residuals.linearAmplitudeInvariantRelative)),
    linearFractionAbsolute: Math.max(...samples.map((sample) => sample.residuals.linearFractionAbsolute)),
    inverseRotationRelative: Math.max(...samples.map((sample) => sample.residuals.inverseRotationRelative)),
    rotationNormRelative: Math.max(...samples.map((sample) => sample.residuals.rotationNormRelative)),
    releaseEvpaDifferenceDeg: maxReleaseEvpa,
    internalEvpaDifferenceDeg: maxInternalEvpa,
    normalizedStokesQuDifference: Math.max(...pathComparisons.map((entry) => entry.normalizedStokesQuDifference)),
    abCanonicalDifference: abCanonicalDifference as 0,
  });
  if (samples.length !== 24 || pathComparisons.length !== 12 || abCanonicalDifference !== 0
    || maxima.intensityInvariantRelative >= 1e-12 || maxima.linearAmplitudeInvariantRelative >= 1e-12
    || maxima.linearFractionAbsolute >= 1e-12 || maxima.inverseRotationRelative >= 1e-12 || maxima.rotationNormRelative >= 1e-12
    || maxima.normalizedStokesQuDifference >= 1e-10 || maxima.releaseEvpaDifferenceDeg >= 0.5 || maxima.internalEvpaDifferenceDeg >= 0.1) {
    throw new Error(`v406-stokes-qualification:${JSON.stringify(maxima)}`);
  }
  return Object.freeze({
    version: KERR_STOKES_TRANSFER_VERSION_V406,
    status: "qualified-sparse-derived-stokes-transfer",
    authority: Object.freeze({ fullShortAuthoritySha256: KERR_FULL_SHORT_AUTHORITY_SHA256_V314, geometryEvidenceSha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312, polarizationEvidenceSha256: KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313, rayPlanSha256: KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314, v319SpectrumArtifactSha256: KERR_THIN_DISK_SPECTRUM_ARTIFACT_SHA256_V319, denseAggregateSha256: null }),
    model: Object.freeze({ emittedLinearPolarizationFraction: 0.12 as const, emittedReferenceEvpaDeg: 0 as const, emittedBasis: "projected-disk-normal" as const, propagation: "vacuum-geometric-optics-no-emission-absorption-scattering-after-disk" as const, circularPolarization: "unavailable-not-modeled" as const, faradayRotation: "unavailable-not-modeled" as const }),
    counts: Object.freeze({ canonicalRayCount: 16 as const, diskRayCount: 4 as const, unavailableCaptureEscapeRayCount: 12 as const, frequencyCount: 3 as const, transportMethodCount: 2 as const, stokesSampleCount: 24 as const, pathComparisonCount: 12 as const, sourcePolarizationExecutionCount: 16 as const }),
    samples: Object.freeze(samples), pathComparisons: Object.freeze(pathComparisons), maxima,
    thresholds: Object.freeze({ invariantRelative: 1e-12 as const, linearFractionAbsolute: 1e-12 as const, inverseRotationRelative: 1e-12 as const, normalizedStokesQuDifference: 1e-10 as const, releaseEvpaDifferenceDeg: 0.5 as const, internalEvpaDifferenceDeg: 0.1 as const }),
    units: Object.freeze({ frequency: "Hz" as const, spectralStokes: "W m^-2 sr^-1 Hz^-1" as const, evpa: "deg modulo 180" as const }),
    uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
    displayBoundary: "science-linear-immutable-stokes-cinematic-must-not-mutate",
    boundary: "four-authority-disk-rays-three-bands-derived-stokes-not-dense-image",
  });
}

export function parseKerrStokesTransferViewV406(value: unknown): KerrStokesTransferViewV406 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrStokesTransferViewV406> : null;
  if (!source || source.version !== KERR_STOKES_TRANSFER_VERSION_V406 || source.status !== "qualified-sparse-derived-stokes-transfer"
    || source.authority?.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314 || source.authority.geometryEvidenceSha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || source.authority.polarizationEvidenceSha256 !== KERR_POLARIZATION_AUTHORITY_EVIDENCE_SHA256_V313 || source.authority.rayPlanSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314
    || source.authority.v319SpectrumArtifactSha256 !== KERR_THIN_DISK_SPECTRUM_ARTIFACT_SHA256_V319 || source.authority.denseAggregateSha256 !== null
    || source.model?.emittedLinearPolarizationFraction !== 0.12 || source.model.circularPolarization !== "unavailable-not-modeled" || source.model.faradayRotation !== "unavailable-not-modeled"
    || source.counts?.canonicalRayCount !== 16 || source.counts.diskRayCount !== 4 || source.counts.unavailableCaptureEscapeRayCount !== 12 || source.counts.frequencyCount !== 3 || source.counts.transportMethodCount !== 2 || source.counts.stokesSampleCount !== 24 || source.counts.pathComparisonCount !== 12 || source.counts.sourcePolarizationExecutionCount !== 16
    || !Array.isArray(source.samples) || source.samples.length !== 24 || !Array.isArray(source.pathComparisons) || source.pathComparisons.length !== 12
    || !source.maxima || source.maxima.intensityInvariantRelative >= 1e-12 || source.maxima.linearAmplitudeInvariantRelative >= 1e-12 || source.maxima.linearFractionAbsolute >= 1e-12 || source.maxima.inverseRotationRelative >= 1e-12 || source.maxima.rotationNormRelative >= 1e-12 || source.maxima.normalizedStokesQuDifference >= 1e-10 || source.maxima.releaseEvpaDifferenceDeg >= 0.5 || source.maxima.internalEvpaDifferenceDeg >= 0.1 || source.maxima.abCanonicalDifference !== 0
    || source.uncertaintyCombination !== "componentwise-no-rss-no-scalar-total" || source.displayBoundary !== "science-linear-immutable-stokes-cinematic-must-not-mutate" || source.boundary !== "four-authority-disk-rays-three-bands-derived-stokes-not-dense-image") throw new Error("v406-stokes-view-identity");
  return value as KerrStokesTransferViewV406;
}

export function parseKerrStokesTransferArtifactV406(value: unknown): KerrStokesTransferArtifactV406 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrStokesTransferArtifactV406> : null;
  if (!source || source.version !== KERR_STOKES_TRANSFER_ARTIFACT_VERSION_V406 || !source.sourceFiles || !Object.values(source.sourceFiles).every((entry) => /^[a-f0-9]{64}$/.test(entry)) || !source.view || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.boundary !== "immutable-derived-sparse-stokes-no-dense-or-product-promotion" || !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "")) throw new Error("v406-stokes-artifact-identity");
  parseKerrStokesTransferViewV406(source.view);
  return value as KerrStokesTransferArtifactV406;
}

export function createKerrStokesTransferSummaryV406(artifactValue: unknown): KerrStokesTransferSummaryV406 {
  const artifact = parseKerrStokesTransferArtifactV406(artifactValue);
  const referenceRays = (["disk-00", "disk-01", "disk-02", "disk-03"] as const).map((rayId) => {
    const wp = artifact.view.samples.find((sample) => sample.rayId === rayId && sample.observedFrequencyHz === 1e17 && sample.transportMethod === "walker-penrose");
    const pt = artifact.view.samples.find((sample) => sample.rayId === rayId && sample.observedFrequencyHz === 1e17 && sample.transportMethod === "independent-ks-parallel-transport");
    const comparison = artifact.view.pathComparisons.find((entry) => entry.rayId === rayId && entry.observedFrequencyHz === 1e17);
    if (!wp || !pt || !comparison) throw new Error("v406-stokes-summary-reference-ray");
    return Object.freeze({ rayId, spinA: wp.spinA, walkerPenrose: Object.freeze({ i: wp.observedStokes.i, q: wp.observedStokes.q, u: wp.observedStokes.u, evpaDeg: wp.evpaDeg }), parallelTransport: Object.freeze({ i: pt.observedStokes.i, q: pt.observedStokes.q, u: pt.observedStokes.u, evpaDeg: pt.evpaDeg }), evpaDifferenceDeg: comparison.evpaDifferenceDeg, normalizedStokesQuDifference: comparison.normalizedStokesQuDifference });
  });
  return Object.freeze({ version: KERR_STOKES_TRANSFER_SUMMARY_VERSION_V406, status: artifact.view.status, artifactSha256: artifact.artifactSha256, authority: artifact.view.authority, model: artifact.view.model, counts: artifact.view.counts, maxima: artifact.view.maxima, observedFrequenciesHz: KERR_STOKES_OBSERVED_FREQUENCIES_HZ_V406, referenceBandHz: 1e17 as const, referenceRays: Object.freeze(referenceRays), fullArtifactAvailable: true as const, denseAggregateAvailable: false as const, browserQualification: "not-run" as const, boundary: "summary-only-no-full-sample-array-in-react-state" as const });
}

export function parseKerrStokesTransferSummaryV406(value: unknown): KerrStokesTransferSummaryV406 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrStokesTransferSummaryV406> : null;
  if (!source || source.version !== KERR_STOKES_TRANSFER_SUMMARY_VERSION_V406 || source.status !== "qualified-sparse-derived-stokes-transfer" || !/^[a-f0-9]{64}$/.test(source.artifactSha256 ?? "") || source.counts?.stokesSampleCount !== 24 || source.counts.pathComparisonCount !== 12 || !Array.isArray(source.observedFrequenciesHz) || source.observedFrequenciesHz.join(",") !== "10000000000000000,100000000000000000,1000000000000000000" || source.referenceBandHz !== 1e17 || !Array.isArray(source.referenceRays) || source.referenceRays.length !== 4 || source.referenceRays.some((ray) => !finite(ray.spinA, ray.walkerPenrose.i, ray.walkerPenrose.q, ray.walkerPenrose.u, ray.walkerPenrose.evpaDeg, ray.parallelTransport.i, ray.parallelTransport.q, ray.parallelTransport.u, ray.parallelTransport.evpaDeg, ray.evpaDifferenceDeg, ray.normalizedStokesQuDifference)) || source.fullArtifactAvailable !== true || source.denseAggregateAvailable !== false || source.browserQualification !== "not-run" || source.boundary !== "summary-only-no-full-sample-array-in-react-state") throw new Error("v406-stokes-summary-identity");
  return value as KerrStokesTransferSummaryV406;
}

export function parseKerrStokesTransferResponseV406(value: unknown): KerrStokesTransferResponseV406 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrStokesTransferResponseV406> : null;
  if (!source || source.version !== KERR_STOKES_TRANSFER_RESPONSE_VERSION_V406) throw new Error("v406-stokes-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) return { version: KERR_STOKES_TRANSFER_RESPONSE_VERSION_V406, available: true, reason: "ready", summary: parseKerrStokesTransferSummaryV406(source.summary) };
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrStokesTransferResponseV406;
  throw new Error("v406-stokes-response-identity");
}
