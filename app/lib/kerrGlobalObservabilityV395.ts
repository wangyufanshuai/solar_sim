import {
  createKerrGlobalDimensionOrdersV394,
  parseKerrGlobalCovariancePropagationArtifactV394,
  type KerrGlobalCovariancePropagationArtifactV394,
} from "./kerrGlobalCovariancePropagationV394";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  type KerrTemperatureSystematicsTransferArtifactV390,
} from "./kerrTemperatureSystematicsTransferV390";

export const KERR_GLOBAL_OBSERVABILITY_BUNDLE_VERSION_V395 =
  "v395-kerr-global-observability-bundle-v1" as const;
export const KERR_GLOBAL_OBSERVABILITY_ARTIFACT_VERSION_V395 =
  "v395-kerr-global-observability-v1" as const;
export const V395_RESIDUAL_LIMIT = 2e-12;
export const V395_ORACLE_RELATIVE_LIMIT = 2e-12;

const SHA256 = /^[a-f0-9]{64}$/;

export type KerrGlobalObservabilityBundleV395 = Readonly<{
  version: typeof KERR_GLOBAL_OBSERVABILITY_BUNDLE_VERSION_V395;
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v394GlobalCovarianceArtifactSha256: string;
  }>;
  inputDimensionOrder: readonly string[];
  outputDimensionOrder: readonly string[];
  jacobian: readonly (readonly number[])[];
  pseudoinverse: readonly (readonly number[])[];
  nullBasis: readonly (readonly number[])[];
  observableProjector: readonly (readonly number[])[];
  nullProjector: readonly (readonly number[])[];
  singularValues: readonly number[];
  rank: 24;
  nullity: 12;
}>;

export type KerrGlobalObservabilityRejectionV395 =
  | "bundle-not-object"
  | "bundle-version"
  | "source-identity"
  | "input-dimension-order"
  | "output-dimension-order"
  | "jacobian-dimension"
  | "pseudoinverse-dimension"
  | "null-basis-dimension"
  | "projector-dimension"
  | "non-finite-matrix"
  | "rank-nullity"
  | "singular-value-identity"
  | "null-residual"
  | "null-orthonormality"
  | "penrose-identity"
  | "projector-identity";

export type KerrGlobalObservabilityValidationV395 = Readonly<{
  status: "qualified" | "rejected";
  rejectionReasons: readonly KerrGlobalObservabilityRejectionV395[];
  maxima: Readonly<{
    nullResidual: number;
    nullOrthonormalityResidual: number;
    penroseResidual: number;
    projectorResidual: number;
    projectorComplementResidual: number;
  }>;
}>;

export type KerrNuisanceModeDecompositionV395 = Readonly<{
  modeId: string;
  totalSquaredNorm: number;
  observableSquaredNorm: number;
  nullSquaredNorm: number;
  observableFraction: number;
  nullFraction: number;
  reconstructionResidual: number;
  physicalAttributionAllowed: false;
}>;

export type KerrGlobalObservabilityArtifactV395 = Readonly<{
  version: typeof KERR_GLOBAL_OBSERVABILITY_ARTIFACT_VERSION_V395;
  generatedAt: string;
  status: "global-jacobian-observability-qualified-physical-mode-attribution-unavailable";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v394GlobalCovarianceArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  dimensions: Readonly<{
    inputDimension: 36;
    outputDimension: 24;
    rank: 24;
    nullity: 12;
    pseudoinverseCoefficientCount: 864;
    observableProjectorCoefficientCount: 1296;
    nullProjectorCoefficientCount: 1296;
  }>;
  structure: Readonly<{
    nullDirectionPerRow: "normalized-[1,photon-transfer,0]";
    nullMeaning: "joint-photon-redshift-perturbation-preserving-conditioned-temperature";
    pageThorneFluxInNullDirection: false;
    blockCount: 12;
    singularValueCount: 24;
    maximumConditionNumber: number;
  }>;
  validator: Readonly<{
    qualified: true;
    acceptedControlFixtureCount: 1;
    rejectedAdversarialFixtureCount: 8;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrGlobalObservabilityRejectionV395;
      observedReason: KerrGlobalObservabilityRejectionV395;
      rejected: true;
    }>[];
  }>;
  residuals: Readonly<{
    maximumNullResidual: number;
    maximumNullOrthonormalityResidual: number;
    maximumPenroseResidual: number;
    maximumProjectorResidual: number;
    maximumProjectorComplementResidual: number;
    maximumPythonOracleRelativeDifference: number;
  }>;
  syntheticModeAudit: Readonly<{
    fixtureClass: "synthetic-validation-fixture";
    publishable: false;
    modeCount: 3;
    modes: readonly KerrNuisanceModeDecompositionV395[];
  }>;
  productionAdmission: Readonly<{
    physicalNuisanceModesAvailable: false;
    physicalModeAttributionExecuted: false;
    nullspacePriorAssigned: false;
    unobservableDirectionsTreatedAsZero: false;
    probabilityContentAssigned: false;
    confidenceInterval: false;
    absoluteScientificInterval: null;
  }>;
  qualification: Readonly<{
    structuralObservabilityQualified: true;
    analyticPseudoinverseQualified: true;
    nullspaceBasisQualified: true;
    physicalModeAttributionQualified: false;
    absoluteScientificIntervalQualified: false;
    absoluteTemperatureAuthorityGranted: false;
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
  target: KerrGlobalObservabilityRejectionV395[],
  reason: KerrGlobalObservabilityRejectionV395,
) => {
  if (!target.includes(reason)) target.push(reason);
};
const zeros = (rows: number, columns: number) =>
  Array.from({ length: rows }, () => Array(columns).fill(0) as number[]);
const transpose = (matrix: readonly (readonly number[])[]) =>
  matrix[0].map((_, column) => matrix.map((row) => row[column]));
const multiply = (
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
) =>
  left.map((row) =>
    right[0].map((_, column) =>
      row.reduce(
        (sum, coefficient, index) =>
          sum + coefficient * right[index][column],
        0,
      ),
    ),
  );
const subtract = (
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
) => left.map((row, i) => row.map((entry, j) => entry - right[i][j]));
const identity = (dimension: number) =>
  Array.from({ length: dimension }, (_, row) =>
    Array.from({ length: dimension }, (_, column) => (row === column ? 1 : 0)),
  );
const maximumAbsolute = (matrix: readonly (readonly number[])[]) =>
  Math.max(...matrix.flat().map((entry) => Math.abs(entry)));
const matrixShape = (
  value: unknown,
  rows: number,
  columns: number,
): value is readonly (readonly number[])[] =>
  Array.isArray(value) &&
  value.length === rows &&
  value.every((row) => Array.isArray(row) && row.length === columns);

export function createKerrGlobalObservabilityBundleV395(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  globalValue: KerrGlobalCovariancePropagationArtifactV394,
): KerrGlobalObservabilityBundleV395 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const global = parseKerrGlobalCovariancePropagationArtifactV394(globalValue);
  if (global.source.v390TransferArtifactSha256 !== transfer.artifactSha256) {
    throw new Error("v395-source-identity");
  }
  const orders = createKerrGlobalDimensionOrdersV394(transfer);
  const jacobian = zeros(24, 36);
  const pseudoinverse = zeros(36, 24);
  const nullBasis = zeros(12, 36);
  const singularValues: number[] = [];
  transfer.rows.forEach((row, block) => {
    const photonTransfer = row.transferMatrix[0][0];
    const firstNormSquared = photonTransfer ** 2 + 1;
    for (let output = 0; output < 2; output += 1) {
      for (let input = 0; input < 3; input += 1) {
        jacobian[block * 2 + output][block * 3 + input] =
          row.transferMatrix[output][input];
      }
    }
    pseudoinverse[block * 3][block * 2] =
      photonTransfer / firstNormSquared;
    pseudoinverse[block * 3 + 1][block * 2] = -1 / firstNormSquared;
    pseudoinverse[block * 3 + 2][block * 2 + 1] = 4;
    const norm = Math.sqrt(firstNormSquared);
    nullBasis[block][block * 3] = 1 / norm;
    nullBasis[block][block * 3 + 1] = photonTransfer / norm;
    singularValues.push(norm, 0.25);
  });
  const observableProjector = multiply(pseudoinverse, jacobian);
  const nullProjector = multiply(transpose(nullBasis), nullBasis);
  return Object.freeze({
    version: KERR_GLOBAL_OBSERVABILITY_BUNDLE_VERSION_V395,
    source: Object.freeze({
      v390TransferArtifactSha256: transfer.artifactSha256,
      v394GlobalCovarianceArtifactSha256: global.artifactSha256,
    }),
    inputDimensionOrder: orders.input,
    outputDimensionOrder: orders.output,
    jacobian: Object.freeze(jacobian.map((row) => Object.freeze(row))),
    pseudoinverse: Object.freeze(
      pseudoinverse.map((row) => Object.freeze(row)),
    ),
    nullBasis: Object.freeze(nullBasis.map((row) => Object.freeze(row))),
    observableProjector: Object.freeze(
      observableProjector.map((row) => Object.freeze(row)),
    ),
    nullProjector: Object.freeze(
      nullProjector.map((row) => Object.freeze(row)),
    ),
    singularValues: Object.freeze(singularValues),
    rank: 24 as const,
    nullity: 12 as const,
  });
}

export function validateKerrGlobalObservabilityBundleV395(
  value: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  globalValue: KerrGlobalCovariancePropagationArtifactV394,
): KerrGlobalObservabilityValidationV395 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const global = parseKerrGlobalCovariancePropagationArtifactV394(globalValue);
  const zeroMaxima = {
    nullResidual: Number.POSITIVE_INFINITY,
    nullOrthonormalityResidual: Number.POSITIVE_INFINITY,
    penroseResidual: Number.POSITIVE_INFINITY,
    projectorResidual: Number.POSITIVE_INFINITY,
    projectorComplementResidual: Number.POSITIVE_INFINITY,
  };
  if (!isObject(value)) {
    return Object.freeze({
      status: "rejected" as const,
      rejectionReasons: Object.freeze(["bundle-not-object"] as const),
      maxima: Object.freeze(zeroMaxima),
    });
  }
  const bundle = value;
  const reasons: KerrGlobalObservabilityRejectionV395[] = [];
  if (bundle.version !== KERR_GLOBAL_OBSERVABILITY_BUNDLE_VERSION_V395) {
    addReason(reasons, "bundle-version");
  }
  const source = isObject(bundle.source) ? bundle.source : null;
  if (
    source?.v390TransferArtifactSha256 !== transfer.artifactSha256 ||
    source?.v394GlobalCovarianceArtifactSha256 !== global.artifactSha256
  ) {
    addReason(reasons, "source-identity");
  }
  const orders = createKerrGlobalDimensionOrdersV394(transfer);
  if (JSON.stringify(bundle.inputDimensionOrder) !== JSON.stringify(orders.input)) {
    addReason(reasons, "input-dimension-order");
  }
  if (JSON.stringify(bundle.outputDimensionOrder) !== JSON.stringify(orders.output)) {
    addReason(reasons, "output-dimension-order");
  }
  if (!matrixShape(bundle.jacobian, 24, 36)) {
    addReason(reasons, "jacobian-dimension");
  }
  if (!matrixShape(bundle.pseudoinverse, 36, 24)) {
    addReason(reasons, "pseudoinverse-dimension");
  }
  if (!matrixShape(bundle.nullBasis, 12, 36)) {
    addReason(reasons, "null-basis-dimension");
  }
  if (
    !matrixShape(bundle.observableProjector, 36, 36) ||
    !matrixShape(bundle.nullProjector, 36, 36)
  ) {
    addReason(reasons, "projector-dimension");
  }
  const matrices = [
    bundle.jacobian,
    bundle.pseudoinverse,
    bundle.nullBasis,
    bundle.observableProjector,
    bundle.nullProjector,
  ];
  if (
    matrices.some(
      (matrix) =>
        !Array.isArray(matrix) ||
        matrix.some(
          (row) =>
            !Array.isArray(row) ||
            row.some((entry) => typeof entry !== "number" || !Number.isFinite(entry)),
        ),
    )
  ) {
    addReason(reasons, "non-finite-matrix");
  }
  if (bundle.rank !== 24 || bundle.nullity !== 12) {
    addReason(reasons, "rank-nullity");
  }
  const expected = createKerrGlobalObservabilityBundleV395(transfer, global);
  if (
    !Array.isArray(bundle.singularValues) ||
    bundle.singularValues.length !== 24 ||
    bundle.singularValues.some(
      (entry, index) =>
        typeof entry !== "number" ||
        !Number.isFinite(entry) ||
        Math.abs(entry - expected.singularValues[index]) > V395_RESIDUAL_LIMIT,
    )
  ) {
    addReason(reasons, "singular-value-identity");
  }
  if (reasons.some((reason) => reason.includes("dimension") || reason === "non-finite-matrix")) {
    return Object.freeze({
      status: "rejected" as const,
      rejectionReasons: Object.freeze(reasons),
      maxima: Object.freeze(zeroMaxima),
    });
  }
  const typed = bundle as unknown as KerrGlobalObservabilityBundleV395;
  const nullResidual = maximumAbsolute(
    multiply(typed.jacobian, transpose(typed.nullBasis)),
  );
  const nullOrthonormalityResidual = maximumAbsolute(
    subtract(multiply(typed.nullBasis, transpose(typed.nullBasis)), identity(12)),
  );
  const penroseResidual = Math.max(
    maximumAbsolute(
      subtract(
        multiply(multiply(typed.jacobian, typed.pseudoinverse), typed.jacobian),
        typed.jacobian,
      ),
    ),
    maximumAbsolute(
      subtract(
        multiply(
          multiply(typed.pseudoinverse, typed.jacobian),
          typed.pseudoinverse,
        ),
        typed.pseudoinverse,
      ),
    ),
  );
  const computedObservable = multiply(typed.pseudoinverse, typed.jacobian);
  const computedNull = multiply(transpose(typed.nullBasis), typed.nullBasis);
  const projectorResidual = Math.max(
    maximumAbsolute(subtract(typed.observableProjector, computedObservable)),
    maximumAbsolute(subtract(typed.nullProjector, computedNull)),
    maximumAbsolute(
      subtract(
        multiply(typed.observableProjector, typed.observableProjector),
        typed.observableProjector,
      ),
    ),
    maximumAbsolute(
      subtract(
        multiply(typed.nullProjector, typed.nullProjector),
        typed.nullProjector,
      ),
    ),
  );
  const projectorComplementResidual = maximumAbsolute(
    subtract(
      typed.observableProjector.map((row, i) =>
        row.map((entry, j) => entry + typed.nullProjector[i][j]),
      ),
      identity(36),
    ),
  );
  if (nullResidual >= V395_RESIDUAL_LIMIT) addReason(reasons, "null-residual");
  if (nullOrthonormalityResidual >= V395_RESIDUAL_LIMIT) {
    addReason(reasons, "null-orthonormality");
  }
  if (penroseResidual >= V395_RESIDUAL_LIMIT) {
    addReason(reasons, "penrose-identity");
  }
  if (
    projectorResidual >= V395_RESIDUAL_LIMIT ||
    projectorComplementResidual >= V395_RESIDUAL_LIMIT
  ) {
    addReason(reasons, "projector-identity");
  }
  return Object.freeze({
    status: reasons.length === 0 ? ("qualified" as const) : ("rejected" as const),
    rejectionReasons: Object.freeze(reasons),
    maxima: Object.freeze({
      nullResidual,
      nullOrthonormalityResidual,
      penroseResidual,
      projectorResidual,
      projectorComplementResidual,
    }),
  });
}

export function decomposeKerrNuisanceModeV395(
  modeId: string,
  vector: readonly number[],
  bundle: KerrGlobalObservabilityBundleV395,
): KerrNuisanceModeDecompositionV395 {
  if (vector.length !== 36 || !vector.every(Number.isFinite)) {
    throw new Error("v395-mode-dimension");
  }
  const project = (matrix: readonly (readonly number[])[]) =>
    matrix.map((row) =>
      row.reduce((sum, coefficient, index) => sum + coefficient * vector[index], 0),
    );
  const observable = project(bundle.observableProjector);
  const nullPart = project(bundle.nullProjector);
  const squaredNorm = (values: readonly number[]) =>
    values.reduce((sum, entry) => sum + entry ** 2, 0);
  const totalSquaredNorm = squaredNorm(vector);
  if (!(totalSquaredNorm > 0)) throw new Error("v395-mode-zero");
  const observableSquaredNorm = squaredNorm(observable);
  const nullSquaredNorm = squaredNorm(nullPart);
  const reconstructionResidual = Math.max(
    ...vector.map((entry, index) =>
      Math.abs(entry - observable[index] - nullPart[index]),
    ),
  );
  return Object.freeze({
    modeId,
    totalSquaredNorm,
    observableSquaredNorm,
    nullSquaredNorm,
    observableFraction: observableSquaredNorm / totalSquaredNorm,
    nullFraction: nullSquaredNorm / totalSquaredNorm,
    reconstructionResidual,
    physicalAttributionAllowed: false as const,
  });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createKerrGlobalObservabilityAdversarialFixturesV395(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  globalValue: KerrGlobalCovariancePropagationArtifactV394,
) {
  const control = createKerrGlobalObservabilityBundleV395(
    transferValue,
    globalValue,
  );
  const wrongSource = clone(control) as unknown as MutableRecord;
  (wrongSource.source as MutableRecord).v394GlobalCovarianceArtifactSha256 =
    "c".repeat(64);
  const wrongInputOrder = clone(control) as unknown as MutableRecord;
  (wrongInputOrder.inputDimensionOrder as unknown[]).reverse();
  const wrongJacobian = clone(control) as unknown as MutableRecord;
  (((wrongJacobian.jacobian as number[][])[0][0])) += 0.1;
  const missingNullVector = clone(control) as unknown as MutableRecord;
  (missingNullVector.nullBasis as unknown[]).pop();
  const nonOrthonormal = clone(control) as unknown as MutableRecord;
  (((nonOrthonormal.nullBasis as number[][])[0][0])) *= 2;
  const wrongPseudoinverse = clone(control) as unknown as MutableRecord;
  (((wrongPseudoinverse.pseudoinverse as number[][])[0][0])) += 0.1;
  const wrongRank = clone(control) as unknown as MutableRecord;
  wrongRank.rank = 23;
  const wrongProjector = clone(control) as unknown as MutableRecord;
  (((wrongProjector.observableProjector as number[][])[0][0])) += 0.1;
  return Object.freeze([
    Object.freeze({ id: "wrong-global-source", value: wrongSource, expectedReason: "source-identity" as const }),
    Object.freeze({ id: "wrong-input-order", value: wrongInputOrder, expectedReason: "input-dimension-order" as const }),
    Object.freeze({ id: "altered-jacobian", value: wrongJacobian, expectedReason: "null-residual" as const }),
    Object.freeze({ id: "missing-null-vector", value: missingNullVector, expectedReason: "null-basis-dimension" as const }),
    Object.freeze({ id: "non-orthonormal-null-basis", value: nonOrthonormal, expectedReason: "null-orthonormality" as const }),
    Object.freeze({ id: "incorrect-pseudoinverse", value: wrongPseudoinverse, expectedReason: "penrose-identity" as const }),
    Object.freeze({ id: "misreported-rank", value: wrongRank, expectedReason: "rank-nullity" as const }),
    Object.freeze({ id: "incorrect-projector", value: wrongProjector, expectedReason: "projector-identity" as const }),
  ]);
}

export function parseKerrGlobalObservabilityArtifactV395(
  value: unknown,
): KerrGlobalObservabilityArtifactV395 {
  const source = isObject(value)
    ? (value as Partial<KerrGlobalObservabilityArtifactV395>)
    : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures)
    ? source.validator.adversarialFixtures
    : [];
  if (
    !source ||
    source.version !== KERR_GLOBAL_OBSERVABILITY_ARTIFACT_VERSION_V395 ||
    source.status !==
      "global-jacobian-observability-qualified-physical-mode-attribution-unavailable" ||
    !source.source ||
    Object.keys(source.source).length !== 3 ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    source.dimensions?.inputDimension !== 36 ||
    source.dimensions.outputDimension !== 24 ||
    source.dimensions.rank !== 24 ||
    source.dimensions.nullity !== 12 ||
    source.dimensions.pseudoinverseCoefficientCount !== 864 ||
    source.dimensions.observableProjectorCoefficientCount !== 1296 ||
    source.dimensions.nullProjectorCoefficientCount !== 1296 ||
    source.structure?.nullDirectionPerRow !==
      "normalized-[1,photon-transfer,0]" ||
    source.structure.nullMeaning !==
      "joint-photon-redshift-perturbation-preserving-conditioned-temperature" ||
    source.structure.pageThorneFluxInNullDirection !== false ||
    source.structure.blockCount !== 12 ||
    source.structure.singularValueCount !== 24 ||
    !(source.structure.maximumConditionNumber > 0) ||
    source.validator?.qualified !== true ||
    source.validator.acceptedControlFixtureCount !== 1 ||
    source.validator.rejectedAdversarialFixtureCount !== 8 ||
    fixtures.length !== 8 ||
    fixtures.some(
      (fixture) =>
        fixture.rejected !== true ||
        fixture.expectedReason !== fixture.observedReason,
    ) ||
    !source.residuals ||
    source.residuals.maximumNullResidual >= V395_RESIDUAL_LIMIT ||
    source.residuals.maximumNullOrthonormalityResidual >= V395_RESIDUAL_LIMIT ||
    source.residuals.maximumPenroseResidual >= V395_RESIDUAL_LIMIT ||
    source.residuals.maximumProjectorResidual >= V395_RESIDUAL_LIMIT ||
    source.residuals.maximumProjectorComplementResidual >= V395_RESIDUAL_LIMIT ||
    source.residuals.maximumPythonOracleRelativeDifference >=
      V395_ORACLE_RELATIVE_LIMIT ||
    source.syntheticModeAudit?.fixtureClass !== "synthetic-validation-fixture" ||
    source.syntheticModeAudit.publishable !== false ||
    source.syntheticModeAudit.modeCount !== 3 ||
    source.syntheticModeAudit.modes.length !== 3 ||
    source.syntheticModeAudit.modes.some(
      (mode) =>
        mode.physicalAttributionAllowed !== false ||
        Math.abs(mode.observableFraction + mode.nullFraction - 1) >= 2e-12 ||
        mode.reconstructionResidual >= V395_RESIDUAL_LIMIT,
    ) ||
    source.productionAdmission?.physicalNuisanceModesAvailable !== false ||
    source.productionAdmission.physicalModeAttributionExecuted !== false ||
    source.productionAdmission.nullspacePriorAssigned !== false ||
    source.productionAdmission.unobservableDirectionsTreatedAsZero !== false ||
    source.productionAdmission.probabilityContentAssigned !== false ||
    source.productionAdmission.confidenceInterval !== false ||
    source.productionAdmission.absoluteScientificInterval !== null ||
    source.qualification?.structuralObservabilityQualified !== true ||
    source.qualification.analyticPseudoinverseQualified !== true ||
    source.qualification.nullspaceBasisQualified !== true ||
    source.qualification.physicalModeAttributionQualified !== false ||
    source.qualification.absoluteScientificIntervalQualified !== false ||
    source.qualification.absoluteTemperatureAuthorityGranted !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v395-global-observability-artifact-identity");
  }
  return value as KerrGlobalObservabilityArtifactV395;
}
