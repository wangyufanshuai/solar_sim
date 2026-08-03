import {
  parseKerrGlobalObservabilityArtifactV395,
  type KerrGlobalObservabilityArtifactV395,
} from "./kerrGlobalObservabilityV395";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  type KerrTemperatureSystematicsTransferArtifactV390,
} from "./kerrTemperatureSystematicsTransferV390";

export const KERR_AUXILIARY_CONSTRAINT_BUNDLE_VERSION_V396 =
  "v396-kerr-auxiliary-constraint-bundle-v1" as const;
export const KERR_AUXILIARY_CONSTRAINT_ARTIFACT_VERSION_V396 =
  "v396-kerr-auxiliary-constraint-design-v1" as const;
export const V396_RANK_RELATIVE_TOLERANCE = 1e-12;
export const V396_ORACLE_RELATIVE_LIMIT = 2e-12;

const SHA256 = /^[a-f0-9]{64}$/;
export const V396_STRATEGIES = Object.freeze([
  Object.freeze({ id: "photon-anchor", role: "rank-lifting-candidate" }),
  Object.freeze({ id: "redshift-anchor", role: "rank-lifting-candidate" }),
  Object.freeze({ id: "balanced-photon-redshift-anchor", role: "rank-lifting-candidate" }),
  Object.freeze({ id: "flux-only-control", role: "negative-control" }),
  Object.freeze({ id: "replicated-conditioned-temperature-control", role: "negative-control" }),
] as const);
type StrategyIdV396 = (typeof V396_STRATEGIES)[number]["id"];

export type KerrAuxiliaryConstraintEvaluationV396 = Readonly<{
  strategyId: StrategyIdV396;
  strategyRole: "rank-lifting-candidate" | "negative-control";
  rayIndex: number;
  rayId: string;
  bandId: string;
  normalizedConstraint: readonly [number, number, number];
  nullCoupling: number;
  determinant: number;
  singularValuesDescending: readonly [number, number, number];
  augmentedRank: 2 | 3;
  rankIncrement: 0 | 1;
  conditionNumber: number | null;
}>;

export type KerrAuxiliaryConstraintBundleV396 = Readonly<{
  version: typeof KERR_AUXILIARY_CONSTRAINT_BUNDLE_VERSION_V396;
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v395ObservabilityArtifactSha256: string;
  }>;
  conditioningSemantics: "unit-normalized-candidate-row-structural-only";
  strategies: typeof V396_STRATEGIES;
  evaluations: readonly KerrAuxiliaryConstraintEvaluationV396[];
  partialCoverageRankCurve: readonly Readonly<{
    auxiliaryConstraintCount: number;
    augmentedRank: number;
    remainingNullity: number;
  }>[];
  summary: Readonly<{
    evaluationCount: 60;
    rankLiftingEvaluationCount: 36;
    negativeControlEvaluationCount: 24;
    fullyLiftingStrategyCount: 3;
    negativeControlStrategyCount: 2;
    minimumConstraintsForFullRank: 12;
    fullRank: 36;
    maximumQualifiedStructuralConditionNumber: number;
  }>;
  instrumentFeasibilityAvailable: false;
  physicalNoiseCovarianceAvailable: false;
  physicalMeasurementRecommendationAllowed: false;
}>;

export type KerrAuxiliaryConstraintRejectionV396 =
  | "bundle-not-object"
  | "bundle-version"
  | "source-identity"
  | "conditioning-semantics"
  | "strategy-set"
  | "evaluation-count"
  | "constraint-normalization"
  | "evaluation-identity"
  | "rank-lift-identity"
  | "singular-value-identity"
  | "partial-curve-identity"
  | "summary-identity"
  | "physical-recommendation-forbidden";

export type KerrAuxiliaryConstraintValidationV396 = Readonly<{
  status: "qualified" | "rejected";
  rejectionReasons: readonly KerrAuxiliaryConstraintRejectionV396[];
  maximumNumericalDifference: number;
}>;

export type KerrAuxiliaryConstraintArtifactV396 = Readonly<{
  version: typeof KERR_AUXILIARY_CONSTRAINT_ARTIFACT_VERSION_V396;
  generatedAt: string;
  status: "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v395ObservabilityArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  design: Readonly<{
    strategyCount: 5;
    blockCount: 12;
    evaluationCount: 60;
    fullyLiftingStrategyCount: 3;
    negativeControlStrategyCount: 2;
    minimumConstraintsForFullRank: 12;
    baselineRank: 24;
    fullRank: 36;
    conditioningSemantics: "unit-normalized-candidate-row-structural-only";
    maximumQualifiedStructuralConditionNumber: number;
    strategies: readonly Readonly<{
      id: StrategyIdV396;
      role: "rank-lifting-candidate" | "negative-control";
      liftedBlockCount: number;
      maximumConditionNumber: number | null;
    }>[];
  }>;
  validator: Readonly<{
    qualified: true;
    acceptedControlFixtureCount: 1;
    rejectedAdversarialFixtureCount: 7;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrAuxiliaryConstraintRejectionV396;
      observedReason: KerrAuxiliaryConstraintRejectionV396;
      rejected: true;
    }>[];
  }>;
  residuals: Readonly<{
    maximumBundleNumericalDifference: number;
    maximumPythonOracleRelativeDifference: number;
  }>;
  productionAdmission: Readonly<{
    instrumentResponseAvailable: false;
    physicalNoiseCovarianceAvailable: false;
    auxiliaryMeasurementDataAvailable: false;
    physicalConstraintSelectionExecuted: false;
    structuralCandidatePromotedToRecommendation: false;
    fisherInformationClaimed: false;
    posteriorClaimed: false;
    probabilityContentAssigned: false;
  }>;
  qualification: Readonly<{
    structuralConstraintDesignQualified: true;
    minimumRankLiftCountQualified: true;
    negativeControlsQualified: true;
    instrumentFeasibilityQualified: false;
    physicalMeasurementRecommendationQualified: false;
    measuredAuthorityGranted: false;
    scienceImageAvailable: false;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

type MutableRecord = Record<string, unknown>;
const isObject = (value: unknown): value is MutableRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const addReason = (
  target: KerrAuxiliaryConstraintRejectionV396[],
  reason: KerrAuxiliaryConstraintRejectionV396,
) => {
  if (!target.includes(reason)) target.push(reason);
};
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

function jacobiEigenvalues3(matrix: readonly (readonly number[])[]) {
  const work = matrix.map((row) => [...row]);
  for (let iteration = 0; iteration < 40; iteration += 1) {
    let p = 0;
    let q = 1;
    let maximum = Math.abs(work[0][1]);
    for (const [left, right] of [[0, 2], [1, 2]] as const) {
      const candidate = Math.abs(work[left][right]);
      if (candidate > maximum) { maximum = candidate; p = left; q = right; }
    }
    if (maximum <= Number.EPSILON * 16) break;
    const angle = 0.5 * Math.atan2(2 * work[p][q], work[q][q] - work[p][p]);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const app = work[p][p]; const aqq = work[q][q]; const apq = work[p][q];
    work[p][p] = cosine ** 2 * app - 2 * sine * cosine * apq + sine ** 2 * aqq;
    work[q][q] = sine ** 2 * app + 2 * sine * cosine * apq + cosine ** 2 * aqq;
    work[p][q] = 0; work[q][p] = 0;
    for (let index = 0; index < 3; index += 1) {
      if (index === p || index === q) continue;
      const aip = work[index][p]; const aiq = work[index][q];
      work[index][p] = work[p][index] = cosine * aip - sine * aiq;
      work[index][q] = work[q][index] = sine * aip + cosine * aiq;
    }
  }
  return [work[0][0], work[1][1], work[2][2]].sort((left, right) => right - left);
}

function normalizedConstraint(strategyId: StrategyIdV396, photonTransfer: number) {
  if (strategyId === "photon-anchor") return [1, 0, 0] as const;
  if (strategyId === "redshift-anchor") return [0, 1, 0] as const;
  if (strategyId === "balanced-photon-redshift-anchor") {
    return [Math.SQRT1_2, Math.SQRT1_2, 0] as const;
  }
  if (strategyId === "flux-only-control") return [0, 0, 1] as const;
  const norm = Math.hypot(photonTransfer, 1);
  return [photonTransfer / norm, -1 / norm, 0] as const;
}

export function createKerrAuxiliaryConstraintBundleV396(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  observabilityValue: KerrGlobalObservabilityArtifactV395,
): KerrAuxiliaryConstraintBundleV396 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(transferValue);
  const observability = parseKerrGlobalObservabilityArtifactV395(observabilityValue);
  if (observability.source.v390TransferArtifactSha256 !== transfer.artifactSha256) {
    throw new Error("v396-source-identity");
  }
  let maximumQualifiedStructuralConditionNumber = 0;
  const evaluations = V396_STRATEGIES.flatMap((strategy) =>
    transfer.rows.map((row) => {
      const photonTransfer = row.transferMatrix[0][0];
      const constraint = normalizedConstraint(strategy.id, photonTransfer);
      const nullNorm = Math.hypot(1, photonTransfer);
      const nullCoupling =
        (constraint[0] + photonTransfer * constraint[1]) / nullNorm;
      const augmented = [
        [...row.transferMatrix[0]],
        [...row.transferMatrix[1]],
        [...constraint],
      ];
      const gram = Array.from({ length: 3 }, (_, left) =>
        Array.from({ length: 3 }, (_, right) =>
          augmented.reduce(
            (sum, augmentedRow) =>
              sum + augmentedRow[left] * augmentedRow[right],
            0,
          ),
        ),
      );
      const rawSingularValues = jacobiEigenvalues3(gram).map((entry) =>
        Math.sqrt(Math.max(0, entry)),
      ) as [number, number, number];
      const augmentedRank = Math.abs(nullCoupling) > V396_RANK_RELATIVE_TOLERANCE
        ? 3 as const
        : 2 as const;
      // The analytic null-coupling test is the authority for structural rank.
      // Canonicalize the numerically unresolved null singular value so different
      // eigensolvers cannot turn the same rank-2 control into different evidence.
      const singularValues = [
        rawSingularValues[0],
        rawSingularValues[1],
        augmentedRank === 3 ? rawSingularValues[2] : 0,
      ] as [number, number, number];
      const rankIncrement = augmentedRank === 3 ? 1 : 0;
      const conditionNumber = augmentedRank === 3
        ? singularValues[0] / singularValues[2]
        : null;
      if (conditionNumber !== null) {
        maximumQualifiedStructuralConditionNumber = Math.max(
          maximumQualifiedStructuralConditionNumber,
          conditionNumber,
        );
      }
      const determinant =
        augmented[0][0] * (augmented[1][1] * augmented[2][2] - augmented[1][2] * augmented[2][1]) -
        augmented[0][1] * (augmented[1][0] * augmented[2][2] - augmented[1][2] * augmented[2][0]) +
        augmented[0][2] * (augmented[1][0] * augmented[2][1] - augmented[1][1] * augmented[2][0]);
      return Object.freeze({
        strategyId: strategy.id,
        strategyRole: strategy.role,
        rayIndex: row.rayIndex,
        rayId: row.rayId,
        bandId: row.bandId,
        normalizedConstraint: Object.freeze(constraint),
        nullCoupling,
        determinant,
        singularValuesDescending: Object.freeze(singularValues),
        augmentedRank,
        rankIncrement: rankIncrement as 0 | 1,
        conditionNumber,
      });
    }),
  );
  const partialCoverageRankCurve = Object.freeze(
    Array.from({ length: 13 }, (_, auxiliaryConstraintCount) =>
      Object.freeze({
        auxiliaryConstraintCount,
        augmentedRank: 24 + auxiliaryConstraintCount,
        remainingNullity: 12 - auxiliaryConstraintCount,
      }),
    ),
  );
  return Object.freeze({
    version: KERR_AUXILIARY_CONSTRAINT_BUNDLE_VERSION_V396,
    source: Object.freeze({
      v390TransferArtifactSha256: transfer.artifactSha256,
      v395ObservabilityArtifactSha256: observability.artifactSha256,
    }),
    conditioningSemantics: "unit-normalized-candidate-row-structural-only",
    strategies: V396_STRATEGIES,
    evaluations: Object.freeze(evaluations),
    partialCoverageRankCurve,
    summary: Object.freeze({
      evaluationCount: 60 as const,
      rankLiftingEvaluationCount: 36 as const,
      negativeControlEvaluationCount: 24 as const,
      fullyLiftingStrategyCount: 3 as const,
      negativeControlStrategyCount: 2 as const,
      minimumConstraintsForFullRank: 12 as const,
      fullRank: 36 as const,
      maximumQualifiedStructuralConditionNumber,
    }),
    instrumentFeasibilityAvailable: false as const,
    physicalNoiseCovarianceAvailable: false as const,
    physicalMeasurementRecommendationAllowed: false as const,
  });
}

export function validateKerrAuxiliaryConstraintBundleV396(
  value: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  observabilityValue: KerrGlobalObservabilityArtifactV395,
): KerrAuxiliaryConstraintValidationV396 {
  if (!isObject(value)) return Object.freeze({ status: "rejected" as const, rejectionReasons: Object.freeze(["bundle-not-object"] as const), maximumNumericalDifference: Number.POSITIVE_INFINITY });
  const expected = createKerrAuxiliaryConstraintBundleV396(transferValue, observabilityValue);
  const source = value;
  const reasons: KerrAuxiliaryConstraintRejectionV396[] = [];
  let maximumNumericalDifference = 0;
  if (source.version !== expected.version) addReason(reasons, "bundle-version");
  if (JSON.stringify(source.source) !== JSON.stringify(expected.source)) addReason(reasons, "source-identity");
  if (source.conditioningSemantics !== expected.conditioningSemantics) addReason(reasons, "conditioning-semantics");
  if (JSON.stringify(source.strategies) !== JSON.stringify(expected.strategies)) addReason(reasons, "strategy-set");
  const evaluations = Array.isArray(source.evaluations) ? source.evaluations : [];
  if (evaluations.length !== 60) addReason(reasons, "evaluation-count");
  for (let index = 0; index < Math.min(evaluations.length, 60); index += 1) {
    const actual = evaluations[index] as MutableRecord;
    const target = expected.evaluations[index];
    if (actual.strategyId !== target.strategyId || actual.rayIndex !== target.rayIndex || actual.bandId !== target.bandId) addReason(reasons, "evaluation-identity");
    const vector = Array.isArray(actual.normalizedConstraint) ? actual.normalizedConstraint : [];
    if (vector.length !== 3 || Math.abs(Math.hypot(...vector.map(Number)) - 1) >= 2e-12) addReason(reasons, "constraint-normalization");
    if (actual.augmentedRank !== target.augmentedRank || actual.rankIncrement !== target.rankIncrement) addReason(reasons, "rank-lift-identity");
    const singularValues = Array.isArray(actual.singularValuesDescending) ? actual.singularValuesDescending : [];
    if (singularValues.length !== 3) addReason(reasons, "singular-value-identity");
    else for (let entry = 0; entry < 3; entry += 1) maximumNumericalDifference = Math.max(maximumNumericalDifference, relativeDifference(Number(singularValues[entry]), target.singularValuesDescending[entry]));
    maximumNumericalDifference = Math.max(maximumNumericalDifference, relativeDifference(Number(actual.nullCoupling), target.nullCoupling), relativeDifference(Number(actual.determinant), target.determinant));
  }
  if (maximumNumericalDifference >= 2e-12) addReason(reasons, "singular-value-identity");
  if (JSON.stringify(source.partialCoverageRankCurve) !== JSON.stringify(expected.partialCoverageRankCurve)) addReason(reasons, "partial-curve-identity");
  if (JSON.stringify(source.summary) !== JSON.stringify(expected.summary)) addReason(reasons, "summary-identity");
  if (source.instrumentFeasibilityAvailable !== false || source.physicalNoiseCovarianceAvailable !== false || source.physicalMeasurementRecommendationAllowed !== false) addReason(reasons, "physical-recommendation-forbidden");
  return Object.freeze({ status: reasons.length === 0 ? "qualified" as const : "rejected" as const, rejectionReasons: Object.freeze(reasons), maximumNumericalDifference });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function createKerrAuxiliaryConstraintAdversarialFixturesV396(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  observabilityValue: KerrGlobalObservabilityArtifactV395,
) {
  const control = createKerrAuxiliaryConstraintBundleV396(transferValue, observabilityValue);
  const wrongSource = clone(control) as unknown as MutableRecord; (wrongSource.source as MutableRecord).v395ObservabilityArtifactSha256 = "c".repeat(64);
  const missingStrategy = clone(control) as unknown as MutableRecord; (missingStrategy.strategies as unknown[]).pop();
  const unnormalized = clone(control) as unknown as MutableRecord; ((unnormalized.evaluations as MutableRecord[])[0].normalizedConstraint as number[])[0] = 2;
  const fluxLift = clone(control) as unknown as MutableRecord; const flux = (fluxLift.evaluations as MutableRecord[]).find((row) => row.strategyId === "flux-only-control"); if (flux) { flux.augmentedRank = 3; flux.rankIncrement = 1; }
  const replicateLift = clone(control) as unknown as MutableRecord; const replicate = (replicateLift.evaluations as MutableRecord[]).find((row) => row.strategyId === "replicated-conditioned-temperature-control"); if (replicate) { replicate.augmentedRank = 3; replicate.rankIncrement = 1; }
  const wrongCurve = clone(control) as unknown as MutableRecord; ((wrongCurve.partialCoverageRankCurve as MutableRecord[])[12]).augmentedRank = 35;
  const promoted = clone(control) as unknown as MutableRecord; promoted.physicalMeasurementRecommendationAllowed = true;
  return Object.freeze([
    Object.freeze({ id: "wrong-observability-sha", value: wrongSource, expectedReason: "source-identity" as const }),
    Object.freeze({ id: "missing-strategy", value: missingStrategy, expectedReason: "strategy-set" as const }),
    Object.freeze({ id: "unnormalized-constraint", value: unnormalized, expectedReason: "constraint-normalization" as const }),
    Object.freeze({ id: "flux-control-claimed-lift", value: fluxLift, expectedReason: "rank-lift-identity" as const }),
    Object.freeze({ id: "replicate-control-claimed-lift", value: replicateLift, expectedReason: "rank-lift-identity" as const }),
    Object.freeze({ id: "wrong-partial-rank-curve", value: wrongCurve, expectedReason: "partial-curve-identity" as const }),
    Object.freeze({ id: "structural-candidate-promoted", value: promoted, expectedReason: "physical-recommendation-forbidden" as const }),
  ]);
}

export function parseKerrAuxiliaryConstraintArtifactV396(value: unknown): KerrAuxiliaryConstraintArtifactV396 {
  const source = isObject(value) ? value as Partial<KerrAuxiliaryConstraintArtifactV396> : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures) ? source.validator.adversarialFixtures : [];
  if (!source || source.version !== KERR_AUXILIARY_CONSTRAINT_ARTIFACT_VERSION_V396
    || source.status !== "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable"
    || !source.source || Object.keys(source.source).length !== 3 || !Object.values(source.source).every((entry) => SHA256.test(entry))
    || source.design?.strategyCount !== 5 || source.design.blockCount !== 12 || source.design.evaluationCount !== 60
    || source.design.fullyLiftingStrategyCount !== 3 || source.design.negativeControlStrategyCount !== 2
    || source.design.minimumConstraintsForFullRank !== 12 || source.design.baselineRank !== 24 || source.design.fullRank !== 36
    || source.design.conditioningSemantics !== "unit-normalized-candidate-row-structural-only" || source.design.strategies.length !== 5
    || source.validator?.qualified !== true || source.validator.acceptedControlFixtureCount !== 1 || source.validator.rejectedAdversarialFixtureCount !== 7
    || fixtures.length !== 7 || fixtures.some((fixture) => fixture.rejected !== true || fixture.expectedReason !== fixture.observedReason)
    || !source.residuals || source.residuals.maximumBundleNumericalDifference >= 2e-12 || source.residuals.maximumPythonOracleRelativeDifference >= V396_ORACLE_RELATIVE_LIMIT
    || source.productionAdmission?.instrumentResponseAvailable !== false || source.productionAdmission.physicalNoiseCovarianceAvailable !== false
    || source.productionAdmission.auxiliaryMeasurementDataAvailable !== false || source.productionAdmission.physicalConstraintSelectionExecuted !== false
    || source.productionAdmission.structuralCandidatePromotedToRecommendation !== false || source.productionAdmission.fisherInformationClaimed !== false
    || source.productionAdmission.posteriorClaimed !== false || source.productionAdmission.probabilityContentAssigned !== false
    || source.qualification?.structuralConstraintDesignQualified !== true || source.qualification.minimumRankLiftCountQualified !== true
    || source.qualification.negativeControlsQualified !== true || source.qualification.instrumentFeasibilityQualified !== false
    || source.qualification.physicalMeasurementRecommendationQualified !== false || source.qualification.measuredAuthorityGranted !== false
    || source.networkAttempted !== false || source.sciencePayloadMutationAllowed !== false || source.cinematicConsumerAllowed !== false
    || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run"
    || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v396-auxiliary-constraint-artifact-identity");
  return value as KerrAuxiliaryConstraintArtifactV396;
}
