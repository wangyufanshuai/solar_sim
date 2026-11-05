import assert from "node:assert/strict";
import test from "node:test";
import { buildR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";
import { inspectR79BrowserReceiptV666,
  parseR79BrowserOptionsV666 } from
  "./capture-mainline-a-r79-browser-v666.mjs";

const audit = buildR79VisualAuditV666("20261013v666r79visual01");
const imageKeys = ["a:nebula:m42",
  "beta:nebula:heart-nebula", "beta:nebula:w40-nebula",
  "beta:nebula:california-nebula"];

function observation(device, mode, pins) {
  const origin = mode === "enabled"
    ? "http://127.0.0.1:3134" : "http://127.0.0.1:3135";
  const viewport = device === "desktop"
    ? { width: 1280, height: 720 }
    : { width: 390, height: 844 };
  const byKey = new Map(pins.images.map((pin) => [pin.key, pin]));
  const observed = mode === "enabled"
    ? imageKeys.map((key) => ({ key,
      sha256: byKey.get(key).sha256,
      manuallyLoaded: true, removedAfterRelease: true }))
    : [{ key: "beta:nebula:heart-nebula",
      expectedFailure: "http-unavailable", httpStatus: 404 }];
  return { device, mode, origin, viewport,
    layout: { viewportWidth: viewport.width,
      documentWidth: viewport.width, dialogWidth: viewport.width - 10,
      dialogScrollWidth: viewport.width - 10 },
    observed,
    screenshots: [{ path: "docs/release/v607/sample.png",
      bytes: 1200, sha256: "a".repeat(64), device, viewport }],
    reviewRequests: mode === "enabled"
      ? imageKeys.map((key) => origin + byKey.get(key).route)
      : [origin + byKey.get("beta:nebula:heart-nebula").route],
    pageErrors: [], unexpectedConsoleErrors: [],
    unexpected404Urls: [],
    diagnostic: { count: 120, p95IntervalMs: 6 },
    physicalDevice: false, focusedMatrixLayout: true,
    restoredCandidateDetails: true,
    sceneChangedByReview: false };
}

function receipt(pins) {
  return { schema: "mainline-a-r79-browser-v666",
    status: "passed-local-current-source-candidate-hold",
    appSourceSha256: pins.appSourceSha256,
    observations: [observation("desktop", "enabled", pins),
      observation("mobile-viewport", "enabled", pins),
      observation("mobile-viewport", "default-off", pins)],
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { productionPerformance: false,
      humanVisualSignoff: false } };
}

test("accepts only a bounded two-port browser run", () => {
  const args = ["--run-id", "20261013v666r79browser01",
    "--enabled-port", "3134", "--default-off-port", "3135",
    "--build-run-id", "20261013v666r79web01",
    "--audit-run-id", "20261013v666r79visual01"];
  assert.equal(parseR79BrowserOptionsV666(args).enabledPort, 3134);
  assert.throws(() => parseR79BrowserOptionsV666([
    ...args.slice(0, 5), "3134", ...args.slice(6)]));
  assert.throws(() => parseR79BrowserOptionsV666([
    ...args.slice(0, 1), "../escape", ...args.slice(2)]));
});

test("requires two enabled viewports and one real default-off failure", async () => {
  const pins = await audit;
  assert.equal(inspectR79BrowserReceiptV666(receipt(pins), pins).ok,
    true);
});

test("rejects a forged completed image cycle or held image request", async () => {
  const pins = await audit;
  const value = receipt(pins);
  value.observations[0].observed[0].removedAfterRelease = false;
  value.observations[1].reviewRequests.push(
    value.observations[1].origin
      + "/api/atlas/mainline-a-nebula-review/ring-nebula/detail");
  const inspected = inspectR79BrowserReceiptV666(value, pins);
  assert.equal(inspected.ok, false);
  assert.ok(inspected.issues.some((issue) =>
    issue.startsWith("manual-image-cycle")));
  assert.ok(inspected.issues.some((issue) =>
    issue.startsWith("held-object-requested")));
});

test("rejects swapped build source, fake human signoff and missing viewport", async () => {
  const pins = await audit;
  const value = receipt(pins);
  value.appSourceSha256 = "0".repeat(64);
  value.claims.humanVisualSignoff = true;
  value.observations[2].device = "desktop";
  const inspected = inspectR79BrowserReceiptV666(value, pins);
  assert.equal(inspected.ok, false);
  assert.ok(inspected.issues.includes("visual-audit-or-source"));
  assert.ok(inspected.issues.includes("device-mode-identity"));
  assert.ok(inspected.issues.includes("boundary-or-claims"));
});

test("rejects a screenshot pin and a concealed page error", async () => {
  const pins = await audit;
  const value = receipt(pins);
  value.observations[0].screenshots[0].sha256 = "invalid";
  value.observations[0].pageErrors.push("canvas failed");
  const inspected = inspectR79BrowserReceiptV666(value, pins);
  assert.equal(inspected.ok, false);
  assert.ok(inspected.issues.some((issue) =>
    issue.startsWith("screenshot-pin")));
  assert.ok(inspected.issues.some((issue) =>
    issue.startsWith("browser-observation")));
});
