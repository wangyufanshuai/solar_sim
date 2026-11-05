import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inspectR80EvidenceBundleV667 } from
  "./replay-mainline-a-r80-evidence-v667.mjs";

const replay = JSON.parse(await readFile(
  "docs/release/v607/mainline-a-r80-v667-evidence-replay-"
    + "20261013.json", "utf8"));
const entries = await Promise.all(Object.entries(replay.inputs)
  .map(async ([name, descriptor]) => [name,
    JSON.parse(await readFile(descriptor.path, "utf8"))]));
const baseline = Object.fromEntries(entries);
const sourceSha256 = replay.appSourceSha256;

function input() { return structuredClone(baseline); }

test("R80 replay binds the current build and all evidence classes", () => {
  const result = inspectR80EvidenceBundleV667(input(), sourceSha256);
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.localImageCycles, 62);
  assert.equal(result.canonicalSceneSelections, 72);
  assert.equal(result.screenshotPinsExpected, 137);
  assert.equal(result.rightsSignatures, 0);
});

test("R80 replay rejects a build/source mismatch", () => {
  const forged = input();
  forged.build.inputAfterSha256 = "0".repeat(64);
  forged.browser.buildId = "unrelated-build";
  const result = inspectR80EvidenceBundleV667(forged, sourceSha256);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("current-production-build"));
  assert.ok(result.issues.includes("build-identity-drift"));
});

test("R80 replay rejects image 404 exposure with flag off", () => {
  const forged = input();
  const beta = forged.httpDefaultOff.observation.images.find((item) =>
    item.route.includes("heart-nebula"));
  beta.status = 200;
  const result = inspectR80EvidenceBundleV667(forged, sourceSha256);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("http:default-off:")));
});

test("R80 replay rejects a missing mobile image cycle", () => {
  const forged = input();
  forged.browser.observations.find((item) =>
    item.device === "mobile-viewport" && item.mode === "enabled")
    .cycles.pop();
  const result = inspectR80EvidenceBundleV667(forged, sourceSha256);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("browser:")));
});

test("R80 replay rejects forged visual approval and source pins", () => {
  const forged = input();
  forged.browser.claims.humanVisualSignoff = true;
  forged.external.observedPins[0].sha256 = "0".repeat(64);
  const result = inspectR80EvidenceBundleV667(forged, sourceSha256);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("boundary-or-approval-promotion"));
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("external:")));
});
