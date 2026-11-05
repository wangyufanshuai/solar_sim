import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { FULL_MATRIX_V593 as STAGE_MATRIX } from "../tmp/v593-full-matrix-browser-collector.mjs";

const root = process.cwd();
const generatedAt = "2026-08-23T00:00:00.000Z";
// The final sealed matrix owns its own current-source capture directory.  P5
// remains immutable historical evidence and must never be used as the input
// for a later reseal.
const rawPath = resolve(root, "docs/release/v593/screenshots/sealed-golden-matrix-current-source-final/browser-telemetry-raw.json");
const outputPath = resolve(root, argumentValue("--output") ?? process.env.V593_FULL_MATRIX_OUTPUT ?? "docs/release/v593/final-sealed-browser-matrix-v593.json");
const buildReceiptPath = resolve(root, "dist/release/atlas-v593-standalone-build-resource.json");
const manifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
const sourceManifestPath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const SCIENTIFIC_PAYLOAD_SHA256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";

const MATRIX = Object.freeze([
  { matrixId: "desktop-overview-science", preset: "galactic-core-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-overview-cinematic", preset: "galactic-core-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-overview-cinematic-clean", preset: "galactic-core-cinematic", mode: "cinematic", cleanView: true, device: "desktop" },
  { matrixId: "desktop-galactic-core-science", preset: "galactic-core-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-galactic-core-cinematic", preset: "galactic-core-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-galactic-anticenter-science", preset: "galactic-anticenter-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-galactic-anticenter-cinematic", preset: "galactic-anticenter-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-sun-science", preset: "sun-science-signature", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-sun-cinematic", preset: "sun-cinematic-signature", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-earth-science-day", preset: "earth-science-day", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-earth-cinematic-day", preset: "earth-cinematic-day", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-earth-cinematic-night", preset: "earth-cinematic-night", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-earth-science-limb", preset: "earth-science-limb", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-jupiter-science", preset: "jupiter-cinematic-grs", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-jupiter-cinematic-grs", preset: "jupiter-cinematic-grs", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-saturn-science-front", preset: "saturn-cinematic-front", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-saturn-cinematic-backlight", preset: "saturn-cinematic-backlight", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-saturn-cinematic-ring-shadow", preset: "saturn-cinematic-ring-shadow", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-sirius-science", preset: "sirius-cinematic-signature", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-sirius-cinematic", preset: "sirius-cinematic-signature", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-betelgeuse-science", preset: "betelgeuse-cinematic-signature", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-betelgeuse-cinematic", preset: "betelgeuse-cinematic-signature", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-orion-science", preset: "orion-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-orion-cinematic", preset: "orion-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-ursa-major-science", preset: "ursa-major-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-ursa-major-cinematic", preset: "ursa-major-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-cassiopeia-science", preset: "cassiopeia-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-cassiopeia-cinematic", preset: "cassiopeia-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-orion-nebula-science", preset: "orion-nebula-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-orion-nebula-cinematic", preset: "orion-nebula-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-heart-nebula-science", preset: "heart-nebula-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-heart-nebula-cinematic", preset: "heart-nebula-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-andromeda-science", preset: "andromeda-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-andromeda-cinematic", preset: "andromeda-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "desktop-pleiades-science", preset: "pleiades-science", mode: "science", cleanView: false, device: "desktop" },
  { matrixId: "desktop-pleiades-cinematic", preset: "pleiades-cinematic", mode: "cinematic", cleanView: false, device: "desktop" },
  { matrixId: "mobile-overview-cinematic", preset: "galactic-core-cinematic", mode: "cinematic", cleanView: false, device: "mobile" },
  { matrixId: "mobile-earth-cinematic", preset: "earth-cinematic-day", mode: "cinematic", cleanView: false, device: "mobile" },
  { matrixId: "mobile-jupiter-cinematic", preset: "jupiter-cinematic-grs", mode: "cinematic", cleanView: false, device: "mobile" },
  { matrixId: "mobile-saturn-cinematic", preset: "saturn-cinematic-front", mode: "cinematic", cleanView: false, device: "mobile" },
  { matrixId: "mobile-orion-cinematic", preset: "orion-cinematic", mode: "cinematic", cleanView: false, device: "mobile" },
  { matrixId: "mobile-andromeda-cinematic", preset: "andromeda-cinematic", mode: "cinematic", cleanView: false, device: "mobile" },
]);

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function canonicalSha(value) {
  return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
function assertSealed(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  if (document[field] !== canonicalSha(unsigned)) throw new Error(`v593-final-browser-seal:${label}`);
}
function fileRecord(path) {
  if (!existsSync(path)) throw new Error(`v593-final-browser-file-missing:${path}`);
  const bytes = readFileSync(path);
  return Object.freeze({ bytes: bytes.byteLength, sha256: sha256(bytes) });
}
function pngDimensions(bytes) {
  if (bytes.byteLength < 24 || bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
    throw new Error("v593-final-browser-png-required");
  }
  return Object.freeze({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
}
function assertSafeRelativePath(path) {
  if (typeof path !== "string" || path.length === 0 || isAbsolute(path)) {
    throw new Error(`v593-final-browser-path:${path}`);
  }
  const absolute = resolve(root, path);
  const workspacePath = relative(root, absolute);
  if (workspacePath === "" || workspacePath === ".." || workspacePath.startsWith(`..${sep}`) || isAbsolute(workspacePath)) {
    throw new Error(`v593-final-browser-path:${path}`);
  }
}

function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function evidenceRecord(path) {
  const bytes = readFileSync(path);
  return Object.freeze({
    path: relative(root, path).replaceAll("\\", "/"),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  });
}
function verifyRecord(record, label, magic = null) {
  assertSafeRelativePath(record?.path);
  const path = resolve(root, record.path);
  if (!existsSync(path)) throw new Error(`v593-final-browser-stage-missing:${label}:${record.path}`);
  const bytes = readFileSync(path);
  if (bytes.byteLength !== record.bytes || sha256(bytes) !== record.sha256) {
    throw new Error(`v593-final-browser-stage-drift:${label}:${record.path}`);
  }
  if (magic && bytes.toString("hex", 0, magic.length / 2) !== magic) {
    throw new Error(`v593-final-browser-stage-format:${label}:${record.path}`);
  }
  return bytes;
}

async function buildFromStageBatch(stageBatchPath) {
  const workspacePath = relative(root, stageBatchPath);
  if (workspacePath === "" || workspacePath === ".." || workspacePath.startsWith(`..${sep}`) || isAbsolute(workspacePath) || resolve(root, workspacePath) !== stageBatchPath) {
    throw new Error("v593-final-browser-stage-boundary");
  }
  const batch = readJson(stageBatchPath);
  const build = readJson(buildReceiptPath);
  const liteBuild = readJson(resolve(root, "dist/release/atlas-v593-lite-build-resource.json"));
  const manifest = readJson(manifestPath);
  const source = readJson(sourceManifestPath);
  const expectedDeploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  assertSealed(manifest, "manifestSha256", "manifest");
  assertSealed(source, "receiptSha256", "source-manifest");
  for (const entry of source.files ?? []) verifyRecord(entry, `source:${entry.path}`);
  if (
    batch.version !== "v593-full-matrix-browser-stage-v2"
    || batch.status !== "staging-full-matrix-audit-passed-not-promoted"
    || batch.route !== "/local-shadow-v593"
    || batch.frames?.length !== STAGE_MATRIX.length
    || batch.expectedFrameCount !== STAGE_MATRIX.length
    || batch.failures?.some((failure) => !failure.resolution)
    || batch.console?.status !== "passed-zero-warning-error"
    || batch.console?.count !== 0
    || batch.capturePolicy?.currentSharedBuildOnly !== true
    || batch.capturePolicy?.noHistoricalSubstitution !== true
    || batch.capturePolicy?.browserScreenshotRequest !== "viewport-screenshot-without-clip"
    || batch.capturePolicy?.browserClipPaddingForbidden !== true
    || batch.capturePolicy?.pixelReconstructionClaim !== false
    || batch.imageAudit?.status !== "passed-exact-viewport-no-clip-jpeg-and-png-derivatives"
    || batch.imageAudit?.count !== STAGE_MATRIX.length
    || batch.imageAudit?.allExactRequestedViewport !== true
    || batch.imageAudit?.allDecodedPixelsIdentical !== true
    || batch.imageAudit?.allPagePixelCoverage !== true
    || batch.imageAudit?.nativePngClaim !== false
    || batch.imageAudit?.pixelReconstructionClaim !== false
    || batch.attemptAudit?.status !== "passed-all-failed-attempts-resolved"
    || batch.attemptAudit?.allFailuresResolved !== true
    || batch.fullMatrixAudit?.status !== "passed-staging-integrity-not-promoted"
    || batch.fullMatrixAudit?.errors?.length !== 0
    || batch.fullMatrixAudit?.frameCount !== STAGE_MATRIX.length
    || batch.fullMatrixAudit?.scientificPayloadUniqueCount !== 1
    || batch.fullMatrixAudit?.buildIdUniqueCount !== 1
    || batch.fullMatrixAudit?.deploymentIdUniqueCount !== 1
    || batch.fullMatrixAudit?.consoleCount !== 0
  ) throw new Error("v593-final-browser-stage-root-contract");
  if (
    build.status !== "passed"
    || liteBuild.status !== "passed"
    || build.deliveryTier !== "standalone-full"
    || liteBuild.deliveryTier !== "vercel-lite"
    || build.buildId !== liteBuild.buildId
    || build.deploymentId !== expectedDeploymentId
    || liteBuild.deploymentId !== expectedDeploymentId
    || batch.identity?.buildId !== build.buildId
    || batch.identity?.sourceManifestSha256 !== source.receiptSha256
    || batch.identity?.candidateManifestSha256 !== manifest.manifestSha256
    || batch.identity?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
    || build.candidateSourceManifestSha256 !== source.receiptSha256
    || liteBuild.candidateSourceManifestSha256 !== source.receiptSha256
    || typeof batch.identity?.deploymentId !== "string"
    || batch.identity.deploymentId.length === 0
    || batch.identity.deploymentId !== expectedDeploymentId
  ) throw new Error("v593-final-browser-stage-identity");
  if (!Array.isArray(batch.buildEvidence) || batch.buildEvidence.length !== 2) {
    throw new Error("v593-final-browser-stage-build-evidence-count");
  }
  for (const evidence of batch.buildEvidence) {
    const bytes = verifyRecord(evidence, `build:${evidence.deliveryTier}`);
    const receipt = JSON.parse(bytes.toString("utf8"));
    if (
      receipt.status !== "passed"
      || receipt.buildId !== build.buildId
      || receipt.deploymentId !== expectedDeploymentId
      || receipt.candidateSourceManifestSha256 !== source.receiptSha256
      || !["standalone-full", "vercel-lite"].includes(receipt.deliveryTier)
    ) throw new Error(`v593-final-browser-stage-build-evidence:${evidence.path}`);
  }

  const seen = new Set();
  const frames = batch.frames.map((frame, index) => {
    const expected = STAGE_MATRIX[index];
    const telemetry = frame.telemetry;
    const viewport = expected.device === "desktop"
      ? { width: 1440, height: 900 }
      : { width: 390, height: 844 };
    const targets = String(telemetry?.sourceTargets ?? "").split(",");
    const sourceShas = String(telemetry?.sourceShas ?? "").split(",");
    const deepOk = !expected.deepCounts || (
      telemetry?.sphere === expected.deepCounts.sphere
      && telemetry?.starfield === expected.deepCounts.starfield
      && telemetry?.nebula === expected.deepCounts.nebula
      && telemetry?.observation === expected.deepCounts.observation
      && telemetry?.targetReady === expected.targetReady
      && (!expected.sourceTarget || targets.includes(expected.sourceTarget))
      && (!expected.sourceSha || sourceShas.includes(expected.sourceSha))
      && (!expected.sourceShas || (
        sourceShas.length === expected.sourceShas.length
        && expected.sourceShas.every((sourceSha) => sourceShas.includes(sourceSha))
      ))
    );
    const sunOk = !expected.sunCounts || (
      telemetry?.sunPhotosphere === expected.sunCounts.photosphere
      && telemetry?.sunChromosphere === expected.sunCounts.chromosphere
    );
    const earthOk = !expected.earthCounts || (
      telemetry?.earthSurface === expected.earthCounts.surface
      && telemetry?.earthCloud === expected.earthCounts.cloud
      && telemetry?.earthAtmosphere === expected.earthCounts.atmosphere
    );
    const saturnOk = !expected.saturnCounts || (
      telemetry?.saturnSurface === expected.saturnCounts.surface
      && telemetry?.saturnRing === expected.saturnCounts.ring
    );
    if (
      frame.index !== index
      || frame.matrixId !== expected.matrixId
      || frame.requestedPreset !== expected.preset
      || frame.actualPreset !== expected.preset
      || frame.requestedMode !== expected.mode
      || frame.actualMode !== expected.mode
      || frame.cleanView !== expected.cleanView
      || frame.device !== expected.device
      || seen.has(frame.matrixId)
      || frame.requestedViewport?.width !== viewport.width
      || frame.requestedViewport?.height !== viewport.height
      || telemetry?.viewport?.width !== viewport.width
      || telemetry?.viewport?.height !== viewport.height
      || telemetry?.canvasActualCount !== 1
      || telemetry?.canvasDeclared !== 1
      || telemetry?.canvasReady !== "true"
      || telemetry?.singleCanvas !== "true"
      || telemetry?.focusId !== expected.focusId
      || telemetry?.bridge !== "mounted-r3f-webgl"
      || telemetry?.changed !== "true"
      || telemetry?.patch !== expected.patch
      || telemetry?.materials !== (expected.expectedMaterials ?? expected.patch)
      || telemetry?.manifest !== manifest.manifestSha256
      || telemetry?.payload !== SCIENTIFIC_PAYLOAD_SHA256
      || telemetry?.payloadStable !== "true"
      || telemetry?.writeback !== "false"
      || telemetry?.productionPromotion !== "false"
      || telemetry?.formalProductPointer !== "v263"
      || telemetry?.assetManifestState !== "verified-v590-readonly"
      || telemetry?.lane !== "v593-signature"
      || telemetry?.preset !== expected.preset
      || telemetry?.mode !== expected.mode
      || telemetry?.fpsMedian < expected.minimumMedianFps
      || telemetry?.fpsSamples !== 120
      || telemetry?.gpuBytes <= 0
      || telemetry?.gpuBytes > expected.maximumGpuBytes
      || telemetry?.resourceBytes <= 0
      || telemetry?.drawCalls > expected.maximumDrawCalls
      || telemetry?.skyStatus !== "ready"
      || telemetry?.starStatus !== "ready"
      || telemetry?.constellationStatus !== "ready"
      || telemetry?.[expected.signatureField] !== (expected.expectedSignatureStatus ?? "implemented-code-gates-pending")
      || (expected.stellarProfile && telemetry?.stellarProfile !== expected.stellarProfile)
      || telemetry?.rotationW0Blocked !== "bennu,kleopatra"
      || telemetry?.cleanViewActive !== expected.cleanView
      || telemetry?.deploymentIds?.length !== 1
      || telemetry.deploymentIds[0] !== batch.identity.deploymentId
      || !deepOk
      || !sunOk
      || !earthOk
      || !saturnOk
    ) throw new Error(`v593-final-browser-stage-frame:${index}:${frame.matrixId}`);
    seen.add(frame.matrixId);
    const pngBytes = verifyRecord(frame.image, `png:${frame.matrixId}`, "89504e470d0a1a0a");
    verifyRecord(frame.rawImage, `jpeg:${frame.matrixId}`, "ffd8ff");
    const dimensions = pngDimensions(pngBytes);
    if (
      dimensions.width !== viewport.width
      || dimensions.height !== viewport.height
      || frame.image?.width !== viewport.width
      || frame.image?.height !== viewport.height
      || frame.image?.derivation?.decodedPixelsIdentical !== true
      || frame.image?.derivation?.nativePngClaim !== false
      || frame.image?.derivation?.pixelReconstructionClaim !== false
    ) throw new Error(`v593-final-browser-stage-image:${frame.matrixId}`);
    return Object.freeze({
      ...frame,
      telemetry: Object.freeze({
        ...telemetry,
        manifestSha256: telemetry.manifest,
        scientificPayloadSha256: telemetry.payload,
        scientificWriteback: telemetry.writeback,
        framePreset: telemetry.preset,
      }),
      image: Object.freeze({ ...frame.image, ...dimensions, format: "png" }),
    });
  });
  const payloads = new Set(frames.map((frame) => frame.telemetry.scientificPayloadSha256));
  const receipt = {
    version: "v593-final-sealed-browser-matrix-receipt-v1",
    generatedAt,
    status: "passed-sealed-standalone-42-frame-automatic-gates-human-signoff-pending",
    candidate: Object.freeze({
      route: "/local-shadow-v593",
      buildId: build.buildId,
      deploymentId: expectedDeploymentId,
      manifestSha256: manifest.manifestSha256,
      sourceManifestSha256: source.receiptSha256,
      formalProductPointer: "v263",
    }),
    build: Object.freeze({
      receipt: Object.freeze({ path: "dist/release/atlas-v593-standalone-build-resource.json", ...fileRecord(buildReceiptPath) }),
      buildId: build.buildId,
      distDir: build.distDir,
      deliveryTier: build.deliveryTier,
      sourceManifestSha256: build.candidateSourceManifestSha256,
    }),
    evidence: Object.freeze({
      ...evidenceRecord(stageBatchPath),
      version: batch.version,
      status: batch.status,
      batchId: batch.batchId,
    }),
    matrixPolicy: Object.freeze({
      totalFrames: STAGE_MATRIX.length,
      desktopFrames: STAGE_MATRIX.filter((frame) => frame.device === "desktop").length,
      mobileFrames: STAGE_MATRIX.filter((frame) => frame.device === "mobile").length,
      sameBuild: true,
      directViewportCapture: true,
      exactViewportRunner: batch.runner,
      physicalMobileDevice: false,
      aliasMappingExplicit: true,
      oldP4FrameSubstitution: false,
      decodedPixelPreservingPngDerivatives: true,
    }),
    frames: Object.freeze(frames),
    aggregate: Object.freeze({
      minimumMedianFps: Math.min(...frames.map((frame) => frame.telemetry.fpsMedian)),
      maximumGpuBytes: Math.max(...frames.map((frame) => frame.telemetry.gpuBytes)),
      maximumDrawCalls: Math.max(...frames.map((frame) => frame.telemetry.drawCalls)),
      scientificPayloadUniqueCount: payloads.size,
      consolePageWebglErrorWarningCount: batch.console.count,
      singleCanvas: frames.every((frame) => frame.telemetry.canvasActualCount === 1),
    }),
    console: batch.console,
    visualReview: Object.freeze({
      status: "current-identity-exact-ab-human-review-packet-required",
      runner: batch.runner,
      scientificPayloadSha256: SCIENTIFIC_PAYLOAD_SHA256,
      scientificPayloadWriteback: false,
    }),
    authority: Object.freeze({
      scientificPayloadSha256: SCIENTIFIC_PAYLOAD_SHA256,
      scientificPayloadWriteback: false,
      scientificAuthorityChanged: false,
      radiativeTransferGranted: false,
      measuredAuthorityGranted: false,
      gpuAuthorityGranted: false,
      productionReleaseAuthorized: false,
    }),
    humanVisualSignoff: false,
  };
  if (payloads.size !== 1) throw new Error("v593-final-browser-stage-payload-identity");
  receipt.receiptSha256 = canonicalSha(receipt);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    status: receipt.status,
    buildId: receipt.build.buildId,
    frames: receipt.frames.length,
    evidence: receipt.evidence,
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
}

const stageBatchArgument = argumentValue("--batch") ?? process.env.V593_FULL_MATRIX_BATCH ?? null;
if (stageBatchArgument) {
  await buildFromStageBatch(resolve(root, stageBatchArgument));
} else {

for (const path of [rawPath, buildReceiptPath, manifestPath, sourceManifestPath]) {
  if (!existsSync(path)) throw new Error(`v593-final-browser-input-missing:${path}`);
}
const raw = readJson(rawPath);
const build = readJson(buildReceiptPath);
const manifest = readJson(manifestPath);
const source = readJson(sourceManifestPath);
assertSealed(manifest, "manifestSha256", "manifest");
assertSealed(source, "receiptSha256", "source-manifest");

if (
  raw.version !== "v593-final-sealed-browser-matrix-raw-v1"
  || raw.runner !== "Codex-in-app-browser-visual-review+Playwright-CLI-exact-viewport"
  || raw.route !== "/local-shadow-v593"
  || raw.frames?.length !== MATRIX.length
  || raw.console?.count !== 0
  || raw.authority?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || raw.authority?.scientificPayloadWriteback !== false
  || build.status !== "passed"
  || build.deliveryTier !== "standalone-full"
  || build.buildId !== raw.build?.buildId
  || build.candidateSourceManifestSha256 !== source.receiptSha256
  || raw.build?.sourceManifestSha256 !== source.receiptSha256
  || raw.build?.manifestSha256 !== manifest.manifestSha256
  || raw.visualReview?.runner !== "Codex-in-app-browser"
  || raw.visualReview?.viewportOverrideStatus !== "blocked-runner-ignored-requested-dimensions"
  || raw.visualReview?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
  || raw.visualReview?.scientificPayloadWriteback !== false
) throw new Error("v593-final-browser-root-contract");
assertSafeRelativePath(raw.visualReview.image.path);
const visualReviewBytes = readFileSync(resolve(root, raw.visualReview.image.path));
if (
  visualReviewBytes.byteLength !== raw.visualReview.image.bytes
  || sha256(visualReviewBytes) !== raw.visualReview.image.sha256
) throw new Error("v593-final-browser-visual-review-image");

const seen = new Set();
const frames = raw.frames.map((frame, index) => {
  const expected = MATRIX[index];
  if (
    frame.matrixId !== expected.matrixId
    || frame.requestedPreset !== expected.preset
    || frame.actualPreset !== expected.preset
    || frame.requestedMode !== expected.mode
    || frame.actualMode !== expected.mode
    || frame.cleanView !== expected.cleanView
    || frame.device !== expected.device
    || seen.has(frame.matrixId)
  ) throw new Error(`v593-final-browser-frame-map:${index}:${frame.matrixId}`);
  seen.add(frame.matrixId);
  assertSafeRelativePath(frame.path);
  const absolutePath = resolve(root, frame.path);
  const bytes = readFileSync(absolutePath);
  const dimensions = pngDimensions(bytes);
  const expectedViewport = expected.device === "desktop"
    ? { width: 1440, height: 900, gpuMaximumBytes: 512 * 1024 * 1024 }
    : { width: 390, height: 844, gpuMaximumBytes: 192 * 1024 * 1024 };
  const telemetry = frame.telemetry;
  if (
    dimensions.width !== expectedViewport.width
    || dimensions.height !== expectedViewport.height
    || telemetry?.viewport?.width !== expectedViewport.width
    || telemetry?.viewport?.height !== expectedViewport.height
    || telemetry?.canvasActualCount !== 1
    || telemetry?.canvasDeclared !== 1
    || telemetry?.canvasReady !== "true"
    || telemetry?.manifestSha256 !== manifest.manifestSha256
    || telemetry?.scientificPayloadSha256 !== SCIENTIFIC_PAYLOAD_SHA256
    || telemetry?.payloadStable !== "true"
    || telemetry?.scientificWriteback !== "false"
    || telemetry?.productionPromotion !== "false"
    || telemetry?.lane !== "v593-signature"
    || telemetry?.framePreset !== expected.preset
    || telemetry?.mode !== expected.mode
    || telemetry?.fpsMedian < 45
    || telemetry?.gpuBytes > expectedViewport.gpuMaximumBytes
    || telemetry?.drawCalls > 90
    || telemetry?.rotationW0Blocked !== "bennu,kleopatra"
  ) throw new Error(`v593-final-browser-frame-gate:${frame.matrixId}`);
  return Object.freeze({
    ...frame,
    image: Object.freeze({ path: frame.path, bytes: bytes.byteLength, sha256: sha256(bytes), ...dimensions, format: "png" }),
  });
});

const payloads = new Set(frames.map((frame) => frame.telemetry.scientificPayloadSha256));
const expectedDeploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
const receipt = {
  version: "v593-final-sealed-browser-matrix-receipt-v1",
  generatedAt,
  status: "passed-sealed-standalone-42-frame-automatic-gates-human-signoff-pending",
  candidate: Object.freeze({
    route: "/local-shadow-v593",
    buildId: build.buildId,
    deploymentId: expectedDeploymentId,
    manifestSha256: manifest.manifestSha256,
    sourceManifestSha256: source.receiptSha256,
    formalProductPointer: "v263",
  }),
  build: Object.freeze({
    receipt: Object.freeze({ path: "dist/release/atlas-v593-standalone-build-resource.json", ...fileRecord(buildReceiptPath) }),
    buildId: build.buildId,
    distDir: build.distDir,
    deliveryTier: build.deliveryTier,
    sourceManifestSha256: build.candidateSourceManifestSha256,
  }),
  matrixPolicy: Object.freeze({
    totalFrames: MATRIX.length,
    desktopFrames: MATRIX.filter((frame) => frame.device === "desktop").length,
    mobileFrames: MATRIX.filter((frame) => frame.device === "mobile").length,
    sameBuild: true,
    directViewportCapture: true,
    exactViewportRunner: "Playwright CLI",
    visualReviewRunner: "Codex-in-app-browser",
    inAppViewportOverrideStatus: "blocked-runner-ignored-requested-dimensions",
    physicalMobileDevice: false,
    aliasMappingExplicit: true,
    oldP4FrameSubstitution: false,
  }),
  frames: Object.freeze(frames),
  aggregate: Object.freeze({
    minimumMedianFps: Math.min(...frames.map((frame) => frame.telemetry.fpsMedian)),
    maximumGpuBytes: Math.max(...frames.map((frame) => frame.telemetry.gpuBytes)),
    maximumDrawCalls: Math.max(...frames.map((frame) => frame.telemetry.drawCalls)),
    scientificPayloadUniqueCount: payloads.size,
    consolePageWebglErrorWarningCount: raw.console.count,
    singleCanvas: frames.every((frame) => frame.telemetry.canvasActualCount === 1),
  }),
  console: raw.console,
  visualReview: raw.visualReview,
  authority: Object.freeze({
    scientificPayloadSha256: SCIENTIFIC_PAYLOAD_SHA256,
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    radiativeTransferGranted: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    productionReleaseAuthorized: false,
  }),
  humanVisualSignoff: false,
};
if (payloads.size !== 1) throw new Error("v593-final-browser-payload-identity");
receipt.receiptSha256 = canonicalSha(receipt);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  status: receipt.status,
  buildId: receipt.build.buildId,
  frames: receipt.frames.length,
  minimumMedianFps: receipt.aggregate.minimumMedianFps,
  maximumGpuBytes: receipt.aggregate.maximumGpuBytes,
  maximumDrawCalls: receipt.aggregate.maximumDrawCalls,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
}
