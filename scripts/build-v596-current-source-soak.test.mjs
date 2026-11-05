import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  V596_AUTHORITY_FALSE_FIELDS,
  canonicalShaV596Formal,
  sealV596FormalDocument,
} from "./v596-formal-contract.mjs";
import {
  V596_SOAK_AUDITOR_VERSION,
  V596_SOAK_HEAP_ALLOWANCE_BYTES,
  V596_SOAK_MINIMUM_CYCLES,
  V596_SOAK_RUNNER_VERSION,
  V596_SOAK_SAMPLE_LINK_VERSION,
  V596_SOAK_WARMUP_SAMPLE_LINK_VERSION,
  V596_SOAK_WARMUP_CYCLE_COUNT,
  V596_SOAK_WARMUP_SAMPLE_COUNT,
  V596_SOAK_WARMUP_CONTRACT_VERSION,
  V596_SOAK_SAMPLES_PER_CYCLE,
  V596_SOAK_SYNTHETIC_RECEIPT_STATUS,
  V596_SOAK_SYNTHETIC_STAGE_STATUS,
  V596_SOAK_STAGE_VERSION,
  V596_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE,
  buildV596SoakReceipt,
  validateV596SoakStage,
} from "./build-v596-current-source-soak.mjs";

const SOURCE = "5".repeat(64);
const CANDIDATE = "6".repeat(64);
const FINGERPRINT = "7".repeat(64);
const PHASES = ["baseline", "mounted", "profile-stable", "detached-stable"];

function identity() {
  return {
    sourceManifestSha256: SOURCE,
    candidateManifestSha256: CANDIDATE,
    buildFingerprint: FINGERPRINT,
    buildId: `v596b-${FINGERPRINT}`,
    deploymentId: `v596-${SOURCE.slice(0, 12)}-${CANDIDATE.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier: "standalone-full",
    bindingStatus: "bound",
  };
}

function authority() {
  return {
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow-only",
    ...Object.fromEntries(V596_AUTHORITY_FALSE_FIELDS.map((field) => [field, false])),
  };
}

function errors() {
  return {
    consoleErrors: [],
    pageErrors: [],
    unhandledRejections: [],
    webglContextErrors: [],
    cdpErrors: [],
  };
}

function heap() {
  return {
    usedSize: 1_000_000,
    totalSize: 2_000_000,
    embedderHeapUsedSize: 20_000,
    backingStorageSize: 10_000,
  };
}

function mountedObservation() {
  return {
    captureKind: "mounted-renderer",
    canvas: { count: 1, connected: 1 },
    renderer: {
      active: 1,
      textures: 20,
      geometries: 80,
      programs: 10,
      renderTargets: 0,
      resourceCountsSource: "three.webglrenderer.info",
      renderTargetsSource: "atlas-resource-registry.gpuRenderTargets",
      fingerprint: "renderer-fingerprint-v596-fixture",
    },
    registry: {
      total: 12,
      workers: 0,
      renderTargets: 0,
      textures: 11,
      subscriptions: 0,
      typedArrays: 0,
      estimatedBytes: 235_201_097,
    },
    scene: {
      active: 1,
      objects: 765,
      candidateNodes: 4,
      stellarHeroIds: ["sirius-a"],
      stellarArchetypes: ["hot-radiative"],
      stellarContractSha256s: ["fixture-contract-sha-v596"],
    },
  };
}

function releasedObservation() {
  return {
    captureKind: "unmounted-renderer",
    canvas: { count: 0, connected: 0 },
    renderer: {
      active: 0,
      textures: null,
      geometries: null,
      programs: null,
      renderTargets: 0,
      resourceCountsSource: "unavailable-context-lost-stale-info",
      renderTargetsSource: "atlas-resource-registry.gpuRenderTargets",
    },
    registry: {
      total: 0,
      workers: 0,
      renderTargets: 0,
      textures: 0,
      subscriptions: 0,
      typedArrays: 0,
      estimatedBytes: 0,
    },
    scene: { active: 0, objects: 0, candidateNodes: 0 },
  };
}

function teardown(routeAfter, observerReleased) {
  return {
    renderListsDisposed: true,
    forceContextLossCalled: true,
    contextLost: true,
    contextLossSource: "webglcontextlost-event",
    canvasDetached: true,
    resourceReferencesReleased: true,
    routeAfter,
    observerReleased,
  };
}

function sealSamples(samples) {
  let previousSampleSha256 = null;
  return samples.map((sample) => {
    const unsigned = { ...sample, previousSampleSha256 };
    delete unsigned.sampleSha256;
    const sealed = {
      ...unsigned,
      sampleSha256: canonicalShaV596Formal({
        version: V596_SOAK_SAMPLE_LINK_VERSION,
        entry: unsigned,
      }),
    };
    previousSampleSha256 = sealed.sampleSha256;
    return sealed;
  });
}

function sealWarmupSamples(samples) {
  let previousSampleSha256 = null;
  return samples.map((sample) => {
    const unsigned = { ...sample, previousSampleSha256 };
    delete unsigned.sampleSha256;
    const sealed = {
      ...unsigned,
      sampleSha256: canonicalShaV596Formal({
        version: V596_SOAK_WARMUP_SAMPLE_LINK_VERSION,
        entry: unsigned,
      }),
    };
    previousSampleSha256 = sealed.sampleSha256;
    return sealed;
  });
}

function resealStage(
  stage,
  {
    resealSamples: shouldResealSamples = false,
    resealWarmupSamples: shouldResealWarmupSamples = false,
  } = {},
) {
  const warmupSamples = shouldResealWarmupSamples
    ? sealWarmupSamples(stage.warmupSamples)
    : stage.warmupSamples;
  const unsigned = {
    ...stage,
    warmup: shouldResealWarmupSamples
      ? { ...stage.warmup, finalSampleSha256: warmupSamples.at(-1).sampleSha256 }
      : stage.warmup,
    warmupSamples,
    samples: shouldResealSamples ? sealSamples(stage.samples) : stage.samples,
  };
  delete unsigned.receiptSha256;
  return sealV596FormalDocument(unsigned);
}

function soakFixture() {
  const currentIdentity = identity();
  const samples = [];
  for (let cycleIndex = 0; cycleIndex < 2; cycleIndex += 1) {
    for (const phase of PHASES) {
      const sequence = samples.length;
      samples.push({
        sequence,
        cycleIndex,
        phase,
        profileKey: ["hot-radiative", "blue-supergiant-wind"][cycleIndex],
        capturedAtMs: 1_000 + sequence * 100,
        realmToken: "soak-realm-token-v596-fixture",
        timeOrigin: 98765.5,
        identity: currentIdentity,
        cdp: {
          runtimeHeap: heap(),
          domCounters: { documents: 1, nodes: 100, jsEventListeners: 20 },
        },
        observation: phase === "mounted" || phase === "profile-stable"
          ? mountedObservation()
          : phase === "detached-stable" ? releasedObservation() : null,
        teardown: phase === "detached-stable" ? teardown("/", null) : null,
        errors: errors(),
      });
    }
  }
  const finalExitTeardown = teardown("/downloads", true);
  const warmupSamples = sealWarmupSamples(
    samples.slice(0, V596_SOAK_WARMUP_SAMPLE_COUNT).map((sample, index) => ({
      ...sample,
      sequence: index,
      cycleIndex: 0,
      profileKey: "hot-radiative",
    })),
  );
  return resealStage({
    version: V596_SOAK_STAGE_VERSION,
    status: V596_SOAK_SYNTHETIC_STAGE_STATUS,
    generatedAt: "2026-08-28T02:00:00.000Z",
    completedAt: "2026-08-28T02:05:00.000Z",
    formalEvidence: false,
    evidenceClaim: false,
    syntheticZeroClaim: false,
    promotion: "none",
    qualificationScope: "synthetic-test-only",
    fixture: { synthetic: true },
    tooling: {
      runnerVersion: V596_SOAK_RUNNER_VERSION,
      auditorVersion: V596_SOAK_AUDITOR_VERSION,
    },
    identity: currentIdentity,
    shards: [
      {
        id: "fixture-shard-a",
        status: "passed-complete",
        unknown: false,
        failed: false,
        complete: true,
        cycleCount: 1,
        sampleCount: 4,
      },
      {
        id: "fixture-shard-b",
        status: "passed-complete",
        unknown: false,
        failed: false,
        complete: true,
        cycleCount: 1,
        sampleCount: 4,
      },
    ],
    aggregation: {
      status: "passed-all-shards-complete",
      unknownShardCount: 0,
      failedShardCount: 0,
      completedShardCount: 2,
      cycleCount: 2,
      sampleCount: 8,
    },
    policy: {
      cycleCount: 2,
      sampleCount: 8,
      minimumFormalCycleCount: V596_SOAK_MINIMUM_CYCLES,
      samplesPerCycle: V596_SOAK_SAMPLES_PER_CYCLE,
      heapFinalAbsoluteAllowanceBytes: V596_SOAK_HEAP_ALLOWANCE_BYTES,
      tailOlsMaximumBytesPerSample: V596_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE,
      protocol: "chromium-cdp",
      heapCollection: "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage",
      rendererResourcePolicy:
        "warmup-high-water-no-growth-exact-mounted-to-profile-stable-and-exact-detach-zero-v1",
      rendererResourceGlobalExactStabilityRequired: false,
      rendererResourceWithinCycleExactStabilityRequired: true,
      rendererResourceWarmupHighWaterNoGrowthRequired: true,
      rendererResourceDetachedExactZeroRequired: true,
      rendererResourcePerProfileStructuralExactStabilityRequired: true,
      registrySceneWithinCycleExactStabilityRequired: true,
      sourceIdentityExactStabilityRequired: true,
      oneFinalClientRouteExitRequired: true,
      preMeasurementWarmup: {
        version: V596_SOAK_WARMUP_CONTRACT_VERSION,
        cycleCount: V596_SOAK_WARMUP_CYCLE_COUNT,
        sampleCount: V596_SOAK_WARMUP_SAMPLE_COUNT,
        recordedSeparately: true,
        excludedFromFormalMetrics: true,
        baselineSource: "first-measured-baseline-after-warmup",
      },
    },
    warmup: {
      version: V596_SOAK_WARMUP_CONTRACT_VERSION,
      cycleCount: V596_SOAK_WARMUP_CYCLE_COUNT,
      sampleCount: V596_SOAK_WARMUP_SAMPLE_COUNT,
      profileKey: "hot-radiative",
      rendererFingerprint: "renderer-fingerprint-v596-fixture",
      firstHeapUsedSizeBytes: 1_000_000,
      finalHeapUsedSizeBytes: 1_000_000,
      finalSampleSha256: warmupSamples.at(-1).sampleSha256,
      recordedSeparately: true,
      excludedFromFormalMetrics: true,
      baselineSource: "first-measured-baseline-after-warmup",
    },
    warmupSamples,
    samples: sealSamples(samples),
    identitySnapshots: [
      { identity: currentIdentity, sourceDriftCount: 0, sourceDrifts: [] },
      { identity: currentIdentity, sourceDriftCount: 0, sourceDrifts: [] },
    ],
    metrics: {
      cycleCount: 2,
      sampleCount: 8,
      rendererFingerprintCount: 1,
      rendererResourcePolicy:
        "warmup-high-water-no-growth-exact-mounted-to-profile-stable-and-exact-detach-zero-v1",
      rendererResourceWarmupEnvelope: {
        textures: 20,
        geometries: 80,
        programs: 10,
        renderTargets: 0,
      },
      rendererWarmupTransitionStable: true,
      rendererResourceWithinCycleStable: true,
      rendererResourceWarmupEnvelopeRespected: true,
      rendererResourceGlobalExactStable: true,
      rendererResourceGrowth: false,
      rendererProfiles: [
        {
          profileKey: "hot-radiative",
          cycleCount: 1,
          sampleCount: 2,
          minimum: { textures: 20, geometries: 80, programs: 10, renderTargets: 0 },
          maximum: { textures: 20, geometries: 80, programs: 10, renderTargets: 0 },
        },
        {
          profileKey: "blue-supergiant-wind",
          cycleCount: 1,
          sampleCount: 2,
          minimum: { textures: 20, geometries: 80, programs: 10, renderTargets: 0 },
          maximum: { textures: 20, geometries: 80, programs: 10, renderTargets: 0 },
        },
      ],
      rendererProfileStructuralCountersStable: true,
      registrySceneWithinCycleStable: true,
      canvasCountStable: true,
      rawHardGatesPassed: true,
      semanticFallbackApplied: false,
      syntheticHeapPassClaim: false,
      heap: {
        baselineUsedSizeBytes: 1_000_000,
        finalUsedSizeBytes: 1_000_000,
        allowanceBytes: V596_SOAK_HEAP_ALLOWANCE_BYTES,
        overallOlsBytesPerSample: 0,
        tailOlsBytesPerSample: 0,
        tailSampleCount: 4,
        tailOlsMaximumBytesPerSample: V596_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE,
        finalHeapWithinAllowance: true,
        tailOlsWithinLimit: true,
        sustainedGrowth: false,
        telemetry: "chromium-cdp-runtime-getHeapUsage",
        garbageCollection: "HeapProfiler.collectGarbage",
      },
      measurementWindow: {
        version: V596_SOAK_WARMUP_CONTRACT_VERSION,
        warmupCycleCount: V596_SOAK_WARMUP_CYCLE_COUNT,
        warmupSampleCount: V596_SOAK_WARMUP_SAMPLE_COUNT,
        measuredCycleCount: 2,
        measuredSampleCount: 8,
        baselineSource: "first-measured-baseline-after-warmup",
        warmupExcludedFromFormalMetrics: true,
      },
    },
    finalExit: {
      pathname: "/downloads",
      transition: "next-link-route-exit",
      observedAfterPhase: "exited",
      snapshotReuseWitness: true,
      observation: releasedObservation(),
      teardown: finalExitTeardown,
      releaseCompletion: {
        transition: "next-link-route-exit",
        observedAfterPhase: "exited",
        teardown: finalExitTeardown,
      },
    },
    errors: errors(),
    authority: authority(),
  });
}

test("synthetic current-v596 CDP renderer and heap cycles validate", () => {
  const stage = soakFixture();
  const result = validateV596SoakStage(stage, identity(), { syntheticFixture: true });
  assert.equal(result.shardCount, 2);
  assert.equal(result.cycleCount, 2);
  assert.equal(result.sampleCount, 8);
  assert.equal(result.rendererFingerprint, "renderer-fingerprint-v596-fixture");
});

test("unknown or failed shards cannot be aggregated as a pass", () => {
  const stage = structuredClone(soakFixture());
  stage.shards[1].status = "unknown";
  stage.shards[1].unknown = true;
  const resealed = resealStage(stage);
  assert.throws(
    () => validateV596SoakStage(resealed, identity(), { syntheticFixture: true }),
    /v596-soak-shard-status:fixture-shard-b:unknown/,
  );
  const failed = structuredClone(soakFixture());
  failed.aggregation.failedShardCount = 1;
  assert.throws(
    () => validateV596SoakStage(resealStage(failed), identity(), { syntheticFixture: true }),
    /v596-soak-shard-aggregation/,
  );
});

test("sample replay seals and observed zero semantics fail closed", () => {
  const replay = structuredClone(soakFixture());
  replay.samples[2].previousSampleSha256 = "8".repeat(64);
  assert.throws(
    () => validateV596SoakStage(resealStage(replay), identity(), { syntheticFixture: true }),
    /v596-soak-sample-replay:2/,
  );
  const unknown = structuredClone(soakFixture());
  unknown.finalExit.observation.canvas.count = null;
  assert.throws(
    () => validateV596SoakStage(resealStage(unknown), identity(), { syntheticFixture: true }),
    /v596-unknown-zero:final-exit:canvas.count/,
  );
});

test("profile identity drift or absence fails closed even after a complete reseal", () => {
  const drifted = structuredClone(soakFixture());
  drifted.samples[4].profileKey = "hot-radiative";
  assert.throws(
    () => validateV596SoakStage(
      resealStage(drifted, { resealSamples: true }),
      identity(),
      { syntheticFixture: true },
    ),
    /v596-soak-profile:4/,
  );

  const missing = structuredClone(soakFixture());
  delete missing.samples[4].profileKey;
  assert.throws(
    () => validateV596SoakStage(
      resealStage(missing, { resealSamples: true }),
      identity(),
      { syntheticFixture: true },
    ),
    /v596-soak-profile:4/,
  );
});

test("coherently resealed sample reordering cannot preserve a formal exact sequence", () => {
  const reordered = structuredClone(soakFixture());
  [reordered.samples[1], reordered.samples[2]] = [
    reordered.samples[2],
    reordered.samples[1],
  ];
  for (const [index, sample] of reordered.samples.entries()) {
    sample.sequence = index;
    sample.capturedAtMs = 1_000 + index * 100;
  }
  assert.throws(
    () => validateV596SoakStage(
      resealStage(reordered, { resealSamples: true }),
      identity(),
      { syntheticFixture: true },
    ),
    /v596-soak-phase-order:1/,
  );
});

test("warmup evidence is replay sealed and cannot be substituted for measured baselines", () => {
  const replay = structuredClone(soakFixture());
  replay.warmupSamples[2].previousSampleSha256 = "9".repeat(64);
  assert.throws(
    () => validateV596SoakStage(resealStage(replay), identity(), { syntheticFixture: true }),
    /v596-soak-warmup-replay:2/,
  );

  const substituted = structuredClone(soakFixture());
  substituted.metrics.heap.baselineUsedSizeBytes =
    substituted.warmup.firstHeapUsedSizeBytes + 1;
  assert.throws(
    () => validateV596SoakStage(resealStage(substituted), identity(), {
      syntheticFixture: true,
    }),
    /v596-soak-heap-qualification/,
  );

  const included = structuredClone(soakFixture());
  included.metrics.measurementWindow.warmupExcludedFromFormalMetrics = false;
  assert.throws(
    () => validateV596SoakStage(resealStage(included), identity(), {
      syntheticFixture: true,
    }),
    /v596-soak-measurement-window/,
  );
});

test("warmup mounted-to-stable renderer counters are recomputed from sealed raw samples", () => {
  const forged = structuredClone(soakFixture());
  forged.warmupSamples[2].observation.renderer.textures -= 1;
  assert.throws(
    () => validateV596SoakStage(
      resealStage(forged, { resealWarmupSamples: true }),
      identity(),
      { syntheticFixture: true },
    ),
    /v596-soak-warmup-renderer-transition/,
  );
});

test("heap OLS values and tail window are recomputed from sealed raw samples", () => {
  const forgedSlope = structuredClone(soakFixture());
  forgedSlope.metrics.heap.overallOlsBytesPerSample = -123_456;
  assert.throws(
    () => validateV596SoakStage(resealStage(forgedSlope), identity(), {
      syntheticFixture: true,
    }),
    /v596-soak-heap-ols-recomputation/,
  );

  const forgedTail = structuredClone(soakFixture());
  forgedTail.metrics.heap.tailSampleCount = 5;
  assert.throws(
    () => validateV596SoakStage(resealStage(forgedTail), identity(), {
      syntheticFixture: true,
    }),
    /v596-soak-heap-ols-recomputation/,
  );
});

test("measured baseline and mounted phases enforce null observation and teardown semantics", () => {
  const baselineObservation = structuredClone(soakFixture());
  baselineObservation.samples[0].observation = mountedObservation();
  assert.throws(
    () => validateV596SoakStage(
      resealStage(baselineObservation, { resealSamples: true }),
      identity(),
      { syntheticFixture: true },
    ),
    /v596-soak-baseline-observation:0/,
  );

  const mountedTeardown = structuredClone(soakFixture());
  mountedTeardown.samples[1].teardown = teardown("/", null);
  assert.throws(
    () => validateV596SoakStage(
      resealStage(mountedTeardown, { resealSamples: true }),
      identity(),
      { syntheticFixture: true },
    ),
    /v596-soak-mounted-teardown:1/,
  );
});

test("synthetic evidence cannot pass the formal path and authority cannot elevate", () => {
  assert.throws(
    () => validateV596SoakStage(soakFixture(), identity()),
    /v596-soak-stage-status|v596-synthetic-as-formal/,
  );
  const elevated = structuredClone(soakFixture());
  elevated.authority.measuredAuthorityGranted = true;
  assert.throws(
    () => validateV596SoakStage(resealStage(elevated), identity(), { syntheticFixture: true }),
    /v596-authority-elevation:soak-stage:measuredAuthorityGranted/,
  );
});

test("synthetic soak receipt validation performs no output write", async () => {
  const root = await mkdtemp(join(tmpdir(), "v596-soak-fixture-"));
  try {
    await mkdir(join(root, "tmp"), { recursive: true });
    await writeFile(
      join(root, "tmp", "stage.json"),
      `${JSON.stringify(soakFixture(), null, 2)}\n`,
      "utf8",
    );
    const output = "tmp/must-not-exist.json";
    const receipt = await buildV596SoakReceipt({
      root,
      outputRoot: root,
      stagePath: "tmp/stage.json",
      outputPath: output,
      syntheticFixture: true,
      bundle: {
        workspace: root,
        identities: { standalone: identity() },
        candidate: { authority: authority() },
      },
    });
    assert.equal(receipt.status, V596_SOAK_SYNTHETIC_RECEIPT_STATUS);
    assert.equal(receipt.synthetic, true);
    await assert.rejects(access(join(root, output), constants.F_OK));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
