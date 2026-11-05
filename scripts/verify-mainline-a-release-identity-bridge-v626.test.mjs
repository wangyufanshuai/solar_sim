import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

const workspace = path.resolve(import.meta.dirname, "..");
const script = path.join(workspace, "scripts/verify-mainline-a-release-identity-bridge-v626.mjs");
const receiptPath = path.join(workspace, "docs/release/v607/mainline-a-r66-identity-bridge-v626-final-004.json");

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: workspace, env: process.env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (value) => { stdout += value; });
    child.stderr.on("data", (value) => { stderr += value; });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("verifier reports blocked without converting pending gates into a pass", async () => {
  const result = await run(["--check", "--json"]);
  assert.notEqual(result.code, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.schema, "mainline-a-release-identity-bridge-verifier-v626");
  assert.equal(report.productIdentity, "solar-sim-mainline-a");
  assert.equal(report.runtimeNames.intentionalDifference, true);
  assert.equal(report.claimsClosed.manifestParity, false);
  assert.ok(report.errors.some((entry) => entry.code === "bridge-status-blocked" || entry.code === "alignment-root-drift"));
});

test("verifier can read a receipt by explicit path and keeps boundary flags", async () => {
  const result = await run(["--check", "--json", "--receipt", path.relative(workspace, receiptPath)]);
  const report = JSON.parse(result.stdout);
  assert.equal(report.boundary.candidateOnly, true);
  assert.equal(report.boundary.hold, true);
  assert.equal(report.boundary.notAdmitted, true);
  assert.equal(report.boundary.scientificPayloadWriteback, false);
});

test("verifier rejects a receipt path that escapes the workspace", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "solar-r66-verifier-"));
  const outside = path.join(temporary, "receipt.json");
  const original = JSON.parse(await readFile(receiptPath, "utf8"));
  original.rootMirror = "E:/outside";
  await writeFile(outside, JSON.stringify(original), "utf8");
  const result = await run(["--check", "--json", "--receipt", outside]);
  assert.notEqual(result.code, 0);
  assert.match(`${result.stdout}${result.stderr}`, /root-path-not-canonical|root-realpath-outside|package|missing|R66 identity/);
  await rm(temporary, { recursive: true, force: true });
});
