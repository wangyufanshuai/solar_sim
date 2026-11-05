import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const captureRelativePath = "docs/release/v592/nebula-overlay-browser-capture-v592.json";
const receiptRelativePath = "docs/release/v592/nebula-overlay-browser-matrix-receipt-v592.json";
const screenshotRoot = "docs/release/v592/screenshots/nebula-overlay-matrix/";
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const minimumCloseupFps = 45;
const minimumRoiMeanLuminance = 5.25;
const minimumRoiNonBlackFraction = 0.02;
const minimumRoiBrightFraction = 0.008;

const expectedTargets = Object.freeze([
  ["jellyfish-nebula", "IC 443"],
  ["cocoon-nebula", "IC 5146"],
  ["rho-ophiuchi-cloud", "Rho Ophiuchi"],
  ["cepheus-c-nebula", "Cepheus C"],
  ["dragon-lair-nebula", "M17 / NGC 6618"],
  ["monkey-head-nebula", "NGC 2174"],
  ["w40-nebula", "W40"],
  ["sh2-235-nebula", "Sh2-235"],
  ["flaming-star-nebula", "IC 405"],
  ["spider-nebula", "IC 417"],
  ["tarantula-nebula", "NGC 2070"],
  ["tadpole-nebula", "IC 410"],
]);
const expectedProfiles = Object.freeze([
  { key: "desktop-cinematic", mode: "cinematic", width: 1440, height: 900, requestedSlices: 4, mobile: false },
  { key: "mobile-cinematic", mode: "cinematic", width: 390, height: 844, requestedSlices: 2, mobile: true },
  { key: "desktop-science", mode: "science", width: 1440, height: 900, requestedSlices: 0, mobile: false },
  { key: "mobile-science", mode: "science", width: 390, height: 844, requestedSlices: 0, mobile: true },
]);

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
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v592-nebula-overlay-browser-seal:${path}`);
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
  throw new Error(`v592-nebula-overlay-browser-matrix:${reason}`);
}
function asNumber(value, reason) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(reason);
  return parsed;
}
function asBooleanString(value) {
  return value === true || value === "true";
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

if (process.argv.includes("--self-test")) {
  const unsigned = { z: 3, a: { c: 2, b: 1 } };
  const first = canonicalSha(unsigned);
  const reordered = canonicalSha({ a: { b: 1, c: 2 }, z: 3 });
  const mutated = canonicalSha({ a: { b: 1, c: 9 }, z: 3 });
  if (first !== reordered || first === mutated) fail("canonical-self-test");
  console.log(JSON.stringify({ status: "passed", canonicalReplay: true, mutationRejected: true }, null, 2));
  process.exit(0);
}

const capturePath = resolve(root, captureRelativePath);
if (!existsSync(capturePath)) fail("capture-missing");
const captureBytes = readFileSync(capturePath);
const capture = JSON.parse(captureBytes.toString("utf8"));
const extendedManifest = verifySealed("public/data/living-universe-v592/nebula-extended-visual-assets.json", "manifestSha256");
const closureManifest = verifySealed("public/data/living-universe-v592/nebula-closure-visual-assets.json", "manifestSha256");

if (
  capture.version !== "v592-nebula-overlay-browser-capture-v1"
  || capture.route !== "/local-shadow-v592"
  || capture.browser !== "Codex in-app browser"
  || capture.scientificPayloadSha256 !== expectedPayloadSha256
  || capture.policy?.singleCanvasRequired !== true
  || capture.policy?.scienceImagePayloadAllowed !== false
  || capture.policy?.scientificPayloadWriteback !== false
  || capture.policy?.alternateBrowserUsed !== false
  || capture.policy?.productionDeployment !== false
  || !Array.isArray(capture.consolePageWebglErrors)
  || capture.consolePageWebglErrors.length !== 0
  || !Array.isArray(capture.frames)
  || capture.frames.length !== 48
) fail("capture-contract");

const expectedAssetIds = [
  ...extendedManifest.assets.map((asset) => asset.target),
  ...closureManifest.assets.map((asset) => asset.target),
];
if (
  extendedManifest.admission.runtimeAssetAdmittedCount !== 5
  || closureManifest.admission.runtimeAssetAdmittedCount !== 7
  || expectedAssetIds.length !== expectedTargets.length
  || expectedAssetIds.some((id, index) => id !== expectedTargets[index][0])
) fail("overlay-asset-identity");

const normalizedFrames = [];
const screenshotShas = new Set();
for (const profile of expectedProfiles) {
  const profileFrames = capture.frames.filter((frame) => frame.name?.startsWith(`${profile.key}-`));
  if (profileFrames.length !== expectedTargets.length) fail(`profile-cardinality:${profile.key}`);
  for (let index = 0; index < expectedTargets.length; index += 1) {
    const [targetId, catalogName] = expectedTargets[index];
    const frame = profileFrames[index];
    if (
      frame.focus !== targetId
      || !frame.name.endsWith(catalogName)
      || frame.admission !== "18/18"
      || frame.coverage !== "24/24"
      || frame.mode !== profile.mode
      || !asBooleanString(frame.payloadStable)
      || frame.payload !== expectedPayloadSha256
      || !asBooleanString(frame.singleCanvas)
      || asNumber(frame.canvasCount, `canvas-count:${frame.name}`) !== 1
      || frame.fpsGate !== "passed"
      || asNumber(frame.fpsMedian, `fps:${frame.name}`) < minimumCloseupFps
      || asNumber(frame.blockedSlices, `blocked-slices:${frame.name}`) !== 0
      || asNumber(frame.fullFallbackCount, `fallback:${frame.name}`) !== 0
      || typeof frame.screenshotPath !== "string"
      || !frame.screenshotPath.startsWith(screenshotRoot)
      || !frame.screenshotPath.endsWith(".jpg")
      || frame.screenshotPath.includes("..")
    ) fail(`frame-contract:${profile.key}:${targetId}`);
    if (profile.mode === "cinematic") {
      if (
        frame.runtime !== "ready"
        || frame.textureSources !== "ktx2"
        || asNumber(frame.requestedSlices, `requested-slices:${frame.name}`) !== profile.requestedSlices
        || asNumber(frame.readySlices, `ready-slices:${frame.name}`) !== profile.requestedSlices
      ) fail(`cinematic-contract:${profile.key}:${targetId}`);
    } else if (
      frame.runtime !== "science-marker-only"
      || frame.textureSources !== "none"
      || asNumber(frame.requestedSlices, `requested-slices:${frame.name}`) !== 0
      || asNumber(frame.readySlices, `ready-slices:${frame.name}`) !== 0
      || (profile.mobile && frame.mobileSheetState !== "closed-inert")
    ) fail(`science-contract:${profile.key}:${targetId}`);

    const screenshotPath = resolve(root, frame.screenshotPath);
    if (!existsSync(screenshotPath)) fail(`screenshot-missing:${profile.key}:${targetId}`);
    const screenshotBytes = readFileSync(screenshotPath);
    const metadata = await sharp(screenshotPath).metadata();
    if (
      screenshotBytes.byteLength !== frame.screenshotBytes
      || metadata.width !== profile.width
      || metadata.height !== profile.height
      || metadata.format !== "jpeg"
    ) fail(`screenshot-contract:${profile.key}:${targetId}`);
    const screenshotSha256 = sha256(screenshotBytes);
    if (screenshotShas.has(screenshotSha256)) fail(`duplicate-screenshot:${profile.key}:${targetId}`);
    screenshotShas.add(screenshotSha256);
    const cinematicRoi = profile.mode === "cinematic" ? await analyzeCinematicRoi(screenshotPath, profile.mobile) : null;
    if (
      cinematicRoi
      && (
        cinematicRoi.meanLuminance < minimumRoiMeanLuminance
        || cinematicRoi.nonBlackFraction < minimumRoiNonBlackFraction
        || cinematicRoi.brightFraction < minimumRoiBrightFraction
      )
    ) fail(`cinematic-roi:${profile.key}:${targetId}`);
    normalizedFrames.push({
      name: frame.name,
      targetId,
      catalogName,
      profile: profile.key,
      mode: profile.mode,
      viewport: { width: profile.width, height: profile.height },
      runtime: frame.runtime,
      requestedSliceCount: asNumber(frame.requestedSlices, `requested-slices:${frame.name}`),
      readySliceCount: asNumber(frame.readySlices, `ready-slices:${frame.name}`),
      blockedSliceCount: asNumber(frame.blockedSlices, `blocked-slices:${frame.name}`),
      fullFallbackCount: asNumber(frame.fullFallbackCount, `fallback:${frame.name}`),
      textureSources: frame.textureSources,
      fpsMedian: asNumber(frame.fpsMedian, `fps:${frame.name}`),
      fpsGate: frame.fpsGate,
      singleCanvas: true,
      canvasCount: 1,
      payloadStable: true,
      scientificPayloadSha256: frame.payload,
      scientificPayloadWriteback: false,
      mobileSheetState: profile.mobile ? (frame.mobileSheetState ?? "closed-inert") : "not-applicable",
      screenshotPath: frame.screenshotPath,
      screenshotBytes: screenshotBytes.byteLength,
      screenshotSha256,
      cinematicRoi,
    });
  }
}

const cinematicFrames = normalizedFrames.filter((frame) => frame.mode === "cinematic");
const scienceFrames = normalizedFrames.filter((frame) => frame.mode === "science");
const minimumFpsMedian = Math.min(...normalizedFrames.map((frame) => frame.fpsMedian));
const minimumCinematicRoiMean = Math.min(...cinematicFrames.map((frame) => frame.cinematicRoi.meanLuminance));
const minimumCinematicRoiNonBlack = Math.min(...cinematicFrames.map((frame) => frame.cinematicRoi.nonBlackFraction));
const minimumCinematicRoiBright = Math.min(...cinematicFrames.map((frame) => frame.cinematicRoi.brightFraction));
const receipt = {
  version: "v592-nebula-overlay-browser-matrix-receipt-v1",
  capturedAt: capture.capturedAt,
  status: "passed-twelve-of-twelve-overlay-four-profile-browser-matrix",
  route: capture.route,
  source: {
    capturePath: captureRelativePath,
    captureBytes: captureBytes.byteLength,
    captureSha256: sha256(captureBytes),
    observedPreEvidenceCandidateManifestSha256: capture.observedCandidateManifestSha256,
    observedPreEvidenceSourceManifestSha256: capture.observedSourceManifestSha256,
    extendedOverlayManifestSha256: extendedManifest.manifestSha256,
    closureOverlayManifestSha256: closureManifest.manifestSha256,
  },
  admission: {
    overlayAssetAdmittedCount: expectedTargets.length,
    goalNebulaCoverageCount: 24,
    targetIds: expectedTargets.map(([id]) => id),
    frameCount: normalizedFrames.length,
    desktopCinematicFrameCount: normalizedFrames.filter((frame) => frame.profile === "desktop-cinematic").length,
    mobileCinematicFrameCount: normalizedFrames.filter((frame) => frame.profile === "mobile-cinematic").length,
    desktopScienceFrameCount: normalizedFrames.filter((frame) => frame.profile === "desktop-science").length,
    mobileScienceFrameCount: normalizedFrames.filter((frame) => frame.profile === "mobile-science").length,
    scienceFrameCount: scienceFrames.length,
    cinematicFrameCount: cinematicFrames.length,
    nativeKtx2CinematicFrameCount: cinematicFrames.filter((frame) => frame.textureSources === "ktx2").length,
    scienceMarkerOnlyFrameCount: scienceFrames.filter((frame) => frame.runtime === "science-marker-only").length,
    mobileScienceCollapsedSheetFrameCount: scienceFrames.filter((frame) => frame.profile === "mobile-science" && frame.mobileSheetState === "closed-inert").length,
    uniqueScreenshotCount: screenshotShas.size,
    minimumFpsMedian,
    minimumCinematicRoiMeanLuminance: minimumCinematicRoiMean,
    minimumCinematicRoiNonBlackFraction: minimumCinematicRoiNonBlack,
    minimumCinematicRoiBrightFraction: minimumCinematicRoiBright,
    singleCanvas: true,
    scienceCinematicPayloadStable: true,
    scientificPayloadSha256: expectedPayloadSha256,
    scientificPayloadWriteback: false,
    scientificCoordinateMutation: false,
    scienceImagePayloadLoaded: false,
    consolePageWebglErrorCount: capture.consolePageWebglErrors.length,
    fullFallbackCount: normalizedFrames.reduce((sum, frame) => sum + frame.fullFallbackCount, 0),
    gpuTelemetryAvailableAllFrames: false,
    gpuGateClaimedByThisReceipt: false,
    humanVisualSignoff: "pending-full-v592-goal",
  },
  thresholds: {
    minimumCloseupFps,
    minimumRoiMeanLuminance,
    minimumRoiNonBlackFraction,
    minimumRoiBrightFraction,
  },
  policy: {
    browser: capture.browser,
    alternateBrowserUsed: false,
    scienceImagePayloadAllowed: false,
    presentationOnly: true,
    noSyntheticEvidence: true,
    gpuTelemetryLimitationPreserved: true,
    productionDeployment: false,
  },
  frames: normalizedFrames,
};
receipt.receiptSha256 = canonicalSha(receipt);
atomicWrite(resolve(root, receiptRelativePath), `${JSON.stringify(receipt, null, 2)}\n`);

console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  frameCount: receipt.admission.frameCount,
  minimumFpsMedian,
  minimumCinematicRoiMeanLuminance: minimumCinematicRoiMean,
  minimumCinematicRoiNonBlackFraction: minimumCinematicRoiNonBlack,
  uniqueScreenshotCount: receipt.admission.uniqueScreenshotCount,
}, null, 2));
