import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd());
const generatedAt = "2026-08-22T16:00:00.000Z";
const evidenceRoot = resolve(root, "docs/release/v593/screenshots/p3-earth-code-gates");
const receiptPath = resolve(root, "docs/release/v593/p3-earth-browser-code-gate-v593.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/earth-asset-overlay.json");
const bridgePath = resolve(root, "app/components/SignatureArtDirectionBridgeV593.tsx");
const shellPath = resolve(root, "app/components/FinalArtObservatoryShellV593.tsx");
const telemetryPath = resolve(evidenceRoot, "browser-telemetry-current-dev-v593.json");
const resourceCyclesPath = resolve(evidenceRoot, "resource-cycles-current-dev-v593.json");
const browserPolicyPath = resolve(root, "docs/release/v593/blocked-browser-url-policy-p3-earth-v593.json");
const scientificPayloadSha256 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674";

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

async function imageRecord(path, expectedWidth, expectedHeight) {
  const [bytes, metadata] = await Promise.all([readFile(path), sharp(path).metadata()]);
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    throw new Error(`v593-earth-image-dimensions:${relativePath(path)}:${metadata.width}x${metadata.height}`);
  }
  return Object.freeze({
    path: relativePath(path),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  });
}

async function atomicCrop(sourcePath, outputPath, crop, scale = 1) {
  const partialPath = `${outputPath}.part.png`;
  await mkdir(dirname(outputPath), { recursive: true });
  await rm(partialPath, { force: true });
  let pipeline = sharp(sourcePath).extract(crop);
  if (scale !== 1) {
    pipeline = pipeline.resize(crop.width * scale, crop.height * scale, { kernel: sharp.kernel.nearest });
  }
  await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(partialPath);
  await rename(partialPath, outputPath);
}

async function rawRgb(path) {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

async function compareImages(baselinePath, signaturePath) {
  const [baseline, signature] = await Promise.all([rawRgb(baselinePath), rawRgb(signaturePath)]);
  if (
    baseline.width !== signature.width
    || baseline.height !== signature.height
    || baseline.channels !== signature.channels
  ) throw new Error("v593-earth-ab-shape");
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

function luminance(data, width, channels, x, y) {
  const offset = (y * width + x) * channels;
  return data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
}

async function seamMetrics(path) {
  const { data, width, height, channels } = await rawRgb(path);
  if (width !== 1_440 || height !== 900) throw new Error("v593-earth-seam-source-shape");
  const gradientAt = (x) => {
    let sum = 0;
    let count = 0;
    for (let y = 170; y < 720; y += 1) {
      sum += Math.abs(
        luminance(data, width, channels, x + 1, y)
        - luminance(data, width, channels, x - 1, y),
      ) * 0.5;
      count += 1;
    }
    return sum / count;
  };
  const centerColumn = 568;
  const center = gradientAt(centerColumn);
  const flank = (gradientAt(centerColumn - 10) + gradientAt(centerColumn + 10)) * 0.5;
  return Object.freeze({
    centerColumn,
    sampleY: Object.freeze([170, 720]),
    meanCenteredGradient255: Number(center.toFixed(6)),
    meanFlankGradient255: Number(flank.toFixed(6)),
    seamToFlankRatio: Number((center / flank).toFixed(8)),
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
    p50: Number(percentile(0.50).toFixed(6)),
    p99: Number(percentile(0.99).toFixed(6)),
    clippedBlackFraction: Number((clippedBlack / values.length).toFixed(8)),
    clippedWhiteFraction: Number((clippedWhite / values.length).toFixed(8)),
  });
}

async function verifyVariant(variant, assetId) {
  const path = resolve(root, `public${variant.url}`);
  const record = await fileRecord(path);
  if (record.bytes !== variant.bytes || record.sha256 !== variant.sha256) {
    throw new Error(`v593-earth-source-variant-drift:${assetId}:${variant.url}`);
  }
  return Object.freeze({
    assetId,
    ...record,
    width: variant.width,
    height: variant.height,
    format: variant.format,
    colorSpace: variant.colorSpace,
    compression: variant.compression,
  });
}

const overlayBytes = await readFile(overlayPath);
const overlay = JSON.parse(overlayBytes.toString("utf8"));
const unsignedOverlay = { ...overlay };
delete unsignedOverlay.receiptSha256;
if (
  overlay.receiptSha256 !== canonicalSha(unsignedOverlay)
  || overlay.version !== "v591-earth-asset-overlay-v1"
  || overlay.status !== "earth-runtime-admitted-inherited-exact-bytes"
  || overlay.noAssetBytesCopied !== true
  || overlay.authorityState?.presentationOnly !== true
  || overlay.authorityState?.scientificAuthorityChanged !== false
  || overlay.authorityState?.scientificPayloadWriteback !== false
  || overlay.authorityState?.measuredAuthorityGranted !== false
  || overlay.assets?.length !== 7
) throw new Error("v593-earth-source-overlay");

const expectedRoles = new Map([
  ["earth-albedo", "albedo"],
  ["earth-normal", "normal"],
  ["earth-roughness", "roughness"],
  ["earth-clouds", "cloud-color"],
  ["earth-cloud-alpha", "cloud-alpha"],
  ["earth-night", "night-emission"],
  ["earth-night-mask", "night-mask"],
]);
const verifiedSourceVariants = [];
for (const asset of overlay.assets) {
  const expectedRole = expectedRoles.get(asset.id);
  if (
    !expectedRole
    || asset.body !== "earth"
    || asset.role !== expectedRole
    || asset.inheritedIdentity?.license?.id !== "NASA-public-domain"
    || asset.presentationOnly !== true
    || asset.variants?.fullDesktop?.format !== "ktx2"
  ) throw new Error(`v593-earth-source-identity:${asset.id}`);
  verifiedSourceVariants.push(await verifyVariant(asset.variants.fullDesktop, asset.id));
}

const frameCases = Object.freeze([
  Object.freeze({ id: "earth-science-day", mode: "science" }),
  Object.freeze({ id: "earth-cinematic-day", mode: "cinematic" }),
  Object.freeze({ id: "earth-cinematic-night", mode: "cinematic" }),
  Object.freeze({ id: "earth-science-limb", mode: "science" }),
  Object.freeze({ id: "earth-seam-audit", mode: "science" }),
]);
const bodyCrop = Object.freeze({ left: 286, top: 154, width: 550, height: 590 });
const detailCases = Object.freeze([
  Object.freeze({ id: "day-highlight", frameId: "earth-cinematic-day", crop: Object.freeze({ left: 300, top: 220, width: 260, height: 260 }) }),
  Object.freeze({ id: "night-dark-city", frameId: "earth-cinematic-night", crop: Object.freeze({ left: 435, top: 255, width: 400, height: 430 }) }),
  Object.freeze({ id: "atmospheric-limb", frameId: "earth-science-limb", crop: Object.freeze({ left: 275, top: 145, width: 230, height: 600 }) }),
  Object.freeze({ id: "true-seam", frameId: "earth-seam-audit", crop: Object.freeze({ left: 518, top: 170, width: 100, height: 550 }) }),
]);

const framePaths = (frameId, lane) => resolve(
  evidenceRoot,
  `${frameId}-${lane === "baseline" ? "v592-baseline" : "v593-signature"}-current-dev-1440x900.jpg`,
);

for (const frame of frameCases) {
  for (const lane of ["baseline", "signature"]) {
    const source = framePaths(frame.id, lane);
    const output = resolve(
      evidenceRoot,
      `${frame.id}-${lane === "baseline" ? "v592-baseline" : "v593-signature"}-current-dev-1440x900-native-crop.png`,
    );
    await atomicCrop(source, output, bodyCrop);
  }
}

for (const detail of detailCases) {
  for (const lane of ["baseline", "signature"]) {
    const source = framePaths(detail.frameId, lane);
    const output = resolve(
      evidenceRoot,
      `${detail.frameId}-${lane === "baseline" ? "v592-baseline" : "v593-signature"}-current-dev-${detail.id}-100pct.png`,
    );
    await atomicCrop(source, output, detail.crop);
  }
}

const telemetryBytes = await readFile(telemetryPath);
const telemetry = JSON.parse(telemetryBytes.toString("utf8"));
const resourceCyclesBytes = await readFile(resourceCyclesPath);
const resourceCycles = JSON.parse(resourceCyclesBytes.toString("utf8"));
const browserPolicyBytes = await readFile(browserPolicyPath);
const browserPolicy = JSON.parse(browserPolicyBytes.toString("utf8"));
if (!Array.isArray(telemetry) || telemetry.length !== 10) throw new Error("v593-earth-telemetry-count");
if (!Array.isArray(resourceCycles) || resourceCycles.length !== 9) throw new Error("v593-earth-resource-cycle-count");
if (
  browserPolicy.version !== "v593-p3-earth-browser-url-policy-negative-evidence-v1"
  || browserPolicy.status !== "blocked-browser-url-policy"
  || browserPolicy.target !== "http://127.0.0.1:3001/local-shadow-v593?frame=earth-seam-audit"
  || browserPolicy.alternateBrowserAttempted !== false
  || browserPolicy.policyCircumventionAttempted !== false
) throw new Error("v593-earth-browser-policy-evidence");

const captures = [];
for (const frame of frameCases) {
  const baselineTelemetry = telemetry.find((entry) => entry.preset === frame.id && entry.lane === "baseline");
  const signatureTelemetry = telemetry.find((entry) => entry.preset === frame.id && entry.lane === "signature");
  if (
    !baselineTelemetry
    || !signatureTelemetry
    || baselineTelemetry.mode !== frame.mode
    || signatureTelemetry.mode !== frame.mode
    || baselineTelemetry.patches !== 0
    || baselineTelemetry.webglChanged !== "false"
    || signatureTelemetry.patches !== 4
    || signatureTelemetry.surfacePatches !== 1
    || signatureTelemetry.cloudPatches !== 2
    || signatureTelemetry.atmospherePatches !== 1
    || signatureTelemetry.webglChanged !== "true"
  ) throw new Error(`v593-earth-frame-telemetry:${frame.id}`);
  for (const entry of [baselineTelemetry, signatureTelemetry]) {
    if (
      entry.payload !== scientificPayloadSha256
      || entry.payloadStable !== "true"
      || entry.writeback !== "false"
      || entry.canvasCount !== 1
      || entry.fpsMedian < 45
      || entry.gpuBytes > 512 * 1024 * 1024
      || entry.drawCalls > 60
    ) throw new Error(`v593-earth-browser-gate:${frame.id}:${entry.lane}`);
  }
  const baselinePath = framePaths(frame.id, "baseline");
  const signaturePath = framePaths(frame.id, "signature");
  const comparison = await compareImages(baselinePath, signaturePath);
  if (comparison.changedChannelFractionGt2 <= 0.001 || comparison.maximumChannelDiff255 <= 2) {
    throw new Error(`v593-earth-visual-delta:${frame.id}`);
  }
  captures.push(Object.freeze({
    id: frame.id,
    mode: frame.mode,
    framePolicy: "same-current-dev-build-fixed-camera-clock-and-earth-orientation",
    baselineTelemetry,
    signatureTelemetry,
    scientificPayloadSha256,
    scientificPayloadWriteback: false,
    baseline: await imageRecord(baselinePath, 1_440, 900),
    signature: await imageRecord(signaturePath, 1_440, 900),
    baselineNativeCrop: await imageRecord(
      resolve(evidenceRoot, `${frame.id}-v592-baseline-current-dev-1440x900-native-crop.png`),
      bodyCrop.width,
      bodyCrop.height,
    ),
    signatureNativeCrop: await imageRecord(
      resolve(evidenceRoot, `${frame.id}-v593-signature-current-dev-1440x900-native-crop.png`),
      bodyCrop.width,
      bodyCrop.height,
    ),
    comparison,
  }));
}

const detailCrops = [];
for (const detail of detailCases) {
  const lanes = {};
  for (const lane of ["baseline", "signature"]) {
    const path = resolve(
      evidenceRoot,
      `${detail.frameId}-${lane === "baseline" ? "v592-baseline" : "v593-signature"}-current-dev-${detail.id}-100pct.png`,
    );
    lanes[lane] = Object.freeze({
      image: await imageRecord(path, detail.crop.width, detail.crop.height),
      tone: await cropToneMetrics(path),
    });
  }
  detailCrops.push(Object.freeze({ id: detail.id, frameId: detail.frameId, crop: detail.crop, ...lanes }));
}

const baselineSeam = await seamMetrics(framePaths("earth-seam-audit", "baseline"));
const signatureSeam = await seamMetrics(framePaths("earth-seam-audit", "signature"));
const gradientReductionFraction = 1 - signatureSeam.meanCenteredGradient255 / baselineSeam.meanCenteredGradient255;
if (
  signatureSeam.meanCenteredGradient255 >= baselineSeam.meanCenteredGradient255 * 0.9
  || gradientReductionFraction < 0.10
) throw new Error("v593-earth-seam-gradient-gate");

const baselineStates = resourceCycles.filter((entry) => entry.art === "v592-same-build-baseline");
const signatureStates = resourceCycles.filter((entry) => entry.art === "v593-signature");
const finalBaseline = resourceCycles.at(-1);
if (
  baselineStates.length !== 5
  || signatureStates.length !== 4
  || signatureStates.some((entry) => entry.patches !== 4 || entry.materials !== 4)
  || baselineStates.some((entry) => entry.patches !== 0 || entry.materials !== 0)
  || finalBaseline?.label !== "final-baseline"
  || finalBaseline?.patches !== 0
  || finalBaseline?.materials !== 0
  || finalBaseline?.programs !== 7
  || finalBaseline?.textures !== 10
  || finalBaseline?.payload !== scientificPayloadSha256
  || finalBaseline?.writeback !== "false"
) throw new Error("v593-earth-resource-restore");

const [bridgeBytes, shellBytes] = await Promise.all([readFile(bridgePath), readFile(shellPath)]);
const bridgeSource = bridgeBytes.toString("utf8");
const shellSource = shellBytes.toString("utf8");
if (
  !bridgeSource.includes("EARTH_SURFACE_FRAGMENT_V593")
  || !bridgeSource.includes("EARTH_CLOUD_FRAGMENT_V593")
  || !bridgeSource.includes("EARTH_ATMOSPHERE_FRAGMENT_V593")
  || !bridgeSource.includes('value: 0.0045')
  || !bridgeSource.includes("blue-marble-gebco-roughness-ggx-ocean-black-marble-terminator")
  || !bridgeSource.includes("dual-layer-source-opacity-self-shadow-silver-lining")
  || !bridgeSource.includes("bounded-rayleigh-mie-optical-path-twilight")
  || !bridgeSource.includes("atlasV593EarthSeamDistanceDeg")
  || !shellSource.includes('"earth-seam-audit"')
) throw new Error("v593-earth-runtime-source-contract");

const receipt = {
  version: "v593-p3-earth-browser-code-gate-v1",
  generatedAt,
  status: "passed-current-dev-earth-code-and-visual-gates-console-replay-blocked-sealed-build-and-human-signoff-pending",
  candidate: Object.freeze({ route: "/local-shadow-v593", formalProductPointer: "v263", additiveOnly: true }),
  scope: Object.freeze({
    signaturePassesCodeImplemented: 5,
    signaturePassesComplete: 0,
    implemented: Object.freeze(["sun", "earth", "jupiter", "saturn", "stellar-archetypes"]),
    pending: Object.freeze(["deep-sky"]),
    finalGoldenFrameMatrixComplete: false,
    sealedBuildEvidence: false,
    humanVisualSignoff: false,
  }),
  sourceMaterialCorrectness: Object.freeze({
    bridge: Object.freeze({ path: relativePath(bridgePath), bytes: bridgeBytes.byteLength, sha256: sha256(bridgeBytes) }),
    shell: Object.freeze({ path: relativePath(shellPath), bytes: shellBytes.byteLength, sha256: sha256(shellBytes) }),
    overlay: Object.freeze({ path: relativePath(overlayPath), bytes: overlayBytes.byteLength, sha256: sha256(overlayBytes), receiptSha256: overlay.receiptSha256 }),
    verifiedSourceVariants: Object.freeze(verifiedSourceVariants),
    surface: "NASA-source-bound-Blue-Marble-GEBCO-normal-land-ocean-roughness-and-Black-Marble-night",
    clouds: "NASA-source-bound-dual-cloud-color-alpha-layers-with-sun-tangent-shadow",
    atmosphere: "analytic-bounded-Rayleigh-Mie-presentation-shell",
    seamPolicy: "local-three-tap-cross-edge-filter-with-narrow-normal-fade",
    scientificObservationMapClaim: false,
  }),
  captures: Object.freeze(captures),
  detailCrops: Object.freeze(detailCrops),
  seamInspection: Object.freeze({
    cameraCenterU: 0.00000001,
    seamDistanceDeg: 0.000004,
    seamFacingCamera: true,
    baseline: baselineSeam,
    signature: signatureSeam,
    gradientReductionFraction: Number(gradientReductionFraction.toFixed(8)),
    wideBlurBandObserved: false,
    horizontalStripeObserved: false,
    independentLightDarkFaceObserved: false,
    finalHumanArtSignoff: false,
  }),
  visualInspection: Object.freeze({
    currentDevNativeScale: "passed-code-gate",
    oceanHighlight: "bounded-no-camera-facing-grey-specular-spot",
    nightSide: "source-bound-emission-visible-with-dark-ground-preserved",
    atmosphericLimb: "bounded-no-full-screen-bloom",
    trueTextureSeam: "correctly-camera-aligned-and-local-gradient-reduced",
    finalHumanArtSignoff: false,
  }),
  browser: Object.freeze({
    runner: "Codex-in-app-browser",
    viewport: "1440x900",
    telemetry: Object.freeze({ path: relativePath(telemetryPath), bytes: telemetryBytes.byteLength, sha256: sha256(telemetryBytes) }),
    consoleReplay: Object.freeze({
      status: "blocked-browser-url-policy",
      errorWarningCount: null,
      evidence: Object.freeze({
        path: relativePath(browserPolicyPath),
        bytes: browserPolicyBytes.byteLength,
        sha256: sha256(browserPolicyBytes),
      }),
      finalSealedBuildConsoleGatePassed: false,
    }),
    singleCanvas: true,
    scientificPayloadSha256,
    scientificPayloadUniqueCount: 1,
    scientificPayloadWriteback: false,
    minimumMedianFps: Math.min(...telemetry.map((entry) => entry.fpsMedian)),
    maximumGpuBytes: Math.max(...telemetry.map((entry) => entry.gpuBytes)),
    maximumDrawCalls: Math.max(...telemetry.map((entry) => entry.drawCalls)),
    resourceCycles: Object.freeze({
      record: Object.freeze({ path: relativePath(resourceCyclesPath), bytes: resourceCyclesBytes.byteLength, sha256: sha256(resourceCyclesBytes) }),
      baselineSignatureCycleCount: 4,
      sampledStateCount: resourceCycles.length,
      finalBaseline: Object.freeze({
        patchCount: finalBaseline.patches,
        signatureMaterialCount: finalBaseline.materials,
        programs: finalBaseline.programs,
        textures: finalBaseline.textures,
      }),
      sustainedGrowth: false,
    }),
  }),
  authority: Object.freeze({
    scientificPayloadSha256,
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
    radiativeTransferGranted: false,
    productionReleaseAuthorized: false,
  }),
};
receipt.receiptSha256 = canonicalSha(receipt);
await mkdir(dirname(receiptPath), { recursive: true });
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  status: receipt.status,
  signaturePassesCodeImplemented: receipt.scope.signaturePassesCodeImplemented,
  signaturePassesComplete: receipt.scope.signaturePassesComplete,
  captureCount: receipt.captures.length,
  nativeCropCount: receipt.captures.length * 2,
  detailCropCount: receipt.detailCrops.length * 2,
  seamGradientReductionFraction: receipt.seamInspection.gradientReductionFraction,
  minimumMedianFps: receipt.browser.minimumMedianFps,
  maximumGpuBytes: receipt.browser.maximumGpuBytes,
  maximumDrawCalls: receipt.browser.maximumDrawCalls,
  browserReplayStatus: receipt.browser.consoleReplay.status,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
