import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import {
  assertPageBuildIdentityV591,
  derivePageBuildFingerprintV591,
} from "./v591-page-build-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const receiptPath = "docs/release/v591/browser-qualification-deep-space-v591.json";
const overlayPath = "public/data/celestial-convergence-v591/nebula-asset-overlay.json";
const manifestPath = "public/data/celestial-convergence-v591/manifest.json";
const sourceManifestPath = "docs/release/v591/source-manifest-v591.json";
const standaloneReceiptPath = "dist/release/atlas-v591-standalone-build-resource.json";
const phases = Object.freeze([
  { phase: "desktop-cinematic-overview", focus: "overview", mode: "cinematic", device: "desktop", requested: 3, ready: 3, requestedIds: "orion-nebula,lagoon-nebula,eagle-nebula" },
  { phase: "desktop-cinematic-orion", focus: "orion-nebula", mode: "cinematic", device: "desktop", requested: 1, ready: 1, requestedIds: "orion-nebula" },
  { phase: "desktop-cinematic-lagoon", focus: "lagoon-nebula", mode: "cinematic", device: "desktop", requested: 1, ready: 1, requestedIds: "lagoon-nebula" },
  { phase: "desktop-cinematic-eagle", focus: "eagle-nebula", mode: "cinematic", device: "desktop", requested: 1, ready: 1, requestedIds: "eagle-nebula" },
  { phase: "desktop-cinematic-helix", focus: "helix-nebula", mode: "cinematic", device: "desktop", requested: 1, ready: 1, requestedIds: "helix-nebula" },
  { phase: "desktop-cinematic-veil", focus: "veil-nebula", mode: "cinematic", device: "desktop", requested: 1, ready: 1, requestedIds: "veil-nebula" },
  { phase: "desktop-cinematic-north-america", focus: "north-america-nebula", mode: "cinematic", device: "desktop", requested: 1, ready: 1, requestedIds: "north-america-nebula" },
  { phase: "desktop-science-overview", focus: "overview", mode: "science", device: "desktop", requested: 0, ready: 0, requestedIds: "none" },
  { phase: "mobile-cinematic-veil", focus: "veil-nebula", mode: "cinematic", device: "mobile", requested: 1, ready: 1, requestedIds: "veil-nebula" },
  { phase: "mobile-science-veil", focus: "veil-nebula", mode: "science", device: "mobile", requested: 0, ready: 0, requestedIds: "none" },
]);
const screenshotInputs = Object.freeze([
  { key: "desktopCinematicOverview", path: "docs/release/v591/screenshots/deep-space-desktop-cinematic-overview-1440x900-current.png", width: 1440, height: 900, phase: "desktop-cinematic-overview" },
  { key: "desktopCinematicVeil", path: "docs/release/v591/screenshots/deep-space-desktop-cinematic-veil-1440x900-current.png", width: 1440, height: 900, phase: "desktop-cinematic-veil" },
  { key: "desktopScienceOverview", path: "docs/release/v591/screenshots/deep-space-desktop-science-overview-1440x900-current.png", width: 1440, height: 900, phase: "desktop-science-overview" },
  { key: "mobileCinematicVeil", path: "docs/release/v591/screenshots/deep-space-mobile-cinematic-veil-390x844-current.png", width: 390, height: 844, phase: "mobile-cinematic-veil" },
]);

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
function numberAttribute(state, key) {
  const value = Number(state[key]);
  assert(Number.isFinite(value), `v591-deep-space-number:${key}`);
  return value;
}
function booleanAttribute(state, key) {
  assert(state[key] === "true" || state[key] === "false", `v591-deep-space-boolean:${key}`);
  return state[key] === "true";
}
function readLogSeverity(entry) {
  const candidate = [entry?.level, entry?.type, entry?.severity].find((value) => typeof value === "string");
  return String(candidate ?? "").toLowerCase();
}
async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), "utf8"));
}
async function replaceFileAtomically(path, bytes) {
  const partial = `${path}.part`;
  await writeFile(partial, bytes);
  await rm(path, { force: true });
  await rename(partial, path);
}
async function normalizeScreenshot(input, targetPath) {
  const absolute = resolve(root, targetPath);
  const partial = `${absolute}.part`;
  await sharp(Buffer.from(input)).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(partial);
  await rm(absolute, { force: true });
  await rename(partial, absolute);
  const bytes = await readFile(absolute);
  assert(bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", `v591-deep-space-png:${targetPath}`);
  return { path: targetPath, bytes: bytes.byteLength, sha256: sha256(bytes), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
function sampleFromState(state, expected, sequence) {
  return {
    sequence,
    phase: expected.phase,
    viewport: expected.device === "mobile" ? "390x844" : "1440x900",
    focusTarget: state["data-atlas-v591-focus-target"],
    mode: state["data-atlas-v591-mode"],
    deviceTier: state["data-atlas-v591-device-tier"],
    canvasCount: numberAttribute(state, "data-atlas-v591-canvas-count"),
    singleCanvas: booleanAttribute(state, "data-atlas-v591-single-canvas-stage"),
    deepSpaceStatus: state["data-atlas-v591-deep-space-status"],
    skyStatus: state["data-atlas-v591-sky-status"],
    starStatus: state["data-atlas-v591-star-status"],
    constellationStatus: state["data-atlas-v591-constellation-status"],
    admittedCount: numberAttribute(state, "data-atlas-v591-nebula-admitted-count"),
    blockedCount: numberAttribute(state, "data-atlas-v591-nebula-blocked-count"),
    nebulaStatus: state["data-atlas-v591-nebula-status"],
    requestedImpostorCount: numberAttribute(state, "data-atlas-v591-nebula-requested-impostor-count"),
    readyImpostorCount: numberAttribute(state, "data-atlas-v591-nebula-impostor-count"),
    runtimeBlockedImpostorCount: numberAttribute(state, "data-atlas-v591-nebula-runtime-blocked-impostor-count"),
    requestedIds: state["data-atlas-v591-nebula-requested-ids"],
    readyIds: state["data-atlas-v591-nebula-ready-ids"],
    blockedIds: state["data-atlas-v591-nebula-blocked-ids"],
    fpsMedian: numberAttribute(state, "data-atlas-v591-fps-median"),
    fpsSampleCount: numberAttribute(state, "data-atlas-v591-fps-sample-count"),
    drawCalls: numberAttribute(state, "data-atlas-v591-draw-calls"),
    gpuBytes: numberAttribute(state, "data-atlas-v591-gpu-bytes"),
    scientificPayloadSha256: state["data-atlas-v591-scientific-payload-sha"],
    scientificWriteback: state["data-atlas-v591-scientific-writeback"],
    pageSourceManifestSha256: state["data-atlas-v591-page-source-manifest-sha"],
    pageDeliveryTier: state["data-atlas-v591-page-delivery-tier"],
    pageBuildFingerprint: state["data-atlas-v591-page-build-fingerprint"],
  };
}

export async function refreshDeepSpaceBrowserQualificationV591({ states, release, shots, logs = [] }) {
  assert(Array.isArray(states) && states.length === phases.length, "v591-deep-space-state-count");
  assert(release && typeof release === "object", "v591-deep-space-release");
  assert(shots && typeof shots === "object", "v591-deep-space-shots");
  assert(Array.isArray(logs), "v591-deep-space-logs");

  const manifest = await readJson(manifestPath);
  const overlay = await readJson(overlayPath);
  const sourceManifest = await readJson(sourceManifestPath);
  const standaloneReceiptBytes = await readFile(resolve(root, standaloneReceiptPath));
  const standaloneReceipt = JSON.parse(standaloneReceiptBytes.toString("utf8"));
  const standaloneBuildId = (await readFile(resolve(root, ".next-atlas-v591-standalone-current/BUILD_ID"), "utf8")).trim();
  const expectedPageBuildIdentity = {
    sourceManifestSha256: sourceManifest.receiptSha256,
    deliveryTier: "standalone-full",
    buildFingerprint: derivePageBuildFingerprintV591({ sourceManifestSha256: sourceManifest.receiptSha256, deliveryTier: "standalone-full" }),
  };
  assert(standaloneReceipt.status === "passed" && standaloneReceipt.buildId === standaloneBuildId, "v591-deep-space-build-id");
  assert(standaloneReceipt.candidateSourceManifestSha256 === sourceManifest.receiptSha256, "v591-deep-space-build-source");
  assert(manifest.nebulaAssetOverlay?.sha256 === overlay.receiptSha256 && overlay.status === "6-of-6-runtime-admitted" && overlay.assets?.length === 6 && overlay.blocked?.length === 0, "v591-deep-space-overlay");

  const orderedReplay = states.map((state, sequence) => {
    const expected = phases[sequence];
    assertPageBuildIdentityV591(state, expectedPageBuildIdentity, expected.phase);
    const sample = sampleFromState(state, expected, sequence);
    const science = expected.mode === "science";
    assert(sample.focusTarget === expected.focus && sample.mode === expected.mode && sample.deviceTier === expected.device, `v591-deep-space-phase:${expected.phase}`);
    assert(sample.canvasCount === 1 && sample.singleCanvas && sample.deepSpaceStatus === "ready" && sample.skyStatus === "ready" && sample.starStatus === "ready" && sample.constellationStatus === "ready", `v591-deep-space-runtime:${expected.phase}`);
    assert(sample.admittedCount === 6 && sample.blockedCount === 0 && sample.blockedIds === "", `v591-deep-space-admission:${expected.phase}`);
    assert(sample.requestedImpostorCount === expected.requested && sample.readyImpostorCount === expected.ready && sample.runtimeBlockedImpostorCount === 0, `v591-deep-space-readiness:${expected.phase}`);
    assert(sample.requestedIds === expected.requestedIds && sample.readyIds === (expected.ready > 0 ? expected.requestedIds : "none"), `v591-deep-space-identity:${expected.phase}`);
    assert(sample.nebulaStatus === (science ? "science-marker-only" : "ready"), `v591-deep-space-mode-policy:${expected.phase}`);
    assert(sample.fpsMedian >= 45 && sample.fpsSampleCount >= 120, `v591-deep-space-fps:${expected.phase}`);
    assert(sample.drawCalls <= 90 && sample.gpuBytes <= (expected.device === "mobile" ? 201326592 : 536870912), `v591-deep-space-budget:${expected.phase}`);
    assert(sample.scientificPayloadSha256 === manifest.boundaries.scientificPayloadSha256 && sample.scientificWriteback === "false", `v591-deep-space-science:${expected.phase}`);
    return sample;
  });
  assert(new Set(orderedReplay.map((sample) => sample.scientificPayloadSha256)).size === 1, "v591-deep-space-payload-replay");
  assertPageBuildIdentityV591(release, expectedPageBuildIdentity, "release");
  const releaseAudit = {
    candidateResources: numberAttribute(release, "data-atlas-v591-release-candidate-resources"),
    candidateBytes: numberAttribute(release, "data-atlas-v591-release-candidate-bytes"),
    candidateSceneNodes: numberAttribute(release, "data-atlas-v591-release-scene-nodes"),
    candidateProgramDelta: numberAttribute(release, "data-atlas-v591-release-program-delta"),
    rendererTextureDelta: numberAttribute(release, "data-atlas-v591-release-renderer-texture-delta"),
    registryStatus: release["data-atlas-v591-release-registry-status"],
    status: release["data-atlas-v591-resource-release-status"],
  };
  assert(releaseAudit.candidateResources === 0 && releaseAudit.candidateBytes === 0 && releaseAudit.candidateSceneNodes === 0 && releaseAudit.candidateProgramDelta === 0 && releaseAudit.rendererTextureDelta === 0 && releaseAudit.registryStatus === "baseline" && releaseAudit.status === "released-zero", "v591-deep-space-release-zero");

  const screenshots = [];
  for (const specification of screenshotInputs) {
    assert(shots[specification.key], `v591-deep-space-screenshot-input:${specification.key}`);
    const metadata = await normalizeScreenshot(shots[specification.key], specification.path);
    assert(metadata.width === specification.width && metadata.height === specification.height, `v591-deep-space-screenshot-dimensions:${specification.key}`);
    screenshots.push({ ...metadata, phase: specification.phase, presentationOnly: true });
  }
  const warningCount = logs.filter((entry) => readLogSeverity(entry).includes("warn")).length;
  const errorCount = logs.filter((entry) => readLogSeverity(entry).includes("error")).length;
  assert(warningCount === 0 && errorCount === 0, "v591-deep-space-console");

  const unsigned = {
    version: "v591-deep-space-browser-qualification-v1",
    generatedAt: new Date().toISOString(),
    status: "six-nebula-runtime-slices-passed-global-visual-matrix-pending",
    route: "/local-shadow-v591",
    build: {
      manifestSha256: manifest.manifestSha256,
      sourceManifestSha256: sourceManifest.receiptSha256,
      standaloneBuildId,
      standaloneReceiptSha256: sha256(standaloneReceiptBytes),
      pageBuildFingerprint: expectedPageBuildIdentity.buildFingerprint,
      deliveryTier: expectedPageBuildIdentity.deliveryTier,
    },
    overlay: {
      sha256: overlay.receiptSha256,
      status: overlay.status,
      admittedCount: overlay.assets.length,
      blockedCount: overlay.blocked.length,
      sourceIds: overlay.assets.map((asset) => `${asset.id}:${asset.nasaId}`),
    },
    runtime: {
      canvasCount: 1,
      desktopOverview: "3-requested-3-ready-0-blocked",
      sixFocusedNebulae: "6-of-6-one-requested-one-ready-0-blocked",
      scienceImagery: "0-requested-0-ready",
      mobileVeil: "1-requested-1-ready-0-blocked",
      scientificPayloadSha256: manifest.boundaries.scientificPayloadSha256,
      scientificPayloadStableAcrossModesAndDeviceTiers: true,
      scientificWriteback: false,
      presentationOnly: true,
    },
    orderedReplay,
    releaseAudit,
    screenshots,
    errorAudit: { pageConsoleWarnings: warningCount, pageConsoleErrors: errorCount, status: "passed", collection: "tab.dev.logs-after-deep-space-replay" },
    scope: { nebulae: "6/6-runtime-ready", globalVisualMatrix: "pending", soak30Minutes: "pending", candidateQualified: false, formalProductPointer: "v263" },
  };
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  await replaceFileAtomically(resolve(root, receiptPath), Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8"));
  return { status: sealed.status, receiptSha256: sealed.receiptSha256, buildId: standaloneBuildId, screenshots: sealed.screenshots, releaseAudit };
}
