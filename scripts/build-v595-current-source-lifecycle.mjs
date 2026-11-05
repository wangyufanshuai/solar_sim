import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertKnownFiniteZeroV595,
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

export const V595_LIFECYCLE_STAGE_VERSION =
  "v595-same-realm-scene-exit-stage-v1";
export const V595_LIFECYCLE_STAGE_STATUS =
  "staging-v595-same-realm-scene-exit-passed-not-promoted";
export const V595_LIFECYCLE_SYNTHETIC_STAGE_STATUS =
  "synthetic-v595-same-realm-scene-exit-fixture-not-formal";
export const V595_LIFECYCLE_RECEIPT_VERSION = "v595-resource-lifecycle-v1";
export const V595_LIFECYCLE_RECEIPT_STATUS =
  "passed-current-v595-same-realm-one-canvas-mount-replace-detach-and-client-route-exit";
export const V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS =
  "validated-synthetic-v595-lifecycle-fixture-not-formal";
export const V595_LIFECYCLE_PHASE_LINK_VERSION =
  "v595-same-realm-scene-exit-phase-link-v1";
export const V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION =
  "v595-observed-scene-exit-release-contract-v1";
export const V595_LIFECYCLE_RUNNER_VERSION =
  "v595-same-realm-scene-exit-runner-v1";
export const V595_LIFECYCLE_AUDITOR_VERSION =
  "v595-same-realm-scene-exit-audit-v1";
export const V595_LIFECYCLE_PHASES = Object.freeze([
  "baseline",
  "mounting",
  "mounted",
  "replacing",
  "replaced",
  "detaching",
  "detached-stable",
  "exiting",
  "exited",
]);

const CONTEXT_LOSS_SOURCES = new Set(["webglcontextlost-event", "isContextLost"]);
const TEARDOWN_KEYS = Object.freeze([
  "canvasDetached",
  "contextLost",
  "contextLossSource",
  "forceContextLossCalled",
  "observerReleased",
  "renderListsDisposed",
  "resourceReferencesReleased",
  "routeAfter",
].sort());

function hasExactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value)
    && sameCanonicalV595Formal(Object.keys(value).sort(), keys);
}

function assertEmptyErrorEnvelope(errors, label) {
  assertV595Formal(
    errors && typeof errors === "object" && !Array.isArray(errors),
    `v595-lifecycle-error-envelope:${label}`,
  );
  for (const field of [
    "consoleErrors",
    "pageErrors",
    "unhandledRejections",
    "webglContextErrors",
  ]) {
    assertV595Formal(
      Array.isArray(errors[field]) && errors[field].length === 0,
      `v595-lifecycle-errors:${label}:${field}`,
    );
  }
}

function assertUnmountedSnapshot(snapshot, label) {
  assertV595Formal(
    snapshot && typeof snapshot === "object" && !Array.isArray(snapshot),
    `v595-lifecycle-snapshot:${label}`,
  );
  assertV595Formal(
    snapshot.captureKind === "unmounted-renderer",
    `v595-lifecycle-snapshot-kind:${label}`,
  );
  const knownZero = [
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
  ];
  for (const [value, field] of knownZero) {
    assertKnownFiniteZeroV595(value, `${label}:${field}`);
  }
  // Context loss invalidates WebGLRenderer.info. Unknown is accepted only as
  // explicit unavailability and is never promoted to an observed zero.
  assertV595Formal(
    snapshot.renderer?.textures === null
      && snapshot.renderer?.geometries === null
      && snapshot.renderer?.programs === null
      && snapshot.renderer?.resourceCountsSource
        === "unavailable-context-lost-stale-info",
    `v595-lifecycle-renderer-unavailable-contract:${label}`,
  );
  assertV595Formal(
    snapshot.renderer?.renderTargetsSource
      === "atlas-resource-registry.gpuRenderTargets"
      && snapshot.renderer.renderTargets === snapshot.registry?.renderTargets,
    `v595-lifecycle-render-target-source:${label}`,
  );
  for (const field of [
    "stellarHeroIds",
    "stellarArchetypes",
    "stellarContractSha256s",
  ]) {
    assertV595Formal(
      Array.isArray(snapshot.scene?.[field]) && snapshot.scene[field].length === 0,
      `v595-lifecycle-scene-census:${label}:${field}`,
    );
  }
  return snapshot;
}

function assertMountedSnapshot(snapshot, label) {
  assertV595Formal(
    snapshot?.captureKind === "mounted-renderer",
    `v595-lifecycle-mounted-kind:${label}`,
  );
  assertV595Formal(
    snapshot.canvas?.count === 1 && snapshot.canvas?.connected === 1,
    `v595-lifecycle-one-canvas:${label}`,
  );
  assertV595Formal(
    snapshot.renderer?.active === 1
      && snapshot.renderer?.resourceCountsSource === "three.webglrenderer.info",
    `v595-lifecycle-one-renderer:${label}`,
  );
  assertKnownPositiveV595(snapshot.scene?.active, `${label}:scene.active`);
  return snapshot;
}

function assertTeardown(teardown, { label, routeAfter, observerReleased }) {
  assertV595Formal(hasExactKeys(teardown, TEARDOWN_KEYS),
    `v595-lifecycle-teardown-keys:${label}`);
  for (const field of [
    "renderListsDisposed",
    "forceContextLossCalled",
    "contextLost",
    "canvasDetached",
    "resourceReferencesReleased",
  ]) {
    assertV595Formal(teardown[field] === true,
      `v595-lifecycle-teardown:${label}:${field}`);
  }
  assertV595Formal(
    CONTEXT_LOSS_SOURCES.has(teardown.contextLossSource),
    `v595-lifecycle-context-loss-source:${label}`,
  );
  assertV595Formal(teardown.routeAfter === routeAfter,
    `v595-lifecycle-route-after:${label}`);
  assertV595Formal(teardown.observerReleased === observerReleased,
    `v595-lifecycle-observer-released:${label}`);
  return teardown;
}

function assertObserver(ledger, { label, activeAssignment, routeAfter, observerReleased }) {
  const observer = ledger?.observer;
  assertV595Formal(
    observer && typeof observer === "object" && !Array.isArray(observer),
    `v595-lifecycle-observer:${label}`,
  );
  assertV595Formal(
    observer.nextAssignment === 2
      && observer.activeAssignment === activeAssignment
      && Array.isArray(observer.history)
      && observer.history.length === 1
      && observer.history[0]?.assignment === 1,
    `v595-lifecycle-observer-state:${label}`,
  );
  const teardown = assertTeardown(observer.history[0].teardown, {
    label: `${label}:assignment-1`,
    routeAfter,
    observerReleased,
  });
  assertV595Formal(
    sameCanonicalV595Formal(teardown, ledger.exit),
    `v595-lifecycle-observer-exit-binding:${label}`,
  );
  return teardown;
}

function assertTeardownCommon(left, right) {
  for (const field of [
    "renderListsDisposed",
    "forceContextLossCalled",
    "contextLost",
    "contextLossSource",
    "canvasDetached",
    "resourceReferencesReleased",
  ]) {
    assertV595Formal(
      left[field] === right[field],
      `v595-lifecycle-teardown-drift:${field}`,
    );
  }
}

function assertRowIdentity(row, identity, phase) {
  const candidates = [row?.identity, row?.state?.dom?.identity, row?.state?.ledger?.identity]
    .filter((value) => value !== null && value !== undefined);
  assertV595Formal(candidates.length > 0, `v595-lifecycle-row-identity:${phase}`);
  for (const candidate of candidates) {
    validateV595Identity(candidate, identity, { deliveryTier: "standalone-full" });
  }
}

export function validateV595LifecycleStage(stage, expectedIdentity, options = {}) {
  verifyV595FormalSeal(stage, "receiptSha256", "lifecycle-stage");
  assertV595Formal(
    stage.version === V595_LIFECYCLE_STAGE_VERSION,
    "v595-lifecycle-stage-version",
  );
  assertV595Formal(stage.status === (options.syntheticFixture
    ? V595_LIFECYCLE_SYNTHETIC_STAGE_STATUS
    : V595_LIFECYCLE_STAGE_STATUS), "v595-lifecycle-stage-status");
  assertV595EvidenceEnvelope(stage, options);
  assertV595Formal(
    stage.qualificationScope === (options.syntheticFixture
      ? "synthetic-test-only"
      : "formal-current-v595-same-realm-scene-exit"),
    "v595-lifecycle-qualification-scope",
  );
  assertV595Formal(
    stage.tooling?.runnerVersion === V595_LIFECYCLE_RUNNER_VERSION
      && stage.tooling?.auditorVersion === V595_LIFECYCLE_AUDITOR_VERSION,
    "v595-lifecycle-tooling-version",
  );
  const identity = validateV595Identity(stage.identity, expectedIdentity, {
    deliveryTier: "standalone-full",
  });
  assertV595Formal(
    Array.isArray(stage.phaseChain)
      && stage.phaseChain.length === V595_LIFECYCLE_PHASES.length,
    "v595-lifecycle-phase-count",
  );
  let previousPhaseSha256 = null;
  let realmToken = null;
  let timeOrigin = null;
  for (const [index, phase] of V595_LIFECYCLE_PHASES.entries()) {
    const row = stage.phaseChain[index];
    assertV595Formal(
      row?.index === index && row?.phase === phase,
      `v595-lifecycle-phase-order:${phase}`,
    );
    assertV595Formal(
      row.previousPhaseSha256 === previousPhaseSha256,
      `v595-lifecycle-phase-replay:${phase}`,
    );
    const unsigned = { ...row };
    delete unsigned.phaseSha256;
    assertV595Formal(
      row.phaseSha256 === canonicalShaV595Formal({
        version: V595_LIFECYCLE_PHASE_LINK_VERSION,
        entry: unsigned,
      }),
      `v595-lifecycle-phase-seal:${phase}`,
    );
    previousPhaseSha256 = row.phaseSha256;
    assertV595Formal(
      typeof row.realmToken === "string" && row.realmToken.length >= 8,
      `v595-lifecycle-realm-token:${phase}`,
    );
    assertKnownPositiveV595(row.timeOrigin, `lifecycle:${phase}:timeOrigin`);
    realmToken ??= row.realmToken;
    timeOrigin ??= row.timeOrigin;
    assertV595Formal(
      row.realmToken === realmToken && row.timeOrigin === timeOrigin,
      `v595-lifecycle-realm-drift:${phase}`,
    );
    assertRowIdentity(row, identity, phase);
  }

  const mountedRow = stage.phaseChain[2];
  const replacedRow = stage.phaseChain[4];
  const detachedRow = stage.phaseChain[6];
  const exitedRow = stage.phaseChain[8];
  const mounted = mountedRow.state?.ledger?.snapshots?.mounted
    ?? mountedRow.state?.snapshot;
  assertMountedSnapshot(mounted, "mounted");
  assertV595Formal(
    mountedRow.state?.harness?.canvasCount === 1
      && mountedRow.state?.harness?.liveWebGLContextCount === 1,
    "v595-lifecycle-mounted-harness-one-canvas",
  );
  assertV595Formal(
    replacedRow.state?.harness?.canvasCount === 1
      && replacedRow.state?.harness?.liveWebGLContextCount === 1,
    "v595-lifecycle-replaced-harness-one-canvas",
  );
  const replacement = replacedRow.state?.dom?.replacement
    ?? replacedRow.state?.replacement;
  assertV595Formal(
    replacement?.count === 1 && replacement?.stable === true,
    "v595-lifecycle-replacement-observed",
  );

  const detached = detachedRow.state?.ledger?.snapshots?.detached
    ?? detachedRow.state?.snapshot;
  const exited = exitedRow.state?.ledger?.snapshots?.exited
    ?? exitedRow.state?.snapshot;
  assertUnmountedSnapshot(detached, "detached");
  assertUnmountedSnapshot(exited, "exited");
  assertV595Formal(
    sameCanonicalV595Formal(detached, exited),
    "v595-lifecycle-detached-exited-snapshot-drift",
  );
  assertV595Formal(
    detachedRow.state?.harness?.canvasCount === 0
      && detachedRow.state?.harness?.liveWebGLContextCount === 0
      && exitedRow.state?.harness?.canvasCount === 0
      && exitedRow.state?.harness?.liveWebGLContextCount === 0,
    "v595-lifecycle-unmounted-harness-zero",
  );
  assertV595Formal(
    detachedRow.state?.pathname === "/" && exitedRow.state?.pathname === "/downloads",
    "v595-lifecycle-route-exit-observation",
  );
  assertV595Formal(
    stage.phaseChain.every((row, index) => (
      index === V595_LIFECYCLE_PHASES.length - 1
        ? row.state?.snapshotReuseWitness === true
        : row.state?.snapshotReuseWitness === null
          || row.state?.snapshotReuseWitness === false
    )),
    "v595-lifecycle-snapshot-reuse-witness",
  );

  const detachedLedger = detachedRow.state?.ledger;
  const exitedLedger = exitedRow.state?.ledger;
  const detachedTeardown = assertObserver(detachedLedger, {
    label: "detached-pre-release",
    activeAssignment: 1,
    routeAfter: "/",
    observerReleased: null,
  });
  const exitedTeardown = assertObserver(exitedLedger, {
    label: "exited-release",
    activeAssignment: null,
    routeAfter: "/downloads",
    observerReleased: true,
  });
  assertTeardownCommon(detachedTeardown, exitedTeardown);
  assertV595Formal(
    exitedLedger?.releaseCompletion?.transition === "next-link-route-exit"
      && exitedLedger.releaseCompletion?.observedAfterPhase === "exited"
      && sameCanonicalV595Formal(
        exitedLedger.releaseCompletion?.teardown,
        exitedLedger.exit,
      ),
    "v595-lifecycle-release-completion",
  );
  assertEmptyErrorEnvelope(stage.errors, "stage");
  for (const [index, row] of stage.phaseChain.entries()) {
    assertEmptyErrorEnvelope(row.state?.harness?.errors, `phase:${index}`);
  }
  assertV595Authority(stage.authority, "lifecycle-stage");

  return Object.freeze({
    identity,
    phaseCount: stage.phaseChain.length,
    realmToken,
    timeOrigin,
    mountObserved: true,
    replaceObserved: true,
    detachObserved: true,
    routeExitObserved: true,
  });
}

export async function buildV595LifecycleReceipt({
  root = process.cwd(),
  outputRoot = root,
  stagePath,
  outputPath = "docs/release/v595/resource-lifecycle-v595.json",
  syntheticFixture = false,
  bundle = null,
} = {}) {
  assertV595Formal(stagePath, "v595-lifecycle-stage-required");
  const current = bundle ?? await loadCurrentV595Bundle(root, { requireBuilds: true });
  const stage = (await readJsonV595Formal(current.workspace, stagePath, "lifecycle-stage")).value;
  const validated = validateV595LifecycleStage(
    stage,
    current.identities.standalone,
    { syntheticFixture },
  );
  const unsigned = {
    version: V595_LIFECYCLE_RECEIPT_VERSION,
    generatedAt: stage.completedAt ?? stage.generatedAt,
    status: syntheticFixture
      ? V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS
      : V595_LIFECYCLE_RECEIPT_STATUS,
    candidate: validated.identity,
    evidence: await fileReceiptV595Formal(current.workspace, stagePath, "lifecycle-stage"),
    stageReceiptSha256: stage.receiptSha256,
    phaseCount: validated.phaseCount,
    sameRealm: true,
    observations: {
      oneCanvasMount: true,
      oneCanvasReplace: true,
      detach: true,
      clientRouteExit: "/downloads",
      observedKnownZeroAfterDetach: true,
      observedKnownZeroAfterExit: true,
      rendererInfoAfterContextLoss: "explicitly-unavailable-not-zero",
    },
    releaseContractVersion: V595_SCENE_EXIT_RELEASE_CONTRACT_VERSION,
    detachedAndExitedSnapshotCanonicalEqual: true,
    snapshotReuseWitness: true,
    tooling: { ...stage.tooling },
    authority: { ...current.candidate.authority },
    synthetic: syntheticFixture,
  };
  assertV595Authority(unsigned.authority, "lifecycle-receipt");
  const receipt = sealV595FormalDocument(unsigned);
  // Synthetic fixtures prove only validator behavior. They must never create
  // a receipt at a formal or caller-provided output path.
  if (!syntheticFixture) {
    await atomicWriteJsonV595Formal(
      current.workspace,
      outputRoot,
      outputPath,
      receipt,
      "lifecycle-output",
    );
  }
  return receipt;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--stage" || token === "--output") values[token.slice(2)] = argv[++index];
    else throw new Error(`v595-lifecycle-argument:${token}`);
  }
  assertV595Formal(values.stage, "v595-lifecycle-stage-required");
  return values;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = await buildV595LifecycleReceipt({
    stagePath: args.stage,
    outputPath: args.output,
  });
  process.stdout.write(`${JSON.stringify({
    status: receipt.status,
    phaseCount: receipt.phaseCount,
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
