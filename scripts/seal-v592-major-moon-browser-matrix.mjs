import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/major-moon-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/major-moon-browser-matrix-receipt-v592.json";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const maximumDesktopGpuBytes = 512 * 1024 * 1024;
const maximumMobileGpuBytes = 192 * 1024 * 1024;
const maximumCloseupDrawCalls = 65;
const minimumCloseupFps = 45;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}
function verifySealed(path, field) {
  const document = readJson(path);
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-major-moon-browser-baseline-seal:${path}`);
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
  throw new Error(`v592-major-moon-browser-matrix:${reason}`);
}

const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
const assetManifest = verifySealed("public/data/living-universe-v592/major-moon-visual-assets.json", "manifestSha256");
const expectedIds = assetManifest.admission.admittedBodies;
const expectedBlockedIds = assetManifest.admission.blockedBodies;
const expectedFrameCount = expectedIds.length * 3;
const assetById = new Map(assetManifest.assets.map((asset) => [asset.target, asset]));

if (
  capture.version !== "v592-major-moon-browser-capture-v1"
  || new URL(capture.route).hostname !== "127.0.0.1"
  || new URL(capture.route).pathname !== "/local-shadow-v592"
  || capture.deliveryTier !== "standalone-full"
  || capture.frozenJulianDate !== 2_451_545
  || capture.admittedIds.join(",") !== expectedIds.join(",")
  || capture.blockedIds.join(",") !== expectedBlockedIds.join(",")
) fail("capture-contract");
if (
  capture.diagnostics?.errorCount !== 0
  || capture.diagnostics?.warningCount !== 0
  || capture.diagnostics?.shaderOrWebglErrorCount !== 0
  || capture.diagnostics?.pageErrorCount !== 0
  || capture.diagnostics?.consoleEntries?.length !== 0
) fail("runtime-diagnostics");
if (
  capture.commonTelemetry?.runtimeAdmission !== "admitted"
  || capture.commonTelemetry?.textureSource !== "ktx2"
  || capture.commonTelemetry?.fullQualityGate !== "passed"
  || capture.commonTelemetry?.subjectVisible !== true
  || capture.commonTelemetry?.frameFits !== true
  || capture.commonTelemetry?.scientificPayloadSha256 !== expectedPayloadSha256
  || capture.commonTelemetry?.payloadStable !== true
  || capture.commonTelemetry?.scientificPayloadWriteback !== false
  || capture.commonTelemetry?.scientificPayloadMutation !== false
  || capture.commonTelemetry?.canvasCount !== 1
  || capture.commonTelemetry?.fpsGate !== "passed"
) fail("common-telemetry");

const frames = capture.frames;
if (!Array.isArray(frames) || frames.length !== expectedFrameCount) fail("frame-count");
const screenshotShas = new Set();
const frameKeys = new Set();
for (const frame of frames) {
  const mobile = frame.viewport?.width === 390 && frame.viewport?.height === 844;
  const desktop = frame.viewport?.width === 1440 && frame.viewport?.height === 900;
  if (!expectedIds.includes(frame.id) || (!mobile && !desktop)) fail(`frame-identity:${frame.id}`);
  if (frame.mode !== "cinematic" && frame.mode !== "science") fail(`frame-mode:${frame.id}`);
  if (mobile && frame.mode !== "cinematic") fail(`mobile-mode:${frame.id}`);
  const key = `${frame.id}:${frame.mode}:${frame.viewport.width}x${frame.viewport.height}`;
  if (frameKeys.has(key)) fail(`duplicate-frame:${key}`);
  frameKeys.add(key);
  const variant = mobile ? assetById.get(frame.id)?.variants.mobileKtx2 : assetById.get(frame.id)?.variants.desktopKtx2;
  const expectedTextureDimensions = String(variant?.width) + "x" + String(variant?.height);
  if (
    typeof frame.screenshotPath !== "string"
    || !frame.screenshotPath.startsWith("docs/release/v592/screenshots/major-moon-matrix/")
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
  ) fail(`screenshot-integrity:${key}`);
  if (screenshotShas.has(screenshotSha256)) fail(`reused-screenshot:${key}`);
  screenshotShas.add(screenshotSha256);
  const maximumGpuBytes = mobile ? maximumMobileGpuBytes : maximumDesktopGpuBytes;
  const maximumDiameter = Math.min(frame.viewport.width * 0.92, frame.viewport.height * 0.82);
  if (
    !Number.isFinite(frame.fpsMedian) || frame.fpsMedian < minimumCloseupFps
    || !Number.isFinite(frame.gpuBytes) || frame.gpuBytes > maximumGpuBytes
    || !Number.isFinite(frame.drawCalls) || frame.drawCalls > maximumCloseupDrawCalls
    || !Number.isFinite(frame.screenDiameterPx) || frame.screenDiameterPx < 96 || frame.screenDiameterPx > maximumDiameter
    || frame.textureDimensions !== expectedTextureDimensions
  ) fail(`frame-gate:${key}`);
  const expectedAtmosphere = frame.id === "titan" && frame.mode === "cinematic"
    ? "observation-informed-deterministic-presentation-model"
    : "not-rendered";
  if (frame.titanAtmosphere !== expectedAtmosphere) fail(`atmosphere-policy:${key}`);
}
for (const id of expectedIds) {
  if (!frameKeys.has(`${id}:science:1440x900`) || !frameKeys.has(`${id}:cinematic:1440x900`) || !frameKeys.has(`${id}:cinematic:390x844`)) {
    fail(`matrix-coverage:${id}`);
  }
}
if (
  capture.lifecycle?.cycleCount !== expectedIds.length
  || capture.lifecycle?.released?.sceneMounted !== false
  || capture.lifecycle?.released?.candidateResources !== 0
  || capture.lifecycle?.released?.rendererTextureDelta !== 0
  || capture.lifecycle?.released?.decoderState !== "disposed"
  || capture.lifecycle?.restored?.sceneMounted !== true
  || capture.lifecycle?.restored?.candidateResources !== 5
  || capture.lifecycle?.restored?.rendererTextureDelta !== 4
  || capture.lifecycle?.restored?.decoderState !== "ready"
  || capture.lifecycle?.restored?.textureSource !== "ktx2"
  || capture.lifecycle?.payloadSha256 !== expectedPayloadSha256
  || capture.lifecycle?.payloadStableAcrossCycles !== true
) fail("resource-lifecycle");
if (
  capture.policy?.inAppBrowserOnly !== true
  || capture.policy?.singleCanvasRequired !== true
  || capture.policy?.proceduralFallbackAllowed !== false
  || capture.policy?.coloredPlaceholderAllowed !== false
  || capture.policy?.scientificPayloadWriteback !== false
) fail("policy");

const unsigned = {
  version: "v592-major-moon-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: `passed-${expectedIds.length}-of-12-runtime-hero-candidates-${expectedBlockedIds.length}-asset-blocked`,
  route: "/local-shadow-v592",
  frozenJulianDate: capture.frozenJulianDate,
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    visualAssetManifestSha256: assetManifest.manifestSha256,
    observedCandidateManifestSha256: capture.observedCandidateManifestSha256,
    observedSourceManifestSha256: capture.observedSourceManifestSha256,
  },
  admission: {
    requiredCount: 12,
    runtimeHeroCandidateCount: expectedIds.length,
    runtimeHeroCandidateIds: expectedIds,
    assetBlockedCount: expectedBlockedIds.length,
    assetBlockedIds: expectedBlockedIds,
    desktopFrameCount: frames.filter((frame) => frame.viewport.width === 1440).length,
    mobileFrameCount: frames.filter((frame) => frame.viewport.width === 390).length,
    uniqueScreenshotCount: screenshotShas.size,
    minimumFpsMedian: Math.min(...frames.map((frame) => frame.fpsMedian)),
    peakDesktopGpuBytes: Math.max(...frames.filter((frame) => frame.viewport.width === 1440).map((frame) => frame.gpuBytes)),
    peakMobileGpuBytes: Math.max(...frames.filter((frame) => frame.viewport.width === 390).map((frame) => frame.gpuBytes)),
    peakDrawCalls: Math.max(...frames.map((frame) => frame.drawCalls)),
    singleCanvas: true,
    scienceCinematicPayloadStable: true,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    consolePageWebglErrorCount: 0,
    releaseRestoreCycleCount: capture.lifecycle.cycleCount,
    sceneExitCandidateResources: 0,
    sceneExitRendererTextureDelta: 0,
    humanVisualSignoff: "pending-full-v592-goal",
  },
  thresholds: {
    minimumCloseupFps,
    maximumDesktopGpuBytes,
    maximumMobileGpuBytes,
    maximumCloseupDrawCalls,
  },
  frames,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(resolve(root, receiptRelativePath), `${JSON.stringify(receipt, null, 2)}\n`);

console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  runtimeHeroCandidateCount: receipt.admission.runtimeHeroCandidateCount,
  frameCount: receipt.frames.length,
  minimumFpsMedian: receipt.admission.minimumFpsMedian,
  peakDesktopGpuBytes: receipt.admission.peakDesktopGpuBytes,
  peakMobileGpuBytes: receipt.admission.peakMobileGpuBytes,
  peakDrawCalls: receipt.admission.peakDrawCalls,
  releaseRestoreCycleCount: receipt.admission.releaseRestoreCycleCount,
}, null, 2));
