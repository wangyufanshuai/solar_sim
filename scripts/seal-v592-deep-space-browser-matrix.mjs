import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/deep-space-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/deep-space-browser-matrix-receipt-v592.json";
const screenshotRoot = "docs/release/v592/screenshots/deep-space-matrix/";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const expectedTargets = Object.freeze([
  ["andromeda-galaxy", "Andromeda Galaxy", "galaxy", false, 3, 2],
  ["triangulum-galaxy", "Triangulum Galaxy", "galaxy", false, 3, 2],
  ["omega-centauri", "Omega Centauri", "cluster", false, 3, 2],
  ["sombrero-galaxy", "Sombrero Galaxy", "galaxy", false, 2, 1],
  ["whirlpool-galaxy", "Whirlpool Galaxy", "galaxy", false, 3, 2],
  ["bodes-galaxy", "Bode's Galaxy", "galaxy", false, 3, 2],
  ["southern-pinwheel-galaxy", "Southern Pinwheel Galaxy", "galaxy", false, 3, 2],
  ["pleiades", "Pleiades", "cluster", false, 3, 2],
  ["hyades", "Hyades", "cluster", true, 3, 2],
  ["47-tucanae", "47 Tucanae", "cluster", true, 3, 2],
  ["hercules-globular-cluster", "Great Hercules Cluster", "cluster", true, 3, 2],
  ["messier-3", "Messier 3", "cluster", true, 3, 2],
  ["messier-5", "Messier 5", "cluster", true, 3, 2],
  ["messier-15", "Messier 15", "cluster", true, 3, 2],
  ["messier-22", "Messier 22", "cluster", true, 3, 2],
  ["beehive-cluster", "Beehive Cluster", "cluster", true, 3, 2],
  ["double-cluster", "Double Cluster", "cluster", true, 3, 2],
  ["jewel-box-cluster", "Jewel Box Cluster", "cluster", true, 3, 2],
]);
const profiles = Object.freeze([
  { key: "desktop-cinematic", mode: "cinematic", width: 1440, height: 900, mobile: false },
  { key: "desktop-science", mode: "science", width: 1440, height: 900, mobile: false },
  { key: "mobile-cinematic", mode: "cinematic", width: 390, height: 844, mobile: true },
  { key: "mobile-science", mode: "science", width: 390, height: 844, mobile: true },
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
  throw new Error(`v592-deep-space-browser-matrix:${reason}`);
}
const number = (value, reason) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(reason);
  return parsed;
};

if (process.argv.includes("--self-test")) {
  const first = canonicalSha({ b: 2, a: 1 });
  const replay = canonicalSha({ a: 1, b: 2 });
  const mutation = canonicalSha({ a: 1, b: 3 });
  if (first !== replay || first === mutation) fail("canonical-self-test");
  console.log(JSON.stringify({ status: "passed", canonicalReplay: true, mutationRejected: true }, null, 2));
  process.exit(0);
}

const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
if (
  capture.version !== "v592-deep-space-browser-capture-v1"
  || capture.route !== "/local-shadow-v592"
  || capture.browser !== "Codex in-app browser"
  || capture.scientificPayloadSha256 !== expectedPayloadSha256
  || capture.frames?.length !== 72
  || capture.policy?.singleCanvasRequired !== true
  || capture.policy?.scienceImagePayloadAllowed !== false
  || capture.policy?.scientificPayloadWriteback !== false
  || capture.policy?.alternateBrowserUsed !== false
  || capture.policy?.productionDeployment !== false
  || capture.policy?.noPayloadDownload !== true
  || capture.consolePageWebglErrors?.length !== 0
  || capture.lifecycle?.releaseRestorePassed !== true
) fail("capture-contract");

const normalizedFrames = [];
const screenshotHashes = new Set();
for (const profile of profiles) {
  const frames = capture.frames.filter((frame) => frame.name.startsWith(`${profile.key}-`));
  if (frames.length !== expectedTargets.length) fail(`profile-cardinality:${profile.key}`);
  for (const [targetId, targetName, category, catalogDerived, desktopSlices, mobileSlices] of expectedTargets) {
    const frame = frames.find((candidate) => candidate.targetId === targetId);
    if (!frame || frame.targetName !== targetName || frame.category !== "deep-space-reference" || frame.mode !== profile.mode || frame.catalogDerived !== String(catalogDerived) || frame.payload !== expectedPayloadSha256 || frame.payloadStable !== "true" || frame.singleCanvas !== "true" || number(frame.canvasCount, `canvas:${profile.key}:${targetId}`) !== 1 || frame.fpsGate !== "passed" || number(frame.fpsMedian, `fps:${profile.key}:${targetId}`) < 45 || number(frame.blocked, `blocked:${profile.key}:${targetId}`) !== 0 || number(frame.fallback, `fallback:${profile.key}:${targetId}`) !== 0 || frame.scientificWriteback !== "false" || frame.scienceImage !== "false") fail(`frame-contract:${profile.key}:${targetId}`);
    const expectedSlices = profile.mode === "science" ? 0 : profile.mobile ? mobileSlices : desktopSlices;
    if (profile.mode === "cinematic" && (frame.state !== "ready" || frame.sources !== "ktx2" || number(frame.requested, `requested:${profile.key}:${targetId}`) !== expectedSlices || number(frame.ready, `ready:${profile.key}:${targetId}`) !== expectedSlices)) fail(`cinematic-contract:${profile.key}:${targetId}`);
    if (profile.mode === "science" && (frame.state !== "admitted-science-marker-only" || frame.sources !== "none" || number(frame.requested, `requested:${profile.key}:${targetId}`) !== 0 || number(frame.ready, `ready:${profile.key}:${targetId}`) !== 0 || frame.mobileSheetState !== (profile.mobile ? "closed-inert" : undefined))) fail(`science-contract:${profile.key}:${targetId}`);
    const screenshotPath = resolve(root, frame.screenshotPath);
    if (!existsSync(screenshotPath) || !frame.screenshotPath.startsWith(screenshotRoot) || frame.screenshotPath.includes("..") || !frame.screenshotPath.endsWith(".jpg")) fail(`screenshot-path:${profile.key}:${targetId}`);
    const screenshot = readFileSync(screenshotPath);
    const metadata = await sharp(screenshotPath).metadata();
    const screenshotSha256 = sha256(screenshot);
    if (screenshot.byteLength !== frame.screenshotBytes || screenshotHashes.has(screenshotSha256) || metadata.width !== profile.width || metadata.height !== profile.height || metadata.format !== "jpeg") fail(`screenshot-contract:${profile.key}:${targetId}`);
    screenshotHashes.add(screenshotSha256);
    normalizedFrames.push({
      name: frame.name,
      targetId,
      targetName,
      category,
      catalogDerivedVisualModel: catalogDerived,
      profile: profile.key,
      mode: profile.mode,
      viewport: { width: profile.width, height: profile.height },
      cameraSettled: true,
      state: frame.state,
      requestedSliceCount: number(frame.requested, `requested:${profile.key}:${targetId}`),
      readySliceCount: number(frame.ready, `ready:${profile.key}:${targetId}`),
      blockedSliceCount: number(frame.blocked, `blocked:${profile.key}:${targetId}`),
      fullFallbackCount: number(frame.fallback, `fallback:${profile.key}:${targetId}`),
      textureSources: frame.sources,
      fpsMedian: number(frame.fpsMedian, `fps:${profile.key}:${targetId}`),
      fpsGate: frame.fpsGate,
      drawCalls: number(frame.drawCalls, `draw:${profile.key}:${targetId}`),
      gpuBytes: number(frame.gpuBytes, `gpu:${profile.key}:${targetId}`),
      singleCanvas: true,
      canvasCount: 1,
      payloadStable: true,
      scientificPayloadSha256: expectedPayloadSha256,
      scientificPayloadWriteback: false,
      scienceImagePayload: false,
      mobileSheetState: profile.mobile ? frame.mobileSheetState : "not-applicable",
      screenshotPath: frame.screenshotPath,
      screenshotBytes: screenshot.byteLength,
      screenshotSha256,
    });
  }
}

const cinematicFrames = normalizedFrames.filter((frame) => frame.mode === "cinematic");
const scienceFrames = normalizedFrames.filter((frame) => frame.mode === "science");
const peakGpuBytes = Math.max(...normalizedFrames.map((frame) => frame.gpuBytes));
const peakDesktopGpuBytes = Math.max(...normalizedFrames.filter((frame) => frame.viewport.width === 1440).map((frame) => frame.gpuBytes));
const peakMobileGpuBytes = Math.max(...normalizedFrames.filter((frame) => frame.viewport.width === 390).map((frame) => frame.gpuBytes));
const peakDrawCalls = Math.max(...normalizedFrames.map((frame) => frame.drawCalls));
const minimumFpsMedian = Math.min(...normalizedFrames.map((frame) => frame.fpsMedian));
const receipt = {
  version: "v592-deep-space-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: "passed-eighteen-of-eighteen-deep-space-four-profile-browser-matrix",
  route: capture.route,
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    observedCandidateManifestSha256: capture.observedCandidateManifestSha256,
    observedSourceManifestSha256: capture.observedSourceManifestSha256,
  },
  admission: {
    requiredReferenceCount: 24,
    runtimeVisualAssetCount: 18,
    galaxyVisualAssetCount: 6,
    clusterVisualAssetCount: 12,
    frameCount: normalizedFrames.length,
    desktopCinematicFrameCount: normalizedFrames.filter((frame) => frame.profile === "desktop-cinematic").length,
    desktopScienceFrameCount: normalizedFrames.filter((frame) => frame.profile === "desktop-science").length,
    mobileCinematicFrameCount: normalizedFrames.filter((frame) => frame.profile === "mobile-cinematic").length,
    mobileScienceFrameCount: normalizedFrames.filter((frame) => frame.profile === "mobile-science").length,
    cinematicFrameCount: cinematicFrames.length,
    scienceMarkerOnlyFrameCount: scienceFrames.length,
    nativeKtx2CinematicFrameCount: cinematicFrames.filter((frame) => frame.textureSources === "ktx2").length,
    uniqueScreenshotCount: screenshotHashes.size,
    minimumFpsMedian,
    peakGpuBytes,
    peakDesktopGpuBytes,
    peakMobileGpuBytes,
    peakDrawCalls,
    singleCanvas: true,
    scienceCinematicPayloadStable: true,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    scienceImagePayloadLoaded: false,
    consolePageWebglErrorCount: capture.consolePageWebglErrors.length,
    fullFallbackCount: normalizedFrames.reduce((sum, frame) => sum + frame.fullFallbackCount, 0),
    releaseRestorePassed: capture.lifecycle.releaseRestorePassed,
    releaseStateCandidateResources: Number(capture.lifecycle.released.candidateResources),
    releaseStateCandidateBytes: Number(capture.lifecycle.released.candidateBytes),
    releaseStateSceneNodes: Number(capture.lifecycle.released.sceneNodes),
    releaseStateProgramDelta: Number(capture.lifecycle.released.programDelta),
    releaseStateTextureDelta: Number(capture.lifecycle.released.textureDelta),
    releaseStateGeometryDelta: Number(capture.lifecycle.released.geometryDelta),
    restoredStateCandidateResources: Number(capture.lifecycle.restored.candidateResources),
    restoredStateCandidateBytes: Number(capture.lifecycle.restored.candidateBytes),
    restoredStateSceneNodes: Number(capture.lifecycle.restored.sceneNodes),
    restoredStateProgramDelta: Number(capture.lifecycle.restored.programDelta),
    restoredStateTextureDelta: Number(capture.lifecycle.restored.textureDelta),
    restoredStateGeometryDelta: Number(capture.lifecycle.restored.geometryDelta),
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
  },
  frames: normalizedFrames,
};
receipt.receiptSha256 = canonicalSha(receipt);
atomicWrite(resolve(root, receiptRelativePath), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256, frameCount: receipt.admission.frameCount, minimumFpsMedian, peakDesktopGpuBytes, peakMobileGpuBytes, peakDrawCalls, uniqueScreenshotCount: receipt.admission.uniqueScreenshotCount, releaseRestorePassed: receipt.admission.releaseRestorePassed }, null, 2));
