import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inspectR78ExternalBoundaryV665,
  parseR78ExternalOptionsV665 } from
  "./verify-mainline-a-r78-external-boundary-v665.mjs";

const base = "docs/release/v607/";
const [freeze, prior, replay] = await Promise.all([
  readFile(base
    + "mainline-a-r77-v664-freeze-20261013v664r77freeze01.json",
  "utf8").then(JSON.parse),
  readFile(base
    + "mainline-a-r77-v664-external-source-20261013v664r77web01.json",
  "utf8").then(JSON.parse),
  readFile(base
    + "mainline-a-r77-v664-freeze-replay-20261013v664r77freeze01.json",
  "utf8").then(JSON.parse),
]);

test("keeps four stellar and five nebula holds after prior raw replay", () => {
  const result = inspectR78ExternalBoundaryV665(
    freeze, prior, replay, freeze.appSourceSha256);
  assert.equal(result.ok, true, result.issues.join(","));
  assert.equal(result.verifiedFilePins, 57);
  assert.equal(result.stellarComponentHolds, 4);
  assert.equal(result.betaNebulaImageHolds, 5);
  assert.equal(result.newHttpsRequests, 0);
});

test("rejects a forged signed right or stellar identity promotion", () => {
  const bad = structuredClone(freeze);
  bad.matrixRows.find((row) =>
    row.group === "a-nebula").rights = "signed";
  bad.matrixRows.find((row) =>
    row.group === "beta-star"
    && row.state === "identity-hold").state = "reviewable";
  const issues = inspectR78ExternalBoundaryV665(
    bad, prior, replay, freeze.appSourceSha256).issues;
  assert.ok(issues.includes("held-items-or-rights-state-invalid"));
});

test("rejects invented HTTPS captures and V616 byte drift", () => {
  const badPrior = { ...prior, newHttpsRequests: 1 };
  const badFreeze = structuredClone(freeze);
  badFreeze.v616Pins[0].sha256 = "0".repeat(64);
  const issues = inspectR78ExternalBoundaryV665(
    badFreeze, badPrior, replay,
    freeze.appSourceSha256).issues;
  assert.ok(issues.includes("source-freeze-or-v616-pin-invalid"));
  assert.ok(issues.includes("external-source-or-rights-promotion"));
});

test("rejects a stale source and forged replay pin count", () => {
  const issues = inspectR78ExternalBoundaryV665(
    freeze, prior, { ...replay, pinChecks: 58 },
    "0".repeat(64)).issues;
  assert.ok(issues.includes("source-freeze-or-v616-pin-invalid"));
  assert.ok(issues.includes("prior-byte-replay-invalid"));
  assert.equal(parseR78ExternalOptionsV665([
    "--run-id", "20261013v665r78web01"]),
  "20261013v665r78web01");
  assert.throws(() => parseR78ExternalOptionsV665([
    "--run-id", "../outside"]));
});
