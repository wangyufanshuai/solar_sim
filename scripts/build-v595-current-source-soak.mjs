import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV595,
  assertKnownNonNegativeV595,
  assertKnownPositiveV595,
  assertV595Authority,
  assertV595EvidenceEnvelope,
  assertV595Formal,
  atomicWriteJsonV595Formal,
  canonicalShaV595Formal,
  fileReceiptV595Formal,
  loadCurrentV595Bundle,
  readJsonV595Formal,
  sealV595FormalDocument,
  sameCanonicalV595Formal,
  validateV595Identity,
  verifyV595FormalSeal,
} from "./v595-formal-contract.mjs";
import {
  V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v595-current-source-lifecycle.mjs";

export const V595_SOAK_STAGE_VERSION = "v595-cdp-renderer-heap-soak-stage-v2";
export const V595_SOAK_STAGE_STATUS =
  "staging-v595-cdp-renderer-heap-soak-passed-not-promoted";
export const V595_SOAK_SYNTHETIC_STAGE_STATUS =
  "synthetic-v595-cdp-renderer-heap-soak-fixture-not-formal";
export const V595_SOAK_RECEIPT_VERSION = "v595-current-source-soak-v2";
export const V595_SOAK_RECEIPT_STATUS =
  "passed-current-v595-cdp-renderer-heap-cycles-and-final-scene-exit";
export const V595_SOAK_SYNTHETIC_RECEIPT_STATUS =
  "validated-synthetic-v595-soak-fixture-not-formal";
export const V595_SOAK_SAMPLE_LINK_VERSION = "v595-cdp-soak-sample-link-v2";
export const V595_SOAK_WARMUP_SAMPLE_LINK_VERSION = "v595-cdp-soak-warmup-sample-link-v1";
export const V595_SOAK_WARMUP_CONTRACT_VERSION = "v595-cdp-soak-premeasurement-warmup-v1";
export const V595_SOAK_RUNNER_VERSION = "v595-cdp-renderer-heap-soak-runner-v2";
export const V595_SOAK_AUDITOR_VERSION = "v595-cdp-renderer-heap-soak-audit-v2";
export const V595_SOAK_MINIMUM_CYCLES = 40;
export const V595_SOAK_SAMPLES_PER_CYCLE = 4;
// A complete lifecycle is recorded before the formal measurement window. It
// absorbs first-render module/renderer allocation while remaining visible in
// the stage dossier; it is never included in the 40-cycle heap gates.
export const V595_SOAK_WARMUP_CYCLE_COUNT = 1;
export const V595_SOAK_WARMUP_SAMPLE_COUNT =
  V595_SOAK_WARMUP_CYCLE_COUNT * V595_SOAK_SAMPLES_PER_CYCLE;
export const V595_SOAK_HEAP_ALLOWANCE_BYTES = 8 * 1024 * 1024;
export const V595_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE = 256 * 1024;
export const V595_SOAK_PROFILES = Object.freeze([
  Object.freeze({ key: "hot-radiative", targetId: "sirius-a" }),
  Object.freeze({ key: "blue-supergiant-wind", targetId: "rigel" }),
  Object.freeze({ key: "solar-like-convective", targetId: "alpha-centauri-a" }),
  Object.freeze({ key: "cool-convective", targetId: "arcturus" }),
  Object.freeze({ key: "red-giant-supergiant", targetId: "betelgeuse" }),
  Object.freeze({ key: "warm-radiative-convective", targetId: "procyon-a" }),
  Object.freeze({ key: "rapid-rotator-gravity-darkened", targetId: "achernar" }),
  Object.freeze({ key: "relativity-workbench", targetId: "sun" }),
]);

const CONTEXT_LOSS_SOURCES = new Set(["webglcontextlost-event", "isContextLost"]);
const RENDERER_COUNTERS = Object.freeze([
  "textures",
  "geometries",
  "programs",
  "renderTargets",
]);
const SHARD_PASS_STATUSES = new Set(["passed", "passed-complete"]);

function assertEmptyErrors(errors, label) {
  assertV595Formal(
    errors && typeof errors === "object" && !Array.isArray(errors),
    `v595-soak-errors-envelope:${label}`,
  );
  for (const field of [
    "consoleErrors",
    "pageErrors",
    "unhandledRejections",
    "webglContextErrors",
    "cdpErrors",
  ]) {
    assertV595Formal(
      Array.isArray(errors[field]) && errors[field].length === 0,
      `v595-soak-errors:${label}:${field}`,
    );
  }
}

function assertHeap(heap, label) {
  assertV595Formal(
    heap && typeof heap === "object" && !Array.isArray(heap),
    `v595-soak-heap-shape:${label}`,
  );
  for (const field of ["usedSize", "totalSize"]) {
    assertKnownPositiveV595(heap[field], `${label}:heap.${field}`);
  }
  for (const field of ["embedderHeapUsedSize", "backingStorageSize"]) {
    assertKnownNonNegativeV595(heap[field], `${label}:heap.${field}`);
  }
  assertV595Formal(
    heap.totalSize >= heap.usedSize,
    `v595-soak-heap-total-used:${label}`,
  );
}

function assertMountedObservation(observation, label) {
  assertV595Formal(
    observation?.captureKind === "mounted-renderer",
    `v595-soak-mounted-kind:${label}`,
  );
  assertV595Formal(
    observation.canvas?.count === 1 && observation.canvas?.connected === 1,
    `v595-soak-mounted-one-canvas:${label}`,
  );
  assertV595Formal(
    observation.renderer?.active === 1
      && observation.renderer?.resourceCountsSource === "three.webglrenderer.info",
    `v595-soak-mounted-renderer:${label}`,
  );
  for (const field of RENDERER_COUNTERS) {
    assertKnownNonNegativeV595(
      observation.renderer?.[field],
      `${label}:renderer.${field}`,
    );
  }
  assertV595Formal(
    typeof observation.renderer?.fingerprint === "string"
      && observation.renderer.fingerprint.length >= 8,
    `v595-soak-renderer-fingerprint:${label}`,
  );
  return observation.renderer.fingerprint;
}

function assertReleasedObservation(observation, label) {
  assertV595Formal(
    observation?.captureKind === "unmounted-renderer",
    `v595-soak-released-kind:${label}`,
  );
  const knownZero = [
    [observation.canvas?.count, "canvas.count"],
    [observation.canvas?.connected, "canvas.connected"],
    [observation.renderer?.active, "renderer.active"],
    [observation.renderer?.renderTargets, "renderer.renderTargets"],
    [observation.registry?.total, "registry.total"],
    [observation.registry?.workers, "registry.workers"],
    [observation.registry?.renderTargets, "registry.renderTargets"],
    [observation.registry?.textures, "registry.textures"],
    [observation.registry?.subscriptions, "registry.subscriptions"],
    [observation.registry?.typedArrays, "registry.typedArrays"],
    [observation.registry?.estimatedBytes, "registry.estimatedBytes"],
    [observation.scene?.active, "scene.active"],
    [observation.scene?.objects, "scene.objects"],
    [observation.scene?.candidateNodes, "scene.candidateNodes"],
  ];
  for (const [value, field] of knownZero) {
    assertKnownFiniteZeroV595(value, `${label}:${field}`);
  }
  assertV595Formal(
    observation.renderer?.textures === null
      && observation.renderer?.geometries === null
      && observation.renderer?.programs === null
      && observation.renderer?.resourceCountsSource
        === "unavailable-context-lost-stale-info",
    `v595-soak-released-renderer-unavailable:${label}`,
  );
  assertV595Formal(
    observation.renderer?.renderTargetsSource
      === "atlas-resource-registry.gpuRenderTargets",
    `v595-soak-release-render-target-source:${label}`,
  );
}

function assertTeardown(teardown, { label, routeAfter, observerReleased }) {
  assertV595Formal(
    teardown && typeof teardown === "object" && !Array.isArray(teardown),
    `v595-soak-teardown-shape:${label}`,
  );
  for (const field of [
    "renderListsDisposed",
    "forceContextLossCalled",
    "contextLost",
    "canvasDetached",
    "resourceReferencesReleased",
  ]) {
    assertV595Formal(teardown[field] === true, `v595-soak-teardown:${label}:${field}`);
  }
  assertV595Formal(
    CONTEXT_LOSS_SOURCES.has(teardown.contextLossSource),
    `v595-soak-context-loss-source:${label}`,
  );
  assertV595Formal(teardown.routeAfter === routeAfter, `v595-soak-route:${label}`);
  assertV595Formal(
    teardown.observerReleased === observerReleased,
    `v595-soak-observer-release:${label}`,
  );
  return teardown;
}

function validateShardAggregation(stage) {
  const shards = stage.shards;
  assertV595Formal(Array.isArray(shards) && shards.length > 0, "v595-soak-shards");
  const ids = new Set();
  let cycleCount = 0;
  let sampleCount = 0;
  for (const [index, shard] of shards.entries()) {
    assertV595Formal(
      shard && typeof shard === "object" && !Array.isArray(shard),
      `v595-soak-shard-shape:${index}`,
    );
    assertV595Formal(
      typeof shard.id === "string" && shard.id.length > 0 && !ids.has(shard.id),
      `v595-soak-shard-id:${index}`,
    );
    ids.add(shard.id);
    assertV595Formal(
      SHARD_PASS_STATUSES.has(shard.status),
      `v595-soak-shard-status:${shard.id}:${String(shard.status)}`,
    );
    assertV595Formal(
      shard.unknown === false && shard.failed === false && shard.complete === true,
      `v595-soak-shard-disposition:${shard.id}`,
    );
    assertV595Formal(
      Number.isSafeInteger(shard.cycleCount) && shard.cycleCount > 0
        && Number.isSafeInteger(shard.sampleCount) && shard.sampleCount > 0,
      `v595-soak-shard-count:${shard.id}`,
    );
    cycleCount += shard.cycleCount;
    sampleCount += shard.sampleCount;
  }
  assertV595Formal(
    stage.aggregation?.status === "passed-all-shards-complete"
      && stage.aggregation?.unknownShardCount === 0
      && stage.aggregation?.failedShardCount === 0
      && stage.aggregation?.completedShardCount === shards.length
      && stage.aggregation?.cycleCount === cycleCount
      && stage.aggregation?.sampleCount === sampleCount,
    "v595-soak-shard-aggregation",
  );
  return Object.freeze({ shardCount: shards.length, cycleCount, sampleCount });
}

function validateWarmupSampleSequence(stage, identity) {
  const samples = stage.warmupSamples;
  assertV595Formal(
    Array.isArray(samples) && samples.length === V595_SOAK_WARMUP_SAMPLE_COUNT,
    "v595-soak-warmup-sample-count",
  );
  const profile = V595_SOAK_PROFILES[0];
  const phases = ["baseline", "mounted", "profile-stable", "detached-stable"];
  let previous = null;
  let realmToken = null;
  let timeOrigin = null;
  let previousCapturedAtMs = null;
  let rendererFingerprint = null;
  for (const [index, sample] of samples.entries()) {
    const phase = phases[index];
    assertV595Formal(sample?.sequence === index, `v595-soak-warmup-sequence:${index}`);
    assertV595Formal(sample?.cycleIndex === 0, `v595-soak-warmup-cycle-index:${index}`);
    assertV595Formal(sample?.phase === phase, `v595-soak-warmup-phase:${index}`);
    assertV595Formal(sample?.profileKey === profile.key, `v595-soak-warmup-profile:${index}`);
    assertV595Formal(
      sample.previousSampleSha256 === previous,
      `v595-soak-warmup-replay:${index}`,
    );
    const unsigned = { ...sample };
    delete unsigned.sampleSha256;
    assertV595Formal(
      sample.sampleSha256 === canonicalShaV595Formal({
        version: V595_SOAK_WARMUP_SAMPLE_LINK_VERSION,
        entry: unsigned,
      }),
      `v595-soak-warmup-seal:${index}`,
    );
    previous = sample.sampleSha256;
    assertV595Formal(
      typeof sample.realmToken === "string" && sample.realmToken.length >= 8,
      `v595-soak-warmup-realm:${index}`,
    );
    assertKnownPositiveV595(sample.timeOrigin, `warmup:${index}:timeOrigin`);
    realmToken ??= sample.realmToken;
    timeOrigin ??= sample.timeOrigin;
    assertV595Formal(
      sample.realmToken === realmToken && sample.timeOrigin === timeOrigin,
      `v595-soak-warmup-realm-drift:${index}`,
    );
    validateV595Identity(sample.identity, identity, { deliveryTier: "standalone-full" });
    assertV595Formal(
      Number.isFinite(sample.capturedAtMs)
        && (previousCapturedAtMs === null || sample.capturedAtMs > previousCapturedAtMs),
      `v595-soak-warmup-time:${index}`,
    );
    previousCapturedAtMs = sample.capturedAtMs;
    assertHeap(sample.cdp?.runtimeHeap, `warmup:${index}`);
    for (const field of ["documents", "nodes", "jsEventListeners"]) {
      assertV595Formal(
        Number.isSafeInteger(sample.cdp?.domCounters?.[field])
          && sample.cdp.domCounters[field] >= 0,
        `v595-soak-warmup-dom:${index}:${field}`,
      );
    }
    assertEmptyErrors(sample.errors, `warmup:${index}`);
    if (phase === "baseline") {
      assertV595Formal(sample.observation === null, "v595-soak-warmup-baseline-observation");
      assertV595Formal(sample.teardown === null, "v595-soak-warmup-baseline-teardown");
    } else if (phase === "mounted" || phase === "profile-stable") {
      const fingerprint = assertMountedObservation(sample.observation, `warmup:${index}`);
      rendererFingerprint ??= fingerprint;
      assertV595Formal(
        fingerprint === rendererFingerprint,
        `v595-soak-warmup-renderer-fingerprint:${index}`,
      );
      assertV595Formal(sample.teardown === null, `v595-soak-warmup-mounted-teardown:${index}`);
    } else {
      assertReleasedObservation(sample.observation, `warmup:${index}`);
      assertTeardown(sample.teardown, {
        label: `warmup:${index}`,
        routeAfter: "/",
        observerReleased: null,
      });
    }
  }
  assertV595Formal(rendererFingerprint !== null, "v595-soak-warmup-renderer-fingerprint-missing");
  return Object.freeze({
    cycleCount: V595_SOAK_WARMUP_CYCLE_COUNT,
    sampleCount: samples.length,
    profileKey: profile.key,
    realmToken,
    timeOrigin,
    rendererFingerprint,
    firstHeapUsedBytes: samples[0].cdp.runtimeHeap.usedSize,
    finalHeapUsedBytes: samples.at(-1).cdp.runtimeHeap.usedSize,
    finalSampleSha256: samples.at(-1).sampleSha256,
  });
}

function validateSampleSequence(stage, identity, aggregation) {
  assertV595Formal(
    Array.isArray(stage.samples) && stage.samples.length === aggregation.sampleCount,
    "v595-soak-sample-count",
  );
  let previous = null;
  let realmToken = null;
  let timeOrigin = null;
  let previousCapturedAtMs = null;
  let rendererFingerprint = null;
  const cyclePhases = new Map();
  for (const [index, sample] of stage.samples.entries()) {
    assertV595Formal(sample?.sequence === index, `v595-soak-sample-sequence:${index}`);
    assertV595Formal(
      sample.previousSampleSha256 === previous,
      `v595-soak-sample-replay:${index}`,
    );
    const unsigned = { ...sample };
    delete unsigned.sampleSha256;
    assertV595Formal(
      sample.sampleSha256 === canonicalShaV595Formal({
        version: V595_SOAK_SAMPLE_LINK_VERSION,
        entry: unsigned,
      }),
      `v595-soak-sample-seal:${index}`,
    );
    previous = sample.sampleSha256;
    assertV595Formal(
      Number.isSafeInteger(sample.cycleIndex)
        && sample.cycleIndex >= 0
        && sample.cycleIndex < aggregation.cycleCount,
      `v595-soak-cycle-index:${index}`,
    );
    assertV595Formal(
      new Set(["baseline", "mounted", "profile-stable", "detached-stable"])
        .has(sample.phase),
      `v595-soak-phase:${index}`,
    );
    const phaseSet = cyclePhases.get(sample.cycleIndex) ?? new Set();
    assertV595Formal(!phaseSet.has(sample.phase), `v595-soak-phase-duplicate:${index}`);
    phaseSet.add(sample.phase);
    cyclePhases.set(sample.cycleIndex, phaseSet);
    assertV595Formal(
      typeof sample.realmToken === "string" && sample.realmToken.length >= 8,
      `v595-soak-realm:${index}`,
    );
    assertKnownPositiveV595(sample.timeOrigin, `soak:${index}:timeOrigin`);
    realmToken ??= sample.realmToken;
    timeOrigin ??= sample.timeOrigin;
    assertV595Formal(
      sample.realmToken === realmToken && sample.timeOrigin === timeOrigin,
      `v595-soak-realm-drift:${index}`,
    );
    validateV595Identity(sample.identity, identity, { deliveryTier: "standalone-full" });
    assertV595Formal(
      Number.isFinite(sample.capturedAtMs)
        && (previousCapturedAtMs === null || sample.capturedAtMs > previousCapturedAtMs),
      `v595-soak-sample-time:${index}`,
    );
    previousCapturedAtMs = sample.capturedAtMs;
    assertHeap(sample.cdp?.runtimeHeap, `sample:${index}`);
    for (const field of ["documents", "nodes", "jsEventListeners"]) {
      assertV595Formal(
        Number.isSafeInteger(sample.cdp?.domCounters?.[field])
          && sample.cdp.domCounters[field] >= 0,
        `v595-soak-dom:${index}:${field}`,
      );
    }
    assertEmptyErrors(sample.errors, `sample:${index}`);
    if (sample.phase === "mounted" || sample.phase === "profile-stable") {
      const fingerprint = assertMountedObservation(sample.observation, `sample:${index}`);
      rendererFingerprint ??= fingerprint;
      assertV595Formal(
        fingerprint === rendererFingerprint,
        `v595-soak-renderer-fingerprint-drift:${index}`,
      );
    } else if (sample.phase === "detached-stable") {
      assertReleasedObservation(sample.observation, `sample:${index}`);
      assertTeardown(sample.teardown, {
        label: `sample:${index}`,
        routeAfter: "/",
        observerReleased: null,
      });
    }
  }
  assertV595Formal(
    cyclePhases.size === aggregation.cycleCount
      && [...cyclePhases.values()].every((set) => set.size === 4),
    "v595-soak-cycle-phase-completeness",
  );
  return Object.freeze({
    realmToken,
    timeOrigin,
    rendererFingerprint,
    firstHeapUsedBytes: stage.samples[0].cdp.runtimeHeap.usedSize,
    finalMeasuredHeapUsedBytes:
      stage.samples.at(-1).cdp.runtimeHeap.usedSize,
  });
}

function validateHeapMetrics(stage, samples) {
  const metrics = stage.metrics;
  assertV595Formal(
    metrics && typeof metrics === "object" && !Array.isArray(metrics),
    "v595-soak-metrics-shape",
  );
  assertV595Formal(
    metrics.cycleCount === stage.aggregation.cycleCount
      && metrics.sampleCount === stage.aggregation.sampleCount
      && metrics.rendererFingerprintCount === 1
      && metrics.rendererResourceBaselineStable === true
      && metrics.rendererResourceGrowth === false
      && metrics.canvasCountStable === true,
    "v595-soak-metrics-renderer",
  );
  const warmup = stage.warmup;
  const measurementWindow = metrics.measurementWindow;
  assertV595Formal(
    warmup
      && warmup.version === V595_SOAK_WARMUP_CONTRACT_VERSION
      && warmup.cycleCount === V595_SOAK_WARMUP_CYCLE_COUNT
      && warmup.sampleCount === V595_SOAK_WARMUP_SAMPLE_COUNT
      && warmup.recordedSeparately === true
      && warmup.excludedFromFormalMetrics === true
      && warmup.baselineSource === "first-measured-baseline-after-warmup"
      && measurementWindow
      && measurementWindow.version === V595_SOAK_WARMUP_CONTRACT_VERSION
      && measurementWindow.warmupCycleCount === V595_SOAK_WARMUP_CYCLE_COUNT
      && measurementWindow.warmupSampleCount === V595_SOAK_WARMUP_SAMPLE_COUNT
      && measurementWindow.measuredCycleCount === stage.aggregation.cycleCount
      && measurementWindow.measuredSampleCount === stage.aggregation.sampleCount
      && measurementWindow.baselineSource === "first-measured-baseline-after-warmup"
      && measurementWindow.warmupExcludedFromFormalMetrics === true,
    "v595-soak-measurement-window",
  );
  const heap = metrics.heap;
  assertV595Formal(
    heap && typeof heap === "object" && !Array.isArray(heap),
    "v595-soak-metrics-heap",
  );
  for (const field of [
    "baselineUsedSizeBytes",
    "finalUsedSizeBytes",
    "allowanceBytes",
    "overallOlsBytesPerSample",
    "tailOlsBytesPerSample",
    "tailOlsMaximumBytesPerSample",
  ]) {
    assertV595Formal(
      typeof heap[field] === "number" && Number.isFinite(heap[field]),
      `v595-soak-heap-metric:${field}`,
    );
  }
  assertV595Formal(
    heap.baselineUsedSizeBytes === samples.firstHeapUsedBytes
      && heap.finalUsedSizeBytes === samples.finalMeasuredHeapUsedBytes
      && heap.allowanceBytes === V595_SOAK_HEAP_ALLOWANCE_BYTES
      && heap.finalUsedSizeBytes <= heap.baselineUsedSizeBytes + heap.allowanceBytes
      && heap.tailOlsMaximumBytesPerSample
        === V595_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE
      && heap.tailOlsBytesPerSample <= heap.tailOlsMaximumBytesPerSample
      && heap.finalHeapWithinAllowance === true
      && heap.tailOlsWithinLimit === true
      && heap.sustainedGrowth === false
      && heap.telemetry === "chromium-cdp-runtime-getHeapUsage"
      && heap.garbageCollection === "HeapProfiler.collectGarbage",
    "v595-soak-heap-qualification",
  );
  assertV595Formal(
    metrics.rawHardGatesPassed === true
      && metrics.semanticFallbackApplied === false
      && metrics.syntheticHeapPassClaim === false,
    "v595-soak-no-synthetic-or-semantic-substitution",
  );
  return metrics;
}

export function validateV595SoakStage(stage, expectedIdentity, options = {}) {
  verifyV595FormalSeal(stage, "receiptSha256", "soak-stage");
  assertV595Formal(stage.version === V595_SOAK_STAGE_VERSION, "v595-soak-stage-version");
  assertV595Formal(stage.status === (options.syntheticFixture
    ? V595_SOAK_SYNTHETIC_STAGE_STATUS
    : V595_SOAK_STAGE_STATUS), "v595-soak-stage-status");
  assertV595EvidenceEnvelope(stage, options);
  assertV595Formal(
    stage.qualificationScope === (options.syntheticFixture
      ? "synthetic-test-only"
      : "formal-current-v595-cdp-renderer-heap-soak"),
    "v595-soak-qualification-scope",
  );
  assertV595Formal(
    stage.tooling?.runnerVersion === V595_SOAK_RUNNER_VERSION
      && stage.tooling?.auditorVersion === V595_SOAK_AUDITOR_VERSION,
    "v595-soak-tooling-version",
  );
  const identity = validateV595Identity(stage.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  const warmup = validateWarmupSampleSequence(stage, identity);
  assertV595Formal(
    stage.warmup?.version === V595_SOAK_WARMUP_CONTRACT_VERSION
      && stage.warmup?.cycleCount === warmup.cycleCount
      && stage.warmup?.sampleCount === warmup.sampleCount
      && stage.warmup?.profileKey === warmup.profileKey
      && stage.warmup?.rendererFingerprint === warmup.rendererFingerprint
      && stage.warmup?.firstHeapUsedSizeBytes === warmup.firstHeapUsedBytes
      && stage.warmup?.finalHeapUsedSizeBytes === warmup.finalHeapUsedBytes
      && stage.warmup?.finalSampleSha256 === warmup.finalSampleSha256
      && stage.warmup?.recordedSeparately === true
      && stage.warmup?.excludedFromFormalMetrics === true
      && stage.warmup?.baselineSource === "first-measured-baseline-after-warmup",
    "v595-soak-warmup-contract",
  );
  const aggregation = validateShardAggregation(stage);
  assertV595Formal(
    aggregation.sampleCount === aggregation.cycleCount * V595_SOAK_SAMPLES_PER_CYCLE
      && (options.syntheticFixture
        ? aggregation.cycleCount > 0
        : aggregation.cycleCount >= V595_SOAK_MINIMUM_CYCLES),
    "v595-soak-formal-cycle-envelope",
  );
  assertV595Formal(
    stage.policy?.cycleCount === aggregation.cycleCount
      && stage.policy?.sampleCount === aggregation.sampleCount
      && stage.policy?.minimumFormalCycleCount === V595_SOAK_MINIMUM_CYCLES
      && stage.policy?.samplesPerCycle === V595_SOAK_SAMPLES_PER_CYCLE
      && stage.policy?.heapFinalAbsoluteAllowanceBytes
        === V595_SOAK_HEAP_ALLOWANCE_BYTES
      && stage.policy?.tailOlsMaximumBytesPerSample
        === V595_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE
      && stage.policy?.protocol === "chromium-cdp"
      && stage.policy?.heapCollection
        === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage"
      && stage.policy?.rendererResourceExactStabilityRequired === true
      && stage.policy?.sourceIdentityExactStabilityRequired === true
      && stage.policy?.oneFinalClientRouteExitRequired === true
      && stage.policy?.preMeasurementWarmup?.version === V595_SOAK_WARMUP_CONTRACT_VERSION
      && stage.policy?.preMeasurementWarmup?.cycleCount === V595_SOAK_WARMUP_CYCLE_COUNT
      && stage.policy?.preMeasurementWarmup?.sampleCount === V595_SOAK_WARMUP_SAMPLE_COUNT
      && stage.policy?.preMeasurementWarmup?.recordedSeparately === true
      && stage.policy?.preMeasurementWarmup?.excludedFromFormalMetrics === true
      && stage.policy?.preMeasurementWarmup?.baselineSource
        === "first-measured-baseline-after-warmup",
    "v595-soak-policy",
  );
  const samples = validateSampleSequence(stage, identity, aggregation);
  assertV595Formal(
    samples.realmToken === warmup.realmToken
      && samples.timeOrigin === warmup.timeOrigin,
    "v595-soak-warmup-measured-realm-continuity",
  );
  const metrics = validateHeapMetrics(stage, samples);
  assertV595Formal(
    Array.isArray(stage.identitySnapshots) && stage.identitySnapshots.length >= 2,
    "v595-soak-identity-snapshots",
  );
  for (const [index, snapshot] of stage.identitySnapshots.entries()) {
    validateV595Identity(snapshot.identity, identity, { deliveryTier: "standalone-full" });
    assertV595Formal(
      snapshot.sourceDriftCount === 0
        && Array.isArray(snapshot.sourceDrifts)
        && snapshot.sourceDrifts.length === 0,
      `v595-soak-source-drift:${index}`,
    );
  }
  assertV595Formal(
    stage.identitySnapshots.every((snapshot) => sameCanonicalV595Formal(
      snapshot.identity,
      stage.identitySnapshots[0].identity,
    )),
    "v595-soak-identity-snapshot-drift",
  );
  assertReleasedObservation(stage.finalExit?.observation, "final-exit");
  const finalTeardown = assertTeardown(stage.finalExit?.teardown, {
    label: "final-exit",
    routeAfter: "/downloads",
    observerReleased: true,
  });
  assertV595Formal(
    stage.finalExit?.pathname === "/downloads"
      && stage.finalExit?.transition === "next-link-route-exit"
      && stage.finalExit?.observedAfterPhase === "exited"
      && stage.finalExit?.snapshotReuseWitness === true
      && sameCanonicalV595Formal(
        stage.finalExit?.releaseCompletion?.teardown,
        finalTeardown,
      )
      && stage.finalExit?.releaseCompletion?.transition === "next-link-route-exit"
      && stage.finalExit?.releaseCompletion?.observedAfterPhase === "exited",
    "v595-soak-final-exit-contract",
  );
  assertEmptyErrors(stage.errors, "stage");
  assertV595Authority(stage.authority, "soak-stage");
  return Object.freeze({
    identity,
    warmup,
    ...aggregation,
    rendererFingerprint: samples.rendererFingerprint,
    metrics,
  });
}

export async function buildV595SoakReceipt({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  outputPath = "docs/release/v595/soak-v595.json",
  syntheticFixture = false,
  bundle = null,
} = {}) {
  assertV595Formal(stagePath, "v595-soak-stage-required");
  const current = bundle ?? await loadCurrentV595Bundle(root, { requireBuilds: true });
  const stage = (await readJsonV595Formal(current.workspace, stagePath, "soak-stage")).value;
  const validated = validateV595SoakStage(
    stage,
    current.identities.standalone,
    { syntheticFixture },
  );
  const unsigned = {
    version: V595_SOAK_RECEIPT_VERSION,
    generatedAt: stage.completedAt ?? stage.generatedAt,
    status: syntheticFixture ? V595_SOAK_SYNTHETIC_RECEIPT_STATUS : V595_SOAK_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: await fileReceiptV595Formal(current.workspace, stagePath, "soak-stage"),
    stageReceiptSha256: stage.receiptSha256,
    shardCount: validated.shardCount,
    warmup: validated.warmup,
    warmupSampleCount: validated.warmup.sampleCount,
    cycleCount: validated.cycleCount,
    sampleCount: validated.sampleCount,
    rendererFingerprint: validated.rendererFingerprint,
    metrics: validated.metrics,
    aggregation: {
      allShardsComplete: true,
      unknownShardCount: 0,
      failedShardCount: 0,
    },
    heapQualification: {
      telemetry: "chromium-cdp-runtime-getHeapUsage",
      finalHeapWithinAllowance: true,
      tailOlsWithinLimit: true,
      sustainedGrowth: false,
      noSyntheticSubstitution: true,
    },
    sameRealm: true,
    finalClientRouteExit: "/downloads",
    releaseContractVersion: V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
    tooling: { ...stage.tooling },
    authority: { ...current.candidate.authority },
    synthetic: syntheticFixture,
  };
  assertV595Authority(unsigned.authority, "soak-receipt");
  const receipt = sealV595FormalDocument(unsigned);
  if (!syntheticFixture) {
    await atomicWriteJsonV595Formal(
      current.workspace,
      outputRoot,
      outputPath,
      receipt,
      "soak-output",
    );
  }
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--stage" || token === "--output") values[token.slice(2)] = argv[++index];
    else throw new Error(`v595-soak-argument:${token}`);
  }
  assertV595Formal(values.stage, "v595-soak-stage-required");
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await buildV595SoakReceipt({
    stagePath: args.stage,
    outputPath: args.output,
  });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    cycles: receipt.cycleCount,
    samples: receipt.sampleCount,
    receiptSha256: receipt.receiptSha256,
    synthetic: receipt.synthetic,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
