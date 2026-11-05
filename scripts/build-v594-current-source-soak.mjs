import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV594,
  assertKnownPositiveV594,
  assertV594,
  atomicWriteJsonV594,
  canonicalShaV594Closure,
  fileReceiptV594,
  loadCurrentV594Bundle,
  readJsonV594,
  resolveInsideV594Workspace,
  resolveV594OutputRoot,
  sealV594Document,
  sameCanonicalV594,
  validateV594Identity,
  V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
  verifyV594Seal,
} from "./build-v594-current-source-lifecycle.mjs";
import {
  V594_CDP_SOAK_AUDIT_VERSION,
  V594_CDP_SOAK_RUNNER_VERSION,
  V594_CDP_SOAK_SAMPLE_LINK_VERSION,
  V594_CDP_SOAK_STAGE_VERSION,
  auditV594CdpRendererSoak,
  canonicalShaV594CdpSoak,
  validateV594CdpInitialDocumentNetwork,
} from "../tmp/audit-v594-cdp-renderer-soak.mjs";
import {
  verifyV594ReleasedHeapSemanticEvidence,
} from "../tmp/v594-released-heap-semantic-contract.mjs";

export const V594_SOAK_STAGE_VERSION = V594_CDP_SOAK_STAGE_VERSION;
export const V594_SOAK_STAGE_STATUS =
  "staging-v594-cdp-renderer-heap-soak-passed-not-promoted";
export const V594_SOAK_RECEIPT_VERSION = "v594-current-source-soak-v5";
export const V594_SOAK_RECEIPT_STATUS =
  "passed-current-v594-40-cycle-161-sample-cdp-renderer-heap-final-exit-and-conditional-semantic-proof";
export const V594_SOAK_RUNNER_VERSION = V594_CDP_SOAK_RUNNER_VERSION;
export const V594_SOAK_AUDITOR_VERSION = V594_CDP_SOAK_AUDIT_VERSION;
export const V594_SOAK_PROFILE_KEYS = Object.freeze([
  "hot-radiative",
  "blue-supergiant-wind",
  "solar-like-convective",
  "cool-convective",
  "red-giant-supergiant",
  "warm-radiative-convective",
  "rapid-rotator-gravity-darkened",
  "relativity-workbench",
]);
export const V594_SOAK_PHASES = Object.freeze([
  "baseline",
  "mounted",
  "profile-stable",
  "detached-stable",
]);
export const V594_SOAK_WARMUP_CYCLES = 16;
export const V594_SOAK_MEASURED_CYCLES = 24;
export const V594_SOAK_CYCLES = 40;
export const V594_SOAK_SAMPLES = 161;

export function validateV594SoakSemanticClosureContract(soak) {
  assertV594(soak && typeof soak === "object" && !Array.isArray(soak),
    "v594-soak-semantic-contract-shape");
  const qualification = soak.heapQualification;
  assertV594(qualification && typeof qualification === "object"
    && !Array.isArray(qualification), "v594-soak-semantic-qualification-shape");
  assertV594(qualification.rawHardGatesPassed === true,
    "v594-soak-semantic-raw-hard-gates");
  assertV594(typeof qualification.semanticProofRequired === "boolean",
    "v594-soak-semantic-required-boolean");
  const semanticProofRequired = qualification.semanticProofRequired;
  assertV594(qualification.rawMonotonicWarning === semanticProofRequired,
    "v594-soak-semantic-monotonic-binding");
  assertV594(Array.isArray(soak.warnings), "v594-soak-semantic-warnings-shape");
  assertV594(soak.warnings.includes("heap:monotonic-growth") === semanticProofRequired,
    "v594-soak-semantic-warning-binding");

  const semanticProofPresent = soak.semanticEvidence !== null
    && soak.semanticEvidence !== undefined;
  assertV594(semanticProofPresent === semanticProofRequired,
    semanticProofRequired
      ? "v594-soak-semantic-evidence-required"
      : "v594-soak-semantic-evidence-unexpected");

  if (semanticProofRequired) {
    assertV594(qualification.semanticProofProvided === true
      && qualification.semanticFallbackApplied === true
      && qualification.status
        === "passed-released-baseline-semantic-fallback-with-raw-monotonic-warning",
    "v594-soak-semantic-fallback-qualification");
    assertV594(typeof soak.semanticEvidence?.path === "string"
      && soak.semanticEvidence.path.length > 0,
    "v594-soak-semantic-evidence-path");
    assertV594(typeof soak.semanticStageReceiptSha256 === "string"
      && /^[0-9a-f]{64}$/.test(soak.semanticStageReceiptSha256),
    "v594-soak-semantic-stage-receipt");
    assertV594(qualification.semanticReceiptSha256 === soak.semanticStageReceiptSha256,
      "v594-soak-semantic-qualification-receipt-binding");
    assertV594(soak.semanticVerification?.passed === true
      && soak.semanticVerification.receiptSha256 === soak.semanticStageReceiptSha256,
    "v594-soak-semantic-verification-binding");
  } else {
    assertV594(qualification.semanticProofProvided === false
      && qualification.semanticFallbackApplied === false
      && qualification.semanticReceiptSha256 === null
      && qualification.status === "passed-raw-heap-no-monotonic-warning",
    "v594-soak-raw-only-qualification");
    assertV594(soak.semanticEvidence === null
      && soak.semanticStageReceiptSha256 === null
      && soak.semanticVerification === null,
    "v594-soak-raw-only-null-semantics");
  }

  return Object.freeze({
    semanticProofRequired,
    semanticProofPresent,
    semanticProofSatisfied: semanticProofRequired ? true : null,
    rawHeapQualificationSatisfied: true,
    mode: semanticProofRequired ? "semantic-fallback" : "raw-only",
  });
}

const SOAK_INITIAL_PATHNAME = "/";
const SOAK_EXIT_PATHNAME = "/downloads";
const SOAK_INITIAL_QUERY = Object.freeze({
  lifecycleAudit: "v594-same-realm-v2",
  v594ExactAb: "1",
  v594CdpSoak: "1",
});
const SOAK_SESSION_NONCE = /^v594-session-[0-9a-f-]{36}$/;
const SOAK_TARGET_ID = /^[A-Za-z0-9._:-]{8,256}$/;

function parseSoakUrl(value, label) {
  assertV594(typeof value === "string" && value.length > 0,
    `v594-soak-url-missing:${label}`);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`v594-soak-url-invalid:${label}`);
  }
  assertV594(new Set(["http:", "https:"]).has(url.protocol)
    && !url.username && !url.password && !url.hash,
  `v594-soak-url-authority:${label}`);
  // The runner records URL.href. Reject alternate textual spellings so a
  // stage cannot hide query/path drift behind URL normalization.
  assertV594(url.href === value, `v594-soak-url-noncanonical:${label}`);
  return url;
}

function assertExactInitialSoakUrl(value, expectedOrigin, label) {
  const url = parseSoakUrl(value, label);
  assertV594(url.origin === expectedOrigin, `v594-soak-url-origin:${label}`);
  assertV594(url.pathname === SOAK_INITIAL_PATHNAME,
    `v594-soak-url-path:${label}`);
  const entries = [...url.searchParams.entries()];
  const expectedKeys = Object.keys(SOAK_INITIAL_QUERY);
  assertV594(entries.length === expectedKeys.length
    && new Set(entries.map(([key]) => key)).size === expectedKeys.length
    && entries.every(([key, entryValue]) => SOAK_INITIAL_QUERY[key] === entryValue),
  `v594-soak-url-query:${label}`);
  return url.href;
}

function assertExactExitUrl(value, expectedOrigin, label) {
  const url = parseSoakUrl(value, label);
  assertV594(url.origin === expectedOrigin && url.pathname === SOAK_EXIT_PATHNAME
    && url.search === "" && url.hash === "",
  `v594-soak-url-exit:${label}`);
  return url.href;
}

function parseNetworkOrigin(value) {
  assertV594(typeof value === "string" && value.length > 0,
    "v594-soak-network-origin-missing");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("v594-soak-network-origin-invalid");
  }
  assertV594(new Set(["http:", "https:"]).has(url.protocol)
    && !url.username && !url.password && !url.hash
    && url.pathname === "/" && url.search === "",
  "v594-soak-network-origin-shape");
  return url.origin;
}

function assertSoakSessionIdentity(session, label = "cdp-session") {
  assertV594(session && typeof session === "object" && !Array.isArray(session),
    `v594-soak-session-shape:${label}`);
  assertV594(SOAK_SESSION_NONCE.test(session.sessionNonce ?? ""),
    `v594-soak-session-nonce:${label}`);
  assertV594(SOAK_TARGET_ID.test(session.targetId ?? ""),
    `v594-soak-session-target:${label}`);
  assertV594(session.targetType === "page", `v594-soak-session-target-type:${label}`);
  assertV594(typeof session.browserContextId === "string"
    && session.browserContextId.length > 0,
  `v594-soak-session-context:${label}`);
}

/**
 * Validate the URL and CDP target continuity contract independently of the
 * heap/resource gates. This is intentionally strict: every pre-exit sample
 * must remain on the exact initial soak URL, while only the final sample may
 * transition to the same-origin /downloads URL.
 */
export function validateV594SoakUrlContinuity(stage) {
  assertV594(stage && typeof stage === "object" && !Array.isArray(stage),
    "v594-soak-url-stage-shape");
  const networkOrigin = parseNetworkOrigin(stage.network?.origin);
  const session = stage.cdpSession;
  assertSoakSessionIdentity(session);
  const initial = assertExactInitialSoakUrl(
    session.initialSoakUrl,
    networkOrigin,
    "cdp-session.initialSoakUrl",
  );
  assertV594(session.url === initial, "v594-soak-session-url-drift");
  assertV594(session.initialSoakUrl === initial, "v594-soak-session-initial-url-drift");
  const exit = new URL(SOAK_EXIT_PATHNAME, initial).href;
  assertV594(Array.isArray(stage.samples) && stage.samples.length === V594_SOAK_SAMPLES,
    "v594-soak-url-sample-count");

  for (const [index, sample] of stage.samples.entries()) {
    const isFinal = index === V594_SOAK_SAMPLES - 1;
    const expected = isFinal ? exit : initial;
    const label = `sample:${index}`;
    assertV594(sample && typeof sample === "object", `v594-soak-url-sample-shape:${label}`);
    if (isFinal) assertExactExitUrl(sample.url, networkOrigin, label);
    assertV594(sample.url === expected, `v594-soak-url-sample-url:${label}`);
    assertV594(sample.initialSoakUrl === initial,
      `v594-soak-url-sample-initial:${label}`);
    assertV594(sample.sessionNonce === session.sessionNonce
      && sample.targetId === session.targetId
      && sample.targetType === session.targetType
      && sample.browserContextId === session.browserContextId,
    `v594-soak-url-sample-session-binding:${label}`);
    const cdp = sample.cdp;
    assertV594(cdp && typeof cdp === "object" && !Array.isArray(cdp),
      `v594-soak-url-cdp-shape:${label}`);
    assertV594(cdp.initialSoakUrl === initial,
      `v594-soak-url-cdp-initial:${label}`);
    assertV594(cdp.currentUrl === expected,
      `v594-soak-url-cdp-current:${label}`);
    const binding = cdp.sessionBinding;
    assertV594(binding && typeof binding === "object" && !Array.isArray(binding),
      `v594-soak-url-cdp-binding-shape:${label}`);
    assertV594(binding.sessionNonce === session.sessionNonce
      && binding.targetId === session.targetId
      && binding.targetType === session.targetType
      && binding.browserContextId === session.browserContextId,
    `v594-soak-url-cdp-binding-identity:${label}`);
    assertV594(binding.initialSoakUrl === initial && binding.url === expected,
      `v594-soak-url-cdp-binding-url:${label}`);
  }

  const initialDocumentErrors = validateV594CdpInitialDocumentNetwork(
    stage.network?.entries,
    initial,
  );
  assertV594(initialDocumentErrors.length === 0,
    `v594-soak-initial-document-policy:${initialDocumentErrors.join("|")}`);
  return Object.freeze({ initialSoakUrl: initial, exitUrl: exit, origin: networkOrigin });
}

function sampleSnapshot(sample) {
  return sample?.app?.snapshot ?? sample?.snapshot ?? null;
}

function assertObservableZeroSample(sample, label) {
  const snapshot = sampleSnapshot(sample);
  assertV594(snapshot && typeof snapshot === "object", `v594-soak-snapshot:${label}`);
  for (const [value, field] of [
    [sample?.dom?.canvasCount, "dom.canvasCount"],
    [sample?.dom?.connectedCanvasCount, "dom.connectedCanvasCount"],
    [sample?.dom?.candidateElementCount, "dom.candidateElementCount"],
    [snapshot.canvas?.count, "canvas.count"],
    [snapshot.canvas?.connected, "canvas.connected"],
    [snapshot.renderer?.active, "renderer.active"],
    [snapshot.renderer?.renderTargets, "renderer.renderTargets"],
    [snapshot.registry?.total, "registry.total"],
    [snapshot.registry?.workers, "registry.workers"],
    [snapshot.registry?.renderTargets, "registry.renderTargets"],
    [snapshot.registry?.textures, "registry.textures"],
    [snapshot.registry?.subscriptions, "registry.subscriptions"],
    [snapshot.registry?.typedArrays, "registry.typedArrays"],
    [snapshot.registry?.estimatedBytes, "registry.estimatedBytes"],
    [snapshot.scene?.active, "scene.active"],
    [snapshot.scene?.objects, "scene.objects"],
    [snapshot.scene?.candidateNodes, "scene.candidateNodes"],
  ]) assertKnownFiniteZeroV594(value, `soak:${label}:${field}`);
  assertV594(snapshot.captureKind === "unmounted-renderer",
    `v594-soak-snapshot-kind:${label}`);
  assertV594(snapshot.renderer?.textures === null
    && snapshot.renderer?.geometries === null
    && snapshot.renderer?.programs === null
    && snapshot.renderer?.resourceCountsSource === "unavailable-context-lost-stale-info",
  `v594-soak-renderer-counters-after-context-loss:${label}`);
  assertV594(snapshot.renderer?.renderTargetsSource === "atlas-resource-registry.gpuRenderTargets"
    && snapshot.renderer?.renderTargets === snapshot.registry?.renderTargets,
  `v594-soak-render-target-source:${label}`);
}

const V594_SOAK_CONTEXT_LOSS_SOURCES = new Set([
  "webglcontextlost-event",
  "isContextLost",
]);

// These are the serialized browser-owned teardown and release-completion
// contracts.  Keep the key sets closed so an older, partially compatible
// observation cannot pass merely because its known fields happen to match.
const V594_SOAK_TEARDOWN_KEYS = Object.freeze([
  "canvasDetached",
  "contextLost",
  "contextLossSource",
  "forceContextLossCalled",
  "observerReleased",
  "renderListsDisposed",
  "resourceReferencesReleased",
  "routeAfter",
].sort());
const V594_SOAK_RELEASE_COMPLETION_KEYS = Object.freeze([
  "observedAfterPhase",
  "teardown",
  "transition",
].sort());

function hasExactSoakKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value)
    && sameCanonicalV594(Object.keys(value).sort(), keys);
}

function assertSoakReleaseTeardown(teardown, {
  label,
  routeAfter,
}) {
  assertV594(hasExactSoakKeys(teardown, V594_SOAK_TEARDOWN_KEYS),
    `v594-soak-release-teardown-keys:${label}`);
  assertV594(teardown.renderListsDisposed === true,
    `v594-soak-release-teardown-render-lists:${label}`);
  assertV594(teardown.forceContextLossCalled === true,
    `v594-soak-release-teardown-force-context-loss:${label}`);
  assertV594(teardown.contextLost === true,
    `v594-soak-release-teardown-context-lost:${label}`);
  assertV594(V594_SOAK_CONTEXT_LOSS_SOURCES.has(teardown.contextLossSource),
    `v594-soak-release-teardown-context-loss-source:${label}`);
  assertV594(teardown.canvasDetached === true,
    `v594-soak-release-teardown-canvas-detached:${label}`);
  assertV594(teardown.resourceReferencesReleased === true,
    `v594-soak-release-teardown-renderer-references-released:${label}`);
  assertV594(teardown.routeAfter === routeAfter,
    `v594-soak-release-teardown-route:${label}`);
  assertV594(teardown.observerReleased === true,
    `v594-soak-release-teardown-observer-release:${label}`);
  return teardown;
}

function assertSoakReleaseCompletion(completion, {
  label,
  transition,
  observedAfterPhase,
  routeAfter,
}) {
  assertV594(hasExactSoakKeys(completion, V594_SOAK_RELEASE_COMPLETION_KEYS),
    `v594-soak-release-completion-keys:${label}`);
  assertV594(completion.transition === transition,
    `v594-soak-release-completion-transition:${label}`);
  assertV594(completion.observedAfterPhase === observedAfterPhase,
    `v594-soak-release-completion-phase:${label}`);
  assertSoakReleaseTeardown(completion.teardown, { label: `${label}:teardown`, routeAfter });
  return completion;
}

function assertSoakTeardown(sample, {
  label,
  assignment,
  routeAfter,
  observerReleased = null,
}) {
  const teardown = sample?.app?.teardown;
  assertV594(Number.isInteger(sample?.app?.teardownAssignment)
    && sample.app.teardownAssignment === assignment,
  `v594-soak-teardown-assignment:${label}`);
  assertV594(teardown && typeof teardown === "object" && !Array.isArray(teardown),
    `v594-soak-teardown-shape:${label}`);
  assertV594(hasExactSoakKeys(teardown, V594_SOAK_TEARDOWN_KEYS),
    `v594-soak-teardown-keys:${label}`);
  assertV594(teardown.renderListsDisposed === true,
    `v594-soak-teardown-render-lists:${label}`);
  assertV594(teardown.forceContextLossCalled === true,
    `v594-soak-teardown-force-context-loss:${label}`);
  assertV594(teardown.contextLost === true,
    `v594-soak-teardown-context-lost:${label}`);
  assertV594(V594_SOAK_CONTEXT_LOSS_SOURCES.has(teardown.contextLossSource),
    `v594-soak-teardown-context-loss-source:${label}`);
  assertV594(teardown.canvasDetached === true,
    `v594-soak-teardown-canvas-detached:${label}`);
  assertV594(teardown.resourceReferencesReleased === true,
    `v594-soak-teardown-renderer-references-released:${label}`);
  assertV594(teardown.routeAfter === routeAfter,
    `v594-soak-teardown-route:${label}`);
  assertV594(teardown.observerReleased === observerReleased,
    `v594-soak-teardown-observer-release:${label}`);
  return teardown;
}

function assertSoakTeardownCommon(left, right, label) {
  // The detached-stable sample intentionally captures the live pre-release
  // state (`routeAfter:"/"`, `observerReleased:null`), while the later
  // release completion carries the same renderer facts after the observer is
  // released and the route may be `/downloads`.  Bind only the fields that
  // describe the renderer ownership cut; never overwrite or equate the two
  // temporal observations wholesale.
  for (const field of [
    "renderListsDisposed",
    "forceContextLossCalled",
    "contextLost",
    "contextLossSource",
    "canvasDetached",
    "resourceReferencesReleased",
  ]) {
    assertV594(left?.[field] === right?.[field],
      `v594-soak-teardown-binding:${label}:${field}`);
  }
}

function verifySampleSeal(sample, previous, label) {
  assertV594(sample.previousSampleSha256 === previous, `v594-soak-sample-replay:${label}`);
  const unsigned = { ...sample };
  delete unsigned.sampleSha256;
  assertV594(
    sample.sampleSha256 === canonicalShaV594Closure({
      version: V594_CDP_SOAK_SAMPLE_LINK_VERSION,
      entry: unsigned,
    }),
    `v594-soak-sample-seal:${label}`,
  );
}

export function validateV594SoakStage(stage, expectedIdentity, options = {}) {
  verifyV594Seal(stage, "receiptSha256", "soak-stage");
  assertV594(stage.version === V594_SOAK_STAGE_VERSION, "v594-soak-stage-version");
  assertV594(stage.status === V594_SOAK_STAGE_STATUS, "v594-soak-stage-status");
  assertV594(stage.formalEvidence === true, "v594-soak-formal-evidence");
  assertV594(stage.evidenceClaim === true, "v594-soak-evidence-claim");
  assertV594(stage.syntheticZeroClaim === false, "v594-soak-synthetic-zero");
  assertV594(stage.promotion === "none", "v594-soak-promotion");
  assertV594(
    stage.qualificationScope === "formal-current-v594-cdp-renderer-heap-soak",
    "v594-soak-qualification-scope",
  );
  assertV594(stage.tooling?.runnerVersion === V594_SOAK_RUNNER_VERSION,
    "v594-soak-runner-version");
  assertV594(stage.tooling?.auditorVersion === V594_SOAK_AUDITOR_VERSION,
    "v594-soak-auditor-version");
  if (options.syntheticFixture) {
    assertV594(stage.fixture?.synthetic === true, "v594-soak-fixture-marker");
  } else {
    assertV594(stage.fixture?.synthetic !== true, "v594-soak-synthetic-as-formal");
  }
  const identity = validateV594Identity(stage.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertV594(stage.policy?.warmupCycles === V594_SOAK_WARMUP_CYCLES,
    "v594-soak-warmup-cycles");
  assertV594(stage.policy?.measuredCycles === V594_SOAK_MEASURED_CYCLES,
    "v594-soak-measured-cycles");
  assertV594(
    Array.isArray(stage.policy?.warmupProfiles)
      && stage.policy.warmupProfiles.map((row) => row.key).join("|")
        === V594_SOAK_PROFILE_KEYS.join("|"),
    "v594-soak-profile-order",
  );
  assertV594(
    stage.policy?.navigationPolicy
      === "one-initial-document-load-one-final-next-link-exit-no-intermediate-navigation",
    "v594-soak-navigation-policy",
  );
  assertV594(Array.isArray(stage.samples) && stage.samples.length === V594_SOAK_SAMPLES,
    "v594-soak-sample-count");
  validateV594SoakUrlContinuity(stage);
  let previous = null;
  let realmToken = null;
  let timeOrigin = null;
  for (let cycle = 0; cycle < V594_SOAK_CYCLES; cycle += 1) {
    const expectedKind = cycle < V594_SOAK_WARMUP_CYCLES ? "warmup" : "measured";
    const relativeCycle = cycle < V594_SOAK_WARMUP_CYCLES
      ? cycle
      : cycle - V594_SOAK_WARMUP_CYCLES;
    const expectedProfile = V594_SOAK_PROFILE_KEYS[relativeCycle % V594_SOAK_PROFILE_KEYS.length];
    const expectedRound = Math.floor(relativeCycle / V594_SOAK_PROFILE_KEYS.length);
    for (const [phaseIndex, phase] of V594_SOAK_PHASES.entries()) {
      const sequence = cycle * V594_SOAK_PHASES.length + phaseIndex;
      const sample = stage.samples[sequence];
      assertV594(sample?.sequence === sequence && sample?.cycleIndex === cycle,
        `v594-soak-sample-order:${sequence}`);
      assertV594(sample.cycleKind === expectedKind && sample.phase === phase,
        `v594-soak-sample-phase:${sequence}`);
      assertV594(sample.profileKey === expectedProfile && sample.profileRound === expectedRound,
        `v594-soak-sample-profile:${sequence}`);
      verifySampleSeal(sample, previous, sequence);
      previous = sample.sampleSha256;
      assertKnownPositiveV594(sample.timeOrigin, `soak:${sequence}:timeOrigin`);
      assertV594(typeof sample.realmToken === "string" && sample.realmToken.length >= 8,
        `v594-soak-realm:${sequence}`);
      realmToken ??= sample.realmToken;
      timeOrigin ??= sample.timeOrigin;
      assertV594(sample.realmToken === realmToken && sample.timeOrigin === timeOrigin,
        `v594-soak-realm-drift:${sequence}`);
      validateV594Identity(sample.identity, identity, { deliveryTier: "standalone-full" });
      assertKnownPositiveV594(sample.cdp?.runtimeHeap?.usedSize,
        `soak:${sequence}:cdp.runtimeHeap.usedSize`);
      assertV594(Number.isInteger(sample.cdp?.domCounters?.documents)
        && sample.cdp.domCounters.documents >= 0, `v594-soak-dom-documents:${sequence}`);
      assertV594(Number.isInteger(sample.cdp?.domCounters?.nodes)
        && sample.cdp.domCounters.nodes >= 0, `v594-soak-dom-nodes:${sequence}`);
      assertV594(Number.isInteger(sample.cdp?.domCounters?.jsEventListeners)
        && sample.cdp.domCounters.jsEventListeners >= 0,
      `v594-soak-dom-listeners:${sequence}`);
      if (cycle === 0) {
        assertV594(sample.app?.releaseCompletion === null,
          `v594-soak-release-completion-initial:${sequence}`);
      } else {
        assertSoakReleaseCompletion(sample.app?.releaseCompletion, {
          label: `repeat:${cycle}:${phase}`,
          transition: "same-realm-repeat",
          observedAfterPhase: "baseline",
          routeAfter: "/",
        });
      }
      if (phase === "detached-stable") {
        assertObservableZeroSample(sample, `detached:${cycle}`);
        assertSoakTeardown(sample, {
          label: `detached:${cycle}`,
          assignment: cycle + 1,
          routeAfter: "/",
        });
      }
    }
  }
  const exited = stage.samples[V594_SOAK_SAMPLES - 1];
  assertV594(exited?.sequence === V594_SOAK_SAMPLES - 1 && exited?.phase === "exited",
    "v594-soak-final-exit-order");
  verifySampleSeal(exited, previous, "exited");
  assertV594(exited.realmToken === realmToken && exited.timeOrigin === timeOrigin,
    "v594-soak-final-realm-drift");
  assertV594(exited.pathname === "/downloads", "v594-soak-final-route");
  assertObservableZeroSample(exited, "exited");
  const finalDetached = stage.samples[V594_SOAK_SAMPLES - 2];
  const detachedTeardown = assertSoakTeardown(finalDetached, {
    label: "final-detached",
    assignment: V594_SOAK_CYCLES,
    routeAfter: "/",
  });
  const exit = exited.app?.exit ?? exited.exit;
  assertV594(exit && typeof exit === "object" && !Array.isArray(exit),
    "v594-soak-final-exit-shape");
  assertV594(Number.isInteger(exited.app?.teardownAssignment)
    && exited.app.teardownAssignment === V594_SOAK_CYCLES,
  "v594-soak-final-exit-assignment");
  assertV594(exit.renderListsDisposed === true
    && exit.forceContextLossCalled === true
    && exit.contextLost === true
    && V594_SOAK_CONTEXT_LOSS_SOURCES.has(exit.contextLossSource)
    && exit.canvasDetached === true
    && exit.resourceReferencesReleased === true
    && exit.routeAfter === "/downloads"
    && exit.observerReleased === true,
  "v594-soak-final-exit-contract");
  assertSoakReleaseCompletion(exited.app?.releaseCompletion, {
    label: "final-exit",
    transition: "next-link-route-exit",
    observedAfterPhase: "exited",
    routeAfter: "/downloads",
  });
  assertV594(sameCanonicalV594(exited.app.releaseCompletion.teardown, exit),
    "v594-soak-final-release-completion-exit-binding");
  assertV594(exited.app?.snapshotReuseWitness === true,
    "v594-soak-final-snapshot-reuse-witness");
  assertV594(exited.app?.detachedSnapshot
    && sameCanonicalV594(exited.app.detachedSnapshot, exited.app.snapshot),
    "v594-soak-final-detached-exited-snapshot-binding");
  assertSoakTeardownCommon(detachedTeardown, exit, "final-detached-exit");
  verifyV594Seal(stage.thresholdBinding, "thresholdSha256", "soak-threshold");
  assertV594(
    stage.thresholdBinding.policyVersion
      === "v594-cdp-soak-source-frozen-threshold-policy-v2",
    "v594-soak-threshold-policy",
  );
  assertV594(stage.metrics?.cycleCount === V594_SOAK_CYCLES,
    "v594-soak-metrics-cycle-count");
  assertV594(stage.metrics?.sampleCount === V594_SOAK_SAMPLES,
    "v594-soak-metrics-sample-count");
  const audit = auditV594CdpRendererSoak(stage, {
    allowSyntheticFormalFixture: options.syntheticFixture === true,
    semanticEvidence: options.semanticEvidence ?? null,
  });
  assertV594(audit.passed, `v594-soak-audit:${audit.errors.join("|")}`);
  assertV594(sameCanonicalV594(audit.metrics, stage.metrics),
    "v594-soak-metrics-audit-binding");
  const monotonicWarning = stage.metrics?.heap?.monotonicNonDecreasingGrowth === true;
  assertV594(stage.metrics?.heap?.sustainedGrowth === monotonicWarning,
    "v594-soak-heap-growth-semantics");
  assertV594(monotonicWarning
    ? audit.heapQualification?.semanticFallbackApplied === true
    : audit.heapQualification?.semanticProofRequired === false,
  "v594-soak-heap-qualification");
  for (const field of ["consoleErrors", "pageErrors", "unhandledRejections"]) {
    assertV594(Array.isArray(stage.errors?.[field]) && stage.errors[field].length === 0,
      `v594-soak-errors:${field}`);
  }
  return Object.freeze({
    identity,
    cycleCount: V594_SOAK_CYCLES,
    sampleCount: V594_SOAK_SAMPLES,
    thresholdSha256: stage.thresholdBinding.thresholdSha256,
    metrics: stage.metrics,
    warnings: audit.warnings,
    heapQualification: audit.heapQualification,
  });
}

export async function buildV594SoakReceipt({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  semanticStagePath = null,
  outputPath = "docs/release/v594/soak-v594.json",
  syntheticFixture = false,
} = {}) {
  assertV594(stagePath, "v594-soak-stage-required");
  const bundle = await loadCurrentV594Bundle(root, { requireBuilds: true });
  const absolute = resolveInsideV594Workspace(bundle.workspace, stagePath, "soak-stage");
  const stage = (await readJsonV594(absolute, "soak-stage")).value;
  const semanticEvidence = semanticStagePath
    ? (await readJsonV594(
      resolveInsideV594Workspace(bundle.workspace, semanticStagePath, "soak-semantic-stage"),
      "soak-semantic-stage",
    )).value
    : null;
  const validated = validateV594SoakStage(stage, bundle.identities.standalone, {
    syntheticFixture,
    semanticEvidence,
  });
  const semanticRequired = validated.heapQualification?.semanticProofRequired === true;
  assertV594(semanticRequired === (semanticEvidence !== null),
    semanticRequired
      ? "v594-soak-semantic-stage-required"
      : "v594-soak-semantic-stage-unexpected");
  const rawMetricsSha256 = canonicalShaV594CdpSoak(stage.metrics);
  const semanticVerification = semanticEvidence
    ? await verifyV594ReleasedHeapSemanticEvidence({
      root: bundle.workspace,
      evidence: semanticEvidence,
      expectedIdentity: validated.identity,
      expectedSoakStageReceiptSha256: stage.receiptSha256,
      expectedRawMetricsSha256: rawMetricsSha256,
    })
    : null;
  const unsigned = {
    version: V594_SOAK_RECEIPT_VERSION,
    generatedAt: stage.completedAt ?? stage.generatedAt ?? bundle.source.generatedAt,
    status: V594_SOAK_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: await fileReceiptV594(bundle.workspace, stagePath, "soak-stage"),
    stageReceiptSha256: stage.receiptSha256,
    cycleCount: validated.cycleCount,
    sampleCount: validated.sampleCount,
    thresholdSha256: validated.thresholdSha256,
    metrics: validated.metrics,
    rawMetricsSha256,
    warnings: validated.warnings,
    heapQualification: validated.heapQualification,
    semanticEvidence: semanticStagePath
      ? await fileReceiptV594(bundle.workspace, semanticStagePath, "soak-semantic-stage")
      : null,
    semanticStageReceiptSha256: semanticEvidence?.receiptSha256 ?? null,
    semanticVerification: semanticVerification
      ? {
        passed: semanticVerification.passed,
        receiptSha256: semanticVerification.receiptSha256,
        warnings: semanticVerification.warnings,
        rebuiltCheckpoints: semanticVerification.rebuiltCheckpoints,
      }
      : null,
    sameRealm: true,
    finalClientRouteExit: "/downloads",
    releaseContractVersion: V594_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    detachedAndExitedObservedReleaseContract: true,
    detachedAndExitedRendererInfoCountsUnavailableAfterContextLoss: true,
    snapshotReuseWitness: true,
    detachedAndExitedSnapshotCanonicalEqual: true,
    releaseCompletionObserved: true,
    releaseCompletionTransition: "next-link-route-exit",
    releaseCompletionObservedAfterPhase: "exited",
    releaseCompletionTeardownCanonicalEqualsExit: true,
    detachedPreReleaseObserverReleased: null,
    tooling: { ...stage.tooling },
    authority: { ...bundle.candidate.authority },
    synthetic: syntheticFixture,
  };
  validateV594SoakSemanticClosureContract(unsigned);
  const receipt = sealV594Document(unsigned);
  if (!syntheticFixture) await atomicWriteJsonV594(
    await resolveV594OutputRoot(bundle.workspace, outputRoot, "soak-output"),
    outputPath,
    receipt,
    "soak-output",
  );
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (new Set(["--stage", "--semantic-stage", "--output", "--validate-fixture"]).has(token)) {
      values[token.slice(2)] = argv[++index];
    } else throw new Error(`v594-soak-argument:${token}`);
  }
  if (values["validate-fixture"]) {
    assertV594(!values.stage, "v594-soak-fixture-stage-conflict");
    values.stage = values["validate-fixture"];
    values.syntheticFixture = true;
  }
  assertV594(values.stage, "v594-soak-stage-required");
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await buildV594SoakReceipt({
    stagePath: args.stage,
    semanticStagePath: args["semantic-stage"],
    outputPath: args.output,
    syntheticFixture: args.syntheticFixture === true,
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
