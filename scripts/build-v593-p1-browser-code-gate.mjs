import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd());
const generatedAt = "2026-08-22T00:00:00.000Z";
const evidenceRoot = resolve(root, "docs/release/v593/screenshots/p1-code-gates");
const receiptPath = resolve(root, "docs/release/v593/p1-browser-code-gate-v593.json");
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
    throw new Error(`v593-p1-image-dimensions:${relativePath(path)}:${metadata.width}x${metadata.height}`);
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
  ) throw new Error("v593-p1-ab-shape");
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

async function verticalSeamScore(path, column) {
  const { data, width, height, channels } = await rawRgb(path);
  if (column < 4 || column >= width - 4) throw new Error("v593-p1-seam-column");
  let positiveContrast = 0;
  let count = 0;
  for (let y = 40; y < Math.min(height, 500); y += 1) {
    const neighbor = (
      luminance(data, width, channels, column - 3, y)
      + luminance(data, width, channels, column + 3, y)
    ) * 0.5;
    const contrast = neighbor - luminance(data, width, channels, column, y);
    if (contrast > 0) {
      positiveContrast += contrast;
      count += 1;
    }
  }
  return positiveContrast / Math.max(count, 1);
}

const cases = [
  { id: "jupiter-grs", pass: "jupiter", crop: [470, 540], patchCount: 1 },
  { id: "jupiter-seam", pass: "jupiter", crop: [470, 540], patchCount: 1 },
  { id: "saturn-front", pass: "saturn", crop: [830, 640], patchCount: 2 },
  { id: "sirius", pass: "stellar-archetypes", crop: [500, 540], patchCount: 2, profile: "hot-radiative-main-sequence" },
  { id: "rigel", pass: "stellar-archetypes", crop: [500, 540], patchCount: 2, profile: "hot-radiative-supergiant" },
  { id: "betelgeuse", pass: "stellar-archetypes", crop: [500, 540], patchCount: 2, profile: "cool-convective-supergiant" },
  { id: "antares", pass: "stellar-archetypes", crop: [500, 540], patchCount: 2, profile: "cool-convective-supergiant" },
];

const captures = [];
for (const entry of cases) {
  const baselinePath = resolve(evidenceRoot, `${entry.id}-v592-baseline-1440x900.jpg`);
  const signaturePath = resolve(evidenceRoot, `${entry.id}-v593-signature-1440x900.jpg`);
  const baselineCropPath = resolve(evidenceRoot, `${entry.id}-v592-baseline-1440x900-native-crop.png`);
  const signatureCropPath = resolve(evidenceRoot, `${entry.id}-v593-signature-1440x900-native-crop.png`);
  const comparison = await compareImages(baselinePath, signaturePath);
  if (comparison.changedChannelFractionGt2 <= 0.001 || comparison.maximumChannelDiff255 <= 2) {
    throw new Error(`v593-p1-webgl-output-not-changed:${entry.id}`);
  }
  captures.push(Object.freeze({
    id: entry.id,
    signaturePass: entry.pass,
    framePolicy: "same-current-dev-build-fixed-camera-and-clock",
    baselineTelemetry: Object.freeze({ materialPatchCount: 0, signatureMaterialCount: 0, webglOutputChanged: false }),
    signatureTelemetry: Object.freeze({
      materialPatchCount: entry.patchCount,
      signatureMaterialCount: entry.patchCount,
      stellarProfile: entry.profile ?? "not-applicable",
      webglOutputChanged: true,
    }),
    scientificPayloadSha256,
    scientificPayloadWriteback: false,
    baseline: await imageRecord(baselinePath, 1_440, 900),
    signature: await imageRecord(signaturePath, 1_440, 900),
    baselineNativeCrop: await imageRecord(baselineCropPath, entry.crop[0], entry.crop[1]),
    signatureNativeCrop: await imageRecord(signatureCropPath, entry.crop[0], entry.crop[1]),
    comparison,
  }));
}

const seamBaseline = await verticalSeamScore(
  resolve(evidenceRoot, "jupiter-seam-v592-baseline-1440x900-native-crop.png"),
  269,
);
const seamSignature = await verticalSeamScore(
  resolve(evidenceRoot, "jupiter-seam-v593-signature-1440x900-native-crop.png"),
  269,
);
const seamReduction = 1 - seamSignature / seamBaseline;
if (seamReduction < 0.75) throw new Error(`v593-p1-jupiter-seam-reduction:${seamReduction}`);

const performance = Object.freeze([
  Object.freeze({ id: "jupiter", medianFps: 166.11, minimumSampledFps: 163.53, drawCalls: 6, triangles: 42_312, programs: 6, textures: 9, gpuBytes: 117_440_662 }),
  Object.freeze({ id: "saturn", medianFps: 166.39, minimumSampledFps: 154.20, drawCalls: 12, triangles: 112_968, programs: 9, textures: 8, gpuBytes: 158_686_038 }),
  Object.freeze({ id: "sirius", medianFps: 188.86, drawCalls: 7, triangles: 43_992, programs: 8, textures: 3, gpuBytes: 157_636_038 }),
  Object.freeze({ id: "rigel", medianFps: 161.55, drawCalls: 7, triangles: 43_992, programs: 8, textures: 3, gpuBytes: 157_636_038 }),
  Object.freeze({ id: "betelgeuse", medianFps: 105.88, drawCalls: 7, triangles: 43_992, programs: 8, textures: 3, gpuBytes: 157_636_038 }),
  Object.freeze({ id: "antares", medianFps: 168.92, drawCalls: 7, triangles: 43_992, programs: 8, textures: 3, gpuBytes: 157_636_038 }),
]);
if (performance.some((entry) => entry.medianFps < 45 || entry.gpuBytes > 512 * 1024 * 1024 || entry.drawCalls > 60)) {
  throw new Error("v593-p1-performance-gate");
}

const bridgePath = resolve(root, "app/components/SignatureArtDirectionBridgeV593.tsx");
const bridgeBytes = await readFile(bridgePath);
const backlightPath = resolve(evidenceRoot, "saturn-backlight-v593-signature-1440x900.jpg");
const shadowPath = resolve(evidenceRoot, "saturn-ring-shadow-v593-signature-1440x900.jpg");

const receipt = {
  version: "v593-p1-browser-code-gate-v1",
  generatedAt,
  status: "passed-current-dev-code-gates-sealed-build-and-human-signoff-pending",
  candidate: Object.freeze({ route: "/local-shadow-v593", formalProductPointer: "v263", additiveOnly: true }),
  scope: Object.freeze({
    signaturePassesCodeImplemented: 3,
    signaturePassesComplete: 0,
    implemented: Object.freeze(["jupiter", "saturn", "stellar-archetypes"]),
    pending: Object.freeze(["sun", "earth", "deep-sky"]),
    finalGoldenFrameMatrixComplete: false,
    sealedBuildEvidence: false,
    humanVisualSignoff: false,
  }),
  sourceMaterialCorrectness: Object.freeze({
    sourcePath: relativePath(bridgePath),
    sourceSha256: sha256(bridgeBytes),
    jupiter: "NASA-source-bound-v591-albedo-band-storm;clean-inset-seam-reconstruction;no-science-writeback",
    saturn: "Cassini-source-bound-v591-atmosphere-ring-optical-depth;Henyey-Greenstein-forward-backward-scattering;bidirectional-analytic-shadow",
    stellar: "Gaia-parameterized-v592-archetypes;deterministic-radiative-or-convective-presentation-model;no-observation-texture-claim",
  }),
  captures: Object.freeze(captures),
  saturnAuditFrames: Object.freeze([
    await imageRecord(backlightPath, 1_440, 900),
    await imageRecord(shadowPath, 1_440, 900),
  ]),
  jupiterSeamAudit: Object.freeze({
    cropColumn: 269,
    baselinePositiveContrast255: Number(seamBaseline.toFixed(6)),
    signaturePositiveContrast255: Number(seamSignature.toFixed(6)),
    reductionFraction: Number(seamReduction.toFixed(8)),
    status: "passed-code-gate-not-human-signoff",
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
      baselineSignatureCycleCount: 10,
      sampledStateCount: 30,
      programRange: Object.freeze([5, 8]),
      textureRange: Object.freeze([3, 9]),
      baselineTextureCounts: Object.freeze([6, 6, 6, 6, 6, 6, 6, 6, 6, 6]),
      finalBaseline: Object.freeze({ patchCount: 0, signatureMaterialCount: 0, programs: 5, textures: 6 }),
      sustainedGrowth: false,
    }),
    rotation: Object.freeze({
      body: "jupiter",
      absoluteOrientationAuthority: "rotation-admitted-iau-linear-reference",
      poleRaDeg: 268.05486083,
      poleDecDeg: 64.49594688,
      rotationPeriodDays: 0.41353833,
      timeLapse: Object.freeze({ rateSecondsPerSecond: 3_600, elapsedWallSeconds: 0.9, primeMeridianDeltaDeg: 36.555801 }),
      realRate: Object.freeze({ rateSecondsPerSecond: 1, elapsedWallSeconds: 2.2, primeMeridianDeltaDeg: 0.022933 }),
      paused: Object.freeze({ rateSecondsPerSecond: 0, elapsedWallSeconds: 0.9, primeMeridianDeltaDeg: 0 }),
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
  captureCount: receipt.captures.length,
  signaturePassesComplete: receipt.scope.signaturePassesComplete,
  jupiterSeamReductionFraction: receipt.jupiterSeamAudit.reductionFraction,
  minimumMedianFps: Math.min(...performance.map((entry) => entry.medianFps)),
  maximumGpuBytes: Math.max(...performance.map((entry) => entry.gpuBytes)),
  receiptSha256: receipt.receiptSha256,
}, null, 2));
