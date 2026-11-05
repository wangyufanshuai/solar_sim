import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeFixture } from "./mainline-a-release.test-support.mjs";
import { buildIdentityBridge } from "./build-mainline-a-release-identity-bridge-v626.mjs";
import { createAlignmentReport, loadEvidenceInput } from "./mainline-a-release-evidence.mjs";

const script = path.join(import.meta.dirname, "build-mainline-a-release-identity-bridge-v626.mjs");
function run(workspace, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: workspace, encoding: "utf8", windowsHide: true });
  return { code: result.status, report: JSON.parse(result.stdout), stderr: result.stderr };
}

test("bridge uses the same explicit artifact and raw input digest as alignment", async () => {
  const f = await makeFixture();
  const evidence = await loadEvidenceInput(f.workspace, "input.json");
  const report = await createAlignmentReport(f.workspace, evidence);
  const bridge = await buildIdentityBridge(f.workspace, evidence, report);
  assert.deepEqual(bridge.build, report.build);
  assert.equal(bridge.evidenceInput.sha256, report.evidenceInput.sha256);
  assert.equal(bridge.status, "blocked");
  assert.equal(bridge.mapping.nextWebBuildIdentityPresent, false);
});

test("bridge no-write does not manufacture a root release identity", async () => {
  const f = await makeFixture();
  const result = run(f.workspace, ["--evidence-input", "input.json", "--no-write"]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.report.mapping.releaseIdentityMatch, false);
  assert.equal(result.report.rootPackage.releaseIdentity, null);
});

test("bridge rejects absent explicit input even when old build names exist", async () => {
  const f = await makeFixture();
  const result = run(f.workspace, ["--check", "--no-write"]);
  assert.equal(result.code, 1);
  assert.match(result.report.blockers.join(), /explicit-evidence-input-required/u);
});

test("bridge rejects outside outputs and preserves historical evidence", async () => {
  const f = await makeFixture();
  const before = await readFile(path.join(f.workspace, "docs/http.json"));
  assert.equal(run(f.workspace, ["--evidence-input", "input.json", "--output", "../escape.json"]).code, 1);
  const result = run(f.workspace, ["--evidence-input", "input.json", "--output", "docs/http.json"]);
  assert.equal(result.code, 1);
  assert.match(result.report.blockers.join(), /EEXIST/u);
  assert.deepEqual(await readFile(path.join(f.workspace, "docs/http.json")), before);
});
