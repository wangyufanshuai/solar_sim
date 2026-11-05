import type { KerrObservablePhotonUncertaintyArtifactV358 } from "./kerrObservablePhotonUncertaintyV358";

export const KERR_PHOTON_COUNTING_NOISE_BUDGET_VERSION_V359 =
  "v359-kerr-photon-counting-noise-budget-v1" as const;

export type KerrPhotonCountingNoiseRayV359 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  nominalExpectedPhotonsByBand: Readonly<{ visible: number; euv: number; "soft-x-ray": number }>;
  systematicCovariance: readonly (readonly number[])[];
  idealPoissonCovariance: readonly (readonly number[])[];
  conditionalTotalCovariance: readonly (readonly number[])[];
  sigmaByBand: Readonly<{
    systematic: Readonly<{ visible: number; euv: number; "soft-x-ray": number }>;
    idealPoisson: Readonly<{ visible: number; euv: number; "soft-x-ray": number }>;
    conditionalTotal: Readonly<{ visible: number; euv: number; "soft-x-ray": number }>;
  }>;
  totalExpectedPhotons: number;
  systematicTotalVariance: number;
  idealPoissonTotalVariance: number;
  conditionalTotalVariance: number;
  conditionalTotalSigma: number;
  conditionalVarianceFractions: Readonly<{ systematic: number; idealPoisson: number }>;
  totalBoundsBySigma: Readonly<{ sigma1: readonly [number, number]; sigma2: readonly [number, number]; sigma3: readonly [number, number] }>;
  decompositionRelativeDifference: number;
  provenance: Readonly<{ observableArtifactSha256: string; spectralCorrelationArtifactSha256: string; fullShortAuthoritySha256: string }>;
}>;

export type KerrPhotonCountingNoiseBudgetArtifactV359 = Readonly<{
  version: typeof KERR_PHOTON_COUNTING_NOISE_BUDGET_VERSION_V359;
  generatedAt: string;
  status: "qualified-conditional-poisson-systematic-noise-budget";
  source: Readonly<{ observablePath: "dist/science/kerr-observable-photon-uncertainty-v358/audit.json"; observableFileSha256: string; observableArtifactSha256: string; spectralCorrelationArtifactSha256: string; fullShortAuthoritySha256: string }>;
  counts: Readonly<{ rayCount: 4; bandCount: 3; budgetRowCount: 12; excludedDetectorTermCount: 4 }>;
  conditionalAssumption: "ideal-independent-poisson-counting-conditional-on-synthetic-expected-photons";
  combinationPolicy: "conditional-covariance-sum-with-explicit-independence-assumption";
  excludedDetectorTerms: readonly ["read-noise-unavailable", "dark-current-unavailable", "gain-calibration-unavailable", "background-subtraction-unavailable"];
  rays: readonly KerrPhotonCountingNoiseRayV359[];
  maxima: Readonly<{ decompositionRelativeDifference: number; covarianceSymmetryDifference: number; conditionalRelativeSigma: number; idealPoissonVarianceFraction: number }>;
  measuredDetectorNoiseAuthority: "unavailable-ideal-poisson-model-not-measured-detector-noise";
  scienceCinematicBoundary: "photon-counting-noise-budget-never-cinematic-color-input";
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const RAYS = Object.freeze([12, 13, 14, 15] as const);
const BANDS = Object.freeze(["visible", "euv", "soft-x-ray"] as const);
const relativeDifference = (left: number, right: number) => Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));

function symmetryDifference(matrix: readonly (readonly number[])[]): number {
  let maximum = 0;
  for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) maximum = Math.max(maximum, relativeDifference(matrix[row][column], matrix[column][row]));
  return maximum;
}

export function createKerrPhotonCountingNoiseBudgetV359(
  observable: KerrObservablePhotonUncertaintyArtifactV358,
  source: KerrPhotonCountingNoiseBudgetArtifactV359["source"],
  artifactSha256 = "pending",
): KerrPhotonCountingNoiseBudgetArtifactV359 {
  if (observable.status !== "qualified-synthetic-observable-photon-uncertainty-propagation" || observable.artifactSha256 !== source.observableArtifactSha256 || observable.denseAggregateSha256 !== null) throw new Error("v359-source-boundary");
  let maxDecomposition = 0; let maxSymmetry = 0; let maxRelativeSigma = 0; let maxPoissonFraction = 0;
  const rays = observable.rays.map((ray): KerrPhotonCountingNoiseRayV359 => {
    const nominal = BANDS.map((band) => ray.nominalExpectedPhotonsByBand[band]);
    const poisson = Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, column) => row === column ? nominal[row] : 0));
    const total = ray.absoluteCovariance.map((row, rowIndex) => row.map((value, columnIndex) => value + poisson[rowIndex][columnIndex]));
    const systematicTotalVariance = ray.absoluteCovariance.reduce((sum, row) => sum + row.reduce((rowSum, value) => rowSum + value, 0), 0);
    const idealPoissonTotalVariance = nominal.reduce((sum, value) => sum + value, 0);
    const conditionalTotalVariance = total.reduce((sum, row) => sum + row.reduce((rowSum, value) => rowSum + value, 0), 0);
    const reconstructed = systematicTotalVariance + idealPoissonTotalVariance;
    const decomposition = relativeDifference(conditionalTotalVariance, reconstructed);
    const totalExpectedPhotons = idealPoissonTotalVariance;
    const conditionalTotalSigma = Math.sqrt(conditionalTotalVariance);
    const systematicSigma = [0, 1, 2].map((index) => Math.sqrt(Math.max(0, ray.absoluteCovariance[index][index])));
    const poissonSigma = nominal.map(Math.sqrt);
    const totalSigma = [0, 1, 2].map((index) => Math.sqrt(Math.max(0, total[index][index])));
    const fractions = { systematic: systematicTotalVariance / conditionalTotalVariance, idealPoisson: idealPoissonTotalVariance / conditionalTotalVariance };
    const bounds = { sigma1: [Math.max(0, totalExpectedPhotons - conditionalTotalSigma), totalExpectedPhotons + conditionalTotalSigma] as const, sigma2: [Math.max(0, totalExpectedPhotons - 2 * conditionalTotalSigma), totalExpectedPhotons + 2 * conditionalTotalSigma] as const, sigma3: [Math.max(0, totalExpectedPhotons - 3 * conditionalTotalSigma), totalExpectedPhotons + 3 * conditionalTotalSigma] as const };
    const symmetry = symmetryDifference(total);
    maxDecomposition = Math.max(maxDecomposition, decomposition); maxSymmetry = Math.max(maxSymmetry, symmetry); maxRelativeSigma = Math.max(maxRelativeSigma, conditionalTotalSigma / totalExpectedPhotons); maxPoissonFraction = Math.max(maxPoissonFraction, fractions.idealPoisson);
    return Object.freeze({ rayIndex: ray.rayIndex, spinA: ray.spinA, nominalExpectedPhotonsByBand: ray.nominalExpectedPhotonsByBand, systematicCovariance: ray.absoluteCovariance, idealPoissonCovariance: Object.freeze(poisson.map((row) => Object.freeze(row))), conditionalTotalCovariance: Object.freeze(total.map((row) => Object.freeze(row))), sigmaByBand: Object.freeze({ systematic: Object.freeze({ visible: systematicSigma[0], euv: systematicSigma[1], "soft-x-ray": systematicSigma[2] }), idealPoisson: Object.freeze({ visible: poissonSigma[0], euv: poissonSigma[1], "soft-x-ray": poissonSigma[2] }), conditionalTotal: Object.freeze({ visible: totalSigma[0], euv: totalSigma[1], "soft-x-ray": totalSigma[2] }) }), totalExpectedPhotons, systematicTotalVariance, idealPoissonTotalVariance, conditionalTotalVariance, conditionalTotalSigma, conditionalVarianceFractions: Object.freeze(fractions), totalBoundsBySigma: Object.freeze(bounds), decompositionRelativeDifference: decomposition, provenance: Object.freeze({ observableArtifactSha256: source.observableArtifactSha256, spectralCorrelationArtifactSha256: source.spectralCorrelationArtifactSha256, fullShortAuthoritySha256: source.fullShortAuthoritySha256 }) });
  });
  if (maxDecomposition > 1e-12 || maxSymmetry > 1e-12) throw new Error("v359-noise-budget-gate");
  return Object.freeze({ version: KERR_PHOTON_COUNTING_NOISE_BUDGET_VERSION_V359, generatedAt: new Date().toISOString(), status: "qualified-conditional-poisson-systematic-noise-budget", source, counts: Object.freeze({ rayCount: 4, bandCount: 3, budgetRowCount: 12, excludedDetectorTermCount: 4 } as const), conditionalAssumption: "ideal-independent-poisson-counting-conditional-on-synthetic-expected-photons", combinationPolicy: "conditional-covariance-sum-with-explicit-independence-assumption", excludedDetectorTerms: Object.freeze(["read-noise-unavailable", "dark-current-unavailable", "gain-calibration-unavailable", "background-subtraction-unavailable"] as const), rays: Object.freeze(rays), maxima: Object.freeze({ decompositionRelativeDifference: maxDecomposition, covarianceSymmetryDifference: maxSymmetry, conditionalRelativeSigma: maxRelativeSigma, idealPoissonVarianceFraction: maxPoissonFraction }), measuredDetectorNoiseAuthority: "unavailable-ideal-poisson-model-not-measured-detector-noise", scienceCinematicBoundary: "photon-counting-noise-budget-never-cinematic-color-input", denseCampaignStatus: "incomplete-0-of-49", denseAggregateSha256: null, browserQualification: "not-run", artifactSha256 });
}

export function parseKerrPhotonCountingNoiseBudgetArtifactV359(value: unknown): KerrPhotonCountingNoiseBudgetArtifactV359 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrPhotonCountingNoiseBudgetArtifactV359> : null; const rays = source?.rays ?? [];
  if (!source || source.version !== KERR_PHOTON_COUNTING_NOISE_BUDGET_VERSION_V359 || source.status !== "qualified-conditional-poisson-systematic-noise-budget" || !SHA.test(source.source?.observableFileSha256 ?? "") || !SHA.test(source.source?.observableArtifactSha256 ?? "") || !SHA.test(source.source?.spectralCorrelationArtifactSha256 ?? "") || !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") || source.counts?.rayCount !== 4 || source.counts.bandCount !== 3 || source.counts.budgetRowCount !== 12 || source.counts.excludedDetectorTermCount !== 4 || source.conditionalAssumption !== "ideal-independent-poisson-counting-conditional-on-synthetic-expected-photons" || source.combinationPolicy !== "conditional-covariance-sum-with-explicit-independence-assumption" || source.excludedDetectorTerms?.length !== 4 || rays.length !== 4 || rays.some((ray) => !RAYS.includes(ray.rayIndex) || !(ray.conditionalTotalVariance > 0) || !(ray.conditionalTotalSigma > 0) || ray.decompositionRelativeDifference > 1e-12 || relativeDifference(ray.conditionalVarianceFractions.systematic + ray.conditionalVarianceFractions.idealPoisson, 1) > 1e-12 || !SHA.test(ray.provenance.observableArtifactSha256)) || (source.maxima?.decompositionRelativeDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || (source.maxima?.covarianceSymmetryDifference ?? Number.POSITIVE_INFINITY) > 1e-12 || source.measuredDetectorNoiseAuthority !== "unavailable-ideal-poisson-model-not-measured-detector-noise" || source.scienceCinematicBoundary !== "photon-counting-noise-budget-never-cinematic-color-input" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v359-noise-budget-identity");
  return value as KerrPhotonCountingNoiseBudgetArtifactV359;
}
