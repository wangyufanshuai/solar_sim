import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  V595_AUTHORITY_FALSE_FIELDS,
  canonicalShaV595Formal,
  sealV595FormalDocument,
} from "./v595-formal-contract.mjs";
import {
  V595_LIFECYCLE_AUDITOR_VERSION,
  V595_LIFECYCLE_PHASE_LINK_VERSION,
  V595_LIFECYCLE_PHASES,
  V595_LIFECYCLE_RUNNER_VERSION,
  V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS,
  V595_LIFECYCLE_SYNTHETIC_STAGE_STATUS,
  V595_LIFECYCLE_STAGE_VERSION,
  buildV595LifecycleReceipt,
  validateV595LifecycleStage,
} from "./build-v595-current-source-lifecycle.mjs";

const SOURCE = "1".repeat(64);
const CANDIDATE = "2".repeat(64);
const FINGERPRINT = "3".repeat(64);

function identity() {
  return {
    sourceManifestSha256: SOURCE,
    candidateManifestSha256: CANDIDATE,
    buildFingerprint: FINGERPRINT,
    buildId: `v595b-${FINGERPRINT}`,
    deploymentId: `v595-${SOURCE.slice(0, 12)}-${CANDIDATE.slice(0, 12)}`,
    formalProductPointer: "v263",
    deliveryTier: "standalone-full",
    bindingStatus: "bound",
  };
}

function authority() {
  return {
    defaultKernel: "legacy-eih-1pn",
    v2Mode: "shadow-only",
    ...Object.fromEntries(V595_AUTHORITY_FALSE_FIELDS.map((field) => [field, false])),
  };
}

function mountedSnapshot() {
  return {
    captureKind: "mounted-renderer",
    canvas: { count: 1, connected: 1 },
    renderer: {
      active: 1,
      textures: 24,
      geometries: 70,
      programs: 12,
      resourceCountsSource: "three.webglrenderer.info",
      renderTargets: 0,
      renderTargetsSource: "atlas-resource-registry.gpuRenderTargets",
    },
    registry: { total: 4 },
    scene: { active: 1, objects: 100, candidateNodes: 3 },
  };
}

function releasedSnapshot() {
  return {
    captureKind: "unmounted-renderer",
    canvas: { count: 0, connected: 0 },
    renderer: {
      active: 0,
      textures: null,
      geometries: null,
      programs: null,
      resourceCountsSource: "unavailable-context-lost-stale-info",
      renderTargets: 0,
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
    scene: {
      active: 0,
      objects: 0,
      candidateNodes: 0,
      stellarHeroIds: [],
      stellarArchetypes: [],
      stellarContractSha256s: [],
    },
  };
}

function teardown(routeAfter, observerReleased) {
  return {
    renderListsDisposed: true,
    forceContextLossCalled: true,
    contextLost: true,
    contextLossSource: "isContextLost",
    canvasDetached: true,
    resourceReferencesReleased: true,
    routeAfter,
    observerReleased,
  };
}

function errors() {
  return {
    consoleErrors: [],
    pageErrors: [],
    unhandledRejections: [],
    webglContextErrors: [],
  };
}

function resealStage(stage) {
  let previousPhaseSha256 = null;
  const phaseChain = stage.phaseChain.map((row) => {
    const unsigned = {
      ...row,
      previousPhaseSha256,
    };
    delete unsigned.phaseSha256;
    const sealed = {
      ...unsigned,
      phaseSha256: canonicalShaV595Formal({
        version: V595_LIFECYCLE_PHASE_LINK_VERSION,
        entry: unsigned,
      }),
    };
    previousPhaseSha256 = sealed.phaseSha256;
    return sealed;
  });
  const unsigned = { ...stage, phaseChain };
  delete unsigned.receiptSha256;
  return sealV595FormalDocument(unsigned);
}

function lifecycleFixture() {
  const currentIdentity = identity();
  const released = releasedSnapshot();
  const detachedTeardown = teardown("/", null);
  const exitedTeardown = teardown("/downloads", true);
  const phaseChain = V595_LIFECYCLE_PHASES.map((phase, index) => ({
    index,
    phase,
    realmToken: "fixture-realm-token-v595",
    timeOrigin: 123456.5,
    identity: currentIdentity,
    previousPhaseSha256: null,
    state: {
      pathname: phase === "exited" ? "/downloads" : "/",
      snapshotReuseWitness: phase === "exited" ? true : null,
      dom: {
        identity: phase === "exited" ? null : currentIdentity,
        replacement: phase === "replaced"
          ? { count: 1, stable: true }
          : { count: 0 },
      },
      harness: {
        canvasCount: new Set(["mounted", "replacing", "replaced"]).has(phase) ? 1 : 0,
        liveWebGLContextCount:
          new Set(["mounted", "replacing", "replaced"]).has(phase) ? 1 : 0,
        errors: errors(),
      },
      ledger: {
        identity: currentIdentity,
        snapshots: {
          mounted: phase === "mounted" ? mountedSnapshot() : null,
          detached: phase === "detached-stable" ? released : null,
          exited: phase === "exited" ? released : null,
        },
        observer: phase === "detached-stable"
          ? {
              nextAssignment: 2,
              activeAssignment: 1,
              history: [{ assignment: 1, teardown: detachedTeardown }],
            }
          : phase === "exited"
            ? {
                nextAssignment: 2,
                activeAssignment: null,
                history: [{ assignment: 1, teardown: exitedTeardown }],
              }
            : null,
        exit: phase === "detached-stable"
          ? detachedTeardown
          : phase === "exited" ? exitedTeardown : null,
        releaseCompletion: phase === "exited"
          ? {
              transition: "next-link-route-exit",
              observedAfterPhase: "exited",
              teardown: exitedTeardown,
            }
          : null,
      },
    },
  }));
  return resealStage({
    version: V595_LIFECYCLE_STAGE_VERSION,
    status: V595_LIFECYCLE_SYNTHETIC_STAGE_STATUS,
    generatedAt: "2026-08-28T01:00:00.000Z",
    completedAt: "2026-08-28T01:01:00.000Z",
    formalEvidence: false,
    evidenceClaim: false,
    syntheticZeroClaim: false,
    promotion: "none",
    qualificationScope: "synthetic-test-only",
    fixture: { synthetic: true },
    tooling: {
      runnerVersion: V595_LIFECYCLE_RUNNER_VERSION,
      auditorVersion: V595_LIFECYCLE_AUDITOR_VERSION,
    },
    identity: currentIdentity,
    phaseChain,
    errors: errors(),
    authority: authority(),
  });
}

test("synthetic current-v595 lifecycle validates mount, replace, detach, and exit", () => {
  const stage = lifecycleFixture();
  const result = validateV595LifecycleStage(stage, identity(), { syntheticFixture: true });
  assert.equal(result.phaseCount, 9);
  assert.equal(result.mountObserved, true);
  assert.equal(result.replaceObserved, true);
  assert.equal(result.detachObserved, true);
  assert.equal(result.routeExitObserved, true);
});

test("unknown cannot substitute for an observed lifecycle zero", () => {
  const stage = structuredClone(lifecycleFixture());
  stage.phaseChain[6].state.ledger.snapshots.detached.canvas.count = null;
  const resealed = resealStage(stage);
  assert.throws(
    () => validateV595LifecycleStage(resealed, identity(), { syntheticFixture: true }),
    /v595-unknown-zero:detached:canvas.count/,
  );
});

test("renderer info after context loss must remain explicit unavailable, not fake zero", () => {
  const stage = structuredClone(lifecycleFixture());
  stage.phaseChain[6].state.ledger.snapshots.detached.renderer.textures = 0;
  const resealed = resealStage(stage);
  assert.throws(
    () => validateV595LifecycleStage(resealed, identity(), { syntheticFixture: true }),
    /v595-lifecycle-renderer-unavailable-contract:detached/,
  );
});

test("old identity and synthetic evidence are rejected as formal", () => {
  const stage = lifecycleFixture();
  assert.throws(
    () => validateV595LifecycleStage(stage, identity()),
    /v595-lifecycle-stage-status|v595-synthetic-as-formal/,
  );
  const drifted = structuredClone(stage);
  drifted.identity.sourceManifestSha256 = "4".repeat(64);
  const resealed = resealStage(drifted);
  assert.throws(
    () => validateV595LifecycleStage(resealed, identity(), { syntheticFixture: true }),
    /v595-identity-deployment-binding|v595-identity-drift:sourceManifestSha256/,
  );
});

test("synthetic receipt validation performs no output write", async () => {
  const root = await mkdtemp(join(tmpdir(), "v595-lifecycle-fixture-"));
  try {
    await mkdir(join(root, "tmp"), { recursive: true });
    await writeFile(
      join(root, "tmp", "stage.json"),
      `${JSON.stringify(lifecycleFixture(), null, 2)}\n`,
      "utf8",
    );
    const output = "tmp/must-not-exist.json";
    const receipt = await buildV595LifecycleReceipt({
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
    assert.equal(receipt.status, V595_LIFECYCLE_SYNTHETIC_RECEIPT_STATUS);
    assert.equal(receipt.synthetic, true);
    await assert.rejects(access(join(root, output), constants.F_OK));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
