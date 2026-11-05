import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inspectR80BrowserV667,
  parseR80BrowserOptionsV667,
  verifyR80ScreenshotsV667 } from
  "./capture-mainline-a-r80-browser-v667.mjs";

const audit = JSON.parse(await readFile(
  "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + "20261013v666r79visual04.json", "utf8"));
const source = audit.appSourceSha256;

function mockEnabled(device) {
  const origin = "http://127.0.0.1:3136";
  const viewport = device === "desktop"
    ? { width: 1280, height: 720 }
    : { width: 390, height: 844 };
  const screenshots = audit.images.map((pin) => ({
    key: pin.key, device,
    path: "docs/release/v607/test-" + device + "-"
      + pin.key.replaceAll(":", "-") + ".png",
    bytes: 100, sha256: "a".repeat(64),
    width: 320, height: 480 }));
  return { device, mode: "enabled", origin, viewport,
    cycles: audit.images.map((pin, index) => ({
      key: pin.key, route: pin.route,
      sha256: pin.sha256, bytes: pin.bytes,
      width: pin.width, height: pin.height,
      mimeType: pin.mimeType, httpStatus: 200,
      imageWasVisible: true,
      imageRemovedAfterRelease: true,
      progressAfterRelease: index + 1,
      screenshot: screenshots[index] })),
    screenshots,
    contextScreenshot: { device,
      variant: "review-context",
      path: "docs/release/v607/test-" + device + "-context.png",
      bytes: 100, sha256: "c".repeat(64),
      width: viewport.width, height: viewport.height },
    queueComplete: true,
    manualRequests: audit.images.map((pin) =>
      origin + pin.route),
    held: ["beta:nebula:ring-nebula", "beta:star:acrux"]
      .map((key) => ({ key, requestAllowed: false,
        imageRequestCount: 0 })),
    pageErrors: [], unexpectedConsoleErrors: [],
    unexpected404Urls: [],
    sceneChangedByReview: false,
    physicalDevice: false,
    layout: { viewportWidth: viewport.width,
      documentWidth: viewport.width,
      dialogWidth: viewport.width - 20,
      dialogScrollWidth: viewport.width - 20,
      matrixWidth: viewport.width - 40,
      matrixScrollWidth: viewport.width - 40 },
    diagnostic: { count: 120 } };
}

function mockReceipt() {
  return {
    schema: "mainline-a-r80-browser-v667",
    status: "passed-31-image-cycles-two-viewports",
    appSourceSha256: source,
    buildId: "local-build",
    runtimeBuildId: "mainline-a-" + source.slice(0, 16),
    build: { buildId: "local-build",
      runtimeBuildId: "mainline-a-" + source.slice(0, 16) },
    observations: [mockEnabled("desktop"),
      mockEnabled("mobile-viewport"), {
        device: "mobile-viewport", mode: "default-off",
        origin: "http://127.0.0.1:3137",
        viewport: { width: 390, height: 844 },
        key: "beta:nebula:heart-nebula",
        httpStatus: 404, localCoverageCount: 0,
        manualRequests: ["http://127.0.0.1:3137/api/atlas/"
          + "mainline-a-nebula-review/heart-nebula/detail"],
        screenshot: { device: "mobile-viewport",
          path: "docs/release/v607/test-default-off.png",
          bytes: 100, sha256: "b".repeat(64),
          width: 390, height: 844 },
        pageErrors: [], unexpectedConsoleErrors: [],
        unexpected404Urls: [],
        sceneChangedByReview: false,
        physicalDevice: false,
        layout: { viewportWidth: 390,
          documentWidth: 390,
          dialogWidth: 370, dialogScrollWidth: 370,
          matrixWidth: 350, matrixScrollWidth: 350 },
        diagnostic: { count: 120 },
      }],
    boundary: { candidateOnly: true, hold: true,
      notAdmitted: true, scientificPayloadWriteback: false,
      publicWebReleaseApproved: false },
    claims: { humanVisualSignoff: false,
      copyrightApproval: false,
      scientificValidity: false,
      realUserValidation: false,
      productionPerformance: false },
  };
}

test("R80 browser parser binds one build and two local preview modes", () => {
  const parsed = parseR80BrowserOptionsV667([
    "--run-id", "20261013v667r80browser01",
    "--enabled-port", "3136", "--default-off-port", "3137",
    "--build-run-id", "20261013v667r80web01",
    "--audit-run-id", "20261013v666r79visual04",
  ]);
  assert.equal(parsed.enabledOrigin, "http://127.0.0.1:3136");
  assert.equal(parsed.defaultOffOrigin, "http://127.0.0.1:3137");
  assert.throws(() => parseR80BrowserOptionsV667([
    "--run-id", "20261013v667r80browser01",
    "--enabled-port", "3136", "--default-off-port", "3136",
    "--build-run-id", "20261013v667r80web01",
    "--audit-run-id", "20261013v666r79visual04",
  ]), /r80-browser:run-id-or-ports/);
});

test("R80 browser verifier requires 62 complete image cycles", () => {
  const result = inspectR80BrowserV667(mockReceipt(), audit);
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.imageCycles, 62);
  assert.equal(result.humanVisualSignoff, false);
});

test("R80 browser verifier rejects an omitted image and invented release", () => {
  const receipt = mockReceipt();
  receipt.observations[0].cycles.pop();
  receipt.observations[1].cycles[0].imageRemovedAfterRelease = false;
  const result = inspectR80BrowserV667(receipt, audit);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("full-cycle-coverage:")));
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("image-cycle:")));
});

test("R80 browser verifier rejects a forged response digest", () => {
  const receipt = mockReceipt();
  receipt.observations[0].cycles[0].sha256 = "0".repeat(64);
  assert.ok(inspectR80BrowserV667(receipt, audit).issues.some((issue) =>
    issue.startsWith("image-cycle:")));
});

test("R80 browser verifier rejects held requests and approval claims", () => {
  const receipt = mockReceipt();
  receipt.observations[0].manualRequests[0] =
    "http://127.0.0.1:3136/api/atlas/"
      + "mainline-a-nebula-review/ring-nebula/detail";
  receipt.claims.humanVisualSignoff = true;
  const result = inspectR80BrowserV667(receipt, audit);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("queue-or-hold:")));
  assert.ok(result.issues.includes("boundary-or-claim-promotion"));
});

test("R80 screenshot replay rejects absent files instead of promoting mocks", async () => {
  const result = await verifyR80ScreenshotsV667(mockReceipt());
  assert.equal(result.ok, false);
  assert.equal(result.screenshotCount, 65);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("screenshot-unreadable:")));
});
