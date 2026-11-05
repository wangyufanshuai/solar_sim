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
  canonicalShaV596Formal,
  fileReceiptV596Formal,
  loadCurrentV596Bundle,
  readJsonV596Formal,
  sealV596FormalDocument,
  sameCanonicalV596Formal,
  validateV596Identity,
  verifyV596FormalSeal,
} from "./v596-formal-contract.mjs";
import {
  V596_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
} from "./build-v596-current-source-lifecycle.mjs";

export const V596_SOAK_STAGE_VERSION = "v596-cdp-renderer-heap-soak-stage-v3";
export const V596_SOAK_STAGE_STATUS =
  "staging-v596-cdp-renderer-heap-soak-passed-not-promoted";
export const V596_SOAK_SYNTHETIC_STAGE_STATUS =
  "synthetic-v596-cdp-renderer-heap-soak-fixture-not-formal";
export const V596_SOAK_RECEIPT_VERSION = "v596-current-source-soak-v3";
export const V596_SOAK_RECEIPT_STATUS =
  "passed-current-v596-cdp-renderer-heap-cycles-and-final-scene-exit";
export const V596_SOAK_SYNTHETIC_RECEIPT_STATUS =
  "validated-synthetic-v596-soak-fixture-not-formal";
export const V596_SOAK_SAMPLE_LINK_VERSION = "v596-cdp-soak-sample-link-v3";
export const V596_SOAK_WARMUP_SAMPLE_LINK_VERSION = "v596-cdp-soak-warmup-sample-link-v1";
export const V596_SOAK_WARMUP_CONTRACT_VERSION = "v596-cdp-soak-premeasurement-warmup-v1";
export const V596_SOAK_RUNNER_VERSION = "v596-cdp-renderer-heap-soak-runner-v3";
export const V596_SOAK_AUDITOR_VERSION = "v596-cdp-renderer-heap-soak-audit-v3";
export const V596_SOAK_MINIMUM_CYCLES = 40;
export const V596_SOAK_SAMPLES_PER_CYCLE = 4;
// A complete lifecycle is recorded before the formal measurement window. It
// absorbs first-render module/renderer allocation while remaining visible in
// the stage dossier; it is never included in the 40-cycle heap gates.
export const V596_SOAK_WARMUP_CYCLE_COUNT = 1;
export const V596_SOAK_WARMUP_SAMPLE_COUNT =
  V596_SOAK_WARMUP_CYCLE_COUNT * V596_SOAK_SAMPLES_PER_CYCLE;
export const V596_SOAK_HEAP_ALLOWANCE_BYTES = 8 * 1024 * 1024;
export const V596_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE = 256 * 1024;
export const V596_SOAK_PROFILES = Object.freeze([
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
const V596_SOAK_PHASES = Object.freeze([
  "baseline",
  "mounted",
  "profile-stable",
  "detached-stable",
]);
const MOUNTED_REGISTRY_COUNTERS = Object.freeze([
  "total",
  "workers",
  "renderTargets",
  "textures",
  "subscriptions",
  "typedArrays",
  "estimatedBytes",
]);
const MOUNTED_SCENE_COUNTERS = Object.freeze(["active", "objects", "candidateNodes"]);
const SHARD_PASS_STATUSES = new Set(["passed", "passed-complete"]);

function olsSlopeV596Formal(values) {
  assertV596Formal(
    Array.isArray(values) && values.length > 0,
    "v596-soak-ols-values",
  );
  assertV596Formal(
    values.every((value) => typeof value === "number" && Number.isFinite(value)),
    "v596-soak-ols-finite",
  );
  if (values.length === 1) return 0;
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index += 1) {
    const dx = index - xMean;
    numerator += dx * (values[index] - yMean);
    denominator += dx * dx;
  }
  assertV596Formal(denominator > 0, "v596-soak-ols-denominator");
  return numerator / denominator;
}

function assertEmptyErrors(errors, label) {
  assertV596Formal(
    errors && typeof errors === "object" && !Array.isArray(errors),
    `v596-soak-errors-envelope:${label}`,
  );
  for (const field of [
    "consoleErrors",
    "pageErrors",
    "unhandledRejections",
    "webglContextErrors",
    "cdpErrors",
  ]) {
    assertV596Formal(
      Array.isArray(errors[field]) && errors[field].length === 0,
      `v596-soak-errors:${label}:${field}`,
    );
  }
}

function assertHeap(heap, label) {
  assertV596Formal(
    heap && typeof heap === "object" && !Array.isArray(heap),
    `v596-soak-heap-shape:${label}`,
  );
  for (const field of ["usedSize", "totalSize"]) {
    assertKnownPositiveV596(heap[field], `${label}:heap.${field}`);
  }
  for (const field of ["embedderHeapUsedSize", "backingStorageSize"]) {
    assertKnownNonNegativeV596(heap[field], `${label}:heap.${field}`);
  }
  assertV596Formal(
    heap.totalSize >= heap.usedSize,
    `v596-soak-heap-total-used:${label}`,
  );
}

function assertMountedObservation(observation, label) {
  assertV596Formal(
    observation?.captureKind === "mounted-renderer",
    `v596-soak-mounted-kind:${label}`,
  );
  assertV596Formal(
    observation.canvas?.count === 1 && observation.canvas?.connected === 1,
    `v596-soak-mounted-one-canvas:${label}`,
  );
  assertV596Formal(
    observation.renderer?.active === 1
      && observation.renderer?.resourceCountsSource === "three.webglrenderer.info",
    `v596-soak-mounted-renderer:${label}`,
  );
  for (const field of RENDERER_COUNTERS) {
    assertKnownNonNegativeV596(
      observation.renderer?.[field],
      `${label}:renderer.${field}`,
    );
  }
  for (const field of MOUNTED_REGISTRY_COUNTERS) {
    assertKnownNonNegativeV596(
      observation.registry?.[field],
      `${label}:registry.${field}`,
    );
  }
  for (const field of MOUNTED_SCENE_COUNTERS) {
    assertKnownNonNegativeV596(
      observation.scene?.[field],
      `${label}:scene.${field}`,
    );
  }
  assertV596Formal(
    observation.scene.active === 1 && observation.scene.objects > 0,
    `v596-soak-mounted-scene:${label}`,
  );
  assertV596Formal(
    typeof observation.renderer?.fingerprint === "string"
      && observation.renderer.fingerprint.length >= 8,
    `v596-soak-renderer-fingerprint:${label}`,
  );
  return observation.renderer.fingerprint;
}

function assertReleasedObservation(observation, label) {
  assertV596Formal(
    observation?.captureKind === "unmounted-renderer",
    `v596-soak-released-kind:${label}`,
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
    assertKnownFiniteZeroV596(value, `${label}:${field}`);
  }
  assertV596Formal(
    observation.renderer?.textures === null
      && observation.renderer?.geometries === null
      && observation.renderer?.programs === null
      && observation.renderer?.resourceCountsSource
        === "unavailable-context-lost-stale-info",
    `v596-soak-released-renderer-unavailable:${label}`,
  );
  assertV596Formal(
    observation.renderer?.renderTargetsSource
      === "atlas-resource-registry.gpuRenderTargets",
    `v596-soak-release-render-target-source:${label}`,
  );
}

function assertTeardown(teardown, { label, routeAfter, observerReleased }) {
  assertV596Formal(
    teardown && typeof teardown === "object" && !Array.isArray(teardown),
    `v596-soak-teardown-shape:${label}`,
  );
  for (const field of [
    "renderListsDisposed",
    "forceContextLossCalled",
    "contextLost",
    "canvasDetached",
    "resourceReferencesReleased",
  ]) {
    assertV596Formal(teardown[field] === true, `v596-soak-teardown:${label}:${field}`);
  }
  assertV596Formal(
    CONTEXT_LOSS_SOURCES.has(teardown.contextLossSource),
    `v596-soak-context-loss-source:${label}`,
  );
  assertV596Formal(teardown.routeAfter === routeAfter, `v596-soak-route:${label}`);
  assertV596Formal(
    teardown.observerReleased === observerReleased,
    `v596-soak-observer-release:${label}`,
  );
  return teardown;
}

function validateShardAggregation(stage) {
  const shards = stage.shards;
  assertV596Formal(Array.isArray(shards) && shards.length > 0, "v596-soak-shards");
  const ids = new Set();
  let cycleCount = 0;
  let sampleCount = 0;
  for (const [index, shard] of shards.entries()) {
    assertV596Formal(
      shard && typeof shard === "object" && !Array.isArray(shard),
      `v596-soak-shard-shape:${index}`,
    );
    assertV596Formal(
      typeof shard.id === "string" && shard.id.length > 0 && !ids.has(shard.id),
      `v596-soak-shard-id:${index}`,
    );
    ids.add(shard.id);
    assertV596Formal(
      SHARD_PASS_STATUSES.has(shard.status),
      `v596-soak-shard-status:${shard.id}:${String(shard.status)}`,
    );
    assertV596Formal(
      shard.unknown === false && shard.failed === false && shard.complete === true,
      `v596-soak-shard-disposition:${shard.id}`,
    );
    assertV596Formal(
      Number.isSafeInteger(shard.cycleCount) && shard.cycleCount > 0
        && Number.isSafeInteger(shard.sampleCount) && shard.sampleCount > 0,
      `v596-soak-shard-count:${shard.id}`,
    );
    cycleCount += shard.cycleCount;
    sampleCount += shard.sampleCount;
  }
  assertV596Formal(
    stage.aggregation?.status === "passed-all-shards-complete"
      && stage.aggregation?.unknownShardCount === 0
      && stage.aggregation?.failedShardCount === 0
      && stage.aggregation?.completedShardCount === shards.length
      && stage.aggregation?.cycleCount === cycleCount
      && stage.aggregation?.sampleCount === sampleCount,
    "v596-soak-shard-aggregation",
  );
  return Object.freeze({ shardCount: shards.length, cycleCount, sampleCount });
}

function validateWarmupSampleSequence(stage, identity) {
  const samples = stage.warmupSamples;
  assertV596Formal(
    Array.isArray(samples) && samples.length === V596_SOAK_WARMUP_SAMPLE_COUNT,
    "v596-soak-warmup-sample-count",
  );
  const profile = V596_SOAK_PROFILES[0];
  const phases = V596_SOAK_PHASES;
  let previous = null;
  let realmToken = null;
  let timeOrigin = null;
  let previousCapturedAtMs = null;
  let rendererFingerprint = null;
  for (const [index, sample] of samples.entries()) {
    const phase = phases[index];
    assertV596Formal(sample?.sequence === index, `v596-soak-warmup-sequence:${index}`);
    assertV596Formal(sample?.cycleIndex === 0, `v596-soak-warmup-cycle-index:${index}`);
    assertV596Formal(sample?.phase === phase, `v596-soak-warmup-phase:${index}`);
    assertV596Formal(sample?.profileKey === profile.key, `v596-soak-warmup-profile:${index}`);
    assertV596Formal(
      sample.previousSampleSha256 === previous,
      `v596-soak-warmup-replay:${index}`,
    );
    const unsigned = { ...sample };
    delete unsigned.sampleSha256;
    assertV596Formal(
      sample.sampleSha256 === canonicalShaV596Formal({
        version: V596_SOAK_WARMUP_SAMPLE_LINK_VERSION,
        entry: unsigned,
      }),
      `v596-soak-warmup-seal:${index}`,
    );
    previous = sample.sampleSha256;
    assertV596Formal(
      typeof sample.realmToken === "string" && sample.realmToken.length >= 8,
      `v596-soak-warmup-realm:${index}`,
    );
    assertKnownPositiveV596(sample.timeOrigin, `warmup:${index}:timeOrigin`);
    realmToken ??= sample.realmToken;
    timeOrigin ??= sample.timeOrigin;
    assertV596Formal(
      sample.realmToken === realmToken && sample.timeOrigin === timeOrigin,
      `v596-soak-warmup-realm-drift:${index}`,
    );
    validateV596Identity(sample.identity, identity, { deliveryTier: "standalone-full" });
    assertV596Formal(
      Number.isFinite(sample.capturedAtMs)
        && (previousCapturedAtMs === null || sample.capturedAtMs > previousCapturedAtMs),
      `v596-soak-warmup-time:${index}`,
    );
    previousCapturedAtMs = sample.capturedAtMs;
    assertHeap(sample.cdp?.runtimeHeap, `warmup:${index}`);
    for (const field of ["documents", "nodes", "jsEventListeners"]) {
      assertV596Formal(
        Number.isSafeInteger(sample.cdp?.domCounters?.[field])
          && sample.cdp.domCounters[field] >= 0,
        `v596-soak-warmup-dom:${index}:${field}`,
      );
    }
    assertEmptyErrors(sample.errors, `warmup:${index}`);
    if (phase === "baseline") {
      assertV596Formal(sample.observation === null, "v596-soak-warmup-baseline-observation");
      assertV596Formal(sample.teardown === null, "v596-soak-warmup-baseline-teardown");
    } else if (phase === "mounted" || phase === "profile-stable") {
      const fingerprint = assertMountedObservation(sample.observation, `warmup:${index}`);
      rendererFingerprint ??= fingerprint;
      assertV596Formal(
        fingerprint === rendererFingerprint,
        `v596-soak-warmup-renderer-fingerprint:${index}`,
      );
      assertV596Formal(sample.teardown === null, `v596-soak-warmup-mounted-teardown:${index}`);
    } else {
      assertReleasedObservation(sample.observation, `warmup:${index}`);
      assertTeardown(sample.teardown, {
        label: `warmup:${index}`,
        routeAfter: "/",
        observerReleased: null,
      });
    }
  }
  assertV596Formal(rendererFingerprint !== null, "v596-soak-warmup-renderer-fingerprint-missing");
  const mounted = samples.find((sample) => sample.phase === "mounted");
  const stable = samples.find((sample) => sample.phase === "profile-stable");
  assertV596Formal(
    mounted && stable
      && mounted.profileKey === stable.profileKey
      && RENDERER_COUNTERS.every((field) =>
        mounted.observation.renderer[field] === stable.observation.renderer[field]),
    "v596-soak-warmup-renderer-transition",
  );
  return Object.freeze({
    cycleCount: V596_SOAK_WARMUP_CYCLE_COUNT,
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
  assertV596Formal(
    Array.isArray(stage.samples) && stage.samples.length === aggregation.sampleCount,
    "v596-soak-sample-count",
  );
  let previous = null;
  let realmToken = null;
  let timeOrigin = null;
  let previousCapturedAtMs = null;
  let rendererFingerprint = null;
  const cyclePhases = new Map();
  for (const [index, sample] of stage.samples.entries()) {
    assertV596Formal(sample?.sequence === index, `v596-soak-sample-sequence:${index}`);
    assertV596Formal(
      sample.previousSampleSha256 === previous,
      `v596-soak-sample-replay:${index}`,
    );
    const unsigned = { ...sample };
    delete unsigned.sampleSha256;
    assertV596Formal(
      sample.sampleSha256 === canonicalShaV596Formal({
        version: V596_SOAK_SAMPLE_LINK_VERSION,
        entry: unsigned,
      }),
      `v596-soak-sample-seal:${index}`,
    );
    previous = sample.sampleSha256;
    const expectedCycleIndex = Math.floor(index / V596_SOAK_SAMPLES_PER_CYCLE);
    const expectedPhase = V596_SOAK_PHASES[index % V596_SOAK_SAMPLES_PER_CYCLE];
    assertV596Formal(
      sample.cycleIndex === expectedCycleIndex
        && expectedCycleIndex < aggregation.cycleCount,
      `v596-soak-cycle-index:${index}`,
    );
    assertV596Formal(
      sample.phase === expectedPhase,
      `v596-soak-phase-order:${index}`,
    );
    const expectedProfile = V596_SOAK_PROFILES[
      sample.cycleIndex % V596_SOAK_PROFILES.length
    ];
    assertV596Formal(
      sample.profileKey === expectedProfile.key,
      `v596-soak-profile:${index}`,
    );
    const phaseSet = cyclePhases.get(sample.cycleIndex) ?? new Set();
    assertV596Formal(!phaseSet.has(sample.phase), `v596-soak-phase-duplicate:${index}`);
    phaseSet.add(sample.phase);
    cyclePhases.set(sample.cycleIndex, phaseSet);
    assertV596Formal(
      typeof sample.realmToken === "string" && sample.realmToken.length >= 8,
      `v596-soak-realm:${index}`,
    );
    assertKnownPositiveV596(sample.timeOrigin, `soak:${index}:timeOrigin`);
    realmToken ??= sample.realmToken;
    timeOrigin ??= sample.timeOrigin;
    assertV596Formal(
      sample.realmToken === realmToken && sample.timeOrigin === timeOrigin,
      `v596-soak-realm-drift:${index}`,
    );
    validateV596Identity(sample.identity, identity, { deliveryTier: "standalone-full" });
    assertV596Formal(
      Number.isFinite(sample.capturedAtMs)
        && (previousCapturedAtMs === null || sample.capturedAtMs > previousCapturedAtMs),
      `v596-soak-sample-time:${index}`,
    );
    previousCapturedAtMs = sample.capturedAtMs;
    assertHeap(sample.cdp?.runtimeHeap, `sample:${index}`);
    for (const field of ["documents", "nodes", "jsEventListeners"]) {
      assertV596Formal(
        Number.isSafeInteger(sample.cdp?.domCounters?.[field])
          && sample.cdp.domCounters[field] >= 0,
        `v596-soak-dom:${index}:${field}`,
      );
    }
    assertEmptyErrors(sample.errors, `sample:${index}`);
    if (sample.phase === "baseline") {
      assertV596Formal(
        sample.observation === null,
        `v596-soak-baseline-observation:${index}`,
      );
      assertV596Formal(
        sample.teardown === null,
        `v596-soak-baseline-teardown:${index}`,
      );
    } else if (sample.phase === "mounted" || sample.phase === "profile-stable") {
      const fingerprint = assertMountedObservation(sample.observation, `sample:${index}`);
      rendererFingerprint ??= fingerprint;
      assertV596Formal(
        fingerprint === rendererFingerprint,
        `v596-soak-renderer-fingerprint-drift:${index}`,
      );
      assertV596Formal(
        sample.teardown === null,
        `v596-soak-mounted-teardown:${index}`,
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
  assertV596Formal(
    cyclePhases.size === aggregation.cycleCount
      && [...cyclePhases.values()].every((set) => set.size === 4),
    "v596-soak-cycle-phase-completeness",
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
  assertV596Formal(
    metrics && typeof metrics === "object" && !Array.isArray(metrics),
    "v596-soak-metrics-shape",
  );
  assertV596Formal(
    metrics.cycleCount === stage.aggregation.cycleCount
      && metrics.sampleCount === stage.aggregation.sampleCount
      && metrics.rendererFingerprintCount === 1
      && metrics.rendererResourcePolicy
        === "warmup-high-water-no-growth-exact-mounted-to-profile-stable-and-exact-detach-zero-v1"
      && metrics.rendererWarmupTransitionStable === true
      && metrics.rendererResourceWithinCycleStable === true
      && metrics.rendererResourceWarmupEnvelopeRespected === true
      && typeof metrics.rendererResourceGlobalExactStable === "boolean"
      && metrics.rendererResourceGrowth === false
      && metrics.rendererProfileStructuralCountersStable === true
      && metrics.registrySceneWithinCycleStable === true
      && metrics.canvasCountStable === true
      && metrics.rendererResourceWarmupEnvelope
      && RENDERER_COUNTERS.every((field) =>
        Number.isSafeInteger(metrics.rendererResourceWarmupEnvelope[field])
          && metrics.rendererResourceWarmupEnvelope[field] >= 0)
      && Array.isArray(metrics.rendererProfiles),
    "v596-soak-metrics-renderer",
  );
  const warmupMounted = stage.warmupSamples.filter((sample) =>
    sample.phase === "mounted" || sample.phase === "profile-stable");
  const expectedEnvelope = Object.fromEntries(RENDERER_COUNTERS.map((field) => [
    field,
    Math.max(...warmupMounted.map((sample) => sample.observation.renderer[field])),
  ]));
  assertV596Formal(
    sameCanonicalV596Formal(metrics.rendererResourceWarmupEnvelope, expectedEnvelope),
    "v596-soak-renderer-warmup-envelope",
  );
  const measuredRendererRows = stage.samples.filter((sample) =>
    sample.phase === "mounted" || sample.phase === "profile-stable");
  const measuredRendererVectors = measuredRendererRows.map((sample) =>
    RENDERER_COUNTERS.map((field) => sample.observation.renderer[field]));
  const expectedGlobalExactStable = measuredRendererVectors.every((vector) =>
    vector.every((value, index) => value === measuredRendererVectors[0][index]));
  assertV596Formal(
    metrics.rendererResourceGlobalExactStable === expectedGlobalExactStable,
    "v596-soak-renderer-global-exact-diagnostic",
  );
  for (let cycleIndex = 0; cycleIndex < stage.aggregation.cycleCount; cycleIndex += 1) {
    const cycle = stage.samples.filter((sample) => sample.cycleIndex === cycleIndex);
    const mounted = cycle.find((sample) => sample.phase === "mounted");
    const stable = cycle.find((sample) => sample.phase === "profile-stable");
    assertV596Formal(
      mounted && stable && mounted.profileKey === stable.profileKey
        && RENDERER_COUNTERS.every((field) =>
          mounted.observation.renderer[field] === stable.observation.renderer[field])
        && RENDERER_COUNTERS.every((field) =>
          mounted.observation.renderer[field] <= expectedEnvelope[field])
        && sameCanonicalV596Formal(
          mounted.observation.registry,
          stable.observation.registry,
        )
        && sameCanonicalV596Formal(
          mounted.observation.scene,
          stable.observation.scene,
        ),
      `v596-soak-renderer-cycle-envelope:${cycleIndex}`,
    );
  }
  const observedProfiles = V596_SOAK_PROFILES.filter((profile) =>
    stage.samples.some((sample) =>
      sample.phase === "mounted" && sample.profileKey === profile.key));
  assertV596Formal(
    metrics.rendererProfiles.length === observedProfiles.length,
    "v596-soak-renderer-profile-census-length",
  );
  for (const [index, profile] of observedProfiles.entries()) {
    const census = metrics.rendererProfiles[index];
    const profileRows = measuredRendererRows.filter((sample) =>
      sample.profileKey === profile.key);
    const expectedCycles = profileRows.filter((sample) =>
      sample.phase === "mounted").length;
    const expectedMinimum = Object.fromEntries(RENDERER_COUNTERS.map((field) => [
      field,
      Math.min(...profileRows.map((sample) => sample.observation.renderer[field])),
    ]));
    const expectedMaximum = Object.fromEntries(RENDERER_COUNTERS.map((field) => [
      field,
      Math.max(...profileRows.map((sample) => sample.observation.renderer[field])),
    ]));
    assertV596Formal(
      census?.profileKey === profile.key
        && census.cycleCount === expectedCycles
        && census.sampleCount === expectedCycles * 2
        && sameCanonicalV596Formal(census.minimum, expectedMinimum)
        && sameCanonicalV596Formal(census.maximum, expectedMaximum)
        && RENDERER_COUNTERS.every((field) =>
          expectedMaximum[field] <= expectedEnvelope[field]),
      `v596-soak-renderer-profile-census:${profile.key}`,
    );
  }
  const expectedProfileStructuralCountersStable = metrics.rendererProfiles.every((profile) =>
    ["geometries", "programs", "renderTargets"].every((field) =>
      profile.minimum[field] === profile.maximum[field]));
  assertV596Formal(
    metrics.rendererProfileStructuralCountersStable
      === expectedProfileStructuralCountersStable
      && expectedProfileStructuralCountersStable === true,
    "v596-soak-renderer-profile-structural-stability",
  );
  const warmup = stage.warmup;
  const measurementWindow = metrics.measurementWindow;
  assertV596Formal(
    warmup
      && warmup.version === V596_SOAK_WARMUP_CONTRACT_VERSION
      && warmup.cycleCount === V596_SOAK_WARMUP_CYCLE_COUNT
      && warmup.sampleCount === V596_SOAK_WARMUP_SAMPLE_COUNT
      && warmup.recordedSeparately === true
      && warmup.excludedFromFormalMetrics === true
      && warmup.baselineSource === "first-measured-baseline-after-warmup"
      && measurementWindow
      && measurementWindow.version === V596_SOAK_WARMUP_CONTRACT_VERSION
      && measurementWindow.warmupCycleCount === V596_SOAK_WARMUP_CYCLE_COUNT
      && measurementWindow.warmupSampleCount === V596_SOAK_WARMUP_SAMPLE_COUNT
      && measurementWindow.measuredCycleCount === stage.aggregation.cycleCount
      && measurementWindow.measuredSampleCount === stage.aggregation.sampleCount
      && measurementWindow.baselineSource === "first-measured-baseline-after-warmup"
      && measurementWindow.warmupExcludedFromFormalMetrics === true,
    "v596-soak-measurement-window",
  );
  const heap = metrics.heap;
  assertV596Formal(
    heap && typeof heap === "object" && !Array.isArray(heap),
    "v596-soak-metrics-heap",
  );
  for (const field of [
    "baselineUsedSizeBytes",
    "finalUsedSizeBytes",
    "allowanceBytes",
    "overallOlsBytesPerSample",
    "tailOlsBytesPerSample",
    "tailOlsMaximumBytesPerSample",
  ]) {
    assertV596Formal(
      typeof heap[field] === "number" && Number.isFinite(heap[field]),
      `v596-soak-heap-metric:${field}`,
    );
  }
  const measuredHeapUsedSizes = stage.samples.map((sample) =>
    sample.cdp.runtimeHeap.usedSize);
  const expectedTailSampleCount = Math.min(
    40,
    Math.max(4, Math.ceil(measuredHeapUsedSizes.length / 4)),
  );
  const expectedOverallOlsBytesPerSample = olsSlopeV596Formal(measuredHeapUsedSizes);
  const expectedTailOlsBytesPerSample = olsSlopeV596Formal(
    measuredHeapUsedSizes.slice(-expectedTailSampleCount),
  );
  assertV596Formal(
    heap.tailSampleCount === expectedTailSampleCount
      && heap.overallOlsBytesPerSample === expectedOverallOlsBytesPerSample
      && heap.tailOlsBytesPerSample === expectedTailOlsBytesPerSample,
    "v596-soak-heap-ols-recomputation",
  );
  assertV596Formal(
    heap.baselineUsedSizeBytes === samples.firstHeapUsedBytes
      && heap.finalUsedSizeBytes === samples.finalMeasuredHeapUsedBytes
      && heap.allowanceBytes === V596_SOAK_HEAP_ALLOWANCE_BYTES
      && heap.finalUsedSizeBytes <= heap.baselineUsedSizeBytes + heap.allowanceBytes
      && heap.tailOlsMaximumBytesPerSample
        === V596_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE
      && heap.tailOlsBytesPerSample <= heap.tailOlsMaximumBytesPerSample
      && heap.finalHeapWithinAllowance === true
      && heap.tailOlsWithinLimit === true
      && heap.sustainedGrowth === false
      && heap.telemetry === "chromium-cdp-runtime-getHeapUsage"
      && heap.garbageCollection === "HeapProfiler.collectGarbage",
    "v596-soak-heap-qualification",
  );
  assertV596Formal(
    metrics.rawHardGatesPassed === true
      && metrics.semanticFallbackApplied === false
      && metrics.syntheticHeapPassClaim === false,
    "v596-soak-no-synthetic-or-semantic-substitution",
  );
  return metrics;
}

export function validateV596SoakStage(stage, expectedIdentity, options = {}) {
  verifyV596FormalSeal(stage, "receiptSha256", "soak-stage");
  assertV596Formal(stage.version === V596_SOAK_STAGE_VERSION, "v596-soak-stage-version");
  assertV596Formal(stage.status === (options.syntheticFixture
    ? V596_SOAK_SYNTHETIC_STAGE_STATUS
    : V596_SOAK_STAGE_STATUS), "v596-soak-stage-status");
  assertV596EvidenceEnvelope(stage, options);
  assertV596Formal(
    stage.qualificationScope === (options.syntheticFixture
      ? "synthetic-test-only"
      : "formal-current-v596-cdp-renderer-heap-soak"),
    "v596-soak-qualification-scope",
  );
  assertV596Formal(
    stage.tooling?.runnerVersion === V596_SOAK_RUNNER_VERSION
      && stage.tooling?.auditorVersion === V596_SOAK_AUDITOR_VERSION,
    "v596-soak-tooling-version",
  );
  const identity = validateV596Identity(stage.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  const warmup = validateWarmupSampleSequence(stage, identity);
  assertV596Formal(
    stage.warmup?.version === V596_SOAK_WARMUP_CONTRACT_VERSION
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
    "v596-soak-warmup-contract",
  );
  const aggregation = validateShardAggregation(stage);
  assertV596Formal(
    aggregation.sampleCount === aggregation.cycleCount * V596_SOAK_SAMPLES_PER_CYCLE
      && (options.syntheticFixture
        ? aggregation.cycleCount > 0
        : aggregation.cycleCount >= V596_SOAK_MINIMUM_CYCLES),
    "v596-soak-formal-cycle-envelope",
  );
  assertV596Formal(
    stage.policy?.cycleCount === aggregation.cycleCount
      && stage.policy?.sampleCount === aggregation.sampleCount
      && stage.policy?.minimumFormalCycleCount === V596_SOAK_MINIMUM_CYCLES
      && stage.policy?.samplesPerCycle === V596_SOAK_SAMPLES_PER_CYCLE
      && stage.policy?.heapFinalAbsoluteAllowanceBytes
        === V596_SOAK_HEAP_ALLOWANCE_BYTES
      && stage.policy?.tailOlsMaximumBytesPerSample
        === V596_SOAK_TAIL_OLS_MAXIMUM_BYTES_PER_SAMPLE
      && stage.policy?.protocol === "chromium-cdp"
      && stage.policy?.heapCollection
        === "HeapProfiler.collectGarbage-before-Runtime.getHeapUsage"
      && stage.policy?.rendererResourcePolicy
        === "warmup-high-water-no-growth-exact-mounted-to-profile-stable-and-exact-detach-zero-v1"
      && stage.policy?.rendererResourceGlobalExactStabilityRequired === false
      && stage.policy?.rendererResourceWithinCycleExactStabilityRequired === true
      && stage.policy?.rendererResourceWarmupHighWaterNoGrowthRequired === true
      && stage.policy?.rendererResourceDetachedExactZeroRequired === true
      && stage.policy?.rendererResourcePerProfileStructuralExactStabilityRequired === true
      && stage.policy?.registrySceneWithinCycleExactStabilityRequired === true
      && stage.policy?.sourceIdentityExactStabilityRequired === true
      && stage.policy?.oneFinalClientRouteExitRequired === true
      && stage.policy?.preMeasurementWarmup?.version === V596_SOAK_WARMUP_CONTRACT_VERSION
      && stage.policy?.preMeasurementWarmup?.cycleCount === V596_SOAK_WARMUP_CYCLE_COUNT
      && stage.policy?.preMeasurementWarmup?.sampleCount === V596_SOAK_WARMUP_SAMPLE_COUNT
      && stage.policy?.preMeasurementWarmup?.recordedSeparately === true
      && stage.policy?.preMeasurementWarmup?.excludedFromFormalMetrics === true
      && stage.policy?.preMeasurementWarmup?.baselineSource
        === "first-measured-baseline-after-warmup",
    "v596-soak-policy",
  );
  const samples = validateSampleSequence(stage, identity, aggregation);
  assertV596Formal(
    samples.realmToken === warmup.realmToken
      && samples.timeOrigin === warmup.timeOrigin,
    "v596-soak-warmup-measured-realm-continuity",
  );
  const metrics = validateHeapMetrics(stage, samples);
  assertV596Formal(
    Array.isArray(stage.identitySnapshots) && stage.identitySnapshots.length >= 2,
    "v596-soak-identity-snapshots",
  );
  for (const [index, snapshot] of stage.identitySnapshots.entries()) {
    validateV596Identity(snapshot.identity, identity, { deliveryTier: "standalone-full" });
    assertV596Formal(
      snapshot.sourceDriftCount === 0
        && Array.isArray(snapshot.sourceDrifts)
        && snapshot.sourceDrifts.length === 0,
      `v596-soak-source-drift:${index}`,
    );
  }
  assertV596Formal(
    stage.identitySnapshots.every((snapshot) => sameCanonicalV596Formal(
      snapshot.identity,
      stage.identitySnapshots[0].identity,
    )),
    "v596-soak-identity-snapshot-drift",
  );
  assertReleasedObservation(stage.finalExit?.observation, "final-exit");
  const finalTeardown = assertTeardown(stage.finalExit?.teardown, {
    label: "final-exit",
    routeAfter: "/downloads",
    observerReleased: true,
  });
  assertV596Formal(
    stage.finalExit?.pathname === "/downloads"
      && stage.finalExit?.transition === "next-link-route-exit"
      && stage.finalExit?.observedAfterPhase === "exited"
      && stage.finalExit?.snapshotReuseWitness === true
      && sameCanonicalV596Formal(
        stage.finalExit?.releaseCompletion?.teardown,
        finalTeardown,
      )
      && stage.finalExit?.releaseCompletion?.transition === "next-link-route-exit"
      && stage.finalExit?.releaseCompletion?.observedAfterPhase === "exited",
    "v596-soak-final-exit-contract",
  );
  assertEmptyErrors(stage.errors, "stage");
  assertV596Authority(stage.authority, "soak-stage");
  return Object.freeze({
    identity,
    warmup,
    ...aggregation,
    rendererFingerprint: samples.rendererFingerprint,
    metrics,
  });
}

export async function buildV596SoakReceipt({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  outputPath = "docs/release/v596/soak-v596.json",
  syntheticFixture = false,
  bundle = null,
} = {}) {
  assertV596Formal(stagePath, "v596-soak-stage-required");
  const current = bundle ?? await loadCurrentV596Bundle(root, { requireBuilds: true });
  const stage = (await readJsonV596Formal(current.workspace, stagePath, "soak-stage")).value;
  const validated = validateV596SoakStage(
    stage,
    current.identities.standalone,
    { syntheticFixture },
  );
  const unsigned = {
    version: V596_SOAK_RECEIPT_VERSION,
    generatedAt: stage.completedAt ?? stage.generatedAt,
    status: syntheticFixture ? V596_SOAK_SYNTHETIC_RECEIPT_STATUS : V596_SOAK_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: await fileReceiptV596Formal(current.workspace, stagePath, "soak-stage"),
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
    releaseContractVersion: V596_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
    tooling: { ...stage.tooling },
    authority: { ...current.candidate.authority },
    synthetic: syntheticFixture,
  };
  assertV596Authority(unsigned.authority, "soak-receipt");
  const receipt = sealV596FormalDocument(unsigned);
  if (!syntheticFixture) {
    await atomicWriteJsonV596Formal(
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
    else throw new Error(`v596-soak-argument:${token}`);
  }
  assertV596Formal(values.stage, "v596-soak-stage-required");
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await buildV596SoakReceipt({
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
