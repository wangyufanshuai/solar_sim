import assert from "node:assert/strict";
import test from "node:test";
import { M1_SCENES, M1_VIEWPORTS, inspectM1Behaviors, inspectM1Observation,
  parseM1Options, validateM1Build } from "./capture-mainline-a-m1-browser.mjs";

const source = "5".repeat(64);
const build = { status: "passed", sourceStable: true, exitCode: 0, buildId: "preserved-id",
  runtimeBuildId: `mainline-a-${source.slice(0, 16)}`, inputBefore: { sha256: source },
  inputAfterSha256: source, branch: "codex/example", head: "abc" };
const options = ["--phase", "before", "--origin", "http://127.0.0.1:3140",
  "--build-receipt", "docs/release/v607/build.json"];

test("only explicit local before/after captures are accepted", () => {
  assert.equal(parseM1Options(options).origin, "http://127.0.0.1:3140");
  assert.throws(() => parseM1Options([...options, "--phase", "after"]), /duplicate/);
  assert.throws(() => parseM1Options(options.map((value) => value === "before" ? "publish" : value)), /phase/);
  assert.throws(() => parseM1Options(options.map((value) => value === "http://127.0.0.1:3140"
    ? "https://example.org" : value)), /local-origin/);
  assert.throws(() => parseM1Options([...options, "--run-id", "../../overwrite"]), /run-id/);
});

test("frozen before capture binds the saved source and preserved build, not a changed workspace", () => {
  const bound = validateM1Build(build, { sha256: source }, "preserved-id");
  assert.equal(bound.sourceSha256, source);
  assert.throws(() => validateM1Build(build, { sha256: "a".repeat(64) }, "preserved-id"), /binding-mismatch/);
  assert.throws(() => validateM1Build(build, { sha256: source }, "different-build"), /build-id-mismatch/);
  assert.throws(() => validateM1Build({ ...build, sourceStable: false }, { sha256: source }, "preserved-id"), /stable/);
});

function observation(scene) {
  return { selectedId: scene.selectedId, passportId: scene.passportId, runtimeBuildId: build.runtimeBuildId,
    branch: build.branch, head: build.head, releaseBoundary: "candidate-only-hold-not-admitted",
    scientificPayloadWriteback: "false", viewport: [390, 844], documentWidth: 390,
    canvasCount: 1, visibility: "visible", sceneMode: "inspect", passportState: "collapsed", artExpanded: "false", scaleCompact: "true",
    nebula: scene.kind === "nebula" ? { id: "m42", status: "ready", sha256: "a".repeat(64),
      rights: "pending", admission: "candidate-only" } : null };
}

test("six-view matrix rejects wrong selected object, overflow, multiple canvases and wrong build", () => {
  assert.equal(M1_SCENES.length * Object.keys(M1_VIEWPORTS).length, 6);
  const scene = M1_SCENES[0];
  const valid = observation(scene);
  assert.deepEqual(inspectM1Observation(valid, scene, M1_VIEWPORTS.mobile, build, "after"), []);
  for (const patch of [{ selectedId: "nebula:m42" }, { documentWidth: 440 }, { canvasCount: 2 },
    { runtimeBuildId: "old" }, { scientificPayloadWriteback: "true" }, { artExpanded: "true" }]) {
    assert.ok(inspectM1Observation({ ...valid, ...patch }, scene, M1_VIEWPORTS.mobile, build, "after").length);
  }
});

test("before preserves old UI observation without falsely demanding new controls", () => {
  const scene = M1_SCENES[1];
  const observed = { ...observation(scene), passportState: null, artExpanded: null };
  assert.deepEqual(inspectM1Observation(observed, scene, M1_VIEWPORTS.mobile, build, "before"), []);
  assert.ok(inspectM1Observation(observed, scene, M1_VIEWPORTS.mobile, build, "after").length);
});

test("ready M42 cannot silently become rights signed or released", () => {
  const scene = M1_SCENES[2];
  const valid = observation(scene);
  for (const patch of [{ status: "loading" }, { rights: "signed" }, { admission: "released" }, { sha256: null }]) {
    assert.ok(inspectM1Observation({ ...valid, nebula: { ...valid.nebula, ...patch } },
      scene, M1_VIEWPORTS.mobile, build, "after").includes("nebula-not-ready-or-boundary-missing"));
  }
});

test("source and keyboard behavior requires actions, not just a screenshot", () => {
  const scene = M1_SCENES[2];
  const valid = { closeViaKeyboard: true, reopenViaKeyboard: true, selectionPreserved: true,
    sources: [{ href: "https://example.org/source" }], detailsOpened: true, sourcesExpanded: true,
    returnedToDefault: true, captionExpanded: true, creditVisible: true, captionCollapsedAgain: true,
    captionImageUnchanged: true, scaleExpanded: true, scaleEscapeRestoredFocus: true,
    comparisonOpened: true, comparisonEscapeClosed: true, scenePreservedAfterInteractions: true,
    mobileTouchTargets: [{ width: 44, height: 44 }] };
  assert.deepEqual(inspectM1Behaviors(valid, "after", scene), []);
  for (const patch of [{ sources: [] }, { reopenViaKeyboard: false }, { detailsOpened: false },
    { creditVisible: false }, { captionImageUnchanged: false }, { scenePreservedAfterInteractions: false },
    { mobileTouchTargets: [{ width: 40, height: 44 }] }]) {
    assert.ok(inspectM1Behaviors({ ...valid, ...patch }, "after", scene).length);
  }
});
