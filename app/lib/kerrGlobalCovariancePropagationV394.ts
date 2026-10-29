import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";
import {
  parseKerrCovarianceSourceAdmissionArtifactV393,
  type KerrCovarianceSourceAdmissionArtifactV393,
} from "./kerrCovarianceSourceDossierV393";
import {
  parseKerrPhysicalCovarianceAdmissionArtifactV392,
  validateKerrPhysicalCovariancePackV392,
  type KerrCovarianceMatrix3V392,
  type KerrPhysicalCovarianceAdmissionArtifactV392,
} from "./kerrPhysicalCovarianceAdmissionV392";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_INPUT_ORDER,
  V390_OUTPUT_ORDER,
  type KerrTemperatureSystematicsTransferArtifactV390,
} from "./kerrTemperatureSystematicsTransferV390";

export const KERR_GLOBAL_COVARIANCE_MODEL_VERSION_V394 =
  "v394-kerr-global-covariance-model-v1" as const;
export const KERR_GLOBAL_COVARIANCE_PROPAGATION_VERSION_V394 =
  "v394-kerr-global-covariance-propagation-v1" as const;
export const V394_INPUT_DIMENSION = 36 as const;
export const V394_OUTPUT_DIMENSION = 24 as const;
export const V394_ORACLE_RELATIVE_LIMIT = 2e-12;

const SHA256 = /^[a-f0-9]{64}$/;

type ContentClassV394 = "physical-source" | "synthetic-validation-fixture";

export type KerrGlobalCovarianceBaseBlockV394 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: KerrThinDiskBandIdV320;
  covariance: KerrCovarianceMatrix3V392;
}>;

export type KerrGlobalCovarianceNuisanceModeV394 = Readonly<{
  modeId: string;
  semantics: string;
  contentClass: ContentClassV394;
  sourceIdentity: string;
  sourceArtifactSha256: string;
  loadings: readonly number[];
}>;

export type KerrGlobalCovarianceModelV394 = Readonly<{
  version: typeof KERR_GLOBAL_COVARIANCE_MODEL_VERSION_V394;
  modelId: string;
  contentClass:
    | "physical-global-covariance"
    | "synthetic-validation-fixture";
  publicationIntent: "publishable" | "validation-only";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v392AdmissionArtifactSha256: string;
    v393SourceAdmissionArtifactSha256: string;
    modelSourceArtifactSha256: string;
    crossRowEvidenceSha256: string;
  }>;
  inputDimensionOrder: readonly string[];
  outputDimensionOrder: readonly string[];
  covarianceSemantics: "global-natural-log-input-covariance";
  baseBlocks: readonly KerrGlobalCovarianceBaseBlockV394[];
  crossRowPolicy: Readonly<{
    mode: "explicit-low-rank-modes" | "zero-under-independence-evidence";
    independenceStatement: string | null;
  }>;
  nuisanceModes: readonly KerrGlobalCovarianceNuisanceModeV394[];
}>;

export type KerrGlobalCovarianceRejectionV394 =
  | "model-not-object"
  | "model-version"
  | "model-identity"
  | "synthetic-fixture-marked-publishable"
  | "transfer-source-sha"
  | "admission-source-sha"
  | "dossier-source-sha"
  | "source-sha"
  | "input-dimension-order"
  | "output-dimension-order"
  | "covariance-semantics"
  | "base-block-set"
  | "base-block-rejected"
  | "cross-row-policy"
  | "nuisance-mode-set"
  | "nuisance-mode-content-class"
  | "nuisance-loading-dimension"
  | "non-finite-loading"
  | "mode-does-not-couple-rows"
  | "independence-evidence-missing";

export type KerrGlobalCovarianceAdmissionV394 = Readonly<{
  status: "admitted-physical" | "admitted-validation-only" | "rejected";
  propagationAllowed: boolean;
  publicationAllowed: boolean;
  rejectionReasons: readonly KerrGlobalCovarianceRejectionV394[];
  baseBlockCount: number;
  nuisanceModeCount: number;
  checkedLoadingCount: number;
}>;

export type KerrGlobalCovarianceProjectionV394 = Readonly<{
  admissionStatus: "admitted-physical" | "admitted-validation-only";
  publicationAllowed: boolean;
  inputDimensionOrder: readonly string[];
  outputDimensionOrder: readonly string[];
  inputCovariance: readonly (readonly number[])[];
  outputCovariance: readonly (readonly number[])[];
  metrics: Readonly<{
    inputCoefficientCount: 1296;
    outputCoefficientCount: 576;
    maximumInputSymmetryAbsoluteError: number;
    maximumOutputSymmetryAbsoluteError: number;
    maximumCrossRowAbsoluteCovariance: number;
    minimumInputDiagonal: number;
    minimumOutputDiagonal: number;
  }>;
}>;

export type KerrGlobalCovariancePropagationArtifactV394 = Readonly<{
  version: typeof KERR_GLOBAL_COVARIANCE_PROPAGATION_VERSION_V394;
  generatedAt: string;
  status: "global-covariance-propagation-qualified-physical-cross-row-model-unavailable";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v392AdmissionArtifactSha256: string;
    v393SourceAdmissionArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  dimensions: Readonly<{
    rowCount: 12;
    inputPerRow: 3;
    outputPerRow: 2;
    inputDimension: 36;
    outputDimension: 24;
    inputCovarianceCoefficientCount: 1296;
    outputCovarianceCoefficientCount: 576;
  }>;
  validator: Readonly<{
    qualified: true;
    acceptedControlFixtureCount: 1;
    rejectedAdversarialFixtureCount: 9;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrGlobalCovarianceRejectionV394;
      observedReason: KerrGlobalCovarianceRejectionV394;
      rejected: true;
    }>[];
  }>;
  selfTest: Readonly<{
    fixtureClass: "synthetic-validation-fixture";
    publishable: false;
    nuisanceModeCount: 3;
    propagationExecuted: true;
    maximumCrossRowAbsoluteCovariance: number;
    minimumInputDiagonal: number;
    minimumOutputDiagonal: number;
    maximumPythonOracleRelativeDifference: number;
  }>;
  productionAdmission: Readonly<{
    globalCovarianceModelAvailable: false;
    crossRowEvidenceAvailable: false;
    nuisanceModesAvailable: 0;
    globalCovarianceAdmitted: false;
    covariancePropagationExecuted: false;
    blockIndependenceAssumed: false;
    missingCrossRowTermsTreatedAsZero: false;
    probabilityContentAssigned: false;
    confidenceInterval: false;
    outputCovariance: null;
    absoluteScientificInterval: null;
  }>;
  qualification: Readonly<{
    globalCovarianceInfrastructureQualified: true;
    blockJacobianPropagationQualified: true;
    crossRowModeAssemblyQualified: true;
    physicalGlobalCovarianceQualified: false;
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
  target: KerrGlobalCovarianceRejectionV394[],
  reason: KerrGlobalCovarianceRejectionV394,
) => {
  if (!target.includes(reason)) target.push(reason);
};
const rowKey = (row: { rayIndex?: unknown; rayId?: unknown; bandId?: unknown }) =>
  `${row.rayIndex}:${row.rayId}:${row.bandId}`;

export function createKerrGlobalDimensionOrdersV394(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
) {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  return Object.freeze({
    input: Object.freeze(
      transfer.rows.flatMap((row) =>
        V390_INPUT_ORDER.map(
          (parameter) =>
            `${row.rayIndex}:${row.rayId}:${row.bandId}:${parameter}`,
        ),
      ),
    ),
    output: Object.freeze(
      transfer.rows.flatMap((row) =>
        V390_OUTPUT_ORDER.map(
          (parameter) =>
            `${row.rayIndex}:${row.rayId}:${row.bandId}:${parameter}`,
        ),
      ),
    ),
  });
}

function basePackFromModel(
  model: KerrGlobalCovarianceModelV394,
  transfer: KerrTemperatureSystematicsTransferArtifactV390,
) {
  return Object.freeze({
    version: "v392-kerr-physical-covariance-pack-v1" as const,
    packId: `${model.modelId}:base-blocks`,
    contentClass:
      model.contentClass === "synthetic-validation-fixture"
        ? ("synthetic-validation-fixture" as const)
        : ("physical-observation-covariance" as const),
    publicationIntent: model.publicationIntent,
    source: Object.freeze({
      v390TransferArtifactSha256: transfer.artifactSha256,
      covarianceSourceIdentity: model.modelId,
      covarianceSourceArtifactSha256: model.source.modelSourceArtifactSha256,
    }),
    parameterOrder: V390_INPUT_ORDER,
    outputOrder: V390_OUTPUT_ORDER,
    covarianceSemantics: "natural-log-input-perturbation-covariance" as const,
    crossCovariancePolicy: Object.freeze({
      mode: "explicit-values" as const,
      evidenceSha256: model.source.crossRowEvidenceSha256,
      independenceStatement: null,
    }),
    rows: Object.freeze(
      model.baseBlocks.map((block) =>
        Object.freeze({
          ...block,
          crossCovariance: Object.freeze({
            photonRadianceRedshift: block.covariance[0][1],
            photonRadiancePageThorneFlux: block.covariance[0][2],
            redshiftPageThorneFlux: block.covariance[1][2],
          }),
        }),
      ),
    ),
  });
}

export function validateKerrGlobalCovarianceModelV394(
  value: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
  dossierValue: KerrCovarianceSourceAdmissionArtifactV393,
): KerrGlobalCovarianceAdmissionV394 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const admission = parseKerrPhysicalCovarianceAdmissionArtifactV392(
    admissionValue,
  );
  const dossier = parseKerrCovarianceSourceAdmissionArtifactV393(dossierValue);
  if (!isObject(value)) {
    return Object.freeze({
      status: "rejected" as const,
      propagationAllowed: false,
      publicationAllowed: false,
      rejectionReasons: Object.freeze(["model-not-object"] as const),
      baseBlockCount: 0,
      nuisanceModeCount: 0,
      checkedLoadingCount: 0,
    });
  }
  const model = value;
  const reasons: KerrGlobalCovarianceRejectionV394[] = [];
  if (model.version !== KERR_GLOBAL_COVARIANCE_MODEL_VERSION_V394) {
    addReason(reasons, "model-version");
  }
  if (typeof model.modelId !== "string" || model.modelId.length < 3) {
    addReason(reasons, "model-identity");
  }
  if (
    model.contentClass !== "physical-global-covariance" &&
    model.contentClass !== "synthetic-validation-fixture"
  ) {
    addReason(reasons, "model-identity");
  }
  if (
    model.contentClass === "synthetic-validation-fixture" &&
    model.publicationIntent === "publishable"
  ) {
    addReason(reasons, "synthetic-fixture-marked-publishable");
  }
  const source = isObject(model.source) ? model.source : null;
  if (source?.v390TransferArtifactSha256 !== transfer.artifactSha256) {
    addReason(reasons, "transfer-source-sha");
  }
  if (source?.v392AdmissionArtifactSha256 !== admission.artifactSha256) {
    addReason(reasons, "admission-source-sha");
  }
  if (source?.v393SourceAdmissionArtifactSha256 !== dossier.artifactSha256) {
    addReason(reasons, "dossier-source-sha");
  }
  if (
    !SHA256.test(String(source?.modelSourceArtifactSha256 ?? "")) ||
    !SHA256.test(String(source?.crossRowEvidenceSha256 ?? ""))
  ) {
    addReason(reasons, "source-sha");
  }
  const orders = createKerrGlobalDimensionOrdersV394(transfer);
  if (JSON.stringify(model.inputDimensionOrder) !== JSON.stringify(orders.input)) {
    addReason(reasons, "input-dimension-order");
  }
  if (JSON.stringify(model.outputDimensionOrder) !== JSON.stringify(orders.output)) {
    addReason(reasons, "output-dimension-order");
  }
  if (model.covarianceSemantics !== "global-natural-log-input-covariance") {
    addReason(reasons, "covariance-semantics");
  }
  const blocks = Array.isArray(model.baseBlocks) ? model.baseBlocks : [];
  const expectedRows = new Set(transfer.rows.map(rowKey));
  const observedRows = new Set(
    blocks.filter(isObject).map((block) => rowKey(block)),
  );
  if (
    blocks.length !== 12 ||
    observedRows.size !== 12 ||
    [...expectedRows].some((key) => !observedRows.has(key))
  ) {
    addReason(reasons, "base-block-set");
  } else {
    try {
      const baseAdmission = validateKerrPhysicalCovariancePackV392(
        basePackFromModel(
          model as unknown as KerrGlobalCovarianceModelV394,
          transfer,
        ),
        transfer,
      );
      if (baseAdmission.status === "rejected") {
        addReason(reasons, "base-block-rejected");
      }
    } catch {
      addReason(reasons, "base-block-rejected");
    }
  }
  const policy = isObject(model.crossRowPolicy) ? model.crossRowPolicy : null;
  if (
    policy?.mode !== "explicit-low-rank-modes" &&
    policy?.mode !== "zero-under-independence-evidence"
  ) {
    addReason(reasons, "cross-row-policy");
  }
  const modes = Array.isArray(model.nuisanceModes) ? model.nuisanceModes : [];
  let checkedLoadingCount = 0;
  const expectedContentClass =
    model.contentClass === "synthetic-validation-fixture"
      ? "synthetic-validation-fixture"
      : "physical-source";
  for (const modeValue of modes) {
    if (!isObject(modeValue)) {
      addReason(reasons, "nuisance-mode-set");
      continue;
    }
    if (
      typeof modeValue.modeId !== "string" ||
      modeValue.modeId.length < 3 ||
      typeof modeValue.semantics !== "string" ||
      modeValue.semantics.length < 3 ||
      typeof modeValue.sourceIdentity !== "string" ||
      modeValue.sourceIdentity.length < 3 ||
      !SHA256.test(String(modeValue.sourceArtifactSha256 ?? ""))
    ) {
      addReason(reasons, "nuisance-mode-set");
    }
    if (modeValue.contentClass !== expectedContentClass) {
      addReason(reasons, "nuisance-mode-content-class");
    }
    const loadings = Array.isArray(modeValue.loadings) ? modeValue.loadings : [];
    checkedLoadingCount += loadings.length;
    if (loadings.length !== V394_INPUT_DIMENSION) {
      addReason(reasons, "nuisance-loading-dimension");
      continue;
    }
    if (!loadings.every((entry) => typeof entry === "number" && Number.isFinite(entry))) {
      addReason(reasons, "non-finite-loading");
      continue;
    }
    const touchedRows = new Set<number>();
    loadings.forEach((entry, index) => {
      if (entry !== 0) touchedRows.add(Math.floor(index / 3));
    });
    if (touchedRows.size < 2) addReason(reasons, "mode-does-not-couple-rows");
  }
  if (policy?.mode === "explicit-low-rank-modes" && modes.length === 0) {
    addReason(reasons, "nuisance-mode-set");
  }
  if (
    policy?.mode === "zero-under-independence-evidence" &&
    (modes.length !== 0 ||
      typeof policy.independenceStatement !== "string" ||
      policy.independenceStatement.trim().length < 16)
  ) {
    addReason(reasons, "independence-evidence-missing");
  }
  const rejected = reasons.length > 0;
  const validationOnly =
    !rejected && model.contentClass === "synthetic-validation-fixture";
  return Object.freeze({
    status: rejected
      ? ("rejected" as const)
      : validationOnly
        ? ("admitted-validation-only" as const)
        : ("admitted-physical" as const),
    propagationAllowed: !rejected,
    publicationAllowed:
      !rejected &&
      model.contentClass === "physical-global-covariance" &&
      model.publicationIntent === "publishable",
    rejectionReasons: Object.freeze(reasons),
    baseBlockCount: blocks.length,
    nuisanceModeCount: modes.length,
    checkedLoadingCount,
  });
}

function multiplyCovariance(
  left: readonly (readonly number[])[],
  covariance: readonly (readonly number[])[],
) {
  const intermediate = left.map((row) =>
    covariance[0].map((_, column) =>
      row.reduce(
        (sum, coefficient, index) =>
          sum + coefficient * covariance[index][column],
        0,
      ),
    ),
  );
  return intermediate.map((row) =>
    left.map((_, rightIndex) =>
      row.reduce(
        (sum, coefficient, index) =>
          sum + coefficient * left[rightIndex][index],
        0,
      ),
    ),
  );
}

export function propagateKerrGlobalCovarianceV394(
  modelValue: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
  dossierValue: KerrCovarianceSourceAdmissionArtifactV393,
): KerrGlobalCovarianceProjectionV394 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const admission = validateKerrGlobalCovarianceModelV394(
    modelValue,
    transfer,
    admissionValue,
    dossierValue,
  );
  if (!admission.propagationAllowed || admission.status === "rejected") {
    throw new Error(
      `v394-global-model-rejected:${admission.rejectionReasons.join(",")}`,
    );
  }
  const model = modelValue as KerrGlobalCovarianceModelV394;
  const inputCovariance = Array.from({ length: V394_INPUT_DIMENSION }, () =>
    Array(V394_INPUT_DIMENSION).fill(0) as number[],
  );
  model.baseBlocks.forEach((block, blockIndex) => {
    for (let left = 0; left < 3; left += 1) {
      for (let right = 0; right < 3; right += 1) {
        inputCovariance[blockIndex * 3 + left][blockIndex * 3 + right] =
          block.covariance[left][right];
      }
    }
  });
  for (const mode of model.nuisanceModes) {
    for (let left = 0; left < V394_INPUT_DIMENSION; left += 1) {
      for (let right = 0; right < V394_INPUT_DIMENSION; right += 1) {
        inputCovariance[left][right] += mode.loadings[left] * mode.loadings[right];
      }
    }
  }
  const jacobian = Array.from({ length: V394_OUTPUT_DIMENSION }, () =>
    Array(V394_INPUT_DIMENSION).fill(0) as number[],
  );
  transfer.rows.forEach((row, rowIndex) => {
    for (let output = 0; output < 2; output += 1) {
      for (let input = 0; input < 3; input += 1) {
        jacobian[rowIndex * 2 + output][rowIndex * 3 + input] =
          row.transferMatrix[output][input];
      }
    }
  });
  const outputCovariance = multiplyCovariance(jacobian, inputCovariance);
  let maximumInputSymmetryAbsoluteError = 0;
  let maximumOutputSymmetryAbsoluteError = 0;
  let maximumCrossRowAbsoluteCovariance = 0;
  for (let left = 0; left < V394_INPUT_DIMENSION; left += 1) {
    for (let right = 0; right < V394_INPUT_DIMENSION; right += 1) {
      maximumInputSymmetryAbsoluteError = Math.max(
        maximumInputSymmetryAbsoluteError,
        Math.abs(inputCovariance[left][right] - inputCovariance[right][left]),
      );
      if (Math.floor(left / 3) !== Math.floor(right / 3)) {
        maximumCrossRowAbsoluteCovariance = Math.max(
          maximumCrossRowAbsoluteCovariance,
          Math.abs(inputCovariance[left][right]),
        );
      }
    }
  }
  for (let left = 0; left < V394_OUTPUT_DIMENSION; left += 1) {
    for (let right = 0; right < V394_OUTPUT_DIMENSION; right += 1) {
      maximumOutputSymmetryAbsoluteError = Math.max(
        maximumOutputSymmetryAbsoluteError,
        Math.abs(outputCovariance[left][right] - outputCovariance[right][left]),
      );
    }
  }
  const orders = createKerrGlobalDimensionOrdersV394(transfer);
  return Object.freeze({
    admissionStatus: admission.status,
    publicationAllowed: admission.publicationAllowed,
    inputDimensionOrder: orders.input,
    outputDimensionOrder: orders.output,
    inputCovariance: Object.freeze(
      inputCovariance.map((row) => Object.freeze(row)),
    ),
    outputCovariance: Object.freeze(
      outputCovariance.map((row) => Object.freeze(row)),
    ),
    metrics: Object.freeze({
      inputCoefficientCount: 1296 as const,
      outputCoefficientCount: 576 as const,
      maximumInputSymmetryAbsoluteError,
      maximumOutputSymmetryAbsoluteError,
      maximumCrossRowAbsoluteCovariance,
      minimumInputDiagonal: Math.min(
        ...inputCovariance.map((row, index) => row[index]),
      ),
      minimumOutputDiagonal: Math.min(
        ...outputCovariance.map((row, index) => row[index]),
      ),
    }),
  });
}

export function createKerrGlobalCovarianceControlFixtureV394(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
  dossierValue: KerrCovarianceSourceAdmissionArtifactV393,
): KerrGlobalCovarianceModelV394 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const admission = parseKerrPhysicalCovarianceAdmissionArtifactV392(
    admissionValue,
  );
  const dossier = parseKerrCovarianceSourceAdmissionArtifactV393(dossierValue);
  const orders = createKerrGlobalDimensionOrdersV394(transfer);
  const baseBlocks = transfer.rows.map((row, index) => {
    const scale = 1 + index * 0.025;
    return Object.freeze({
      rayIndex: row.rayIndex,
      rayId: row.rayId,
      bandId: row.bandId,
      covariance: Object.freeze([
        Object.freeze([4e-4 * scale, 2e-5 * scale, -1e-5 * scale] as const),
        Object.freeze([2e-5 * scale, 1e-4 * scale, 1.5e-5 * scale] as const),
        Object.freeze([-1e-5 * scale, 1.5e-5 * scale, 9e-4 * scale] as const),
      ] as const),
    });
  });
  const modeDefinitions = [
    {
      id: "global-photon-calibration",
      semantics: "shared detector gain across all ray-band rows",
      loading: (rowIndex: number, inputIndex: number) =>
        inputIndex === 0 ? 5e-4 * (1 + rowIndex / 48) : 0,
    },
    {
      id: "visible-redshift-frame",
      semantics: "shared redshift frame mode across visible rows",
      loading: (rowIndex: number, inputIndex: number) =>
        inputIndex === 1 && transfer.rows[rowIndex].bandId === "visible"
          ? 3e-4
          : 0,
    },
    {
      id: "disk-flux-band-tilt",
      semantics: "shared Page-Thorne spectral tilt across all bands",
      loading: (rowIndex: number, inputIndex: number) =>
        inputIndex === 2
          ? 4e-4 * ([1, -0.6, 0.35][rowIndex % 3] ?? 0)
          : 0,
    },
  ] as const;
  const nuisanceModes = modeDefinitions.map((definition, modeIndex) =>
    Object.freeze({
      modeId: definition.id,
      semantics: definition.semantics,
      contentClass: "synthetic-validation-fixture" as const,
      sourceIdentity: `v394-control:${definition.id}`,
      sourceArtifactSha256: String(modeIndex + 4).repeat(64),
      loadings: Object.freeze(
        Array.from({ length: V394_INPUT_DIMENSION }, (_, index) =>
          definition.loading(Math.floor(index / 3), index % 3),
        ),
      ),
    }),
  );
  return Object.freeze({
    version: KERR_GLOBAL_COVARIANCE_MODEL_VERSION_V394,
    modelId: "v394-global-covariance-control-fixture",
    contentClass: "synthetic-validation-fixture",
    publicationIntent: "validation-only",
    source: Object.freeze({
      v390TransferArtifactSha256: transfer.artifactSha256,
      v392AdmissionArtifactSha256: admission.artifactSha256,
      v393SourceAdmissionArtifactSha256: dossier.artifactSha256,
      modelSourceArtifactSha256: "a".repeat(64),
      crossRowEvidenceSha256: "b".repeat(64),
    }),
    inputDimensionOrder: orders.input,
    outputDimensionOrder: orders.output,
    covarianceSemantics: "global-natural-log-input-covariance",
    baseBlocks: Object.freeze(baseBlocks),
    crossRowPolicy: Object.freeze({
      mode: "explicit-low-rank-modes" as const,
      independenceStatement: null,
    }),
    nuisanceModes: Object.freeze(nuisanceModes),
  });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createKerrGlobalCovarianceAdversarialFixturesV394(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
  dossierValue: KerrCovarianceSourceAdmissionArtifactV393,
) {
  const control = createKerrGlobalCovarianceControlFixtureV394(
    transferValue,
    admissionValue,
    dossierValue,
  );
  const wrongDossierSha = clone(control) as unknown as MutableRecord;
  (wrongDossierSha.source as MutableRecord).v393SourceAdmissionArtifactSha256 =
    "c".repeat(64);
  const wrongInputOrder = clone(control) as unknown as MutableRecord;
  (wrongInputOrder.inputDimensionOrder as unknown[]).reverse();
  const missingBlock = clone(control) as unknown as MutableRecord;
  (missingBlock.baseBlocks as unknown[]).pop();
  const indefiniteBlock = clone(control) as unknown as MutableRecord;
  ((((indefiniteBlock.baseBlocks as MutableRecord[])[0]
    .covariance as number[][])[0][0])) = -1;
  const missingModes = clone(control) as unknown as MutableRecord;
  missingModes.nuisanceModes = [];
  const nonFiniteLoading = clone(control) as unknown as MutableRecord;
  (((nonFiniteLoading.nuisanceModes as MutableRecord[])[0]
    .loadings as unknown[])[0]) = Number.POSITIVE_INFINITY;
  const singleRowMode = clone(control) as unknown as MutableRecord;
  const singleLoadings = Array(V394_INPUT_DIMENSION).fill(0);
  singleLoadings[0] = 1e-3;
  (singleRowMode.nuisanceModes as MutableRecord[])[0].loadings = singleLoadings;
  const missingIndependence = clone(control) as unknown as MutableRecord;
  missingIndependence.nuisanceModes = [];
  (missingIndependence.crossRowPolicy as MutableRecord).mode =
    "zero-under-independence-evidence";
  (missingIndependence.crossRowPolicy as MutableRecord).independenceStatement =
    null;
  const syntheticPublishable = clone(control) as unknown as MutableRecord;
  syntheticPublishable.publicationIntent = "publishable";
  return Object.freeze([
    Object.freeze({ id: "wrong-dossier-sha", value: wrongDossierSha, expectedReason: "dossier-source-sha" as const }),
    Object.freeze({ id: "wrong-input-order", value: wrongInputOrder, expectedReason: "input-dimension-order" as const }),
    Object.freeze({ id: "missing-base-block", value: missingBlock, expectedReason: "base-block-set" as const }),
    Object.freeze({ id: "indefinite-base-block", value: indefiniteBlock, expectedReason: "base-block-rejected" as const }),
    Object.freeze({ id: "explicit-policy-without-modes", value: missingModes, expectedReason: "nuisance-mode-set" as const }),
    Object.freeze({ id: "non-finite-loading", value: nonFiniteLoading, expectedReason: "non-finite-loading" as const }),
    Object.freeze({ id: "mode-does-not-couple-rows", value: singleRowMode, expectedReason: "mode-does-not-couple-rows" as const }),
    Object.freeze({ id: "missing-independence-evidence", value: missingIndependence, expectedReason: "independence-evidence-missing" as const }),
    Object.freeze({ id: "synthetic-marked-publishable", value: syntheticPublishable, expectedReason: "synthetic-fixture-marked-publishable" as const }),
  ]);
}

export function parseKerrGlobalCovariancePropagationArtifactV394(
  value: unknown,
): KerrGlobalCovariancePropagationArtifactV394 {
  const source = isObject(value)
    ? (value as Partial<KerrGlobalCovariancePropagationArtifactV394>)
    : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures)
    ? source.validator.adversarialFixtures
    : [];
  if (
    !source ||
    source.version !== KERR_GLOBAL_COVARIANCE_PROPAGATION_VERSION_V394 ||
    source.status !==
      "global-covariance-propagation-qualified-physical-cross-row-model-unavailable" ||
    !source.source ||
    Object.keys(source.source).length !== 4 ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    source.dimensions?.rowCount !== 12 ||
    source.dimensions.inputPerRow !== 3 ||
    source.dimensions.outputPerRow !== 2 ||
    source.dimensions.inputDimension !== 36 ||
    source.dimensions.outputDimension !== 24 ||
    source.dimensions.inputCovarianceCoefficientCount !== 1296 ||
    source.dimensions.outputCovarianceCoefficientCount !== 576 ||
    source.validator?.qualified !== true ||
    source.validator.acceptedControlFixtureCount !== 1 ||
    source.validator.rejectedAdversarialFixtureCount !== 9 ||
    fixtures.length !== 9 ||
    fixtures.some(
      (fixture) =>
        fixture.rejected !== true ||
        fixture.expectedReason !== fixture.observedReason,
    ) ||
    source.selfTest?.fixtureClass !== "synthetic-validation-fixture" ||
    source.selfTest.publishable !== false ||
    source.selfTest.nuisanceModeCount !== 3 ||
    source.selfTest.propagationExecuted !== true ||
    !(source.selfTest.maximumCrossRowAbsoluteCovariance > 0) ||
    !(source.selfTest.minimumInputDiagonal > 0) ||
    !(source.selfTest.minimumOutputDiagonal > 0) ||
    source.selfTest.maximumPythonOracleRelativeDifference >=
      V394_ORACLE_RELATIVE_LIMIT ||
    source.productionAdmission?.globalCovarianceModelAvailable !== false ||
    source.productionAdmission.crossRowEvidenceAvailable !== false ||
    source.productionAdmission.nuisanceModesAvailable !== 0 ||
    source.productionAdmission.globalCovarianceAdmitted !== false ||
    source.productionAdmission.covariancePropagationExecuted !== false ||
    source.productionAdmission.blockIndependenceAssumed !== false ||
    source.productionAdmission.missingCrossRowTermsTreatedAsZero !== false ||
    source.productionAdmission.probabilityContentAssigned !== false ||
    source.productionAdmission.confidenceInterval !== false ||
    source.productionAdmission.outputCovariance !== null ||
    source.productionAdmission.absoluteScientificInterval !== null ||
    source.qualification?.globalCovarianceInfrastructureQualified !== true ||
    source.qualification.blockJacobianPropagationQualified !== true ||
    source.qualification.crossRowModeAssemblyQualified !== true ||
    source.qualification.physicalGlobalCovarianceQualified !== false ||
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
    throw new Error("v394-global-covariance-artifact-identity");
  }
  return value as KerrGlobalCovariancePropagationArtifactV394;
}
