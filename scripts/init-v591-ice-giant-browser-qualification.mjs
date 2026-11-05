import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = new Date().toISOString();
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/manifest.json"), "utf8"));
const sourceManifest = JSON.parse(readFileSync(resolve(root, "docs/release/v591/source-manifest-v591.json"), "utf8"));
const overlay = JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/ice-giant-primary-overlay.json"), "utf8"));

const bodies = [
  { body: "uranus", desktopLod: "analytical-primary-192x96", mobileLod: "analytical-primary-96x48", shader: "subtle-zonal-clouds-polar-haze-methane-limb-faint-rings" },
  { body: "neptune", desktopLod: "analytical-primary-192x96", mobileLod: "analytical-primary-96x48", shader: "zonal-clouds-methane-limb-bounded-dark-storm-faint-rings" },
];
for (const { body } of bodies) {
  const path = resolve(root, `docs/release/v591/browser-qualification-${body}-v591.json`);
  if (existsSync(path)) throw new Error(`v591-ice-giant-browser-receipt-exists:${body}`);
}

for (const { body, desktopLod, mobileLod, shader } of bodies) {
  const screenshots = [
    ["desktop", "science", 1440, 900],
    ["desktop", "cinematic", 1440, 900],
    ["mobile", "science", 390, 844],
    ["mobile", "cinematic", 390, 844],
  ].map(([device, mode, width, height]) => ({
    path: `docs/release/v591/screenshots/${body}-${device}-${mode}-${width}x${height}-current.png`,
    device,
    mode,
    width,
    height,
    bytes: 0,
    sha256: "0".repeat(64),
    subjectVisible: false,
  }));
  const unsigned = {
    version: "v591-ice-giant-browser-qualification-v1",
    generatedAt,
    status: `${body}-slice-pending-global-visual-matrix-pending`,
    route: "/local-shadow-v591",
    candidate: {
      manifestSha256: manifest.manifestSha256,
      sourceManifestSha256: sourceManifest.receiptSha256,
      capturedStandaloneBuildId: "pending",
      capturedStandaloneReceiptSha256: "0".repeat(64),
    },
    runtime: {
      canvasCount: 1,
      hero: body,
      heroAdmission: "asset-blocked",
      desktopKtx2First: false,
      mobileKtx2First: false,
      desktopLod,
      mobileLod,
      requiredChannels: "registered-primary-no-texture-assets",
      material: "registered-voyager-calibrated-qualitative-ice-giant-primary-v591",
      inheritedIdentity: "v590-ice-giant-flow-primary-readonly",
      overlaySha256: overlay.receiptSha256,
      shaderProfile: shader,
      proceduralPrimary: true,
      proceduralFallback: false,
      observationTextureClaim: false,
      measuredPhotometryClaim: false,
      loaderLane: "v590-no-v591-textures",
      desktopMobileDesktopReplay: "pending",
      scientificPayloadSha256: "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674",
      scientificPayloadStableAcrossModesAndDeviceTiers: false,
      scientificWriteback: false,
      mobileDelivery: "registered-procedural-primary",
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
      p2Heroes: "3/10",
      allHeroes: "9/16-v591-overrides",
      candidateQualified: false,
      formalProductPointer: "v263",
    },
  };
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  const path = resolve(root, `docs/release/v591/browser-qualification-${body}-v591.json`);
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

console.log(JSON.stringify({ status: "ice-giant-browser-receipts-initialized", bodies: bodies.map(({ body }) => body) }, null, 2));
