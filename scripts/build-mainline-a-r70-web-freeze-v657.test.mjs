import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyR70BuildIdentityV657,
  verifyR70ImageResponseV657 } from "./verify-mainline-a-r70-http-v657.mjs";
import { verifyRawClockAgreementV650 } from
  "./capture-mainline-a-web-r65-longrun-v650.mjs";
import { pinCandidateArtifactsV657, pinR70FileV657,
  replayR70FreezeCandidateV657,
  validatePointerMatrixV657, validateReviewMatrixV657,
  validateSkyBrowserV657, validateLongRunsV657,
  validateStageBrowserV657 } from
  "./build-mainline-a-r70-web-freeze-v657.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (relative) => readFile(path.join(ROOT, relative), "utf8")
  .then(JSON.parse);
const BUILD = "docs/release/v607/mainline-a-r70-build-20261012v657web02.json";
const REVIEW = "app/data/mainlineANebulaCandidateReviewV655.generated.json";
const CANONICAL = "app/data/mainlineACanonicalCoverageV622.generated.json";

describe("R70 web-stage candidate evidence checks", () => {
  it("binds the saved production build to its source and slot", async () => {
    const build = await load(BUILD);
    assert.equal(verifyR70BuildIdentityV657(build,
      build.inputAfterSha256).ok, true);
    assert.deepEqual(verifyR70BuildIdentityV657({ ...build,
      runtimeBuildId: "forged" }, build.inputAfterSha256).issues,
    ["source-identity-drift"]);
    assert.equal(verifyR70BuildIdentityV657(build,
      "b".repeat(64)).ok, false);
  });

  it("checks actual local image bytes and rejects forged HTTP boundaries", async () => {
    const review = await load(REVIEW);
    const row = review.rows[0];
    const pin = row.preview.thumb;
    const bytes = await readFile(path.join(ROOT, pin.path));
    const route = `/api/atlas/mainline-a-nebula-review/${row.id}/thumb`;
    const answer = { status: 200, route,
      finalUrl: `http://127.0.0.1:3101${route}`,
      contentType: "image/webp", contentLength: String(pin.bytes),
      bytes: pin.bytes, sha256: pin.sha256,
      shaHeader: pin.sha256, rawShaHeader: row.candidateRaw.sha256,
      rights: "pending", review: "candidate-hold",
      writeback: "false", cacheControl: "private, no-store" };
    assert.equal(verifyR70ImageResponseV657(row, "thumb", answer,
      bytes).ok, true);
    assert.deepEqual(verifyR70ImageResponseV657(row, "thumb",
      { ...answer, rights: "approved", writeback: "true" },
      bytes).issues, ["http-boundary-header-mismatch"]);
    assert.deepEqual(verifyR70ImageResponseV657(row, "thumb",
      { ...answer, sha256: "b".repeat(64) }, bytes).issues,
    ["http-image-byte-mismatch"]);
  });

  it("recomputes every retained source page, JPEG and preview pin", async () => {
    const review = await load(REVIEW);
    const pins = await pinCandidateArtifactsV657(review);
    assert.equal(pins.length, 60);
    assert.equal(pins.filter((row) => row.path.endsWith(".html")).length, 12);
    assert.equal(pins.filter((row) => row.path.endsWith(".jpg")).length, 24);
    assert.equal(pins.filter((row) => row.path.endsWith(".webp")).length, 24);
    assert.equal(new Set(pins.map((row) => row.path)).size, 60);
    assert.ok(pins.every((row) => /^[a-f0-9]{64}$/.test(row.sha256)));
  });

  it("rejects a forged raw pin and a path escaping the inner repository", async () => {
    const review = await load(REVIEW);
    await assert.rejects(() => pinR70FileV657(
      review.rows[0].candidateRaw.path, "external-source",
      "0".repeat(64)), /pin-hash-mismatch/);
    await assert.rejects(() => pinR70FileV657(
      "../AGENTS.md", "static"), /evidence-path-outside-workspace/);
  });

  it("requires complete 12/12/12 canonical pointer identity", async () => {
    const [build, canonical] = await Promise.all([
      load(BUILD), load(CANONICAL),
    ]);
    const matrix = { schema: "mainline-a-r70-web-pointer-matrix-v657",
      evidenceClass: "browser", device: "desktop",
      build: { buildId: build.buildId,
        runtimeBuildId: build.runtimeBuildId,
        sourceSha256: build.inputAfterSha256 },
      boundary: { scientificPayloadWriteback: false },
      claims: { realUserValidation: false,
        productionPerformance: false, publicWebReleaseApproved: false },
      items: canonical.records.map((row) => ({
        key: `${row.kind}:${row.id}`,
        observed: { runtimeBuildId: build.runtimeBuildId,
          releaseBoundary: "candidate-only-hold-not-admitted",
          scientificPayloadWriteback: "false", visibility: "visible" },
        screenshot: { path: "test-only.png", sha256: "a".repeat(64) },
      })) };
    assert.equal(validatePointerMatrixV657(matrix,
      canonical, "desktop", build).ok, true);
    matrix.items.pop();
    assert.ok(validatePointerMatrixV657(matrix,
      canonical, "desktop", build).issues.includes(
      "canonical-selection-incomplete"));
  });

  it("refuses browser receipts that hide leaks or promote rights", async () => {
    const [build, review] = await Promise.all([load(BUILD), load(REVIEW)]);
    const selections = review.rows.map((row) => ({ id: row.id }));
    const device = { selections, released: { active: 0,
      created: 15, revoked: 15 }, pageErrors: [] };
    const matrix = { schema: "mainline-a-r70-nebula-review-matrix-v657",
      status: "passed-twelve-details-per-viewport",
      buildId: build.buildId, sourceSha256: build.inputAfterSha256,
      totals: { selections: 24, pageErrors: 0,
        leakedReviewBlobUrls: 0 },
      desktop: device, mobileViewport: device,
      claims: { copyrightApproval: false } };
    assert.equal(validateReviewMatrixV657(matrix, review, build).ok, true);
    assert.equal(validateReviewMatrixV657({ ...matrix,
      mobileViewport: { ...device, released: {
        active: 1, created: 15, revoked: 14 } } },
    review, build).ok, false);
  });

  it("requires both sky viewports and never accepts a release claim", async () => {
    const build = await load(BUILD);
    const device = { starSelections: Array.from({ length: 24 },
      (_, index) => ({ id: String(index) })),
    constellationSelections: Array.from({ length: 12 },
      (_, index) => ({ code: String(index) })),
    requests: { active: 0, started: 2, completed: 2 },
    pageErrors: [] };
    const report = { schema: "mainline-a-r70-web-sky-browser-v657",
      status: "passed-local-desktop-and-mobile-viewport",
      buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
      appSourceSha256: build.inputAfterSha256,
      totals: { starCardSelections: 48,
        constellationChartSelections: 24,
        holdFocusAttemptsAllowed: 0, pageErrors: 0 },
      desktop: device, mobileViewport: device,
      claims: { scientificValidity: false,
        publicWebReleaseApproved: false } };
    assert.equal(validateSkyBrowserV657(report, build).ok, true);
    assert.equal(validateSkyBrowserV657({ ...report,
      claims: { ...report.claims,
        publicWebReleaseApproved: true } }, build).ok, false);
  });

  it("verifies a historical qualified observation as a validator fixture, then rejects a short run", async () => {
    const [build, desktop, final] = await Promise.all([
      load("docs/release/v607/mainline-a-r66-build-20261011-v649web02.json"),
      load("docs/release/v607/mainline-a-r66-web-r65-browser-desktop-raw-20261011-v650long01.json"),
      load("docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261011-v650long01.json"),
    ]);
    const checked = validateLongRunsV657(final, desktop, build);
    assert.equal(checked.ok, true, JSON.stringify(checked.issues));
    assert.deepEqual(checked.observations.map((row) => row.device),
      ["desktop", "mobile-viewport"]);
    const forged = structuredClone(final);
    forged.observations[1].observedDurationMs = 30;
    const rejected = validateLongRunsV657(forged, desktop, build);
    assert.equal(rejected.ok, false);
    assert.ok(rejected.issues.includes(
      "independent-longrun-duration-or-resource-invalid"));
  });

  it("rejects real wall and monotonic clock drift before a second long run", async () => {
    const [qualified, drifted] = await Promise.all([
      load("docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261011-v650long01.json"),
      load("docs/release/v607/mainline-a-r70-v657-browser-desktop-raw-20261012-v657long02.json"),
    ]);
    assert.equal(verifyRawClockAgreementV650(qualified).ok, true);
    const checked = verifyRawClockAgreementV650(drifted);
    assert.equal(checked.ok, false);
    assert.ok(checked.issues.includes(
      "observation-0:clock-disagreement"));
    assert.ok(checked.issues.includes(
      "observation-0:resource-time-final"));
  });

  it("requires the new stage panel to keep the web-only release gate closed", async () => {
    const build = await load(BUILD);
    const device = { candidateRows: 12, b1Filtered: 6,
      b2Filtered: 6, byteVariantsFiltered: 11,
      sourceLinkMatched: true, emptySearchState: true,
      selectedCatalogUnchanged: true, closed: true,
      pageErrors: [], layout: { searchWidth: 320 }, screenshots: {
        overview: { path: "fixture-overview.png" },
        detail: { path: "fixture-detail.png" },
      } };
    const report = { schema: "mainline-a-r70-web-stage-browser-v657",
      status: "passed-local-desktop-and-mobile-viewport",
      buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
      sourceSha256: build.inputAfterSha256,
      totals: { stageCandidateSelections: 2,
        sourceLinksMatched: 2, pageErrors: 0 },
      desktop: device, mobileViewport: device,
      claims: { copyrightApproval: false,
        publicWebReleaseApproved: false } };
    assert.equal(validateStageBrowserV657(report, build).ok, true);
    assert.equal(validateStageBrowserV657({ ...report,
      mobileViewport: { ...device,
        layout: { searchWidth: 24 } } }, build).ok, false);
    assert.equal(validateStageBrowserV657({ ...report,
      claims: { ...report.claims,
        publicWebReleaseApproved: true } }, build).ok, false);
  });

  it("binds the actual current-build browser matrices before packaging", async () => {
    const paths = {
      desktop: "docs/release/v607/mainline-a-r70-v657-pointer-desktop-raw-20261012-v657pointer03.json",
      mobile: "docs/release/v607/mainline-a-r70-v657-pointer-mobile-raw-20261012-v657pointer03.json",
      review: "docs/release/v607/mainline-a-r70-v657-review-browser-matrix-20261012v657web02.json",
      sky: "docs/release/v607/mainline-a-r70-v657-sky-browser-20261012v657web02.json",
      stage: "docs/release/v607/mainline-a-r70-v657-stage-browser-20261012v657web02.json",
    };
    const [build, canonical, review, desktop, mobile, reviewBrowser,
      skyBrowser, stageBrowser] = await Promise.all([
      load(BUILD), load(CANONICAL), load(REVIEW),
      ...Object.values(paths).map(load),
    ]);
    assert.equal(validatePointerMatrixV657(desktop,
      canonical, "desktop", build).ok, true);
    assert.equal(validatePointerMatrixV657(mobile,
      canonical, "mobile", build).ok, true);
    assert.equal(validateReviewMatrixV657(reviewBrowser,
      review, build).ok, true);
    assert.equal(validateSkyBrowserV657(skyBrowser, build).ok, true);
    assert.equal(validateStageBrowserV657(stageBrowser, build).ok, true);
  });

  it("replay keeps every candidate gate closed", () => {
    const fresh = { schema: "mainline-a-r70-web-freeze-candidate-v657",
      status: "technical-candidate-evidence-complete-release-blocked",
      generatedAt: "2026-10-12T00:00:00Z",
      gates: { publicWebRelease: "blocked" },
      claims: { releaseApproved: false,
        scientificPayloadWriteback: false },
      sourceSha256: "a".repeat(64), buildId: "test-build",
      candidateArtifacts: [] };
    assert.equal(replayR70FreezeCandidateV657({ ...fresh,
      generatedAt: "2026-10-12T01:00:00Z" }, fresh).status,
    "replayed-current-source-candidate");
    assert.throws(() => replayR70FreezeCandidateV657({ ...fresh,
      gates: { publicWebRelease: "approved" } }, fresh),
    /saved-candidate-replay-mismatch/);
  });
});
