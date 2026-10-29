import { createHash } from "node:crypto";

export const KERR_MEASURED_DETECTOR_BLIND_VALIDATION_ARTIFACT_VERSION_V459 =
  "v459-kerr-measured-detector-blind-validation-artifact-v1" as const;
export const KERR_MEASURED_DETECTOR_BLIND_VALIDATION_SUMMARY_VERSION_V459 =
  "v459-kerr-measured-detector-blind-validation-summary-v1" as const;
export const KERR_MEASURED_DETECTOR_BLIND_VALIDATION_API_VERSION_V459 =
  "v459-kerr-measured-detector-blind-validation-api-v1" as const;
export const KERR_MEASURED_DETECTOR_BLIND_VALIDATION_PROTOCOL_V459 =
  "v459-blind-train-holdout-protocol-v1" as const;

export type KerrMeasuredDetectorBlindSplitResultV459 = Readonly<{
  status: "qualified" | "rejected";
  trainCount: number;
  holdoutCount: number;
  overlapIds: readonly string[];
  duplicateTrainIds: readonly string[];
  duplicateHoldoutIds: readonly string[];
  reason:
    | "none"
    | "train-empty"
    | "holdout-empty"
    | "train-holdout-overlap"
    | "duplicate-train-id"
    | "duplicate-holdout-id";
}>;

export type KerrMeasuredDetectorBlindValidationArtifactV459 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_BLIND_VALIDATION_ARTIFACT_VERSION_V459;
  generatedAt: string;
  status: "blind-validation-protocol-qualified-measured-inputs-unavailable";
  source: Readonly<{
    v458IntakeArtifactSha256: string;
    v458SchemaPackSha256: string;
    v457PromotionGateArtifactSha256: string;
  }>;
  protocol: Readonly<{
    version: typeof KERR_MEASURED_DETECTOR_BLIND_VALIDATION_PROTOCOL_V459;
    split: "train-calibration-vs-blind-holdout";
    stratification: readonly ["instrumentId", "detectorId", "band", "axis"];
    fixedFoldCount: 3;
    minimumRepeatsPerFold: 3;
    holdoutFractionTarget: 0.2;
    sourceRowsNeverFitOnHoldout: true;
    holdoutReadOnlyAfterLock: true;
    fitArtifactsContentAddressed: true;
    overlapTolerance: 0;
    explicitAuthorityGrantRequired: true;
  }>;
  leakageControls: Readonly<{
    idsDisjoint: false;
    duplicateIdsAbsent: false;
    preprocessingFitOnTrainOnly: true;
    holdoutUsedForThresholdSelection: false;
    provenanceShaLockedBeforeFit: true;
    sourceMutationDetected: false;
    randomSeed: "v459-fixed-stratification-v1";
  }>;
  thresholds: Readonly<{
    plateScaleRepeatCvMax: 0.005;
    distortionHoldoutMaxResidualPx: 0.1;
    psfRepeatCvMax: 0.05;
    pixelResponseRelativeResidualMax: 0.02;
    holdoutCoverageMin: 0.95;
    thresholdSelectionStatus: "pre-registered-not-fit";
  }>;
  uncertaintyBudget: Readonly<{
    components: readonly [
      "uRepeatability",
      "uTrainFit",
      "uHoldout",
      "uReference",
      "uInitialState",
    ];
    combination: "linear-unless-independence-proven";
    rssAllowed: false;
    measuredComponentsAvailable: false;
    budgetClosed: false;
  }>;
  control: Readonly<{
    split: KerrMeasuredDetectorBlindSplitResultV459;
    status: "validation-only";
    authorityGranted: false;
    observedRows: 12;
    overlapRows: 0;
  }>;
  adversarialFixtures: readonly Readonly<{
    id: string;
    expectedReason: KerrMeasuredDetectorBlindSplitResultV459["reason"];
    observedReason: KerrMeasuredDetectorBlindSplitResultV459["reason"];
    rejected: true;
  }>[];
  inspect: Readonly<{
    measuredInputReady: false;
    trainRows: 0;
    holdoutRows: 0;
    overlapRows: 0;
    duplicateRows: 0;
    fitExecuted: false;
    holdoutExecuted: false;
    validationExecuted: false;
    authorityGranted: false;
    attemptConsumed: false;
  }>;
  qualification: Readonly<{
    protocolQualified: true;
    leakageControlsQualified: true;
    uncertaintyBudgetContractQualified: true;
    measuredBlindValidationQualified: false;
    detectorAuthorityGranted: false;
    browserQualification: "not-run";
  }>;
  boundary: Readonly<{
    holdoutValuesPresent: false;
    sciencePixelsAvailable: false;
    fitsWriteAllowed: false;
    pngWriteAllowed: false;
    sciencePayloadMutationAllowed: false;
    networkAttempted: false;
    automaticRetryApplied: false;
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrMeasuredDetectorBlindValidationSummaryV459 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_BLIND_VALIDATION_SUMMARY_VERSION_V459;
  status: KerrMeasuredDetectorBlindValidationArtifactV459["status"];
  artifactSha256: string;
  protocol: KerrMeasuredDetectorBlindValidationArtifactV459["protocol"];
  leakageControls: KerrMeasuredDetectorBlindValidationArtifactV459["leakageControls"];
  thresholds: KerrMeasuredDetectorBlindValidationArtifactV459["thresholds"];
  uncertaintyBudget: KerrMeasuredDetectorBlindValidationArtifactV459["uncertaintyBudget"];
  control: KerrMeasuredDetectorBlindValidationArtifactV459["control"];
  adversarialFixtures: KerrMeasuredDetectorBlindValidationArtifactV459["adversarialFixtures"];
  inspect: KerrMeasuredDetectorBlindValidationArtifactV459["inspect"];
  qualification: KerrMeasuredDetectorBlindValidationArtifactV459["qualification"];
  boundary: KerrMeasuredDetectorBlindValidationArtifactV459["boundary"];
}>;

export type KerrMeasuredDetectorBlindValidationApiV459 = Readonly<{
  version: typeof KERR_MEASURED_DETECTOR_BLIND_VALIDATION_API_VERSION_V459;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: KerrMeasuredDetectorBlindValidationSummaryV459 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const transientKeys = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeDeep(child);
    }
  }
  return value;
};
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transientKeys.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
export const canonicalKerrMeasuredDetectorBlindValidationPayloadV459 = (
  value: unknown,
): string => JSON.stringify(canonicalize(value));

const unique = (values: readonly string[]): string[] =>
  values.filter((value, index) => values.indexOf(value) === index);

export function validateKerrMeasuredDetectorBlindSplitV459(
  trainIds: readonly string[],
  holdoutIds: readonly string[],
): KerrMeasuredDetectorBlindSplitResultV459 {
  const duplicateTrainIds = unique(
    trainIds.filter((value, index) => trainIds.indexOf(value) !== index),
  );
  const duplicateHoldoutIds = unique(
    holdoutIds.filter((value, index) => holdoutIds.indexOf(value) !== index),
  );
  const overlapIds = unique(trainIds.filter((value) => holdoutIds.includes(value)));
  const reason = duplicateTrainIds.length
    ? "duplicate-train-id"
    : duplicateHoldoutIds.length
      ? "duplicate-holdout-id"
      : overlapIds.length
        ? "train-holdout-overlap"
        : trainIds.length === 0
          ? "train-empty"
          : holdoutIds.length === 0
            ? "holdout-empty"
            : "none";
  return freezeDeep({
    status: reason === "none" ? "qualified" : "rejected",
    trainCount: trainIds.length,
    holdoutCount: holdoutIds.length,
    overlapIds,
    duplicateTrainIds,
    duplicateHoldoutIds,
    reason,
  });
}

export function parseKerrMeasuredDetectorBlindValidationArtifactV459(
  value: unknown,
): KerrMeasuredDetectorBlindValidationArtifactV459 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrMeasuredDetectorBlindValidationArtifactV459>)
      : null;
  if (
    !artifact ||
    artifact.version !==
      KERR_MEASURED_DETECTOR_BLIND_VALIDATION_ARTIFACT_VERSION_V459 ||
    artifact.status !==
      "blind-validation-protocol-qualified-measured-inputs-unavailable" ||
    !SHA256.test(artifact.artifactSha256 ?? "") ||
    !artifact.source ||
    Object.values(artifact.source).some((entry) => !SHA256.test(entry)) ||
    artifact.protocol?.version !== KERR_MEASURED_DETECTOR_BLIND_VALIDATION_PROTOCOL_V459 ||
    artifact.protocol.fixedFoldCount !== 3 ||
    artifact.protocol.minimumRepeatsPerFold !== 3 ||
    artifact.protocol.sourceRowsNeverFitOnHoldout !== true ||
    artifact.protocol.holdoutReadOnlyAfterLock !== true ||
    artifact.protocol.overlapTolerance !== 0 ||
    artifact.protocol.explicitAuthorityGrantRequired !== true ||
    artifact.leakageControls?.idsDisjoint !== false ||
    artifact.leakageControls.duplicateIdsAbsent !== false ||
    artifact.leakageControls.preprocessingFitOnTrainOnly !== true ||
    artifact.leakageControls.holdoutUsedForThresholdSelection !== false ||
    artifact.leakageControls.provenanceShaLockedBeforeFit !== true ||
    artifact.leakageControls.sourceMutationDetected !== false ||
    artifact.thresholds?.thresholdSelectionStatus !== "pre-registered-not-fit" ||
    artifact.thresholds.plateScaleRepeatCvMax !== 0.005 ||
    artifact.uncertaintyBudget?.combination !==
      "linear-unless-independence-proven" ||
    artifact.uncertaintyBudget.rssAllowed !== false ||
    artifact.uncertaintyBudget.measuredComponentsAvailable !== false ||
    artifact.uncertaintyBudget.budgetClosed !== false ||
    artifact.control?.status !== "validation-only" ||
    artifact.control.authorityGranted !== false ||
    artifact.control.split.status !== "qualified" ||
    artifact.control.split.overlapIds.length !== 0 ||
    artifact.control.overlapRows !== 0 ||
    artifact.adversarialFixtures?.length !== 6 ||
    artifact.adversarialFixtures?.some(
      (fixture) =>
        fixture.rejected !== true || fixture.expectedReason !== fixture.observedReason,
    ) ||
    artifact.inspect?.measuredInputReady !== false ||
    artifact.inspect.trainRows !== 0 ||
    artifact.inspect.holdoutRows !== 0 ||
    artifact.inspect.overlapRows !== 0 ||
    artifact.inspect.duplicateRows !== 0 ||
    artifact.inspect.fitExecuted !== false ||
    artifact.inspect.holdoutExecuted !== false ||
    artifact.inspect.validationExecuted !== false ||
    artifact.inspect.authorityGranted !== false ||
    artifact.inspect.attemptConsumed !== false ||
    artifact.qualification?.protocolQualified !== true ||
    artifact.qualification.leakageControlsQualified !== true ||
    artifact.qualification.uncertaintyBudgetContractQualified !== true ||
    artifact.qualification.measuredBlindValidationQualified !== false ||
    artifact.qualification.detectorAuthorityGranted !== false ||
    artifact.qualification.browserQualification !== "not-run" ||
    artifact.boundary?.holdoutValuesPresent !== false ||
    artifact.boundary.sciencePixelsAvailable !== false ||
    artifact.boundary.fitsWriteAllowed !== false ||
    artifact.boundary.pngWriteAllowed !== false ||
    artifact.boundary.sciencePayloadMutationAllowed !== false ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn" ||
    artifact.denseCampaignStatus !== "incomplete-0-of-49"
  ) {
    throw new Error("v459-blind-validation-artifact-identity");
  }
  return freezeDeep(value as KerrMeasuredDetectorBlindValidationArtifactV459);
}

export function createKerrMeasuredDetectorBlindValidationSummaryV459(
  value: unknown,
): KerrMeasuredDetectorBlindValidationSummaryV459 {
  const artifact = parseKerrMeasuredDetectorBlindValidationArtifactV459(value);
  return freezeDeep({
    version: KERR_MEASURED_DETECTOR_BLIND_VALIDATION_SUMMARY_VERSION_V459,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    protocol: artifact.protocol,
    leakageControls: artifact.leakageControls,
    thresholds: artifact.thresholds,
    uncertaintyBudget: artifact.uncertaintyBudget,
    control: artifact.control,
    adversarialFixtures: artifact.adversarialFixtures,
    inspect: artifact.inspect,
    qualification: artifact.qualification,
    boundary: artifact.boundary,
  });
}

export function parseKerrMeasuredDetectorBlindValidationApiV459(
  value: unknown,
): KerrMeasuredDetectorBlindValidationApiV459 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<KerrMeasuredDetectorBlindValidationApiV459>)
      : null;
  if (
    !api ||
    api.version !== KERR_MEASURED_DETECTOR_BLIND_VALIDATION_API_VERSION_V459 ||
    typeof api.available !== "boolean" ||
    ![
      "ready",
      "lite-boundary",
      "local-shadow-only",
      "evidence-corrupt",
      "request-failed",
    ].includes(api.reason ?? "") ||
    (api.available && !api.summary) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v459-blind-validation-api-identity");
  }
  return freezeDeep(value as KerrMeasuredDetectorBlindValidationApiV459);
}

export const hashBlindValidationIdsV459 = (ids: readonly string[]): string =>
  createHash("sha256").update(ids.join("\n")).digest("hex");
