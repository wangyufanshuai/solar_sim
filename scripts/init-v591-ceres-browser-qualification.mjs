import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function readSealed(relativePath, field) {
  const value = JSON.parse(readFileSync(resolve(root, relativePath), "utf8"));
  const unsigned = { ...value };
  delete unsigned[field];
  if (value[field] !== canonicalSha(unsigned)) throw new Error(`v591-ceres-browser-seal:${relativePath}`);
  return value;
}
function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

const manifest = readSealed("public/data/celestial-convergence-v591/manifest.json", "manifestSha256");
const sourceManifest = readSealed("docs/release/v591/source-manifest-v591.json", "receiptSha256");
const overlay = readSealed("public/data/celestial-convergence-v591/ceres-asset-overlay.json", "receiptSha256");
const outputPath = resolve(root, "docs/release/v591/browser-qualification-ceres-v591.json");
if (existsSync(outputPath)) {
  const existing = readSealed("docs/release/v591/browser-qualification-ceres-v591.json", "receiptSha256");
  if (!existing.status?.includes("pending-current-build")) throw new Error("v591-ceres-browser-receipt-not-replaceable");
}

const screenshots = [
  ["desktop", "science", 1440, 900],
  ["desktop", "cinematic", 1440, 900],
  ["mobile", "science", 390, 844],
  ["mobile", "cinematic", 390, 844],
].map(([device, mode, width, height]) => ({
  path: `docs/release/v591/screenshots/ceres-${device}-${mode}-${width}x${height}-current.png`,
  device,
  mode,
  width,
  height,
  bytes: 0,
  sha256: "0".repeat(64),
  subjectVisible: false,
}));

const unsigned = {
  version: "v591-ceres-browser-qualification-v1",
  generatedAt: new Date().toISOString(),
  status: "ceres-slice-pending-current-build-global-visual-matrix-pending",
  route: "/local-shadow-v591",
  candidate: {
    manifestSha256: manifest.manifestSha256,
    sourceManifestSha256: sourceManifest.receiptSha256,
    capturedStandaloneBuildId: "pending-current-build",
    capturedStandaloneReceiptSha256: "0".repeat(64),
  },
  runtime: {
    canvasCount: 1,
    hero: "ceres",
    heroAdmission: "pending-current-build",
    desktopKtx2First: true,
    mobileKtx2First: true,
    desktopLod: "model-lod0;macro=4096x2048",
    mobileLod: "model-lod1;macro=2048x1024",
    requiredChannels: "7/7-static-admission-browser-pending",
    material: "pds-dawn-spc-radius-relative-albedo-cc0-bounded-micro-oren-nayar",
    ownedModel: "v591-ceres-pds-dawn-radius-shape-owned;lod0/1/2;meshopt;normals;body-center-pivot",
    assetOverlaySha256: overlay.receiptSha256,
    modelLodReceiptSha256: overlay.modelLodReceiptSha256,
    sourceDetailCeiling: overlay.model.sourceDetailCeiling,
    observationGrid: "2222x1111-pds-dawn-spc-relative-albedo-and-radius",
    radiusRangeMeters: "442618.25:486849.59375",
    microtextureSourceOverlaySha256: overlay.microtextureReuse.sourceOverlaySha256,
    microtextureExactByteReuse: true,
    opticalColorClaim: false,
    syntheticDetailAdded: false,
    measuredPhotometryClaim: false,
    proceduralFallback: false,
    loaderLane: "single-v591-basis-loader;per-asset-failure-isolation",
    desktopMobileDesktopReplay: "pending-current-build",
    scientificPayloadSha256: "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674",
    scientificPayloadStableAcrossModesAndDeviceTiers: false,
    scientificWriteback: false,
    mobileDelivery: "ktx2-first-pending-current-build",
  },
  orderedReplay: [],
  measurements: {},
  releaseAudit: {
    candidateResources: -1,
    candidateBytes: -1,
    candidateSceneNodes: -1,
    candidateProgramDelta: -1,
    rendererTextureDelta: -1,
    rendererGeometryDelta: -1,
    rendererMemoryPolicy: "pending-current-build",
    registryStatus: "pending-current-build",
    status: "pending-current-build",
  },
  errorAudit: {
    nextErrorOverlayObserved: false,
    applicationErrorTextObserved: false,
    pageConsoleWarnings: -1,
    pageConsoleErrors: -1,
    logCollection: "pending-five-phase-current-build-replay",
    status: "pending-current-build",
  },
  screenshotEncoding: {
    browserCapture: "pending-current-build",
    evidenceFile: "png",
    normalization: "pending-current-build",
    contentResampling: false,
  },
  screenshots,
  scope: {
    p1CoreHeroes: "6/6",
    p2Heroes: "10/10-static-runtime-admission;browser-current-build-pending",
    allHeroes: "16/16-v591-overrides-static-runtime-admission",
    candidateQualified: false,
    formalProductPointer: "v263",
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicJson(outputPath, receipt);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
