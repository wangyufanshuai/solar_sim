import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/gaia-constellation-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/gaia-constellation-browser-matrix-receipt-v592.json";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const expectedFocusCodes = Object.freeze({ orion: "Ori", "ursa-major": "UMa", cassiopeia: "Cas" });
const expectedMobileFov = Object.freeze({ Ori: 56, UMa: 72, Cas: 58 });
const maximumDesktopGpuBytes = 512 * 1024 * 1024;
const maximumMobileGpuBytes = 192 * 1024 * 1024;
const maximumOverviewDrawCalls = 90;
const maximumFocusDrawCalls = 60;
const minimumOverviewFps = 55;
const minimumFocusFps = 45;

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
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-gaia-constellation-baseline-seal:${path}`);
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
  throw new Error(`v592-gaia-constellation-browser-matrix:${reason}`);
}

function resolveCaptureIdentityMode({
  capture,
  captureBytes,
  candidateManifest,
  sourceManifest,
  constellationPacket,
  existingReceipt,
}) {
  const directIdentity = (
    capture.observedCandidateManifestSha256 === candidateManifest.manifestSha256
    && capture.observedSourceManifestSha256 === sourceManifest.receiptSha256
  );
  if (directIdentity) return "direct-pre-admission";

  const receiptIdentity = existingReceipt?.receiptSha256;
  const linkedReplay = (
    typeof receiptIdentity === "string"
    && candidateManifest.governance?.sourceManifestSha256 === sourceManifest.receiptSha256
    && candidateManifest.starfield?.browserMatrixReceiptSha256 === receiptIdentity
    && candidateManifest.constellations?.browserMatrixReceiptSha256 === receiptIdentity
    && existingReceipt.source?.capturePath === captureRelativePath
    && existingReceipt.source?.captureBytes === captureBytes.byteLength
    && existingReceipt.source?.captureSha256 === sha256(captureBytes)
    && existingReceipt.source?.observedCandidateManifestSha256 === capture.observedCandidateManifestSha256
    && existingReceipt.source?.observedSourceManifestSha256 === capture.observedSourceManifestSha256
    && existingReceipt.source?.constellationPacketSha256 === constellationPacket.packetSha256
  );
  if (linkedReplay) return "linked-post-admission-replay";
  return null;
}

if (process.argv.includes("--self-test")) {
  const captureBytes = Buffer.from("sealed-browser-capture", "utf8");
  const capture = {
    observedCandidateManifestSha256: "pre-manifest",
    observedSourceManifestSha256: "pre-source",
  };
  const sourceManifest = { receiptSha256: "current-source" };
  const constellationPacket = { packetSha256: "constellation-packet" };
  const existingReceipt = {
    receiptSha256: "browser-receipt",
    source: {
      capturePath: captureRelativePath,
      captureBytes: captureBytes.byteLength,
      captureSha256: sha256(captureBytes),
      observedCandidateManifestSha256: "pre-manifest",
      observedSourceManifestSha256: "pre-source",
      constellationPacketSha256: "constellation-packet",
    },
  };
  const direct = resolveCaptureIdentityMode({
    capture,
    captureBytes,
    candidateManifest: { manifestSha256: "pre-manifest" },
    sourceManifest: { receiptSha256: "pre-source" },
    constellationPacket,
    existingReceipt: null,
  });
  const replayCandidate = {
    manifestSha256: "current-manifest",
    governance: { sourceManifestSha256: "current-source" },
    starfield: { browserMatrixReceiptSha256: "browser-receipt" },
    constellations: { browserMatrixReceiptSha256: "browser-receipt" },
  };
  const replay = resolveCaptureIdentityMode({
    capture,
    captureBytes,
    candidateManifest: replayCandidate,
    sourceManifest,
    constellationPacket,
    existingReceipt,
  });
  const mutatedCapture = resolveCaptureIdentityMode({
    capture,
    captureBytes: Buffer.from("mutated-browser-capture", "utf8"),
    candidateManifest: replayCandidate,
    sourceManifest,
    constellationPacket,
    existingReceipt,
  });
  const unlinkedReceipt = resolveCaptureIdentityMode({
    capture,
    captureBytes,
    candidateManifest: {
      ...replayCandidate,
      constellations: { browserMatrixReceiptSha256: "different-receipt" },
    },
    sourceManifest,
    constellationPacket,
    existingReceipt,
  });
  if (
    direct !== "direct-pre-admission"
    || replay !== "linked-post-admission-replay"
    || mutatedCapture !== null
    || unlinkedReceipt !== null
  ) fail("identity-replay-self-test");
  console.log(JSON.stringify({ status: "passed", direct, replay, mutationRejected: true, unlinkedReceiptRejected: true }, null, 2));
  process.exit(0);
}

const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
const candidateManifest = verifySealed("public/data/living-universe-v592/manifest.json", "manifestSha256");
const sourceManifest = verifySealed("docs/release/v592/source-manifest-v592.json", "receiptSha256");
const constellationPacket = verifySealed("public/data/celestial-convergence-v591/constellation-gaia-binding-v591.json", "packetSha256");
const receiptPath = resolve(root, receiptRelativePath);
const existingReceipt = existsSync(receiptPath) ? verifySealed(receiptRelativePath, "receiptSha256") : null;
const identityMode = resolveCaptureIdentityMode({
  capture,
  captureBytes,
  candidateManifest,
  sourceManifest,
  constellationPacket,
  existingReceipt,
});

if (
  capture.version !== "v592-gaia-constellation-browser-capture-v1"
  || new URL(capture.route).hostname !== "127.0.0.1"
  || new URL(capture.route).pathname !== "/local-shadow-v592"
  || capture.deliveryTier !== "standalone-full"
  || identityMode === null
  || capture.scientificPayloadSha256 !== expectedPayloadSha256
  || constellationPacket.bindings.length !== 88
  || constellationPacket.bindings.reduce((sum, binding) => sum + binding.waypoints.length, 0) !== 484
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
  || capture.policy?.gaiaOnlyPositionColorMagnitude !== true
  || capture.policy?.deterministicPsf !== true
  || capture.policy?.randomTwinkle !== false
  || capture.policy?.randomParallax !== false
  || capture.policy?.depthTest !== true
  || capture.policy?.foregroundOcclusion !== true
  || capture.policy?.scientificPayloadWriteback !== false
  || capture.policy?.scientificCoordinateMutation !== false
  || capture.policy?.presentationOnly !== true
) fail("policy");

const expectedFrameKeys = new Set([
  "overview:science:1440x900",
  "overview:cinematic:1440x900",
  "orion:science:1440x900",
  "orion:cinematic:1440x900",
  "ursa-major:science:1440x900",
  "ursa-major:cinematic:1440x900",
  "cassiopeia:science:1440x900",
  "cassiopeia:cinematic:1440x900",
  "overview:science:390x844",
  "overview:cinematic:390x844",
  "orion:cinematic:390x844",
  "ursa-major:cinematic:390x844",
  "cassiopeia:cinematic:390x844",
]);
const frames = capture.frames;
if (!Array.isArray(frames) || frames.length !== expectedFrameKeys.size) fail("frame-count");
const observedFrameKeys = new Set();
const screenshotShas = new Set();
for (const frame of frames) {
  const desktop = frame.viewport?.width === 1440 && frame.viewport?.height === 900;
  const mobile = frame.viewport?.width === 390 && frame.viewport?.height === 844;
  const focusCode = expectedFocusCodes[frame.focusTarget] ?? null;
  const overview = frame.focusTarget === "overview";
  const key = `${frame.focusTarget}:${frame.mode}:${frame.viewport?.width}x${frame.viewport?.height}`;
  if ((!desktop && !mobile) || !expectedFrameKeys.has(key) || observedFrameKeys.has(key)) fail(`frame-identity:${key}`);
  observedFrameKeys.add(key);
  const expectedRecordCount = desktop ? 60_000 : 18_000;
  const expectedDefaultCount = desktop ? 12 : 8;
  const maximumGpuBytes = desktop ? maximumDesktopGpuBytes : maximumMobileGpuBytes;
  const minimumFps = overview ? minimumOverviewFps : minimumFocusFps;
  const maximumDrawCalls = overview ? maximumOverviewDrawCalls : maximumFocusDrawCalls;
  if (
    frame.candidateManifestSha256 !== capture.observedCandidateManifestSha256
    || frame.sourceManifestSha256 !== capture.observedSourceManifestSha256
    || frame.scientificPayloadSha256 !== expectedPayloadSha256
    || frame.payloadStable !== true
    || frame.scientificWriteback !== false
    || frame.canvasCount !== 1
    || frame.fpsGate !== "passed"
    || !Number.isFinite(frame.fpsMedian) || frame.fpsMedian < minimumFps
    || !Number.isFinite(frame.gpuBytes) || frame.gpuBytes > maximumGpuBytes
    || !Number.isFinite(frame.drawCalls) || frame.drawCalls > maximumDrawCalls
    || frame.gaiaStatus !== "ready"
    || frame.gaiaRecordCount !== expectedRecordCount
    || frame.gaiaAnchorCount !== 420
    || frame.gaiaRetainedAnchorCount !== 420
    || frame.gaiaTransport !== "direct-public-sha-verified-readonly-v592"
    || frame.gaiaPsfPolicy !== "linear-Moffat-Airy-deterministic-source-id-optics"
    || frame.constellationStatus !== "ready"
    || frame.constellationCount !== 88
    || frame.waypointCount !== 484
    || frame.defaultCount !== expectedDefaultCount
    || frame.visibleCount !== expectedDefaultCount
    || frame.segmentCount <= 0
    || frame.vertexCount !== frame.segmentCount * 2
    || frame.labelLanguage !== "latin-chinese-iau-code"
    || frame.normalizedDirections !== true
    || frame.sphereRadius !== 231.88
    || frame.depthPolicy !== "depth-test-true-foreground-occlusion"
    || frame.htmlOcclusionScope !== "visible-hero-meshes-only-no-sky-sphere"
    || frame.iauBoundaryAdmission !== "blocked-source-not-admitted"
    || frame.presentationOnly !== true
  ) fail(`frame-gate:${key}`);
  if (overview) {
    if (frame.focusCode !== "none" || frame.focusedSegmentCount !== 0 || frame.labelCount !== expectedDefaultCount) {
      fail(`overview-contract:${key}`);
    }
  } else {
    const focusedLabel = frame.labels?.find((label) => label.focused === true && label.code === focusCode);
    if (
      frame.focusCode !== focusCode
      || !frame.visibleCodes.split(",").includes(focusCode)
      || frame.focusedSegmentCount <= 0
      || frame.backgroundSegmentCount + frame.focusedSegmentCount !== frame.segmentCount
      || frame.labelCount !== 1
      || frame.labels?.length !== 1
      || focusedLabel?.display !== "block"
      || focusedLabel.rect.x < 0
      || focusedLabel.rect.y < 0
      || focusedLabel.rect.x + focusedLabel.rect.width > frame.viewport.width
      || focusedLabel.rect.y + focusedLabel.rect.height > frame.viewport.height
    ) fail(`focus-contract:${key}`);
    if (mobile && (
      frame.cameraFraming !== "mobile-focus-projection-only"
      || frame.cameraFocusCode !== focusCode
      || frame.cameraFovDeg !== expectedMobileFov[focusCode]
      || !Number.isFinite(frame.cameraViewOffsetPx)
      || Math.abs(frame.cameraViewOffsetPx) > frame.viewport.width * 0.78
      || frame.cameraCoordinateMutation !== false
      || frame.mobileSkyReferencePresent !== true
    )) fail(`mobile-framing:${key}`);
  }
  if (
    typeof frame.screenshotPath !== "string"
    || !frame.screenshotPath.startsWith("docs/release/v592/screenshots/gaia-constellation-matrix/")
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
}
if (observedFrameKeys.size !== expectedFrameKeys.size) fail("matrix-coverage");

const unsigned = {
  version: "v592-gaia-constellation-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: "passed-gaia-60000-and-constellations-88-of-88-browser-matrix",
  route: "/local-shadow-v592",
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    observedCandidateManifestSha256: capture.observedCandidateManifestSha256,
    observedSourceManifestSha256: capture.observedSourceManifestSha256,
    constellationPacketSha256: constellationPacket.packetSha256,
  },
  admission: {
    gaiaFullDesktopRecordCount: 60_000,
    gaiaFullMobileRecordCount: 18_000,
    retainedAnchorCount: 420,
    constellationCount: 88,
    waypointCount: 484,
    desktopDefaultCount: 12,
    mobileDefaultCount: 8,
    focusedConstellationCodes: Object.values(expectedFocusCodes),
    frameCount: frames.length,
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
    scientificCoordinateMutation: false,
    consolePageWebglErrorCount: 0,
    iauBoundaryAdmission: "blocked-source-not-admitted",
    humanVisualSignoff: "pending-full-v592-goal",
  },
  thresholds: {
    minimumOverviewFps,
    minimumFocusFps,
    maximumDesktopGpuBytes,
    maximumMobileGpuBytes,
    maximumOverviewDrawCalls,
    maximumFocusDrawCalls,
  },
  frames,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(resolve(root, receiptRelativePath), `${JSON.stringify(receipt, null, 2)}\n`);

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
