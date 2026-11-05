import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeFixture } from "./mainline-a-release.test-support.mjs";
import { assertIdentityBridgeBuild, preparePackage } from "./build-mainline-a-release-package-v626.mjs";
import { createAlignmentReport, loadEvidenceInput } from "./mainline-a-release-evidence.mjs";

const script = path.join(import.meta.dirname, "build-mainline-a-release-package-v626.mjs");

test("a same-head bridge for another artifact is rejected", () => {
  const build = { buildId: "new", runtimeBuildId: "runtime", head: "head", branch: "branch", receiptSha256: "receipt", sourceSha256: "source" };
  const report = { build, sourceBinding: { valid: true }, evidenceInput: { sha256: "input" } };
  const bridge = { schema: "mainline-a-release-identity-bridge-pinned-v1", ...report, build: { ...build, buildId: "old" } };
  assert.throws(() => assertIdentityBridgeBuild(bridge, report), /build-mismatch:buildId/u);
});

test("another evidence bundle cannot reuse a bridge for the same artifact", () => {
  const build = { buildId: "new", runtimeBuildId: "runtime", head: "head", branch: "branch", receiptSha256: "receipt", sourceSha256: "source" };
  const report = { build, sourceBinding: { valid: true }, evidenceInput: { sha256: "input" } };
  const bridge = { schema: "mainline-a-release-identity-bridge-pinned-v1", ...report, evidenceInput: { sha256: "different" } };
  assert.throws(() => assertIdentityBridgeBuild(bridge, report), /input-mismatch/u);
});

test("candidate packaging never promotes fixture evidence", async () => {
  const f = await makeFixture();
  await assert.rejects(preparePackage(f.workspace, "input.json", "docs/bridge.json", "test-055"), /candidate-package-input-rejected/u);
  const report = await createAlignmentReport(f.workspace, await loadEvidenceInput(f.workspace, "input.json"));
  assert.equal(report.claims.releaseApproved, false);
});

test("package CLI has no implicit bridge or previous-package fallback", async () => {
  const f = await makeFixture();
  const result = spawnSync(process.execPath, [script, "--no-write", "--run-id", "test-055"], { cwd: f.workspace, encoding: "utf8", windowsHide: true });
  assert.equal(result.status, 1);
  assert.match(JSON.parse(result.stdout).blockers.join(), /explicit-evidence-input-required/u);
});

test("read-only rejection does not change pinned build bytes", async () => {
  const f = await makeFixture();
  const before = await readFile(path.join(f.workspace, "docs/build.json"));
  await assert.rejects(preparePackage(f.workspace, "input.json", "docs/build.json", "test-055"));
  assert.deepEqual(await readFile(path.join(f.workspace, "docs/build.json")), before);
});
