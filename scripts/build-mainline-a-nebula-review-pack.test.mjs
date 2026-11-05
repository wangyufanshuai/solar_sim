import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const script = path.join(root, "scripts/build-mainline-a-nebula-review-pack.mjs");
const temporaryOutputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-nebula-pack-test-"));
const output = path.join(temporaryOutputDirectory, "pack.json");
const runPack = (args = []) => execFileSync(process.execPath, [script, ...args], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, MAINLINE_A_NEBULA_REVIEW_OUTPUT: output },
});

test("review pack projects all 18 candidates as pending", () => {
  runPack();
  const pack = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.equal(pack.schema, "mainline-a-nebula-review-pack-v610");
  assert.equal(pack.candidateCount, 18);
  assert.equal(pack.runtimeAdmissionCount, 0);
  assert.equal(pack.counts["rights-review"], 18);
  assert.ok(pack.records.every((record) => record.runtime.candidateOnly && record.reviewer.decision === "pending"));
});

test("review pack keeps provenance and source evidence per row", () => {
  const pack = JSON.parse(fs.readFileSync(output, "utf8"));
  for (const record of pack.records) {
    assert.match(record.source.url, /^https:\/\//);
    assert.match(record.source.sha256, /^[a-f0-9]{64}$/);
    assert.ok(record.source.width >= 256 && record.source.height >= 256);
    assert.match(record.provenance.manifestSha256, /^[a-f0-9]{64}$/);
    assert.equal(record.runtime.scienceImagePayloadAllowed, false);
  }
});

test("check mode rejects a stale review pack", () => {
  runPack();
  const original = fs.readFileSync(output, "utf8");
  const stale = JSON.parse(original);
  stale.projectionSha256 = "0".repeat(64);
  fs.writeFileSync(output, JSON.stringify(stale));
  assert.throws(() => runPack(["--check"]));
  fs.writeFileSync(output, original);
  runPack(["--check"]);
});

test("review pack is fail closed for runtime admission", () => {
  const pack = JSON.parse(fs.readFileSync(output, "utf8"));
  assert.deepEqual(pack.states, ["source-verified", "rights-review", "visual-review", "admission-ready"]);
  assert.ok(pack.records.every((record) => record.state === "rights-review"));
  assert.ok(pack.records.every((record) => record.blockers.length === 3));
});
