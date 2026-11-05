import assert from "node:assert/strict";
import test from "node:test";
import { M2_A12, M2_ALIASES } from "./capture-mainline-a-m2-browser.mjs";
import { M3_A12 } from "./capture-mainline-a-m3-browser.mjs";
import { M4_A12 } from "./capture-mainline-a-m4-browser.mjs";
import { inspectM5Matrix, parseM5GalleryOptions } from "./render-mainline-a-m5-gallery.mjs";

// Deliberately synthetic schema fixture; it never supplies PNG bytes or actual browser evidence.
function fixture() {
  const build = { buildId: "fixture-build", runtimeBuildId: "fixture-runtime", sourceSha256: "a".repeat(64), branch: "fixture", head: "b".repeat(40) };
  const base = () => ({ build: { ...build }, binding: { sourceScope: "current-source-before-and-after", sourceAfterSha256: build.sourceSha256,
    buildReceiptSha256: "c".repeat(64) }, errors: [], physicalDevice: false, claims: { humanVisualSignoff: false, publicReleaseApproved: false,
      copyrightApproval: false, scientificValidity: false, productionPerformance: false } });
  const observed = (selectedId, device) => ({ selectedId, runtimeBuildId: build.runtimeBuildId, branch: build.branch, head: build.head,
    releaseBoundary: "candidate-only-hold-not-admitted", scientificPayloadWriteback: "false", viewport: device === "desktop" ? [1280, 720] : [390, 844] });
  const star = (id, device, selectedId = `stellar-hero:${id}`) => ({ id, device, selectedId, errors: [], behaviors: { complete: true },
    views: ["default", "comparison"].map((mode) => ({ mode, issues: [], observed: { ...observed(selectedId, device),
      proxy: { "data-mainline-a-stellar-presentation-sha256": `fixture-${id}` } } })) });
  const constellation = (code, device) => ({ ...observed(`constellation:${code}`, device),
    passportState: device === "mobile" ? "collapsed" : "half", artExpanded: "false", chart: null, orbitAtlasLabelIds: [],
    camera: { position: [10, 20, 30], target: [1, 2, 3], direction: [0, 0, -1], up: [0, 1, 0],
      quaternion: [0, 0, 0, 1], fov: 52, zoom: 1, targetDistance: 9553.313, focusState: "locked" },
    scene: { code, state: "ready", segments: 8, visibleSegments: 8, anchors: 7, source: "candidate-only",
      lineWidth: device === "mobile" ? 1.8 : 1.65, boundaryCode: code, boundaryStyle: "dashed",
      boundaryVisible: true, boundaryOpacity: .42, boundarySegments: 28 } });
  return {
    stars: { ...base(), status: "passed-a12-two-viewports-default-and-comparison-candidate-only",
      items: ["desktop", "mobile"].flatMap((device) => M2_A12.map((id) => star(id, device))),
      aliasItems: M2_ALIASES.map(({ id, selectedId }) => star(id, "desktop", selectedId)) },
    constellations: { ...base(), scope: "full", status: "passed-constellations-and-journey-candidate-only",
      items: ["desktop", "mobile"].flatMap((device) => M4_A12.map((code) => ({ code, device, errors: [],
        preChart: { observed: { ...constellation(code, device), passportState: "half" },
          cameraStability: { status: "actual-focus-locked-and-pose-stable" } },
        comparisonReturn: { validation: { ok: true, issues: [] }, observed: constellation(code, device),
          cameraStability: { status: "actual-focus-locked-and-pose-stable" } },
        views: ["default", "comparison", "boundary"].map((mode) => ({ name: `${device}-${code}-${mode}`, issues: [],
          observed: { ...constellation(code, device), ...(mode !== "default" ? { passportState: "details", artExpanded: "true",
            chart: { code, source: "candidate-only", writeback: "false", visibleRatio: 1, lines: 8, anchors: 7,
              lineWidth: device === "mobile" ? 1.8 : 1.65, lineColor: "#b9dff6", lineOpacity: device === "mobile" ? .78 : .7,
              boundary: mode === "boundary" ? { code, color: "#8a9cad", dash: "4 5", points: 28 } : null } } : {}) } })) }))),
      journeys: ["desktop", "mobile", "narrow", "reduced-motion"].map((profile) => ({ profile, checks: { complete: true }, errors: [],
        poseReturn: { ok: true }, returnVisibility: { ok: true, issues: [] }, views: ["station-0", "station-1", "station-2", "station-3", "station-4", "story-expanded-1", "previous-1", "external-sirius-paused", "resumed-2", "returned"]
          .map((name) => ({ name: `${profile}-journey-${name}`, issues: [], observed: { base: { runtimeBuildId: build.runtimeBuildId } } })) })) },
    nebulae: { ...base(), status: "passed-a12-nebula-viewer-and-faults-candidate-only", assets: M3_A12.map((id) => ({ id, sha256: `fixture-${id}` })),
      items: ["desktop", "mobile"].flatMap((device) => M3_A12.map((id) => ({ id, device, errors: [], behaviors: { complete: true }, viewer: { checks: { complete: true } },
        views: ["default", "viewer-fit", "viewer-2x", "viewer-sources", "sources"].map((mode) => ({ mode, issues: [], observed: { ...observed(`nebula:${id}`, device),
          nebula: { id, rights: "pending", admission: "candidate-only", sha256: `fixture-${id}` } } })) }))),
      faults: ["desktop", "mobile"].flatMap((device) => ["slow-cancel-retry", "http-failure-retry", "timeout-retry", "late-response-switch"].map((scenario) => ({
        device, scenario, checks: { complete: true }, unexpectedErrors: [], final: { runtimeBuildId: build.runtimeBuildId },
        screenshots: Array.from({ length: scenario === "slow-cancel-retry" ? 3 : 2 }, () => ({ fixture: true })) }))) },
  };
}

test("A36 aggregator only accepts complete same-build candidate matrices", () => {
  const result = inspectM5Matrix(fixture());
  assert.equal(result.objects, 36); assert.equal(result.deviceGroups, 72); assert.equal(result.canonicalImages, 240);
});

test("mixed historical build/source and probe-only receipts cannot become final evidence", () => {
  for (const mutate of [
    (r) => { r.nebulae.build.sourceSha256 = "d".repeat(64); },
    (r) => { r.constellations.build.buildId = "old-build"; },
    (r) => { r.stars.binding.sourceAfterSha256 = "e".repeat(64); },
    (r) => { r.nebulae.binding.sourceScope = "frozen-baseline-inputs"; },
    (r) => { r.nebulae.binding.buildReceiptSha256 = "f".repeat(64); },
    (r) => { r.constellations.status = "passed-journey-probe-candidate-only"; },
    (r) => { r.constellations.scope = "journey-probe"; },
  ]) { const receipts = fixture(); mutate(receipts); assert.throws(() => inspectM5Matrix(receipts)); }
});

test("missing/duplicate objects, wrong state identity, viewport and authority are rejected", () => {
  for (const mutate of [
    (r) => { r.stars.items.pop(); },
    (r) => { r.nebulae.items[0] = r.nebulae.items[1]; },
    (r) => { r.constellations.items[0].views[0].observed.selectedId = "constellation:Sco"; },
    (r) => { r.stars.items[0].views[0].observed.viewport = [1440, 900]; },
    (r) => { r.nebulae.items[0].views[0].observed.nebula.sha256 = "wrong"; },
    (r) => { r.stars.items[0].views[0].issues.push("missing"); },
    (r) => { r.stars.claims.publicReleaseApproved = true; },
    (r) => { r.nebulae.claims.copyrightApproval = true; },
    (r) => { r.constellations.claims.productionPerformance = true; },
    (r) => { r.nebulae.items[0].views[0].observed.scientificPayloadWriteback = "true"; },
  ]) { const receipts = fixture(); mutate(receipts); assert.throws(() => inspectM5Matrix(receipts)); }
});

test("alias identity, controlled faults, restored pose and story-expanded coverage remain required", () => {
  for (const mutate of [
    (r) => { r.stars.aliasItems[0].selectedId = "nearby-star:wrong"; },
    (r) => { r.stars.aliasItems[0].views[0].observed.proxy["data-mainline-a-stellar-presentation-sha256"] = "wrong"; },
    (r) => { r.nebulae.faults.pop(); },
    (r) => { r.nebulae.faults[0].unexpectedErrors.push("GL error"); },
    (r) => { r.constellations.journeys[0].poseReturn.ok = false; },
    (r) => { r.constellations.journeys[0].returnVisibility.ok = false; },
    (r) => { r.constellations.journeys[1].views[0].name = "mobile-journey-station-1"; },
  ]) { const receipts = fixture(); mutate(receipts); assert.throws(() => inspectM5Matrix(receipts)); }
});

test("gallery paths stay within dedicated output directories and reject ambiguous arguments", () => {
  assert.equal(parseM5GalleryOptions([]).outputDir, "output/playwright/mainline-a-m5-20261015");
  for (const output of ["../out", "output/playwright/../other", "output/playwright/nested/path", "C:/tmp", "output\\playwright\\bad"]) {
    assert.throws(() => parseM5GalleryOptions(["--output-dir", output]), /unsafe-output/);
  }
  assert.throws(() => parseM5GalleryOptions(["--stars", "output/playwright/mainline-a-m2-20261015/before/receipt.json"]), /unsafe-receipt/);
  assert.throws(() => parseM5GalleryOptions(["--output-dir"]), /invalid-or-duplicate/);
  assert.throws(() => parseM5GalleryOptions(["--output-dir", "output/playwright/one", "--output-dir", "output/playwright/two"]), /invalid-or-duplicate/);
});

test("every constellation requires a completed comparison-return gate and independently matching actual pose", () => {
  for (const mutate of [
    (r) => { delete r.constellations.items[0].comparisonReturn; },
    (r) => { r.constellations.items[23].comparisonReturn.validation.ok = false; },
    (r) => { r.constellations.items[0].comparisonReturn.validation.issues.push("actual-distance-not-restored"); },
    (r) => { r.constellations.items[0].comparisonReturn.cameraStability.status = "moving"; },
    (r) => { r.constellations.items[0].comparisonReturn.observed.camera.targetDistance = 38213.250; },
    (r) => { r.constellations.items[0].comparisonReturn.observed.camera.direction = [1, 0, 0]; },
  ]) { const receipts = fixture(); mutate(receipts); assert.throws(() => inspectM5Matrix(receipts), /comparison-return/); }
});

test("gallery recomputes full-chart occlusion and pose rather than trusting a stored exception disposition", () => {
  const receipts = fixture(); const item = receipts.constellations.items.find((entry) => entry.device === "mobile" && entry.code === "Ori");
  const view = item.views[1].observed;
  view.scene.state = "unobserved"; view.scene.visibleSegments = 0;
  view.sceneVisibility = { allowed: true, disposition: "chart-primary-scene-occluded" };
  assert.throws(() => inspectM5Matrix(receipts), /scene-or-measured-chart-occlusion/);
  view.occlusionMeasurement = { canvas: { x: 0, y: 0, width: 390, height: 844 }, viewport: { x: 0, y: 0, width: 390, height: 844 }, blockers: [
    { kind: "navigation", rect: { x: 10, y: 8, width: 370, height: 61.8125 } },
    { kind: "passport", rect: { x: 8, y: 78.8125, width: 374, height: 675.1875 } },
    { kind: "footer", rect: { x: 0, y: 766, width: 390, height: 78 } },
  ] };
  assert.equal(inspectM5Matrix(receipts).objects, 36);
  view.camera.targetDistance = 1916020.220;
  assert.throws(() => inspectM5Matrix(receipts), /scene-or-measured-chart-occlusion/);
});
