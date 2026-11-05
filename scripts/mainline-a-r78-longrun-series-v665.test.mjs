import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { analyzeR78FramesV665,
  analyzeR78MemoryV665,
  analyzeR78ResourceCycleV665,
  analyzeR78ObservationSeriesV665 } from
  "./mainline-a-r78-longrun-series-v665.mjs";

// Historical browser raw is a regression input for the analyzer only.
// Its source and build do not qualify a current R78 observation.
const historical = JSON.parse(await readFile(
  "docs/release/v607/mainline-a-r70-v657-browser-final-raw-20261012-v657long04.json",
  "utf8"));
const [desktop, mobile] = historical.observations;

test("analyzes six real five-minute windows on each historical run", () => {
  for (const row of [desktop, mobile]) {
    const result = analyzeR78ObservationSeriesV665(row);
    assert.equal(result.ok, true, result.issues.join(","));
    assert.equal(result.frames.windows.length, 6);
    assert.equal(result.memory.windows.length, 6);
    assert.equal(result.resources.renderable.length > 0, true);
    assert.deepEqual(result.resources.totals, [27, 31, 27]);
    assert.equal(result.frames.frameBudget.count > 10_000, true);
    assert.equal(result.frames.frameBudget.metric,
      "browser-animation-frame-interval-not-production-fps");
    assert.equal(typeof result.frames.tailTrend.advisory,
      "string");
    assert.equal(result.claims.productionPerformance, false);
  }
});

test("rejects reordered and negative browser frame samples", () => {
  const reordered = [...desktop.frameSamples];
  reordered[500] = { ...reordered[500], atMs: -1 };
  const result = analyzeR78FramesV665(reordered,
    desktop.observedDurationMs);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("frames:sample-invalid"));
});

test("rejects missing five-minute frame coverage", () => {
  const missing = desktop.frameSamples.filter((sample) =>
    sample.atMs < 300_000 || sample.atMs >= 600_000);
  const result = analyzeR78FramesV665(missing,
    desktop.observedDurationMs);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(
    "frames:window-1-undercovered"));
  assert.ok(result.issues.includes(
    "frames:gap-over-thirty-seconds"));
});

test("rejects sparse or temporally reversed memory samples", () => {
  const missing = desktop.memorySamples.filter((sample) =>
    sample.atMs >= 300_000);
  const result = analyzeR78MemoryV665(missing,
    desktop.observedDurationMs);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(
    "memory:window-0-undercovered"));
  const reordered = [...desktop.memorySamples];
  reordered[400] = { ...reordered[400], atMs: 1 };
  assert.ok(analyzeR78MemoryV665(reordered,
    desktop.observedDurationMs).issues.includes(
    "memory:sample-invalid"));
});

test("fails closed when active resources do not contain real renderable growth", () => {
  const unchanged = { ...desktop.resources,
    active: { ...desktop.resources.active,
      total: desktop.resources.baseline.total,
      snapshot: desktop.resources.baseline.snapshot } };
  const result = analyzeR78ResourceCycleV665(unchanged);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(
    "resource:no-real-renderable-acquire"));
});

test("fails closed when final resource identity or owner is not restored", () => {
  const leaked = { ...desktop.resources,
    final: { ...desktop.resources.final,
      identityDigest: "forged-final",
      ownerDigest: "forged-owner" } };
  const result = analyzeR78ResourceCycleV665(leaked);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(
    "resource:baseline-not-restored"));
});

test("rejects an identity-map leak hidden behind a copied digest", () => {
  const original = desktop.resources.final;
  const leakedMap = { ...original.snapshot.byIdentity,
    "synthetic-test-leak": { kind: "texture",
      owner: "test-only", label: "forged",
      count: 1, estimatedBytes: 4096,
      contentSha256: null } };
  const final = { ...original,
    snapshot: { ...original.snapshot,
      byIdentity: leakedMap } };
  const result = analyzeR78ResourceCycleV665({
    ...desktop.resources, final });
  assert.equal(result.ok, false);
  assert.equal(result.remaining.length > 0, true);
  assert.ok(result.issues.includes(
    "resource:baseline-not-restored"));
});

test("rejects an impossible 29-minute observation despite complete samples", () => {
  const shortened = { ...desktop,
    observedDurationMs: 29 * 60 * 1000 };
  const result = analyzeR78ObservationSeriesV665(shortened);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(
    "observation:duration-under-thirty-minutes"));
});

test("retains local diagnostic scope for a complete browser observation", () => {
  const result = analyzeR78ObservationSeriesV665(mobile);
  assert.equal(result.status,
    "series-complete-local-diagnostic");
  assert.equal(result.memory.physicalMemoryMeasurement, false);
  assert.equal(result.resources.physicalGpuMemoryMeasurement, false);
  assert.equal(result.claims.physicalMobile, false);
  assert.equal(result.claims.realUserValidation, false);
});

test("flags sustained browser-reported heap growth as advisory only", () => {
  const samples = Array.from({ length: 1801 }, (_, index) => ({
    atMs: index * 1000,
    usedBytes: 100 * 1024 * 1024
      + index * 15 * 1024 * 1024 / 300,
    totalBytes: 512 * 1024 * 1024,
    limitBytes: 4 * 1024 * 1024 * 1024,
    source: "performance-memory",
  }));
  const result = analyzeR78MemoryV665(samples, 1_800_000);
  assert.equal(result.ok, true, result.issues.join(","));
  assert.equal(result.trend.advisory,
    "sustained-reported-heap-growth-review");
  assert.equal(result.physicalMemoryMeasurement, false);
});

test("reports a late frame tail regression without claiming production failure", () => {
  const samples = Array.from({ length: 12_001 }, (_, index) => ({
    atMs: index * 150,
    deltaMs: index * 150 >= 1_200_000 ? 20 : 10,
    longTaskMs: 0,
  }));
  const result = analyzeR78FramesV665(samples,
    1_800_000);
  assert.equal(result.ok, true, result.issues.join(","));
  assert.equal(result.tailTrend.advisory,
    "late-window-frame-tail-review");
  assert.equal(result.tailTrend.ratio, 2);
  assert.equal(result.tailTrend.interpretation,
    "local-browser-diagnostic-not-production-performance");
});
