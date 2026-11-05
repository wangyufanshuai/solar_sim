import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/deep-space-analytic-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/deep-space-analytic-browser-matrix-receipt-v592.json";
const screenshotRoot = "docs/release/v592/screenshots/deep-space-analytic-matrix/";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const expectedManifestSha256 = /^[a-f0-9]{64}$/;
const analyticTargets = Object.freeze([
  ["centaurus-a", "Centaurus A"],
  ["cigar-galaxy", "Cigar Galaxy"],
  ["pinwheel-galaxy", "Pinwheel Galaxy"],
  ["virgo-a-galaxy", "Virgo A"],
  ["black-eye-galaxy", "Black Eye Galaxy"],
  ["sunflower-galaxy", "Sunflower Galaxy"],
]);
const profiles = Object.freeze([
  { key: "desktop-cinematic", mode: "cinematic", width: 1440, height: 900 },
  { key: "desktop-science", mode: "science", width: 1440, height: 900 },
  { key: "mobile-cinematic", mode: "cinematic", width: 390, height: 844 },
  { key: "mobile-science", mode: "science", width: 390, height: 844 },
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function fail(reason) {
  throw new Error(`v592-deep-space-analytic-browser-matrix:${reason}`);
}
function number(value, reason) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(reason);
  return parsed;
}
const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
if (
  capture.version !== "v592-deep-space-analytic-browser-capture-v1"
  || capture.route !== "/local-shadow-v592"
  || capture.browser !== "Codex in-app browser"
  || capture.scientificPayloadSha256 !== expectedPayloadSha256
  || capture.frames?.length !== 24
  || capture.policy?.singleCanvasRequired !== true
  || capture.policy?.scienceImagePayloadAllowed !== false
  || capture.policy?.scientificPayloadWriteback !== false
  || capture.policy?.alternateBrowserUsed !== false
  || capture.policy?.productionDeployment !== false
  || capture.policy?.noPayloadDownload !== true
  || capture.policy?.noSyntheticEvidence !== true
  || capture.consolePageWebglErrors?.length !== 0
  || capture.lifecycle?.releaseRestorePassed !== true
) fail("capture-contract");
if (!expectedManifestSha256.test(capture.observedCandidateManifestSha256) || !expectedManifestSha256.test(capture.observedSourceManifestSha256)) {
  fail("observed-manifest-sha");
}
if (
  capture.lifecycle.released?.candidateResources !== 0
  || capture.lifecycle.released?.candidateBytes !== 0
  || capture.lifecycle.released?.sceneNodes !== 0
  || capture.lifecycle.released?.programDelta !== 0
  || capture.lifecycle.released?.textureDelta !== 0
  || capture.lifecycle.released?.geometryDelta !== 0
) fail("release-not-zero");

const targetById = new Map(analyticTargets);
const profileByKey = new Map(profiles.map((profile) => [profile.key, profile]));
const screenshotHashes = new Set();
const normalizedFrames = [];
for (const frame of capture.frames) {
  const profile = profileByKey.get(frame.profile);
  if (!profile || frame.category !== "galaxy" || targetById.get(frame.targetId) !== frame.targetName) fail(`identity:${frame.name}`);
  if (frame.mode !== profile.mode || frame.viewport?.width !== profile.width || frame.viewport?.height !== profile.height) fail(`profile:${frame.name}`);
  if (frame.visualModelKind !== "openngc-catalog-derived-galaxy-analytic" || frame.analyticModel !== "true") fail(`analytic-kind:${frame.name}`);
  if (frame.payload !== expectedPayloadSha256 || frame.payloadStable !== "true" || frame.scientificWriteback !== "false" || frame.scienceImage !== "false") fail(`payload:${frame.name}`);
  if (frame.cameraSettled !== "true" || frame.singleCanvas !== "true" || number(frame.canvasCount, `canvas:${frame.name}`) !== 1) fail(`canvas:${frame.name}`);
  if (frame.fpsGate !== "passed" || number(frame.fpsMedian, `fps:${frame.name}`) < 45 || number(frame.fpsSampleCount, `fps-samples:${frame.name}`) < 20) fail(`fps:${frame.name}`);
  if (number(frame.gpuBytes, `gpu:${frame.name}`) > (profile.width === 390 ? 192 : 512) * 1024 * 1024) fail(`gpu:${frame.name}`);
  if (number(frame.drawCalls, `draw:${frame.name}`) > 60) fail(`draw:${frame.name}`);
  if (frame.telemetrySource !== "three-info-plus-v592-resource-snapshot") fail(`telemetry:${frame.name}`);
  if (profile.mode === "cinematic") {
    if (frame.state !== "ready" || frame.sources !== "openngc-analytic-shader" || number(frame.requested, `requested:${frame.name}`) !== 1 || number(frame.ready, `ready:${frame.name}`) !== 1) fail(`cinematic:${frame.name}`);
  } else if (
    frame.state !== "admitted-science-marker-only"
    || frame.sources !== "none"
    || number(frame.requested, `requested:${frame.name}`) !== 0
    || number(frame.ready, `ready:${frame.name}`) !== 0
    || (profile.width === 390 && frame.mobileSheetState !== "closed-inert")
  ) fail(`science:${frame.name}`);
  if (number(frame.blocked, `blocked:${frame.name}`) !== 0 || number(frame.fallback, `fallback:${frame.name}`) !== 0) fail(`blocked:${frame.name}`);
  const screenshotPath = resolve(root, frame.screenshotPath);
  if (!frame.screenshotPath.startsWith(screenshotRoot) || frame.screenshotPath.includes("..") || !frame.screenshotPath.endsWith(".jpg") || !existsSync(screenshotPath)) fail(`screenshot-path:${frame.name}`);
  const screenshot = readFileSync(screenshotPath);
  const metadata = await sharp(screenshotPath, { limitInputPixels: false }).metadata();
  const screenshotSha256 = sha256(screenshot);
  if (metadata.width !== profile.width || metadata.height !== profile.height || metadata.format !== "jpeg" || screenshot.byteLength !== frame.screenshotBytes || screenshotSha256 !== frame.screenshotSha256 || screenshotHashes.has(screenshotSha256)) fail(`screenshot:${frame.name}`);
  screenshotHashes.add(screenshotSha256);
  normalizedFrames.push({
    name: frame.name,
    targetId: frame.targetId,
    targetName: frame.targetName,
    category: "galaxy",
    analyticModel: true,
    visualModelKind: frame.visualModelKind,
    profile: profile.key,
    mode: profile.mode,
    viewport: { width: profile.width, height: profile.height },
    state: frame.state,
    cameraSettled: true,
    requestedSliceCount: number(frame.requested, `requested:${frame.name}`),
    readySliceCount: number(frame.ready, `ready:${frame.name}`),
    blockedSliceCount: number(frame.blocked, `blocked:${frame.name}`),
    fullFallbackCount: number(frame.fallback, `fallback:${frame.name}`),
    textureSources: frame.sources,
    fpsMedian: number(frame.fpsMedian, `fps:${frame.name}`),
    fpsSampleCount: number(frame.fpsSampleCount, `fps-samples:${frame.name}`),
    fpsGate: frame.fpsGate,
    drawCalls: number(frame.drawCalls, `draw:${frame.name}`),
    gpuBytes: number(frame.gpuBytes, `gpu:${frame.name}`),
    telemetrySource: frame.telemetrySource,
    singleCanvas: true,
    canvasCount: 1,
    payloadStable: true,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    scienceImagePayload: false,
    mobileSheetState: profile.width === 390 ? frame.mobileSheetState : "not-applicable",
    screenshotPath: frame.screenshotPath,
    screenshotBytes: screenshot.byteLength,
    screenshotSha256,
  });
}
if (new Set(normalizedFrames.map((frame) => frame.name)).size !== 24 || screenshotHashes.size !== 24) fail("cardinality");
for (const profile of profiles) if (normalizedFrames.filter((frame) => frame.profile === profile.key).length !== 6) fail(`profile-cardinality:${profile.key}`);

const cinematicFrames = normalizedFrames.filter((frame) => frame.mode === "cinematic");
const scienceFrames = normalizedFrames.filter((frame) => frame.mode === "science");
const desktopFrames = normalizedFrames.filter((frame) => frame.viewport.width === 1440);
const mobileFrames = normalizedFrames.filter((frame) => frame.viewport.width === 390);
const receipt = {
  version: "v592-deep-space-analytic-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: "passed-six-openngc-analytic-galaxies-four-profile-browser-matrix",
  route: capture.route,
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    observedCandidateManifestSha256: capture.observedCandidateManifestSha256,
    observedSourceManifestSha256: capture.observedSourceManifestSha256,
  },
  admission: {
    analyticGalaxyCount: analyticTargets.length,
    frameCount: normalizedFrames.length,
    desktopCinematicFrameCount: desktopFrames.filter((frame) => frame.mode === "cinematic").length,
    desktopScienceFrameCount: desktopFrames.filter((frame) => frame.mode === "science").length,
    mobileCinematicFrameCount: mobileFrames.filter((frame) => frame.mode === "cinematic").length,
    mobileScienceFrameCount: mobileFrames.filter((frame) => frame.mode === "science").length,
    cinematicFrameCount: cinematicFrames.length,
    scienceMarkerOnlyFrameCount: scienceFrames.length,
    uniqueScreenshotCount: screenshotHashes.size,
    minimumFpsMedian: Math.min(...normalizedFrames.map((frame) => frame.fpsMedian)),
    peakDesktopGpuBytes: Math.max(...desktopFrames.map((frame) => frame.gpuBytes)),
    peakMobileGpuBytes: Math.max(...mobileFrames.map((frame) => frame.gpuBytes)),
    peakDrawCalls: Math.max(...normalizedFrames.map((frame) => frame.drawCalls)),
    singleCanvas: true,
    scienceCinematicPayloadStable: true,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    scienceImagePayloadLoaded: false,
    consolePageWebglErrorCount: capture.consolePageWebglErrors.length,
    fullFallbackCount: normalizedFrames.reduce((sum, frame) => sum + frame.fullFallbackCount, 0),
    releaseRestorePassed: capture.lifecycle.releaseRestorePassed,
    releaseStateCandidateResources: capture.lifecycle.released.candidateResources,
    releaseStateCandidateBytes: capture.lifecycle.released.candidateBytes,
    releaseStateSceneNodes: capture.lifecycle.released.sceneNodes,
    releaseStateProgramDelta: capture.lifecycle.released.programDelta,
    releaseStateTextureDelta: capture.lifecycle.released.textureDelta,
    releaseStateGeometryDelta: capture.lifecycle.released.geometryDelta,
    restoredStateCandidateResources: capture.lifecycle.restored.candidateResources,
    restoredStateCandidateBytes: capture.lifecycle.restored.candidateBytes,
    restoredStateSceneNodes: capture.lifecycle.restored.sceneNodes,
    restoredStateProgramDelta: capture.lifecycle.restored.programDelta,
    restoredStateTextureDelta: capture.lifecycle.restored.textureDelta,
    restoredStateGeometryDelta: capture.lifecycle.restored.geometryDelta,
    humanVisualSignoff: "pending-full-v592-goal",
  },
  thresholds: {
    minimumCloseupFps: 45,
    maximumDesktopGpuBytes: 512 * 1024 * 1024,
    maximumMobileGpuBytes: 192 * 1024 * 1024,
    maximumCloseupDrawCalls: 60,
  },
  policy: {
    browser: capture.browser,
    alternateBrowserUsed: false,
    presentationOnly: true,
    scienceImagePayloadAllowed: false,
    noPayloadDownload: true,
    noSyntheticEvidence: true,
    productionDeployment: false,
    historicalReceiptRewritten: false,
  },
  frames: normalizedFrames,
};
receipt.receiptSha256 = canonicalSha(receipt);
atomicWrite(resolve(root, receiptRelativePath), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256, frameCount: receipt.admission.frameCount, minimumFpsMedian: receipt.admission.minimumFpsMedian, peakDesktopGpuBytes: receipt.admission.peakDesktopGpuBytes, peakMobileGpuBytes: receipt.admission.peakMobileGpuBytes, peakDrawCalls: receipt.admission.peakDrawCalls, uniqueScreenshotCount: receipt.admission.uniqueScreenshotCount, releaseRestorePassed: receipt.admission.releaseRestorePassed }, null, 2));
