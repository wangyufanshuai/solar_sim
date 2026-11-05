import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  canonicalKerrMeasuredDetectorBlindValidationPayloadV459,
  KERR_MEASURED_DETECTOR_BLIND_VALIDATION_ARTIFACT_VERSION_V459,
  parseKerrMeasuredDetectorBlindValidationArtifactV459,
  validateKerrMeasuredDetectorBlindSplitV459,
} from "../app/lib/kerrMeasuredDetectorBlindValidationV459";

const root = process.cwd();
const paths = {
  v458: "dist/science/kerr-measured-detector-intake-v458/intake-inspect.json",
  schema: "dist/science/kerr-measured-detector-intake-v458/schema-pack.json",
  v457: "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-measured-detector-blind-validation-v459/blind-validation.json",
};
const read = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const sha = (value: unknown): string =>
  createHash("sha256")
    .update(canonicalKerrMeasuredDetectorBlindValidationPayloadV459(value))
    .digest("hex");
const atomic = (path: string, value: unknown): void => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v458 = read(paths.v458);
const schema = read(paths.schema);
const v457 = read(paths.v457);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  v458.version !== "v458-kerr-measured-detector-intake-artifact-v1" ||
  v458.inspect?.readyFileCount !== 0 ||
  v458.productionAdmission?.measuredDetectorAuthorityGranted !== false ||
  schema.schemaCount !== 6 ||
  v457.decisions?.promotionAllowed !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v459-source-boundary");
}

const controlTrain = [
  "synthetic-instrument|synthetic-detector|synthetic-campaign|x|1",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|x|2",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|y|1",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|y|2",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|x|3",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|y|3",
];
const controlHoldout = [
  "synthetic-instrument|synthetic-detector|synthetic-campaign|x|4",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|y|4",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|x|5",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|y|5",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|x|6",
  "synthetic-instrument|synthetic-detector|synthetic-campaign|y|6",
];
const controlSplit = validateKerrMeasuredDetectorBlindSplitV459(
  controlTrain,
  controlHoldout,
);
if (controlSplit.status !== "qualified" || controlSplit.overlapIds.length !== 0) {
  throw new Error("v459-control-split");
}
const adversarialInputs = [
  ["empty-train", [], ["h1"], "train-empty"],
  ["empty-holdout", ["t1"], [], "holdout-empty"],
  ["overlap", ["t1", "shared"], ["shared", "h1"], "train-holdout-overlap"],
  ["duplicate-train", ["t1", "t1"], ["h1"], "duplicate-train-id"],
  ["duplicate-holdout", ["t1"], ["h1", "h1"], "duplicate-holdout-id"],
  ["overlap-and-duplicate", ["shared", "shared"], ["shared"], "duplicate-train-id"],
] as const;
const adversarialFixtures = adversarialInputs.map(
  ([id, train, holdout, expectedReason]) => {
    const observed = validateKerrMeasuredDetectorBlindSplitV459(train, holdout);
    if (observed.reason !== expectedReason || observed.status !== "rejected") {
      throw new Error(`v459-adversarial-split:${id}`);
    }
    return Object.freeze({
      id,
      expectedReason,
      observedReason: observed.reason,
      rejected: true as const,
    });
  },
);
const unsigned = {
  version: KERR_MEASURED_DETECTOR_BLIND_VALIDATION_ARTIFACT_VERSION_V459,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "blind-validation-protocol-qualified-measured-inputs-unavailable" as const,
  source: {
    v458IntakeArtifactSha256: v458.artifactSha256,
    v458SchemaPackSha256: v458.schemaPack.schemaPackSha256,
    v457PromotionGateArtifactSha256: v457.artifactSha256,
  },
  protocol: {
    version: "v459-blind-train-holdout-protocol-v1" as const,
    split: "train-calibration-vs-blind-holdout" as const,
    stratification: ["instrumentId", "detectorId", "band", "axis"] as const,
    fixedFoldCount: 3 as const,
    minimumRepeatsPerFold: 3 as const,
    holdoutFractionTarget: 0.2,
    sourceRowsNeverFitOnHoldout: true as const,
    holdoutReadOnlyAfterLock: true as const,
    fitArtifactsContentAddressed: true as const,
    overlapTolerance: 0 as const,
    explicitAuthorityGrantRequired: true as const,
  },
  leakageControls: {
    idsDisjoint: false as const,
    duplicateIdsAbsent: false as const,
    preprocessingFitOnTrainOnly: true as const,
    holdoutUsedForThresholdSelection: false as const,
    provenanceShaLockedBeforeFit: true as const,
    sourceMutationDetected: false as const,
    randomSeed: "v459-fixed-stratification-v1" as const,
  },
  thresholds: {
    plateScaleRepeatCvMax: 0.005,
    distortionHoldoutMaxResidualPx: 0.1,
    psfRepeatCvMax: 0.05,
    pixelResponseRelativeResidualMax: 0.02,
    holdoutCoverageMin: 0.95,
    thresholdSelectionStatus: "pre-registered-not-fit" as const,
  },
  uncertaintyBudget: {
    components: [
      "uRepeatability",
      "uTrainFit",
      "uHoldout",
      "uReference",
      "uInitialState",
    ] as const,
    combination: "linear-unless-independence-proven" as const,
    rssAllowed: false as const,
    measuredComponentsAvailable: false as const,
    budgetClosed: false as const,
  },
  control: {
    split: controlSplit,
    status: "validation-only" as const,
    authorityGranted: false as const,
    observedRows: 12 as const,
    overlapRows: 0 as const,
  },
  adversarialFixtures,
  inspect: {
    measuredInputReady: false as const,
    trainRows: 0 as const,
    holdoutRows: 0 as const,
    overlapRows: 0 as const,
    duplicateRows: 0 as const,
    fitExecuted: false as const,
    holdoutExecuted: false as const,
    validationExecuted: false as const,
    authorityGranted: false as const,
    attemptConsumed: false as const,
  },
  qualification: {
    protocolQualified: true as const,
    leakageControlsQualified: true as const,
    uncertaintyBudgetContractQualified: true as const,
    measuredBlindValidationQualified: false as const,
    detectorAuthorityGranted: false as const,
    browserQualification: "not-run" as const,
  },
  boundary: {
    holdoutValuesPresent: false as const,
    sciencePixelsAvailable: false as const,
    fitsWriteAllowed: false as const,
    pngWriteAllowed: false as const,
    sciencePayloadMutationAllowed: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
};
const artifact = parseKerrMeasuredDetectorBlindValidationArtifactV459({
  ...unsigned,
  artifactSha256: sha(unsigned),
});
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      protocol: artifact.protocol.version,
      controlSplit: `${artifact.control.split.trainCount} train / ${artifact.control.split.holdoutCount} holdout / ${artifact.control.split.overlapIds.length} overlap`,
      adversarialFixtures: artifact.adversarialFixtures.length,
      fitExecuted: artifact.inspect.fitExecuted,
      holdoutExecuted: artifact.inspect.holdoutExecuted,
      authorityGranted: artifact.inspect.authorityGranted,
      rssAllowed: artifact.uncertaintyBudget.rssAllowed,
    },
    null,
    2,
  ),
);
