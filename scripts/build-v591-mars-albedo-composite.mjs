import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-mars.json");
const directIdentityAuditPath = resolve(root, "docs/release/v591/mars-albedo-identity-audit.json");
const fullSourceBlockPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-usgs-full.json");
const nasa3dTiffBlockPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-nasa3d.json");
const nasa3dJpegBlockPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-nasa3d-jpeg.json");
const baselineManifestPath = resolve(root, "public/data/visual-restoration-v588/manifest.json");
const blockedOverlayPath = resolve(root, "public/data/celestial-convergence-v591/mars-asset-overlay.json");
const compositeAuditPath = resolve(root, "docs/release/v591/mars-albedo-composite-audit.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/mars");
const temporaryRoot = resolve(root, "tmp/v591-mars-albedo-composite");
const ktx = resolve(root, "tools/ktx/4.4.2/bin/ktx.exe");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const DESKTOP_WIDTH = 8192;
const DESKTOP_HEIGHT = 4096;
const MOBILE_WIDTH = 2048;
const MOBILE_HEIGHT = 1024;
const DETAIL_BLUR_SIGMA = 10;
const DETAIL_GAIN = 0.62;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function verifySealed(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === document[field], `v591-mars-composite-${label}-seal`);
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function runTool(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}
function publicPath(url) {
  assert(url.startsWith("/") && !url.startsWith("//"), `v591-mars-composite-public-url:${url}`);
  const decoded = decodeURIComponent(url.split("?")[0]);
  assert(!decoded.includes("\\") && !decoded.split("/").includes(".."), `v591-mars-composite-public-path:${url}`);
  return resolve(root, "public", decoded.replace(/^\/+/, ""));
}
function pearson(left, right) {
  assert(left.length === right.length, "v591-mars-composite-correlation-length");
  let sumLeft = 0;
  let sumRight = 0;
  let sumLeft2 = 0;
  let sumRight2 = 0;
  let sumProduct = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    sumLeft += a;
    sumRight += b;
    sumLeft2 += a * a;
    sumRight2 += b * b;
    sumProduct += a * b;
  }
  const count = left.length;
  const covariance = sumProduct - sumLeft * sumRight / count;
  const varianceLeft = sumLeft2 - sumLeft * sumLeft / count;
  const varianceRight = sumRight2 - sumRight * sumRight / count;
  return covariance / Math.sqrt(Math.max(1e-12, varianceLeft * varianceRight));
}
function gradientMagnitude(luminance, width, height) {
  const gradient = new Float32Array(luminance.length);
  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const left = luminance[row + (x === 0 ? width - 1 : x - 1)];
      const right = luminance[row + (x === width - 1 ? 0 : x + 1)];
      const up = luminance[row - width + x];
      const down = luminance[row + width + x];
      gradient[row + x] = Math.hypot(right - left, down - up);
    }
  }
  return gradient;
}
async function resizeSeamSafe(input, width, height, output) {
  const { data, info } = await sharp(input, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    const first = y * info.width * info.channels;
    const seam = (y * info.width + info.width - 1) * info.channels;
    for (let channel = 0; channel < info.channels; channel += 1) data[seam + channel] = data[first + channel];
  }
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
function outputRecord(path, url, width, height, format, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "srgb", compression };
}
async function encodeAlbedo(desktopPng) {
  const paths = {
    desktopKtx2: resolve(outputRoot, "full/desktop/mars-albedo.ktx2"),
    desktopFallback: resolve(outputRoot, "full/desktop/mars-albedo.webp"),
    mobileKtx2: resolve(outputRoot, "full/mobile/mars-albedo.ktx2"),
    mobileFallback: resolve(outputRoot, "full/mobile/mars-albedo.webp"),
    liteDesktop: resolve(outputRoot, "lite/desktop/mars-albedo.webp"),
    liteMobile: resolve(outputRoot, "lite/mobile/mars-albedo.webp"),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const desktopFallbackPng = resolve(temporaryRoot, "mars-albedo-desktop-fallback.png");
  const mobilePng = resolve(temporaryRoot, "mars-albedo-mobile.png");
  const liteDesktopPng = resolve(temporaryRoot, "mars-albedo-lite-desktop.png");
  const liteMobilePng = resolve(temporaryRoot, "mars-albedo-lite-mobile.png");
  await resizeSeamSafe(desktopPng, 4096, 2048, desktopFallbackPng);
  await resizeSeamSafe(desktopPng, MOBILE_WIDTH, MOBILE_HEIGHT, mobilePng);
  await resizeSeamSafe(desktopPng, 1024, 512, liteDesktopPng);
  await resizeSeamSafe(desktopPng, 512, 256, liteMobilePng);
  const ktxArgs = (output, input) => ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "0.75", "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", "srgb", output, input];
  for (const [path, input, label] of [[paths.desktopKtx2, desktopPng, "desktop"], [paths.mobileKtx2, mobilePng, "mobile"]]) {
    const partial = `${path}.${process.pid}.part`;
    runTool(toktx, ktxArgs(partial, input), `v591-mars-albedo-${label}-ktx2`);
    rmSync(path, { force: true });
    renameSync(partial, path);
  }
  for (const [input, output, quality] of [
    [desktopFallbackPng, paths.desktopFallback, 94],
    [mobilePng, paths.mobileFallback, 94],
    [liteDesktopPng, paths.liteDesktop, 90],
    [liteMobilePng, paths.liteMobile, 90],
  ]) atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer());
  const compression = "uastc-q2-rdo-0.75-single-thread-zstd10-mipmapped";
  return {
    id: "mars-albedo",
    body: "mars",
    role: "usgs-viking-low-frequency+nasa-v588-high-frequency-observational-composite",
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, "/textures/candidate-v591/mars/full/desktop/mars-albedo.ktx2", DESKTOP_WIDTH, DESKTOP_HEIGHT, "ktx2", compression),
      desktopFallback: outputRecord(paths.desktopFallback, "/textures/candidate-v591/mars/full/desktop/mars-albedo.webp", 4096, 2048, "webp", "webp-quality-94"),
      mobileKtx2: outputRecord(paths.mobileKtx2, "/textures/candidate-v591/mars/full/mobile/mars-albedo.ktx2", MOBILE_WIDTH, MOBILE_HEIGHT, "ktx2", compression),
      mobileFallback: outputRecord(paths.mobileFallback, "/textures/candidate-v591/mars/full/mobile/mars-albedo.webp", MOBILE_WIDTH, MOBILE_HEIGHT, "webp", "webp-quality-94"),
      liteDesktop: outputRecord(paths.liteDesktop, "/textures/candidate-v591/mars/lite/desktop/mars-albedo.webp", 1024, 512, "webp", "webp-quality-90"),
      liteMobile: outputRecord(paths.liteMobile, "/textures/candidate-v591/mars/lite/mobile/mars-albedo.webp", 512, 256, "webp", "webp-quality-90"),
    },
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
const directIdentityAudit = JSON.parse(readFileSync(directIdentityAuditPath, "utf8"));
const fullSourceBlock = JSON.parse(readFileSync(fullSourceBlockPath, "utf8"));
const nasa3dTiffBlock = JSON.parse(readFileSync(nasa3dTiffBlockPath, "utf8"));
const nasa3dJpegBlock = JSON.parse(readFileSync(nasa3dJpegBlockPath, "utf8"));
const baselineManifest = JSON.parse(readFileSync(baselineManifestPath, "utf8"));
const blockedOverlay = JSON.parse(readFileSync(blockedOverlayPath, "utf8"));
for (const [document, field, label] of [
  [acquisition, "receiptSha256", "acquisition"],
  [directIdentityAudit, "receiptSha256", "direct-identity-audit"],
  [fullSourceBlock, "receiptSha256", "full-source-block"],
  [nasa3dTiffBlock, "receiptSha256", "nasa3d-tiff-block"],
  [nasa3dJpegBlock, "receiptSha256", "nasa3d-jpeg-block"],
  [baselineManifest, "manifestSha256", "v588-manifest"],
  [blockedOverlay, "receiptSha256", "terrain-overlay"],
]) verifySealed(document, field, label);
assert(acquisition.status === "acquired-single-request-no-retry", "v591-mars-composite-acquisition-status");
assert(directIdentityAudit.status === "blocked-identity-mismatch", "v591-mars-composite-preserve-direct-negative");
assert(fullSourceBlock.status === "blocked-resource-throughput", "v591-mars-composite-preserve-full-negative");
assert(nasa3dTiffBlock.error === "v591-mars-nasa3d-dimensions:1440x720", "v591-mars-composite-tiff-negative");
assert(nasa3dJpegBlock.error === "v591-mars-nasa3d-jpeg-dimensions:1440x720", "v591-mars-composite-jpeg-negative");
assert(blockedOverlay.status === "mars-mola-terrain-derived-albedo-blocked" && blockedOverlay.assets.length === 3, "v591-mars-composite-terrain-baseline");

const referenceSource = acquisition.assets.find((asset) => asset.id === "mars-albedo-source-v591");
const baselineAsset = baselineManifest.assets.find((asset) => asset.id === "mars-albedo");
assert(referenceSource?.width === 1024 && referenceSource?.height === 512, "v591-mars-composite-reference-dimensions");
assert(referenceSource.license?.id === "NASA-USGS-public-domain", "v591-mars-composite-reference-license");
assert(baselineAsset?.primary?.dimensions?.width === DESKTOP_WIDTH && baselineAsset?.primary?.dimensions?.height === DESKTOP_HEIGHT, "v591-mars-composite-detail-dimensions");
assert(baselineAsset.license?.id === "NASA-public-domain-and-project-source-manifests", "v591-mars-composite-detail-license");
const referencePath = resolve(root, referenceSource.outputPath);
const baselineKtx2Path = publicPath(baselineAsset.primary.url);
const referenceBytes = readFileSync(referencePath);
const baselineKtx2Bytes = readFileSync(baselineKtx2Path);
assert(referenceBytes.byteLength === referenceSource.bytes && sha256(referenceBytes) === referenceSource.sha256, "v591-mars-composite-reference-drift");
assert(baselineKtx2Bytes.byteLength === baselineAsset.primary.bytes && sha256(baselineKtx2Bytes) === baselineAsset.primary.sha256, "v591-mars-composite-detail-drift");

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const detailPng = resolve(temporaryRoot, "mars-v588-detail.png");
const compositePng = resolve(temporaryRoot, "mars-albedo-composite.png");
runTool(ktx, ["extract", "--transcode", "rgba8", "--level", "0", baselineKtx2Path, detailPng], "v591-mars-composite-extract-v588");
const detailMetadata = await sharp(detailPng, { limitInputPixels: false }).metadata();
assert(detailMetadata.width === DESKTOP_WIDTH && detailMetadata.height === DESKTOP_HEIGHT, "v591-mars-composite-extracted-dimensions");
const base = await sharp(referenceBytes, { limitInputPixels: false }).resize(DESKTOP_WIDTH, DESKTOP_HEIGHT, { fit: "fill", kernel: sharp.kernel.lanczos3 }).removeAlpha().raw().toBuffer();
const detail = await sharp(detailPng, { limitInputPixels: false }).removeAlpha().raw().toBuffer();
const detailLow = await sharp(detailPng, { limitInputPixels: false }).blur(DETAIL_BLUR_SIGMA).removeAlpha().raw().toBuffer();
assert(base.length === detail.length && detail.length === detailLow.length && base.length === DESKTOP_WIDTH * DESKTOP_HEIGHT * 3, "v591-mars-composite-raw-length");
const composite = Buffer.allocUnsafe(base.length);
let residualSquared = 0;
for (let offset = 0; offset < composite.length; offset += 3) {
  const residual = (
    (detail[offset] - detailLow[offset]) * 0.2126
    + (detail[offset + 1] - detailLow[offset + 1]) * 0.7152
    + (detail[offset + 2] - detailLow[offset + 2]) * 0.0722
  ) * DETAIL_GAIN;
  residualSquared += residual * residual;
  composite[offset] = Math.max(0, Math.min(255, Math.round(base[offset] + residual)));
  composite[offset + 1] = Math.max(0, Math.min(255, Math.round(base[offset + 1] + residual)));
  composite[offset + 2] = Math.max(0, Math.min(255, Math.round(base[offset + 2] + residual)));
}
for (let y = 0; y < DESKTOP_HEIGHT; y += 1) {
  const first = y * DESKTOP_WIDTH * 3;
  const seam = (y * DESKTOP_WIDTH + DESKTOP_WIDTH - 1) * 3;
  composite[seam] = composite[first];
  composite[seam + 1] = composite[first + 1];
  composite[seam + 2] = composite[first + 2];
}
await sharp(composite, { raw: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, channels: 3 }, limitInputPixels: false })
  .png({ compressionLevel: 8, adaptiveFiltering: true })
  .toFile(compositePng);

const auditWidth = 256;
const auditHeight = 128;
const referenceAudit = await sharp(referenceBytes, { limitInputPixels: false }).resize(auditWidth, auditHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 }).greyscale().raw().toBuffer();
const compositeAudit = await sharp(compositePng, { limitInputPixels: false }).resize(auditWidth, auditHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 }).greyscale().raw().toBuffer();
const thresholds = { luminanceCorrelationMinimum: 0.8, gradientCorrelationMinimum: 0.5 };
const comparison = {
  width: auditWidth,
  height: auditHeight,
  luminanceCorrelation: pearson(referenceAudit, compositeAudit),
  gradientCorrelation: pearson(gradientMagnitude(referenceAudit, auditWidth, auditHeight), gradientMagnitude(compositeAudit, auditWidth, auditHeight)),
  thresholds,
};
assert(comparison.luminanceCorrelation >= thresholds.luminanceCorrelationMinimum, "v591-mars-composite-luminance-threshold");
assert(comparison.gradientCorrelation >= thresholds.gradientCorrelationMinimum, "v591-mars-composite-gradient-threshold");

const albedo = await encodeAlbedo(compositePng);
const detailResidualRms = Math.sqrt(residualSquared / (DESKTOP_WIDTH * DESKTOP_HEIGHT));
const auditUnsigned = {
  version: "v591-mars-albedo-composite-audit-v1",
  generatedAt,
  status: "passed-observational-composite",
  directIdentityNegativeReceiptSha256: directIdentityAudit.receiptSha256,
  fullSourceThroughputNegativeReceiptSha256: fullSourceBlock.receiptSha256,
  nasa3dTiffNegativeReceiptSha256: nasa3dTiffBlock.receiptSha256,
  nasa3dJpegNegativeReceiptSha256: nasa3dJpegBlock.receiptSha256,
  sources: {
    lowFrequencyAlbedo: {
      path: referenceSource.outputPath,
      url: referenceSource.sourceUrl,
      bytes: referenceSource.bytes,
      sha256: referenceSource.sha256,
      width: referenceSource.width,
      height: referenceSource.height,
      license: referenceSource.license,
      identity: referenceSource.observationIdentity,
      role: "USGS Viking low-frequency color and albedo anchor",
    },
    highFrequencyResidual: {
      path: `public/${baselineAsset.primary.url.replace(/^\/+/, "")}`,
      bytes: baselineAsset.primary.bytes,
      sha256: baselineAsset.primary.sha256,
      width: baselineAsset.primary.dimensions.width,
      height: baselineAsset.primary.dimensions.height,
      license: baselineAsset.license,
      role: "read-only NASA-admitted high-frequency luminance residual; no low-frequency color authority",
    },
  },
  derivation: {
    tool: "KTX-Software+sharp+v591-periodic-high-pass-composite",
    version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
    parameters: {
      outputDimensions: `${DESKTOP_WIDTH}x${DESKTOP_HEIGHT}`,
      lowFrequencyResize: "lanczos3",
      detailBlurSigma: DETAIL_BLUR_SIGMA,
      detailGain: DETAIL_GAIN,
      detailChannel: "linear-luminance-residual-applied-equally-to-srgb-channels",
      longitudeSeam: "last-column-exact-copy-of-first-column",
      generativeOrAiDetail: false,
    },
    detailResidualRms,
  },
  comparison,
  claims: {
    directEightKilometreUsGsProduct: false,
    usgsPreviewUpscaledAndPresentedAsNativeDetail: false,
    observationalComposite: true,
    presentationOnly: true,
    scientificPayloadWriteback: false,
  },
  output: albedo.variants,
};
const compositeAuditReceipt = { ...auditUnsigned, receiptSha256: canonicalSha(auditUnsigned) };
atomicWrite(compositeAuditPath, Buffer.from(`${JSON.stringify(compositeAuditReceipt, null, 2)}\n`, "utf8"));

const albedoAsset = {
  ...albedo,
  sources: compositeAuditReceipt.sources,
  compositeAuditReceiptSha256: compositeAuditReceipt.receiptSha256,
  derivation: compositeAuditReceipt.derivation,
  fullQualityMinimum: { desktop: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT }, mobile: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT } },
  observationDisclosure: "USGS 1024 Viking albedo controls low-frequency appearance; the read-only NASA 8K asset contributes only a bounded high-pass residual. This is not a native 8K USGS product.",
  presentationOnly: true,
};
const overlayUnsigned = {
  ...blockedOverlay,
  version: "v591-mars-asset-overlay-v2",
  status: "mars-viking-usgs-composite-mola-terrain-admitted",
  albedoCompositeAuditReceiptSha256: compositeAuditReceipt.receiptSha256,
  preservedNegativeEvidence: {
    directIdentityAuditReceiptSha256: directIdentityAudit.receiptSha256,
    fullAlbedoBlockedReceiptSha256: fullSourceBlock.receiptSha256,
    nasa3dTiffBlockedReceiptSha256: nasa3dTiffBlock.receiptSha256,
    nasa3dJpegBlockedReceiptSha256: nasa3dJpegBlock.receiptSha256,
  },
  noNetworkRequestsPerformed: true,
  blockers: [],
  assets: [albedoAsset, ...blockedOverlay.assets],
};
delete overlayUnsigned.receiptSha256;
const overlay = { ...overlayUnsigned, receiptSha256: canonicalSha(overlayUnsigned) };
atomicWrite(blockedOverlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));

const overlays = Object.fromEntries([
  ["SUN", "sun"], ["EARTH", "earth"], ["MOON", "moon"], ["MARS", "mars"], ["JUPITER", "jupiter"], ["SATURN", "saturn"],
].map(([constant, body]) => [constant, JSON.parse(readFileSync(resolve(root, `public/data/celestial-convergence-v591/${body}-asset-overlay.json`), "utf8"))]));
for (const [name, value] of Object.entries(overlays)) verifySealed(value, "receiptSha256", `${name.toLowerCase()}-overlay`);
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Sun, Earth, Moon, Mars, Jupiter, and Saturn asset overlays.",
  ...Object.entries(overlays).map(([name, value]) => `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = "${value.receiptSha256}" as const;`),
  "",
].join("\n"), "utf8"));

rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({
  status: overlay.status,
  comparison,
  detailResidualRms,
  albedo: Object.fromEntries(Object.entries(albedo.variants).map(([name, variant]) => [name, { bytes: variant.bytes, sha256: variant.sha256, width: variant.width, height: variant.height }])),
  compositeAuditReceiptSha256: compositeAuditReceipt.receiptSha256,
  overlayReceiptSha256: overlay.receiptSha256,
}, null, 2));
