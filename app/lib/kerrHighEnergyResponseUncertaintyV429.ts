import { createHash } from "node:crypto";

export const KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_VERSION_V429 = "v429-kerr-high-energy-response-uncertainty-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_ARTIFACT_VERSION_V429 = "v429-kerr-high-energy-response-uncertainty-artifact-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_SUMMARY_VERSION_V429 = "v429-kerr-high-energy-response-uncertainty-summary-v1" as const;
export const KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_API_VERSION_V429 = "v429-kerr-high-energy-response-uncertainty-api-v1" as const;
export const KERR_V428_ARTIFACT_SHA256_V429 = "38ddd6aa601cf6bba5ccb2a05195de51d7cf031704323959284ffc30dcdc82fb" as const;
export const KERR_V428_ARTIFACT_FILE_SHA256_V429 = "d1ddacbb369610f58f261ed1502f869883cfd09c8bd50e8065f6cdbc9f7899c5" as const;
export const KERR_V428_EVIDENCE_SHA256_V429 = "f7060891da5ba789d42d7b63438466218221c892ace15538a864c5887041efef" as const;
export const KERR_V428_EVIDENCE_FILE_SHA256_V429 = "bfce176d0e1912e853134696f06fefe3a4a32f746a82992a74c01fa17c46cb7f" as const;
export const KERR_V428_POINTER_SHA256_V429 = "573f87a0e428166ffa64a277a21c7f64f013d9e1de8fb3bba23bad7672538ce8" as const;
export const KERR_V428_POINTER_FILE_SHA256_V429 = "94bcdf5a05cb60b7a724b22e11c1bee179650e33391364d4352374157dfafb5d" as const;
export const KERR_V426_RESPONSE_ARTIFACT_SHA256_V429 = "17de5699cef0619dc3ea165ede2d05828ec55bfd3b9cc09a12d24e4c35637c44" as const;
export const KERR_V426_RESPONSE_FILE_SHA256_V429 = "03158769935c494638445adde9689ef94fc3199eefe6db4afd0ec6a824222061" as const;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
type Matrix = readonly (readonly number[])[];

export type KerrHighEnergyResponseUncertaintyFixtureV429 = Readonly<{
  version: "v429-kerr-high-energy-response-uncertainty-fixture-v1";
  sourceKind: "test-fixture-nonpublishable";
  photonFluxPerM2S: readonly number[];
  normalizedStokesQ: readonly number[];
  normalizedStokesU: readonly number[];
  analyzerAnglesDeg: readonly number[];
  exposureTimeS: number;
  responseParameters: readonly number[];
  responseParameterCovariance: Matrix;
  redistributionMatrix: Matrix;
  redistributionRowCovariances: readonly Matrix[];
  observedCounts: null;
  holdoutDataset: null;
  measuredAuthorityGranted: false;
}>;

export type KerrHighEnergyResponseUncertaintyMetricsV429 = Readonly<{
  maximumAnalyticComplexStepParameterJacobianDifference: number;
  maximumAnalyticComplexStepRedistributionJacobianDifference: number;
  maximumOutputCovarianceSymmetryAbsolute: number;
  minimumOutputCovarianceEigenvalue: number;
  maximumCovarianceDecompositionResidual: number;
  minimumPredictedCount: number;
  maximumPredictedCount: number;
  maximumDeterministicReplayDifference: number;
}>;

export type KerrHighEnergyResponseUncertaintyOracleV429 = Readonly<{
  version: "v429-kerr-high-energy-response-uncertainty-python-oracle-v1";
  generatedAt: string;
  status: "qualified-forward-operator-jacobian-and-covariance-fixture-only-no-measured-validation";
  sourceV426ResponseArtifactSha256: typeof KERR_V426_RESPONSE_ARTIFACT_SHA256_V429;
  sourceV426ResponseFileSha256: typeof KERR_V426_RESPONSE_FILE_SHA256_V429;
  sourceV428IntakeArtifactSha256: typeof KERR_V428_ARTIFACT_SHA256_V429;
  sourceV428IntakeFileSha256: typeof KERR_V428_ARTIFACT_FILE_SHA256_V429;
  fixture: KerrHighEnergyResponseUncertaintyFixtureV429;
  expected: Readonly<{
    predictedCounts: readonly number[];
    parameterJacobian: Matrix;
    redistributionJacobians: readonly Matrix[];
    parameterCovarianceContribution: Matrix;
    redistributionCovarianceContribution: Matrix;
    totalCovariance: Matrix;
    metrics: KerrHighEnergyResponseUncertaintyMetricsV429;
  }>;
  counts: Readonly<{ energyBinCount: 6; detectorChannelCount: 6; analyzerAngleCount: 4; predictedCountCount: 24; responseParameterCount: 24; redistributionParameterCount: 36; observedCountCount: 0; holdoutDatasetCount: 0; scienceResponseApplicationCount: 0 }>;
  qualification: Readonly<{ forwardOperatorQualified: true; analyticParameterJacobianQualifiedByComplexStep: true; analyticRedistributionJacobianQualifiedByComplexStep: true; covariancePropagationQualified: true; covarianceDecompositionQualified: true; measuredResponseValidationQualified: false; residualClosureQualified: false; scienceResponseApplicationQualified: false }>;
  measuredResponseAuthorityGranted: false;
  independentScientificValidationStatus: "not-run-no-measured-holdout";
  scienceResponseApplicationCount: 0;
  networkAttempted: false;
  boundary: string;
  artifactSha256: string;
}>;

export type KerrHighEnergyResponseValidationProtocolV429 = Readonly<{
  version: "v429-kerr-high-energy-response-independent-validation-protocol-v1";
  status: "protocol-ready-awaiting-independent-measured-holdout";
  responseIdentityRequired: readonly string[];
  holdoutIndependenceRequired: Readonly<Record<string, boolean>>;
  requiredObservationFields: readonly string[];
  validationStages: readonly string[];
  thresholdPolicy: Readonly<Record<string, boolean>>;
  admission: Readonly<{ structuralIntakePassAloneInsufficient: true; fixturePerformanceNeverAdmissible: true; allHoldoutStagesMustPass: true; negativeEvidencePreserved: true; automaticRetryForbidden: true; measuredAuthorityGranted: false; currentStatus: "not-run-no-measured-holdout" }>;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: string;
}>;

export type KerrHighEnergyResponseUncertaintyComputationV429 = Readonly<{
  predictedCounts: readonly number[];
  parameterJacobian: Matrix;
  redistributionJacobians: readonly Matrix[];
  parameterCovarianceContribution: Matrix;
  redistributionCovarianceContribution: Matrix;
  totalCovariance: Matrix;
  metrics: Readonly<{
    maximumPythonRelativeDifference: number;
    maximumOutputCovarianceSymmetryAbsolute: number;
    maximumCovarianceDecompositionResidual: number;
    minimumPredictedCount: number;
    maximumPredictedCount: number;
  }>;
}>;

export type KerrHighEnergyResponseUncertaintyViewV429 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_VERSION_V429;
  status: "qualified-forward-operator-jacobian-and-covariance-fixture-only-independent-measured-validation-unavailable";
  source: Readonly<{ v426ResponseArtifactSha256: typeof KERR_V426_RESPONSE_ARTIFACT_SHA256_V429; v428IntakeArtifactSha256: typeof KERR_V428_ARTIFACT_SHA256_V429; v428EvidenceSha256: typeof KERR_V428_EVIDENCE_SHA256_V429; v428PointerSha256: typeof KERR_V428_POINTER_SHA256_V429 }>;
  model: Readonly<{ analyzerAngleCount: 4; energyBinCount: 6; detectorChannelCount: 6; responseParameterCount: 24; redistributionParameterCount: 36; predictedCountCount: 24; forwardEquation: "exposure-times-flux-area-polarimetric-modulation-redistribution-plus-background"; covarianceEquation: "J-response-C-response-JT-plus-sum-J-redistribution-C-redistribution-JT" }>;
  fixture: Readonly<{ status: "validated-nonpublishable-mathematical-fixture"; observedCountsPresent: false; holdoutDatasetPresent: false; predictedCountCount: 24; parameterJacobianShape: readonly [24, 24]; redistributionJacobianShape: readonly [6, 24, 6]; outputCovarianceShape: readonly [24, 24]; metrics: KerrHighEnergyResponseUncertaintyMetricsV429; maximumPythonRelativeDifference: number }>;
  protocol: Readonly<{ status: "protocol-ready-awaiting-independent-measured-holdout"; requiredObservationFieldCount: number; validationStageCount: number; holdoutDisjointnessRequired: true; preregistrationRequired: true; postHocThresholdTuningForbidden: true; independentScientificValidationStatus: "not-run-no-measured-holdout" }>;
  counts: Readonly<{ fixturePredictionCount: 24; observedCountCount: 0; measuredHoldoutDatasetCount: 0; measuredValidationRunCount: 0; residualMetricCount: 0; measuredResponseAuthorityCount: 0; scienceResponseApplicationCount: 0 }>;
  products: Readonly<{ json: "available-fixture-math-and-protocol"; csv: "available-prediction-and-uncertainty-diagonal-fixture-only"; fits: "available-covariance-budget-fixture-only"; png: "available-uncertainty-architecture-not-detector-image"; measuredValidationReport: "unavailable-no-holdout" }>;
  authorityBoundary: Readonly<{ forwardOperatorAuthorityGranted: true; analyticJacobianAuthorityGranted: true; covariancePropagationAuthorityGranted: true; fixturePerformanceAuthorityGranted: false; measuredResponseValidationGranted: false; measuredResponseAuthorityGranted: false; residualClosureAuthorityGranted: false; scienceProjectionAuthorityGranted: false; detectorAuthorityGranted: false; pixelRasterAuthorityGranted: false; denseAuthorityGranted: false; unavailableIsNotZero: true }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "response-forward-operator-jacobians-covariance-and-validation-protocol-only-no-observed-counts-holdout-residuals-measured-authority-science-projection-or-dense-authority";
}>;

export type KerrHighEnergyResponseUncertaintyArtifactV429 = Readonly<{
  version: typeof KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_ARTIFACT_VERSION_V429;
  generatedAt: string;
  status: KerrHighEnergyResponseUncertaintyViewV429["status"];
  sourceFiles: Readonly<{ v426ResponseFileSha256: typeof KERR_V426_RESPONSE_FILE_SHA256_V429; v428IntakeFileSha256: typeof KERR_V428_ARTIFACT_FILE_SHA256_V429; v428EvidenceFileSha256: typeof KERR_V428_EVIDENCE_FILE_SHA256_V429; v428PointerFileSha256: typeof KERR_V428_POINTER_FILE_SHA256_V429; pythonOracleFileSha256: string; validationProtocolFileSha256: string }>;
  pythonOracleArtifactSha256: string;
  view: KerrHighEnergyResponseUncertaintyViewV429;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  observedCountsPresent: false;
  measuredHoldoutPresent: false;
  measuredValidationRunCount: 0;
  scienceResponseApplicationCount: 0;
  artifactSha256: string;
}>;

export type KerrHighEnergyResponseUncertaintySummaryV429 = Readonly<{ version: typeof KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_SUMMARY_VERSION_V429; status: KerrHighEnergyResponseUncertaintyViewV429["status"]; artifactSha256: string; model: KerrHighEnergyResponseUncertaintyViewV429["model"]; fixture: KerrHighEnergyResponseUncertaintyViewV429["fixture"]; protocol: KerrHighEnergyResponseUncertaintyViewV429["protocol"]; counts: KerrHighEnergyResponseUncertaintyViewV429["counts"]; products: KerrHighEnergyResponseUncertaintyViewV429["products"]; authorityBoundary: KerrHighEnergyResponseUncertaintyViewV429["authorityBoundary"]; denseCampaignStatus: "incomplete-0-of-49"; fullArtifactAvailable: true; boundary: "bounded-forward-operator-metrics-protocol-and-authority-summary-no-jacobian-covariance-or-fixture-arrays-in-react-state" }>;
export type KerrHighEnergyResponseUncertaintyApiV429 = Readonly<{ version: typeof KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_API_VERSION_V429; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrHighEnergyResponseUncertaintySummaryV429 | null }>;

function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !TRANSIENT.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
export const canonicalShaV429 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const finite = (values: readonly number[]) => values.every(Number.isFinite);
const zeros = (rows: number, columns: number): number[][] => Array.from({ length: rows }, () => Array(columns).fill(0));
function matrixMultiply(left: Matrix, right: Matrix): number[][] { const output = zeros(left.length, right[0].length); for (let row = 0; row < left.length; row += 1) for (let inner = 0; inner < right.length; inner += 1) for (let column = 0; column < right[0].length; column += 1) output[row][column] += left[row][inner] * right[inner][column]; return output; }
const transpose = (matrix: Matrix): number[][] => matrix[0].map((_, column) => matrix.map((row) => row[column]));
const add = (left: Matrix, right: Matrix): number[][] => left.map((row, i) => row.map((value, j) => value + right[i][j]));
const maximumAbsolute = (matrix: Matrix): number => Math.max(0, ...matrix.flatMap((row) => row.map(Math.abs)));
const maximumRelativeDifference = (left: unknown, right: unknown): number => {
  if (typeof left === "number" && typeof right === "number") return Math.abs(left - right) / Math.max(1, Math.abs(right));
  if (Array.isArray(left) && Array.isArray(right) && left.length === right.length) return Math.max(0, ...left.map((entry, index) => maximumRelativeDifference(entry, right[index])));
  return left === right ? 0 : Number.POSITIVE_INFINITY;
};

export function computeKerrHighEnergyResponseUncertaintyV429(fixture: KerrHighEnergyResponseUncertaintyFixtureV429, expected: KerrHighEnergyResponseUncertaintyOracleV429["expected"]): KerrHighEnergyResponseUncertaintyComputationV429 {
  const flux = fixture.photonFluxPerM2S, q = fixture.normalizedStokesQ, u = fixture.normalizedStokesU, angles = fixture.analyzerAnglesDeg, exposure = fixture.exposureTimeS, parameters = fixture.responseParameters, redistribution = fixture.redistributionMatrix;
  if ([flux, q, u].some((entry) => entry.length !== 6 || !finite(entry)) || angles.length !== 4 || !finite(angles) || parameters.length !== 24 || !finite(parameters) || redistribution.length !== 6 || redistribution.some((row) => row.length !== 6 || !finite(row)) || fixture.responseParameterCovariance.length !== 24 || fixture.responseParameterCovariance.some((row) => row.length !== 24 || !finite(row)) || fixture.redistributionRowCovariances.length !== 6 || fixture.redistributionRowCovariances.some((matrix) => matrix.length !== 6 || matrix.some((row) => row.length !== 6 || !finite(row))) || !(exposure > 0) || q.some((value, index) => Math.hypot(value, u[index]) >= 1)) throw new Error("v429-fixture-shape");
  const area = parameters.slice(0, 6), modulation = parameters.slice(6, 12), angleZero = parameters.slice(12, 18), background = parameters.slice(18, 24);
  const predictedCounts: number[] = [];
  const parameterJacobian = zeros(24, 24);
  const redistributionJacobians = Array.from({ length: 6 }, () => zeros(24, 6));
  const radiansPerDegree = Math.PI / 180;
  angles.forEach((angle, angleIndex) => {
    const phase = angleZero.map((zero) => 2 * radiansPerDegree * (angle - zero));
    const polarizedTerm = phase.map((value, bin) => q[bin] * Math.cos(value) + u[bin] * Math.sin(value));
    const modulationFactor = polarizedTerm.map((value, bin) => 1 + modulation[bin] * value);
    for (let channel = 0; channel < 6; channel += 1) {
      const outputIndex = angleIndex * 6 + channel;
      let countRate = background[channel];
      for (let bin = 0; bin < 6; bin += 1) {
        countRate += flux[bin] * area[bin] * modulationFactor[bin] * redistribution[bin][channel];
        const common = exposure * flux[bin] * redistribution[bin][channel];
        parameterJacobian[outputIndex][bin] = common * modulationFactor[bin];
        parameterJacobian[outputIndex][6 + bin] = common * area[bin] * polarizedTerm[bin];
        const angleDerivative = modulation[bin] * 2 * radiansPerDegree * (q[bin] * Math.sin(phase[bin]) - u[bin] * Math.cos(phase[bin]));
        parameterJacobian[outputIndex][12 + bin] = common * area[bin] * angleDerivative;
        redistributionJacobians[bin][outputIndex][channel] = exposure * flux[bin] * area[bin] * modulationFactor[bin];
      }
      parameterJacobian[outputIndex][18 + channel] = exposure;
      predictedCounts.push(exposure * countRate);
    }
  });
  const parameterCovarianceContribution = matrixMultiply(matrixMultiply(parameterJacobian, fixture.responseParameterCovariance), transpose(parameterJacobian));
  let redistributionCovarianceContribution = zeros(24, 24);
  for (let bin = 0; bin < 6; bin += 1) redistributionCovarianceContribution = add(redistributionCovarianceContribution, matrixMultiply(matrixMultiply(redistributionJacobians[bin], fixture.redistributionRowCovariances[bin]), transpose(redistributionJacobians[bin])));
  const totalCovariance = add(parameterCovarianceContribution, redistributionCovarianceContribution);
  const symmetry = maximumAbsolute(totalCovariance.map((row, i) => row.map((value, j) => value - totalCovariance[j][i])));
  const decompositionResidual = maximumAbsolute(totalCovariance.map((row, i) => row.map((value, j) => value - parameterCovarianceContribution[i][j] - redistributionCovarianceContribution[i][j])));
  const relativeDifference = Math.max(maximumRelativeDifference(predictedCounts, expected.predictedCounts), maximumRelativeDifference(parameterJacobian, expected.parameterJacobian), maximumRelativeDifference(redistributionJacobians, expected.redistributionJacobians), maximumRelativeDifference(parameterCovarianceContribution, expected.parameterCovarianceContribution), maximumRelativeDifference(redistributionCovarianceContribution, expected.redistributionCovarianceContribution), maximumRelativeDifference(totalCovariance, expected.totalCovariance));
  if (relativeDifference >= 1e-12 || symmetry >= 1e-6 || decompositionResidual >= 1e-6 || predictedCounts.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error(`v429-computation-gate:${JSON.stringify({ relativeDifference, symmetry, decompositionResidual })}`);
  return Object.freeze({ predictedCounts: Object.freeze(predictedCounts), parameterJacobian: Object.freeze(parameterJacobian.map((row) => Object.freeze(row))), redistributionJacobians: Object.freeze(redistributionJacobians.map((matrix) => Object.freeze(matrix.map((row) => Object.freeze(row))))), parameterCovarianceContribution: Object.freeze(parameterCovarianceContribution.map((row) => Object.freeze(row))), redistributionCovarianceContribution: Object.freeze(redistributionCovarianceContribution.map((row) => Object.freeze(row))), totalCovariance: Object.freeze(totalCovariance.map((row) => Object.freeze(row))), metrics: Object.freeze({ maximumPythonRelativeDifference: relativeDifference, maximumOutputCovarianceSymmetryAbsolute: symmetry, maximumCovarianceDecompositionResidual: decompositionResidual, minimumPredictedCount: Math.min(...predictedCounts), maximumPredictedCount: Math.max(...predictedCounts) }) });
}

export function parseKerrHighEnergyResponseUncertaintyOracleV429(value: unknown): KerrHighEnergyResponseUncertaintyOracleV429 {
  const source = value as Partial<KerrHighEnergyResponseUncertaintyOracleV429> | null;
  if (!source || source.version !== "v429-kerr-high-energy-response-uncertainty-python-oracle-v1" || source.status !== "qualified-forward-operator-jacobian-and-covariance-fixture-only-no-measured-validation" || source.sourceV426ResponseArtifactSha256 !== KERR_V426_RESPONSE_ARTIFACT_SHA256_V429 || source.sourceV426ResponseFileSha256 !== KERR_V426_RESPONSE_FILE_SHA256_V429 || source.sourceV428IntakeArtifactSha256 !== KERR_V428_ARTIFACT_SHA256_V429 || source.sourceV428IntakeFileSha256 !== KERR_V428_ARTIFACT_FILE_SHA256_V429 || source.fixture?.sourceKind !== "test-fixture-nonpublishable" || source.fixture.observedCounts !== null || source.fixture.holdoutDataset !== null || source.counts?.predictedCountCount !== 24 || source.counts.observedCountCount !== 0 || source.counts.holdoutDatasetCount !== 0 || source.qualification?.forwardOperatorQualified !== true || source.qualification.analyticParameterJacobianQualifiedByComplexStep !== true || source.qualification.covariancePropagationQualified !== true || source.qualification.measuredResponseValidationQualified !== false || source.measuredResponseAuthorityGranted !== false || source.independentScientificValidationStatus !== "not-run-no-measured-holdout" || source.scienceResponseApplicationCount !== 0 || source.networkAttempted !== false || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v429-oracle-identity");
  return value as KerrHighEnergyResponseUncertaintyOracleV429;
}

export function createKerrHighEnergyResponseUncertaintyViewV429(oracleValue: unknown, protocol: KerrHighEnergyResponseValidationProtocolV429): KerrHighEnergyResponseUncertaintyViewV429 {
  const oracle = parseKerrHighEnergyResponseUncertaintyOracleV429(oracleValue);
  if (protocol.version !== "v429-kerr-high-energy-response-independent-validation-protocol-v1" || protocol.status !== "protocol-ready-awaiting-independent-measured-holdout" || protocol.responseIdentityRequired.length < 4 || protocol.requiredObservationFields.length < 12 || protocol.validationStages.length < 12 || protocol.holdoutIndependenceRequired.calibrationCampaignDisjoint !== true || protocol.holdoutIndependenceRequired.sourceIdsDisjointFromFit !== true || protocol.holdoutIndependenceRequired.preregisteredAcceptanceArtifactSha256Required !== true || protocol.thresholdPolicy.postHocThresholdTuningForbidden !== true || protocol.thresholdPolicy.effectSizeAndConfidenceIntervalRequired !== true || protocol.thresholdPolicy.rssCombinationForbiddenWithoutIndependenceProof !== true || protocol.admission.currentStatus !== "not-run-no-measured-holdout" || protocol.admission.measuredAuthorityGranted !== false || protocol.formalProductPointer !== "v263" || protocol.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v429-protocol-contract");
  const computation = computeKerrHighEnergyResponseUncertaintyV429(oracle.fixture, oracle.expected);
  return Object.freeze({ version: KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_VERSION_V429, status: "qualified-forward-operator-jacobian-and-covariance-fixture-only-independent-measured-validation-unavailable", source: Object.freeze({ v426ResponseArtifactSha256: KERR_V426_RESPONSE_ARTIFACT_SHA256_V429, v428IntakeArtifactSha256: KERR_V428_ARTIFACT_SHA256_V429, v428EvidenceSha256: KERR_V428_EVIDENCE_SHA256_V429, v428PointerSha256: KERR_V428_POINTER_SHA256_V429 }), model: Object.freeze({ analyzerAngleCount: 4 as const, energyBinCount: 6 as const, detectorChannelCount: 6 as const, responseParameterCount: 24 as const, redistributionParameterCount: 36 as const, predictedCountCount: 24 as const, forwardEquation: "exposure-times-flux-area-polarimetric-modulation-redistribution-plus-background" as const, covarianceEquation: "J-response-C-response-JT-plus-sum-J-redistribution-C-redistribution-JT" as const }), fixture: Object.freeze({ status: "validated-nonpublishable-mathematical-fixture" as const, observedCountsPresent: false as const, holdoutDatasetPresent: false as const, predictedCountCount: 24 as const, parameterJacobianShape: Object.freeze([24, 24] as const), redistributionJacobianShape: Object.freeze([6, 24, 6] as const), outputCovarianceShape: Object.freeze([24, 24] as const), metrics: oracle.expected.metrics, maximumPythonRelativeDifference: computation.metrics.maximumPythonRelativeDifference }), protocol: Object.freeze({ status: protocol.status, requiredObservationFieldCount: protocol.requiredObservationFields.length, validationStageCount: protocol.validationStages.length, holdoutDisjointnessRequired: true as const, preregistrationRequired: true as const, postHocThresholdTuningForbidden: true as const, independentScientificValidationStatus: "not-run-no-measured-holdout" as const }), counts: Object.freeze({ fixturePredictionCount: 24 as const, observedCountCount: 0 as const, measuredHoldoutDatasetCount: 0 as const, measuredValidationRunCount: 0 as const, residualMetricCount: 0 as const, measuredResponseAuthorityCount: 0 as const, scienceResponseApplicationCount: 0 as const }), products: Object.freeze({ json: "available-fixture-math-and-protocol" as const, csv: "available-prediction-and-uncertainty-diagonal-fixture-only" as const, fits: "available-covariance-budget-fixture-only" as const, png: "available-uncertainty-architecture-not-detector-image" as const, measuredValidationReport: "unavailable-no-holdout" as const }), authorityBoundary: Object.freeze({ forwardOperatorAuthorityGranted: true as const, analyticJacobianAuthorityGranted: true as const, covariancePropagationAuthorityGranted: true as const, fixturePerformanceAuthorityGranted: false as const, measuredResponseValidationGranted: false as const, measuredResponseAuthorityGranted: false as const, residualClosureAuthorityGranted: false as const, scienceProjectionAuthorityGranted: false as const, detectorAuthorityGranted: false as const, pixelRasterAuthorityGranted: false as const, denseAuthorityGranted: false as const, unavailableIsNotZero: true as const }), denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", boundary: "response-forward-operator-jacobians-covariance-and-validation-protocol-only-no-observed-counts-holdout-residuals-measured-authority-science-projection-or-dense-authority" });
}

export function parseKerrHighEnergyResponseUncertaintyArtifactV429(value: unknown): KerrHighEnergyResponseUncertaintyArtifactV429 { const source = value as Partial<KerrHighEnergyResponseUncertaintyArtifactV429> | null, view = source?.view; if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_ARTIFACT_VERSION_V429 || source.status !== "qualified-forward-operator-jacobian-and-covariance-fixture-only-independent-measured-validation-unavailable" || source.sourceFiles?.v426ResponseFileSha256 !== KERR_V426_RESPONSE_FILE_SHA256_V429 || source.sourceFiles.v428IntakeFileSha256 !== KERR_V428_ARTIFACT_FILE_SHA256_V429 || source.sourceFiles.v428EvidenceFileSha256 !== KERR_V428_EVIDENCE_FILE_SHA256_V429 || source.sourceFiles.v428PointerFileSha256 !== KERR_V428_POINTER_FILE_SHA256_V429 || !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") || !SHA.test(source.sourceFiles.validationProtocolFileSha256 ?? "") || !SHA.test(source.pythonOracleArtifactSha256 ?? "") || view?.counts.fixturePredictionCount !== 24 || view.counts.observedCountCount !== 0 || view.counts.measuredHoldoutDatasetCount !== 0 || view.counts.measuredValidationRunCount !== 0 || view.counts.residualMetricCount !== 0 || view.counts.measuredResponseAuthorityCount !== 0 || view.counts.scienceResponseApplicationCount !== 0 || view.authorityBoundary.measuredResponseAuthorityGranted !== false || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.observedCountsPresent !== false || source.measuredHoldoutPresent !== false || source.measuredValidationRunCount !== 0 || source.scienceResponseApplicationCount !== 0 || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v429-artifact-identity"); return value as KerrHighEnergyResponseUncertaintyArtifactV429; }
export function createKerrHighEnergyResponseUncertaintySummaryV429(value: unknown): KerrHighEnergyResponseUncertaintySummaryV429 { const artifact = parseKerrHighEnergyResponseUncertaintyArtifactV429(value), view = artifact.view; return Object.freeze({ version: KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_SUMMARY_VERSION_V429, status: view.status, artifactSha256: artifact.artifactSha256, model: view.model, fixture: view.fixture, protocol: view.protocol, counts: view.counts, products: view.products, authorityBoundary: view.authorityBoundary, denseCampaignStatus: view.denseCampaignStatus, fullArtifactAvailable: true, boundary: "bounded-forward-operator-metrics-protocol-and-authority-summary-no-jacobian-covariance-or-fixture-arrays-in-react-state" }); }
export function parseKerrHighEnergyResponseUncertaintyApiV429(value: unknown): KerrHighEnergyResponseUncertaintyApiV429 { const source = value as Partial<KerrHighEnergyResponseUncertaintyApiV429> | null; if (!source || source.version !== KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_API_VERSION_V429) throw new Error("v429-api-version"); if (source.available === true && source.reason === "ready" && source.summary) { if (source.summary.version !== KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_SUMMARY_VERSION_V429 || !SHA.test(source.summary.artifactSha256) || source.summary.counts.observedCountCount !== 0 || source.summary.counts.measuredValidationRunCount !== 0 || source.summary.authorityBoundary.measuredResponseAuthorityGranted !== false || Object.hasOwn(source.summary, "parameterJacobian") || Object.hasOwn(source.summary, "totalCovariance")) throw new Error("v429-api-summary"); return source as KerrHighEnergyResponseUncertaintyApiV429; } if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrHighEnergyResponseUncertaintyApiV429; throw new Error("v429-api-identity"); }
