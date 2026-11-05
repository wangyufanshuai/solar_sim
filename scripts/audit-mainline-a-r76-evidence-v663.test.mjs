import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { R76_OUTPUT_V663, safePathR76V663 } from
  "./build-mainline-a-r76-readiness-v663.mjs";
import { parseR76EvidenceOptionsV663,
  verifyR76EvidenceV663, verifyR76ScreenshotV663 } from
  "./audit-mainline-a-r76-evidence-v663.mjs";

async function read(relative) {
  return JSON.parse(await readFile(safePathR76V663(relative), "utf8"));
}
const snapshot = await read(R76_OUTPUT_V663);
const build = await read("docs/release/v607/mainline-a-r76-build-20261013v663r76web02.json");
const http = await read("docs/release/v607/mainline-a-r76-v663-http-20261013v663r76web03.json");
const browser = await read("docs/release/v607/mainline-a-r76-v663-browser-20261013v663r76web05.json");
const source = await read("docs/release/v607/mainline-a-r76-v663-readiness-replay-20261013v663r76source01.json");
const fresh = () => structuredClone({ snapshot, build, http,
  browser, source });
test("accepts one pinned current-build HTTP/browser/source chain", () => {
  const input = fresh();
  const result = verifyR76EvidenceV663(input.snapshot, input.build,
    input.http, input.browser, input.source);
  assert.equal(result.ok, true, result.issues.join(","));
  assert.equal(result.itemsPerViewport, 9);
  assert.equal(result.defaultOffReviewImages, 19);
});
test("rejects stale build identity and fake public release", () => {
  const input = fresh();
  input.build.inputAfterSha256 = "0".repeat(64);
  input.browser.claims.publicWebReleaseApproved = true;
  const issues = verifyR76EvidenceV663(input.snapshot,
    input.build, input.http, input.browser, input.source).issues;
  assert.ok(issues.includes("build-source-or-identity-invalid"));
  assert.ok(issues.includes("browser-identity-or-boundary-invalid"));
});
test("rejects a hidden image becoming available and a missing item", () => {
  const input = fresh();
  input.http.observations.reviewDefaultOff[0].status = 200;
  input.browser.mobileViewport.readiness.selections.pop();
  const issues = verifyR76EvidenceV663(input.snapshot,
    input.build, input.http, input.browser, input.source).issues;
  assert.ok(issues.includes("http-default-off-or-identity-invalid"));
  assert.ok(issues.includes("browser-mobileViewport-coverage-or-errors"));
});
test("rejects simulated mobile scene promotion and raw pin drift", () => {
  const input = fresh();
  input.browser.mobileViewport.scene.mobileDetailsCanExpand = false;
  input.source.sourcePinsChecked = 19;
  const issues = verifyR76EvidenceV663(input.snapshot,
    input.build, input.http, input.browser, input.source).issues;
  assert.ok(issues.includes("mobile-scene-lifecycle-invalid"));
  assert.ok(issues.includes("source-replay-invalid"));
});
test("recomputes PNG dimensions and hash before visual evidence", async () => {
  const meta = browser.mobileViewport.scene.screenshots.initial;
  const item = { device: "mobileViewport", kind: "scene-peek", meta };
  const bytes = await readFile(safePathR76V663(meta.path));
  assert.equal(verifyR76ScreenshotV663(item, bytes).ok, true);
  const altered = Buffer.from(bytes);
  altered[altered.length - 1] ^= 1;
  assert.equal(verifyR76ScreenshotV663(item, altered).ok, false);
  assert.equal(verifyR76ScreenshotV663({
    ...item, device: "desktop" }, bytes).ok, false);
});
test("requires four bounded run identities", () => {
  const valid = ["--build-run-id", "20261013v663r76web02",
    "--http-run-id", "20261013v663r76web03",
    "--browser-run-id", "20261013v663r76web05",
    "--source-run-id", "20261013v663r76source02"];
  assert.equal(parseR76EvidenceOptionsV663(valid).browserRunId,
    "20261013v663r76web05");
  assert.throws(() => parseR76EvidenceOptionsV663(
    [...valid.slice(0, 7), "../bad"]));
});
