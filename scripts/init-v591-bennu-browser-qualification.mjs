import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const path = resolve(root, "docs/release/v591/browser-qualification-bennu-v591.json");
const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/manifest.json"), "utf8"));
const sourceManifest = JSON.parse(readFileSync(resolve(root, "docs/release/v591/source-manifest-v591.json"), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
if (existsSync(path)) throw new Error("v591-bennu-browser-receipt-exists");

const generatedAt = new Date().toISOString();
const screenshots = [
  ["desktop", "science", 1440, 900],
  ["desktop", "cinematic", 1440, 900],
  ["mobile", "science", 390, 844],
  ["mobile", "cinematic", 390, 844],
].map(([device, mode, width, height]) => ({
  path: `docs/release/v591/screenshots/bennu-${device}-${mode}-${width}x${height}-current.png`,
  device,
  mode,
  width,
  height,
  bytes: 0,
  sha256: "0".repeat(64),
  subjectVisible: false,
}));
const unsigned = {
  version: "v591-bennu-browser-qualification-v1",
  generatedAt,
  status: "bennu-slice-pending-global-visual-matrix-pending",
  route: "/local-shadow-v591",
  candidate: {
    manifestSha256: manifest.manifestSha256,
    sourceManifestSha256: sourceManifest.receiptSha256,
    capturedStandaloneBuildId: "pending",
    capturedStandaloneReceiptSha256: "0".repeat(64),
  },
  runtime: {
    canvasCount: 1,
    hero: "bennu",
    heroAdmission: "asset-blocked",
    desktopKtx2First: true,
    mobileKtx2First: true,
    desktopLod: "model-lod0;micro=4096x4096",
    mobileLod: "model-lod1;micro=2048x2048",
    requiredChannels: "4/4",
    material: "nasa-shape-cc0-triplanar-carbonaceous-oren-nayar-bounded-opposition",
    inheritedModel: "v589-bennu-model-readonly;lod0/1/2;meshopt;normals;stable-pivot",
    microtexturePolicy: "poly-haven-cc0-presentation-only-not-bennu-observation",
    reflectance: "bounded-low-albedo-carbonaceous-oren-nayar-opposition-no-glossy-specular",
    proceduralFallback: false,
    loaderLane: "single-v591-basis-loader;per-asset-failure-isolation",
    desktopMobileDesktopReplay: "pending",
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
    p2Heroes: "1/10",
    allHeroes: "7/16-v591-overrides",
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
