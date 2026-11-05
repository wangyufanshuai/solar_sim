import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  V596_OUTPUT_PATHS,
  V596_PENDING_STATUS,
  V596_READY_STATUS,
  buildV596StellarVisibleLeapCandidate,
} from "./build-v596-stellar-visible-leap-candidate.mjs";
import { canonicalShaV596 } from "./build-v596-source-manifest.mjs";
import { V596_CLOSURE_SOURCE_PATHS } from "./v596-source-paths.mjs";

const outputRoot = "tmp/v596-candidate-builder-test";

test("v596 candidate binds sealed v595, visible leap, six families, and inherited Kerr", async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
  const result = await buildV596StellarVisibleLeapCandidate({
    outputRoot,
    generatedAt: "2026-08-31T00:00:00.000Z",
    allowPendingClosure: true,
  });
  const expectedPending = V596_CLOSURE_SOURCE_PATHS.filter((path) => !existsSync(path));
  assert.equal(result.status, expectedPending.length > 0 ? V596_PENDING_STATUS : V596_READY_STATUS);
  assert.equal(result.pendingClosurePathCount, expectedPending.length);
  assert.match(result.sourceManifestSha256, /^[0-9a-f]{64}$/);
  assert.match(result.manifestSha256, /^[0-9a-f]{64}$/);
  assert.match(result.deploymentId, /^v596-[0-9a-f]{12}-[0-9a-f]{12}$/);
  for (const path of Object.values(V596_OUTPUT_PATHS)) {
    assert.equal(existsSync(resolve(outputRoot, path)), true, path);
  }
  const source = JSON.parse(readFileSync(resolve(outputRoot, V596_OUTPUT_PATHS.source), "utf8"));
  const manifest = JSON.parse(readFileSync(resolve(outputRoot, V596_OUTPUT_PATHS.manifest), "utf8"));
  const current = JSON.parse(readFileSync(resolve(outputRoot, V596_OUTPUT_PATHS.currentState), "utf8"));
  const pointer = JSON.parse(readFileSync(resolve(outputRoot, V596_OUTPUT_PATHS.pointer), "utf8"));
  const unseal = (value, field) => {
    const unsigned = { ...value };
    delete unsigned[field];
    return canonicalShaV596(unsigned);
  };
  assert.equal(unseal(source, "receiptSha256"), source.receiptSha256);
  assert.equal(unseal(manifest, "manifestSha256"), manifest.manifestSha256);
  assert.equal(unseal(current, "receiptSha256"), current.receiptSha256);
  assert.equal(unseal(pointer, "pointerSha256"), pointer.pointerSha256);
  assert.equal(manifest.governance.parentV595Immutable, true);
  assert.equal(manifest.governance.priorV595HumanDecisionInherited, false);
  assert.equal(manifest.governance.checkpointDecisionInheritedAsFinalSignoff, false);
  assert.deepEqual(manifest.stellar.admission, {
    rosterCount: 24,
    schemaCompleteCount: 24,
    identityBoundCount: 20,
    renderAnchorOnlyCount: 4,
    measurementAdmittedCount: 0,
    provenanceAdmittedCount: 0,
    presentationAdmittedCount: 24,
    status: "schema-complete-measurement-admission-blocked",
  });
  assert.equal(manifest.stellar.measurementAdmittedCount, manifest.stellar.admission.measurementAdmittedCount);
  assert.equal(manifest.stellar.visibleLeap.archetypeCount, 7);
  assert.equal(manifest.stellar.visibleLeap.orderedArchetypes.length, 7);
  assert.equal(manifest.stellar.visibleLeap.presentationOnly, true);
  assert.equal(manifest.stellar.visibleLeap.formalEvidence, "pending-current-identity-evidence");
  assert.equal(manifest.productSceneFamilies.familyCount, 6);
  assert.equal(manifest.productSceneFamilies.sharedMainCanvas, true);
  assert.equal(manifest.productSceneFamilies.independentWebglSceneCountClaim, false);
  assert.equal(manifest.relativity.timelikeKerr.fixtureCount, 4);
  assert.equal(manifest.relativity.timelikeKerr.analyticAnchorCount, 3);
  assert.equal(manifest.relativity.timelikeKerr.referenceCandidateOnly, true);
  assert.equal(manifest.authority.defaultKernel, "legacy-eih-1pn");
  assert.equal(manifest.authority.scientificAuthorityGranted, false);
  assert.equal(manifest.authority.measuredAuthorityGranted, false);
  assert.equal(manifest.authority.gpuAuthorityGranted, false);
  assert.equal(manifest.authority.resolvedSurfaceAuthorityGranted, false);
  assert.equal(manifest.authority.observationTextureAuthorityGranted, false);
  assert.equal(manifest.authority.productionPromotionAllowed, false);
  if (expectedPending.length > 0) {
    await assert.rejects(
      () => buildV596StellarVisibleLeapCandidate({ outputRoot }),
      /v596-closure-source-pending/,
    );
  } else {
    const ready = await buildV596StellarVisibleLeapCandidate({ outputRoot });
    assert.equal(ready.status, V596_READY_STATUS);
  }
});

test.after(async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
});
