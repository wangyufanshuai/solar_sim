import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inspectR78LongRunV665,
  replayR78LongRunV665 } from
  "./verify-mainline-a-r78-longrun-v665.mjs";
import { parseR78AuditOptionsV665 } from
  "./audit-mainline-a-r78-longrun-v665.mjs";

// The historical R70 browser run checks verifier compatibility only.
// Every cross-round manifest below is a test fixture; it is never a receipt.
const [build, raw] = await Promise.all([
  readFile("docs/release/v607/mainline-a-r70-build-20261012v657web02.json",
    "utf8").then(JSON.parse),
  readFile("docs/release/v607/mainline-a-r70-v657-browser-final-raw-20261012-v657long04.json",
    "utf8").then(JSON.parse),
]);
const source = build.inputAfterSha256;
const runId = "20261013-v665long01";
function fixture() {
  const freeze = {
    schema: "mainline-a-r77-web-freeze-v664",
    appSourceSha256: source,
    fingerprint: "f".repeat(64),
    matrixRows: Array.from({ length: 96 }, (_, index) => index),
    scenes: Array.from({ length: 36 }, (_, index) => index),
    assetPins: Array.from({ length: 49 }, (_, index) => index),
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false },
    claims: { publicWebReleaseApproved: false },
  };
  const r77Audit = {
    schema: "mainline-a-r77-evidence-audit-v664",
    status: "passed-current-source-local-candidate-release-blocked",
    release: "blocked",
    appSourceSha256: source,
    buildId: build.buildId,
    runtimeBuildId: build.runtimeBuildId,
    freezeFingerprint: freeze.fingerprint,
    screenshotCount: 77,
    verification: { matrixBrowser: { matrixSelections: 192 },
      canonicalDesktop: { scenes: 36 },
      canonicalMobile: { scenes: 36 } },
    physicalMobile: "not-run",
    publicDeployment: "not-run",
    claims: { publicWebReleaseApproved: false,
      productionPerformance: false },
    boundary: { scientificPayloadWriteback: false },
  };
  return { runId, build, raw, freeze, r77Audit,
    currentSourceSha256: source,
    rawPin: { path:
        "docs/release/v607/mainline-a-r78-v665-browser-final-raw-"
        + runId + ".json",
      bytes: 68_000_000, sha256: "a".repeat(64) } };
}

test("rechecks historical raw while never promoting it to current evidence", () => {
  const result = inspectR78LongRunV665(fixture());
  assert.equal(result.status,
    "verified-current-source-local-longrun",
  result.issues.join(","));
  assert.equal(result.counts.totalIndependentLongRuns, 2);
  assert.equal(result.windows.length, 2);
  assert.equal(result.windows[0].frameWindows.length, 6);
  assert.equal(result.windows[1].memoryWindows.length, 6);
  assert.equal(result.claims.productionPerformance, false);
  assert.equal(result.claims.publicWebReleaseApproved, false);
});

test("replay rejects byte-pin and window summary tampering", () => {
  const fresh = inspectR78LongRunV665(fixture());
  assert.equal(replayR78LongRunV665(fresh, fresh).ok, true);
  const forgedPin = structuredClone(fresh);
  forgedPin.rawPin.sha256 = "b".repeat(64);
  assert.equal(replayR78LongRunV665(forgedPin,
    fresh).ok, false);
  const forgedWindow = structuredClone(fresh);
  forgedWindow.windows[0].frameWindows[0].p95Ms = 1;
  assert.equal(replayR78LongRunV665(forgedWindow,
    fresh).ok, false);
});

test("rejects source drift, false release, and fake current evidence", () => {
  const wrong = fixture();
  wrong.currentSourceSha256 = "0".repeat(64);
  wrong.r77Audit.claims.publicWebReleaseApproved = true;
  const result = inspectR78LongRunV665(wrong);
  assert.equal(result.status, "candidate-longrun-rejected");
  assert.ok(result.issues.includes(
    "current-build-source-invalid"));
  assert.ok(result.issues.includes(
    "r77-boundary-promoted"));
});

test("rejects forged time and non-independent browser sessions", () => {
  const wrong = fixture();
  wrong.raw = { ...raw, observations: [raw.observations[0],
    { ...raw.observations[1],
      startedAt: raw.observations[0].startedAt,
      independenceKey: raw.observations[0].independenceKey }] };
  const result = inspectR78LongRunV665(wrong);
  assert.equal(result.status, "candidate-longrun-rejected");
  assert.ok(result.issues.includes(
    "observations-not-independent-or-nonoverlapping"));
});

test("CLI accepts only bounded run IDs and explicit modes", () => {
  assert.equal(parseR78AuditOptionsV665([
    "--mode", "audit", "--run-id", runId]).runId,
  runId);
  assert.throws(() => parseR78AuditOptionsV665([
    "--mode", "audit", "--run-id", "../outside"]));
  assert.throws(() => parseR78AuditOptionsV665([
    "--mode", "publish", "--run-id", runId]));
});
