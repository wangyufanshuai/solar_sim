import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd());
const generatedAt = "2026-08-22T12:00:00.000Z";
const evidenceRoot = resolve(root, "docs/release/v593/screenshots/p1-code-gates");
const receiptPath = resolve(root, "docs/release/v593/p2-sun-browser-code-gate-v593.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/sun-asset-overlay.json");
const bridgePath = resolve(root, "app/components/SignatureArtDirectionBridgeV593.tsx");
const shellPath = resolve(root, "app/components/FinalArtObservatoryShellV593.tsx");
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

async function imageRecord(path, expectedWidth, expectedHeight) {
  const [bytes, metadata] = await Promise.all([readFile(path), sharp(path).metadata()]);
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    throw new Error(`v593-sun-image-dimensions:${relativePath(path)}:${metadata.width}x${metadata.height}`);
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
  ) throw new Error("v593-sun-ab-shape");
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

function luminance(data, channels, offset) {
  return data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
}

async function solarDiskMetrics(path) {
  const { data, width, height, channels } = await rawRgb(path);
  const centerX = 568;
  const centerY = 449;
  const diskValues = [];
  let centerSum = 0;
  let centerSquares = 0;
  let centerCount = 0;
  let limbSum = 0;
  let limbCount = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < Math.min(width, 1_135); x += 1) {
      const radius = Math.hypot(x - centerX, y - centerY);
      const offset = (y * width + x) * channels;
      const value = luminance(data, channels, offset);
      if (radius < 205) diskValues.push(value);
      if (radius < 90) {
        centerSum += value;
        centerSquares += value * value;
        centerCount += 1;
      }
      if (radius > 210 && radius < 232) {
        limbSum += value;
        limbCount += 1;
      }
    }
  }
  diskValues.sort((left, right) => left - right);
  const percentile = (fraction) => diskValues[Math.floor(diskValues.length * fraction)];
  const centerMean = centerSum / centerCount;
  const centerStdDev = Math.sqrt(centerSquares / centerCount - centerMean * centerMean);
  const limbMean = limbSum / limbCount;
  return Object.freeze({
    centerMean255: Number(centerMean.toFixed(6)),
    centerStdDev255: Number(centerStdDev.toFixed(6)),
    limbMean255: Number(limbMean.toFixed(6)),
    centerToLimbRatio: Number((centerMean / limbMean).toFixed(8)),
    p01: Number(percentile(0.01).toFixed(6)),
    p05: Number(percentile(0.05).toFixed(6)),
    median: Number(percentile(0.50).toFixed(6)),
    p95: Number(percentile(0.95).toFixed(6)),
    darkStructureSpan255: Number((percentile(0.50) - percentile(0.01)).toFixed(6)),
  });
}

async function fileRecord(path) {
  const bytes = await readFile(path);
  return Object.freeze({ path: relativePath(path), bytes: bytes.byteLength, sha256: sha256(bytes) });
}

async function verifyVariant(variant) {
  const path = resolve(root, `public${variant.url}`);
  const record = await fileRecord(path);
  if (record.bytes !== variant.bytes || record.sha256 !== variant.sha256) {
    throw new Error(`v593-sun-source-variant-drift:${variant.url}`);
  }
  return record;
}

const overlayBytes = await readFile(overlayPath);
const overlay = JSON.parse(overlayBytes.toString("utf8"));
const unsignedOverlay = { ...overlay };
delete unsignedOverlay.receiptSha256;
if (
  overlay.receiptSha256 !== canonicalSha(unsignedOverlay)
  || overlay.version !== "v591-sun-asset-overlay-v1"
  || overlay.mirroredHemisphereDisclosure !== true
  || overlay.authorityState?.presentationOnly !== true
  || overlay.authorityState?.scientificAuthorityChanged !== false
  || overlay.authorityState?.measuredAuthorityGranted !== false
  || overlay.assets?.length !== 2
) throw new Error("v593-sun-source-overlay");

const expectedSources = Object.freeze({
  "sun-photosphere": Object.freeze({ role: "photosphere", width: 8_192, height: 4_096 }),
  "sun-chromosphere": Object.freeze({ role: "chromosphere", width: 4_096, height: 2_048 }),
});
const verifiedSourceVariants = [];
for (const asset of overlay.assets) {
  const expected = expectedSources[asset.id];
  if (
    !expected
    || asset.body !== "sun"
    || asset.role !== expected.role
    || asset.source?.host !== "sdo.gsfc.nasa.gov"
    || asset.source?.license?.id !== "NASA-public-domain"
    || asset.variants?.desktopKtx2?.width !== expected.width
    || asset.variants?.desktopKtx2?.height !== expected.height
    || asset.variants?.desktopKtx2?.format !== "ktx2"
    || asset.variants?.desktopKtx2?.colorSpace !== "srgb"
    || asset.presentationOnly !== true
  ) throw new Error(`v593-sun-source-identity:${asset.id}`);
  verifiedSourceVariants.push(await verifyVariant(asset.variants.desktopKtx2));
}

const modeCases = Object.freeze([
  Object.freeze({
    id: "cinematic",
    baseline: "sun-v592-baseline-1440x900.png",
    signature: "sun-v593-signature-1440x900.png",
    baselineCrop: "sun-v592-baseline-1440x900-native-crop.png",
    signatureCrop: "sun-v593-signature-1440x900-native-crop.png",
  }),
  Object.freeze({
    id: "science",
    baseline: "sun-science-v592-baseline-1440x900.png",
    signature: "sun-science-v593-signature-1440x900.png",
    baselineCrop: "sun-science-v592-baseline-1440x900-native-crop.png",
    signatureCrop: "sun-science-v593-signature-1440x900-native-crop.png",
  }),
]);

const captures = [];
for (const entry of modeCases) {
  const baselinePath = resolve(evidenceRoot, entry.baseline);
  const signaturePath = resolve(evidenceRoot, entry.signature);
  const baselineMetrics = await solarDiskMetrics(baselinePath);
  const signatureMetrics = await solarDiskMetrics(signaturePath);
  const comparison = await compareImages(baselinePath, signaturePath);
  if (
    comparison.changedChannelFractionGt2 <= 0.001
    || comparison.maximumChannelDiff255 <= 2
    || signatureMetrics.centerToLimbRatio < baselineMetrics.centerToLimbRatio + 0.06
    || signatureMetrics.centerStdDev255 < 1.5
    || signatureMetrics.centerStdDev255 > 5.5
    || signatureMetrics.darkStructureSpan255 < 10
  ) throw new Error(`v593-sun-visual-code-gate:${entry.id}`);
  captures.push(Object.freeze({
    id: entry.id,
    framePolicy: "same-current-dev-build-fixed-camera-clock-and-solar-orientation",
    initialJulianDate: 2_461_287.99994,
    baselineTelemetry: Object.freeze({ materialPatchCount: 0, webglOutputChanged: false }),
    signatureTelemetry: Object.freeze({
      materialPatchCount: 2,
      photospherePatchCount: 1,
      chromospherePatchCount: 1,
      webglOutputChanged: true,
    }),
    scientificPayloadSha256,
    scientificPayloadWriteback: false,
    baseline: await imageRecord(baselinePath, 1_440, 900),
    signature: await imageRecord(signaturePath, 1_440, 900),
    baselineNativeCrop: await imageRecord(resolve(evidenceRoot, entry.baselineCrop), 540, 540),
    signatureNativeCrop: await imageRecord(resolve(evidenceRoot, entry.signatureCrop), 540, 540),
    comparison,
    baselineDiskMetrics: baselineMetrics,
    signatureDiskMetrics: signatureMetrics,
  }));
}

const detailCrops = Object.freeze([
  await imageRecord(resolve(evidenceRoot, "sun-v592-baseline-1440x900-surface-crop.png"), 320, 320),
  await imageRecord(resolve(evidenceRoot, "sun-v593-signature-1440x900-surface-crop.png"), 320, 320),
  await imageRecord(resolve(evidenceRoot, "sun-v592-baseline-1440x900-limb-crop.png"), 220, 460),
  await imageRecord(resolve(evidenceRoot, "sun-v593-signature-1440x900-limb-crop.png"), 220, 460),
]);

const [bridgeBytes, shellBytes] = await Promise.all([readFile(bridgePath), readFile(shellPath)]);
const bridgeSource = bridgeBytes.toString("utf8");
const shellSource = shellBytes.toString("utf8");
if (
  !bridgeSource.includes("SOLAR_PHOTOSPHERE_FRAGMENT_V593")
  || !bridgeSource.includes("SOLAR_CHROMOSPHERE_FRAGMENT_V593")
  || !bridgeSource.includes("sdo-hmi-source-local-contrast-observed-sunspot-limb-darkening")
  || !bridgeSource.includes("sdo-aia-source-bounded-rim-and-spicules")
  || !bridgeSource.includes("v592-physical-days-latitude-law-preserved")
  || !shellSource.includes('"sun-science-signature"')
  || !shellSource.includes('"sun-cinematic-signature"')
) throw new Error("v593-sun-runtime-source-contract");

const performance = Object.freeze([
  Object.freeze({ id: "science", sampleCount: 30, medianFps: 174.064404, minimumSampledFps: 141.643059, gpuBytes: 156_587_462, drawCalls: 7, triangles: 78_792, programs: 6, textures: 5 }),
  Object.freeze({ id: "cinematic", sampleCount: 30, medianFps: 164.880462, minimumSampledFps: 74.654722, gpuBytes: 157_636_038, drawCalls: 8, triangles: 78_794, programs: 8, textures: 8 }),
]);
if (performance.some((entry) => entry.medianFps < 45 || entry.gpuBytes > 512 * 1024 * 1024 || entry.drawCalls > 60)) {
  throw new Error("v593-sun-performance-gate");
}

const receipt = {
  version: "v593-p2-sun-browser-code-gate-v1",
  generatedAt,
  status: "passed-current-dev-sun-code-gate-sealed-build-and-human-signoff-pending",
  candidate: Object.freeze({ route: "/local-shadow-v593", formalProductPointer: "v263", additiveOnly: true }),
  scope: Object.freeze({
    signaturePassesCodeImplemented: 4,
    signaturePassesComplete: 0,
    implemented: Object.freeze(["sun", "jupiter", "saturn", "stellar-archetypes"]),
    pending: Object.freeze(["earth", "deep-sky"]),
    finalGoldenFrameMatrixComplete: false,
    sealedBuildEvidence: false,
    humanVisualSignoff: false,
  }),
  sourceMaterialCorrectness: Object.freeze({
    bridge: Object.freeze({ path: relativePath(bridgePath), bytes: bridgeBytes.byteLength, sha256: sha256(bridgeBytes) }),
    shell: Object.freeze({ path: relativePath(shellPath), bytes: shellBytes.byteLength, sha256: sha256(shellBytes) }),
    overlay: Object.freeze({ path: relativePath(overlayPath), bytes: overlayBytes.byteLength, sha256: sha256(overlayBytes), receiptSha256: overlay.receiptSha256 }),
    verifiedSourceVariants: Object.freeze(verifiedSourceVariants),
    photosphere: "NASA-SDO-HMI-source-bound-local-contrast-sunspot-granulation-and-limb-darkening",
    chromosphere: "NASA-SDO-AIA-304-source-bound-bounded-rim-and-spicule-layer",
    corona: "inherited-v591-deterministic-presentation-corona-restrained-cinematic-only",
    mirroredHemisphereDisclosure: true,
    scientificObservationMapClaim: false,
  }),
  captures: Object.freeze(captures),
  detailCrops,
  visualInspection: Object.freeze({
    currentDevNativeScale: "passed-code-gate",
    meridianSeam: "no-visible-hard-seam-at-fixed-orientation",
    poleAndLimb: "passed-bounded-pole-reconstruction-and-center-to-limb-contrast",
    darkStructure: "passed-source-bound-sunspot-structure-visible-without-synthetic-observation-claim",
    highlightClipping: "passed-no-flat-white-disk-or-full-screen-bloom",
    finalHumanArtSignoff: false,
  }),
  browser: Object.freeze({
    runner: "Codex-in-app-browser",
    viewport: "1440x900",
    singleCanvas: true,
    consolePageWebglErrorCount: 0,
    scientificPayloadSha256,
    scientificPayloadUniqueCount: 1,
    scientificPayloadWriteback: false,
    performance,
    resourceCycles: Object.freeze({
      baselineSignatureCycleCount: 4,
      sampledStateCount: 8,
      baselineStates: Object.freeze([
        Object.freeze({ programs: 7, textures: 6 }),
        Object.freeze({ programs: 7, textures: 6 }),
        Object.freeze({ programs: 7, textures: 6 }),
        Object.freeze({ programs: 7, textures: 6 }),
      ]),
      signatureStates: Object.freeze([
        Object.freeze({ programs: 9, textures: 8 }),
        Object.freeze({ programs: 9, textures: 8 }),
        Object.freeze({ programs: 9, textures: 8 }),
        Object.freeze({ programs: 9, textures: 8 }),
      ]),
      finalBaseline: Object.freeze({ patchCount: 0, programs: 7, textures: 6 }),
      sustainedGrowth: false,
    }),
    rotation: Object.freeze({
      body: "sun",
      authority: "rotation-admitted-iau-linear-reference",
      poleRaDeg: 286.13,
      poleDecDeg: 63.87,
      signedRotationDegPerDay: 14.1844,
      rotationPeriodDays: 25.37999492,
      absolutePrimeMeridian: true,
      differentialRotation: "active-presentation-physics-model-one-material",
      timeLapse: Object.freeze({ requestedRateSecondsPerSecond: 86_400, startPrimeMeridianDeg: 42.78434894, endPrimeMeridianDeg: 59.93825308, observedPrimeMeridianDeltaDeg: 17.15390414, observedVisualDeltaDeg: 16.95014678 }),
      realRate: Object.freeze({ requestedRateSecondsPerSecond: 1, requestedVisibleWindowSeconds: 2.2, startPrimeMeridianDeg: 42.78434894, endPrimeMeridianDeg: 42.78476351, observedPrimeMeridianDeltaDeg: 0.00041457 }),
      paused: Object.freeze({ rateSecondsPerSecond: 0, observedPrimeMeridianDeltaDeg: 0 }),
      w0BlockedDisclosed: Object.freeze(["bennu", "kleopatra"]),
      presentationAccelerationWriteback: false,
    }),
  }),
  authority: Object.freeze({
    scientificPayloadSha256,
    scientificPayloadWriteback: false,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
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
  detailCropCount: receipt.detailCrops.length,
  minimumMedianFps: Math.min(...performance.map((entry) => entry.medianFps)),
  maximumGpuBytes: Math.max(...performance.map((entry) => entry.gpuBytes)),
  receiptSha256: receipt.receiptSha256,
}, null, 2));
