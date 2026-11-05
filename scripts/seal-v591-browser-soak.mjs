import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { derivePageBuildFingerprintV591 } from "./v591-page-build-identity.mjs";

const root = process.cwd();
const inputPath = resolve(root, process.argv[2] ?? "tmp/v591-browser-soak-30m.json");
const outputPath = resolve(root, "docs/release/v591/browser-soak-qualification-v591.json");
const minimumElapsedMs = 30 * 60 * 1000;
const minimumSamples = 31;
const maximumIntervalMs = 90 * 1000;
const maximumByteDrift = 1024 * 1024;
const maximumJsHeapGrowth = 16 * 1024 * 1024;
const maximumJsHeapSlopeBytesPerMinute = 1024 * 1024;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
async function readJson(relativePath) {
  return JSON.parse(await readFile(resolve(root, relativePath), "utf8"));
}
async function readSealed(relativePath, field = "receiptSha256") {
  const value = await readJson(relativePath);
  const unsigned = { ...value };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === value[field], `v591-soak-seal:${relativePath}`);
  return value;
}
function numberAttribute(state, key) {
  const value = Number(state[key]);
  assert(Number.isFinite(value), `v591-soak-number:${key}`);
  return value;
}
function booleanAttribute(state, key) {
  assert(state[key] === "true" || state[key] === "false", `v591-soak-boolean:${key}`);
  return state[key] === "true";
}
function logSeverity(entry) {
  return String(entry?.level ?? entry?.type ?? entry?.severity ?? "").toLowerCase();
}
function range(values) {
  return Math.max(...values) - Math.min(...values);
}
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}
function regressionSlopePerMinute(rows) {
  const origin = rows[0].capturedAtMs;
  const points = rows.map((row) => ({ x: (row.capturedAtMs - origin) / 60000, y: row.jsHeapUsedBytes }));
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  return denominator === 0 ? 0 : points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator;
}
function longestIncreasingRun(values) {
  let longest = 1;
  let current = 1;
  for (let index = 1; index < values.length; index += 1) {
    current = values[index] > values[index - 1] ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}
async function atomicWrite(path, bytes) {
  await mkdir(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  await writeFile(partial, bytes);
  await rm(path, { force: true });
  await rename(partial, path);
}

const input = JSON.parse(await readFile(inputPath, "utf8"));
assert(typeof input.generatedAt === "string" && !Number.isNaN(Date.parse(input.generatedAt)), "v591-soak-generated-at");
assert(Number.isFinite(input.startedAtMs) && Number.isFinite(input.endedAtMs) && input.endedAtMs > input.startedAtMs, "v591-soak-time-range");
assert(input.elapsedMs >= minimumElapsedMs && input.endedAtMs - input.startedAtMs >= minimumElapsedMs, "v591-soak-duration");
assert(Array.isArray(input.samples) && input.samples.length >= minimumSamples, "v591-soak-sample-count");
assert(Array.isArray(input.logs), "v591-soak-logs");

const manifest = await readSealed("public/data/celestial-convergence-v591/manifest.json", "manifestSha256");
const sourceManifest = await readSealed("docs/release/v591/source-manifest-v591.json");
const matrix = await readSealed("docs/release/v591/browser-qualification-global-matrix-v591.json");
const standaloneReceiptBytes = await readFile(resolve(root, "dist/release/atlas-v591-standalone-build-resource.json"));
const standaloneReceipt = JSON.parse(standaloneReceiptBytes.toString("utf8"));
const standaloneBuildId = (await readFile(resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID"), "utf8")).trim();
const buildFingerprint = derivePageBuildFingerprintV591({ sourceManifestSha256: sourceManifest.receiptSha256, deliveryTier: "standalone-full" });
assert(matrix.status === "automated-global-visual-matrix-passed-human-signoff-pending" && matrix.build?.sourceManifestSha256 === sourceManifest.receiptSha256, "v591-soak-matrix");
assert(standaloneReceipt.status === "passed" && standaloneReceipt.buildId === standaloneBuildId && standaloneReceipt.candidateSourceManifestSha256 === sourceManifest.receiptSha256, "v591-soak-build");

const samples = input.samples.map((sample, index) => {
  assert(Number.isFinite(sample.capturedAtMs), `v591-soak-sample-time:${index}`);
  if (index > 0) {
    const interval = sample.capturedAtMs - input.samples[index - 1].capturedAtMs;
    assert(interval > 0 && interval <= maximumIntervalMs, `v591-soak-sample-interval:${index}`);
  }
  const state = sample.state;
  assert(state["data-atlas-v591-page-source-manifest-sha"] === sourceManifest.receiptSha256 && state["data-atlas-v591-page-build-fingerprint"] === buildFingerprint && state["data-atlas-v591-page-delivery-tier"] === "standalone-full", `v591-soak-page-build:${index}`);
  assert(state["data-atlas-v591-focus-target"] === "overview" && state["data-atlas-v591-mode"] === "cinematic" && state["data-atlas-v591-device-tier"] === "desktop" && state["data-atlas-v591-exposure-preset"] === "nominal", `v591-soak-profile:${index}`);
  assert(numberAttribute(state, "data-atlas-v591-canvas-count") === 1 && booleanAttribute(state, "data-atlas-v591-single-canvas-stage"), `v591-soak-canvas:${index}`);
  assert(state["data-atlas-v591-sky-status"] === "ready" && state["data-atlas-v591-star-status"] === "ready" && state["data-atlas-v591-constellation-status"] === "ready" && state["data-atlas-v591-nebula-status"] === "ready", `v591-soak-runtime:${index}`);
  const fpsMedian = numberAttribute(state, "data-atlas-v591-fps-median");
  const drawCalls = numberAttribute(state, "data-atlas-v591-draw-calls");
  const gpuBytes = numberAttribute(state, "data-atlas-v591-gpu-bytes");
  const resourceBytes = numberAttribute(state, "data-atlas-v591-resource-bytes");
  const textures = numberAttribute(state, "data-atlas-v591-textures");
  const geometries = numberAttribute(state, "data-atlas-v591-geometries");
  const programs = numberAttribute(state, "data-atlas-v591-programs");
  const candidateNodes = numberAttribute(state, "data-atlas-v591-candidate-nodes");
  const candidateResources = numberAttribute(state, "data-atlas-v591-release-candidate-resources");
  assert(fpsMedian >= 55 && numberAttribute(state, "data-atlas-v591-fps-sample-count") >= 120, `v591-soak-fps:${index}`);
  assert(drawCalls <= 90 && gpuBytes <= 536870912, `v591-soak-budget:${index}`);
  assert(state["data-atlas-v591-scientific-payload-sha"] === manifest.boundaries.scientificPayloadSha256 && state["data-atlas-v591-scientific-writeback"] === "false", `v591-soak-science:${index}`);
  return { sequence: index, capturedAtMs: sample.capturedAtMs, elapsedMs: sample.capturedAtMs - input.startedAtMs, fpsMedian, drawCalls, gpuBytes, resourceBytes, textures, geometries, programs, candidateNodes, candidateResources, jsHeapUsedBytes: Number.isFinite(sample.jsHeapUsedBytes) ? sample.jsHeapUsedBytes : null };
});
assert(samples[0].capturedAtMs >= input.startedAtMs && samples.at(-1).capturedAtMs <= input.endedAtMs && samples.at(-1).capturedAtMs - samples[0].capturedAtMs >= minimumElapsedMs, "v591-soak-sample-span");

const resourceBytes = samples.map((sample) => sample.resourceBytes);
const gpuBytes = samples.map((sample) => sample.gpuBytes);
const textures = samples.map((sample) => sample.textures);
const geometries = samples.map((sample) => sample.geometries);
const programs = samples.map((sample) => sample.programs);
const candidateNodes = samples.map((sample) => sample.candidateNodes);
const candidateResources = samples.map((sample) => sample.candidateResources);
assert(range(resourceBytes) <= maximumByteDrift && range(gpuBytes) <= maximumByteDrift, "v591-soak-byte-drift");
assert(range(textures) <= 1 && range(geometries) <= 1 && range(programs) <= 1 && range(candidateNodes) <= 1 && range(candidateResources) <= 1, "v591-soak-resource-drift");

const heapRows = samples.filter((sample) => sample.jsHeapUsedBytes !== null);
let heapAudit = { supported: false, sampleCount: 0, firstMedianBytes: null, lastMedianBytes: null, growthBytes: null, slopeBytesPerMinute: null, longestIncreasingRun: null, status: "not-exposed-by-browser" };
if (heapRows.length === samples.length) {
  const firstMedianBytes = median(heapRows.slice(0, 5).map((sample) => sample.jsHeapUsedBytes));
  const lastMedianBytes = median(heapRows.slice(-5).map((sample) => sample.jsHeapUsedBytes));
  const growthBytes = lastMedianBytes - firstMedianBytes;
  const slopeBytesPerMinute = regressionSlopePerMinute(heapRows);
  const increasingRun = longestIncreasingRun(heapRows.map((sample) => sample.jsHeapUsedBytes));
  assert(growthBytes <= maximumJsHeapGrowth && slopeBytesPerMinute <= maximumJsHeapSlopeBytesPerMinute && increasingRun < 10, "v591-soak-js-heap-growth");
  heapAudit = { supported: true, sampleCount: heapRows.length, firstMedianBytes, lastMedianBytes, growthBytes, slopeBytesPerMinute, longestIncreasingRun: increasingRun, status: "passed" };
}

const release = input.release;
assert(release["data-atlas-v591-page-source-manifest-sha"] === sourceManifest.receiptSha256 && release["data-atlas-v591-page-build-fingerprint"] === buildFingerprint, "v591-soak-release-build");
assert(numberAttribute(release, "data-atlas-v591-release-candidate-resources") === 0 && numberAttribute(release, "data-atlas-v591-release-candidate-bytes") === 0 && numberAttribute(release, "data-atlas-v591-release-scene-nodes") === 0 && numberAttribute(release, "data-atlas-v591-release-program-delta") === 0 && numberAttribute(release, "data-atlas-v591-release-renderer-texture-delta") === 0 && release["data-atlas-v591-release-registry-status"] === "baseline" && release["data-atlas-v591-resource-release-status"] === "released-zero", "v591-soak-release-zero");
assert(input.logs.filter((entry) => ["warn", "warning", "error"].some((level) => logSeverity(entry).includes(level))).length === 0, "v591-soak-console");

const unsigned = {
  version: "v591-browser-soak-qualification-v1",
  generatedAt: input.generatedAt,
  status: "passed-30-minute-browser-soak",
  route: "/local-shadow-v591",
  build: { manifestSha256: manifest.manifestSha256, sourceManifestSha256: sourceManifest.receiptSha256, standaloneBuildId, standaloneReceiptSha256: sha256(standaloneReceiptBytes), pageBuildFingerprint: buildFingerprint, deliveryTier: "standalone-full" },
  matrixReceiptSha256: matrix.receiptSha256,
  duration: { startedAtMs: input.startedAtMs, endedAtMs: input.endedAtMs, elapsedMs: input.elapsedMs, minimumElapsedMs, sampleCount: samples.length, minimumSamples, maximumIntervalMs },
  thresholds: { minimumOverviewFps: 55, maximumDrawCalls: 90, maximumGpuBytes: 536870912, maximumByteDrift, maximumResourceCountDrift: 1, maximumJsHeapGrowth, maximumJsHeapSlopeBytesPerMinute, maximumJsHeapIncreasingRun: 9 },
  measurements: { minimumFps: Math.min(...samples.map((sample) => sample.fpsMedian)), maximumDrawCalls: Math.max(...samples.map((sample) => sample.drawCalls)), maximumGpuBytes: Math.max(...gpuBytes), resourceBytesRange: [Math.min(...resourceBytes), Math.max(...resourceBytes)], gpuBytesRange: [Math.min(...gpuBytes), Math.max(...gpuBytes)], texturesRange: [Math.min(...textures), Math.max(...textures)], geometriesRange: [Math.min(...geometries), Math.max(...geometries)], programsRange: [Math.min(...programs), Math.max(...programs)], candidateNodesRange: [Math.min(...candidateNodes), Math.max(...candidateNodes)], candidateResourcesRange: [Math.min(...candidateResources), Math.max(...candidateResources)], jsHeap: heapAudit },
  samples,
  authority: { scientificPayloadSha256: manifest.boundaries.scientificPayloadSha256, payloadStable: true, scientificWriteback: false, presentationOnly: true, formalProductPointer: "v263" },
  releaseAudit: { candidateResources: 0, candidateBytes: 0, candidateSceneNodes: 0, candidateProgramDelta: 0, rendererTextureDelta: 0, registryStatus: "baseline", status: "released-zero" },
  errorAudit: { consoleWarnings: 0, consoleErrors: 0, status: "passed" },
  productionReleaseAuthorized: false,
};
const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
await atomicWrite(outputPath, Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: sealed.status, receiptSha256: sealed.receiptSha256, buildId: standaloneBuildId, duration: sealed.duration, measurements: sealed.measurements, releaseAudit: sealed.releaseAudit }, null, 2));
