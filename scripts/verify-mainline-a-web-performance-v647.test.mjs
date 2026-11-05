import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { replayWebFrameSampleV647 } from "./verify-mainline-a-web-performance-v647.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = { runtimeBuildId: "mainline-a-8136bf33ce9a75d1" };
async function raw(name) {
  return JSON.parse(await readFile(path.join(ROOT, `docs/release/v607/mainline-a-r66-web-performance-${name}-raw-20261007-v647web02.json`), "utf8"));
}

test("two live-browser samples replay from their 120 original frame intervals", async () => {
  const desktop = replayWebFrameSampleV647(await raw("desktop"), BUILD, "desktop");
  const mobile = replayWebFrameSampleV647(await raw("mobile"), BUILD, "mobileViewport");
  assert.equal(desktop.sampleCount, 120);
  assert.equal(mobile.sampleCount, 120);
  assert.deepEqual(desktop.viewport, [1280, 720]);
  assert.deepEqual(mobile.viewport, [390, 844]);
  assert.ok(desktop.frameIntervalMs.p95 >= desktop.frameIntervalMs.p50);
  assert.ok(mobile.frameIntervalMs.p95 >= mobile.frameIntervalMs.p50);
});

test("a forged fast sample with too few intervals is rejected", async () => {
  const desktop = await raw("desktop");
  assert.throws(() => replayWebFrameSampleV647({ ...desktop, frameIntervalsMs: Array(10).fill(1) }, BUILD, "desktop"), /sample-count-invalid/);
});

test("synthetic zero, NaN-like values and clock drift are rejected", async () => {
  const desktop = await raw("desktop");
  assert.throws(() => replayWebFrameSampleV647({ ...desktop, frameIntervalsMs: Array(120).fill(0) }, BUILD, "desktop"), /sample-value-invalid/);
  assert.throws(() => replayWebFrameSampleV647({ ...desktop, frameIntervalsMs: Array(120).fill(1) }, BUILD, "desktop"), /sample-clock-drift/);
});

test("build, viewport and claim promotions cannot enter the performance receipt", async () => {
  const mobile = await raw("mobile");
  assert.throws(() => replayWebFrameSampleV647(mobile, { runtimeBuildId: "wrong" }, "mobileViewport"), /build-drift/);
  assert.throws(() => replayWebFrameSampleV647({ ...mobile, viewport: [1280, 720] }, BUILD, "mobileViewport"), /viewport-invalid/);
  assert.throws(() => replayWebFrameSampleV647({ ...mobile, claims: { ...mobile.claims, productionPerformance: true } }, BUILD, "mobileViewport"), /claim-promotion/);
});
