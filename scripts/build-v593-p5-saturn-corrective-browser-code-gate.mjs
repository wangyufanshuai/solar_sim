import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(process.cwd());
const generatedAt = "2026-08-22T23:00:00.000Z";
const evidenceRoot = resolve(root, "docs/release/v593/screenshots/p5-saturn-corrective");
const telemetryPath = resolve(evidenceRoot, "browser-telemetry-current-dev-v593.json");
const receiptPath = resolve(root, "docs/release/v593/p5-saturn-corrective-browser-code-gate-v593.json");
const p4ReceiptPath = resolve(root, "docs/release/v593/p4-deep-sky-browser-code-gate-v593.json");
const bridgePath = resolve(root, "app/components/SignatureArtDirectionBridgeV593.tsx");
const shellPath = resolve(root, "app/components/FinalArtObservatoryShellV593.tsx");
const testPath = resolve(root, "app/lib/finalArtDirectionV593.test.ts");
const harnessPath = resolve(root, "docs/release/v593/mobile-viewport-harness-v593.html");
const builderPath = resolve(root, "scripts/build-v593-p5-saturn-corrective-browser-code-gate.mjs");
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

async function imageRecord(path, expectedWidth, expectedHeight) {
  const [bytes, metadata] = await Promise.all([readFile(path), sharp(path).metadata()]);
  invariant(
    metadata.width === expectedWidth && metadata.height === expectedHeight,
    `v593-p5-image-shape:${relativePath(path)}:${metadata.width}x${metadata.height}`,
  );
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

function luminance(image, x, y) {
  const offset = (y * image.width + x) * image.channels;
  return image.data[offset] * 0.2126 + image.data[offset + 1] * 0.7152 + image.data[offset + 2] * 0.0722;
}

async function compareImages(baselinePath, signaturePath) {
  const [baseline, signature] = await Promise.all([rawRgb(baselinePath), rawRgb(signaturePath)]);
  invariant(
    baseline.width === signature.width
      && baseline.height === signature.height
      && baseline.channels === signature.channels,
    "v593-p5-ab-shape",
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

async function scanVerticalGradient(path, region) {
  const image = await rawRgb(path);
  invariant(
    region.left > 0
      && region.top >= 0
      && region.right < image.width - 1
      && region.bottom <= image.height,
    `v593-p5-gradient-region:${relativePath(path)}`,
  );
  let maximum = { x: region.left, meanGradient255: -1 };
  const byX = [];
  for (let x = region.left; x <= region.right; x += 1) {
    let total = 0;
    let count = 0;
    for (let y = region.top; y < region.bottom; y += 1) {
      total += Math.abs(luminance(image, x + 1, y) - luminance(image, x - 1, y)) * 0.5;
      count += 1;
    }
    const meanGradient255 = total / Math.max(1, count);
    byX.push({ x, meanGradient255 });
    if (meanGradient255 > maximum.meanGradient255) maximum = { x, meanGradient255 };
  }
  return Object.freeze({
    region,
    maximum: Object.freeze({
      x: maximum.x,
      meanGradient255: Number(maximum.meanGradient255.toFixed(6)),
    }),
    gradientAt: (x) => Number(byX.find((entry) => entry.x === x).meanGradient255.toFixed(6)),
  });
}

const telemetryBytes = await readFile(telemetryPath);
const telemetry = JSON.parse(telemetryBytes.toString("utf8"));
const unsignedTelemetry = { ...telemetry };
delete unsignedTelemetry.telemetrySha256;
invariant(telemetry.telemetrySha256 === canonicalSha(unsignedTelemetry), "v593-p5-telemetry-seal");
invariant(telemetry.version === "v593-p5-saturn-corrective-browser-telemetry-v1", "v593-p5-telemetry-version");
invariant(
  telemetry.runner === "Codex-in-app-browser-screenshots+Playwright-CLI-renderer-telemetry",
  "v593-p5-browser-runner",
);
invariant(telemetry.console?.count === 0 && telemetry.console?.entries?.length === 0, "v593-p5-console-errors");
invariant(telemetry.server?.bridgeSha256 === (await fileRecord(bridgePath)).sha256, "v593-p5-current-bridge-owner");
invariant(telemetry.authority?.scientificPayloadSha256 === scientificPayloadSha256, "v593-p5-payload");
invariant(telemetry.authority?.scientificPayloadWriteback === false, "v593-p5-writeback");

const requiredFrames = new Map([
  ["saturn-cinematic-front", "three-quarter-optical-depth-fixed-camera"],
  ["saturn-cinematic-backlight", "anti-solar-backscatter-fixed-camera"],
  ["saturn-cinematic-ring-shadow", "ring-plane-bidirectional-shadow-fixed-camera"],
]);
invariant(telemetry.frames?.length === requiredFrames.size, "v593-p5-frame-count");

const captures = [];
for (const frame of telemetry.frames) {
  const expectedCamera = requiredFrames.get(frame.frame);
  invariant(expectedCamera, `v593-p5-unexpected-frame:${frame.frame}`);
  invariant(frame.baseline?.width === 1_280 && frame.baseline?.height === 720, `v593-p5-baseline-viewport:${frame.frame}`);
  invariant(frame.signature?.width === 1_280 && frame.signature?.height === 720, `v593-p5-signature-viewport:${frame.frame}`);
  invariant(frame.baseline?.lane === "v592-same-build-baseline", `v593-p5-baseline-lane:${frame.frame}`);
  invariant(frame.baseline?.patchCount === 0 && frame.baseline?.webglChanged === "false", `v593-p5-baseline-patch:${frame.frame}`);
  invariant(frame.signature?.lane === "v593-signature", `v593-p5-signature-lane:${frame.frame}`);
  invariant(frame.signature?.patchCount === 2, `v593-p5-signature-patches:${frame.frame}`);
  invariant(frame.signature?.surfacePatchCount === 1 && frame.signature?.ringPatchCount === 1, `v593-p5-saturn-patches:${frame.frame}`);
  invariant(frame.signature?.signatureSaturn === "implemented-code-gates-pending", `v593-p5-signature-state:${frame.frame}`);
  invariant(frame.signature?.webglChanged === "true", `v593-p5-webgl-change:${frame.frame}`);
  invariant(frame.baseline?.cameraPolicy === expectedCamera && frame.signature?.cameraPolicy === expectedCamera, `v593-p5-camera:${frame.frame}`);
  invariant(frame.baseline?.payload === scientificPayloadSha256 && frame.signature?.payload === scientificPayloadSha256, `v593-p5-frame-payload:${frame.frame}`);
  invariant(frame.baseline?.payloadStable === "true" && frame.signature?.payloadStable === "true", `v593-p5-frame-payload-stable:${frame.frame}`);
  invariant(frame.baseline?.writeback === "false" && frame.signature?.writeback === "false", `v593-p5-frame-writeback:${frame.frame}`);
  invariant(frame.signature?.canvasCount === 1, `v593-p5-single-canvas:${frame.frame}`);
  invariant(frame.signature?.fpsMedian >= 45, `v593-p5-fps:${frame.frame}`);
  invariant(frame.signature?.gpuBytes <= 512 * 1024 * 1024, `v593-p5-gpu:${frame.frame}`);
  invariant(frame.signature?.drawCalls <= 60, `v593-p5-draw-calls:${frame.frame}`);
  const baselinePath = resolve(root, frame.baseline.path);
  const signaturePath = resolve(root, frame.signature.path);
  captures.push(Object.freeze({
    id: frame.frame,
    cameraPolicy: expectedCamera,
    baselineTelemetry: frame.baseline,
    signatureTelemetry: frame.signature,
    baseline: await imageRecord(baselinePath, 1_280, 720),
    signature: await imageRecord(signaturePath, 1_280, 720),
    comparison: await compareImages(baselinePath, signaturePath),
  }));
}

const mobileFrames = telemetry.mobile?.frames ?? [];
invariant(mobileFrames.length === 2, "v593-p5-mobile-frame-count");
const mobileBaseline = mobileFrames.find((frame) => frame.art === "baseline");
const mobileSignature = mobileFrames.find((frame) => frame.art === "signature");
invariant(mobileBaseline && mobileSignature, "v593-p5-mobile-lanes");
for (const frame of mobileFrames) {
  invariant(frame.innerWidth === 390 && frame.innerHeight === 844, `v593-p5-mobile-inner-viewport:${frame.art}`);
  invariant(frame.payload === scientificPayloadSha256 && frame.payloadStable === "true", `v593-p5-mobile-payload:${frame.art}`);
  invariant(frame.writeback === "false" && frame.canvasCount === 1, `v593-p5-mobile-authority:${frame.art}`);
  invariant(frame.fpsMedian >= 45, `v593-p5-mobile-fps:${frame.art}`);
  invariant(frame.gpuBytes <= 192 * 1024 * 1024, `v593-p5-mobile-gpu:${frame.art}`);
  invariant(frame.drawCalls <= 60, `v593-p5-mobile-draw-calls:${frame.art}`);
}
invariant(mobileBaseline.patchCount === 0 && mobileBaseline.webglChanged === "false", "v593-p5-mobile-baseline");
invariant(mobileSignature.patchCount === 2 && mobileSignature.webglChanged === "true", "v593-p5-mobile-signature");
const mobileEvidence = Object.freeze({
  harness: await fileRecord(harnessPath),
  baselineRawCapture: await imageRecord(resolve(root, mobileBaseline.path), 390, 844),
  signatureRawCapture: await imageRecord(resolve(root, mobileSignature.path), 390, 844),
  baselineNormalizedPreview: await imageRecord(resolve(root, telemetry.mobile.baselineNormalizedPreviewPath), 390, 844),
  signatureNormalizedPreview: await imageRecord(resolve(root, telemetry.mobile.signatureNormalizedPreviewPath), 390, 844),
  viewportHarnessDisclosure: telemetry.capturePolicy.mobileHarness,
  finalGoldenMatrixAuthority: false,
});

const cropDefinitions = [
  { id: "front-terminator-and-ring-shadow", frameId: "saturn-cinematic-front", crop: { left: 300, top: 145, width: 430, height: 430 } },
  { id: "backlight-limb-and-backscatter", frameId: "saturn-cinematic-backlight", crop: { left: 245, top: 105, width: 610, height: 500 } },
  { id: "backlight-planet-to-ring-shadow-onset", frameId: "saturn-cinematic-backlight", crop: { left: 235, top: 285, width: 550, height: 315 } },
  { id: "ring-plane-bidirectional-shadow", frameId: "saturn-cinematic-ring-shadow", crop: { left: 225, top: 90, width: 620, height: 570 } },
];
const detailCrops = [];
for (const definition of cropDefinitions) {
  const frame = telemetry.frames.find((entry) => entry.frame === definition.frameId);
  const baselinePath = resolve(root, frame.baseline.path);
  const signaturePath = resolve(root, frame.signature.path);
  const baselineCropPath = resolve(evidenceRoot, `${definition.frameId}-v592-baseline-${definition.id}-100pct.png`);
  const signatureCropPath = resolve(evidenceRoot, `${definition.frameId}-v593-corrective-${definition.id}-100pct.png`);
  await atomicCrop(baselinePath, baselineCropPath, definition.crop);
  await atomicCrop(signaturePath, signatureCropPath, definition.crop);
  detailCrops.push(Object.freeze({
    ...definition,
    baseline: { ...(await fileRecord(baselineCropPath)), ...definition.crop, format: "png" },
    signature: { ...(await fileRecord(signatureCropPath)), ...definition.crop, format: "png" },
  }));
}

const mobileRawCrop = { left: 170, top: 280, width: 180, height: 270 };
const mobileBaselineCropPath = resolve(evidenceRoot, "saturn-mobile-front-v592-baseline-raw-compositor-100pct.png");
const mobileSignatureCropPath = resolve(evidenceRoot, "saturn-mobile-front-v593-corrective-raw-compositor-100pct.png");
await atomicCrop(resolve(root, mobileBaseline.path), mobileBaselineCropPath, mobileRawCrop);
await atomicCrop(resolve(root, mobileSignature.path), mobileSignatureCropPath, mobileRawCrop);
detailCrops.push(Object.freeze({
  id: "mobile-front-native-viewport-terminator",
  frameId: "saturn-cinematic-front-mobile-harness",
  crop: mobileRawCrop,
  baseline: { ...(await fileRecord(mobileBaselineCropPath)), ...mobileRawCrop, format: "png" },
  signature: { ...(await fileRecord(mobileSignatureCropPath)), ...mobileRawCrop, format: "png" },
  normalizationApplied: false,
}));

const desktopGradientRegion = { left: 250, right: 620, top: 250, bottom: 620 };
const backlightFrame = telemetry.frames.find((frame) => frame.frame === "saturn-cinematic-backlight");
const desktopBaselineGradient = await scanVerticalGradient(resolve(root, backlightFrame.baseline.path), desktopGradientRegion);
const desktopSignatureGradient = await scanVerticalGradient(resolve(root, backlightFrame.signature.path), desktopGradientRegion);
const desktopSignatureAtBaselinePeak = desktopSignatureGradient.gradientAt(desktopBaselineGradient.maximum.x);
const desktopSameAxisReduction = 1 - desktopSignatureAtBaselinePeak / desktopBaselineGradient.maximum.meanGradient255;
invariant(desktopSameAxisReduction >= 0.20, `v593-p5-desktop-hard-cut:${desktopSameAxisReduction}`);

// The native 390x844 viewport places Saturn's disk at x≈45..342,
// y≈275..575. Restrict this metric to the physical planet terminator so ring
// edges and the sky/UI cannot dominate the gradient peak.
const mobileGradientRegion = { left: 180, right: 320, top: 300, bottom: 520 };
const mobileBaselineGradient = await scanVerticalGradient(resolve(root, mobileBaseline.path), mobileGradientRegion);
const mobileSignatureGradient = await scanVerticalGradient(resolve(root, mobileSignature.path), mobileGradientRegion);
const mobileMaximumReduction = 1 - mobileSignatureGradient.maximum.meanGradient255 / mobileBaselineGradient.maximum.meanGradient255;
invariant(mobileMaximumReduction >= 0.10, `v593-p5-mobile-hard-cut:${mobileMaximumReduction}`);

const resourceCycles = telemetry.resourceCycles?.cycles ?? [];
invariant(resourceCycles.length === 8, "v593-p5-resource-cycle-count");
const baselineResources = resourceCycles.filter((entry) => entry.phase === "baseline");
const signatureResources = resourceCycles.filter((entry) => entry.phase === "signature");
invariant(baselineResources.length === 4 && signatureResources.length === 4, "v593-p5-resource-cycle-phases");
for (const entry of baselineResources) {
  invariant(entry.patchCount === 0, `v593-p5-baseline-release:${entry.cycle}`);
  invariant(entry.payload === scientificPayloadSha256, `v593-p5-baseline-resource-payload:${entry.cycle}`);
}
for (const entry of signatureResources) {
  invariant(entry.patchCount === 2, `v593-p5-signature-resource:${entry.cycle}`);
  invariant(entry.payload === scientificPayloadSha256, `v593-p5-signature-resource-payload:${entry.cycle}`);
}
for (const key of ["programs", "textures", "geometries", "gpuBytes"]) {
  invariant(new Set(baselineResources.map((entry) => entry[key])).size === 1, `v593-p5-baseline-resource-growth:${key}`);
  invariant(new Set(signatureResources.map((entry) => entry[key])).size === 1, `v593-p5-signature-resource-growth:${key}`);
}
const baselineProgramCount = baselineResources[0].programs;
const signatureProgramCount = signatureResources[0].programs;
invariant(signatureProgramCount - baselineProgramCount === 2, "v593-p5-signature-program-delta");
invariant(telemetry.resourceCycles.finalBaseline?.patchCount === 0, "v593-p5-final-baseline-release");
invariant(telemetry.resourceCycles.finalBaseline?.programs === baselineProgramCount, "v593-p5-final-baseline-programs");

const rotationSamples = telemetry.rotation?.samples ?? [];
invariant(rotationSamples.length === 4, "v593-p5-rotation-sample-count");
const pausedInitial = rotationSamples.find((sample) => sample.phase === "paused-initial");
const realRate = rotationSamples.find((sample) => sample.phase === "real-rate-2.6s");
const timeLapse = rotationSamples.find((sample) => sample.phase === "time-lapse-0.9s");
const pausedFinal = rotationSamples.find((sample) => sample.phase === "paused-final");
invariant(pausedInitial?.rate === 0 && pausedInitial?.policy === "paused", "v593-p5-rotation-paused-initial");
invariant(realRate?.rate === 1 && realRate?.policy === "real-rate" && Math.abs(realRate.rotationDeltaRad) > 1e-5, "v593-p5-rotation-real-rate");
invariant(timeLapse?.rate === 86_400 && timeLapse?.policy === "explicit-time-lapse" && Math.abs(timeLapse.rotationDeltaRad) > 0.1, "v593-p5-rotation-time-lapse");
invariant(pausedFinal?.rate === 0 && pausedFinal?.policy === "paused", "v593-p5-rotation-paused-final");
for (const sample of rotationSamples) {
  invariant(sample.payload === scientificPayloadSha256, `v593-p5-rotation-payload:${sample.phase}`);
  invariant(sample.w0Blocked === "bennu,kleopatra", `v593-p5-rotation-w0:${sample.phase}`);
  invariant(Math.abs(sample.periodDays - 0.44400926) < 1e-8, `v593-p5-rotation-period:${sample.phase}`);
}
const rotationEvidence = Object.freeze({
  samples: rotationSamples,
  before: await imageRecord(resolve(root, telemetry.rotation.beforePath), 1_280, 720),
  after: await imageRecord(resolve(root, telemetry.rotation.afterPath), 1_280, 720),
  fixedCamera: true,
  realRateSeparatedFromTimeLapse: true,
  presentationAccelerationWriteback: false,
});

const [bridgeText, shellText] = await Promise.all([readFile(bridgePath, "utf8"), readFile(shellPath, "utf8")]);
for (const token of [
  "float travelGate = smoothstep(-0.06, 0.16, intersection);",
  "float radialGate = smoothstep(-0.018, 0.026, normalizedRadius)",
  "float terminator = smoothstep(-0.46, 0.38, nDotLRaw);",
  "float nightBounce = (0.026 + atmosphericPath * 0.038) * (1.0 - terminator);",
  "float directionGate = smoothstep(-uPlanetRadius * 0.16, uPlanetRadius * 0.32, signedTowardPlanet);",
  "float penumbra = 1.0 - smoothstep(uPlanetRadius * 0.92, uPlanetRadius * 1.12, distanceToAxis);",
  "float shadowTransmission = mix(1.0, 0.16, planetShadow);",
  "analytic-ray-sphere-penumbra",
]) invariant(bridgeText.includes(token), `v593-p5-bridge-token:${token}`);
for (const token of [
  "data-atlas-v593-time-policy",
  "data-atlas-v593-rotation-pole-ra-deg",
  "data-atlas-v593-rotation-pole-dec-deg",
  "data-atlas-v593-rotation-prime-meridian-deg",
  "data-atlas-v593-rotation-period-days",
  'data-atlas-v593-rotation-w0-blocked="bennu,kleopatra"',
]) invariant(shellText.includes(token), `v593-p5-shell-token:${token}`);

const minimumMedianFps = Math.min(
  ...telemetry.frames.map((frame) => frame.signature.fpsMedian),
  mobileSignature.fpsMedian,
);
const maximumGpuBytes = Math.max(...telemetry.frames.map((frame) => frame.signature.gpuBytes));
const maximumDrawCalls = Math.max(...telemetry.frames.map((frame) => frame.signature.drawCalls));
const receipt = {
  version: "v593-p5-saturn-corrective-browser-code-gate-v1",
  generatedAt,
  status: "passed-current-dev-saturn-corrective-code-and-visual-gates-sealed-build-and-human-signoff-pending",
  candidate: {
    route: "/local-shadow-v593",
    formalProductPointer: "v263",
    additiveOnly: true,
  },
  scope: {
    currentSourceOwner: true,
    signaturePassesCodeImplemented: 6,
    signaturePassesComplete: 0,
    p4HistoricalPreCorrectiveEvidence: await fileRecord(p4ReceiptPath),
    finalGoldenFrameMatrixComplete: false,
    sealedBuildEvidence: false,
    humanVisualSignoff: false,
  },
  sourceMaterialCorrectness: {
    bridge: await fileRecord(bridgePath),
    shell: await fileRecord(shellPath),
    focusedTest: await fileRecord(testPath),
    viewportHarness: await fileRecord(harnessPath),
    builder: await fileRecord(builderPath),
    ringToPlanetShadow: "optical-depth-source-bound-travel-and-radial-soft-gates",
    planetTerminator: "wide-smooth-atmospheric-terminator-with-bounded-nightside-bounce",
    planetToRingShadow: "analytic-ray-sphere-soft-direction-gate-and-penumbra",
    ringScattering: "forward-and-backward-henyey-greenstein-source-optical-depth",
  },
  captures,
  mobileEvidence,
  detailCrops,
  hardCutInspection: {
    desktop: {
      baselinePeakX: desktopBaselineGradient.maximum.x,
      baselinePeakMeanGradient255: desktopBaselineGradient.maximum.meanGradient255,
      signatureAtBaselinePeakMeanGradient255: desktopSignatureAtBaselinePeak,
      reductionFraction: Number(desktopSameAxisReduction.toFixed(8)),
    },
    mobileNativeViewport: {
      regionPolicy: "planet-disk-terminator-only-excludes-ring-sky-and-ui",
      baselineMaximumMeanGradient255: mobileBaselineGradient.maximum.meanGradient255,
      signatureMaximumMeanGradient255: mobileSignatureGradient.maximum.meanGradient255,
      reductionFraction: Number(mobileMaximumReduction.toFixed(8)),
    },
    physicalPlanetToRingShadowRetained: true,
    abruptHalfPlanetOrHalfRingCutObservedAfterCorrective: false,
    finalHumanArtSignoff: false,
  },
  resourceLifecycle: {
    cycleCount: 4,
    baselinePatchCount: 0,
    signaturePatchCount: 2,
    texturesStable: true,
    geometriesStable: true,
    gpuBytesStable: true,
    baselineProgramCount,
    signatureProgramCount,
    programDelta: signatureProgramCount - baselineProgramCount,
    programsRestoreToBaseline: true,
    finalBaseline: telemetry.resourceCycles.finalBaseline,
  },
  rotation: rotationEvidence,
  browser: {
    runner: telemetry.runner,
    screenshotRunner: "Codex-in-app-browser",
    rendererTelemetryRunner: "Playwright CLI",
    currentDevNativeViewport: "1280x720",
    mobileInnerViewport: "390x844",
    mobilePhysicalDevice: false,
    telemetry: await fileRecord(telemetryPath),
    consoleWarningErrorCount: telemetry.console.count,
    singleCanvas: true,
    scientificPayloadSha256,
    scientificPayloadUniqueCount: new Set([
      ...telemetry.frames.flatMap((frame) => [frame.baseline.payload, frame.signature.payload]),
      ...mobileFrames.map((frame) => frame.payload),
      ...rotationSamples.map((sample) => sample.payload),
    ]).size,
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
invariant(receipt.browser.scientificPayloadUniqueCount === 1, "v593-p5-payload-identity");
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
  detailCropCount: detailCrops.length * 2,
  minimumMedianFps,
  maximumGpuBytes,
  maximumDrawCalls,
  desktopHardCutReductionFraction: receipt.hardCutInspection.desktop.reductionFraction,
  mobileHardCutReductionFraction: receipt.hardCutInspection.mobileNativeViewport.reductionFraction,
  resourceCycleCount: receipt.resourceLifecycle.cycleCount,
  rotationSampleCount: receipt.rotation.samples.length,
}, null, 2));
