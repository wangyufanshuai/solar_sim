import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { LITE_MATRIX_V593 as STAGE_MATRIX } from "../tmp/v593-lite-browser-collector.mjs";

const root = resolve(process.cwd());
const cliOutputPath = resolve(root, "tmp/v593-lite-matrix-playwright-output.txt");
const outputPath = resolve(root, argumentValue("--output") ?? process.env.V593_LITE_MATRIX_OUTPUT ?? "docs/release/v593/lite-browser-matrix-v593.json");
const sourcePath = resolve(root, "docs/release/v593/source-manifest-v593.json");
const manifestPath = resolve(root, "public/data/final-art-direction-v593/manifest.json");
const buildPath = resolve(root, "dist/release/atlas-v593-lite-build-resource.json");
const scientificPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
function pngDimensions(bytes) {
  if (bytes.byteLength < 24 || bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error("v593-lite-png-required");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
function assert(condition, message) { if (!condition) throw new Error(message); }
function argumentValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function verifySeal(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), `v593-lite-seal:${label}`);
}
function safeRecord(record, label, magic = null) {
  assert(record && typeof record.path === "string" && record.path.length > 0 && !isAbsolute(record.path), `v593-lite-stage-path:${label}`);
  const path = resolve(root, record.path);
  const workspacePath = relative(root, path);
  assert(workspacePath !== "" && workspacePath !== ".." && !workspacePath.startsWith(`..${sep}`) && !isAbsolute(workspacePath), `v593-lite-stage-path:${label}`);
  assert(existsSync(path), `v593-lite-stage-missing:${label}:${record.path}`);
  const bytes = readFileSync(path);
  assert(bytes.byteLength === record.bytes && sha256(bytes) === record.sha256, `v593-lite-stage-drift:${label}:${record.path}`);
  if (magic) assert(bytes.toString("hex", 0, magic.length / 2) === magic, `v593-lite-stage-format:${label}:${record.path}`);
  return bytes;
}
function stageEvidenceRecord(path) {
  const bytes = readFileSync(path);
  return { path: relative(root, path).replaceAll("\\", "/"), bytes: bytes.byteLength, sha256: sha256(bytes) };
}
async function buildFromStageBatch(stageBatchPath) {
  const workspacePath = relative(root, stageBatchPath);
  assert(workspacePath !== "" && workspacePath !== ".." && !workspacePath.startsWith(`..${sep}`) && !isAbsolute(workspacePath) && resolve(root, workspacePath) === stageBatchPath, "v593-lite-stage-boundary");
  const batch = readJson(stageBatchPath);
  const source = readJson(sourcePath);
  const manifest = readJson(manifestPath);
  const build = readJson(buildPath);
  const standaloneBuild = readJson(resolve(root, "dist/release/atlas-v593-standalone-build-resource.json"));
  const expectedDeploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
  verifySeal(source, "receiptSha256", "source");
  verifySeal(manifest, "manifestSha256", "manifest");
  for (const entry of source.files ?? []) safeRecord(entry, `source:${entry.path}`);
  assert(
    batch.version === "v593-lite-browser-stage-v2"
      && batch.status === "staging-lite-matrix-audit-passed-not-promoted"
      && batch.route === "/local-shadow-v593"
      && batch.expectedFrameCount === STAGE_MATRIX.length
      && batch.frames?.length === STAGE_MATRIX.length
      && batch.failures?.length === 0
      && batch.console?.status === "passed-zero-warning-error"
      && batch.console?.count === 0
      && batch.capturePolicy?.currentSharedBuildOnly === true
      && batch.capturePolicy?.noHistoricalSubstitution === true
      && batch.capturePolicy?.fallbackIsAllowedLitePath === true
      && batch.capturePolicy?.full3AQualification === false
      && batch.capturePolicy?.nativePngClaim === false
      && batch.capturePolicy?.pixelReconstructionClaim === false
      && batch.imageAudit?.status === "passed-exact-viewport-no-clip-jpeg-and-png-derivatives"
      && batch.imageAudit?.count === STAGE_MATRIX.length
      && batch.imageAudit?.allExactRequestedViewport === true
      && batch.imageAudit?.allDecodedPixelsIdentical === true
      && batch.imageAudit?.allPagePixelCoverage === true
      && batch.liteMatrixAudit?.status === "passed-staging-integrity-not-promoted"
      && batch.liteMatrixAudit?.errors?.length === 0
      && batch.liteMatrixAudit?.frameCount === STAGE_MATRIX.length
      && batch.liteMatrixAudit?.fallbackFrameCount === STAGE_MATRIX.length
      && batch.liteMatrixAudit?.scientificPayloadUniqueCount === 1
      && batch.liteMatrixAudit?.sourceManifestUniqueCount === 1
      && batch.liteMatrixAudit?.candidateManifestUniqueCount === 1
      && batch.liteMatrixAudit?.buildIdUniqueCount === 1
      && batch.liteMatrixAudit?.deploymentIdUniqueCount === 1
      && batch.liteMatrixAudit?.consoleCount === 0,
    "v593-lite-stage-root-contract",
  );
  assert(
    build.status === "passed"
      && standaloneBuild.status === "passed"
      && build.deliveryTier === "vercel-lite"
      && standaloneBuild.deliveryTier === "standalone-full"
      && build.buildId === standaloneBuild.buildId
      && build.deploymentId === expectedDeploymentId
      && standaloneBuild.deploymentId === expectedDeploymentId
      && batch.identity?.buildId === build.buildId
      && batch.identity?.sourceManifestSha256 === source.receiptSha256
      && batch.identity?.candidateManifestSha256 === manifest.manifestSha256
      && batch.identity?.scientificPayloadSha256 === scientificPayloadSha256
      && build.candidateSourceManifestSha256 === source.receiptSha256
      && standaloneBuild.candidateSourceManifestSha256 === source.receiptSha256
      && typeof batch.identity?.deploymentId === "string"
      && batch.identity.deploymentId === expectedDeploymentId,
    "v593-lite-stage-identity",
  );
  const buildEvidence = Object.values(batch.buildEvidence ?? {});
  assert(buildEvidence.length === 2, "v593-lite-stage-build-evidence-count");
  for (const evidence of buildEvidence) {
    const bytes = safeRecord(evidence, `build:${evidence.deliveryTier}`);
    const receipt = JSON.parse(bytes.toString("utf8"));
    assert(
      receipt.status === "passed"
        && receipt.buildId === build.buildId
        && receipt.deploymentId === expectedDeploymentId
        && receipt.candidateSourceManifestSha256 === source.receiptSha256
        && ["standalone-full", "vercel-lite"].includes(receipt.deliveryTier),
      `v593-lite-stage-build-evidence:${evidence.path}`,
    );
  }
  const seen = new Set();
  const frames = batch.frames.map((frame, index) => {
    const expected = STAGE_MATRIX[index];
    const telemetry = frame.telemetry;
    const width = expected.device === "mobile" ? 390 : 1440;
    const height = expected.device === "mobile" ? 844 : 900;
    const deepOk = !expected.deepCounts || (
      telemetry?.sphere === expected.deepCounts.sphere
      && telemetry?.starfield === expected.deepCounts.starfield
      && telemetry?.nebula === 0
      && telemetry?.observation === 0
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
    assert(
      frame.index === index
        && frame.id === expected.id
        && !seen.has(frame.id)
        && frame.requestedPreset === expected.preset
        && frame.actualPreset === expected.preset
        && frame.requestedMode === expected.mode
        && frame.actualMode === expected.mode
        && frame.device === expected.device
        && frame.requestedViewport?.width === width
        && frame.requestedViewport?.height === height
        && telemetry?.viewport?.width === width
        && telemetry?.viewport?.height === height
        && telemetry?.canvasActualCount === 1
        && telemetry?.canvasDeclared === 1
        && telemetry?.canvasReady === "true"
        && telemetry?.singleCanvas === "true"
        && telemetry?.focusId === expected.focusId
        && telemetry?.bridge === "mounted-r3f-webgl"
        && telemetry?.changed === "true"
        && telemetry?.patch === expected.patch
        && telemetry?.materials === expected.patch
        && telemetry?.manifest === manifest.manifestSha256
        && telemetry?.payload === scientificPayloadSha256
        && telemetry?.payloadStable === "true"
        && telemetry?.writeback === "false"
        && telemetry?.productionPromotion === "false"
        && telemetry?.formalProductPointer === "v263"
        && telemetry?.assetManifestState === "verified-v590-readonly"
        && telemetry?.lane === "v593-signature"
        && telemetry?.preset === expected.preset
        && telemetry?.mode === expected.mode
        && telemetry?.fpsMedian >= expected.minimumMedianFps
        && telemetry?.fpsSamples === 120
        && telemetry?.drawCalls <= expected.maximumDrawCalls
        && telemetry?.gpuBytes > 0
        && telemetry?.gpuBytes <= expected.maximumGpuBytes
        && telemetry?.resourceBytes > 0
        && telemetry?.resourceSource === "fallback"
        && telemetry?.skyStatus === "ready"
        && telemetry?.starStatus === "ready"
        && telemetry?.constellationStatus === "ready"
        && telemetry?.[expected.signatureField] === "implemented-code-gates-pending"
        && telemetry?.rotationW0Blocked === "bennu,kleopatra"
        && telemetry?.deploymentIds?.length === 1
        && telemetry.deploymentIds[0] === batch.identity.deploymentId
        && deepOk
        && earthOk
        && saturnOk,
      `v593-lite-stage-frame:${index}:${frame.id}`,
    );
    seen.add(frame.id);
    const pngBytes = safeRecord(frame.image, `png:${frame.id}`, "89504e470d0a1a0a");
    safeRecord(frame.rawImage, `jpeg:${frame.id}`, "ffd8ff");
    const dimensions = pngDimensions(pngBytes);
    assert(
      dimensions.width === width
        && dimensions.height === height
        && frame.image?.width === width
        && frame.image?.height === height
        && frame.image?.derivation?.decodedPixelsIdentical === true
        && frame.image?.derivation?.nativePngClaim === false
        && frame.image?.derivation?.pixelReconstructionClaim === false,
      `v593-lite-stage-image:${frame.id}`,
    );
    return {
      id: frame.id,
      requestedPreset: frame.requestedPreset,
      actualPreset: frame.actualPreset,
      mode: frame.actualMode,
      device: frame.device,
      path: frame.image.path,
      canvasCount: telemetry.canvasActualCount,
      canvasDeclared: telemetry.canvasDeclared,
      canvasReady: telemetry.canvasReady === "true",
      drawCalls: telemetry.drawCalls,
      fpsMedian: telemetry.fpsMedian,
      fpsMinimum: telemetry.fpsMinimum,
      fpsP10: telemetry.fpsP10,
      framePreset: telemetry.preset,
      gpuBytes: telemetry.gpuBytes,
      resourceBytes: telemetry.resourceBytes,
      manifestSha256: telemetry.manifest,
      payloadSha256: telemetry.payload,
      payloadStable: telemetry.payloadStable === "true",
      resourceSource: telemetry.resourceSource,
      scientificWriteback: telemetry.writeback !== "false",
      deploymentId: batch.identity.deploymentId,
      image: { ...frame.image, ...dimensions, format: "png" },
    };
  });
  const payloads = new Set(frames.map((frame) => frame.payloadSha256));
  const unsigned = {
    version: "v593-lite-browser-matrix-v1",
    generatedAt: "2026-08-23T00:00:00.000Z",
    status: "passed-8-frame-lite-automatic-gates-human-signoff-pending",
    runner: batch.runner,
    route: "/local-shadow-v593",
    build: { buildId: build.buildId, deploymentId: expectedDeploymentId, sourceManifestSha256: source.receiptSha256, manifestSha256: manifest.manifestSha256, deliveryTier: "vercel-lite", physicalMobileDevice: false },
    evidence: { ...stageEvidenceRecord(stageBatchPath), version: batch.version, status: batch.status, batchId: batch.batchId },
    frames,
    aggregate: {
      totalFrames: frames.length,
      desktopFrames: frames.filter((frame) => frame.device === "desktop").length,
      mobileFrames: frames.filter((frame) => frame.device === "mobile").length,
      minimumMedianFps: Math.min(...frames.map((frame) => frame.fpsMedian)),
      maximumGpuBytes: Math.max(...frames.map((frame) => frame.gpuBytes)),
      maximumDrawCalls: Math.max(...frames.map((frame) => frame.drawCalls)),
      scientificPayloadUniqueCount: payloads.size,
      singleCanvas: frames.every((frame) => frame.canvasCount === 1),
    },
    console: { count: 0, entries: [] },
    authority: { scientificPayloadSha256, scientificPayloadWriteback: false, scientificAuthorityChanged: false, radiativeTransferGranted: false, measuredAuthorityGranted: false, gpuAuthorityGranted: false, productionReleaseAuthorized: false },
    disclosure: { browserRequestedFormat: "viewport-screenshot-without-clip", browserReturnedContainer: "jpeg", storedContainer: "decoded-pixel-preserving-png-derivative", geometryOrPixelRetouch: false, fallbackIsAllowedLitePath: true, full3AQualification: false, materialAdmissionWaited: true, runner: batch.runner },
  };
  assert(payloads.size === 1, "v593-lite-stage-payload-identity");
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(`${outputPath}.part`, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await rename(`${outputPath}.part`, outputPath);
  console.log(JSON.stringify({ status: receipt.status, runner: receipt.runner, frames: receipt.frames.length, evidence: receipt.evidence, receiptSha256: receipt.receiptSha256 }, null, 2));
}

const stageBatchArgument = argumentValue("--batch") ?? process.env.V593_LITE_MATRIX_BATCH ?? null;
if (stageBatchArgument) {
  await buildFromStageBatch(resolve(root, stageBatchArgument));
} else {
const outputText = readFileSync(cliOutputPath, "utf8");
const match = /### Result\r?\n/.exec(outputText);
assert(match, "v593-lite-cli-result-missing");
const resultLine = outputText.slice(match.index + match[0].length).split(/\r?\n/, 1)[0];
const raw = JSON.parse(JSON.parse(resultLine));
const source = readJson(sourcePath);
const manifest = readJson(manifestPath);
const build = readJson(buildPath);
const expectedDeploymentId = `v593-${source.receiptSha256.slice(0, 12)}-${manifest.manifestSha256.slice(0, 12)}`;
assert(raw.version === "v593-lite-matrix-raw-playwright-v1" && raw.frames?.length === 8, "v593-lite-raw-contract");
assert(raw.consoleErrors?.length === 0 && raw.pageErrors?.length === 0, "v593-lite-browser-errors");
assert(build.status === "passed" && build.deliveryTier === "vercel-lite" && build.candidateSourceManifestSha256 === source.receiptSha256, "v593-lite-build-contract");

const frames = raw.frames.map((rawFrame) => {
  const path = rawFrame.imagePath.replace(`${root.replaceAll("\\", "/")}/`, "").replaceAll("\\", "/");
  const absolute = resolve(root, path);
  assert(existsSync(absolute), `v593-lite-image-missing:${path}`);
  const bytes = readFileSync(absolute);
  const dimensions = pngDimensions(bytes);
  const state = rawFrame.state;
  assert(dimensions.width === rawFrame.width && dimensions.height === rawFrame.height, `v593-lite-image-size:${rawFrame.id}`);
  assert(state.framePreset === rawFrame.preset && state.mode === rawFrame.mode, `v593-lite-frame-preset:${rawFrame.id}`);
  assert(state.canvasCount === 1 && state.canvasReady && state.singleCanvas, `v593-lite-canvas:${rawFrame.id}`);
  assert(state.manifestSha256 === manifest.manifestSha256 && state.payloadSha256 === scientificPayloadSha256 && state.payloadStable && !state.scientificWriteback && state.productionPromotion === "false", `v593-lite-payload:${rawFrame.id}`);
  assert(state.fpsMedian >= 45 && state.drawCalls <= 90 && state.gpuBytes <= (rawFrame.device === "mobile" ? 192 : 512) * 1024 * 1024, `v593-lite-budget:${rawFrame.id}`);
  assert(state.resourceSource === "fallback", `v593-lite-source:${rawFrame.id}`);
  return {
    id: rawFrame.id,
    requestedPreset: rawFrame.preset,
    actualPreset: state.framePreset,
    mode: rawFrame.mode,
    device: rawFrame.device,
    path,
    canvasCount: state.canvasCount,
    canvasDeclared: state.canvasCount,
    canvasReady: state.canvasReady,
    drawCalls: state.drawCalls,
    fpsMedian: state.fpsMedian,
    fpsMinimum: state.fpsMinimum,
    fpsP10: state.fpsP10,
    framePreset: state.framePreset,
    gpuBytes: state.gpuBytes,
    resourceBytes: state.resourceBytes,
    manifestSha256: state.manifestSha256,
    payloadSha256: state.payloadSha256,
    payloadStable: state.payloadStable,
    resourceSource: state.resourceSource,
    scientificWriteback: state.scientificWriteback,
    image: { path, bytes: bytes.byteLength, sha256: sha256(bytes), width: dimensions.width, height: dimensions.height, format: "png" },
  };
});
const payloads = new Set(frames.map((frame) => frame.payloadSha256));
const unsigned = {
  version: "v593-lite-browser-matrix-v1",
  generatedAt: "2026-08-23T00:00:00.000Z",
  status: "passed-8-frame-lite-automatic-gates-human-signoff-pending",
  runner: raw.runner,
  route: "/local-shadow-v593",
  build: { buildId: build.buildId, deploymentId: expectedDeploymentId, sourceManifestSha256: source.receiptSha256, manifestSha256: manifest.manifestSha256, deliveryTier: "vercel-lite", physicalMobileDevice: false },
  frames,
  aggregate: {
    totalFrames: frames.length,
    desktopFrames: frames.filter((frame) => frame.device === "desktop").length,
    mobileFrames: frames.filter((frame) => frame.device === "mobile").length,
    minimumMedianFps: Math.min(...frames.map((frame) => frame.fpsMedian)),
    maximumGpuBytes: Math.max(...frames.map((frame) => frame.gpuBytes)),
    maximumDrawCalls: Math.max(...frames.map((frame) => frame.drawCalls)),
    scientificPayloadUniqueCount: payloads.size,
    singleCanvas: frames.every((frame) => frame.canvasCount === 1),
  },
  console: { count: 0, entries: [] },
  authority: { scientificPayloadSha256, scientificPayloadWriteback: false, scientificAuthorityChanged: false, radiativeTransferGranted: false, measuredAuthorityGranted: false, gpuAuthorityGranted: false, productionReleaseAuthorized: false },
  disclosure: { browserRequestedFormat: "png", browserReturnedContainer: "png", storedContainer: "png", geometryOrPixelRetouch: false, fallbackIsAllowedLitePath: true, full3AQualification: false, materialAdmissionWaited: true, runner: raw.runner },
};
assert(payloads.size === 1, "v593-lite-payload-identity");
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(`${outputPath}.part`, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
await rename(`${outputPath}.part`, outputPath);
console.log(JSON.stringify({ status: receipt.status, runner: receipt.runner, frames: receipt.frames.length, minimumMedianFps: receipt.aggregate.minimumMedianFps, maximumGpuBytes: receipt.aggregate.maximumGpuBytes, maximumDrawCalls: receipt.aggregate.maximumDrawCalls, scientificWriteback: receipt.authority.scientificPayloadWriteback, receiptSha256: receipt.receiptSha256 }, null, 2));
}
