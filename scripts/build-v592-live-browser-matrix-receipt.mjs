import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = "docs/release/v592/browser-live-matrix-receipt-v592.json";
const rawCapturePath = "docs/release/v592/browser-live-matrix-raw-v592.json";
const screenshotRoot = "docs/release/v592/screenshots/live-matrix";
const payloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const frameDefinitions = [
  { name: "desktop-cinematic-earth-overview", path: `${screenshotRoot}/desktop-cinematic-earth-overview.png`, width: 1440, height: 900, mode: "cinematic", focus: "earth", deepState: null },
  { name: "desktop-science-earth-overview", path: `${screenshotRoot}/desktop-science-earth-overview.png`, width: 1440, height: 900, mode: "science", focus: "earth", deepState: null },
  { name: "desktop-science-jupiter-closeup", path: `${screenshotRoot}/desktop-science-jupiter-closeup.png`, width: 1440, height: 900, mode: "science", focus: "jupiter", deepState: null },
  { name: "desktop-science-saturn-closeup", path: `${screenshotRoot}/desktop-science-saturn-closeup.png`, width: 1440, height: 900, mode: "science", focus: "saturn", deepState: null },
  { name: "desktop-cinematic-orion-focus", path: `${screenshotRoot}/desktop-cinematic-orion-focus.png`, width: 1440, height: 900, mode: "cinematic", focus: "orion", deepState: null },
  { name: "deep-andromeda-ready", path: `${screenshotRoot}/deep-andromeda-ready.png`, width: 1440, height: 900, mode: "cinematic", focus: "andromeda-galaxy", deepState: "ready-3-ktx2-slices" },
  {
    name: "deep-sombrero-ready",
    path: `${screenshotRoot}/deep-sombrero-ready.png`,
    width: 1440,
    height: 900,
    mode: "cinematic",
    focus: "sombrero-galaxy",
    deepState: "ready-2-ktx2-slices",
    readySlices: 2,
  },
  { name: "deep-pleiades-ready", path: `${screenshotRoot}/deep-pleiades-ready.png`, width: 1440, height: 900, mode: "cinematic", focus: "pleiades", deepState: "ready-3-ktx2-slices" },
  { name: "mobile-cinematic-earth-overview", path: `${screenshotRoot}/mobile-cinematic-earth-overview.png`, width: 390, height: 844, mode: "cinematic", focus: "earth", deepState: null },
  { name: "mobile-cinematic-saturn-closeup", path: `${screenshotRoot}/mobile-cinematic-saturn-closeup.png`, width: 390, height: 844, mode: "cinematic", focus: "saturn", deepState: null },
  { name: "mobile-cinematic-bennu-closeup", path: `${screenshotRoot}/mobile-cinematic-bennu-closeup.png`, width: 390, height: 844, mode: "cinematic", focus: "bennu", deepState: null },
  { name: "mobile-cinematic-galactic-core", path: `${screenshotRoot}/mobile-cinematic-galactic-core.png`, width: 390, height: 844, mode: "cinematic", focus: "milky-way-center", deepState: null },
];
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
function fileRecord(path) {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}
function seal(relative, body) {
  const absolute = resolve(root, relative);
  const document = { ...body, receiptSha256: canonicalSha(body) };
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
  return document;
}
const rawCapture = JSON.parse(readFileSync(resolve(root, rawCapturePath), "utf8"));
const candidateManifest = JSON.parse(readFileSync(resolve(root, "public/data/living-universe-v592/manifest.json"), "utf8"));
const standaloneBuild = JSON.parse(readFileSync(resolve(root, "dist/release/atlas-v592-standalone-build-resource.json"), "utf8"));
const liteBuild = JSON.parse(readFileSync(resolve(root, "dist/release/atlas-v592-lite-build-resource.json"), "utf8"));
assert(rawCapture.version === "v592-living-universe-live-browser-raw-v2", "v592-live-browser-raw-version");
assert(rawCapture.route === "/local-shadow-v592" && rawCapture.browser === "Codex in-app browser", "v592-live-browser-raw-boundary");
assert(rawCapture.frames.length === frameDefinitions.length, "v592-live-browser-raw-frame-count");
assert(rawCapture.capturedCandidateManifestSha256 === candidateManifest.manifestSha256, "v592-live-browser-manifest-identity");
assert(
  rawCapture.capturedBuildIds?.standalone === standaloneBuild.buildId
  && rawCapture.capturedBuildIds?.lite === liteBuild.buildId,
  "v592-live-browser-build-identity",
);
const frames = frameDefinitions.map((definition) => {
  const captured = rawCapture.frames.find((frame) => frame.name === definition.name);
  assert(captured, `v592-live-browser-frame-missing:${definition.name}`);
  for (const key of ["path", "width", "height", "mode", "focus", "deepState"]) {
    assert(captured[key] === definition[key], `v592-live-browser-frame-contract:${definition.name}:${key}`);
  }
  for (const key of ["readySlices", "blockedSlices", "fullFallbackCount"]) {
    if (definition[key] !== undefined) {
      assert((captured[key] ?? 0) === definition[key], `v592-live-browser-frame-contract:${definition.name}:${key}`);
    }
  }
  const minimumFps = definition.width === 1440 && definition.focus === "earth" ? 55 : 45;
  assert(Number.isFinite(captured.sampledFps) && captured.sampledFps >= minimumFps, `v592-live-browser-fps:${definition.name}`);
  assert(captured.canvasCount === 1, `v592-live-browser-canvas:${definition.name}`);
  assert(captured.consolePageWebglErrorCount === 0, `v592-live-browser-errors:${definition.name}`);
  assert(captured.scientificPayloadSha256 === payloadSha256, `v592-live-browser-payload:${definition.name}`);
  assert(captured.scientificPayloadWriteback === false && captured.scienceCinematicPayloadStable === true, `v592-live-browser-boundary:${definition.name}`);
  const absolute = resolve(root, definition.path);
  if (!existsSync(absolute)) throw new Error(`v592-live-browser-screenshot-missing:${definition.name}`);
  const bytes = readFileSync(absolute);
  assert(bytes.byteLength === captured.screenshotBytes && sha256(bytes) === captured.screenshotSha256, `v592-live-browser-screenshot:${definition.name}`);
  return {
    ...definition,
    sampledFps: captured.sampledFps,
    ...(definition.readySlices === undefined ? {} : { readySlices: definition.readySlices }),
    ...(definition.blockedSlices === undefined ? {} : { blockedSlices: definition.blockedSlices }),
    ...(definition.fullFallbackCount === undefined ? {} : { fullFallbackCount: definition.fullFallbackCount }),
    screenshotBytes: bytes.byteLength,
    screenshotSha256: sha256(bytes),
    canvasCount: 1,
    consolePageWebglErrorCount: 0,
    scientificPayloadSha256: payloadSha256,
    scientificPayloadWriteback: false,
    scienceCinematicPayloadStable: true,
  };
});
const receipt = seal(outputPath, {
  version: "v592-living-universe-live-browser-matrix-v1",
  generatedAt: rawCapture.generatedAt,
  status: "passed-current-standalone-live-matrix-all-requested-slices-ready",
  route: "/local-shadow-v592",
  candidate: "v592-living-universe-candidate-v1",
  capturedCandidateManifestSha256: candidateManifest.manifestSha256,
  capturedBuildIds: { standalone: standaloneBuild.buildId, lite: liteBuild.buildId },
  source: { rawCapture: fileRecord(rawCapturePath) },
  evidenceIntegrationRequiresReseal: true,
  frames,
  admission: {
    frameCount: frames.length,
    desktopFrameCount: frames.filter((frame) => frame.width === 1440).length,
    mobileFrameCount: frames.filter((frame) => frame.width === 390).length,
    singleCanvas: frames.every((frame) => frame.canvasCount === 1),
    consolePageWebglErrorCount: frames.reduce((sum, frame) => sum + frame.consolePageWebglErrorCount, 0),
    scienceCinematicPayloadStable: frames.every((frame) => frame.scienceCinematicPayloadStable),
    scientificPayloadWriteback: frames.some((frame) => frame.scientificPayloadWriteback),
    payloadSha256: payloadSha256,
    desktopMinimumSampledFps: Math.min(...frames.filter((frame) => frame.width === 1440).map((frame) => frame.sampledFps)),
    mobileMinimumSampledFps: Math.min(...frames.filter((frame) => frame.width === 390).map((frame) => frame.sampledFps)),
    deepSpaceMinimumSampledFps: Math.min(...frames.filter((frame) => frame.deepState !== null).map((frame) => frame.sampledFps)),
    deepSpaceReadyFrameCount: frames.filter((frame) => frame.deepState?.startsWith("ready-")).length,
    deepSpaceBlockedFrameCount: frames.filter((frame) => (frame.blockedSlices ?? 0) > 0).length,
    fallbackFrameCount: frames.filter((frame) => (frame.fullFallbackCount ?? 0) > 0).length,
  },
  policy: {
    browser: "Codex in-app browser",
    standaloneBuildOnly: true,
    liteBrowserMatrixNotClaimed: true,
    performanceValuesAreSampledFrameEstimates: true,
    noAutomaticRetry: true,
    noAlternateBrowser: true,
    noProductionDeployment: true,
    formalProductPointer: "v263",
    scientificPayloadWriteback: false,
  },
});
console.log(JSON.stringify({ status: receipt.status, frameCount: receipt.frames.length, desktopMinimumSampledFps: receipt.admission.desktopMinimumSampledFps, mobileMinimumSampledFps: receipt.admission.mobileMinimumSampledFps, receiptSha256: receipt.receiptSha256 }, null, 2));
