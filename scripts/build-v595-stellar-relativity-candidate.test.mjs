import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  V595_OUTPUT_PATHS,
  V595_PENDING_STATUS,
  V595_READY_STATUS,
  buildV595StellarRelativityCandidate,
} from "./build-v595-stellar-relativity-candidate.mjs";
import { canonicalShaV595 } from "./build-v595-source-manifest.mjs";
import { V595_CLOSURE_SOURCE_PATHS } from "./v595-source-paths.mjs";

const outputRoot = "tmp/v595-candidate-builder-test";

test("v595 candidate binds the sealed v594 base, six families, and timelike Kerr", async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
  const result = await buildV595StellarRelativityCandidate({
    outputRoot,
    generatedAt: "2026-08-28T00:00:00.000Z",
    allowPendingClosure: true,
  });
  const expectedPending = V595_CLOSURE_SOURCE_PATHS.filter((path) => !existsSync(path));
  assert.equal(result.status, expectedPending.length > 0 ? V595_PENDING_STATUS : V595_READY_STATUS);
  assert.equal(result.pendingClosurePathCount, expectedPending.length);
  assert.match(result.sourceManifestSha256, /^[0-9a-f]{64}$/);
  assert.match(result.manifestSha256, /^[0-9a-f]{64}$/);
  assert.match(result.deploymentId, /^v595-[0-9a-f]{12}-[0-9a-f]{12}$/);
  for (const path of Object.values(V595_OUTPUT_PATHS)) {
    assert.equal(existsSync(resolve(outputRoot, path)), true, path);
  }
  const source = JSON.parse(readFileSync(resolve(outputRoot, V595_OUTPUT_PATHS.source), "utf8"));
  const manifest = JSON.parse(readFileSync(resolve(outputRoot, V595_OUTPUT_PATHS.manifest), "utf8"));
  const current = JSON.parse(readFileSync(resolve(outputRoot, V595_OUTPUT_PATHS.currentState), "utf8"));
  const pointer = JSON.parse(readFileSync(resolve(outputRoot, V595_OUTPUT_PATHS.pointer), "utf8"));
  const unseal = (value, field) => {
    const unsigned = { ...value };
    delete unsigned[field];
    return canonicalShaV595(unsigned);
  };
  assert.equal(unseal(source, "receiptSha256"), source.receiptSha256);
  assert.equal(unseal(manifest, "manifestSha256"), manifest.manifestSha256);
  assert.equal(unseal(current, "receiptSha256"), current.receiptSha256);
  assert.equal(unseal(pointer, "pointerSha256"), pointer.pointerSha256);
  assert.equal(manifest.governance.parentV594Immutable, true);
  assert.equal(manifest.governance.priorV594HumanDecisionInherited, false);
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
  assert.equal(manifest.authority.productionPromotionAllowed, false);
  if (expectedPending.length > 0) {
    await assert.rejects(
      () => buildV595StellarRelativityCandidate({ outputRoot }),
      /v595-closure-source-pending/,
    );
  } else {
    const ready = await buildV595StellarRelativityCandidate({ outputRoot });
    assert.equal(ready.status, V595_READY_STATUS);
  }
});

test.after(async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
});
