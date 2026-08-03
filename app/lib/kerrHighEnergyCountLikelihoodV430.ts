import { createHash } from "node:crypto";

export const KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_VERSION_V430 = "v430-kerr-high-energy-count-likelihood-v1" as const;
export const KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_ARTIFACT_VERSION_V430 = "v430-kerr-high-energy-count-likelihood-artifact-v1" as const;
export const KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_SUMMARY_VERSION_V430 = "v430-kerr-high-energy-count-likelihood-summary-v1" as const;
export const KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_API_VERSION_V430 = "v430-kerr-high-energy-count-likelihood-api-v1" as const;
export const KERR_V429_ARTIFACT_SHA256_V430 = "aa176b9546928c880b9ab72ef49f8223a552fc08025cec2ccedc1add49d15e8d" as const;
export const KERR_V429_ARTIFACT_FILE_SHA256_V430 = "fbf01ca284af3a8eaaa561b66c73d090202206f9635428330450616ab31ddfde" as const;
export const KERR_V429_ORACLE_SHA256_V430 = "06ba28b689b65ce6ee1aaa1c61146c5302099d0f4ddfaa750ad50ea3831bb592" as const;
export const KERR_V429_ORACLE_FILE_SHA256_V430 = "1b66c6080a770e7223e660fb9a879dc955580a55a0a08d9b475236d68e342909" as const;
export const KERR_V429_EVIDENCE_SHA256_V430 = "b0444dfa94b2fe0539b3ed71e408a2b434147c5aa5385e79d645e45d82a54d44" as const;
export const KERR_V429_EVIDENCE_FILE_SHA256_V430 = "aaff03c4612a86cc15921835603fd7fae4782f84cd8526fa985a22b25b3b1d00" as const;
export const KERR_V429_POINTER_SHA256_V430 = "f18264b20622db20cbbff8fc46256d99f5d4ce450c246a07b708b6787a8ea9b7" as const;
export const KERR_V429_POINTER_FILE_SHA256_V430 = "874f68654e8a80d06423255ad58e2c882fc131c2080e03b7ed54671cd5f1695c" as const;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
type Matrix = readonly (readonly number[])[];

export type KerrHighEnergyCountLikelihoodMetricsV430 = Readonly<{
  poissonLogLikelihood: number;
  poissonDeviance: number;
  pearsonChiSquare: number;
  predictiveMahalanobisSquared: number;
  whitenedNormSquared: number;
  maximumMahalanobisIdentityDifference: number;
  predictiveCovarianceSymmetryAbsolute: number;
  minimumPredictiveCovarianceEigenvalue: number;
  pseudoInverseCutoff: number;
  effectiveCovarianceRank: number;
  maximumAbsolutePearsonResidual: number;
  maximumAbsoluteDevianceResidual: number;
  maximumAbsoluteWhitenedResidual: number;
  maximumAbsoluteAngleClosureZ: number;
  maximumAbsoluteChannelClosureZ: number;
  maximumDeterministicReplayCountDifference: number;
}>;

export type KerrHighEnergyCountLikelihoodOracleV430 = Readonly<{
  version: "v430-kerr-high-energy-count-likelihood-python-oracle-v1";
  generatedAt: string;
  status: "qualified-simulated-count-likelihood-and-residual-engine-fixture-only-no-measured-validation";
  sourceV429ArtifactSha256: typeof KERR_V429_ARTIFACT_SHA256_V430;
  sourceV429ArtifactFileSha256: typeof KERR_V429_ARTIFACT_FILE_SHA256_V430;
  sourceV429OracleSha256: typeof KERR_V429_ORACLE_SHA256_V430;
  sourceV429OracleFileSha256: typeof KERR_V429_ORACLE_FILE_SHA256_V430;
  fixture: Readonly<{ version: "v430-kerr-high-energy-count-likelihood-fixture-v1"; sourceKind: "simulated-counts-fixed-seed-nonpublishable"; randomGenerator: "numpy-PCG64"; seed: 43020260730; predictedCounts: readonly number[]; simulatedCounts: readonly number[]; responsePredictiveCovariance: Matrix; totalPredictiveCovariance: Matrix; measuredObservedCounts: null; measuredHoldoutDataset: null; measuredAuthorityGranted: false }>;
  diagnostics: Readonly<{ rawResidual: readonly number[]; pearsonResidual: readonly number[]; devianceContribution: readonly number[]; devianceResidual: readonly number[]; whitenedResidual: readonly number[]; angleClosureSums: readonly number[]; angleClosureZ: readonly number[]; channelClosureSums: readonly number[]; channelClosureZ: readonly number[]; metrics: KerrHighEnergyCountLikelihoodMetricsV430 }>;
  counts: Readonly<{ predictedCountCount: 24; simulatedCountCount: 24; measuredObservedCountCount: 0; measuredHoldoutDatasetCount: 0; fixtureResidualVectorCount: 5; fixtureClosureGroupCount: 10; measuredResidualMetricCount: 0; measuredValidationRunCount: 0; scienceResponseApplicationCount: 0 }>;
  qualification: Readonly<{ poissonLikelihoodEngineQualified: true; devianceResidualEngineQualified: true; pearsonResidualEngineQualified: true; predictiveCovarianceWhiteningQualified: true; angleAndChannelClosureQualified: true; fixedSeedReplayQualified: true; measuredLikelihoodQualified: false; measuredResidualClosureQualified: false; scienceResponseApplicationQualified: false }>;
  independentScientificValidationStatus: "not-run-no-measured-holdout";
  measuredResponseAuthorityGranted: false;
  scienceResponseApplicationCount: 0;
  networkAttempted: false;
  boundary: string;
  artifactSha256: string;
}>;

export type KerrHighEnergyCountLikelihoodContractV430 = Readonly<{
  version: "v430-kerr-high-energy-count-likelihood-contract-v1";
  status: "contract-ready-awaiting-measured-count-likelihood-declaration";
  poissonAllowedOnlyWhen: Readonly<Record<string, boolean>>;
  alternativeLikelihoodRequiredWhen: readonly string[];
  predictiveCovariance: Readonly<Record<string, boolean>>;
  requiredDiagnostics: readonly string[];
  inferencePolicy: Readonly<Record<string, boolean>>;
  admission: Readonly<{ simulatedFixtureNeverAdmissible: true; measuredObservedCountsRequired: true; independentHoldoutRequired: true; allLikelihoodAssumptionsMustBeResolved: true; measuredAuthorityGranted: false; currentStatus: "not-run-no-measured-holdout" }>;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: string;
}>;

export type KerrHighEnergyCountLikelihoodComputationV430 = Readonly<{ rawResidual: readonly number[]; pearsonResidual: readonly number[]; devianceContribution: readonly number[]; devianceResidual: readonly number[]; whitenedResidual: readonly number[]; angleClosureSums: readonly number[]; angleClosureZ: readonly number[]; channelClosureSums: readonly number[]; channelClosureZ: readonly number[]; metrics: KerrHighEnergyCountLikelihoodMetricsV430; maximumPythonRelativeDifference: number }>;

export type KerrHighEnergyCountLikelihoodViewV430 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_VERSION_V430;
  status: "qualified-simulated-count-likelihood-and-residual-engine-fixture-only-measured-validation-unavailable";
  source: Readonly<{ v429ArtifactSha256: typeof KERR_V429_ARTIFACT_SHA256_V430; v429OracleSha256: typeof KERR_V429_ORACLE_SHA256_V430; v429EvidenceSha256: typeof KERR_V429_EVIDENCE_SHA256_V430; v429PointerSha256: typeof KERR_V429_POINTER_SHA256_V430 }>;
  likelihood: Readonly<{ fixtureFamily: "Poisson"; simulatedCountCount: 24; predictiveCovarianceIncludesPoisson: true; predictiveCovarianceIncludesResponse: true; crossChannelTermsPreserved: true; pseudoInverseCutoffRecorded: true; effectiveRankRecorded: true; alternativeLikelihoodRequiredWhenAssumptionsFail: true }>;
  fixture: Readonly<{ status: "validated-fixed-seed-simulated-counts-nonpublishable"; seed: 43020260730; predictedCountCount: 24; simulatedCountCount: 24; measuredObservedCountsPresent: false; measuredHoldoutPresent: false; residualVectorCount: 5; closureGroupCount: 10; metrics: KerrHighEnergyCountLikelihoodMetricsV430; maximumPythonRelativeDifference: number }>;
  contract: Readonly<{ status: "contract-ready-awaiting-measured-count-likelihood-declaration"; poissonAssumptionCount: number; alternativeTriggerCount: number; requiredDiagnosticCount: number; postHocLikelihoodSwitchForbidden: true; measuredLikelihoodStatus: "not-run-no-measured-holdout" }>;
  counts: Readonly<{ fixturePredictedCountCount: 24; fixtureSimulatedCountCount: 24; measuredObservedCountCount: 0; measuredHoldoutDatasetCount: 0; fixtureResidualVectorCount: 5; fixtureClosureGroupCount: 10; measuredResidualMetricCount: 0; measuredValidationRunCount: 0; measuredResponseAuthorityCount: 0; scienceResponseApplicationCount: 0 }>;
  products: Readonly<{ json: "available-fixture-likelihood-and-contract"; csv: "available-simulated-residual-diagnostics-nonpublishable"; fits: "available-simulated-residual-and-covariance-fixture"; png: "available-likelihood-architecture-not-detector-image"; measuredLikelihoodReport: "unavailable-no-holdout" }>;
  authorityBoundary: Readonly<{ likelihoodMathAuthorityGranted: true; residualMathAuthorityGranted: true; whiteningMathAuthorityGranted: true; fixtureGoodnessOfFitAuthorityGranted: false; measuredLikelihoodAuthorityGranted: false; measuredResidualClosureAuthorityGranted: false; measuredResponseAuthorityGranted: false; scienceProjectionAuthorityGranted: false; detectorAuthorityGranted: false; pixelRasterAuthorityGranted: false; denseAuthorityGranted: false; unavailableIsNotZero: true }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "simulated-count-likelihood-residual-and-closure-mathematics-only-no-measured-observations-holdout-goodness-of-fit-response-authority-science-projection-or-dense-authority";
}>;

export type KerrHighEnergyCountLikelihoodArtifactV430 = Readonly<{ version: typeof KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_ARTIFACT_VERSION_V430; generatedAt: string; status: KerrHighEnergyCountLikelihoodViewV430["status"]; sourceFiles: Readonly<{ v429ArtifactFileSha256: typeof KERR_V429_ARTIFACT_FILE_SHA256_V430; v429OracleFileSha256: typeof KERR_V429_ORACLE_FILE_SHA256_V430; v429EvidenceFileSha256: typeof KERR_V429_EVIDENCE_FILE_SHA256_V430; v429PointerFileSha256: typeof KERR_V429_POINTER_FILE_SHA256_V430; pythonOracleFileSha256: string; likelihoodContractFileSha256: string }>; pythonOracleArtifactSha256: string; view: KerrHighEnergyCountLikelihoodViewV430; deterministicReplay: true; networkAttempted: false; denseShardExecuted: false; measuredObservedCountsPresent: false; measuredHoldoutPresent: false; measuredValidationRunCount: 0; scienceResponseApplicationCount: 0; artifactSha256: string }>;
export type KerrHighEnergyCountLikelihoodSummaryV430 = Readonly<{ version: typeof KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_SUMMARY_VERSION_V430; status: KerrHighEnergyCountLikelihoodViewV430["status"]; artifactSha256: string; likelihood: KerrHighEnergyCountLikelihoodViewV430["likelihood"]; fixture: KerrHighEnergyCountLikelihoodViewV430["fixture"]; contract: KerrHighEnergyCountLikelihoodViewV430["contract"]; counts: KerrHighEnergyCountLikelihoodViewV430["counts"]; products: KerrHighEnergyCountLikelihoodViewV430["products"]; authorityBoundary: KerrHighEnergyCountLikelihoodViewV430["authorityBoundary"]; denseCampaignStatus: "incomplete-0-of-49"; fullArtifactAvailable: true; boundary: "bounded-likelihood-residual-metrics-contract-and-authority-summary-no-count-vectors-covariance-or-eigenvectors-in-react-state" }>;
export type KerrHighEnergyCountLikelihoodApiV430 = Readonly<{ version: typeof KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_API_VERSION_V430; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrHighEnergyCountLikelihoodSummaryV430 | null }>;

function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !TRANSIENT.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)])); }
export const canonicalShaV430 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const maximumRelativeDifference = (left: unknown, right: unknown): number => { if (typeof left === "number" && typeof right === "number") return Math.abs(left - right) / Math.max(1, Math.abs(right)); if (Array.isArray(left) && Array.isArray(right) && left.length === right.length) return Math.max(0, ...left.map((entry, index) => maximumRelativeDifference(entry, right[index]))); if (left && right && typeof left === "object" && typeof right === "object") { const a = left as Record<string, unknown>, b = right as Record<string, unknown>, keys = Object.keys(a); if (keys.length !== Object.keys(b).length || keys.some((key) => !Object.hasOwn(b, key))) return Number.POSITIVE_INFINITY; return Math.max(0, ...keys.map((key) => maximumRelativeDifference(a[key], b[key]))); } return left === right ? 0 : Number.POSITIVE_INFINITY; };

function logGamma(value: number): number {
  const coefficients = [676.5203681218851, -1259.1392167224028, 771.3234287776531, -176.6150291621406, 12.507343278686905, -0.13857109526572012, 9.984369578019572e-6, 1.5056327351493116e-7];
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  const z = value - 1;
  let x = 0.9999999999998099;
  coefficients.forEach((coefficient, index) => { x += coefficient / (z + index + 1); });
  const t = z + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function symmetricEigen(matrix: Matrix): { values: number[]; vectors: number[][] } {
  const size = matrix.length, values = matrix.map((row) => [...row]), vectors: number[][] = Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => row === column ? 1 : 0));
  for (let iteration = 0; iteration < size * size * 256; iteration += 1) {
    let p = 0, q = 1, maximum = 0;
    for (let row = 0; row < size; row += 1) for (let column = row + 1; column < size; column += 1) if (Math.abs(values[row][column]) > maximum) { maximum = Math.abs(values[row][column]); p = row; q = column; }
    if (maximum < 1e-10) break;
    const angle = 0.5 * Math.atan2(2 * values[p][q], values[q][q] - values[p][p]), cosine = Math.cos(angle), sine = Math.sin(angle), pp = values[p][p], qq = values[q][q], pq = values[p][q];
    values[p][p] = cosine * cosine * pp - 2 * sine * cosine * pq + sine * sine * qq;
    values[q][q] = sine * sine * pp + 2 * sine * cosine * pq + cosine * cosine * qq;
    values[p][q] = values[q][p] = 0;
    for (let index = 0; index < size; index += 1) if (index !== p && index !== q) { const ip = values[index][p], iq = values[index][q]; values[index][p] = values[p][index] = cosine * ip - sine * iq; values[index][q] = values[q][index] = sine * ip + cosine * iq; }
    for (let row = 0; row < size; row += 1) { const vp = vectors[row][p], vq = vectors[row][q]; vectors[row][p] = cosine * vp - sine * vq; vectors[row][q] = sine * vp + cosine * vq; }
  }
  const pairs = values.map((row, index) => ({ value: row[index], vector: vectors.map((entry) => entry[index]) })).sort((a, b) => a.value - b.value);
  return { values: pairs.map((entry) => entry.value), vectors: Array.from({ length: size }, (_, row) => pairs.map((entry) => entry.vector[row])) };
}

function groupClosure(residual: readonly number[], covariance: Matrix, groups: readonly (readonly number[])[]): { sums: number[]; z: number[] } { const sums: number[] = [], z: number[] = []; groups.forEach((indices) => { const sum = indices.reduce((total, index) => total + residual[index], 0); let variance = 0; indices.forEach((row) => indices.forEach((column) => { variance += covariance[row][column]; })); sums.push(sum); z.push(sum / Math.sqrt(variance)); }); return { sums, z }; }

export function computeKerrHighEnergyCountLikelihoodV430(oracle: KerrHighEnergyCountLikelihoodOracleV430): KerrHighEnergyCountLikelihoodComputationV430 {
  const fixture = oracle.fixture, predicted = fixture.predictedCounts, simulated = fixture.simulatedCounts, covariance = fixture.totalPredictiveCovariance;
  if (predicted.length !== 24 || simulated.length !== 24 || predicted.some((value) => !Number.isFinite(value) || value <= 0) || simulated.some((value) => !Number.isSafeInteger(value) || value < 0) || covariance.length !== 24 || covariance.some((row) => row.length !== 24 || row.some((value) => !Number.isFinite(value)))) throw new Error("v430-fixture-shape");
  const rawResidual = simulated.map((value, index) => value - predicted[index]);
  const pearsonResidual = rawResidual.map((value, index) => value / Math.sqrt(predicted[index]));
  const devianceContribution = simulated.map((value, index) => value > 0 ? 2 * (value * Math.log(value / predicted[index]) - (value - predicted[index])) : 2 * predicted[index]);
  const devianceResidual = devianceContribution.map((value, index) => Math.sign(rawResidual[index]) * Math.sqrt(Math.max(value, 0)));
  const eigen = symmetricEigen(covariance), cutoff = Math.max(...eigen.values) * 24 * Number.EPSILON, retained = eigen.values.map((value) => value > cutoff);
  const projection = eigen.values.map((_, column) => rawResidual.reduce((sum, value, row) => sum + eigen.vectors[row][column] * value, 0));
  const whitenedResidual = rawResidual.map((_, row) => eigen.values.reduce((sum, value, column) => retained[column] ? sum + eigen.vectors[row][column] * projection[column] / Math.sqrt(value) : sum, 0));
  const mahalanobis = eigen.values.reduce((sum, value, column) => retained[column] ? sum + projection[column] * projection[column] / value : sum, 0);
  const whitenedNorm = whitenedResidual.reduce((sum, value) => sum + value * value, 0);
  const angleGroups = Array.from({ length: 4 }, (_, angle) => Array.from({ length: 6 }, (_, channel) => angle * 6 + channel));
  const channelGroups = Array.from({ length: 6 }, (_, channel) => Array.from({ length: 4 }, (_, angle) => angle * 6 + channel));
  const angle = groupClosure(rawResidual, covariance, angleGroups), channel = groupClosure(rawResidual, covariance, channelGroups);
  const poissonLogLikelihood = simulated.reduce((sum, value, index) => sum + value * Math.log(predicted[index]) - predicted[index] - logGamma(value + 1), 0);
  const metrics: KerrHighEnergyCountLikelihoodMetricsV430 = Object.freeze({ poissonLogLikelihood, poissonDeviance: devianceContribution.reduce((sum, value) => sum + value, 0), pearsonChiSquare: pearsonResidual.reduce((sum, value) => sum + value * value, 0), predictiveMahalanobisSquared: mahalanobis, whitenedNormSquared: whitenedNorm, maximumMahalanobisIdentityDifference: Math.abs(mahalanobis - whitenedNorm), predictiveCovarianceSymmetryAbsolute: Math.max(0, ...covariance.flatMap((row, i) => row.map((value, j) => Math.abs(value - covariance[j][i])))), minimumPredictiveCovarianceEigenvalue: Math.min(...eigen.values), pseudoInverseCutoff: cutoff, effectiveCovarianceRank: retained.filter(Boolean).length, maximumAbsolutePearsonResidual: Math.max(...pearsonResidual.map(Math.abs)), maximumAbsoluteDevianceResidual: Math.max(...devianceResidual.map(Math.abs)), maximumAbsoluteWhitenedResidual: Math.max(...whitenedResidual.map(Math.abs)), maximumAbsoluteAngleClosureZ: Math.max(...angle.z.map(Math.abs)), maximumAbsoluteChannelClosureZ: Math.max(...channel.z.map(Math.abs)), maximumDeterministicReplayCountDifference: 0 });
  const result = { rawResidual, pearsonResidual, devianceContribution, devianceResidual, whitenedResidual, angleClosureSums: angle.sums, angleClosureZ: angle.z, channelClosureSums: channel.sums, channelClosureZ: channel.z, metrics };
  const difference = maximumRelativeDifference(result, oracle.diagnostics);
  if (difference >= 1e-8 || metrics.maximumMahalanobisIdentityDifference >= 1e-8 || metrics.predictiveCovarianceSymmetryAbsolute >= 1e-6 || metrics.minimumPredictiveCovarianceEigenvalue <= 0 || metrics.effectiveCovarianceRank !== 24) throw new Error(`v430-computation-gate:${JSON.stringify({ difference, metrics })}`);
  return Object.freeze({ ...result, rawResidual: Object.freeze(rawResidual), pearsonResidual: Object.freeze(pearsonResidual), devianceContribution: Object.freeze(devianceContribution), devianceResidual: Object.freeze(devianceResidual), whitenedResidual: Object.freeze(whitenedResidual), angleClosureSums: Object.freeze(angle.sums), angleClosureZ: Object.freeze(angle.z), channelClosureSums: Object.freeze(channel.sums), channelClosureZ: Object.freeze(channel.z), maximumPythonRelativeDifference: difference });
}

export function parseKerrHighEnergyCountLikelihoodOracleV430(value: unknown): KerrHighEnergyCountLikelihoodOracleV430 { const source = value as Partial<KerrHighEnergyCountLikelihoodOracleV430> | null; if (!source || source.version !== "v430-kerr-high-energy-count-likelihood-python-oracle-v1" || source.status !== "qualified-simulated-count-likelihood-and-residual-engine-fixture-only-no-measured-validation" || source.sourceV429ArtifactSha256 !== KERR_V429_ARTIFACT_SHA256_V430 || source.sourceV429ArtifactFileSha256 !== KERR_V429_ARTIFACT_FILE_SHA256_V430 || source.sourceV429OracleSha256 !== KERR_V429_ORACLE_SHA256_V430 || source.sourceV429OracleFileSha256 !== KERR_V429_ORACLE_FILE_SHA256_V430 || source.fixture?.sourceKind !== "simulated-counts-fixed-seed-nonpublishable" || source.fixture.seed !== 43020260730 || source.fixture.measuredObservedCounts !== null || source.fixture.measuredHoldoutDataset !== null || source.counts?.simulatedCountCount !== 24 || source.counts.measuredObservedCountCount !== 0 || source.counts.measuredResidualMetricCount !== 0 || source.counts.measuredValidationRunCount !== 0 || source.qualification?.poissonLikelihoodEngineQualified !== true || source.qualification.predictiveCovarianceWhiteningQualified !== true || source.qualification.measuredLikelihoodQualified !== false || source.independentScientificValidationStatus !== "not-run-no-measured-holdout" || source.measuredResponseAuthorityGranted !== false || source.scienceResponseApplicationCount !== 0 || source.networkAttempted !== false || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v430-oracle-identity"); return value as KerrHighEnergyCountLikelihoodOracleV430; }

export function createKerrHighEnergyCountLikelihoodViewV430(oracleValue: unknown, contract: KerrHighEnergyCountLikelihoodContractV430): KerrHighEnergyCountLikelihoodViewV430 {
  const oracle = parseKerrHighEnergyCountLikelihoodOracleV430(oracleValue);
  if (contract.version !== "v430-kerr-high-energy-count-likelihood-contract-v1" || contract.status !== "contract-ready-awaiting-measured-count-likelihood-declaration" || Object.keys(contract.poissonAllowedOnlyWhen).length < 7 || !Object.values(contract.poissonAllowedOnlyWhen).every(Boolean) || contract.alternativeLikelihoodRequiredWhen.length < 6 || contract.requiredDiagnostics.length < 9 || contract.predictiveCovariance.crossChannelTermsPreserved !== true || contract.inferencePolicy.postHocLikelihoodSwitchForbidden !== true || contract.admission.currentStatus !== "not-run-no-measured-holdout" || contract.admission.measuredAuthorityGranted !== false || contract.formalProductPointer !== "v263" || contract.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v430-contract");
  const computation = computeKerrHighEnergyCountLikelihoodV430(oracle);
  return Object.freeze({ version: KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_VERSION_V430, status: "qualified-simulated-count-likelihood-and-residual-engine-fixture-only-measured-validation-unavailable", source: Object.freeze({ v429ArtifactSha256: KERR_V429_ARTIFACT_SHA256_V430, v429OracleSha256: KERR_V429_ORACLE_SHA256_V430, v429EvidenceSha256: KERR_V429_EVIDENCE_SHA256_V430, v429PointerSha256: KERR_V429_POINTER_SHA256_V430 }), likelihood: Object.freeze({ fixtureFamily: "Poisson" as const, simulatedCountCount: 24 as const, predictiveCovarianceIncludesPoisson: true as const, predictiveCovarianceIncludesResponse: true as const, crossChannelTermsPreserved: true as const, pseudoInverseCutoffRecorded: true as const, effectiveRankRecorded: true as const, alternativeLikelihoodRequiredWhenAssumptionsFail: true as const }), fixture: Object.freeze({ status: "validated-fixed-seed-simulated-counts-nonpublishable" as const, seed: 43020260730 as const, predictedCountCount: 24 as const, simulatedCountCount: 24 as const, measuredObservedCountsPresent: false as const, measuredHoldoutPresent: false as const, residualVectorCount: 5 as const, closureGroupCount: 10 as const, metrics: computation.metrics, maximumPythonRelativeDifference: computation.maximumPythonRelativeDifference }), contract: Object.freeze({ status: contract.status, poissonAssumptionCount: Object.keys(contract.poissonAllowedOnlyWhen).length, alternativeTriggerCount: contract.alternativeLikelihoodRequiredWhen.length, requiredDiagnosticCount: contract.requiredDiagnostics.length, postHocLikelihoodSwitchForbidden: true as const, measuredLikelihoodStatus: "not-run-no-measured-holdout" as const }), counts: Object.freeze({ fixturePredictedCountCount: 24 as const, fixtureSimulatedCountCount: 24 as const, measuredObservedCountCount: 0 as const, measuredHoldoutDatasetCount: 0 as const, fixtureResidualVectorCount: 5 as const, fixtureClosureGroupCount: 10 as const, measuredResidualMetricCount: 0 as const, measuredValidationRunCount: 0 as const, measuredResponseAuthorityCount: 0 as const, scienceResponseApplicationCount: 0 as const }), products: Object.freeze({ json: "available-fixture-likelihood-and-contract" as const, csv: "available-simulated-residual-diagnostics-nonpublishable" as const, fits: "available-simulated-residual-and-covariance-fixture" as const, png: "available-likelihood-architecture-not-detector-image" as const, measuredLikelihoodReport: "unavailable-no-holdout" as const }), authorityBoundary: Object.freeze({ likelihoodMathAuthorityGranted: true as const, residualMathAuthorityGranted: true as const, whiteningMathAuthorityGranted: true as const, fixtureGoodnessOfFitAuthorityGranted: false as const, measuredLikelihoodAuthorityGranted: false as const, measuredResidualClosureAuthorityGranted: false as const, measuredResponseAuthorityGranted: false as const, scienceProjectionAuthorityGranted: false as const, detectorAuthorityGranted: false as const, pixelRasterAuthorityGranted: false as const, denseAuthorityGranted: false as const, unavailableIsNotZero: true as const }), denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", boundary: "simulated-count-likelihood-residual-and-closure-mathematics-only-no-measured-observations-holdout-goodness-of-fit-response-authority-science-projection-or-dense-authority" });
}

export function parseKerrHighEnergyCountLikelihoodArtifactV430(value: unknown): KerrHighEnergyCountLikelihoodArtifactV430 { const source = value as Partial<KerrHighEnergyCountLikelihoodArtifactV430> | null, view = source?.view; if (!source || source.version !== KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_ARTIFACT_VERSION_V430 || source.status !== "qualified-simulated-count-likelihood-and-residual-engine-fixture-only-measured-validation-unavailable" || source.sourceFiles?.v429ArtifactFileSha256 !== KERR_V429_ARTIFACT_FILE_SHA256_V430 || source.sourceFiles.v429OracleFileSha256 !== KERR_V429_ORACLE_FILE_SHA256_V430 || source.sourceFiles.v429EvidenceFileSha256 !== KERR_V429_EVIDENCE_FILE_SHA256_V430 || source.sourceFiles.v429PointerFileSha256 !== KERR_V429_POINTER_FILE_SHA256_V430 || !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") || !SHA.test(source.sourceFiles.likelihoodContractFileSha256 ?? "") || !SHA.test(source.pythonOracleArtifactSha256 ?? "") || view?.counts.fixtureSimulatedCountCount !== 24 || view.counts.measuredObservedCountCount !== 0 || view.counts.measuredHoldoutDatasetCount !== 0 || view.counts.measuredResidualMetricCount !== 0 || view.counts.measuredValidationRunCount !== 0 || view.counts.measuredResponseAuthorityCount !== 0 || view.counts.scienceResponseApplicationCount !== 0 || view.authorityBoundary.measuredResponseAuthorityGranted !== false || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.measuredObservedCountsPresent !== false || source.measuredHoldoutPresent !== false || source.measuredValidationRunCount !== 0 || source.scienceResponseApplicationCount !== 0 || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v430-artifact-identity"); return value as KerrHighEnergyCountLikelihoodArtifactV430; }
export function createKerrHighEnergyCountLikelihoodSummaryV430(value: unknown): KerrHighEnergyCountLikelihoodSummaryV430 { const artifact = parseKerrHighEnergyCountLikelihoodArtifactV430(value), view = artifact.view; return Object.freeze({ version: KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_SUMMARY_VERSION_V430, status: view.status, artifactSha256: artifact.artifactSha256, likelihood: view.likelihood, fixture: view.fixture, contract: view.contract, counts: view.counts, products: view.products, authorityBoundary: view.authorityBoundary, denseCampaignStatus: view.denseCampaignStatus, fullArtifactAvailable: true, boundary: "bounded-likelihood-residual-metrics-contract-and-authority-summary-no-count-vectors-covariance-or-eigenvectors-in-react-state" }); }
export function parseKerrHighEnergyCountLikelihoodApiV430(value: unknown): KerrHighEnergyCountLikelihoodApiV430 { const source = value as Partial<KerrHighEnergyCountLikelihoodApiV430> | null; if (!source || source.version !== KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_API_VERSION_V430) throw new Error("v430-api-version"); if (source.available === true && source.reason === "ready" && source.summary) { if (source.summary.version !== KERR_HIGH_ENERGY_COUNT_LIKELIHOOD_SUMMARY_VERSION_V430 || !SHA.test(source.summary.artifactSha256) || source.summary.counts.measuredObservedCountCount !== 0 || source.summary.counts.measuredValidationRunCount !== 0 || source.summary.authorityBoundary.measuredResponseAuthorityGranted !== false || Object.hasOwn(source.summary, "simulatedCounts") || Object.hasOwn(source.summary, "whitenedResidual")) throw new Error("v430-api-summary"); return source as KerrHighEnergyCountLikelihoodApiV430; } if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrHighEnergyCountLikelihoodApiV430; throw new Error("v430-api-identity"); }
