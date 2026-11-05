import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/nebula-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/nebula-browser-matrix-receipt-v592.json";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const expectedTargets = Object.freeze({
  "heart-nebula": "IC 1805",
  "soul-nebula": "IC 1848",
  "witch-head-nebula": "IC 2118",
  "flame-nebula": "NGC 2024",
  "pacman-nebula": "NGC 281",
  "running-chicken-nebula": "IC 2944",
});
const maximumDesktopGpuBytes = 512 * 1024 * 1024;
const maximumMobileGpuBytes = 192 * 1024 * 1024;
const maximumCloseupDrawCalls = 60;
const minimumCloseupFps = 45;
const minimumRoiMeanLuminance = 5.25;
const minimumRoiNonBlackFraction = 0.02;
const minimumRoiBrightFraction = 0.008;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
function verifySealed(path, field) {
  const document = readJson(path);
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-nebula-browser-baseline-seal:${path}`);
  return document;
}
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function fail(reason) {
  throw new Error(`v592-nebula-browser-matrix:${reason}`);
}

function resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest, sourceManifest, assetManifest, existingReceipt }) {
  const directIdentity = (
    capture.observedCandidateManifestSha256 === candidateManifest.manifestSha256
    && capture.observedSourceManifestSha256 === sourceManifest.receiptSha256
  );
  if (directIdentity) return "direct-pre-admission";

  const receiptIdentity = existingReceipt?.receiptSha256;
  const linkedReplay = (
    typeof receiptIdentity === "string"
    && candidateManifest.governance?.sourceManifestSha256 === sourceManifest.receiptSha256
    && candidateManifest.deepSpace?.browserMatrixReceiptSha256 === receiptIdentity
    && existingReceipt.source?.capturePath === captureRelativePath
    && existingReceipt.source?.captureBytes === captureBytes.byteLength
    && existingReceipt.source?.captureSha256 === sha256(captureBytes)
    && existingReceipt.source?.observedCandidateManifestSha256 === capture.observedCandidateManifestSha256
    && existingReceipt.source?.observedSourceManifestSha256 === capture.observedSourceManifestSha256
    && existingReceipt.source?.nebulaVisualManifestSha256 === assetManifest.manifestSha256
  );
  if (linkedReplay) return "linked-post-admission-replay";
  return null;
}

if (process.argv.includes("--self-test")) {
  const captureBytes = Buffer.from("sealed-nebula-browser-capture", "utf8");
  const capture = { observedCandidateManifestSha256: "pre-manifest", observedSourceManifestSha256: "pre-source" };
  const sourceManifest = { receiptSha256: "current-source" };
  const assetManifest = { manifestSha256: "nebula-assets" };
  const existingReceipt = {
    receiptSha256: "browser-receipt",
    source: {
      capturePath: captureRelativePath,
      captureBytes: captureBytes.byteLength,
      captureSha256: sha256(captureBytes),
      observedCandidateManifestSha256: "pre-manifest",
      observedSourceManifestSha256: "pre-source",
      nebulaVisualManifestSha256: "nebula-assets",
    },
  };
  const direct = resolveCaptureIdentityMode({
    capture,
    captureBytes,
    candidateManifest: { manifestSha256: "pre-manifest" },
    sourceManifest: { receiptSha256: "pre-source" },
    assetManifest,
    existingReceipt: null,
  });
  const replayCandidate = {
    manifestSha256: "current-manifest",
    governance: { sourceManifestSha256: "current-source" },
    deepSpace: { browserMatrixReceiptSha256: "browser-receipt" },
  };
  const replay = resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest: replayCandidate, sourceManifest, assetManifest, existingReceipt });
  const mutation = resolveCaptureIdentityMode({
    capture,
    captureBytes: Buffer.from("mutated-nebula-browser-capture", "utf8"),
    candidateManifest: replayCandidate,
    sourceManifest,
    assetManifest,
    existingReceipt,
  });
  const unlinked = resolveCaptureIdentityMode({
    capture,
    captureBytes,
    candidateManifest: { ...replayCandidate, deepSpace: { browserMatrixReceiptSha256: "other-receipt" } },
    sourceManifest,
    assetManifest,
    existingReceipt,
  });
  if (direct !== "direct-pre-admission" || replay !== "linked-post-admission-replay" || mutation !== null || unlinked !== null) {
    fail("identity-replay-self-test");
  }
  console.log(JSON.stringify({ status: "passed", direct, replay, mutationRejected: true, unlinkedReceiptRejected: true }, null, 2));
  process.exit(0);
}

async function analyzeCinematicRoi(screenshotPath, mobile) {
  const image = sharp(screenshotPath);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) fail(`screenshot-dimensions:${screenshotPath}`);
  const roi = {
    left: Math.floor(metadata.width * (mobile ? 0.1 : 0.2)),
    top: Math.floor(metadata.height * 0.15),
    width: Math.floor(metadata.width * (mobile ? 0.8 : 0.6)),
    height: Math.floor(metadata.height * 0.6),
  };
  const { data, info } = await image.extract(roi).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let luminanceSum = 0;
  let nonBlackCount = 0;
  let brightCount = 0;
  const pixelCount = data.byteLength / info.channels;
  for (let offset = 0; offset < data.byteLength; offset += info.channels) {
    const luminance = 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
    luminanceSum += luminance;
    if (luminance > 18) nonBlackCount += 1;
    if (luminance > 42) brightCount += 1;
  }
  return {
    imageWidth: metadata.width,
    imageHeight: metadata.height,
    roi,
    meanLuminance: Number((luminanceSum / pixelCount).toFixed(6)),
    nonBlackFraction: Number((nonBlackCount / pixelCount).toFixed(6)),
    brightFraction: Number((brightCount / pixelCount).toFixed(6)),
  };
}

const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
const candidateManifest = verifySealed("public/data/living-universe-v592/manifest.json", "manifestSha256");
const sourceManifest = verifySealed("docs/release/v592/source-manifest-v592.json", "receiptSha256");
const assetManifest = verifySealed("public/data/living-universe-v592/nebula-visual-assets.json", "manifestSha256");
const receiptPath = resolve(root, receiptRelativePath);
const existingReceipt = existsSync(receiptPath) ? verifySealed(receiptRelativePath, "receiptSha256") : null;
const identityMode = resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest, sourceManifest, assetManifest, existingReceipt });

if (
  capture.version !== "v592-nebula-browser-capture-v1"
  || new URL(capture.route).hostname !== "127.0.0.1"
  || new URL(capture.route).pathname !== "/local-shadow-v592"
  || capture.deliveryTier !== "standalone-full"
  || identityMode === null
  || capture.nebulaVisualManifestSha256 !== assetManifest.manifestSha256
  || capture.scientificPayloadSha256 !== expectedPayloadSha256
  || capture.targets?.length !== Object.keys(expectedTargets).length
  || capture.targets.some((target) => expectedTargets[target.id] !== target.catalogName)
) fail("capture-contract");
if (
  capture.diagnostics?.errorCount !== 0
  || capture.diagnostics?.warningCount !== 0
  || capture.diagnostics?.shaderOrWebglErrorCount !== 0
  || capture.diagnostics?.pageErrorCount !== 0
  || capture.diagnostics?.consoleEntries?.length !== 0
) fail("runtime-diagnostics");
if (
  capture.policy?.inAppBrowserOnly !== true
  || capture.policy?.singleCanvasRequired !== true
  || capture.policy?.scienceMarkerOnly !== true
  || capture.policy?.scienceImagePayloadAllowed !== false
  || capture.policy?.cinematicKtx2Required !== true
  || capture.policy?.webpFallbackAllowedForStandaloneQualification !== false
  || capture.policy?.scientificPayloadWriteback !== false
  || capture.policy?.scientificCoordinateMutation !== false
  || capture.policy?.presentationOnly !== true
  || capture.policy?.mobileSheetMustCollapse !== true
) fail("policy");

const expectedFrameKeys = new Set();
for (const targetId of Object.keys(expectedTargets)) {
  expectedFrameKeys.add(`${targetId}:science:1440x900`);
  expectedFrameKeys.add(`${targetId}:cinematic:1440x900`);
  expectedFrameKeys.add(`${targetId}:cinematic:390x844`);
}
if (!Array.isArray(capture.frames) || capture.frames.length !== expectedFrameKeys.size) fail("frame-count");
const observedFrameKeys = new Set();
const screenshotShas = new Set();
const verifiedFrames = [];
for (const frame of capture.frames) {
  const desktop = frame.viewport?.width === 1440 && frame.viewport?.height === 900;
  const mobile = frame.viewport?.width === 390 && frame.viewport?.height === 844;
  const key = `${frame.targetId}:${frame.mode}:${frame.viewport?.width}x${frame.viewport?.height}`;
  if ((!desktop && !mobile) || !expectedFrameKeys.has(key) || observedFrameKeys.has(key)) fail(`frame-identity:${key}`);
  observedFrameKeys.add(key);
  const expectedSliceCount = frame.mode === "science" ? 0 : desktop ? 4 : 2;
  if (
    frame.catalogName !== expectedTargets[frame.targetId]
    || frame.candidateManifestSha256 !== capture.observedCandidateManifestSha256
    || frame.sourceManifestSha256 !== capture.observedSourceManifestSha256
    || frame.scientificPayloadSha256 !== expectedPayloadSha256
    || frame.payloadStable !== "true"
    || frame.scientificWriteback !== "false"
    || frame.nebulaScientificWriteback !== "false"
    || frame.formalProductPointer !== "v263"
    || frame.canvasCount !== 1
    || frame.fpsGate !== "passed"
    || !Number.isFinite(frame.fpsMedian) || frame.fpsMedian < minimumCloseupFps
    || !Number.isFinite(frame.gpuBytes) || frame.gpuBytes > (desktop ? maximumDesktopGpuBytes : maximumMobileGpuBytes)
    || !Number.isFinite(frame.drawCalls) || frame.drawCalls > maximumCloseupDrawCalls
    || frame.focusTarget !== frame.targetId
    || frame.selectedObjectId !== frame.targetId
    || frame.selectedObjectKind !== "expanded-nebula"
    || frame.selectedAdmission !== "presentation-only-asset-admitted"
    || frame.nebulaAdmission !== "6/18"
    || frame.cameraFocus !== frame.targetId
    || frame.cameraSettled !== "true"
    || frame.presentationOnly !== "true"
    || frame.scienceImagePayload !== "false"
    || frame.blockedSliceCount !== 0
    || frame.fullFallbackCount !== 0
    || frame.readySliceCount !== expectedSliceCount
    || frame.requestedSliceCount !== expectedSliceCount
  ) fail(`frame-gate:${key}`);
  if (frame.mode === "science") {
    if (
      frame.runtime !== "science-marker-only"
      || frame.textureSources !== "none"
      || frame.requestedIds !== "none"
      || frame.ktx2Prewarm !== "disposed"
    ) fail(`science-contract:${key}`);
  } else if (
    frame.runtime !== "ready"
    || frame.textureSources !== "ktx2"
    || frame.requestedIds !== frame.targetId
    || frame.ktx2Prewarm !== "ready"
    || frame.mobileControlsExpanded !== "false"
  ) fail(`cinematic-contract:${key}`);

  if (
    typeof frame.screenshotPath !== "string"
    || !frame.screenshotPath.startsWith("docs/release/v592/screenshots/nebula-matrix/")
    || !frame.screenshotPath.endsWith(".jpg")
    || frame.screenshotPath.includes("..")
  ) fail(`screenshot-path:${key}`);
  const screenshotPath = resolve(root, frame.screenshotPath);
  if (!existsSync(screenshotPath)) fail(`screenshot-missing:${key}`);
  const screenshotBytes = readFileSync(screenshotPath);
  const screenshotSha256 = sha256(screenshotBytes);
  if (
    screenshotBytes.byteLength !== frame.screenshotBytes
    || screenshotSha256 !== frame.screenshotSha256
    || screenshotBytes[0] !== 0xff
    || screenshotBytes[1] !== 0xd8
    || screenshotBytes[2] !== 0xff
    || screenshotShas.has(screenshotSha256)
  ) fail(`screenshot-integrity:${key}`);
  screenshotShas.add(screenshotSha256);

  const metadata = await sharp(screenshotPath).metadata();
  const expectedImageWidth = frame.viewport.width;
  const expectedImageHeight = frame.viewport.height;
  if (metadata.width !== expectedImageWidth || metadata.height !== expectedImageHeight) fail(`screenshot-viewport:${key}`);
  const roi = frame.mode === "cinematic" ? await analyzeCinematicRoi(screenshotPath, mobile) : null;
  if (roi && (
    roi.meanLuminance < minimumRoiMeanLuminance
    || roi.nonBlackFraction < minimumRoiNonBlackFraction
    || roi.brightFraction < minimumRoiBrightFraction
  )) fail(`cinematic-roi-near-black:${key}`);
  verifiedFrames.push({ ...frame, cinematicRoi: roi });
}
if (observedFrameKeys.size !== expectedFrameKeys.size) fail("matrix-coverage");

const cinematicRois = verifiedFrames.map((frame) => frame.cinematicRoi).filter(Boolean);
const unsigned = {
  version: "v592-nebula-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: "passed-six-of-six-expanded-nebula-three-profile-browser-matrix",
  route: "/local-shadow-v592",
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    observedCandidateManifestSha256: capture.observedCandidateManifestSha256,
    observedSourceManifestSha256: capture.observedSourceManifestSha256,
    nebulaVisualManifestSha256: assetManifest.manifestSha256,
  },
  admission: {
    runtimeAssetAdmittedCount: 6,
    targetIds: Object.keys(expectedTargets),
    frameCount: verifiedFrames.length,
    desktopFrameCount: verifiedFrames.filter((frame) => frame.viewport.width === 1440).length,
    mobileFrameCount: verifiedFrames.filter((frame) => frame.viewport.width === 390).length,
    scienceFrameCount: verifiedFrames.filter((frame) => frame.mode === "science").length,
    cinematicFrameCount: verifiedFrames.filter((frame) => frame.mode === "cinematic").length,
    nativeKtx2CinematicFrameCount: verifiedFrames.filter((frame) => frame.mode === "cinematic" && frame.textureSources === "ktx2").length,
    uniqueScreenshotCount: screenshotShas.size,
    minimumFpsMedian: Math.min(...verifiedFrames.map((frame) => frame.fpsMedian)),
    peakDesktopGpuBytes: Math.max(...verifiedFrames.filter((frame) => frame.viewport.width === 1440).map((frame) => frame.gpuBytes)),
    peakMobileGpuBytes: Math.max(...verifiedFrames.filter((frame) => frame.viewport.width === 390).map((frame) => frame.gpuBytes)),
    peakDrawCalls: Math.max(...verifiedFrames.map((frame) => frame.drawCalls)),
    minimumCinematicRoiMeanLuminance: Math.min(...cinematicRois.map((roi) => roi.meanLuminance)),
    minimumCinematicRoiNonBlackFraction: Math.min(...cinematicRois.map((roi) => roi.nonBlackFraction)),
    minimumCinematicRoiBrightFraction: Math.min(...cinematicRois.map((roi) => roi.brightFraction)),
    singleCanvas: true,
    scienceCinematicPayloadStable: true,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    scientificCoordinateMutation: false,
    consolePageWebglErrorOrWarningCount: 0,
    fullFallbackCount: 0,
    humanVisualSignoff: "pending-full-v592-goal",
  },
  thresholds: {
    minimumCloseupFps,
    maximumDesktopGpuBytes,
    maximumMobileGpuBytes,
    maximumCloseupDrawCalls,
    minimumRoiMeanLuminance,
    minimumRoiNonBlackFraction,
    minimumRoiBrightFraction,
  },
  frames: verifiedFrames,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);

console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  frameCount: receipt.admission.frameCount,
  minimumFpsMedian: receipt.admission.minimumFpsMedian,
  peakDesktopGpuBytes: receipt.admission.peakDesktopGpuBytes,
  peakMobileGpuBytes: receipt.admission.peakMobileGpuBytes,
  peakDrawCalls: receipt.admission.peakDrawCalls,
  minimumCinematicRoiNonBlackFraction: receipt.admission.minimumCinematicRoiNonBlackFraction,
  identityMode,
}, null, 2));
