import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const path = resolve(root, "docs/release/v591/browser-qualification-venus-v591.json");
const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/manifest.json"), "utf8"));
const sourceManifest = JSON.parse(readFileSync(resolve(root, "docs/release/v591/source-manifest-v591.json"), "utf8"));
const overlay = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/venus-asset-overlay.json"), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
if (existsSync(path)) {
  const existing = JSON.parse(readFileSync(path, "utf8"));
  const unsignedExisting = { ...existing };
  delete unsignedExisting.receiptSha256;
  if (canonicalSha(unsignedExisting) !== existing.receiptSha256) throw new Error("v591-venus-browser-receipt-seal");
  if (!existing.status?.includes("pending-current-build")) throw new Error("v591-venus-browser-receipt-not-replaceable");
}

const screenshots = [
  ["desktop", "science", 1440, 900],
  ["desktop", "cinematic", 1440, 900],
  ["mobile", "science", 390, 844],
  ["mobile", "cinematic", 390, 844],
].map(([device, mode, width, height]) => ({
  path: `docs/release/v591/screenshots/venus-${device}-${mode}-${width}x${height}-current.png`,
  device,
  mode,
  width,
  height,
  bytes: 0,
  sha256: "0".repeat(64),
  subjectVisible: false,
}));
const unsigned = {
  version: "v591-venus-browser-qualification-v1",
  generatedAt: new Date().toISOString(),
  status: "venus-slice-pending-current-build-global-visual-matrix-pending",
  route: "/local-shadow-v591",
  candidate: {
    manifestSha256: manifest.manifestSha256,
    sourceManifestSha256: sourceManifest.receiptSha256,
    capturedStandaloneBuildId: "pending-current-build",
    capturedStandaloneReceiptSha256: "0".repeat(64),
  },
  runtime: {
    canvasCount: 1,
    hero: "venus",
    heroAdmission: "pending-current-build",
    desktopKtx2First: true,
    mobileKtx2First: true,
    desktopLod: "4096x2048",
    mobileLod: "2048x1024",
    requiredChannels: "4/4",
    material: "nasa-jpl-magellan-multiview-thick-cloud-oren-nayar-no-specular",
    assetOverlaySha256: overlay.receiptSha256,
    surfaceSource: "nasa-jpl-magellan-0e-90e-270e-clean-global-views-derived-equirectangular",
    cloudModel: "deterministic-physical-inspired-primary-not-observation-texture",
    measuredTopographyClaim: false,
    opticalColorClaim: false,
    proceduralFallback: false,
    loaderLane: "single-v591-basis-loader;per-asset-failure-isolation",
    desktopMobileDesktopReplay: "pending-current-build",
    scientificPayloadSha256: "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674",
    scientificPayloadStableAcrossModesAndDeviceTiers: false,
    scientificWriteback: false,
    mobileDelivery: "ktx2-first",
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
    rendererMemoryPolicy: "shared-global-observational-only",
    registryStatus: "pending",
    status: "pending",
  },
  errorAudit: {
    nextErrorOverlayObserved: false,
    applicationErrorTextObserved: false,
    pageConsoleWarnings: -1,
    pageConsoleErrors: -1,
    logCollection: "pending-five-phase-replay",
    status: "pending",
  },
  screenshotEncoding: {
    browserCapture: "pending",
    evidenceFile: "png",
    normalization: "pending",
    contentResampling: false,
  },
  screenshots,
  scope: {
    p1CoreHeroes: "6/6",
    p2Heroes: "10/10-current-static-runtime-admission",
    allHeroes: "16/16-v591-overrides",
    candidateQualified: false,
    formalProductPointer: "v263",
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
mkdirSync(dirname(path), { recursive: true });
const partial = `${path}.part`;
writeFileSync(partial, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
rmSync(path, { force: true });
renameSync(partial, path);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
