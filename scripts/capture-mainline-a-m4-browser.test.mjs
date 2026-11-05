import assert from "node:assert/strict";
import test from "node:test";
import { M4_A12, M4_STOPS, captureM4, compareM4CameraPose, inspectM4ComparisonReturn, inspectM4Constellation, inspectM4Journey, inspectM4ReturnVisibility, inspectM4ChartOcclusion, measureM4AvailableSky, m4Scene, parseM4Options } from "./capture-mainline-a-m4-browser.mjs";

test("M4 roster and five real catalogue identities stay fixed", () => {
  assert.equal(M4_A12.length, 12); assert.equal(new Set(M4_A12).size, 12);
  assert.equal(m4Scene("Sgr").selectedId, "constellation:Sgr");
  assert.throws(() => m4Scene("And"), /outside-a12/);
  assert.deepEqual(M4_STOPS, ["constellation:Ori", "nebula:m42", "nebula:b33", "nearby-star:betelgeuse", "nearby-star:rigel"]);
});

test("M4 only admits explicit local after captures", () => {
  const args = ["--phase", "after", "--origin", "http://127.0.0.1:3148", "--build-receipt", "docs/release/build.json"];
  assert.equal(parseM4Options(args).phase, "after");
  assert.equal(parseM4Options([...args, "--scope", "journey-probe"]).scope, "journey-probe");
  assert.equal(parseM4Options([...args, "--scope", "journey-probe", "--probe-profile", "mobile"]).probeProfile, "mobile");
  assert.throws(() => parseM4Options([...args, "--probe-profile", "mobile"]), /profile-requires-probe/);
  assert.throws(() => parseM4Options([...args, "--scope", "journey-probe", "--probe-profile", "unknown"]), /invalid-probe-profile/);
  assert.throws(() => parseM4Options([...args, "--scope", "short"]), /invalid-scope/);
  assert.throws(() => parseM4Options(args.map((value) => value === "after" ? "before" : value)), /after-phase/);
  assert.throws(() => parseM4Options(args.map((value) => value.startsWith("http:") ? "https://example.org" : value)), /local-origin/);
});

test("M4 output directories remain explicit, isolated and traversal-free for CLI and direct callers", async () => {
  const args = ["--phase", "after", "--origin", "http://127.0.0.1:3151", "--build-receipt", "docs/release/build.json"];
  const outputDir = "output/playwright/mainline-a-m4-final-20261018";
  assert.equal(parseM4Options(args).outputDir, "output/playwright/mainline-a-m4-20261015");
  assert.equal(parseM4Options([...args, "--output-dir", outputDir]).outputDir, outputDir);
  const probe = parseM4Options([...args, "--output-dir", outputDir, "--scope", "journey-probe", "--probe-profile", "mobile"]);
  assert.equal(probe.outputDir, outputDir); assert.equal(probe.scope, "journey-probe"); assert.equal(probe.probeProfile, "mobile");
  assert.throws(() => parseM4Options([...args, "--output-dir", outputDir, "--output-dir", outputDir]), /duplicate-output-directory/);
  assert.throws(() => parseM4Options([...args, "--output-dir"]), /invalid-output-directory/);
  for (const invalid of ["../out", "output/playwright/../other", "output/playwright/nested/path", "C:/tmp", "output\\playwright\\bad", "output/playwright/"]) {
    assert.throws(() => parseM4Options([...args, "--output-dir", invalid]), /invalid-output-directory/);
    await assert.rejects(captureM4({ outputDir: invalid }), /invalid-output-directory/);
  }
});

test("constellation capture requires actual complete draw and the selected IAU boundary", () => {
  const scene = { code: "Ori", state: "ready", segments: 10, visibleSegments: 10, anchors: 8, source: "candidate-only",
    lineWidth: 1.65, boundaryCode: "Ori", boundaryStyle: "dashed", boundaryVisible: true, boundaryOpacity: .42, boundarySegments: 20 };
  assert.deepEqual(inspectM4Constellation({ scene, chart: null, orbitAtlasLabelIds: [] }, "Ori", false, "default"), []);
  for (const patch of [{ state: "awaiting-draw" }, { visibleSegments: 9 }, { boundaryCode: "all" }, { boundaryVisible: false },
    { boundarySegments: 0 }, { lineWidth: 1.8 }]) assert.ok(inspectM4Constellation({ scene: { ...scene, ...patch }, chart: null, orbitAtlasLabelIds: [] }, "Ori", false, "default").length);
  const chart = { code: "Ori", source: "candidate-only", writeback: "false", visibleRatio: 1, lines: 10, anchors: 8,
    lineWidth: 1.65, lineColor: "#b9dff6", lineOpacity: .7,
    boundary: { code: "Ori", color: "#8a9cad", dash: "4 5", points: 20 } };
  assert.deepEqual(inspectM4Constellation({ scene, chart, orbitAtlasLabelIds: [] }, "Ori", false, "boundary"), []);
  for (const patch of [{ lines: 11 }, { visibleRatio: .5 }, { writeback: "true" }, { boundary: null }, { lineColor: "red" }]) {
    assert.ok(inspectM4Constellation({ scene, chart: { ...chart, ...patch }, orbitAtlasLabelIds: [] }, "Ori", false, "boundary").length);
  }
});

test("focused constellations reject missing DOM label observations and any mounted solar-system labels", () => {
  for (const mobile of [false, true]) {
    const scene = { code: "UMa", state: "ready", segments: 7, visibleSegments: 7, anchors: 7, source: "candidate-only",
      lineWidth: mobile ? 1.8 : 1.65, boundaryCode: "UMa", boundaryStyle: "dashed", boundaryVisible: true, boundaryOpacity: .42, boundarySegments: 20 };
    const chart = { code: "UMa", source: "candidate-only", writeback: "false", visibleRatio: 1, lines: 7, anchors: 7,
      lineWidth: scene.lineWidth, lineColor: "#b9dff6", lineOpacity: mobile ? .78 : .7,
      boundary: { code: "UMa", color: "#8a9cad", dash: "4 5", points: 20 } };
    for (const mode of ["default", "comparison", "boundary"]) {
      const view = { scene, chart: mode === "default" ? null : chart, orbitAtlasLabelIds: [] };
      assert.deepEqual(inspectM4Constellation(view, "UMa", mobile, mode), []);
      const missing = { ...view }; delete missing.orbitAtlasLabelIds;
      assert.deepEqual(inspectM4Constellation(missing, "UMa", mobile, mode), ["solar-system-label-observation-missing"]);
      for (const labels of [null, 0, "", {}]) {
        assert.deepEqual(inspectM4Constellation({ ...view, orbitAtlasLabelIds: labels }, "UMa", mobile, mode), ["solar-system-label-observation-missing"]);
      }
      for (const labels of [["sun"], ["earth"], ["sun", "earth"], [null], [""]]) {
        assert.deepEqual(inspectM4Constellation({ ...view, orbitAtlasLabelIds: labels }, "UMa", mobile, mode), ["solar-system-labels-mounted-in-constellation-focus"]);
      }
    }
  }
});

test("station checks demand actual selected object, travel completion, viewport fit and usable controls", () => {
  const view = { index: 1, status: "ready", target: "nebula:m42", selectedId: "nebula:m42", request: 4,
    bounds: { left: 8, top: 80, right: 352, bottom: 290 }, viewport: [360, 800], documentWidth: 360,
    controls: [{ height: 44, width: 72 }] };
  assert.deepEqual(inspectM4Journey(view, 1), []);
  for (const patch of [{ selectedId: "nebula:b33" }, { status: "travelling" }, { request: 0 }, { documentWidth: 390 },
    { controls: [{ height: 30, width: 72 }] }]) assert.ok(inspectM4Journey({ ...view, ...patch }, 1).length);
});

test("return verifies actual camera pose, accepts quaternion sign symmetry, rejects missing values and distance clamps", () => {
  const pose = { position: [10, 20, 30], target: [1, 2, 3], direction: [0, 0, -1], up: [0, 1, 0], quaternion: [0, 0, 0, 1], fov: 45, zoom: 1 };
  assert.equal(compareM4CameraPose(pose, { ...pose, quaternion: [0, 0, 0, -1] }).ok, true);
  assert.equal(compareM4CameraPose(pose, { ...pose, position: [10.00001, 20, 30] }).ok, true);
  for (const patch of [{ position: [10, 20, 40] }, { target: [0, 0, 0] }, { fov: 50 }, { zoom: null }, { up: null }]) {
    assert.equal(compareM4CameraPose(pose, { ...pose, ...patch }).ok, false);
  }
});

test("returned notice cannot obscure actual visible labels or disappear outside a narrow viewport", () => {
  const view = { viewport: [360, 800], bounds: { left: 8, right: 352, top: 700, bottom: 748, width: 344, height: 48 },
    returnInPassport: true, passportBounds: { left: 0, right: 360, top: 680, bottom: 780 }, externalRouteOccluders: 0,
    visibleLabels: [{ id: "Ori", bounds: { left: 100, right: 180, top: 350, bottom: 370 } }] };
  assert.equal(inspectM4ReturnVisibility(view).ok, true);
  assert.equal(inspectM4ReturnVisibility({ ...view, visibleLabels: [] }).ok, false);
  assert.equal(inspectM4ReturnVisibility({ ...view, bounds: { ...view.bounds, right: 370 } }).ok, false);
  assert.equal(inspectM4ReturnVisibility({ ...view, externalRouteOccluders: 1 }).ok, false);
  assert.equal(inspectM4ReturnVisibility({ ...view, passportBounds: { ...view.passportBounds, top: 740 } }).ok, false);
  assert.equal(inspectM4ReturnVisibility({ ...view, visibleLabels: [{ id: "Ori", bounds: { left: 100, right: 180, top: 710, bottom: 730 } }] }).ok, false);
});

test("comparison close restores the same default layout and complete actual pose instead of leaving zoom ratcheted", () => {
  const before = { selectedId: "constellation:Ori", passportState: "collapsed", artExpanded: "false", chart: null, orbitAtlasLabelIds: [],
    camera: { position: [10, 20, 30], target: [1, 2, 3], direction: [0, 0, -1], up: [0, 1, 0],
      quaternion: [0, 0, 0, 1], fov: 52, zoom: 1, targetDistance: 9553.313, focusState: "locked" },
    scene: { code: "Ori", state: "ready", segments: 8, visibleSegments: 8, anchors: 7, source: "candidate-only",
      lineWidth: 1.8, boundaryCode: "Ori", boundaryStyle: "dashed", boundaryVisible: true, boundaryOpacity: .42, boundarySegments: 28 } };
  assert.equal(inspectM4ComparisonReturn(before, structuredClone(before), "Ori", true).ok, true);
  assert.equal(inspectM4ComparisonReturn(before, { ...before, camera: { ...before.camera, targetDistance: 9553.3135 } }, "Ori", true).ok, true);
  for (const patch of [{ targetDistance: 38213.250 }, { targetDistance: 1916020.220 }, { targetDistance: null },
    { direction: [1, 0, 0] }, { target: [1, 2, 4] }, { position: [10, 20, 31] }, { focusState: "moving" }]) {
    assert.equal(inspectM4ComparisonReturn(before, { ...before, camera: { ...before.camera, ...patch } }, "Ori", true).ok, false);
  }
  for (const patch of [{ passportState: "half" }, { artExpanded: "true" }, { selectedId: "constellation:Sgr" },
    { chart: {} }, { scene: { ...before.scene, state: "unobserved" } }]) {
    assert.equal(inspectM4ComparisonReturn(before, { ...before, ...patch }, "Ori", true).ok, false);
  }
  const desktop = { ...before, passportState: "half", scene: { ...before.scene, lineWidth: 1.65 } };
  assert.equal(inspectM4ComparisonReturn(desktop, structuredClone(desktop), "Ori", false).ok, true);
  assert.equal(inspectM4ComparisonReturn(desktop, { ...desktop, passportState: "details" }, "Ori", false).ok, false);
});

const measuredFullSheet = () => ({ canvas: { x: 0, y: 0, width: 390, height: 844 }, viewport: { x: 0, y: 0, width: 390, height: 844 },
  blockers: [
    { kind: "navigation", rect: { x: 10, y: 8, width: 370, height: 61.8125 } },
    { kind: "passport", rect: { x: 8, y: 78.8125, width: 374, height: 675.1875 } },
    { kind: "footer", rect: { x: 0, y: 766, width: 390, height: 78 } },
  ] });

test("occlusion proof measures every free rectangle and never treats a 64px gap or invalid blocker as fully covered", () => {
  const full = measureM4AvailableSky(measuredFullSheet());
  assert.equal(full.valid, true); assert.equal(full.maxFreeShortEdgePx, 2); assert.equal(full.hasNavigation, true);
  const gap = measuredFullSheet(); gap.blockers[1].rect = { x: 8, y: 149.8125, width: 374, height: 604.1875 };
  assert.equal(measureM4AvailableSky(gap).maxFreeShortEdgePx, 64);
  assert.equal(measureM4AvailableSky({ ...gap, blockers: [] }).maxFreeShortEdgePx, 390);
  gap.blockers[0].rect.width = Infinity;
  assert.equal(measureM4AvailableSky(gap).valid, false);
  assert.equal(measureM4AvailableSky(null).valid, false);
});

test("only a measured mobile full chart with preserved pre-chart pose may honestly report an occluded scene", () => {
  const camera = { position: [10, 20, 30], target: [1, 2, 3], direction: [0, 0, -1], up: [0, 1, 0],
    quaternion: [0, 0, 0, 1], fov: 52, zoom: 1, targetDistance: 9553.313, focusState: "locked" };
  const scene = { code: "Ori", state: "ready", segments: 8, visibleSegments: 8, anchors: 7, source: "candidate-only",
    lineWidth: 1.8, boundaryCode: "Ori", boundaryStyle: "dashed", boundaryVisible: true, boundaryOpacity: .42, boundarySegments: 28 };
  const preChart = { selectedId: "constellation:Ori", passportState: "half", artExpanded: "false", chart: null, camera, scene, orbitAtlasLabelIds: [] };
  const full = { ...preChart, passportState: "details", artExpanded: "true", scene: { ...scene, state: "unobserved", visibleSegments: 0 },
    occlusionMeasurement: measuredFullSheet(), chart: { code: "Ori", source: "candidate-only", writeback: "false", visibleRatio: 1,
      lines: 8, anchors: 7, lineWidth: 1.8, lineColor: "#b9dff6", lineOpacity: .78,
      boundary: { code: "Ori", color: "#8a9cad", dash: "4 5", points: 28 } } };
  assert.deepEqual(inspectM4Constellation(full, "Ori", true, "comparison", preChart), []);
  assert.deepEqual(inspectM4Constellation(full, "Ori", true, "boundary", preChart), []);
  assert.equal(inspectM4ChartOcclusion(full, "Ori", true, "boundary", preChart).disposition, "chart-primary-scene-occluded");
  assert.ok(inspectM4Constellation(full, "Ori", false, "comparison", preChart).length);
  assert.ok(inspectM4Constellation(full, "Ori", true, "default", preChart).length);
  const gap = measuredFullSheet(); gap.blockers[1].rect = { x: 8, y: 149.8125, width: 374, height: 604.1875 };
  for (const patch of [{ occlusionMeasurement: null }, { occlusionMeasurement: gap },
    { occlusionMeasurement: { ...measuredFullSheet(), blockers: measuredFullSheet().blockers.filter((b) => b.kind !== "navigation") } },
    { passportState: "half" }, { artExpanded: "false" }, { selectedId: "constellation:Sgr" },
    { camera: { ...camera, targetDistance: 1916020.220 } }, { camera: { ...camera, position: [10, 20, 300] } },
    { scene: { ...full.scene, state: "failed" } }, { scene: { ...full.scene, state: "awaiting-draw" } },
    { scene: { ...full.scene, code: "Sgr" } }, { chart: { ...full.chart, visibleRatio: .8 } },
    { chart: { ...full.chart, code: "Sgr" } }, { chart: { ...full.chart, lines: 7 } }]) {
    assert.ok(inspectM4Constellation({ ...full, ...patch }, "Ori", true, "comparison", preChart).length);
  }
  assert.ok(inspectM4Constellation(full, "Ori", true, "comparison", null).length);
  // The camera check also rejects the old far-retreat defect even if draw telemetry happens to say ready.
  assert.ok(inspectM4Constellation({ ...full, scene, camera: { ...camera, targetDistance: 1916020.220 } }, "Ori", true, "comparison", preChart).length);
});
