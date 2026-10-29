import type { KerrScienceInstrumentResponseV332 } from "./kerrScienceInstrumentResponseV332";
import type { KerrPhotonCountingNoiseBudgetArtifactV359 } from "./kerrPhotonCountingNoiseBudgetV359";

export const KERR_DETECTOR_BREAK_EVEN_VERSION_V360 = "v360-kerr-detector-break-even-audit-v1" as const;

export type KerrDetectorBreakEvenRowV360 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  bandId: "visible" | "euv" | "soft-x-ray";
  exposureTimeS: number;
  nominalExpectedPhotonsPerPixelExposure: number;
  systematicVarianceCountSquared: number;
  idealSourcePoissonVarianceCountSquared: number;
  systematicToSourcePoissonVarianceRatio: number;
  equivalentIndependentVarianceAtParityCountSquared: number;
  equivalentIndependentRmsAtParityCounts: number;
  equivalentIndependentRateAtParityCountsPerSecond: number;
  varianceReconstructionRelativeDifference: number;
  rateReconstructionRelativeDifference: number;
  interpretation: "synthetic-count-domain-break-even-not-detector-performance";
  provenance: Readonly<{ countingNoiseArtifactSha256: string; instrumentArtifactSha256: string; fullShortAuthoritySha256: string }>;
}>;

export type KerrDetectorBreakEvenArtifactV360 = Readonly<{
  version: typeof KERR_DETECTOR_BREAK_EVEN_VERSION_V360;
  generatedAt: string;
  status: "qualified-synthetic-detector-break-even-requirement-audit";
  source: Readonly<{ countingNoisePath: "dist/science/kerr-photon-counting-noise-v359/audit.json"; countingNoiseFileSha256: string; countingNoiseArtifactSha256: string; instrumentPath: "dist/science/kerr-science-instrument-response-v332/response-reference.json"; instrumentFileSha256: string; instrumentArtifactSha256: string; fullShortAuthoritySha256: string }>;
  counts: Readonly<{ rayCount: 4; bandCount: 3; rowCount: 12 }>;
  countDomain: "throughput-weighted-expected-photon-counts-per-pixel-exposure";
  parityDefinition: "independent-count-variance-equals-systematic-response-variance";
  rows: readonly KerrDetectorBreakEvenRowV360[];
  maxima: Readonly<{ varianceReconstructionRelativeDifference: number; rateReconstructionRelativeDifference: number; systematicToSourcePoissonVarianceRatio: number; equivalentIndependentRmsAtParityCounts: number }>;
  measuredDetectorCalibration: "unavailable-no-read-noise-dark-current-gain-or-background-calibration";
  scienceCinematicBoundary: "detector-break-even-requirements-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const RAYS = Object.freeze([12, 13, 14, 15] as const);
const BANDS = Object.freeze(["visible", "euv", "soft-x-ray"] as const);
const relativeDifference = (left: number, right: number) => Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));

export function createKerrDetectorBreakEvenV360(
  noise: KerrPhotonCountingNoiseBudgetArtifactV359,
  instrument: KerrScienceInstrumentResponseV332,
  source: KerrDetectorBreakEvenArtifactV360["source"],
  artifactSha256 = "pending",
): KerrDetectorBreakEvenArtifactV360 {
  if (noise.status !== "qualified-conditional-poisson-systematic-noise-budget" || instrument.status !== "qualified-synthetic-reference-instrument-operator" || noise.artifactSha256 !== source.countingNoiseArtifactSha256 || !(instrument.model.exposureTimeS > 0)) throw new Error("v360-source-boundary");
  let maxVariance = 0; let maxRate = 0; let maxRatio = 0; let maxRms = 0;
  const rows = noise.rays.flatMap((ray) => BANDS.map((bandId, bandIndex): KerrDetectorBreakEvenRowV360 => {
    const systematicVariance = ray.systematicCovariance[bandIndex][bandIndex];
    const poissonVariance = ray.idealPoissonCovariance[bandIndex][bandIndex];
    if (!(systematicVariance > 0) || !(poissonVariance > 0)) throw new Error("v360-positive-variance");
    const rms = Math.sqrt(systematicVariance);
    const rate = systematicVariance / instrument.model.exposureTimeS;
    const varianceDifference = relativeDifference(rms ** 2, systematicVariance);
    const rateDifference = relativeDifference(rate * instrument.model.exposureTimeS, systematicVariance);
    const ratio = systematicVariance / poissonVariance;
    maxVariance = Math.max(maxVariance, varianceDifference); maxRate = Math.max(maxRate, rateDifference); maxRatio = Math.max(maxRatio, ratio); maxRms = Math.max(maxRms, rms);
    return Object.freeze({ rayIndex: ray.rayIndex, spinA: ray.spinA, bandId, exposureTimeS: instrument.model.exposureTimeS, nominalExpectedPhotonsPerPixelExposure: ray.nominalExpectedPhotonsByBand[bandId], systematicVarianceCountSquared: systematicVariance, idealSourcePoissonVarianceCountSquared: poissonVariance, systematicToSourcePoissonVarianceRatio: ratio, equivalentIndependentVarianceAtParityCountSquared: systematicVariance, equivalentIndependentRmsAtParityCounts: rms, equivalentIndependentRateAtParityCountsPerSecond: rate, varianceReconstructionRelativeDifference: varianceDifference, rateReconstructionRelativeDifference: rateDifference, interpretation: "synthetic-count-domain-break-even-not-detector-performance", provenance: Object.freeze({ countingNoiseArtifactSha256: source.countingNoiseArtifactSha256, instrumentArtifactSha256: source.instrumentArtifactSha256, fullShortAuthoritySha256: source.fullShortAuthoritySha256 }) });
  }));
  if (maxVariance > 1e-12 || maxRate > 1e-12) throw new Error("v360-break-even-gate");
  return Object.freeze({ version: KERR_DETECTOR_BREAK_EVEN_VERSION_V360, generatedAt: new Date().toISOString(), status: "qualified-synthetic-detector-break-even-requirement-audit", source, counts: Object.freeze({ rayCount: 4, bandCount: 3, rowCount: 12 } as const), countDomain: "throughput-weighted-expected-photon-counts-per-pixel-exposure", parityDefinition: "independent-count-variance-equals-systematic-response-variance", rows: Object.freeze(rows), maxima: Object.freeze({ varianceReconstructionRelativeDifference: maxVariance, rateReconstructionRelativeDifference: maxRate, systematicToSourcePoissonVarianceRatio: maxRatio, equivalentIndependentRmsAtParityCounts: maxRms }), measuredDetectorCalibration: "unavailable-no-read-noise-dark-current-gain-or-background-calibration", scienceCinematicBoundary: "detector-break-even-requirements-never-cinematic-color-input", denseCampaignStatus: "incomplete-0-of-49", denseAggregateSha256: null, browserQualification: "not-run", artifactSha256 });
}

export function parseKerrDetectorBreakEvenArtifactV360(value: unknown): KerrDetectorBreakEvenArtifactV360 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrDetectorBreakEvenArtifactV360> : null; const rows = source?.rows ?? [];
  if (!source || source.version !== KERR_DETECTOR_BREAK_EVEN_VERSION_V360 || source.status !== "qualified-synthetic-detector-break-even-requirement-audit" || !SHA.test(source.source?.countingNoiseFileSha256 ?? "") || !SHA.test(source.source?.countingNoiseArtifactSha256 ?? "") || !SHA.test(source.source?.instrumentFileSha256 ?? "") || !SHA.test(source.source?.instrumentArtifactSha256 ?? "") || !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") || source.counts?.rayCount !== 4 || source.counts.bandCount !== 3 || source.counts.rowCount !== 12 || source.countDomain !== "throughput-weighted-expected-photon-counts-per-pixel-exposure" || source.parityDefinition !== "independent-count-variance-equals-systematic-response-variance" || rows.length !== 12 || rows.some((row) => !RAYS.includes(row.rayIndex) || !BANDS.includes(row.bandId) || !(row.exposureTimeS > 0) || !(row.equivalentIndependentRmsAtParityCounts > 0) || row.varianceReconstructionRelativeDifference > 1e-12 || row.rateReconstructionRelativeDifference > 1e-12 || row.interpretation !== "synthetic-count-domain-break-even-not-detector-performance" || !SHA.test(row.provenance.countingNoiseArtifactSha256)) || (source.maxima?.varianceReconstructionRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || (source.maxima?.rateReconstructionRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || source.measuredDetectorCalibration !== "unavailable-no-read-noise-dark-current-gain-or-background-calibration" || source.scienceCinematicBoundary !== "detector-break-even-requirements-never-cinematic-color-input" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v360-break-even-identity");
  return value as KerrDetectorBreakEvenArtifactV360;
}
