import { createHash } from "node:crypto";

export const KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_VERSION_V431 = "v431-kerr-high-energy-likelihood-stress-v1" as const;
export const KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_ARTIFACT_VERSION_V431 = "v431-kerr-high-energy-likelihood-stress-artifact-v1" as const;
export const KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_SUMMARY_VERSION_V431 = "v431-kerr-high-energy-likelihood-stress-summary-v1" as const;
export const KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_API_VERSION_V431 = "v431-kerr-high-energy-likelihood-stress-api-v1" as const;
export const KERR_V430_ARTIFACT_SHA256_V431 = "e666aa7c7d7f65dcc65e91e3e1075b60752f1996aa5d7deba6878c6b26bd7405" as const;
export const KERR_V430_ARTIFACT_FILE_SHA256_V431 = "18ac4d640611a6308f7a8275a755cb0d028094e6b734190d4f428065b76fe9c8" as const;
export const KERR_V430_ORACLE_SHA256_V431 = "8c687b293a3b8792767e4ff515932bd31d8e520b28207663e0601ec36b336294" as const;
export const KERR_V430_ORACLE_FILE_SHA256_V431 = "e620adc324a0bdd37075fa0ddbd1e2ba567a414a7dd16f5ce8e3025a38d68ec7" as const;
export const KERR_V430_EVIDENCE_SHA256_V431 = "9717bf3d26c3bd58b2b53dd013f2ae7199d20dea6c16fc432004d025950ca84e" as const;
export const KERR_V430_EVIDENCE_FILE_SHA256_V431 = "d79310afbd221891ec9f50424d9f0ab0e2328b0e7ac19a71cc7a544307fd4d19" as const;
export const KERR_V430_POINTER_SHA256_V431 = "1f3c0458df3205eaa2229ebb2a0fcdf7d0e6fd94eafc763002e576582e355abf" as const;
export const KERR_V430_POINTER_FILE_SHA256_V431 = "64507219eddbb2956d31e4b257bb1d075ea082f0879667e700f3a7bff18bda7e" as const;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
type Matrix = readonly (readonly number[])[];
export type KerrLikelihoodStressScenarioIdV431 = "poisson-nominal" | "negative-binomial-overdispersion" | "correlated-common-mode" | "background-mixture" | "nonparalyzable-dead-time" | "pileup-channel-migration";

export type KerrLikelihoodStressMetricsV431 = Readonly<{
  replicateCount: 256;
  countCellCount: 6144;
  meanPoissonDeviancePerDof: number;
  meanPearsonChiSquarePerDof: number;
  meanVarianceToPoissonRatio: number;
  meanAbsoluteOffDiagonalResidualCorrelation: number;
  poissonPredictiveCoverage90: number;
  poissonPredictiveTailRate: number;
  maximumAbsoluteStandardizedMeanBias: number;
  angleClosureRmsZ: number;
  channelClosureRmsZ: number;
  maximumAbsoluteMeanAngleClosureZ: number;
  maximumAbsoluteMeanChannelClosureZ: number;
}>;

export type KerrLikelihoodStressScenarioV431 = Readonly<{
  id: KerrLikelihoodStressScenarioIdV431;
  stressKind: string;
  poissonAdmissibleByProvenance: boolean;
  requiredLikelihoodFamily: string;
  expectedPoissonDisposition: "retain" | "reject-before-fit";
  calibrationSeed: number;
  holdoutSeed: number;
  calibrationMetrics: KerrLikelihoodStressMetricsV431;
  holdoutMetrics: KerrLikelihoodStressMetricsV431;
  calibrationGatePassed: true;
  holdoutGatePassed: true;
  deterministicReplayPassed: true;
  holdoutCounts: Matrix;
}>;

export type KerrHighEnergyLikelihoodStressOracleV431 = Readonly<{
  version: "v431-kerr-high-energy-likelihood-stress-python-oracle-v1";
  generatedAt: string;
  status: "qualified-simulated-likelihood-stress-discriminator-and-preregistered-routing-firewall-no-measured-authority";
  sourceV430ArtifactSha256: typeof KERR_V430_ARTIFACT_SHA256_V431;
  sourceV430ArtifactFileSha256: typeof KERR_V430_ARTIFACT_FILE_SHA256_V431;
  sourceV430OracleSha256: typeof KERR_V430_ORACLE_SHA256_V431;
  sourceV430OracleFileSha256: typeof KERR_V430_ORACLE_FILE_SHA256_V431;
  prediction: Readonly<{ countCellCount: 24; predictedCounts: readonly number[]; totalPredictiveCovariance: Matrix; poissonPredictiveLower90: readonly number[]; poissonPredictiveUpper90: readonly number[] }>;
  campaign: Readonly<{ seed: 43120260730; scenarioCount: 6; calibrationReplicatesPerScenario: 256; holdoutReplicatesPerScenario: 256; results: readonly KerrLikelihoodStressScenarioV431[] }>;
  counts: Readonly<{ scenarioCount: 6; calibrationReplicateCount: 1536; syntheticHoldoutReplicateCount: 1536; syntheticCountCellCount: 73728; measuredObservedCountCount: 0; measuredHoldoutDatasetCount: 0; measuredValidationRunCount: 0; measuredResidualMetricCount: 0; alternativeLikelihoodImplementationQualifiedCount: 0; scienceResponseApplicationCount: 0 }>;
  qualification: Readonly<Record<string, boolean>>;
  measuredResponseAuthorityGranted: false;
  scienceResponseApplicationCount: 0;
  networkAttempted: false;
  boundary: string;
  artifactSha256: string;
}>;

export type KerrHighEnergyLikelihoodStressContractV431 = Readonly<{
  version: "v431-kerr-high-energy-likelihood-stress-contract-v1";
  status: "preregistered-simulated-stress-routing-contract-ready";
  selectionBasis: "acquisition-provenance-and-preregistered-assumption-state-before-residual-fit";
  postHocLikelihoodSwitchForbidden: true;
  residualDiagnosticsMayAuditButNeverSelectFamily: true;
  scenarioThresholds: Readonly<Record<KerrLikelihoodStressScenarioIdV431, Readonly<Record<string, number>>>>;
  scenarioRouting: readonly Readonly<{ id: KerrLikelihoodStressScenarioIdV431; stressKind: string; poissonAdmissibleByProvenance: boolean; requiredLikelihoodFamily: string; expectedPoissonDisposition: "retain" | "reject-before-fit" }>[];
  alternativeLikelihoodImplementationsQualified: readonly never[];
  measuredObservedCountsRequiredForInstrumentAuthority: true;
  independentMeasuredHoldoutRequired: true;
  measuredAuthorityGranted: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: string;
}>;

export type KerrLikelihoodStressScenarioSummaryV431 = Readonly<{
  id: KerrLikelihoodStressScenarioIdV431;
  stressKind: string;
  poissonAdmissibleByProvenance: boolean;
  requiredLikelihoodFamily: string;
  expectedPoissonDisposition: "retain" | "reject-before-fit";
  calibrationGatePassed: true;
  holdoutGatePassed: true;
  deterministicReplayPassed: true;
  holdoutMetrics: KerrLikelihoodStressMetricsV431;
  maximumPythonRelativeDifference: number;
}>;

export type KerrHighEnergyLikelihoodStressViewV431 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_VERSION_V431;
  status: KerrHighEnergyLikelihoodStressOracleV431["status"];
  source: Readonly<{ v430ArtifactSha256: typeof KERR_V430_ARTIFACT_SHA256_V431; v430OracleSha256: typeof KERR_V430_ORACLE_SHA256_V431; v430EvidenceSha256: typeof KERR_V430_EVIDENCE_SHA256_V431; v430PointerSha256: typeof KERR_V430_POINTER_SHA256_V431 }>;
  campaign: Readonly<{ scenarioCount: 6; calibrationReplicateCount: 1536; syntheticHoldoutReplicateCount: 1536; syntheticCountCellCount: 73728; fixedSeed: 43120260730; independentSyntheticSplit: true }>;
  selection: Readonly<{ basis: KerrHighEnergyLikelihoodStressContractV431["selectionBasis"]; postHocLikelihoodSwitchForbidden: true; residualDiagnosticsMayAuditButNeverSelectFamily: true; nominalPoissonRetained: true; stressedPoissonRoutesRejectedBeforeFit: 5; alternativeLikelihoodImplementationsQualified: 0 }>;
  scenarios: readonly KerrLikelihoodStressScenarioSummaryV431[];
  counts: KerrHighEnergyLikelihoodStressOracleV431["counts"];
  products: Readonly<{ json: "available-stress-summary-and-authority-boundary"; oracle: "available-full-synthetic-holdout-fixture"; contract: "available-preregistered-routing-contract"; csv: "available-six-scenario-diagnostics"; fits: "available-synthetic-stress-summary-no-detector-image"; png: "available-likelihood-stress-map-not-instrument-performance" }>;
  authorityBoundary: Readonly<{ stressGenerationMathAuthorityGranted: true; discriminatorMathAuthorityGranted: true; preregisteredRoutingFirewallAuthorityGranted: true; nominalPoissonRecoveryAuthorityGranted: true; alternativeLikelihoodImplementationAuthorityGranted: false; fixturePerformanceAuthorityGranted: false; measuredLikelihoodAuthorityGranted: false; measuredInstrumentPerformanceAuthorityGranted: false; measuredResponseAuthorityGranted: false; scienceProjectionAuthorityGranted: false; detectorAuthorityGranted: false; denseAuthorityGranted: false; unavailableIsNotZero: true }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: string;
}>;

export type KerrHighEnergyLikelihoodStressArtifactV431 = Readonly<{ version: typeof KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_ARTIFACT_VERSION_V431; generatedAt: string; status: KerrHighEnergyLikelihoodStressViewV431["status"]; sourceFiles: Readonly<{ v430ArtifactFileSha256: typeof KERR_V430_ARTIFACT_FILE_SHA256_V431; v430OracleFileSha256: typeof KERR_V430_ORACLE_FILE_SHA256_V431; v430EvidenceFileSha256: typeof KERR_V430_EVIDENCE_FILE_SHA256_V431; v430PointerFileSha256: typeof KERR_V430_POINTER_FILE_SHA256_V431; pythonOracleFileSha256: string; stressContractFileSha256: string }>; pythonOracleArtifactSha256: string; view: KerrHighEnergyLikelihoodStressViewV431; deterministicReplay: true; networkAttempted: false; denseShardExecuted: false; measuredObservedCountsPresent: false; measuredHoldoutPresent: false; measuredValidationRunCount: 0; scienceResponseApplicationCount: 0; artifactSha256: string }>;
export type KerrHighEnergyLikelihoodStressSummaryV431 = Readonly<{ version: typeof KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_SUMMARY_VERSION_V431; status: KerrHighEnergyLikelihoodStressViewV431["status"]; artifactSha256: string; campaign: KerrHighEnergyLikelihoodStressViewV431["campaign"]; selection: KerrHighEnergyLikelihoodStressViewV431["selection"]; scenarios: KerrHighEnergyLikelihoodStressViewV431["scenarios"]; counts: KerrHighEnergyLikelihoodStressViewV431["counts"]; products: KerrHighEnergyLikelihoodStressViewV431["products"]; authorityBoundary: KerrHighEnergyLikelihoodStressViewV431["authorityBoundary"]; denseCampaignStatus: "incomplete-0-of-49"; fullArtifactAvailable: true; boundary: "bounded-six-scenario-stress-metrics-and-routing-authority-no-holdout-count-arrays-or-covariance-in-react-state" }>;
export type KerrHighEnergyLikelihoodStressApiV431 = Readonly<{ version: typeof KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_API_VERSION_V431; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrHighEnergyLikelihoodStressSummaryV431 | null }>;

function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !TRANSIENT.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)])); }
export const canonicalShaV431 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const maximumRelativeDifference = (left: unknown, right: unknown): number => { if (typeof left === "number" && typeof right === "number") return Math.abs(left - right) / Math.max(1, Math.abs(right)); if (Array.isArray(left) && Array.isArray(right) && left.length === right.length) return Math.max(0, ...left.map((entry, index) => maximumRelativeDifference(entry, right[index]))); if (left && right && typeof left === "object" && right && typeof right === "object") { const a = left as Record<string, unknown>, b = right as Record<string, unknown>, keys = Object.keys(a); if (keys.length !== Object.keys(b).length || keys.some((key) => !Object.hasOwn(b, key))) return Number.POSITIVE_INFINITY; return Math.max(0, ...keys.map((key) => maximumRelativeDifference(a[key], b[key]))); } return left === right ? 0 : Number.POSITIVE_INFINITY; };

export function computeKerrLikelihoodStressMetricsV431(counts: Matrix, mean: readonly number[], covariance: Matrix, lower: readonly number[], upper: readonly number[]): KerrLikelihoodStressMetricsV431 {
  if (counts.length !== 256 || counts.some((row) => row.length !== 24 || row.some((value) => !Number.isSafeInteger(value) || value < 0)) || mean.length !== 24 || covariance.length !== 24 || covariance.some((row) => row.length !== 24) || lower.length !== 24 || upper.length !== 24) throw new Error("v431-stress-shape");
  const replicates = counts.length, columns = mean.length;
  const empiricalMean = mean.map((_, column) => counts.reduce((sum, row) => sum + row[column], 0) / replicates);
  const empiricalVariance = mean.map((_, column) => counts.reduce((sum, row) => sum + (row[column] - empiricalMean[column]) ** 2, 0) / (replicates - 1));
  const residual = counts.map((row) => row.map((value, column) => value - mean[column]));
  const pearson = residual.map((row) => row.reduce((sum, value, column) => sum + value * value / mean[column], 0) / columns);
  const deviance = counts.map((row, rowIndex) => row.reduce((sum, value, column) => sum + (value > 0 ? 2 * (value * Math.log(value / mean[column]) - residual[rowIndex][column]) : 2 * mean[column]), 0) / columns);
  let correlationTotal = 0, correlationCount = 0;
  for (let left = 0; left < columns; left += 1) for (let right = 0; right < columns; right += 1) if (left !== right) {
    const covarianceValue = residual.reduce((sum, row) => sum + (row[left] - (empiricalMean[left] - mean[left])) * (row[right] - (empiricalMean[right] - mean[right])), 0) / (replicates - 1);
    correlationTotal += Math.abs(covarianceValue / Math.sqrt(empiricalVariance[left] * empiricalVariance[right])); correlationCount += 1;
  }
  const coverage = counts.reduce((total, row) => total + row.filter((value, column) => value >= lower[column] && value <= upper[column]).length, 0) / (replicates * columns);
  const groups = {
    angle: Array.from({ length: 4 }, (_, angle) => Array.from({ length: 6 }, (_, channel) => angle * 6 + channel)),
    channel: Array.from({ length: 6 }, (_, channel) => Array.from({ length: 4 }, (_, angle) => angle * 6 + channel)),
  };
  const closure = (entries: readonly (readonly number[])[]) => {
    const values: number[] = [], means: number[] = [];
    entries.forEach((indices) => {
      let variance = 0; indices.forEach((row) => indices.forEach((column) => { variance += covariance[row][column]; }));
      const z = residual.map((row) => indices.reduce((sum, index) => sum + row[index], 0) / Math.sqrt(variance));
      values.push(...z); means.push(z.reduce((sum, value) => sum + value, 0) / z.length);
    });
    return { rms: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length), maximumMean: Math.max(...means.map(Math.abs)) };
  };
  const angle = closure(groups.angle), channel = closure(groups.channel);
  return Object.freeze({ replicateCount: 256, countCellCount: 6144, meanPoissonDeviancePerDof: deviance.reduce((sum, value) => sum + value, 0) / replicates, meanPearsonChiSquarePerDof: pearson.reduce((sum, value) => sum + value, 0) / replicates, meanVarianceToPoissonRatio: empiricalVariance.reduce((sum, value, index) => sum + value / mean[index], 0) / columns, meanAbsoluteOffDiagonalResidualCorrelation: correlationTotal / correlationCount, poissonPredictiveCoverage90: coverage, poissonPredictiveTailRate: 1 - coverage, maximumAbsoluteStandardizedMeanBias: Math.max(...empiricalMean.map((value, index) => Math.abs(value - mean[index]) / Math.sqrt(mean[index]))), angleClosureRmsZ: angle.rms, channelClosureRmsZ: channel.rms, maximumAbsoluteMeanAngleClosureZ: angle.maximumMean, maximumAbsoluteMeanChannelClosureZ: channel.maximumMean });
}

function gateScenarioV431(id: KerrLikelihoodStressScenarioIdV431, metrics: KerrLikelihoodStressMetricsV431, thresholds: KerrHighEnergyLikelihoodStressContractV431["scenarioThresholds"]): boolean {
  return Object.entries(thresholds[id]).every(([key, limit]) => { const metricName = key.replace(/(?:Minimum|Maximum)$/, "") as keyof KerrLikelihoodStressMetricsV431, value = Number(metrics[metricName]); return key.endsWith("Minimum") ? value >= limit : value <= limit; });
}

export function parseKerrHighEnergyLikelihoodStressOracleV431(value: unknown): KerrHighEnergyLikelihoodStressOracleV431 { const source = value as Partial<KerrHighEnergyLikelihoodStressOracleV431> | null; if (!source || source.version !== "v431-kerr-high-energy-likelihood-stress-python-oracle-v1" || source.status !== "qualified-simulated-likelihood-stress-discriminator-and-preregistered-routing-firewall-no-measured-authority" || source.sourceV430ArtifactSha256 !== KERR_V430_ARTIFACT_SHA256_V431 || source.sourceV430ArtifactFileSha256 !== KERR_V430_ARTIFACT_FILE_SHA256_V431 || source.sourceV430OracleSha256 !== KERR_V430_ORACLE_SHA256_V431 || source.sourceV430OracleFileSha256 !== KERR_V430_ORACLE_FILE_SHA256_V431 || source.campaign?.scenarioCount !== 6 || source.campaign.results?.length !== 6 || source.counts?.syntheticCountCellCount !== 73728 || source.counts.measuredObservedCountCount !== 0 || source.counts.measuredHoldoutDatasetCount !== 0 || source.counts.measuredResidualMetricCount !== 0 || source.counts.measuredValidationRunCount !== 0 || source.counts.alternativeLikelihoodImplementationQualifiedCount !== 0 || source.qualification?.preregisteredRoutingFirewallQualified !== true || source.qualification.alternativeLikelihoodImplementationQualified !== false || source.qualification.measuredLikelihoodQualified !== false || source.measuredResponseAuthorityGranted !== false || source.scienceResponseApplicationCount !== 0 || source.networkAttempted !== false || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v431-oracle-identity"); return value as KerrHighEnergyLikelihoodStressOracleV431; }

export function createKerrHighEnergyLikelihoodStressViewV431(oracleValue: unknown, contract: KerrHighEnergyLikelihoodStressContractV431): KerrHighEnergyLikelihoodStressViewV431 {
  const oracle = parseKerrHighEnergyLikelihoodStressOracleV431(oracleValue);
  if (contract.version !== "v431-kerr-high-energy-likelihood-stress-contract-v1" || contract.status !== "preregistered-simulated-stress-routing-contract-ready" || contract.selectionBasis !== "acquisition-provenance-and-preregistered-assumption-state-before-residual-fit" || contract.postHocLikelihoodSwitchForbidden !== true || contract.residualDiagnosticsMayAuditButNeverSelectFamily !== true || contract.scenarioRouting.length !== 6 || contract.alternativeLikelihoodImplementationsQualified.length !== 0 || contract.measuredAuthorityGranted !== false || contract.formalProductPointer !== "v263" || contract.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v431-contract");
  const scenarios = oracle.campaign.results.map((scenario) => {
    const metrics = computeKerrLikelihoodStressMetricsV431(scenario.holdoutCounts, oracle.prediction.predictedCounts, oracle.prediction.totalPredictiveCovariance, oracle.prediction.poissonPredictiveLower90, oracle.prediction.poissonPredictiveUpper90);
    const difference = maximumRelativeDifference(metrics, scenario.holdoutMetrics);
    if (difference >= 1e-8 || !gateScenarioV431(scenario.id, metrics, contract.scenarioThresholds) || scenario.calibrationGatePassed !== true || scenario.holdoutGatePassed !== true || scenario.deterministicReplayPassed !== true) throw new Error(`v431-scenario-cross-validation:${scenario.id}:${difference}`);
    return Object.freeze({ id: scenario.id, stressKind: scenario.stressKind, poissonAdmissibleByProvenance: scenario.poissonAdmissibleByProvenance, requiredLikelihoodFamily: scenario.requiredLikelihoodFamily, expectedPoissonDisposition: scenario.expectedPoissonDisposition, calibrationGatePassed: true as const, holdoutGatePassed: true as const, deterministicReplayPassed: true as const, holdoutMetrics: metrics, maximumPythonRelativeDifference: difference });
  });
  if (scenarios.filter((scenario) => scenario.expectedPoissonDisposition === "retain").length !== 1 || scenarios.filter((scenario) => scenario.expectedPoissonDisposition === "reject-before-fit").length !== 5) throw new Error("v431-routing-count");
  return Object.freeze({ version: KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_VERSION_V431, status: oracle.status, source: Object.freeze({ v430ArtifactSha256: KERR_V430_ARTIFACT_SHA256_V431, v430OracleSha256: KERR_V430_ORACLE_SHA256_V431, v430EvidenceSha256: KERR_V430_EVIDENCE_SHA256_V431, v430PointerSha256: KERR_V430_POINTER_SHA256_V431 }), campaign: Object.freeze({ scenarioCount: 6 as const, calibrationReplicateCount: 1536 as const, syntheticHoldoutReplicateCount: 1536 as const, syntheticCountCellCount: 73728 as const, fixedSeed: 43120260730 as const, independentSyntheticSplit: true as const }), selection: Object.freeze({ basis: contract.selectionBasis, postHocLikelihoodSwitchForbidden: true as const, residualDiagnosticsMayAuditButNeverSelectFamily: true as const, nominalPoissonRetained: true as const, stressedPoissonRoutesRejectedBeforeFit: 5 as const, alternativeLikelihoodImplementationsQualified: 0 as const }), scenarios: Object.freeze(scenarios), counts: oracle.counts, products: Object.freeze({ json: "available-stress-summary-and-authority-boundary" as const, oracle: "available-full-synthetic-holdout-fixture" as const, contract: "available-preregistered-routing-contract" as const, csv: "available-six-scenario-diagnostics" as const, fits: "available-synthetic-stress-summary-no-detector-image" as const, png: "available-likelihood-stress-map-not-instrument-performance" as const }), authorityBoundary: Object.freeze({ stressGenerationMathAuthorityGranted: true as const, discriminatorMathAuthorityGranted: true as const, preregisteredRoutingFirewallAuthorityGranted: true as const, nominalPoissonRecoveryAuthorityGranted: true as const, alternativeLikelihoodImplementationAuthorityGranted: false as const, fixturePerformanceAuthorityGranted: false as const, measuredLikelihoodAuthorityGranted: false as const, measuredInstrumentPerformanceAuthorityGranted: false as const, measuredResponseAuthorityGranted: false as const, scienceProjectionAuthorityGranted: false as const, detectorAuthorityGranted: false as const, denseAuthorityGranted: false as const, unavailableIsNotZero: true as const }), denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", boundary: "simulated-likelihood-stress-discrimination-and-preregistered-routing-firewall-only-no-qualified-alternative-likelihood-measured-goodness-of-fit-instrument-performance-science-response-or-dense-authority" });
}

export function parseKerrHighEnergyLikelihoodStressArtifactV431(value: unknown): KerrHighEnergyLikelihoodStressArtifactV431 { const source = value as Partial<KerrHighEnergyLikelihoodStressArtifactV431> | null, view = source?.view; if (!source || source.version !== KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_ARTIFACT_VERSION_V431 || source.status !== "qualified-simulated-likelihood-stress-discriminator-and-preregistered-routing-firewall-no-measured-authority" || source.sourceFiles?.v430ArtifactFileSha256 !== KERR_V430_ARTIFACT_FILE_SHA256_V431 || source.sourceFiles.v430OracleFileSha256 !== KERR_V430_ORACLE_FILE_SHA256_V431 || source.sourceFiles.v430EvidenceFileSha256 !== KERR_V430_EVIDENCE_FILE_SHA256_V431 || source.sourceFiles.v430PointerFileSha256 !== KERR_V430_POINTER_FILE_SHA256_V431 || !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") || !SHA.test(source.sourceFiles.stressContractFileSha256 ?? "") || !SHA.test(source.pythonOracleArtifactSha256 ?? "") || view?.campaign.scenarioCount !== 6 || view.scenarios.length !== 6 || view.counts.measuredObservedCountCount !== 0 || view.counts.measuredValidationRunCount !== 0 || view.counts.alternativeLikelihoodImplementationQualifiedCount !== 0 || view.authorityBoundary.alternativeLikelihoodImplementationAuthorityGranted !== false || view.authorityBoundary.measuredInstrumentPerformanceAuthorityGranted !== false || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.measuredObservedCountsPresent !== false || source.measuredHoldoutPresent !== false || source.measuredValidationRunCount !== 0 || source.scienceResponseApplicationCount !== 0 || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v431-artifact-identity"); return value as KerrHighEnergyLikelihoodStressArtifactV431; }
export function createKerrHighEnergyLikelihoodStressSummaryV431(value: unknown): KerrHighEnergyLikelihoodStressSummaryV431 { const artifact = parseKerrHighEnergyLikelihoodStressArtifactV431(value), view = artifact.view; return Object.freeze({ version: KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_SUMMARY_VERSION_V431, status: view.status, artifactSha256: artifact.artifactSha256, campaign: view.campaign, selection: view.selection, scenarios: view.scenarios, counts: view.counts, products: view.products, authorityBoundary: view.authorityBoundary, denseCampaignStatus: view.denseCampaignStatus, fullArtifactAvailable: true, boundary: "bounded-six-scenario-stress-metrics-and-routing-authority-no-holdout-count-arrays-or-covariance-in-react-state" }); }
export function parseKerrHighEnergyLikelihoodStressApiV431(value: unknown): KerrHighEnergyLikelihoodStressApiV431 { const source = value as Partial<KerrHighEnergyLikelihoodStressApiV431> | null; if (!source || source.version !== KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_API_VERSION_V431) throw new Error("v431-api-version"); if (source.available === true && source.reason === "ready" && source.summary) { if (source.summary.version !== KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_SUMMARY_VERSION_V431 || !SHA.test(source.summary.artifactSha256) || source.summary.counts.measuredObservedCountCount !== 0 || source.summary.counts.alternativeLikelihoodImplementationQualifiedCount !== 0 || source.summary.authorityBoundary.measuredInstrumentPerformanceAuthorityGranted !== false || Object.hasOwn(source.summary, "holdoutCounts") || Object.hasOwn(source.summary, "totalPredictiveCovariance")) throw new Error("v431-api-summary"); return source as KerrHighEnergyLikelihoodStressApiV431; } if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrHighEnergyLikelihoodStressApiV431; throw new Error("v431-api-identity"); }
