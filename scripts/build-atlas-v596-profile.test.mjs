import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  ATLAS_V596_NEXT_BUILD_ID_PATTERN,
  resolveAtlasNextBuildId,
} from "../next.config.mjs";
import { buildV596StellarVisibleLeapCandidate } from "./build-v596-stellar-visible-leap-candidate.mjs";
import {
  createV596BuildReceipt,
  deriveV596BuildFingerprint,
  deriveV596BuildId,
  deriveV596DeploymentId,
  loadV596ProfileIdentity,
  v596ProfileInvocation,
} from "./build-atlas-v596-profile.mjs";
import { V596_CLOSURE_SOURCE_PATHS } from "./v596-source-paths.mjs";

const outputRoot = "tmp/v596-profile-wrapper-test";

test("v596 profile binds final identity and approved checkpoint renderer lineage", async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
  await buildV596StellarVisibleLeapCandidate({
    outputRoot,
    generatedAt: "2026-08-31T00:00:00.000Z",
    allowPendingClosure: true,
  });
  const identity = loadV596ProfileIdentity({
    artifactRoot: outputRoot,
    requested: "standalone-full",
    requireReady: false,
  });
  assert.equal(identity.buildId, deriveV596BuildId(identity.buildFingerprint));
  assert.equal(ATLAS_V596_NEXT_BUILD_ID_PATTERN.test(identity.buildId), true);
  assert.equal(resolveAtlasNextBuildId({ ATLAS_NEXT_BUILD_ID: identity.buildId }), identity.buildId);
  assert.equal(identity.buildFingerprint, deriveV596BuildFingerprint(
    identity.source.receiptSha256,
    identity.manifest.manifestSha256,
    "standalone-full",
  ));
  assert.equal(identity.deploymentId, deriveV596DeploymentId(
    identity.source.receiptSha256,
    identity.manifest.manifestSha256,
  ));
  const invocation = v596ProfileInvocation(identity);
  const sharedBuildRunner = readFileSync("scripts/build-atlas-profile.mjs", "utf8");
  assert.match(sharedBuildRunner, /\^v\(\?:594\|595\|596\)b-/);
  assert.equal(invocation.env.NEXT_PUBLIC_ATLAS_V596_BUILD_ID, identity.buildId);
  assert.equal(invocation.env.NEXT_PUBLIC_ATLAS_V596_DELIVERY_TIER, "standalone-full");
  assert.equal(invocation.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_SOURCE_SET_SHA256,
    "26c63b2df7aa825270c0ae9fffc8b48225371f311ca8d3837ce37513e20a4bb7");
  assert.equal(invocation.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_BUILD_FINGERPRINT,
    "5f681cdc38f3d669dd0891b5737e90794a8a1e9600941c6a4d34bee8bd46a149");
  assert.equal(invocation.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_ID,
    "v596-checkpoint-26c63b2df7aa-5f681cdc38f3");
  assert.equal(invocation.env.NEXT_PUBLIC_ATLAS_V596_CHECKPOINT_RUNTIME_TIER,
    "standalone-full");
  assert.equal(invocation.env.ATLAS_BUILD_CPUS, "4");
  assert.equal(Object.keys(invocation.env).some((name) => name.startsWith("NEXT_PUBLIC_ATLAS_V594_")), false);
  assert.equal(invocation.unsetEnv.every((name) => name === "NEXT_DEPLOYMENT_ID"
    || name.startsWith("NEXT_PUBLIC_ATLAS_V594_")
    || name.startsWith("NEXT_PUBLIC_ATLAS_V595_")), true);
  const closureToolingComplete = V596_CLOSURE_SOURCE_PATHS.every((path) => existsSync(path));
  if (closureToolingComplete) {
    const buildReceipt = createV596BuildReceipt(identity);
    assert.equal(buildReceipt.sourceManifestSha256, identity.source.receiptSha256);
    assert.equal(buildReceipt.candidateManifestSha256, identity.manifest.manifestSha256);
    assert.equal(buildReceipt.buildId, identity.buildId);
    assert.equal(buildReceipt.parentV595.candidateManifestSha256,
      "332b5ce6a0b5f26a4f9553d44cb9d0eb8d5cc169ae3242b4cd83259b669abae1");
    assert.equal(buildReceipt.rendererLineage.inheritedAsFinalHumanSignoff, false);
    assert.equal(
      loadV596ProfileIdentity({ artifactRoot: outputRoot, requireReady: true }).buildId,
      identity.buildId,
    );
  } else {
    assert.throws(() => createV596BuildReceipt(identity), /v596-profile-closure-source-order/);
    await assert.rejects(
      async () => loadV596ProfileIdentity({ artifactRoot: outputRoot, requireReady: true }),
      /v596-profile-closure-source-pending/,
    );
  }
});

test.after(async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
});
