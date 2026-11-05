import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const docsRoot = resolve(root, "docs/release/v589");
const observationPath = resolve(docsRoot, "browser/browser-observation-v589.json");
const qualificationPath = resolve(docsRoot, "browser-qualification-v589.json");
const screenshotManifestPath = resolve(docsRoot, "browser-screenshot-manifest-v589.json");
const expectedPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonical(value)), "utf8"));

function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(partial, path);
}

function sealed(unsigned, field) {
  return { ...unsigned, [field]: canonicalSha(unsigned) };
}

function fileRecord(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  if (!normalized.startsWith("docs/release/v589/browser/") || normalized.includes("../")) {
    throw new Error(`v589-browser-screenshot-path:${relativePath}`);
  }
  const absolute = resolve(root, normalized);
  if (!existsSync(absolute)) throw new Error(`v589-browser-screenshot-missing:${relativePath}`);
  const bytes = readFileSync(absolute);
  return { path: normalized, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

if (!existsSync(observationPath)) throw new Error("v589-browser-observation-missing");
const observationBytes = readFileSync(observationPath);
const observation = JSON.parse(observationBytes.toString("utf8"));
if (
  observation.version !== "v589-browser-observation-v1"
  || observation.browser !== "Codex in-app browser"
  || observation.route !== "http://127.0.0.1:3011/local-shadow-v589"
  || !Array.isArray(observation.frames)
) throw new Error("v589-browser-observation-contract");

const frameIds = new Set();
const screenshotFiles = observation.frames.map((frame) => {
  if (typeof frame.id !== "string" || frameIds.has(frame.id)) throw new Error(`v589-browser-frame-id:${frame.id}`);
  frameIds.add(frame.id);
  if (!["science", "cinematic"].includes(frame.mode)) throw new Error(`v589-browser-frame-mode:${frame.id}`);
  if (!Number.isFinite(frame.viewport?.width) || !Number.isFinite(frame.viewport?.height)) throw new Error(`v589-browser-frame-viewport:${frame.id}`);
  if (frame.canvasCount !== 1 || frame.payloadSha256 !== expectedPayloadSha256 || frame.payloadStable !== true) {
    throw new Error(`v589-browser-frame-authority:${frame.id}`);
  }
  if (!Number.isFinite(frame.fpsMedian) || frame.fpsMedian <= 0) throw new Error(`v589-browser-frame-fps:${frame.id}`);
  const observed = fileRecord(frame.screenshot.path);
  if (frame.screenshot.bytes !== observed.bytes || frame.screenshot.sha256 !== observed.sha256) {
    throw new Error(`v589-browser-frame-screenshot-drift:${frame.id}`);
  }
  return { id: frame.id, ...observed };
});

const requiredFrameIds = [
  "desktop-earth-cinematic",
  "desktop-earth-science",
  "desktop-jupiter-cinematic",
  "desktop-saturn-cinematic",
  "desktop-bennu-cinematic",
  "desktop-overview-cinematic",
  "desktop-earth-extreme-dark",
  "desktop-earth-extreme-bright",
  "mobile-overview-cinematic",
  "mobile-earth-cinematic",
  "mobile-saturn-cinematic",
  "mobile-bennu-cinematic",
];
const missingRequiredFrames = requiredFrameIds.filter((id) => !frameIds.has(id));
const desktopFrames = observation.frames.filter((frame) => frame.viewport.width === 1440 && frame.viewport.height === 900);
const mobileFrames = observation.frames.filter((frame) => frame.viewport.width === 390 && frame.viewport.height === 844);
const fpsQualified = observation.frames.every((frame) => {
  const threshold = frame.viewport.width <= 767 || frame.focusTarget !== "overview" ? 45 : 55;
  return frame.fpsMedian >= threshold;
});
const visualMatrixQualified = missingRequiredFrames.length === 0
  && desktopFrames.length >= 8
  && mobileFrames.length >= 4
  && fpsQualified;
const logGateQualified = observation.logs?.consoleErrors === 0
  && observation.logs?.pageErrors === 0
  && observation.logs?.webglErrors === 0;
const modeAuthorityQualified = observation.modeSwitch?.beforePayloadSha256 === expectedPayloadSha256
  && observation.modeSwitch?.afterPayloadSha256 === expectedPayloadSha256
  && observation.modeSwitch?.stable === true;
const resourceLifecycleQualified = observation.resourceLifecycle?.status === "released-zero"
  && observation.resourceLifecycle?.candidateResources === 0
  && observation.resourceLifecycle?.registryDelta === 0
  && observation.resourceLifecycle?.sceneNodes === 0
  && observation.resourceLifecycle?.textures === observation.resourceLifecycle?.baselineTextures
  && observation.resourceLifecycle?.geometries === observation.resourceLifecycle?.baselineGeometries
  && observation.resourceLifecycle?.programs <= (observation.resourceLifecycle?.baselinePrograms ?? 0) + (observation.resourceLifecycle?.rendererCacheProgramsAllowed ?? 0)
  && observation.resourceLifecycle?.rendererCacheOnly === true;
const soak30MinutesQualified = observation.soak?.durationSeconds >= 1800
  && observation.soak?.continuousGrowth === false
  && observation.soak?.qualified === true;

const screenshotManifest = sealed({
  version: "v589-browser-screenshot-manifest-v1",
  generatedAt: observation.generatedAt,
  browser: observation.browser,
  route: observation.route,
  observationBytes: observationBytes.byteLength,
  observationSha256: sha256(observationBytes),
  files: screenshotFiles,
  frameCount: screenshotFiles.length,
}, "manifestSha256");
atomicWrite(screenshotManifestPath, screenshotManifest);

const qualification = sealed({
  version: "v589-browser-qualification-v1",
  generatedAt: observation.generatedAt,
  status: visualMatrixQualified && logGateQualified && modeAuthorityQualified && resourceLifecycleQualified && soak30MinutesQualified
    ? "qualified-browser-visual-performance-soak"
    : visualMatrixQualified && logGateQualified && modeAuthorityQualified && resourceLifecycleQualified
      ? "qualified-browser-visual-performance-resource-soak30-blocked"
      : "blocked-browser-qualification-incomplete",
  browser: observation.browser,
  route: observation.route,
  visualMatrixQualified,
  fpsQualified,
  mobileQualified: mobileFrames.length >= 4 && mobileFrames.every((frame) => frame.fpsMedian >= 45),
  logGateQualified,
  modeAuthorityQualified,
  resourceLifecycleQualified,
  soak30MinutesQualified,
  requiredFrameIds,
  missingRequiredFrames,
  frameCount: observation.frames.length,
  desktopFrameCount: desktopFrames.length,
  mobileFrameCount: mobileFrames.length,
  minimumFps: Math.min(...observation.frames.map((frame) => frame.fpsMedian)),
  maximumGpuBytes: Math.max(...observation.frames.map((frame) => frame.gpuBytes)),
  maximumDrawCalls: Math.max(...observation.frames.map((frame) => frame.drawCalls)),
  scientificPayloadSha256: expectedPayloadSha256,
  scientificPayloadWriteback: false,
  singleCanvas: observation.frames.every((frame) => frame.canvasCount === 1),
  screenshotManifestSha256: screenshotManifest.manifestSha256,
  observationSha256: sha256(observationBytes),
  soak: observation.soak,
  resourceLifecycle: observation.resourceLifecycle,
  ktx2: observation.ktx2,
  productionPromotionAllowed: false,
}, "receiptSha256");
atomicWrite(qualificationPath, qualification);

console.log(JSON.stringify({
  status: qualification.status,
  receiptSha256: qualification.receiptSha256,
  screenshotManifestSha256: screenshotManifest.manifestSha256,
  frameCount: qualification.frameCount,
  minimumFps: qualification.minimumFps,
  missingRequiredFrames,
  resourceLifecycleQualified,
  soak30MinutesQualified,
}, null, 2));
