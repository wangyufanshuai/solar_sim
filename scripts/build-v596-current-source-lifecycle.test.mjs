import assert from "node:assert/strict";
import test from "node:test";

import {
  V596_LIFECYCLE_AUDITOR_VERSION,
  V596_LIFECYCLE_RECEIPT_STATUS,
  V596_LIFECYCLE_RECEIPT_VERSION,
  V596_LIFECYCLE_SAMPLE_COUNT,
  V596_LIFECYCLE_STAGE_STATUS,
  V596_LIFECYCLE_SYNTHETIC_STAGE_STATUS,
  V596_LIFECYCLE_STAGE_VERSION,
  V596_LIFECYCLE_STATE_SPACE_WARMUP_VERSION,
  V596_LIFECYCLE_STELLAR_PLAN,
  V596_LIFECYCLE_STELLAR_STATE_COUNT,
  V596_LIFECYCLE_PREMEASUREMENT_WARMUP_VERSION,
  V596_LIFECYCLE_RUNNER_VERSION,
  V596_LIFECYCLE_RETURN_ANALYSIS_VERSION,
  validateV596LifecycleStage,
} from "./build-v596-current-source-lifecycle.mjs";
import { sealV596FormalDocument } from "./v596-formal-contract.mjs";

const sha = (c) => c.repeat(64);
const identity = {
  sourceManifestSha256: sha("a"),
  candidateManifestSha256: sha("b"),
  buildFingerprint: sha("c"),
  buildId: `v596b-${sha("c")}`,
  deploymentId: `v596-${sha("a").slice(0, 12)}-${sha("b").slice(0, 12)}`,
  formalProductPointer: "v263",
  deliveryTier: "standalone-full",
  bindingStatus: "bound",
};
const authority = {
  defaultKernel: "legacy-eih-1pn",
  v2Mode: "shadow-only",
  scientificAuthorityGranted: false,
  scientificPayloadMutationAllowed: false,
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  resolvedSurfaceAuthorityGranted: false,
  observationTextureAuthorityGranted: false,
  radiativeTransferGranted: false,
  grmhdGranted: false,
  geometryReferenceGranted: false,
  polarizationTransportReferenceGranted: false,
  productionReleaseAuthorized: false,
  productionPromotionAllowed: false,
};

function sample(expected, timeOrigin, seq, mode = expected?.mode) {
  const targetId = expected?.targetId ?? "pending";
  const stellar = Boolean(expected);
  const receipt = stellar ? {
    frame: {
      targetId,
      archetype: expected.archetype,
      mode,
      paused: true,
      simDays: 0,
    },
    canvas: { singleCanvasPolicy: "shared-main-canvas" },
    snapshot: { canvas: { count: 1, connected: 1 } },
    render: {
      contractState: {
        candidate: "v596",
        rendererContractVersion: "v596-stellar-portrait-render-contract-v1",
        presentationAuthority: "none",
        relativityAuthority: "shadow-only",
        scientificAuthority: false,
        measuredAuthority: false,
        gpuAuthority: false,
        resolvedSurfaceAuthority: false,
        observationTextureAuthority: false,
        radiativeTransferAuthority: false,
        grmhdAuthority: false,
        formalEvidence: false,
        promotion: "none",
        supplementalOnly: true,
        defaultKernel: "legacy-eih-1pn",
        scientificPayloadWriteback: false,
        formalProductPointer: "v263",
      },
      receiptSha256: sha("d"),
      cameraStateSha256: sha("e"),
      simulationStateSha256: sha("f"),
    },
  } : null;
  if (receipt) {
    receipt.receiptSha256 = sha("d");
    receipt.cameraStateSha256 = sha("e");
    receipt.simulationStateSha256 = sha("f");
  }
  return {
    version: "v596-phase4-lifecycle-sample-v1",
    sequence: seq,
    label: stellar ? `stellar-${targetId}-${mode}` : "exoplanet-trappist-1",
    expected: stellar ? expected : null,
    receipt,
    bindings: stellar ? {
      captureRequestId: sha("1"),
      renderContractSha256: sha("2"),
      renderStateSha256: sha("3"),
      sourceBindingSha256: sha("4"),
      morphologySha256: sha("5"),
      profileProjectionSha256: sha("6"),
    } : null,
    observed: {
      timeOrigin,
      pathname: "/",
      rootMode: stellar ? "inspect" : "exoplanet-system",
      canvas: { count: 1, connected: 1, sameAsBaseline: true, identity: "atlas-main-single-canvas-v161" },
      runtimeEvidence: { scene: {
        ready: true,
        sceneMode: stellar ? "inspect" : "exoplanet-system",
        selectedObjectId: stellar ? `stellar-hero:${targetId}` : "trappist-1",
      } },
      checkpoint: stellar
        ? { targetId, mode, paused: "true", simDays: "0", bindingStatus: "bound" }
        : { targetId: "pending", mode: "pending", paused: "pending", simDays: "pending", bindingStatus: "pending" },
      contextEvents: [],
      browserErrors: [],
      unhandledRejections: [],
    },
    cdp: {
      prototypeCensus: {
        version: "v596-phase4-live-prototype-instance-census-v1",
        registry: {
          version: "v596-lifecycle-three-webpack-prototype-registry-v1",
          revision: "170",
          moduleCount: 1,
          prototypeCounts: Object.fromEntries([
            "renderer", "scene", "scene-object", "geometry", "material", "shaderMaterial", "texture",
          ].map((key) => [key, 1])),
        },
        instances: Object.fromEntries([
          "renderer", "scene", "scene-object", "geometry", "material", "shaderMaterial", "texture", "canvas", "worker",
        ].map((key) => [key, 1])),
        activeScene: { status: "observed-unique-live-three-scene", sceneCount: 1 },
        objectGroupReleased: true,
      },
      heap: { usedSize: 10, totalSize: 20, embedderHeapUsedSize: 1, backingStorageSize: 1 },
      dom: { documents: 1, nodes: 1, jsEventListeners: 1 },
    },
    errors: [], warnings: [], failedRequests: [],
  };
}

function stageFixture(overrides = {}) {
  const t = 12345;
  const plan = V596_LIFECYCLE_STELLAR_PLAN;
  const baseline = sample(plan[0], t, 0);
  const stellarSamples = plan.map((row, i) => sample(row, t, i + 2));
  const exoplanet = sample(null, t, 15);
  const final = sample(plan[0], t, 16);
  const allSamples = [
    baseline,
    { ...baseline, sequence: 1, label: "baseline-2" },
    ...stellarSamples.slice(0, 13),
    { ...exoplanet, sequence: 15 },
    { ...final, sequence: 16 },
  ];
  const vectors = {
    baseline: { value: 1, prototypeCensus: { registryVersion: "v596-lifecycle-three-webpack-prototype-registry-v1", instances: { renderer: 1 } } },
    final: { value: 1, prototypeCensus: { registryVersion: "v596-lifecycle-three-webpack-prototype-registry-v1", instances: { renderer: 1 } } },
  };
  const stage = {
    version: V596_LIFECYCLE_STAGE_VERSION,
    generatedAt: "2026-08-28T00:00:00.000Z",
    status: V596_LIFECYCLE_SYNTHETIC_STAGE_STATUS,
    fixture: { synthetic: true },
    formalEvidence: false,
    evidenceClaim: false,
    qualificationScope: "synthetic-test-only",
    promotion: "none",
    syntheticZeroClaim: false,
    identity,
    authority,
    tooling: { runnerVersion: V596_LIFECYCLE_RUNNER_VERSION, auditorVersion: V596_LIFECYCLE_AUDITOR_VERSION },
    execution: {
      activationQuery: "v596VisualCheckpoint=1",
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      workerCount: 1,
      sameDocumentNavigationCount: 0,
      historyStateTransitionCount: 6,
      threePrototypeRegistry: {
        version: "v596-lifecycle-three-webpack-prototype-registry-v1",
        revision: "170",
        moduleCount: 1,
        disposeAuditVersion: "v596-lifecycle-three-dispose-audit-v1",
        timeOrigin: t,
      },
    },
    sequence: {
      plan,
      stellarStateCount: 14,
      exoplanetSystemId: "trappist-1",
      samePageHistoryTransition: true,
      bookends: "sirius-a-science",
      premeasurementWarmupCycleCount: 1,
      premeasurementStateSpaceWarmupCycleCount: 1,
    },
    premeasurementWarmup: {
      version: V596_LIFECYCLE_PREMEASUREMENT_WARMUP_VERSION,
      cycleCount: 1,
      excludedFromReturnMetrics: true,
      transition: "sirius-science-to-trappist-1-to-sirius-science",
      exoplanet: exoplanet,
      returned: baseline,
    },
    premeasurementStateSpaceWarmup: {
      version: V596_LIFECYCLE_STATE_SPACE_WARMUP_VERSION,
      cycleCount: 1,
      excludedFromReturnMetrics: true,
      transition: "fourteen-stellar-states-to-trappist-1-to-sirius-a-science",
      stateCount: 14,
      plan,
      completedStateIds: plan.map(({ id }) => id),
      exoplanet,
      returned: baseline,
    },
    baselineStable: true,
    baselineAttempts: [baseline, baseline],
    finalAttempts: [final],
    baseline,
    stellarSamples,
    exoplanetSample: exoplanet,
    final,
    allSamples,
    returnAnalysis: {
      version: V596_LIFECYCLE_RETURN_ANALYSIS_VERSION,
      baselineVector: vectors.baseline,
      finalVector: vectors.final,
      exactReturn: true,
      heap: { baselineUsedSizeBytes: 10, finalUsedSizeBytes: 10, deltaBytes: 0, allowanceBytes: 8 * 1024 * 1024, withinAllowance: true },
      blockers: [],
    },
    sameRealm: { baselineTimeOrigin: t, exoplanetTimeOrigin: t, finalTimeOrigin: t, passed: true },
    sameCanvas: { baseline: true, exoplanet: true, final: true, passed: true },
    singleCanvas: { sampleCount: 17, passed: true },
    errors: [], warnings: [], failedRequests: [], contextEvents: [], globalBlockers: [],
    boundaries: {
      formalEvidence: false, evidenceClaim: false, promotion: "none", supplementalOnly: true,
      productionDeployment: false, formalV596ReleaseSignoff: false, formalV596IdentityGenerated: false,
      futureFormalIdentityBoundEightOfEightDecisionRequired: true, singlePageRequired: true,
      sameRealmRequired: true, sameCanvasRequired: true, singleCanvasPolicy: "shared-main-canvas",
      prototypeCensusSource: "verified-current-build-webpack-three-r170-module-prototypes-only",
      formalProductPointer: "v263", physicalMobileEvidence: false, premeasurementStateSpaceWarmupRequired: true,
    },
    ...overrides,
  };
  return sealV596FormalDocument(stage);
}

test("v596 v2 lifecycle validates 14-state same-realm exact return", () => {
  const stage = stageFixture();
  const result = validateV596LifecycleStage(stage, identity, { syntheticFixture: true });
  assert.equal(result.sampleCount, V596_LIFECYCLE_SAMPLE_COUNT);
  assert.equal(result.stellarStateCount, V596_LIFECYCLE_STELLAR_STATE_COUNT);
  assert.equal(result.exactReturn, true);
});

test("v596 lifecycle rejects wrong sample count and realm drift", () => {
  const stage = stageFixture();
  const badCount = structuredClone(stage);
  badCount.allSamples.pop();
  { const unsigned = { ...badCount }; delete unsigned.receiptSha256;
    badCount.receiptSha256 = sealV596FormalDocument(unsigned).receiptSha256; }
  assert.throws(() => validateV596LifecycleStage(badCount, identity, { syntheticFixture: true }), /all-samples/);
  const badRealm = structuredClone(stage);
  badRealm.sameRealm.finalTimeOrigin += 1;
  { const unsigned = { ...badRealm }; delete unsigned.receiptSha256;
    badRealm.receiptSha256 = sealV596FormalDocument(unsigned).receiptSha256; }
  assert.throws(() => validateV596LifecycleStage(badRealm, identity, { syntheticFixture: true }), /realm/);
});

test("v596 lifecycle rejects unknown/zero and authority elevation", () => {
  const stage = stageFixture();
  const bad = structuredClone(stage);
  bad.baseline.observed.canvas.count = null;
  { const unsigned = { ...bad }; delete unsigned.receiptSha256;
    bad.receiptSha256 = sealV596FormalDocument(unsigned).receiptSha256; }
  assert.throws(() => validateV596LifecycleStage(bad, identity, { syntheticFixture: true }), /unknown|one-canvas/);
  const elevated = stageFixture({ authority: { ...authority, gpuAuthorityGranted: true } });
  assert.throws(() => validateV596LifecycleStage(elevated, identity, { syntheticFixture: true }), /authority/);
});
