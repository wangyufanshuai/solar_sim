import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/constellation-art-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/constellation-art-browser-matrix-receipt-v592.json";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const expectedTargets = Object.freeze({ orion: "Ori", "ursa-major": "UMa", cassiopeia: "Cas" });
const maximumDesktopGpuBytes = 512 * 1024 * 1024;
const maximumMobileGpuBytes = 192 * 1024 * 1024;
const maximumDrawCalls = 60;
const minimumFps = 45;

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
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-constellation-art-baseline-seal:${path}`);
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
  throw new Error(`v592-constellation-art-browser-matrix:${reason}`);
}

function resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest, sourceManifest, existingReceipt }) {
  if (
    capture.observedCandidateManifestSha256 === candidateManifest.manifestSha256
    && capture.observedSourceManifestSha256 === sourceManifest.receiptSha256
  ) return "direct-pre-admission";
  const receiptIdentity = existingReceipt?.receiptSha256;
  if (
    typeof receiptIdentity === "string"
    && candidateManifest.governance?.sourceManifestSha256 === sourceManifest.receiptSha256
    && candidateManifest.constellations?.artBrowserMatrixReceiptSha256 === receiptIdentity
    && existingReceipt.source?.capturePath === captureRelativePath
    && existingReceipt.source?.captureBytes === captureBytes.byteLength
    && existingReceipt.source?.captureSha256 === sha256(captureBytes)
    && existingReceipt.source?.observedCandidateManifestSha256 === capture.observedCandidateManifestSha256
    && existingReceipt.source?.observedSourceManifestSha256 === capture.observedSourceManifestSha256
  ) return "linked-post-admission-replay";
  return null;
}

if (process.argv.includes("--self-test")) {
  const captureBytes = Buffer.from("constellation-art-capture", "utf8");
  const capture = { observedCandidateManifestSha256: "pre-manifest", observedSourceManifestSha256: "pre-source" };
  const existingReceipt = {
    receiptSha256: "art-receipt",
    source: {
      capturePath: captureRelativePath,
      captureBytes: captureBytes.byteLength,
      captureSha256: sha256(captureBytes),
      observedCandidateManifestSha256: "pre-manifest",
      observedSourceManifestSha256: "pre-source",
    },
  };
  const direct = resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest: { manifestSha256: "pre-manifest" }, sourceManifest: { receiptSha256: "pre-source" }, existingReceipt: null });
  const candidate = { manifestSha256: "current", governance: { sourceManifestSha256: "current-source" }, constellations: { artBrowserMatrixReceiptSha256: "art-receipt" } };
  const replay = resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest: candidate, sourceManifest: { receiptSha256: "current-source" }, existingReceipt });
  const mutation = resolveCaptureIdentityMode({ capture, captureBytes: Buffer.from("mutation", "utf8"), candidateManifest: candidate, sourceManifest: { receiptSha256: "current-source" }, existingReceipt });
  const unlinked = resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest: { ...candidate, constellations: { artBrowserMatrixReceiptSha256: "other" } }, sourceManifest: { receiptSha256: "current-source" }, existingReceipt });
  if (direct !== "direct-pre-admission" || replay !== "linked-post-admission-replay" || mutation !== null || unlinked !== null) fail("identity-replay-self-test");
  console.log(JSON.stringify({ status: "passed", direct, replay, mutationRejected: true, unlinkedReceiptRejected: true }, null, 2));
  process.exit(0);
}

const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
const candidateManifest = verifySealed("public/data/living-universe-v592/manifest.json", "manifestSha256");
const sourceManifest = verifySealed("docs/release/v592/source-manifest-v592.json", "receiptSha256");
const receiptPath = resolve(root, receiptRelativePath);
const existingReceipt = existsSync(receiptPath) ? verifySealed(receiptRelativePath, "receiptSha256") : null;
const identityMode = resolveCaptureIdentityMode({ capture, captureBytes, candidateManifest, sourceManifest, existingReceipt });

if (
  capture.version !== "v592-constellation-art-browser-capture-v1"
  || new URL(capture.route).hostname !== "127.0.0.1"
  || new URL(capture.route).pathname !== "/local-shadow-v592"
  || capture.deliveryTier !== "standalone-full"
  || identityMode === null
  || capture.scientificPayloadSha256 !== expectedPayloadSha256
  || capture.targets?.length !== 3
  || capture.targets.some((target) => expectedTargets[target.id] !== target.code)
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
  || capture.policy?.scienceArtLayerAllowed !== false
  || capture.policy?.cinematicArtLayerRequired !== true
  || capture.policy?.gaiaAnchorsRequired !== true
  || capture.policy?.externalIllustrationAssetsAllowed !== false
  || capture.policy?.proceduralFallbackAllowed !== false
  || capture.policy?.observationImageClaimed !== false
  || capture.policy?.scientificPayloadWriteback !== false
  || capture.policy?.scientificCoordinateMutation !== false
  || capture.policy?.presentationOnly !== true
  || capture.policy?.mobileFocusIdentityRequired !== true
) fail("policy");

const expectedKeys = new Set();
for (const target of Object.keys(expectedTargets)) {
  expectedKeys.add(`${target}:science:1440x900`);
  expectedKeys.add(`${target}:cinematic:1440x900`);
  expectedKeys.add(`${target}:cinematic:390x844`);
}
if (!Array.isArray(capture.frames) || capture.frames.length !== expectedKeys.size) fail("frame-count");
const observedKeys = new Set();
const screenshotShas = new Set();
const artSignatures = new Map();
for (const frame of capture.frames) {
  const desktop = frame.viewport?.width === 1440 && frame.viewport?.height === 900;
  const mobile = frame.viewport?.width === 390 && frame.viewport?.height === 844;
  const key = `${frame.targetId}:${frame.mode}:${frame.viewport?.width}x${frame.viewport?.height}`;
  if ((!desktop && !mobile) || !expectedKeys.has(key) || observedKeys.has(key)) fail(`frame-identity:${key}`);
  observedKeys.add(key);
  const expectedCode = expectedTargets[frame.targetId];
  if (
    frame.expectedCode !== expectedCode
    || frame.candidateManifestSha256 !== capture.observedCandidateManifestSha256
    || frame.sourceManifestSha256 !== capture.observedSourceManifestSha256
    || frame.scientificPayloadSha256 !== expectedPayloadSha256
    || frame.payloadStable !== "true"
    || frame.scientificWriteback !== "false"
    || frame.canvasCount !== 1
    || frame.constellationStatus !== "ready"
    || frame.constellationCount !== 88
    || frame.waypointCount !== 484
    || frame.focusTarget !== frame.targetId
    || frame.focusCode !== expectedCode
    || frame.labelCount !== 1
    || frame.labelLanguage !== "latin-chinese-iau-code"
    || frame.normalizedDirections !== "true"
    || frame.depthPolicy !== "depth-test-true-foreground-occlusion"
    || frame.artStatus !== "admitted-88-of-88-data-derived-observatory-engraving-primary"
    || frame.artAdmission !== "88/88"
    || frame.artPrimaryModel !== "deterministic-tangent-plane-celestial-engraving"
    || frame.artProceduralFallback !== "false"
    || frame.artObservationImageClaim !== "false"
    || frame.artScientificWriteback !== "false"
    || frame.fpsGate !== "passed"
    || !Number.isFinite(frame.fpsMedian) || frame.fpsMedian < minimumFps
    || !Number.isFinite(frame.gpuBytes) || frame.gpuBytes > (desktop ? maximumDesktopGpuBytes : maximumMobileGpuBytes)
    || !Number.isFinite(frame.drawCalls) || frame.drawCalls > maximumDrawCalls
  ) fail(`frame-gate:${key}`);
  if (frame.mode === "science") {
    if (frame.artActiveCode !== "none" || frame.artSignature !== "none" || frame.artAnchorCount !== 0 || frame.artDrawCalls !== 0) {
      fail(`science-art-isolation:${key}`);
    }
  } else {
    if (frame.artActiveCode !== expectedCode || frame.artSignature === "none" || frame.artAnchorCount < 2 || frame.artDrawCalls !== 4) {
      fail(`cinematic-art-contract:${key}`);
    }
    const existing = artSignatures.get(expectedCode);
    if (existing && existing !== frame.artSignature) fail(`art-signature-replay:${key}`);
    artSignatures.set(expectedCode, frame.artSignature);
  }
  if (mobile) {
    const expectedLabel = frame.targetId === "orion" ? "Orion" : frame.targetId === "ursa-major" ? "Ursa Major" : "Cassiopeia";
    if (frame.mobileControlsExpanded !== "false" || !frame.mobileFocusLabel?.startsWith(expectedLabel)) fail(`mobile-identity:${key}`);
  }
  const focusedLabel = frame.labels?.find((label) => label.code === expectedCode && label.focused === "true");
  if (
    !focusedLabel
    || focusedLabel.display === "none"
    || focusedLabel.rect.width <= 0
    || focusedLabel.rect.height <= 0
    || focusedLabel.rect.x < 0
    || focusedLabel.rect.y < 0
    || focusedLabel.rect.x + focusedLabel.rect.width > frame.viewport.width
    || focusedLabel.rect.y + focusedLabel.rect.height > frame.viewport.height
  ) fail(`label-visibility:${key}`);
  if (
    typeof frame.screenshotPath !== "string"
    || !frame.screenshotPath.startsWith("docs/release/v592/screenshots/constellation-art-matrix/")
    || !frame.screenshotPath.endsWith(".jpg")
    || frame.screenshotPath.includes("..")
  ) fail(`screenshot-path:${key}`);
  const screenshotPath = resolve(root, frame.screenshotPath);
  if (!existsSync(screenshotPath)) fail(`screenshot-missing:${key}`);
  const bytes = readFileSync(screenshotPath);
  const metadata = await sharp(screenshotPath).metadata();
  if (
    bytes.byteLength !== frame.screenshotBytes
    || sha256(bytes) !== frame.screenshotSha256
    || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff
    || screenshotShas.has(frame.screenshotSha256)
    || metadata.width !== frame.viewport.width
    || metadata.height !== frame.viewport.height
  ) fail(`screenshot-integrity:${key}`);
  screenshotShas.add(frame.screenshotSha256);
}
if (observedKeys.size !== expectedKeys.size || artSignatures.size !== 3 || new Set(artSignatures.values()).size !== 3) fail("matrix-coverage");

const unsigned = {
  version: "v592-constellation-art-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: "passed-88-of-88-data-derived-art-three-focus-browser-matrix",
  route: "/local-shadow-v592",
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    observedCandidateManifestSha256: capture.observedCandidateManifestSha256,
    observedSourceManifestSha256: capture.observedSourceManifestSha256,
  },
  admission: {
    artAdmittedCount: 88,
    requiredCount: 88,
    focusedCodes: Object.values(expectedTargets),
    focusedArtSignatures: Object.fromEntries(artSignatures),
    frameCount: capture.frames.length,
    desktopFrameCount: capture.frames.filter((frame) => frame.viewport.width === 1440).length,
    mobileFrameCount: capture.frames.filter((frame) => frame.viewport.width === 390).length,
    scienceFrameCount: capture.frames.filter((frame) => frame.mode === "science").length,
    cinematicFrameCount: capture.frames.filter((frame) => frame.mode === "cinematic").length,
    uniqueScreenshotCount: screenshotShas.size,
    minimumFpsMedian: Math.min(...capture.frames.map((frame) => frame.fpsMedian)),
    peakDesktopGpuBytes: Math.max(...capture.frames.filter((frame) => frame.viewport.width === 1440).map((frame) => frame.gpuBytes)),
    peakMobileGpuBytes: Math.max(...capture.frames.filter((frame) => frame.viewport.width === 390).map((frame) => frame.gpuBytes)),
    peakDrawCalls: Math.max(...capture.frames.map((frame) => frame.drawCalls)),
    artDrawCallsPerFocusedCinematicFrame: 4,
    scienceArtLayerDisabled: true,
    singleCanvas: true,
    scienceCinematicPayloadStable: true,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    scientificCoordinateMutation: false,
    externalIllustrationAssetCount: 0,
    proceduralFallbackAllowed: false,
    observationImageClaimed: false,
    consolePageWebglErrorOrWarningCount: 0,
    iauBoundaryAdmission: "blocked-source-not-admitted",
    humanVisualSignoff: "pending-full-v592-goal",
  },
  thresholds: { minimumFps, maximumDesktopGpuBytes, maximumMobileGpuBytes, maximumDrawCalls },
  frames: capture.frames,
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
  identityMode,
}, null, 2));
