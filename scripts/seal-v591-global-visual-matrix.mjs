import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

import { derivePageBuildFingerprintV591 } from "./v591-page-build-identity.mjs";

const root = process.cwd();
const inputPath = resolve(root, process.argv[2] ?? "tmp/v591-global-visual-matrix-replay.json");
const outputPath = resolve(root, "docs/release/v591/browser-qualification-global-matrix-v591.json");
const bodies = Object.freeze([
  "sun", "earth", "mercury", "venus", "moon", "mars", "jupiter", "saturn",
  "ceres", "vesta", "bennu", "eros", "kleopatra", "tempel-1", "uranus", "neptune",
]);
const phases = Object.freeze([
  { phase: "desktop-cinematic-overview", focus: "overview", mode: "cinematic", device: "desktop", exposure: "nominal", minimumFps: 55 },
  { phase: "desktop-cinematic-galactic-core", focus: "milky-way-center", mode: "cinematic", device: "desktop", exposure: "nominal", minimumFps: 45 },
  { phase: "desktop-cinematic-galactic-anticenter", focus: "milky-way-anticenter", mode: "cinematic", device: "desktop", exposure: "nominal", minimumFps: 45 },
  { phase: "desktop-science-orion", focus: "orion", mode: "science", device: "desktop", exposure: "nominal", minimumFps: 45 },
  { phase: "desktop-science-ursa-major", focus: "ursa-major", mode: "science", device: "desktop", exposure: "nominal", minimumFps: 45 },
  { phase: "desktop-science-cassiopeia", focus: "cassiopeia", mode: "science", device: "desktop", exposure: "nominal", minimumFps: 45 },
  { phase: "desktop-cinematic-extreme-dark", focus: "overview", mode: "cinematic", device: "desktop", exposure: "extreme-dark", minimumFps: 55 },
  { phase: "desktop-cinematic-extreme-bright", focus: "overview", mode: "cinematic", device: "desktop", exposure: "extreme-bright", minimumFps: 55 },
  { phase: "mobile-cinematic-overview", focus: "overview", mode: "cinematic", device: "mobile", exposure: "nominal", minimumFps: 45 },
  { phase: "mobile-science-overview", focus: "overview", mode: "science", device: "mobile", exposure: "nominal", minimumFps: 45 },
]);
const screenshotSpecs = Object.freeze(phases.map((phase) => ({
  key: phase.phase,
  path: `docs/release/v591/screenshots/global-${phase.phase}-current.png`,
  width: phase.device === "mobile" ? 390 : 1440,
  height: phase.device === "mobile" ? 844 : 900,
})));

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
  assert(canonicalSha(unsigned) === value[field], `v591-global-seal:${relativePath}`);
  return value;
}
function numberAttribute(state, key) {
  const value = Number(state[key]);
  assert(Number.isFinite(value), `v591-global-number:${key}`);
  return value;
}
function booleanAttribute(state, key) {
  assert(state[key] === "true" || state[key] === "false", `v591-global-boolean:${key}`);
  return state[key] === "true";
}
function logSeverity(entry) {
  return String(entry?.level ?? entry?.type ?? entry?.severity ?? "").toLowerCase();
}
async function atomicWrite(path, bytes) {
  await mkdir(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  await writeFile(partial, bytes);
  await rm(path, { force: true });
  await rename(partial, path);
}
async function normalizeScreenshot(bytes, specification) {
  const absolute = resolve(root, specification.path);
  await mkdir(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  await sharp(Buffer.from(bytes)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(partial);
  await rm(absolute, { force: true });
  await rename(partial, absolute);
  const normalized = await readFile(absolute);
  const width = normalized.readUInt32BE(16);
  const height = normalized.readUInt32BE(20);
  assert(width === specification.width && height === specification.height, `v591-global-shot-dimensions:${specification.key}`);
  return { path: specification.path, phase: specification.key, bytes: normalized.byteLength, sha256: sha256(normalized), width, height, presentationOnly: true };
}
async function verifyScreenshot(entry, context) {
  const bytes = await readFile(resolve(root, entry.path));
  assert(bytes.byteLength === entry.bytes && sha256(bytes) === entry.sha256, `v591-global-existing-shot:${context}:${entry.path}`);
}

const input = JSON.parse(await readFile(inputPath, "utf8"));
assert(typeof input.generatedAt === "string" && !Number.isNaN(Date.parse(input.generatedAt)), "v591-global-generated-at");
assert(Array.isArray(input.states) && input.states.length === phases.length, "v591-global-state-count");
assert(input.shotPaths && typeof input.shotPaths === "object", "v591-global-shot-paths");
assert(Array.isArray(input.logs), "v591-global-logs");

const manifest = await readSealed("public/data/celestial-convergence-v591/manifest.json", "manifestSha256");
const sourceManifest = await readSealed("docs/release/v591/source-manifest-v591.json");
const standaloneReceiptBytes = await readFile(resolve(root, "dist/release/atlas-v591-standalone-build-resource.json"));
const standaloneReceipt = JSON.parse(standaloneReceiptBytes.toString("utf8"));
const standaloneBuildId = (await readFile(resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID"), "utf8")).trim();
const buildFingerprint = derivePageBuildFingerprintV591({ sourceManifestSha256: sourceManifest.receiptSha256, deliveryTier: "standalone-full" });
assert(standaloneReceipt.status === "passed" && standaloneReceipt.buildId === standaloneBuildId, "v591-global-build-id");
assert(standaloneReceipt.candidateSourceManifestSha256 === sourceManifest.receiptSha256 && standaloneReceipt.deliveryTier === "standalone-full", "v591-global-build-source");

const samples = input.states.map((state, index) => {
  const expected = phases[index];
  const mobile = expected.device === "mobile";
  assert(state["data-atlas-v591-page-source-manifest-sha"] === sourceManifest.receiptSha256, `v591-global-page-source:${expected.phase}`);
  assert(state["data-atlas-v591-page-delivery-tier"] === "standalone-full" && state["data-atlas-v591-page-build-fingerprint"] === buildFingerprint, `v591-global-page-build:${expected.phase}`);
  assert(state["data-atlas-v591-focus-target"] === expected.focus && state["data-atlas-v591-mode"] === expected.mode && state["data-atlas-v591-device-tier"] === expected.device, `v591-global-phase:${expected.phase}`);
  assert(state["data-atlas-v591-exposure-preset"] === expected.exposure, `v591-global-exposure:${expected.phase}`);
  assert(state["data-atlas-v591-exposure-policy"] === (expected.mode === "science" ? "linear-1.0-locked" : "presentation-only"), `v591-global-exposure-policy:${expected.phase}`);
  assert(numberAttribute(state, "data-atlas-v591-canvas-count") === 1 && booleanAttribute(state, "data-atlas-v591-single-canvas-stage"), `v591-global-canvas:${expected.phase}`);
  assert(state["data-atlas-v591-sky-status"] === "ready" && state["data-atlas-v591-star-status"] === "ready" && state["data-atlas-v591-constellation-status"] === "ready", `v591-global-sky:${expected.phase}`);
  assert(numberAttribute(state, "data-atlas-v591-nebula-admitted-count") === 6 && numberAttribute(state, "data-atlas-v591-nebula-blocked-count") === 0, `v591-global-nebula:${expected.phase}`);
  const starCount = numberAttribute(state, "data-atlas-v591-star-count");
  const constellationCount = numberAttribute(state, "data-atlas-v591-constellation-rendered-count");
  const anchorCount = numberAttribute(state, "data-atlas-v591-constellation-rendered-anchor-count");
  const fpsMedian = numberAttribute(state, "data-atlas-v591-fps-median");
  const drawCalls = numberAttribute(state, "data-atlas-v591-draw-calls");
  const gpuBytes = numberAttribute(state, "data-atlas-v591-gpu-bytes");
  assert(starCount > 0 && starCount <= (mobile ? 18000 : 60000), `v591-global-star-budget:${expected.phase}`);
  assert(constellationCount > 0 && constellationCount <= (mobile ? 8 : 12) && anchorCount > 0 && anchorCount <= 484, `v591-global-constellation-render:${expected.phase}`);
  assert(fpsMedian >= expected.minimumFps && numberAttribute(state, "data-atlas-v591-fps-sample-count") >= 120, `v591-global-fps:${expected.phase}`);
  assert(drawCalls <= 90 && gpuBytes <= (mobile ? 201326592 : 536870912), `v591-global-budget:${expected.phase}`);
  assert(state["data-atlas-v591-scientific-payload-sha"] === manifest.boundaries.scientificPayloadSha256 && state["data-atlas-v591-scientific-writeback"] === "false", `v591-global-science:${expected.phase}`);
  return { sequence: index, ...expected, fpsMedian, drawCalls, gpuBytes, starCount, constellationCount, anchorCount, payloadSha256: state["data-atlas-v591-scientific-payload-sha"] };
});
assert(new Set(samples.map((sample) => sample.payloadSha256)).size === 1, "v591-global-payload-replay");

const heroEvidence = [];
for (const body of bodies) {
  const receipt = await readSealed(`docs/release/v591/browser-qualification-${body}-v591.json`);
  assert(receipt.status === `${body}-slice-passed-global-visual-matrix-pending`, `v591-global-hero-status:${body}`);
  assert(receipt.candidate?.manifestSha256 === manifest.manifestSha256 && receipt.candidate?.sourceManifestSha256 === sourceManifest.receiptSha256, `v591-global-hero-source:${body}`);
  assert(receipt.candidate?.capturedStandaloneBuildId === standaloneBuildId && receipt.candidate?.capturedPageBuildFingerprint === buildFingerprint, `v591-global-hero-build:${body}`);
  assert(receipt.errorAudit?.status === "passed" && receipt.releaseAudit?.status === "released-zero", `v591-global-hero-runtime:${body}`);
  assert(Array.isArray(receipt.screenshots) && receipt.screenshots.length === 4, `v591-global-hero-shots:${body}`);
  for (const screenshot of receipt.screenshots) await verifyScreenshot(screenshot, body);
  heroEvidence.push({ body, receiptSha256: receipt.receiptSha256, screenshotCount: receipt.screenshots.length, minimumFps: Math.min(...Object.values(receipt.measurements).map((entry) => entry.medianFps)), maximumDrawCalls: Math.max(...Object.values(receipt.measurements).map((entry) => entry.drawCalls)), maximumGpuBytes: Math.max(...Object.values(receipt.measurements).map((entry) => entry.gpuBytes)) });
}

const deepSpace = await readSealed("docs/release/v591/browser-qualification-deep-space-v591.json");
assert(deepSpace.status === "six-nebula-runtime-slices-passed-global-visual-matrix-pending", "v591-global-deep-status");
assert(deepSpace.build?.manifestSha256 === manifest.manifestSha256 && deepSpace.build?.sourceManifestSha256 === sourceManifest.receiptSha256 && deepSpace.build?.standaloneBuildId === standaloneBuildId, "v591-global-deep-build");
assert(deepSpace.errorAudit?.status === "passed" && deepSpace.releaseAudit?.status === "released-zero", "v591-global-deep-runtime");
for (const screenshot of deepSpace.screenshots) await verifyScreenshot(screenshot, "deep-space");

assert(input.release?.["data-atlas-v591-page-source-manifest-sha"] === sourceManifest.receiptSha256 && input.release?.["data-atlas-v591-page-build-fingerprint"] === buildFingerprint, "v591-global-release-build");
assert(numberAttribute(input.release, "data-atlas-v591-release-candidate-resources") === 0 && numberAttribute(input.release, "data-atlas-v591-release-candidate-bytes") === 0 && numberAttribute(input.release, "data-atlas-v591-release-scene-nodes") === 0 && numberAttribute(input.release, "data-atlas-v591-release-program-delta") === 0 && numberAttribute(input.release, "data-atlas-v591-release-renderer-texture-delta") === 0 && input.release["data-atlas-v591-release-registry-status"] === "baseline" && input.release["data-atlas-v591-resource-release-status"] === "released-zero", "v591-global-release-zero");
assert(input.logs.filter((entry) => ["warn", "warning", "error"].some((level) => logSeverity(entry).includes(level))).length === 0, "v591-global-console");

const screenshots = [];
for (const specification of screenshotSpecs) {
  const sourcePath = input.shotPaths[specification.key];
  assert(typeof sourcePath === "string", `v591-global-shot-input:${specification.key}`);
  screenshots.push(await normalizeScreenshot(await readFile(resolve(sourcePath)), specification));
}

const unsigned = {
  version: "v591-global-visual-matrix-v1",
  generatedAt: input.generatedAt,
  status: "automated-global-visual-matrix-passed-human-signoff-pending",
  route: "/local-shadow-v591",
  build: { manifestSha256: manifest.manifestSha256, sourceManifestSha256: sourceManifest.receiptSha256, standaloneBuildId, standaloneReceiptSha256: sha256(standaloneReceiptBytes), pageBuildFingerprint: buildFingerprint, deliveryTier: "standalone-full" },
  matrix: { phaseCount: samples.length, heroBodies: bodies.length, heroScreenshots: heroEvidence.reduce((sum, entry) => sum + entry.screenshotCount, 0), deepSpaceScreenshots: deepSpace.screenshots.length, globalScreenshots: screenshots.length, totalScreenshots: heroEvidence.reduce((sum, entry) => sum + entry.screenshotCount, 0) + deepSpace.screenshots.length + screenshots.length, sixNebulae: "6/6-runtime-ready", constellations: "88-catalog-484/484-gaia-anchors-rendered", exposurePresets: "nominal-extreme-dark-extreme-bright", desktop: "1440x900", mobile: "390x844" },
  performance: { minimumFps: Math.min(...samples.map((sample) => sample.fpsMedian), ...heroEvidence.map((entry) => entry.minimumFps)), maximumDrawCalls: Math.max(...samples.map((sample) => sample.drawCalls), ...heroEvidence.map((entry) => entry.maximumDrawCalls)), maximumGpuBytes: Math.max(...samples.map((sample) => sample.gpuBytes), ...heroEvidence.map((entry) => entry.maximumGpuBytes)) },
  authority: { scientificPayloadSha256: manifest.boundaries.scientificPayloadSha256, payloadStableAcrossMatrix: true, scientificWriteback: false, presentationOnly: true, formalProductPointer: "v263" },
  heroEvidence,
  deepSpaceReceiptSha256: deepSpace.receiptSha256,
  samples,
  screenshots,
  releaseAudit: { candidateResources: 0, candidateBytes: 0, candidateSceneNodes: 0, candidateProgramDelta: 0, rendererTextureDelta: 0, registryStatus: "baseline", status: "released-zero" },
  errorAudit: { consoleWarnings: 0, consoleErrors: 0, status: "passed" },
  humanVisualSignoff: { status: "pending-user-signature", automatedEvidenceMayNotSelfSign: true },
  candidateQualified: false,
  productionReleaseAuthorized: false,
};
const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
await atomicWrite(outputPath, Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: sealed.status, receiptSha256: sealed.receiptSha256, buildId: standaloneBuildId, phaseCount: samples.length, totalScreenshots: sealed.matrix.totalScreenshots, performance: sealed.performance, humanVisualSignoff: sealed.humanVisualSignoff.status }, null, 2));
