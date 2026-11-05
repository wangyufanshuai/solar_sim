import assert from "node:assert/strict";
import test from "node:test";
import { expectedM5ContextMessage, inspectM5WebglCase, installM5WebglProbe, parseM5WebglOptions } from "./check-mainline-a-m5-webgl.mjs";

test("WebGL check requires explicit frozen local build and distinct run identity", () => {
  const args = ["--build-receipt", "docs/release/build.json", "--origin", "http://127.0.0.1:3149", "--run-id", "20261015-glprobe01", "--device", "desktop"];
  assert.equal(parseM5WebglOptions(args).device, "desktop");
  assert.throws(() => parseM5WebglOptions(args.slice(0, 4)), /explicit-build-origin-run-id/);
  assert.throws(() => parseM5WebglOptions([...args, "--device", "mobile"]), /unknown-or-duplicate/);
  assert.throws(() => parseM5WebglOptions(args.map((value) => value === "http://127.0.0.1:3149" ? "https://example.com" : value)), /loopback/);
});

test("only exact expected context messages are exempt; errors are never broadly suppressed", () => {
  assert.equal(expectedM5ContextMessage({ type: "log", message: "THREE.WebGLRenderer: Context Lost." }), true);
  assert.equal(expectedM5ContextMessage({ type: "warning", message: "WebGL: CONTEXT_LOST_WEBGL: loseContext: context lost" }), true);
  for (const entry of [{ type: "pageerror", message: "THREE.WebGLRenderer: Context Lost." },
    { type: "warning", message: "WebGL: INVALID_OPERATION: getQueryParameter: invalid query" },
    { type: "error", message: "TypeError: object null is not iterable" }]) assert.equal(expectedM5ContextMessage(entry), false);
});

function goodCase() {
  return { supported: true, samples: { before: { lost: false, draws: 8 }, lost: { lost: true,
    metrics: { "data-atlas-render-context-status": "context-lost", "data-atlas-render-draw-calls": "unavailable" } }, restored: {
    lost: false, sameCanvas: true, sameContext: true, canvasCount: 1, drawsAfterRestore: 12,
    metrics: { "data-atlas-render-context-status": "ready" },
    events: [{ type: "webglcontextlost", trusted: true }, { type: "webglcontextrestored", trusted: true }],
  } }, viewerOpened: true, viewerClosed: true, focusReturned: true, instrumentationRestored: true,
  before: { selectedId: "nebula:m42", nebula: { sha256: "a" } },
  after: { selectedId: "nebula:m42", nebula: { sha256: "a" }, canvasCount: 1 }, unexpectedErrors: [], issues: [] };
}
test("stale ready status, synthetic events, canvas replacement and browser failures cannot certify recovery", () => {
  assert.equal(inspectM5WebglCase(goodCase()).status, "passed-candidate-only");
  for (const patch of [{ drawsAfterRestore: 0 }, { sameCanvas: false }, { sameContext: false }, { lost: true },
    { events: [{ type: "webglcontextlost", trusted: false }, { type: "webglcontextrestored", trusted: false }] }]) {
    const item = goodCase(); Object.assign(item.samples.restored, patch);
    assert.equal(inspectM5WebglCase(item).status, "failed");
  }
  assert.equal(inspectM5WebglCase({ ...goodCase(), unexpectedErrors: [{ type: "pageerror", message: "null" }] }).status, "failed");
  assert.equal(inspectM5WebglCase({ supported: false }).status, "not-run-unsupported-extension");
});

test("GL observation forwards the exact receiver/arguments/return value and restores the original method", () => {
  const previous = { window: globalThis.window, document: globalThis.document };
  const canvas = new EventTarget(); const returns = {}; const argumentsSeen = [];
  let lost = false;
  const original = function (...args) { argumentsSeen.push({ receiver: this, args }); return returns; };
  const context = { drawArrays: original, isContextLost: () => lost, getExtension: () => ({ loseContext() { lost = true; }, restoreContext() { lost = false; } }) };
  canvas.getContext = () => context;
  globalThis.window = {};
  globalThis.document = { querySelector: (selector) => selector.startsWith("canvas") ? canvas : null, querySelectorAll: () => [canvas] };
  try {
    installM5WebglProbe("test");
    assert.equal(context.drawArrays(4, 0, 12), returns);
    assert.equal(argumentsSeen[0].receiver, context);
    assert.deepEqual(argumentsSeen[0].args, [4, 0, 12]);
    assert.equal(window.test.sample().draws, 1);
    window.test.lose(); context.drawArrays(4, 0, 12);
    assert.equal(window.test.sample().draws, 1);
    window.test.restore();
    assert.equal(window.test.cleanup(), true);
    assert.equal(context.drawArrays, original);
    assert.equal(window.test, undefined);
  } finally {
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.document === undefined) delete globalThis.document; else globalThis.document = previous.document;
  }
});
