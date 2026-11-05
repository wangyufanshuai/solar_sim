import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd());
const generatedAt = "2026-08-22T20:00:00.000Z";
const evidenceRoot = resolve(root, "docs/release/v593/screenshots/p4-deep-sky-code-gates");
const telemetryPath = resolve(evidenceRoot, "browser-telemetry-current-dev-v593.json");
const receiptPath = resolve(root, "docs/release/v593/p4-deep-sky-browser-code-gate-v593.json");
const p3ReceiptPath = resolve(root, "docs/release/v593/p3-earth-browser-code-gate-v593.json");
const bridgePath = resolve(root, "app/components/SignatureArtDirectionBridgeV593.tsx");
const shellPath = resolve(root, "app/components/FinalArtObservatoryShellV593.tsx");
const hostPath = resolve(root, "app/components/FinalArtCanvasHostV593.tsx");
const testPath = resolve(root, "app/lib/finalArtDirectionV593.test.ts");
const builderPath = resolve(root, "scripts/build-v593-p4-deep-sky-browser-code-gate.mjs");
const scientificPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

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

function relativePath(path) {
  return relative(root, path).replaceAll("\\", "/");
}

async function fileRecord(path) {
  const bytes = await readFile(path);
  return Object.freeze({ path: relativePath(path), bytes: bytes.byteLength, sha256: sha256(bytes) });
}

async function imageRecord(path) {
  const [bytes, metadata] = await Promise.all([readFile(path), sharp(path).metadata()]);
  invariant(metadata.width === 1_440 && metadata.height === 900, `v593-p4-image-shape:${relativePath(path)}:${metadata.width}x${metadata.height}`);
  return Object.freeze({
    path: relativePath(path),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  });
}

async function atomicCrop(sourcePath, outputPath, crop) {
  const partialPath = `${outputPath}.part.png`;
  await mkdir(dirname(outputPath), { recursive: true });
  await rm(partialPath, { force: true });
  await sharp(sourcePath).extract(crop).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(partialPath);
  await rename(partialPath, outputPath);
}

async function rawRgb(path) {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function luminance(data, width, channels, x, y) {
  const offset = (y * width + x) * channels;
  return data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
}

async function compareImages(baselinePath, signaturePath) {
  const [baseline, signature] = await Promise.all([rawRgb(baselinePath), rawRgb(signaturePath)]);
  invariant(
    baseline.width === signature.width
      && baseline.height === signature.height
      && baseline.channels === signature.channels,
    "v593-p4-ab-shape",
  );
  let absolute = 0;
  let changed = 0;
  let maximum = 0;
  for (let index = 0; index < baseline.data.length; index += 1) {
    const difference = Math.abs(baseline.data[index] - signature.data[index]);
    absolute += difference;
    if (difference > 2) changed += 1;
    maximum = Math.max(maximum, difference);
  }
  return Object.freeze({
    meanAbsoluteChannelDiff255: Number((absolute / baseline.data.length).toFixed(6)),
    changedChannelFractionGt2: Number((changed / baseline.data.length).toFixed(8)),
    maximumChannelDiff255: maximum,
  });
}

async function cropToneMetrics(path) {
  const { data, channels } = await rawRgb(path);
  const values = [];
  let clippedBlack = 0;
  let clippedWhite = 0;
  for (let offset = 0; offset < data.length; offset += channels) {
    const value = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
    values.push(value);
    if (value <= 1) clippedBlack += 1;
    if (value >= 254) clippedWhite += 1;
  }
  values.sort((left, right) => left - right);
  const percentile = (fraction) => values[Math.min(values.length - 1, Math.floor(values.length * fraction))];
  return Object.freeze({
    p01: Number(percentile(0.01).toFixed(6)),
    p50: Number(percentile(0.5).toFixed(6)),
    p99: Number(percentile(0.99).toFixed(6)),
    clippedBlackFraction: Number((clippedBlack / values.length).toFixed(8)),
    clippedWhiteFraction: Number((clippedWhite / values.length).toFixed(8)),
  });
}

async function axisEdgeGradient(path, segments) {
  const { data, width, height, channels } = await rawRgb(path);
  let total = 0;
  let count = 0;
  for (const segment of segments) {
    if (segment.axis === "x") {
      invariant(segment.coordinate > 0 && segment.coordinate < width - 1, "v593-p4-edge-x-range");
      for (let y = segment.from; y < segment.to; y += 1) {
        total += Math.abs(
          luminance(data, width, channels, segment.coordinate + 1, y)
          - luminance(data, width, channels, segment.coordinate - 1, y),
        ) * 0.5;
        count += 1;
      }
    } else {
      invariant(segment.coordinate > 0 && segment.coordinate < height - 1, "v593-p4-edge-y-range");
      for (let x = segment.from; x < segment.to; x += 1) {
        total += Math.abs(
          luminance(data, width, channels, x, segment.coordinate + 1)
          - luminance(data, width, channels, x, segment.coordinate - 1),
        ) * 0.5;
        count += 1;
      }
    }
  }
  return Number((total / Math.max(1, count)).toFixed(6));
}

const telemetryBytes = await readFile(telemetryPath);
const telemetry = JSON.parse(telemetryBytes.toString("utf8"));
invariant(telemetry.version === "v593-p4-deep-sky-browser-telemetry-v1", "v593-p4-telemetry-version");
invariant(telemetry.runner === "Codex-in-app-browser", "v593-p4-browser-runner");
invariant(telemetry.viewport?.width === 1_440 && telemetry.viewport?.height === 900, "v593-p4-viewport");
invariant(telemetry.console?.count === 0 && telemetry.console?.entries?.length === 0, "v593-p4-console-webgl-errors");
invariant(telemetry.scientificPayloadSha256 === scientificPayloadSha256, "v593-p4-telemetry-payload");
invariant(telemetry.scientificPayloadWriteback === false, "v593-p4-telemetry-writeback");

const requiredFrames = new Map([
  ["galactic-core-science", { sphere: 1, starfield: 2, nebula: 0, observation: 0 }],
  ["galactic-core-cinematic", { sphere: 1, starfield: 2, nebula: 0, observation: 0 }],
  ["orion-cinematic", { sphere: 1, starfield: 2, nebula: 0, observation: 0 }],
  ["heart-nebula-cinematic", { sphere: 1, starfield: 2, nebula: 4, observation: 0 }],
  ["andromeda-cinematic", { sphere: 1, starfield: 2, nebula: 0, observation: 3 }],
  ["pleiades-cinematic", { sphere: 1, starfield: 2, nebula: 0, observation: 3 }],
]);
invariant(telemetry.frames?.length === requiredFrames.size, "v593-p4-frame-count");
invariant(new Set(telemetry.frames.map((frame) => frame.preset)).size === requiredFrames.size, "v593-p4-frame-identity");

const captures = [];
for (const frame of telemetry.frames) {
  const expected = requiredFrames.get(frame.preset);
  invariant(expected, `v593-p4-unexpected-frame:${frame.preset}`);
  invariant(frame.baseline?.lane === "v592-same-build-baseline", `v593-p4-baseline-lane:${frame.preset}`);
  invariant(frame.baseline?.patchCount === 0 && frame.baseline?.materialCount === 0, `v593-p4-baseline-patches:${frame.preset}`);
  invariant(frame.baseline?.webglChanged === "false", `v593-p4-baseline-webgl:${frame.preset}`);
  invariant(frame.signature?.lane === "v593-signature", `v593-p4-signature-lane:${frame.preset}`);
  invariant(frame.signature?.deepSky === "implemented-code-gates-pending", `v593-p4-deep-sky-state:${frame.preset}`);
  invariant(frame.signature?.sphere === expected.sphere, `v593-p4-sphere:${frame.preset}`);
  invariant(frame.signature?.starfield === expected.starfield, `v593-p4-starfield:${frame.preset}`);
  invariant(frame.signature?.nebula === expected.nebula, `v593-p4-nebula:${frame.preset}`);
  invariant(frame.signature?.observation === expected.observation, `v593-p4-observation:${frame.preset}`);
  invariant(frame.signature?.patchCount === expected.sphere + expected.starfield + expected.nebula + expected.observation, `v593-p4-patch-total:${frame.preset}`);
  invariant(frame.signature?.webglChanged === "true", `v593-p4-webgl-output:${frame.preset}`);
  invariant(frame.signature?.canvasCount === 1, `v593-p4-single-canvas:${frame.preset}`);
  invariant(frame.signature?.payload === scientificPayloadSha256 && frame.signature?.payloadStable === "true", `v593-p4-payload:${frame.preset}`);
  invariant(frame.signature?.writeback === "false", `v593-p4-writeback:${frame.preset}`);
  invariant(frame.signature?.fpsMedian >= 45, `v593-p4-fps:${frame.preset}`);
  invariant(frame.signature?.gpuBytes <= 512 * 1024 * 1024, `v593-p4-gpu:${frame.preset}`);
  invariant(frame.signature?.drawCalls <= 90, `v593-p4-draw-calls:${frame.preset}`);

  const baselinePath = resolve(root, frame.baselinePath);
  const signaturePath = resolve(root, frame.signaturePath);
  captures.push(Object.freeze({
    id: frame.preset,
    framePolicy: telemetry.framePolicy,
    baselineTelemetry: frame.baseline,
    signatureTelemetry: frame.signature,
    baseline: await imageRecord(baselinePath),
    signature: await imageRecord(signaturePath),
    comparison: await compareImages(baselinePath, signaturePath),
  }));
}

const cropDefinitions = [
  { id: "galactic-dust-and-psf", frameId: "galactic-core-cinematic", crop: { left: 170, top: 80, width: 720, height: 700 } },
  { id: "orion-anchor-psf", frameId: "orion-cinematic", crop: { left: 580, top: 170, width: 420, height: 590 } },
  { id: "heart-nebula-edge", frameId: "heart-nebula-cinematic", crop: { left: 290, top: 170, width: 640, height: 540 } },
  { id: "andromeda-plane-edge", frameId: "andromeda-cinematic", crop: { left: 270, top: 140, width: 660, height: 610 } },
  { id: "pleiades-plane-edge", frameId: "pleiades-cinematic", crop: { left: 240, top: 120, width: 700, height: 640 } },
];

const crops = [];
for (const definition of cropDefinitions) {
  const frame = telemetry.frames.find((entry) => entry.preset === definition.frameId);
  invariant(frame, `v593-p4-crop-frame:${definition.frameId}`);
  const baselineSource = resolve(root, frame.baselinePath);
  const signatureSource = resolve(root, frame.signaturePath);
  const baselinePath = resolve(evidenceRoot, `${definition.frameId}-v592-baseline-current-dev-${definition.id}-100pct.png`);
  const signaturePath = resolve(evidenceRoot, `${definition.frameId}-v593-signature-current-dev-${definition.id}-100pct.png`);
  await atomicCrop(baselineSource, baselinePath, definition.crop);
  await atomicCrop(signatureSource, signaturePath, definition.crop);
  const [baselineRecord, signatureRecord, baselineTone, signatureTone] = await Promise.all([
    fileRecord(baselinePath),
    fileRecord(signaturePath),
    cropToneMetrics(baselinePath),
    cropToneMetrics(signaturePath),
  ]);
  crops.push(Object.freeze({
    ...definition,
    baseline: Object.freeze({ image: { ...baselineRecord, ...definition.crop, format: "png" }, tone: baselineTone }),
    signature: Object.freeze({ image: { ...signatureRecord, ...definition.crop, format: "png" }, tone: signatureTone }),
  }));
}

const pleiadesFrame = telemetry.frames.find((frame) => frame.preset === "pleiades-cinematic");
const pleiadesSegments = [
  { axis: "x", coordinate: 304, from: 205, to: 680 },
  { axis: "x", coordinate: 830, from: 205, to: 680 },
  { axis: "y", coordinate: 184, from: 325, to: 810 },
  { axis: "y", coordinate: 701, from: 325, to: 810 },
];
const [pleiadesBaselineEdge, pleiadesSignatureEdge] = await Promise.all([
  axisEdgeGradient(resolve(root, pleiadesFrame.baselinePath), pleiadesSegments),
  axisEdgeGradient(resolve(root, pleiadesFrame.signaturePath), pleiadesSegments),
]);
const pleiadesRectangleEdgeReduction = 1 - pleiadesSignatureEdge / pleiadesBaselineEdge;
invariant(pleiadesRectangleEdgeReduction >= 0.25, `v593-p4-pleiades-plane-edge:${pleiadesRectangleEdgeReduction}`);

const [bridgeText, shellText] = await Promise.all([
  readFile(bridgePath, "utf8"),
  readFile(shellPath, "utf8"),
]);
for (const token of [
  "DEEP_SKY_SPHERE_FRAGMENT_V593",
  "DEEP_FIELD_VERTEX_V593",
  "#include <common>",
  "DEEP_FIELD_FRAGMENT_V593",
  "uSliceIndexV593",
  "source-bound-seam-safe-alpha-aware-no-coordinate-mutation",
  "alpha-aware-nine-tap-black-level-integrated-reconstruction",
  "gaia-flux-preserving-moffat-airy-no-random-twinkle",
  "gaia-flux-preserving-bounded-airy-spikes-no-random-twinkle",
  "atlasV593DeepSkyObservationPatchCount",
]) invariant(bridgeText.includes(token), `v593-p4-bridge-token:${token}`);
for (const token of [
  '"galactic-core-science"',
  '"galactic-core-cinematic"',
  '"orion-cinematic"',
  '"heart-nebula-cinematic"',
  '"andromeda-cinematic"',
  '"pleiades-cinematic"',
  "data-atlas-v592-nebula-marker",
  "data-atlas-v592-deep-space-marker",
]) invariant(shellText.includes(token), `v593-p4-shell-token:${token}`);

const minimumMedianFps = Math.min(...telemetry.frames.map((frame) => frame.signature.fpsMedian));
const maximumGpuBytes = Math.max(...telemetry.frames.map((frame) => frame.signature.gpuBytes));
const maximumDrawCalls = Math.max(...telemetry.frames.map((frame) => frame.signature.drawCalls));
const receipt = {
  version: "v593-p4-deep-sky-browser-code-gate-v1",
  generatedAt,
  status: "passed-current-dev-deep-sky-code-and-visual-gates-sealed-build-and-human-signoff-pending",
  candidate: {
    route: "/local-shadow-v593",
    formalProductPointer: "v263",
    additiveOnly: true,
  },
  scope: {
    signaturePassesCodeImplemented: 6,
    signaturePassesComplete: 0,
    implemented: ["sun", "earth", "jupiter", "saturn", "stellar-archetypes", "deep-sky"],
    pending: [],
    finalGoldenFrameMatrixComplete: false,
    sealedBuildEvidence: false,
    humanVisualSignoff: false,
  },
  sourceMaterialCorrectness: {
    bridge: await fileRecord(bridgePath),
    shell: await fileRecord(shellPath),
    canvasHost: await fileRecord(hostPath),
    focusedTest: await fileRecord(testPath),
    builder: await fileRecord(builderPath),
    p3HistoricalPreDeepSkyEvidence: await fileRecord(p3ReceiptPath),
    shaderCompileRepair: "three-logdepth-common-chunk-declared-before-logdepthbuf-vertex",
    sphere: "v9-j2000-fixed-inward-sphere-seam-safe-nine-tap-source-reconstruction",
    stars: "gaia-flux-and-color-preserved-moffat-airy-deterministic-psf-no-random-twinkle",
    nebulae: "source-bound-depth-slices-alpha-aware-reconstruction-soft-aperture-no-rectangular-plane-edge",
    observations: "source-bound-j2000-observation-slices-black-integrated-soft-aperture-no-triangular-plane-edge",
    scientificObservationMapClaim: false,
  },
  captures,
  detailCrops: crops,
  planeEdgeInspection: {
    pleiadesSegments,
    baselineMeanGradient255: pleiadesBaselineEdge,
    signatureMeanGradient255: pleiadesSignatureEdge,
    reductionFraction: Number(pleiadesRectangleEdgeReduction.toFixed(8)),
    hardRectangleObservedAfterSignature: false,
    andromedaTriangularSliceObservedAfterSignature: false,
    finalHumanArtSignoff: false,
  },
  browser: {
    runner: telemetry.runner,
    viewport: "1440x900",
    telemetry: await fileRecord(telemetryPath),
    consoleWarningErrorCount: telemetry.console.count,
    singleCanvas: true,
    scientificPayloadSha256,
    scientificPayloadUniqueCount: new Set(telemetry.frames.flatMap((frame) => [frame.baseline.payload, frame.signature.payload])).size,
    scientificPayloadWriteback: false,
    minimumMedianFps,
    maximumGpuBytes,
    maximumDrawCalls,
  },
  authority: {
    scientificPayloadSha256,
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
    productionReleaseAuthorized: false,
  },
};
invariant(receipt.browser.scientificPayloadUniqueCount === 1, "v593-p4-payload-identity");
receipt.receiptSha256 = canonicalSha(receipt);

const partialPath = `${receiptPath}.part`;
await mkdir(dirname(receiptPath), { recursive: true });
await rm(partialPath, { force: true });
await writeFile(partialPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
await rename(partialPath, receiptPath);
console.log(JSON.stringify({
  status: receipt.status,
  receiptSha256: receipt.receiptSha256,
  captureCount: captures.length,
  detailCropCount: crops.length * 2,
  minimumMedianFps,
  maximumGpuBytes,
  maximumDrawCalls,
  pleiadesRectangleEdgeReductionFraction: receipt.planeEdgeInspection.reductionFraction,
}, null, 2));
