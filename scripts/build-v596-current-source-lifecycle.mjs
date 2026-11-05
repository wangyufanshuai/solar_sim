import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV596,
  assertKnownNonNegativeV596,
  assertKnownPositiveV596,
  assertV596Authority,
  assertV596EvidenceEnvelope,
  assertV596Formal,
  atomicWriteJsonV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  sameCanonicalV596Formal,
  sealV596FormalDocument,
  validateV596Identity,
  verifyV596FormalSeal,
} from "./v596-formal-contract.mjs";

export const V596_LIFECYCLE_STAGE_VERSION =
  "v596-phase4-same-page-stellar-exoplanet-lifecycle-regression-v2";
export const V596_LIFECYCLE_STAGE_STATUS =
  "passed-current-v596-stellar-exoplanet-lifecycle-exact-return";
export const V596_LIFECYCLE_SYNTHETIC_STAGE_STATUS =
  "validated-synthetic-v596-stellar-exoplanet-lifecycle-fixture-not-formal";
export const V596_LIFECYCLE_RECEIPT_VERSION = "v596-resource-lifecycle-v2";
export const V596_LIFECYCLE_RECEIPT_STATUS =
  "passed-current-v596-same-realm-single-canvas-stellar-exoplanet-exact-return";
export const V596_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS =
  "validated-synthetic-v596-lifecycle-v2-fixture-not-formal";
export const V596_LIFECYCLE_SAMPLE_VERSION = "v596-phase4-lifecycle-sample-v1";
export const V596_LIFECYCLE_RETURN_ANALYSIS_VERSION =
  "v596-phase4-lifecycle-return-analysis-v1";
export const V596_LIFECYCLE_STATE_SPACE_WARMUP_VERSION =
  "v596-phase4-lifecycle-premeasurement-state-space-warmup-v1";
export const V596_LIFECYCLE_PREMEASUREMENT_WARMUP_VERSION =
  "v596-phase4-lifecycle-premeasurement-warmup-v2";
export const V596_SCENE_EXIT_RELEASE_CONTRACT_VERSION =
  "v596-observed-scene-exit-release-contract-v1";
export const V596_LIFECYCLE_RUNNER_VERSION =
  "v596-stellar-exoplanet-lifecycle-runner-v2";
export const V596_LIFECYCLE_AUDITOR_VERSION =
  "v596-stellar-exoplanet-lifecycle-auditor-v2";
export const V596_LIFECYCLE_SAMPLE_COUNT = 17;
export const V596_LIFECYCLE_STELLAR_STATE_COUNT = 14;
export const V596_LIFECYCLE_HEAP_ALLOWANCE_BYTES = 8 * 1024 * 1024;

const STELLAR_REPRESENTATIVES = Object.freeze([
  Object.freeze({ targetId: "sirius-a", archetype: "hot-radiative" }),
  Object.freeze({ targetId: "rigel", archetype: "blue-supergiant-wind" }),
  Object.freeze({ targetId: "alpha-centauri-a", archetype: "solar-like-convective" }),
  Object.freeze({ targetId: "arcturus", archetype: "cool-convective" }),
  Object.freeze({ targetId: "betelgeuse", archetype: "red-giant-supergiant" }),
  Object.freeze({ targetId: "procyon-a", archetype: "warm-radiative-convective" }),
  Object.freeze({ targetId: "achernar", archetype: "rapid-rotator-gravity-darkened" }),
]);

export const V596_LIFECYCLE_STELLAR_PLAN = Object.freeze(
  STELLAR_REPRESENTATIVES.flatMap(({ targetId, archetype }) => (
    ["science", "cinematic"].map((mode) => Object.freeze({
      index: 0,
      id: `stellar-${targetId}-${mode}`,
      targetId,
      archetype,
      mode,
    }))
  )).map((row, index) => Object.freeze({ ...row, index })),
);

const PROTOTYPE_NAMES = Object.freeze([
  "renderer",
  "scene",
  "scene-object",
  "geometry",
  "material",
  "shaderMaterial",
  "texture",
]);
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function assertEmptyArray(value, label) {
  assertV596Formal(Array.isArray(value) && value.length === 0, `v596-lifecycle-errors:${label}`);
}

function assertSha(value, label) {
  assertV596Formal(SHA256_PATTERN.test(value ?? ""), `v596-lifecycle-sha256:${label}`);
}

function assertSampleErrors(sample, label) {
  assertEmptyArray(sample?.errors, `${label}:errors`);
  assertEmptyArray(sample?.warnings, `${label}:warnings`);
  assertEmptyArray(sample?.failedRequests, `${label}:failed-requests`);
  assertEmptyArray(sample?.observed?.contextEvents, `${label}:context-events`);
  assertEmptyArray(sample?.observed?.browserErrors, `${label}:browser-errors`);
  assertEmptyArray(sample?.observed?.unhandledRejections, `${label}:rejections`);
}

function assertPrototypeCensus(census, label) {
  assertV596Formal(
    census?.version === "v596-phase4-live-prototype-instance-census-v1"
      && census.registry?.version === "v596-lifecycle-three-webpack-prototype-registry-v1"
      && census.registry?.revision === "170"
      && census.registry?.moduleCount >= 1
      && census.objectGroupReleased === true,
    `v596-lifecycle-prototype-contract:${label}`,
  );
  for (const name of PROTOTYPE_NAMES) {
    assertKnownPositiveV596(census.registry?.prototypeCounts?.[name],
      `lifecycle:${label}:prototype:${name}`);
    assertKnownNonNegativeV596(census.instances?.[name],
      `lifecycle:${label}:instances:${name}`);
  }
  for (const name of ["canvas", "worker"]) {
    assertKnownNonNegativeV596(census.instances?.[name],
      `lifecycle:${label}:instances:${name}`);
  }
  assertV596Formal(
    census.activeScene?.status === "observed-unique-live-three-scene"
      && census.activeScene?.sceneCount === 1,
    `v596-lifecycle-active-scene:${label}`,
  );
}

function assertCdp(sample, label) {
  assertPrototypeCensus(sample?.cdp?.prototypeCensus, label);
  for (const field of [
    "usedSize",
    "totalSize",
    "embedderHeapUsedSize",
    "backingStorageSize",
  ]) assertKnownNonNegativeV596(sample?.cdp?.heap?.[field], `lifecycle:${label}:heap:${field}`);
  for (const field of ["documents", "nodes", "jsEventListeners"]) {
    assertKnownPositiveV596(sample?.cdp?.dom?.[field], `lifecycle:${label}:dom:${field}`);
  }
}

function assertOneCanvas(sample, timeOrigin, label) {
  assertKnownPositiveV596(sample?.observed?.timeOrigin, `lifecycle:${label}:time-origin`);
  assertV596Formal(
    sample.observed.timeOrigin === timeOrigin
      && sample.observed?.pathname === "/"
      && sample.observed?.canvas?.count === 1
      && sample.observed?.canvas?.connected === 1
      && sample.observed?.canvas?.sameAsBaseline === true
      && typeof sample.observed?.canvas?.identity === "string"
      && sample.observed.canvas.identity.length > 0,
    `v596-lifecycle-one-canvas-realm:${label}`,
  );
}

function assertPresentationBoundary(state, label) {
  assertV596Formal(
    state?.candidate === "v596"
      && state?.rendererContractVersion === "v596-stellar-portrait-render-contract-v1"
      && state?.presentationAuthority === "none"
      && state?.relativityAuthority === "shadow-only"
      && state?.scientificAuthority === false
      && state?.measuredAuthority === false
      && state?.gpuAuthority === false
      && state?.resolvedSurfaceAuthority === false
      && state?.observationTextureAuthority === false
      && state?.radiativeTransferAuthority === false
      && state?.grmhdAuthority === false
      && state?.formalEvidence === false
      && state?.promotion === "none"
      && state?.supplementalOnly === true
      && state?.defaultKernel === "legacy-eih-1pn"
      && state?.scientificPayloadWriteback === false
      && state?.formalProductPointer === "v263",
    `v596-lifecycle-presentation-boundary:${label}`,
  );
}

function assertStellarSample(sample, expected, timeOrigin, label) {
  assertV596Formal(
    sample?.version === V596_LIFECYCLE_SAMPLE_VERSION
      && sameCanonicalV596Formal(sample.expected, expected),
    `v596-lifecycle-stellar-sample:${label}`,
  );
  assertOneCanvas(sample, timeOrigin, label);
  assertV596Formal(
    sample.observed?.rootMode === "inspect"
      && sample.observed?.runtimeEvidence?.scene?.ready === true
      && sample.observed.runtimeEvidence.scene.sceneMode === "inspect"
      && sample.observed.runtimeEvidence.scene.selectedObjectId
        === `stellar-hero:${expected.targetId}`
      && sample.observed?.checkpoint?.targetId === expected.targetId
      && sample.observed.checkpoint.mode === expected.mode
      && sample.observed.checkpoint.paused === "true"
      && sample.observed.checkpoint.simDays === "0"
      && sample.observed.checkpoint.bindingStatus === "bound",
    `v596-lifecycle-stellar-runtime:${label}`,
  );
  const receipt = sample.receipt;
  assertV596Formal(
    receipt?.frame?.targetId === expected.targetId
      && receipt.frame.archetype === expected.archetype
      && receipt.frame.mode === expected.mode
      && receipt.frame.paused === true
      && receipt.frame.simDays === 0
      && receipt.canvas?.singleCanvasPolicy === "shared-main-canvas"
      && receipt.snapshot?.canvas?.count === 1
      && receipt.snapshot.canvas.connected === 1,
    `v596-lifecycle-stellar-receipt:${label}`,
  );
  assertPresentationBoundary(receipt.render?.contractState, label);
  for (const field of [
    "receiptSha256",
    "cameraStateSha256",
    "simulationStateSha256",
  ]) assertSha(receipt[field], `${label}:${field}`);
  for (const field of [
    "captureRequestId",
    "renderContractSha256",
    "renderStateSha256",
    "sourceBindingSha256",
    "morphologySha256",
    "profileProjectionSha256",
  ]) assertSha(sample.bindings?.[field], `${label}:binding:${field}`);
  assertCdp(sample, label);
  assertSampleErrors(sample, label);
}

function assertExoplanetSample(sample, timeOrigin, label) {
  assertV596Formal(
    sample?.version === V596_LIFECYCLE_SAMPLE_VERSION
      && sample.expected === null
      && sample.receipt === null
      && sample.bindings === null,
    `v596-lifecycle-exoplanet-sample:${label}`,
  );
  assertOneCanvas(sample, timeOrigin, label);
  assertV596Formal(
    sample.observed?.rootMode === "exoplanet-system"
      && sample.observed?.runtimeEvidence?.scene?.ready === true
      && sample.observed.runtimeEvidence.scene.sceneMode === "exoplanet-system"
      && sample.observed.runtimeEvidence.scene.selectedObjectId === "trappist-1",
    `v596-lifecycle-exoplanet-runtime:${label}`,
  );
  assertCdp(sample, label);
  assertSampleErrors(sample, label);
}

function assertWarmup(stage, timeOrigin) {
  const warmup = stage.premeasurementWarmup;
  assertV596Formal(
    warmup?.version === V596_LIFECYCLE_PREMEASUREMENT_WARMUP_VERSION
      && warmup.cycleCount === 1
      && warmup.excludedFromReturnMetrics === true
      && warmup.transition === "sirius-science-to-trappist-1-to-sirius-science",
    "v596-lifecycle-premeasurement-warmup",
  );
  assertExoplanetSample(warmup.exoplanet, timeOrigin, "warmup-exoplanet");
  assertStellarSample(warmup.returned, V596_LIFECYCLE_STELLAR_PLAN[0],
    timeOrigin, "warmup-return");

  const stateSpace = stage.premeasurementStateSpaceWarmup;
  assertV596Formal(
    stateSpace?.version === V596_LIFECYCLE_STATE_SPACE_WARMUP_VERSION
      && stateSpace.cycleCount === 1
      && stateSpace.excludedFromReturnMetrics === true
      && stateSpace.transition
        === "fourteen-stellar-states-to-trappist-1-to-sirius-a-science"
      && stateSpace.stateCount === V596_LIFECYCLE_STELLAR_STATE_COUNT
      && sameCanonicalV596Formal(stateSpace.plan, V596_LIFECYCLE_STELLAR_PLAN)
      && sameCanonicalV596Formal(
        stateSpace.completedStateIds,
        V596_LIFECYCLE_STELLAR_PLAN.map(({ id }) => id),
      ),
    "v596-lifecycle-state-space-warmup",
  );
  assertExoplanetSample(stateSpace.exoplanet, timeOrigin, "state-space-warmup-exoplanet");
  assertStellarSample(stateSpace.returned, V596_LIFECYCLE_STELLAR_PLAN[0],
    timeOrigin, "state-space-warmup-return");
}

function assertStageBoundary(stage, syntheticFixture) {
  const expectedFormal = !syntheticFixture;
  assertV596Formal(
    stage.boundaries?.formalEvidence === expectedFormal
      && stage.boundaries?.evidenceClaim === expectedFormal
      && stage.boundaries?.promotion === "none"
      && stage.boundaries?.supplementalOnly === syntheticFixture
      && stage.boundaries?.productionDeployment === false
      && stage.boundaries?.formalV596ReleaseSignoff === false
      && stage.boundaries?.formalV596IdentityGenerated === expectedFormal
      && stage.boundaries?.futureFormalIdentityBoundEightOfEightDecisionRequired === true
      && stage.boundaries?.singlePageRequired === true
      && stage.boundaries?.sameRealmRequired === true
      && stage.boundaries?.sameCanvasRequired === true
      && stage.boundaries?.singleCanvasPolicy === "shared-main-canvas"
      && stage.boundaries?.prototypeCensusSource
        === "verified-current-build-webpack-three-r170-module-prototypes-only"
      && stage.boundaries?.formalProductPointer === "v263"
      && stage.boundaries?.physicalMobileEvidence === false
      && stage.boundaries?.premeasurementStateSpaceWarmupRequired === true,
    "v596-lifecycle-boundaries",
  );
}

export function validateV596LifecycleStage(stage, expectedIdentity, options = {}) {
  const syntheticFixture = options.syntheticFixture === true;
  verifyV596FormalSeal(stage, "receiptSha256", "lifecycle-stage");
  assertV596Formal(
    stage.version === V596_LIFECYCLE_STAGE_VERSION
      && stage.status === (syntheticFixture
        ? V596_LIFECYCLE_SYNTHETIC_STAGE_STATUS
        : V596_LIFECYCLE_STAGE_STATUS),
    "v596-lifecycle-stage-contract",
  );
  assertV596EvidenceEnvelope(stage, { syntheticFixture });
  assertV596Formal(
    stage.qualificationScope === (syntheticFixture
      ? "synthetic-test-only"
      : "formal-current-v596-stellar-exoplanet-lifecycle-v2"),
    "v596-lifecycle-qualification-scope",
  );
  assertStageBoundary(stage, syntheticFixture);
  const identity = validateV596Identity(stage.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertV596Authority(stage.authority, "lifecycle-stage");

  const timeOrigin = stage.execution?.threePrototypeRegistry?.timeOrigin;
  assertKnownPositiveV596(timeOrigin, "lifecycle:execution-time-origin");
  assertV596Formal(
    stage.execution?.activationQuery === "v596VisualCheckpoint=1"
      && stage.execution?.viewport?.width === 1440
      && stage.execution?.viewport?.height === 900
      && stage.execution?.deviceScaleFactor === 1
      && stage.execution?.workerCount === 1
      && stage.execution?.sameDocumentNavigationCount === 0
      && stage.execution?.historyStateTransitionCount >= 6
      && stage.execution?.threePrototypeRegistry?.version
        === "v596-lifecycle-three-webpack-prototype-registry-v1"
      && stage.execution.threePrototypeRegistry.revision === "170"
      && stage.execution.threePrototypeRegistry.moduleCount >= 1
      && stage.execution.threePrototypeRegistry.disposeAuditVersion
        === "v596-lifecycle-three-dispose-audit-v1",
    "v596-lifecycle-execution",
  );
  assertV596Formal(
    sameCanonicalV596Formal(stage.sequence?.plan, V596_LIFECYCLE_STELLAR_PLAN)
      && stage.sequence?.stellarStateCount === V596_LIFECYCLE_STELLAR_STATE_COUNT
      && stage.sequence?.exoplanetSystemId === "trappist-1"
      && stage.sequence?.samePageHistoryTransition === true
      && stage.sequence?.bookends === "sirius-a-science"
      && stage.sequence?.premeasurementWarmupCycleCount === 1
      && stage.sequence?.premeasurementStateSpaceWarmupCycleCount === 1,
    "v596-lifecycle-sequence",
  );

  assertWarmup(stage, timeOrigin);
  assertV596Formal(stage.baselineStable === true, "v596-lifecycle-baseline-stable");
  assertV596Formal(
    Array.isArray(stage.baselineAttempts) && stage.baselineAttempts.length >= 2
      && Array.isArray(stage.finalAttempts) && stage.finalAttempts.length >= 1,
    "v596-lifecycle-attempt-count",
  );
  assertStellarSample(stage.baseline, V596_LIFECYCLE_STELLAR_PLAN[0],
    timeOrigin, "baseline");
  assertV596Formal(
    Array.isArray(stage.stellarSamples)
      && stage.stellarSamples.length === V596_LIFECYCLE_STELLAR_STATE_COUNT,
    "v596-lifecycle-stellar-sample-count",
  );
  stage.stellarSamples.forEach((sample, index) => {
    assertStellarSample(sample, V596_LIFECYCLE_STELLAR_PLAN[index],
      timeOrigin, `stellar:${index}`);
  });
  assertExoplanetSample(stage.exoplanetSample, timeOrigin, "exoplanet");
  assertStellarSample(stage.final, V596_LIFECYCLE_STELLAR_PLAN[0],
    timeOrigin, "final");

  assertV596Formal(
    Array.isArray(stage.allSamples)
      && stage.allSamples.length === V596_LIFECYCLE_SAMPLE_COUNT
      && stage.allSamples.every((sample, index) => sample.sequence === index)
      && stage.singleCanvas?.sampleCount === V596_LIFECYCLE_SAMPLE_COUNT
      && stage.singleCanvas?.passed === true,
    "v596-lifecycle-all-samples",
  );
  const analysis = stage.returnAnalysis;
  assertV596Formal(
    analysis?.version === V596_LIFECYCLE_RETURN_ANALYSIS_VERSION
      && analysis.exactReturn === true
      && sameCanonicalV596Formal(analysis.baselineVector, analysis.finalVector)
      && Array.isArray(analysis.blockers) && analysis.blockers.length === 0
      && analysis.heap?.allowanceBytes === V596_LIFECYCLE_HEAP_ALLOWANCE_BYTES
      && analysis.heap?.withinAllowance === true,
    "v596-lifecycle-exact-return",
  );
  for (const field of ["baselineUsedSizeBytes", "finalUsedSizeBytes"]) {
    assertKnownPositiveV596(analysis.heap?.[field], `lifecycle:return-heap:${field}`);
  }
  assertV596Formal(
    Number.isFinite(analysis.heap?.deltaBytes)
      && Math.abs(analysis.heap.deltaBytes) <= V596_LIFECYCLE_HEAP_ALLOWANCE_BYTES,
    "v596-lifecycle-return-heap-delta",
  );
  assertPrototypeCensus(
    stage.baseline?.cdp?.prototypeCensus,
    "baseline-exact-census",
  );
  assertPrototypeCensus(stage.final?.cdp?.prototypeCensus, "final-exact-census");
  assertV596Formal(
    sameCanonicalV596Formal(
      analysis.baselineVector?.prototypeCensus,
      analysis.finalVector?.prototypeCensus,
    )
      && stage.sameRealm?.baselineTimeOrigin === timeOrigin
      && stage.sameRealm?.exoplanetTimeOrigin === timeOrigin
      && stage.sameRealm?.finalTimeOrigin === timeOrigin
      && stage.sameRealm?.passed === true
      && stage.sameCanvas?.baseline === true
      && stage.sameCanvas?.exoplanet === true
      && stage.sameCanvas?.final === true
      && stage.sameCanvas?.passed === true,
    "v596-lifecycle-realm-canvas-prototype-return",
  );
  for (const [label, value] of [
    ["errors", stage.errors],
    ["warnings", stage.warnings],
    ["failed-requests", stage.failedRequests],
    ["context-events", stage.contextEvents],
    ["global-blockers", stage.globalBlockers],
  ]) assertEmptyArray(value, label);

  return Object.freeze({
    identity,
    sampleCount: V596_LIFECYCLE_SAMPLE_COUNT,
    stellarStateCount: V596_LIFECYCLE_STELLAR_STATE_COUNT,
    exoplanetSystemId: "trappist-1",
    sameRealm: true,
    sameCanvas: true,
    singleCanvas: true,
    exactReturn: true,
    rawPrototypeCensusExactReturn: true,
    heapDeltaBytes: analysis.heap.deltaBytes,
  });
}

export async function buildV596LifecycleReceipt({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  outputPath = "docs/release/v596/resource-lifecycle-v596.json",
  syntheticFixture = false,
  bundle = null,
} = {}) {
  assertV596Formal(stagePath, "v596-lifecycle-stage-required");
  const current = bundle ?? await loadCurrentV596Bundle(root, { requireBuilds: true });
  const stage = (await readJsonV596Formal(
    current.workspace,
    stagePath,
    "lifecycle-stage",
  )).value;
  const validated = validateV596LifecycleStage(stage, current.identities.standalone, {
    syntheticFixture,
  });
  const receipt = sealV596FormalDocument({
    version: V596_LIFECYCLE_RECEIPT_VERSION,
    generatedAt: stage.generatedAt,
    status: syntheticFixture
      ? V596_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS
      : V596_LIFECYCLE_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: await fileReceiptV596Formal(current.workspace, stagePath, "lifecycle-stage"),
    stageReceiptSha256: stage.receiptSha256,
    sampleCount: validated.sampleCount,
    stellarStateCount: validated.stellarStateCount,
    exoplanetSystemId: validated.exoplanetSystemId,
    premeasurementWarmupCycleCount: 1,
    premeasurementStateSpaceWarmupCycleCount: 1,
    samePage: true,
    sameRealm: validated.sameRealm,
    sameCanvas: validated.sameCanvas,
    singleCanvas: validated.singleCanvas,
    exactReturn: validated.exactReturn,
    rawPrototypeCensusExactReturn: validated.rawPrototypeCensusExactReturn,
    heapReturn: {
      allowanceBytes: V596_LIFECYCLE_HEAP_ALLOWANCE_BYTES,
      deltaBytes: validated.heapDeltaBytes,
      withinAllowance: true,
    },
    authority: { ...current.candidate.authority },
    synthetic: syntheticFixture,
  });
  assertV596Authority(receipt.authority, "lifecycle-receipt");
  if (!syntheticFixture) {
    await atomicWriteJsonV596Formal(
      current.workspace,
      outputRoot,
      outputPath,
      receipt,
      "lifecycle-output",
    );
  }
  return receipt;
}

export function parseV596LifecycleArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--stage" || token === "--output") values[token.slice(2)] = argv[++index];
    else throw new Error(`v596-lifecycle-argument:${token}`);
  }
  assertV596Formal(values.stage, "v596-lifecycle-stage-required");
  return values;
}

async function main() {
  const args = parseV596LifecycleArgs(process.argv.slice(2));
  const receipt = await buildV596LifecycleReceipt({
    stagePath: args.stage,
    outputPath: args.output,
  });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    samples: receipt.sampleCount,
    stellarStates: receipt.stellarStateCount,
    exactReturn: receipt.exactReturn,
    receiptSha256: receipt.receiptSha256,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
