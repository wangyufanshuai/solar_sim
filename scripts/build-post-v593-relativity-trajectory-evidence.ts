import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  RELATIVITY_TRAJECTORY_REFERENCE_V3_BOUNDARY,
  RELATIVITY_TRAJECTORY_REFERENCE_V3_VERSION,
  canonicalRelativityTrajectoryReferenceV3,
  runRelativityTrajectoryReferenceV3,
} from "../app/lib/relativityTrajectoryReferenceV3";

const root = process.cwd();
const generatedAt = process.env.ATLAS_RELATIVITY_TRAJECTORY_GENERATED_AT
  ?? process.env.ATLAS_RELATIVITY_DOSSIER_GENERATED_AT
  ?? "2026-08-25T00:00:00Z";
const evidenceRelativePath =
  "public/data/post-v593-stellar-relativity/relativity-trajectory-reference-v3.json";
const receiptRelativePath =
  "docs/release/post-v593/relativity-trajectory-reference-receipt-v3.json";
const evidencePath = resolve(root, evidenceRelativePath);
const receiptPath = resolve(root, receiptRelativePath);
const sourcePaths = [
  "app/lib/relativityTrajectoryReferenceV3.ts",
  "app/lib/physicsEngine.ts",
  "app/lib/relativityForceModelV2.ts",
  "app/lib/physicalConstants.ts",
  "app/lib/sha256BrowserV566.ts",
  "scripts/build-post-v593-relativity-trajectory-evidence.ts",
] as const;

const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    )
    : value;
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const canonicalSha = (value: unknown) => sha256(JSON.stringify(canonicalize(value)));
const writeJson = (path: string, value: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const arraysEqual = (left: ArrayLike<number>, right: ArrayLike<number>) =>
  left.length === right.length
  && Array.from(left).every((value, index) => Object.is(value, Number(right[index])));

const bodyIds = ["sun", "earth", "jupiter"] as const;
const initial = {
  sampleId: "j2000",
  positionM: [
    0, 0, 0,
    1.495978707e11, 0, 0,
    0, 7.7857e11, 0,
  ],
  velocityMS: [
    0, 0, 0,
    0, 29_784.6918, 0,
    -13_070, 0, 0,
  ],
  massKg: [1.98847e30, 5.9722e24, 1.89813e27],
} as const;
const durationSeconds = 8 * 86_400;
const coarseStepSeconds = 21_600;
const makeInput = () => ({
  bodyIds,
  initialState: {
    sampleId: initial.sampleId,
    positionM: new Float64Array(initial.positionM),
    velocityMS: new Float64Array(initial.velocityMS),
    massKg: new Float64Array(initial.massKg),
  },
  durationSeconds,
  coarseStepSeconds,
} as const);

const firstInput = makeInput();
const positionBefore = firstInput.initialState.positionM.slice();
const velocityBefore = firstInput.initialState.velocityMS.slice();
const massBefore = firstInput.initialState.massKg.slice();
const run = runRelativityTrajectoryReferenceV3(firstInput);
const replay = runRelativityTrajectoryReferenceV3(makeInput());
const sourceFiles = sourcePaths.map((path) => ({
  path,
  sha256: sha256(readFileSync(resolve(root, path))),
}));
const sourceBundleSha256 = canonicalSha(sourceFiles);
const observedOrdersFinite = run.convergence.rows.every(
  (row) => row.observedPositionOrder !== null && row.observedVelocityOrder !== null,
);
const v2ReverseSpinPolicyQualified = run.reverseTimeRoundTrip.rows.every((row) =>
  row.solarSpinAngularMomentumReversedForBackwardLeg
    === (row.kernel === "eih-1pn-plus-v2-shadow"));
const effectIsolationQualified = [
  run.effectIsolation.twoPnPositionRmsM,
  run.effectIsolation.twoPnVelocityRmsMS,
  run.effectIsolation.lenseThirringPositionRmsM,
  run.effectIsolation.lenseThirringVelocityRmsMS,
  run.effectIsolation.combinedPositionRmsM,
  run.effectIsolation.combinedVelocityRmsMS,
].every((value) => Number.isFinite(value) && value > 0)
  && run.effectIsolation.additivityResidualPositionRmsM
    < run.effectIsolation.combinedPositionRmsM
  && run.effectIsolation.additivityResidualVelocityRmsMS
    < run.effectIsolation.combinedVelocityRmsMS;
const gates = {
  deterministicReplay: run.resultSha256 === replay.resultSha256
    && canonicalRelativityTrajectoryReferenceV3(run)
      === canonicalRelativityTrajectoryReferenceV3(replay),
  callerArraysUnchanged: arraysEqual(firstInput.initialState.positionM, positionBefore)
    && arraysEqual(firstInput.initialState.velocityMS, velocityBefore)
    && arraysEqual(firstInput.initialState.massKg, massBefore),
  threeKernelObservedOrderQualified: observedOrdersFinite && run.convergence.allQualified,
  fullTrajectoryReverseTimeQualified: run.reverseTimeRoundTrip.fullTimeIntegration
    && run.reverseTimeRoundTrip.allQualified,
  v2ReverseSpinPolicyQualified,
  perBodyQualified: run.perBody.length === bodyIds.length
    && run.perBody.every((row, index) => row.bodyId === bodyIds[index] && row.finite),
  aggregateQualified: run.aggregate.finite
    && run.aggregate.legacyMinusNewtonPositionRmsM > 0
    && run.aggregate.legacyMinusNewtonVelocityRmsMS > 0
    && run.aggregate.v2MinusLegacyPositionRmsM > 0
    && run.aggregate.v2MinusLegacyVelocityRmsMS > 0,
  effectIsolationQualified,
  boundaryQualified: run.mode === "shadow-read-only"
    && run.liveStateMutated === false
    && run.workerStateMutated === false
    && run.scientificPayloadWriteback === false
    && run.promotion === "not-a-promotion-decision",
};
const allQualified = Object.values(gates).every(Boolean);
const evidenceUnsigned = {
  version: "post-v593-relativity-trajectory-evidence-v3",
  generatedAt,
  status: allQualified
    ? "qualified-shadow-only-three-kernel-full-trajectory-reference"
    : "blocked-shadow-only-full-trajectory-reference-gates",
  runner: {
    version: RELATIVITY_TRAJECTORY_REFERENCE_V3_VERSION,
    boundary: RELATIVITY_TRAJECTORY_REFERENCE_V3_BOUNDARY,
    resultSha256: run.resultSha256,
  },
  source: {
    files: sourceFiles,
    sourceBundleSha256,
  },
  experiment: {
    bodyIds,
    initialState: initial,
    durationSeconds,
    coarseStepSeconds,
    mediumStepSeconds: coarseStepSeconds / 2,
    fineStepSeconds: coarseStepSeconds / 4,
    coordinateGauge: "harmonic",
    timeScale: "TDB-compatible-SI-shadow",
  },
  gates: { ...gates, allQualified },
  result: run,
  authority: {
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow",
    promotionDecision: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    scientificPayloadMutationAllowed: false,
    productionReleaseAuthorized: false,
  },
  formalProductPointer: "v263",
};
const evidence = {
  ...evidenceUnsigned,
  evidenceSha256: canonicalSha(evidenceUnsigned),
};
const receiptUnsigned = {
  version: "post-v593-relativity-trajectory-reference-receipt-v3",
  generatedAt,
  status: evidence.status,
  evidencePath: evidenceRelativePath,
  evidenceSha256: evidence.evidenceSha256,
  resultSha256: run.resultSha256,
  sourceBundleSha256,
  gates: evidence.gates,
  authority: evidence.authority,
  formalProductPointer: evidence.formalProductPointer,
  productionReleaseAuthorized: false,
};
const receipt = {
  ...receiptUnsigned,
  receiptSha256: canonicalSha(receiptUnsigned),
};

writeJson(evidencePath, evidence);
writeJson(receiptPath, receipt);
console.log(JSON.stringify({
  status: evidence.status,
  allQualified,
  evidencePath: evidenceRelativePath,
  resultSha256: run.resultSha256,
  sourceBundleSha256,
  evidenceSha256: evidence.evidenceSha256,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
