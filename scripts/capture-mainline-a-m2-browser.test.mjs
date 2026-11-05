import assert from "node:assert/strict";
import test from "node:test";
import { M2_A12, M2_ALIASES, M2_FOCUS_IDS, M2_VIEWPORTS, inspectM2Observation, parseM2Options }
  from "./capture-mainline-a-m2-browser.mjs";

const options = ["--phase", "before", "--origin", "http://127.0.0.1:3143", "--build-receipt", "docs/release/build.json"];
const build = { runtimeBuildId: "mainline-a-test", branch: "codex/mainline", head: "abcdef" };
const presentation = { "data-mainline-a-stellar-presentation-id": "m2-shared-v596",
  "data-mainline-a-stellar-presentation-sha256": "a".repeat(64),
  "data-mainline-a-stellar-color-family": "rapid-rotator-gravity-darkened",
  "data-mainline-a-stellar-color-srgb": "rgb(180,200,255)", "data-mainline-a-stellar-model-axis-ratio": "1.35" };
const defaultView = { ...build, selectedId: "stellar-hero:achernar", passportId: "bright-star:achernar",
  releaseBoundary: "candidate-only-hold-not-admitted", scientificPayloadWriteback: "false",
  viewport: [390, 844], documentWidth: 390, canvasCount: 1, visibility: "visible", sceneMode: "inspect",
  artExpanded: "false", scaleCompact: "true", card: null,
  proxy: { ...presentation, "data-stellar-hero-id": "achernar",
    "data-atlas-v596-stellar-renderer": "v596-stellar-portrait-render-contract-v1",
    "data-stellar-render-contract-sha256": "b".repeat(64),
    ...Object.fromEntries(["scientific-authority", "resolved-surface", "observation-texture", "scientific-payload-writeback"]
      .map((key) => [`data-stellar-${key}`, "false"])) } };
const comparison = { ...defaultView, artExpanded: "true", svgVisibleRatio: 1,
  card: { ...presentation, "data-mainline-a-stellar-portrait": "achernar" } };
const inspect = (value, phase = "after", mode = "default") => inspectM2Observation(value, "achernar", M2_VIEWPORTS.mobile, build, phase, mode);

test("M2 matrix fixes A12 and the four calibration heroes without adding Beta", () => {
  assert.equal(M2_A12.length, 12); assert.equal(new Set(M2_A12).size, 12);
  assert.equal(M2_A12.length * Object.keys(M2_VIEWPORTS).length * 2, 48);
  assert.deepEqual(M2_FOCUS_IDS, ["sirius-a", "betelgeuse", "vega", "achernar"]);
  assert.ok(M2_FOCUS_IDS.every((id) => M2_A12.includes(id)));
  assert.ok(!M2_A12.includes("altair"));
});

test("local capture arguments reject duplicate, nonlocal, malformed and traversal requests", () => {
  assert.equal(parseM2Options(options).origin, "http://127.0.0.1:3143");
  assert.equal(parseM2Options([...options, "--output-dir", "output/playwright/mainline-a-m5-stars-20261015"]).outputDir,
    "output/playwright/mainline-a-m5-stars-20261015");
  for (const args of [[...options, "--phase", "after"], [...options, "--run-id", "../../outside"],
    [...options, "--output-dir", "output/playwright/../outside"], [...options, "--output-dir", "C:/outside"],
    options.map((value) => value === "before" ? "publish" : value),
    options.map((value) => value === "http://127.0.0.1:3143" ? "https://example.com" : value)]) {
    assert.throws(() => parseM2Options(args));
  }
});

test("default capture requires selected hero, its v596 contract and an uncluttered single canvas", () => {
  assert.deepEqual(inspect(defaultView), []);
  for (const patch of [{ selectedId: "bright-star:achernar" }, { canvasCount: 2 }, { documentWidth: 400 },
    { runtimeBuildId: "stale" }, { artExpanded: "true" }, { card: comparison.card }, { scaleCompact: "false" }]) {
    assert.ok(inspect({ ...defaultView, ...patch }).length);
  }
  assert.ok(inspect({ ...defaultView, proxy: { ...defaultView.proxy, "data-stellar-hero-id": "vega" } }).length);
});

test("comparison must be visibly scrolled into the viewport rather than merely mounted", () => {
  assert.deepEqual(inspect(comparison, "after", "comparison"), []);
  for (const ratio of [0, .4, .97]) assert.ok(inspect({ ...comparison, svgVisibleRatio: ratio }, "after", "comparison")
    .includes("comparison-svg-not-fully-visible"));
});

test("after rejects different scene and card colors, ratios, family and adapter signatures", () => {
  for (const key of Object.keys(presentation)) {
    const altered = { ...comparison, card: { ...comparison.card, [key]: "different" } };
    assert.ok(inspect(altered, "after", "comparison").length, key);
    assert.deepEqual(inspect(altered, "before", "comparison"), []);
  }
});

test("artwork acceptance cannot imply observed surface, scientific authority or payload writeback", () => {
  for (const key of ["scientific-authority", "resolved-surface", "observation-texture", "scientific-payload-writeback"]) {
    assert.ok(inspect({ ...defaultView, proxy: { ...defaultView.proxy, [`data-stellar-${key}`]: "true" } })
      .includes("stellar-boundary-mismatch"));
  }
});

test("catalog aliases are explicit identities while still requiring the corresponding hero contract", () => {
  assert.equal(M2_ALIASES.length, 4);
  const alias = M2_ALIASES.find((entry) => entry.id === "sirius-a");
  assert.equal(alias.selectedId, "nearby-star:sirius");
  const observed = { ...defaultView, selectedId: alias.selectedId,
    proxy: { ...defaultView.proxy, "data-stellar-hero-id": alias.id } };
  assert.deepEqual(inspectM2Observation(observed, alias.id, M2_VIEWPORTS.mobile, build, "after", "default", alias.selectedId), []);
  assert.ok(inspectM2Observation(observed, alias.id, M2_VIEWPORTS.mobile, build, "after", "default").length);
});
