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
  if (value[field] !== canonicalSha(unsigned)) throw new Error(`v591-nasa-small-body-browser-seal:${relativePath}`);
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
const definitions = Object.freeze([
  {
    body: "eros",
    overlaySha256: "75d1e9fdde61c7e1b028421c1c6a70ff9015318ca25f90a469676c7d73054327",
    modelLodReceiptSha256: "133e2f6194401c7afab1873fe22c93e2bd3044cc551dcb3c55affeefba02ff66",
    material: "nasa-shape-cc0-triplanar-s-type-silicate-oren-nayar-bounded-opposition",
    modelIdentity: "v591-eros-nasa-shape-owned;watertight-topology-paired-two-half-reconstruction;lod0/1/2;meshopt;normals;stable-pivot",
    sourceDetailCeiling: "nasa-shape-200856-triangles",
    reconstruction: "watertight-topology-paired",
    microtexturePolicy: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-eros-observation",
    reflectance: "s-type-silicate-oren-nayar-bounded-opposition-no-glossy-specular",
  },
  {
    body: "kleopatra",
    overlaySha256: "9ce6211aef85bb3f6a7760d0714dac0f4382dd075b0526949ace874e88e8a154",
    modelLodReceiptSha256: "5689f7c26a5326dfba9e527626bce13037fc3e574a9b84cb3802b789c39df3f6",
    material: "nasa-radar-shape-cc0-triplanar-m-type-rough-broad-edge-response",
    modelIdentity: "v591-kleopatra-nasa-low-resolution-radar-shape-owned;lod0/1/2;meshopt;normals;stable-pivot",
    sourceDetailCeiling: "nasa-low-resolution-radar-shape-4092-triangles",
    reconstruction: "not-applicable",
    microtexturePolicy: "poly-haven-cc0-exact-byte-reuse-presentation-only-not-kleopatra-observation",
    reflectance: "metal-rich-rough-oren-nayar-bounded-broad-edge-response-no-glossy-specular",
  },
]);

const summaries = [];
for (const definition of definitions) {
  const outputPath = resolve(root, `docs/release/v591/browser-qualification-${definition.body}-v591.json`);
  if (existsSync(outputPath)) {
    const existing = readSealed(`docs/release/v591/browser-qualification-${definition.body}-v591.json`, "receiptSha256");
    if (!existing.status?.includes("pending-current-build")) {
      throw new Error(`v591-${definition.body}-browser-receipt-not-replaceable`);
    }
  }
  const screenshots = [
    ["desktop", "science", 1440, 900],
    ["desktop", "cinematic", 1440, 900],
    ["mobile", "science", 390, 844],
    ["mobile", "cinematic", 390, 844],
  ].map(([device, mode, width, height]) => ({
    path: `docs/release/v591/screenshots/${definition.body}-${device}-${mode}-${width}x${height}-current.png`,
    device,
    mode,
    width,
    height,
    bytes: 0,
    sha256: "0".repeat(64),
    subjectVisible: false,
  }));
  const unsigned = {
    version: "v591-nasa-small-body-browser-qualification-v1",
    generatedAt: new Date().toISOString(),
    status: `${definition.body}-slice-pending-current-build-global-visual-matrix-pending`,
    route: "/local-shadow-v591",
    candidate: {
      manifestSha256: manifest.manifestSha256,
      sourceManifestSha256: sourceManifest.receiptSha256,
      capturedStandaloneBuildId: "pending-current-build",
      capturedStandaloneReceiptSha256: "0".repeat(64),
    },
    runtime: {
      canvasCount: 1,
      hero: definition.body,
      heroAdmission: "pending-current-build",
      desktopKtx2First: true,
      mobileKtx2First: true,
      desktopLod: "model-lod0;micro=4096x4096",
      mobileLod: "model-lod1;micro=2048x2048",
      requiredChannels: "4/4-static-admission-browser-pending",
      material: definition.material,
      ownedModel: definition.modelIdentity,
      assetOverlaySha256: definition.overlaySha256,
      modelLodReceiptSha256: definition.modelLodReceiptSha256,
      sourceDetailCeiling: definition.sourceDetailCeiling,
      printableSplitReconstruction: definition.reconstruction,
      microtexturePolicy: definition.microtexturePolicy,
      microtextureSourceOverlay: "v591-bennu-asset-overlay-exact-byte-reuse",
      microtextureExactByteReuse: true,
      measuredPhotometryClaim: false,
      reflectance: definition.reflectance,
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
      p2Heroes: "7/10-static-runtime-admission;browser-current-build-pending",
      allHeroes: "13/16-v591-overrides-static-runtime-admission",
      candidateQualified: false,
      formalProductPointer: "v263",
    },
  };
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicJson(outputPath, receipt);
  summaries.push({ body: definition.body, status: receipt.status, receiptSha256: receipt.receiptSha256 });
}

console.log(JSON.stringify({ status: "nasa-small-body-browser-receipts-pending-current-build", receipts: summaries }, null, 2));
