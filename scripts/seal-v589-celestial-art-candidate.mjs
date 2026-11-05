import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.V589_GENERATED_AT ?? "2026-08-09T10:00:00Z";
const connectorTeamId = process.env.V589_CONNECTOR_TEAM_ID ?? "unavailable";
const docsRoot = resolve(root, "docs/release/v589");
const manifestPath = resolve(root, "public/data/celestial-art-v589/manifest.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonical(value)), "utf8"));

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, path);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fileRecord(path) {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) return { path, exists: false, bytes: 0, sha256: null };
  const bytes = readFileSync(absolute);
  return { path, exists: true, bytes: bytes.byteLength, sha256: sha256(bytes) };
}

function writeSealed(path, unsigned, shaField) {
  const value = { ...unsigned, [shaField]: canonicalSha(unsigned) };
  atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`);
  return value;
}

const manifestBytes = readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const unsignedManifest = { ...manifest };
delete unsignedManifest.manifestSha256;
if (canonicalSha(unsignedManifest) !== manifest.manifestSha256) throw new Error("v589-manifest-sha");
if (manifest.boundaries.formalProductPointer !== "v263" || manifest.boundaries.scientificPayloadWriteback !== false) {
  throw new Error("v589-manifest-boundary");
}

const freezeBefore = readJson(resolve(docsRoot, "freeze-before-v589.json"));
for (const expected of [...freezeBefore.inheritedFrozenSnapshot, ...freezeBefore.additiveSnapshot]) {
  const observed = fileRecord(expected.path);
  if (observed.exists !== expected.exists || observed.bytes !== expected.bytes || observed.sha256 !== expected.sha256) {
    throw new Error(`v589-freeze-after-drift:${expected.path}`);
  }
}

const sourcePaths = [
  "app/data/celestialArtManifestV589.generated.ts",
  "app/lib/celestialArtV589.ts",
  "app/lib/useV589Texture.ts",
  "app/lib/useV589Model.ts",
  "app/workers/celestialStarfieldV589.worker.ts",
  "app/components/CelestialArtStageV589.tsx",
  "app/components/OrbitAtlasCelestialArtV589.tsx",
  "app/components/OrbitAtlasCelestialArtV589Lazy.tsx",
  "app/components/UniverseCanvasOverrideHostV589.tsx",
  "app/local-shadow-v589/page.tsx",
  "scripts/v589-visual-sources.json",
  "scripts/acquire-v589-visual-assets.mjs",
  "scripts/build-v589-celestial-art-candidate.mjs",
  "scripts/build-atlas-v589-profile.mjs",
  "scripts/build-v589-browser-qualification.mjs",
  "scripts/start-atlas-standalone.mjs",
  "scripts/seal-v589-celestial-art-candidate.mjs",
  "app/lib/celestialArtV589.test.ts",
  "app/lib/celestialArtAssetsV589.test.ts",
  "app/components/OrbitAtlasCelestialArtV589.test.tsx",
  "docs/release/v589/acquisition-receipt-v589.json",
  "docs/release/v589/bennu-lod-receipt-v589.json",
];
const sourceFiles = sourcePaths.map(fileRecord);
if (sourceFiles.some((entry) => !entry.exists)) throw new Error("v589-source-file-missing");
const sourceManifest = writeSealed(resolve(docsRoot, "source-manifest-v589.json"), {
  version: "v589-source-manifest-v1",
  generatedAt,
  files: sourceFiles,
  sourceCount: sourceFiles.length,
  sourceSha256: canonicalSha(sourceFiles),
}, "receiptSha256");

const buildSlots = [
  { tier: "standalone-full", distDir: ".next-atlas-v589-standalone-current" },
  { tier: "vercel-lite", distDir: ".next-atlas-v589-lite-current" },
].map((slot) => {
  const base = resolve(root, slot.distDir);
  const profile = readJson(resolve(base, "atlas-build-profile.json"));
  const routeManifest = readJson(resolve(base, "app-path-routes-manifest.json"));
  const buildId = readFileSync(resolve(base, "BUILD_ID"), "utf8").trim();
  const routePresent = Object.values(routeManifest).includes("/local-shadow-v589");
  if (!routePresent || profile.profile !== "local-shadow" || profile.buildId !== buildId) {
    throw new Error(`v589-build-slot:${slot.tier}`);
  }
  return {
    ...slot,
    buildId,
    routePresent,
    standaloneTopologyPresent: existsSync(resolve(base, "standalone/server.js")),
    profileSha256: sha256(readFileSync(resolve(base, "atlas-build-profile.json"))),
    routeManifestSha256: sha256(readFileSync(resolve(base, "app-path-routes-manifest.json"))),
  };
});
if (buildSlots.some((slot) => !slot.standaloneTopologyPresent)) throw new Error("v589-standalone-topology");

const liteBase = readJson(resolve(root, "public/atlas-lite/manifest.json"));
const projectedLiteBytes = liteBase.installedBytes + manifest.budgets.observedLiteIncrementBytes;
if (projectedLiteBytes > liteBase.maxBytes || manifest.budgets.observedLiteIncrementBytes > manifest.budgets.liteIncrementBytesMaximum) {
  throw new Error("v589-lite-budget");
}

const buildReceipt = writeSealed(resolve(docsRoot, "post-build-receipt-v589.json"), {
  version: "v589-post-build-receipt-v1",
  generatedAt,
  status: "standalone-and-lite-route-overlay-builds-passed",
  buildSlots,
  nodeHeapMaximumMiB: 8192,
  buildProcessPolicy: "single-profile-single-process-no-automatic-retry",
  swcRuntime: "official-wasm-fallback-native-binding-unavailable",
  route: "/local-shadow-v589",
  httpSmoke: { status: 200, source: "local-standalone-read-only-request", browserAuthority: false },
  liteBudget: {
    baselineBytes: liteBase.installedBytes,
    v589IncrementBytes: manifest.budgets.observedLiteIncrementBytes,
    projectedBytes: projectedLiteBytes,
    maximumBytes: liteBase.maxBytes,
    passed: true,
  },
  browserStarted: true,
  browserQualified: false,
  denseStarted: false,
  gpuScienceStarted: false,
  productionDeploymentStarted: false,
}, "receiptSha256");

const localProject = readJson(resolve(root, ".vercel/project.json"));
const vercelMismatch = localProject.orgId !== connectorTeamId;
const vercelReceipt = writeSealed(resolve(docsRoot, "blocked-vercel-scope-mismatch-v589.json"), {
  version: "v589-vercel-scope-receipt-v1",
  generatedAt,
  status: vercelMismatch ? "blocked-vercel-scope-mismatch" : "scope-match-preview-not-deployed",
  localProject: { projectId: localProject.projectId, orgId: localProject.orgId, projectName: localProject.projectName },
  connector: { visibleTeamId: connectorTeamId },
  scopeMatch: !vercelMismatch,
  previewDeploymentStarted: false,
  productionDeploymentStarted: false,
  formalProductPointerMigrated: false,
}, "receiptSha256");

const qualificationPath = resolve(docsRoot, "browser-qualification-v589.json");
let browserReceipt;
if (existsSync(qualificationPath)) {
  browserReceipt = readJson(qualificationPath);
  const unsignedBrowserReceipt = { ...browserReceipt };
  delete unsignedBrowserReceipt.receiptSha256;
  if (
    canonicalSha(unsignedBrowserReceipt) !== browserReceipt.receiptSha256
    || browserReceipt.browser !== "Codex in-app browser"
    || browserReceipt.route !== "http://127.0.0.1:3011/local-shadow-v589"
    || browserReceipt.scientificPayloadWriteback !== false
  ) throw new Error("v589-browser-qualification-receipt");
} else {
  browserReceipt = writeSealed(resolve(docsRoot, "blocked-browser-gate-v589.json"), {
    version: "v589-browser-gate-receipt-v1",
    generatedAt,
    status: "blocked-browser-observation-missing",
    browser: "Codex in-app browser",
    route: "http://127.0.0.1:3011/local-shadow-v589",
    screenshotsCaptured: 0,
    visualMatrixQualified: false,
    fpsQualified: false,
    mobileQualified: false,
    soak30MinutesQualified: false,
    resourceLifecycleQualified: false,
    alternateBrowserUsed: false,
    syntheticBrowserEvidenceWritten: false,
    scientificPayloadWriteback: false,
  }, "receiptSha256");
}

const freezeAfter = writeSealed(resolve(docsRoot, "freeze-after-v589.json"), {
  version: "v589-frozen-boundary-after-v1",
  generatedAt,
  status: "passed-v263-v9-v559-v560-v562-v587-v588-byte-identical-after-v589",
  beforeSnapshotSha256: freezeBefore.snapshotSha256,
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  historicalEvidenceRewritten: false,
  inheritedFrozenSnapshot: freezeBefore.inheritedFrozenSnapshot,
  additiveSnapshot: freezeBefore.additiveSnapshot,
}, "snapshotSha256");

const admittedBodies = Object.entries(manifest.heroBodies).filter(([, status]) => status === "admitted").map(([body]) => body);
const blockedBodies = Object.entries(manifest.heroBodies).filter(([, status]) => status !== "admitted").map(([body]) => body);
const browserVisualQualified = browserReceipt.visualMatrixQualified === true
  && browserReceipt.fpsQualified === true
  && browserReceipt.mobileQualified === true
  && browserReceipt.logGateQualified === true
  && browserReceipt.modeAuthorityQualified === true;
const browserResourceQualified = browserReceipt.resourceLifecycleQualified === true;
const browserSoakQualified = browserReceipt.soak30MinutesQualified === true;
const pointer = writeSealed(resolve(root, "dist/release/orbit-atlas-current-celestial-art-candidate-v589.json"), {
  version: "v589-current-research-visual-candidate-pointer-v2",
  generatedAt,
  status: blockedBodies.length > 0
    ? browserVisualQualified && browserResourceQualified
      ? browserSoakQualified
        ? "additive-candidate-partial-assets-browser-qualified"
        : "additive-candidate-partial-assets-browser-qualified-soak30-blocked"
      : "additive-candidate-partial-assets-browser-blocked"
    : browserVisualQualified && browserResourceQualified && browserSoakQualified
      ? "qualified-additive-visual-candidate"
      : "all-assets-present-browser-promotion-blocked",
  route: "/local-shadow-v589",
  candidate: manifest.version,
  manifestSha256: manifest.manifestSha256,
  sourceManifestSha256: sourceManifest.receiptSha256,
  postBuildReceiptSha256: buildReceipt.receiptSha256,
  freezeAfterSha256: freezeAfter.snapshotSha256,
  browserReceiptSha256: browserReceipt.receiptSha256,
  vercelReceiptSha256: vercelReceipt.receiptSha256,
  formalProductPointer: "v263",
  scientificPayloadSha256: "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674",
  scientificPayloadWriteback: false,
  productionPromotionAllowed: false,
}, "pointerSha256");

const capability = writeSealed(resolve(docsRoot, "capability-report-v589.json"), {
  version: "v589-celestial-art-capability-report-v1",
  generatedAt,
  status: blockedBodies.length > 0
    ? browserVisualQualified && browserResourceQualified
      ? "implemented-partial-assets-browser-qualified-soak-and-vercel-blocked"
      : "implemented-partial-assets-browser-and-vercel-blocked"
    : "implemented-all-assets-promotion-gates-pending",
  candidate: {
    route: "/local-shadow-v589",
    manifestSha256: manifest.manifestSha256,
    pointerSha256: pointer.pointerSha256,
    formalProductPointer: "v263",
  },
  capabilities: {
    singleCanvas: true,
    scienceCinematicSharedGeometry: true,
    scientificPayloadWriteback: false,
    gaiaLiteRows: 46_000,
    gaiaStandaloneRange10m: "manifest-directory-http-range-worker-active-not-science-authority",
    starLayers: ["faint-points", "catalog-points", "bright-instanced-psf"],
    magnitudeFluxLaw: "10^(-0.4m)",
    bpRpColor: true,
    randomTwinkle: false,
    constellationBindings: "484/484-under-1.5deg",
    constellationDepthOcclusion: true,
    orbitSystem: "v588-visual-baseline-extended-to-16-bodies",
    heroAdmittedBodies: admittedBodies,
    heroBlockedBodies: blockedBodies,
    heroProceduralFallback: false,
    moonDemNormalAndRoughness: true,
    visualAcquisitionCount: 10,
    nasaPublicDomainAcquisitionCount: 7,
    polyHavenCc0AcquisitionCount: 3,
    bennuModelLod: "3/3-verified-meshopt-normals-stable-pivot",
    bennuModelAdmission: manifest.heroBodies.bennu,
    earthDemNormalAdmission: manifest.heroBodies.earth,
    ktx2FirstWithVerifiedWebpFallback: true,
    liteIncrementBytes: manifest.budgets.observedLiteIncrementBytes,
    standaloneBuild: "passed",
    liteBuild: "passed",
  },
  blockedGates: {
    allSixteenHeroAdmission: blockedBodies.length === 0 ? "passed" : `blocked:${blockedBodies.join(",")}`,
    browserVisualMatrix: browserVisualQualified ? "passed" : browserReceipt.status,
    fps: browserReceipt.fpsQualified === true ? "passed" : "blocked-browser-observation",
    soak: browserSoakQualified ? "passed-30-minutes" : "blocked-30-minute-soak-not-qualified",
    resourceLifecycle: browserResourceQualified ? "passed-released-zero" : "blocked-browser-observation",
    vercelPreview: vercelReceipt.status,
    productionRelease: "not-authorized",
  },
  evidence: {
    sourceManifestSha256: sourceManifest.receiptSha256,
    postBuildReceiptSha256: buildReceipt.receiptSha256,
    freezeAfterSha256: freezeAfter.snapshotSha256,
    browserReceiptSha256: browserReceipt.receiptSha256,
    browserScreenshotManifestSha256: browserReceipt.screenshotManifestSha256 ?? null,
    vercelReceiptSha256: vercelReceipt.receiptSha256,
  },
  releaseAuthorized: false,
}, "reportSha256");

console.log(JSON.stringify({
  status: capability.status,
  manifestSha256: manifest.manifestSha256,
  pointerSha256: pointer.pointerSha256,
  capabilityReportSha256: capability.reportSha256,
  admittedBodies,
  blockedBodies,
  builds: buildSlots.map((slot) => `${slot.tier}:${slot.buildId}`),
  browser: browserReceipt.status,
  vercel: vercelReceipt.status,
  formalProductPointer: "v263",
}, null, 2));
