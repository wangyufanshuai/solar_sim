import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { resolveAtlasNextBuildId } from "../next.config.mjs";
import { buildV595StellarRelativityCandidate } from "./build-v595-stellar-relativity-candidate.mjs";
import {
  createV595BuildReceipt,
  deriveV595BuildFingerprint,
  deriveV595BuildId,
  deriveV595DeploymentId,
  loadV595ProfileIdentity,
  v595ProfileInvocation,
} from "./build-atlas-v595-profile.mjs";
import { V595_CLOSURE_SOURCE_PATHS } from "./v595-source-paths.mjs";

const outputRoot = "tmp/v595-profile-wrapper-test";

test("v595 profile identity is independent from all v594 public env aliases", async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
  await buildV595StellarRelativityCandidate({
    outputRoot,
    generatedAt: "2026-08-28T00:00:00.000Z",
    allowPendingClosure: true,
  });
  const identity = loadV595ProfileIdentity({
    artifactRoot: outputRoot,
    requested: "standalone-full",
    requireReady: false,
  });
  assert.equal(identity.buildId, deriveV595BuildId(identity.buildFingerprint));
  assert.equal(resolveAtlasNextBuildId({ ATLAS_NEXT_BUILD_ID: identity.buildId }), identity.buildId);
  assert.equal(identity.buildFingerprint, deriveV595BuildFingerprint(
    identity.source.receiptSha256,
    identity.manifest.manifestSha256,
    "standalone-full",
  ));
  assert.equal(identity.deploymentId, deriveV595DeploymentId(
    identity.source.receiptSha256,
    identity.manifest.manifestSha256,
  ));
  const invocation = v595ProfileInvocation(identity);
  assert.equal(invocation.env.NEXT_PUBLIC_ATLAS_V595_BUILD_ID, identity.buildId);
  assert.equal(Object.keys(invocation.env).some((name) => name.startsWith("NEXT_PUBLIC_ATLAS_V594_")), false);
  assert.equal(invocation.unsetEnv.every((name) => name === "NEXT_DEPLOYMENT_ID"
    || name.startsWith("NEXT_PUBLIC_ATLAS_V594_")), true);
  const closureToolingComplete = V595_CLOSURE_SOURCE_PATHS.every((path) => existsSync(path));
  if (closureToolingComplete) {
    const buildReceipt = createV595BuildReceipt(identity);
    assert.equal(buildReceipt.sourceManifestSha256, identity.source.receiptSha256);
    assert.equal(buildReceipt.candidateManifestSha256, identity.manifest.manifestSha256);
    assert.equal(buildReceipt.buildId, identity.buildId);
    assert.equal(
      loadV595ProfileIdentity({ artifactRoot: outputRoot, requireReady: true }).buildId,
      identity.buildId,
    );
  } else {
    assert.throws(() => createV595BuildReceipt(identity), /v595-profile-closure-source-order/);
    await assert.rejects(
      async () => loadV595ProfileIdentity({ artifactRoot: outputRoot, requireReady: true }),
      /v595-profile-closure-source-pending/,
    );
  }
});

test.after(async () => {
  await rm(resolve(outputRoot), { recursive: true, force: true });
});
