import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectPresentationObservationV637, overlapAreaV637, presentationInputPathV637, type PresentationObservationV637 } from "./audit-mainline-a-presentation-v637";

const build = "mainline-a-0123456789abcdef";
function fixture(): PresentationObservationV637 {
  return {
    schema: "mainline-a-layout-observation-v637",
    capturedAt: "2026-09-27T12:00:00Z",
    viewport: { width: 390, height: 844 },
    buildId: build,
    url: "http://127.0.0.1:3057/",
    elements: {
      navigation: { x: 10, y: 8, width: 370, height: 100 },
      toolbar: { x: 10, y: 116, width: 370, height: 58 },
      brand: { x: 95, y: 182, width: 200, height: 28 },
    },
    foregroundPanels: [],
    activePanel: "none",
    focusedInsidePanel: null,
    horizontalOverflowPx: 0,
  };
}

test("fixture consistency is a numeric replay, without visual or performance admission", () => {
  const result = inspectPresentationObservationV637(fixture(), build);
  assert.equal(result.status, "consistent");
  assert.deepEqual(result.findings, []);
  assert.equal("visualApproval" in result, false);
});

test("reproduces the original overlapping toolbar and navigation defect", () => {
  const input = fixture();
  input.elements.toolbar!.y = 12;
  assert.ok(inspectPresentationObservationV637(input, build).findings.some((item) => item.code === "header-overlap"));
});

test("requires the exact expected build and capture origin", () => {
  const input = fixture();
  input.buildId = "mainline-a-ffffffffffffffff";
  input.url = "https://example.org/";
  const codes = inspectPresentationObservationV637(input, build).findings.map((item) => item.code);
  assert.ok(codes.includes("build-mismatch"));
  assert.ok(codes.includes("origin"));
});

test("catches hidden, zero-sized, invalid and offscreen header elements", () => {
  for (const bad of [null, { x: 0, y: 0, width: 0, height: 1 }, { x: NaN, y: 0, width: 10, height: 10 }]) {
    const input = fixture();
    input.elements.brand = bad;
    assert.equal(inspectPresentationObservationV637(input, build).status, "inconsistent");
  }
  const input = fixture();
  input.elements.brand!.x = 300;
  assert.ok(inspectPresentationObservationV637(input, build).findings.some((item) => item.code === "offscreen-brand"));
});

test("checks foreground panel exclusivity and actual focus observation", () => {
  const input = fixture();
  input.foregroundPanels = ["roster", "stellar-atlas"];
  input.activePanel = "stellar-atlas";
  input.focusedInsidePanel = false;
  const result = inspectPresentationObservationV637(input, build);
  assert.ok(result.findings.some((item) => item.code === "concurrent-panels"));
  assert.ok(result.findings.some((item) => item.code === "panel-focus"));
  input.foregroundPanels = ["stellar-atlas"];
  input.focusedInsidePanel = true;
  assert.equal(inspectPresentationObservationV637(input, build).status, "consistent");
});

test("malformed and incomplete observations fail instead of defaulting to success", () => {
  for (const input of [null, [], {}, { ...fixture(), viewport: { width: -1, height: 844 } }, { ...fixture(), horizontalOverflowPx: 25 }]) {
    assert.notEqual(inspectPresentationObservationV637(input, build).status, "consistent");
  }
});

test("boundary contact is allowed but nonzero intersections are measured", () => {
  const a = { x: 0, y: 0, width: 100, height: 40 };
  assert.equal(overlapAreaV637(a, { ...a, y: 40 }), 0);
  assert.equal(overlapAreaV637(a, { ...a, y: 39 }), 100);
});

test("refuses paths outside the explicit workspace", () => {
  const root = process.cwd();
  assert.ok(presentationInputPathV637(root, "tmp/observation.json").startsWith(root));
  assert.throws(() => presentationInputPathV637(root, "../observation.json"), /inside next-web/);
  assert.throws(() => presentationInputPathV637(root, "."), /inside next-web/);
});
