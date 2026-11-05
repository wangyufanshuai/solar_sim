import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { makeFixture } from "./mainline-a-release.test-support.mjs";

const script = path.join(import.meta.dirname, "audit-mainline-a-release-alignment-v626.mjs");
function run(workspace, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: workspace, encoding: "utf8", windowsHide: true });
  return { code: result.status, report: JSON.parse(result.stdout), stderr: result.stderr };
}

test("audit CLI requires the explicitly pinned input and never defaults to old R66", async () => {
  const f = await makeFixture();
  const result = run(f.workspace, ["--no-write", "--json"]);
  assert.equal(result.code, 1);
  assert.ok(result.report.blockers.includes("explicit-evidence-input-required"));
});

test("fixture CLI report is diagnostic and keeps all admission boundaries closed", async () => {
  const f = await makeFixture();
  const result = run(f.workspace, ["--evidence-input", "input.json", "--no-write", "--json"]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.report.build.buildId, "test-build-055");
  assert.equal(result.report.status, "blocked");
  assert.equal(result.report.candidatePackageAllowed, false);
  assert.equal(result.report.boundary.scientificPayloadWriteback, false);
  assert.equal(result.report.rightsClosure.signedItems, 0);
});

test("check exits nonzero when pending gates remain", async () => {
  const f = await makeFixture();
  const result = run(f.workspace, ["--evidence-input", "input.json", "--check"]);
  assert.equal(result.code, 1);
  assert.ok(result.report.blockers.includes("human-rights-signoff-pending"));
});

test("audit requires an explicit unique output and preserves an existing receipt", async () => {
  const f = await makeFixture();
  const before = await readFile(path.join(f.workspace, "docs/http.json"));
  assert.equal(run(f.workspace, ["--evidence-input", "input.json"]).code, 1);
  const result = run(f.workspace, ["--evidence-input", "input.json", "--output", "docs/http.json"]);
  assert.equal(result.code, 1);
  assert.match(result.report.blockers.join(), /EEXIST/u);
  assert.deepEqual(await readFile(path.join(f.workspace, "docs/http.json")), before);
});

test("legacy arbitrary root overrides are rejected without reading them", async () => {
  const f = await makeFixture();
  const result = run(f.workspace, ["--no-write", "--root", "../"]);
  assert.equal(result.code, 1);
  assert.match(result.report.blockers.join(), /unsupported-argument/u);
});
