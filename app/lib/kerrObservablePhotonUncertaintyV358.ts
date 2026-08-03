import type { KerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";
import type { KerrSpectralCorrelationResponseArtifactV354 } from "./kerrSpectralCorrelationResponseV354";

export const KERR_OBSERVABLE_PHOTON_UNCERTAINTY_VERSION_V358 =
  "v358-kerr-observable-photon-uncertainty-audit-v1" as const;

export type KerrObservablePhotonRayV358 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  nominalExpectedPhotonsByBand: Readonly<{ visible: number; euv: number; "soft-x-ray": number }>;
  relativeCovariance: readonly (readonly number[])[];
  absoluteCovariance: readonly (readonly number[])[];
  relativeSigmaByBand: Readonly<{ visible: number; euv: number; "soft-x-ray": number }>;
  absoluteSigmaByBand: Readonly<{ visible: number; euv: number; "soft-x-ray": number }>;
  totalExpectedPhotons: number;
  totalSigma: number;
  totalBoundsBySigma: Readonly<{ sigma1: readonly [number, number]; sigma2: readonly [number, number]; sigma3: readonly [number, number] }>;
  operatorMaximumRelativeDifference: number;
  provenance: Readonly<{ spectralCorrelationArtifactSha256: string; instrumentArtifactSha256: string; fullShortAuthoritySha256: string }>;
}>;

export type KerrObservablePhotonUncertaintyArtifactV358 = Readonly<{
  version: typeof KERR_OBSERVABLE_PHOTON_UNCERTAINTY_VERSION_V358;
  generatedAt: string;
  status: "qualified-synthetic-observable-photon-uncertainty-propagation";
  source: Readonly<{ spectralCorrelationPath: "dist/science/kerr-spectral-correlation-response-v354/audit.json"; spectralCorrelationFileSha256: string; spectralCorrelationArtifactSha256: string; instrumentPath: "dist/science/kerr-science-instrument-response-v332/response-reference.json"; instrumentFileSha256: string; instrumentArtifactSha256: string; fullShortAuthoritySha256: string }>;
  counts: Readonly<{ rayCount: 4; bandCount: 3; observableRowCount: 12 }>;
  operator: "expected-photons = throughput-weighted-photon-radiance × collecting-area × pixel-solid-angle × exposure-time";
  propagation: "absolute-covariance = diag(nominal-photons) × relative-covariance × diag(nominal-photons)";
  scaleConvention: "1-2-3-sigma-synthetic-scale-not-measured-counts-coverage";
  rays: readonly KerrObservablePhotonRayV358[];
  maxima: Readonly<{ operatorRelativeDifference: number; relativeCovarianceSymmetryDifference: number; totalVarianceReconstructionRelativeDifference: number; combinedRelativeSigma: number }>;
  measuredDetectorCounts: "unavailable-synthetic-operator-only-not-measured-detector-counts";
  scienceCinematicBoundary: "observable-photon-uncertainty-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const RAYS = Object.freeze([12, 13, 14, 15] as const);
const BANDS = Object.freeze(["visible", "euv", "soft-x-ray"] as const);
const key = (rayIndex: number, bandId: string) => `${rayIndex}:${bandId}`;
const relativeDifference = (left: number, right: number) => Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));

function symmetryDifference(matrix: readonly (readonly number[])[]): number {
  let maximum = 0;
  for (let row = 0; row < matrix.length; row += 1) for (let column = 0; column < matrix.length; column += 1) maximum = Math.max(maximum, Math.abs(matrix[row][column] - matrix[column][row]));
  return maximum;
}

export function createKerrObservablePhotonUncertaintyV358(
  correlation: KerrSpectralCorrelationResponseArtifactV354,
  instrument: KerrScienceInstrumentResponseV332,
  source: KerrObservablePhotonUncertaintyArtifactV358["source"],
  artifactSha256 = "pending",
): KerrObservablePhotonUncertaintyArtifactV358 {
  if (correlation.status !== "qualified-synthetic-correlated-spectral-response-audit" || instrument.status !== "qualified-synthetic-reference-instrument-operator" || correlation.artifactSha256 !== source.spectralCorrelationArtifactSha256 || correlation.denseAggregateSha256 !== null) throw new Error("v358-source-boundary");
  const instrumentRows = new Map(instrument.rows.map((row) => [key(row.rayIndex, row.bandId), row]));
  let maxOperator = 0; let maxSymmetry = 0; let maxTotalVariance = 0; let maxCombinedSigma = 0;
  const rays = correlation.rays.map((correlationRay): KerrObservablePhotonRayV358 => {
    const nominal = BANDS.map((band) => instrumentRows.get(key(correlationRay.rayIndex, band))?.expectedPhotonsPerPixelExposure ?? 0);
    const throughputRows = BANDS.map((band) => instrumentRows.get(key(correlationRay.rayIndex, band)));
    if (throughputRows.some((row) => !row) || nominal.some((value) => !(value > 0))) throw new Error("v358-instrument-row-missing");
    const operators = throughputRows.map((row) => row!.throughputWeightedPhotonRadiancePerSM2Sr * instrument.model.collectingAreaM2 * instrument.model.pixelSolidAngleSr * instrument.model.exposureTimeS);
    const operatorDifference = Math.max(...operators.map((value, index) => relativeDifference(value, nominal[index])));
    const absoluteCovariance = correlationRay.responseRelativeCovariance.map((row, rowIndex) => row.map((value, columnIndex) => value * nominal[rowIndex] * nominal[columnIndex]));
    const totalExpectedPhotons = nominal.reduce((sum, value) => sum + value, 0);
    const totalVariance = absoluteCovariance.reduce((sum, row) => sum + row.reduce((rowSum, value) => rowSum + value, 0), 0);
    if (!(totalVariance > 0) || !Number.isFinite(totalVariance)) throw new Error("v358-total-variance");
    const totalSigma = Math.sqrt(totalVariance);
    const relativeSigma = [0, 1, 2].map((index) => Math.sqrt(Math.max(0, correlationRay.responseRelativeCovariance[index][index])));
    const absoluteSigma = [0, 1, 2].map((index) => Math.sqrt(Math.max(0, absoluteCovariance[index][index])));
    const totalBoundsBySigma = { sigma1: [Math.max(0, totalExpectedPhotons - totalSigma), totalExpectedPhotons + totalSigma] as const, sigma2: [Math.max(0, totalExpectedPhotons - 2 * totalSigma), totalExpectedPhotons + 2 * totalSigma] as const, sigma3: [Math.max(0, totalExpectedPhotons - 3 * totalSigma), totalExpectedPhotons + 3 * totalSigma] as const };
    const symmetry = symmetryDifference(correlationRay.responseRelativeCovariance);
    const varianceReconstruction = relativeDifference(totalVariance, totalSigma ** 2);
    maxOperator = Math.max(maxOperator, operatorDifference); maxSymmetry = Math.max(maxSymmetry, symmetry); maxTotalVariance = Math.max(maxTotalVariance, varianceReconstruction); maxCombinedSigma = Math.max(maxCombinedSigma, totalSigma / totalExpectedPhotons);
    return Object.freeze({ rayIndex: correlationRay.rayIndex, spinA: correlationRay.spinA, nominalExpectedPhotonsByBand: Object.freeze({ visible: nominal[0], euv: nominal[1], "soft-x-ray": nominal[2] }), relativeCovariance: correlationRay.responseRelativeCovariance, absoluteCovariance: Object.freeze(absoluteCovariance.map((row) => Object.freeze(row))), relativeSigmaByBand: Object.freeze({ visible: relativeSigma[0], euv: relativeSigma[1], "soft-x-ray": relativeSigma[2] }), absoluteSigmaByBand: Object.freeze({ visible: absoluteSigma[0], euv: absoluteSigma[1], "soft-x-ray": absoluteSigma[2] }), totalExpectedPhotons, totalSigma, totalBoundsBySigma: Object.freeze(totalBoundsBySigma), operatorMaximumRelativeDifference: operatorDifference, provenance: Object.freeze({ spectralCorrelationArtifactSha256: source.spectralCorrelationArtifactSha256, instrumentArtifactSha256: source.instrumentArtifactSha256, fullShortAuthoritySha256: source.fullShortAuthoritySha256 }) });
  });
  if (maxOperator > 1e-12 || maxSymmetry > 1e-15 || maxTotalVariance > 1e-12) throw new Error("v358-observable-gate");
  return Object.freeze({ version: KERR_OBSERVABLE_PHOTON_UNCERTAINTY_VERSION_V358, generatedAt: new Date().toISOString(), status: "qualified-synthetic-observable-photon-uncertainty-propagation", source, counts: Object.freeze({ rayCount: 4, bandCount: 3, observableRowCount: 12 } as const), operator: "expected-photons = throughput-weighted-photon-radiance × collecting-area × pixel-solid-angle × exposure-time", propagation: "absolute-covariance = diag(nominal-photons) × relative-covariance × diag(nominal-photons)", scaleConvention: "1-2-3-sigma-synthetic-scale-not-measured-counts-coverage", rays: Object.freeze(rays), maxima: Object.freeze({ operatorRelativeDifference: maxOperator, relativeCovarianceSymmetryDifference: maxSymmetry, totalVarianceReconstructionRelativeDifference: maxTotalVariance, combinedRelativeSigma: maxCombinedSigma }), measuredDetectorCounts: "unavailable-synthetic-operator-only-not-measured-detector-counts", scienceCinematicBoundary: "observable-photon-uncertainty-never-cinematic-color-input", denseCampaignStatus: "incomplete-0-of-49", denseAggregateSha256: null, browserQualification: "not-run", artifactSha256 });
}

export function parseKerrObservablePhotonUncertaintyArtifactV358(value: unknown): KerrObservablePhotonUncertaintyArtifactV358 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrObservablePhotonUncertaintyArtifactV358> : null; const rays = source?.rays ?? [];
  if (!source || source.version !== KERR_OBSERVABLE_PHOTON_UNCERTAINTY_VERSION_V358 || source.status !== "qualified-synthetic-observable-photon-uncertainty-propagation" || !SHA.test(source.source?.spectralCorrelationFileSha256 ?? "") || !SHA.test(source.source?.spectralCorrelationArtifactSha256 ?? "") || !SHA.test(source.source?.instrumentFileSha256 ?? "") || !SHA.test(source.source?.instrumentArtifactSha256 ?? "") || !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") || source.counts?.rayCount !== 4 || source.counts.bandCount !== 3 || source.counts.observableRowCount !== 12 || source.operator !== "expected-photons = throughput-weighted-photon-radiance × collecting-area × pixel-solid-angle × exposure-time" || source.propagation !== "absolute-covariance = diag(nominal-photons) × relative-covariance × diag(nominal-photons)" || source.scaleConvention !== "1-2-3-sigma-synthetic-scale-not-measured-counts-coverage" || rays.length !== 4 || rays.some((ray) => !RAYS.includes(ray.rayIndex) || ray.absoluteCovariance.length !== 3 || ray.absoluteCovariance.some((row) => row.length !== 3 || !row.every(Number.isFinite)) || !(ray.totalExpectedPhotons > 0) || !(ray.totalSigma > 0) || ray.operatorMaximumRelativeDifference > 1e-12 || !SHA.test(ray.provenance.spectralCorrelationArtifactSha256)) || (source.maxima?.operatorRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || source.measuredDetectorCounts !== "unavailable-synthetic-operator-only-not-measured-detector-counts" || source.scienceCinematicBoundary !== "observable-photon-uncertainty-never-cinematic-color-input" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v358-observable-photon-identity");
  return value as KerrObservablePhotonUncertaintyArtifactV358;
}
