import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const decodeReceiptPath = resolve(root, "docs/release/v591/venus-isis-decode-receipt-v591.json");
const acquisitionReceiptPath = resolve(root, "docs/release/v591/acquisition-assets-venus-alternative/venus-clrtopo-6600m-cube-path-alias-v591.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/venus-asset-overlay.json");
const buildReceiptPath = resolve(root, "docs/release/v591/venus-asset-build-receipt-v591.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/venus");
const temporaryRoot = resolve(root, "tmp/v591-venus-isis-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const desktopWidth = 4096;
const desktopHeight = 2048;
const mobileWidth = 2048;
const mobileHeight = 1024;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function verifySealed(value, label) {
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-venus-isis-build-${label}-seal`);
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
}
function runTool(executable, args, label) {
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", windowsHide: true });
  assert(result.status === 0, `${label}:${result.status}:${result.stderr || result.stdout}`);
}
function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}
function forceExactLongitudeSeam(rgb, width, height, channels) {
  for (let y = 0; y < height; y += 1) {
    const first = y * width * channels;
    const last = first + (width - 1) * channels;
    for (let channel = 0; channel < channels; channel += 1) rgb[last + channel] = rgb[first + channel];
  }
}
function percentileBounds(values) {
  const histogram = new Uint32Array(256);
  for (const value of values) histogram[value] += 1;
  const threshold = (ratio) => {
    const target = values.length * ratio;
    let count = 0;
    for (let value = 0; value < histogram.length; value += 1) {
      count += histogram[value];
      if (count >= target) return value;
    }
    return 255;
  };
  return { low: threshold(0.02), high: threshold(0.98) };
}
function derivePresentationChannels(rgb) {
  const luminance = Buffer.allocUnsafe(desktopWidth * desktopHeight);
  for (let pixel = 0; pixel < luminance.length; pixel += 1) {
    const offset = pixel * 3;
    luminance[pixel] = Math.max(0, Math.min(255, Math.round(
      rgb[offset] * 0.2126 + rgb[offset + 1] * 0.7152 + rgb[offset + 2] * 0.0722,
    )));
  }
  const range = percentileBounds(luminance);
  const inverseRange = 1 / Math.max(1, range.high - range.low);
  const height = Buffer.allocUnsafe(desktopWidth * desktopHeight);
  const normal = Buffer.allocUnsafe(desktopWidth * desktopHeight * 3);
  const roughness = Buffer.allocUnsafe(desktopWidth * desktopHeight);
  for (let y = 0; y < desktopHeight; y += 1) {
    const latitude = (0.5 - y / (desktopHeight - 1)) * Math.PI;
    const longitudeCompensation = 1 / Math.max(0.18, Math.cos(latitude));
    const up = Math.max(0, y - 1) * desktopWidth;
    const row = y * desktopWidth;
    const down = Math.min(desktopHeight - 1, y + 1) * desktopWidth;
    for (let x = 0; x < desktopWidth - 1; x += 1) {
      const left = x === 0 ? desktopWidth - 2 : x - 1;
      const right = x === desktopWidth - 2 ? 0 : x + 1;
      const encoded = Math.max(0, Math.min(255, Math.round((luminance[row + x] - range.low) * inverseRange * 255)));
      height[row + x] = encoded;
      const dx = (luminance[row + right] - luminance[row + left]) / 255 * longitudeCompensation;
      const dy = (luminance[up + x] - luminance[down + x]) / 255;
      let nx = -dx * 1.08;
      let ny = -dy * 1.08;
      let nz = 1;
      const inverseLength = 1 / Math.hypot(nx, ny, nz);
      nx *= inverseLength;
      ny *= inverseLength;
      nz *= inverseLength;
      const normalOffset = (row + x) * 3;
      normal[normalOffset] = Math.round((nx * 0.5 + 0.5) * 255);
      normal[normalOffset + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normal[normalOffset + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      const gradient = Math.min(1, Math.hypot(dx, dy));
      roughness[row + x] = Math.round((0.81 + gradient * 0.16) * 255);
    }
    const first = row;
    const last = row + desktopWidth - 1;
    height[last] = height[first];
    roughness[last] = roughness[first];
    for (let channel = 0; channel < 3; channel += 1) normal[last * 3 + channel] = normal[first * 3 + channel];
  }
  return { luminance, height, normal, roughness, range };
}
async function encodeAsset({ id, role, desktopPng, width, height, colorSpace, losslessFallback, rdoLambda }) {
  const liteDesktopQuality = role === "magellan-colorized-radar-surface" ? 82
    : role === "magellan-color-topography-derived-normal" ? 68
      : 62;
  const liteMobileQuality = role === "magellan-colorized-radar-surface" ? 78
    : role === "magellan-color-topography-derived-normal" ? 64
      : 58;
  const variants = {
    desktopKtx2: resolve(outputRoot, `full/desktop/${id}.ktx2`),
    desktopFallback: resolve(outputRoot, `full/desktop/${id}.webp`),
    mobileKtx2: resolve(outputRoot, `full/mobile/${id}.ktx2`),
    mobileFallback: resolve(outputRoot, `full/mobile/${id}.webp`),
    liteDesktop: resolve(outputRoot, `lite/desktop/${id}.webp`),
    liteMobile: resolve(outputRoot, `lite/mobile/${id}.webp`),
  };
  Object.values(variants).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const mobilePng = resolve(temporaryRoot, `${id}-mobile-${mobileWidth}x${mobileHeight}.png`);
  const liteDesktopPng = resolve(temporaryRoot, `${id}-lite-desktop-1024x512.png`);
  const liteMobilePng = resolve(temporaryRoot, `${id}-lite-mobile-512x256.png`);
  await sharp(desktopPng, { limitInputPixels: false }).resize(mobileWidth, mobileHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(mobilePng);
  await sharp(desktopPng, { limitInputPixels: false }).resize(1024, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(liteDesktopPng);
  await sharp(desktopPng, { limitInputPixels: false }).resize(512, 256, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(liteMobilePng);
  const ktxArgs = (output, input) => [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda),
    "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap",
    "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none",
    output, input,
  ];
  for (const [target, input, label] of [
    [variants.desktopKtx2, desktopPng, "desktop"],
    [variants.mobileKtx2, mobilePng, "mobile"],
  ]) {
    const part = `${target}.${process.pid}.part`;
    rmSync(part, { force: true });
    runTool(toktx, ktxArgs(part, input), `v591-venus-isis-${id}-${label}-ktx2`);
    rmSync(target, { force: true });
    renameSync(part, target);
  }
  const webp = async (input, output, quality, lossless = losslessFallback) => atomicWrite(output, await sharp(input, { limitInputPixels: false })
    .webp(lossless ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true }).toBuffer());
  await webp(desktopPng, variants.desktopFallback, 94);
  await webp(mobilePng, variants.mobileFallback, 92);
  await webp(liteDesktopPng, variants.liteDesktop, liteDesktopQuality, false);
  await webp(liteMobilePng, variants.liteMobile, liteMobileQuality, false);
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id,
    body: "venus",
    role,
    variants: {
      desktopKtx2: outputRecord(variants.desktopKtx2, `/textures/candidate-v591/venus/full/desktop/${id}.ktx2`, width, height, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(variants.desktopFallback, `/textures/candidate-v591/venus/full/desktop/${id}.webp`, width, height, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-94"),
      mobileKtx2: outputRecord(variants.mobileKtx2, `/textures/candidate-v591/venus/full/mobile/${id}.ktx2`, mobileWidth, mobileHeight, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(variants.mobileFallback, `/textures/candidate-v591/venus/full/mobile/${id}.webp`, mobileWidth, mobileHeight, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-92"),
      liteDesktop: outputRecord(variants.liteDesktop, `/textures/candidate-v591/venus/lite/desktop/${id}.webp`, 1024, 512, "webp", colorSpace, `webp-quality-${liteDesktopQuality}-presentation-lite`),
      liteMobile: outputRecord(variants.liteMobile, `/textures/candidate-v591/venus/lite/mobile/${id}.webp`, 512, 256, "webp", colorSpace, `webp-quality-${liteMobileQuality}-presentation-lite`),
    },
  };
}

const decodeReceipt = JSON.parse(readFileSync(decodeReceiptPath, "utf8"));
const acquisition = JSON.parse(readFileSync(acquisitionReceiptPath, "utf8"));
verifySealed(decodeReceipt, "decode");
verifySealed(acquisition, "acquisition");
assert(decodeReceipt.status === "decoded-equirectangular-awaiting-visual-qa", "v591-venus-isis-decode-status");
assert(decodeReceipt.acquisitionReceiptSha256 === acquisition.receiptSha256, "v591-venus-isis-receipt-chain");
assert(decodeReceipt.layout.projectionName === "Equirectangular" && decodeReceipt.layout.samples === 5761 && decodeReceipt.layout.lines === 2880, "v591-venus-isis-layout");
assert(decodeReceipt.policies.reprojectionPerformed === false && decodeReceipt.policies.measuredTopographyClaim === false, "v591-venus-isis-authority");
const decodedPath = resolve(root, decodeReceipt.outputs.decoded.path);
const decodedBytes = readFileSync(decodedPath);
assert(decodedBytes.byteLength === decodeReceipt.outputs.decoded.bytes && sha256(decodedBytes) === decodeReceipt.outputs.decoded.sha256, "v591-venus-isis-decoded-identity");
assert(statSync(decodedPath).size > 0, "v591-venus-isis-decoded-empty");

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const resized = await sharp(decodedPath, { limitInputPixels: false })
  .resize(desktopWidth, desktopHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
assert(resized.info.width === desktopWidth && resized.info.height === desktopHeight && resized.info.channels === 3, "v591-venus-isis-resize");
forceExactLongitudeSeam(resized.data, desktopWidth, desktopHeight, 3);
const derived = derivePresentationChannels(resized.data);
const surfacePng = resolve(temporaryRoot, "venus-surface-4096x2048.png");
const normalPng = resolve(temporaryRoot, "venus-normal-4096x2048.png");
const roughnessPng = resolve(temporaryRoot, "venus-roughness-2048x1024.png");
const heightPng = resolve(temporaryRoot, "venus-height-4096x2048.png");
await sharp(resized.data, { raw: { width: desktopWidth, height: desktopHeight, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(surfacePng);
await sharp(derived.normal, { raw: { width: desktopWidth, height: desktopHeight, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(normalPng);
await sharp(derived.roughness, { raw: { width: desktopWidth, height: desktopHeight, channels: 1 }, limitInputPixels: false }).resize(2048, 1024, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(roughnessPng);
await sharp(derived.height, { raw: { width: desktopWidth, height: desktopHeight, channels: 1 }, limitInputPixels: false }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(heightPng);

const encoded = [];
encoded.push(await encodeAsset({ id: "venus-surface", role: "magellan-colorized-radar-surface", desktopPng: surfacePng, width: 4096, height: 2048, colorSpace: "srgb", losslessFallback: false, rdoLambda: 0.72 }));
encoded.push(await encodeAsset({ id: "venus-normal", role: "magellan-color-topography-derived-normal", desktopPng: normalPng, width: 4096, height: 2048, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.45 }));
encoded.push(await encodeAsset({ id: "venus-roughness", role: "magellan-color-topography-derived-roughness", desktopPng: roughnessPng, width: 2048, height: 1024, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.55 }));
encoded.push(await encodeAsset({ id: "venus-height", role: "magellan-color-topography-presentation-relief", desktopPng: heightPng, width: 4096, height: 2048, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.35 }));

const source = {
  id: acquisition.asset.id,
  acquisitionReceiptSha256: acquisition.receiptSha256,
  path: acquisition.asset.outputPath,
  url: acquisition.asset.sourceUrl,
  finalUrl: acquisition.asset.finalUrl,
  host: new URL(acquisition.asset.finalUrl).hostname,
  license: acquisition.asset.license,
  bytes: acquisition.asset.bytes,
  sha256: acquisition.asset.sha256,
  width: acquisition.asset.width,
  height: acquisition.asset.height,
  bitDepth: acquisition.asset.bitsPerSample,
  observationIdentity: acquisition.asset.observationIdentity,
  observationLimit: acquisition.asset.observationLimit,
};
const derivation = {
  tool: "v591-isis-tile-cube-decoder+sharp+KTX-Software",
  version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
  parameters: "USGS/PDS ISIS Tile 823x1440, 7x2 tiles per RGB band; direct equirectangular decode; Lanczos3 4096x2048; exact longitude seam; luminance-bounded presentation normal/roughness/relief; UASTC RDO single-thread",
  decodeReceiptSha256: decodeReceipt.receiptSha256,
  sourceLuminancePercentiles: derived.range,
  reliefScaleRadiusFraction: 0.00115,
  normalReliefGain: 1.08,
  observationLimit: "USGS Magellan C3-MDIR false-color radar/topography mosaic. Derived normal, roughness and relief are presentation channels and are not measured elevation, optical color, photometry or scientific payload.",
};
const assets = encoded.map((asset) => ({
  ...asset,
  source,
  derivation,
  fullQualityMinimum: {
    desktop: { width: asset.variants.desktopKtx2.width, height: asset.variants.desktopKtx2.height },
    mobile: { width: asset.variants.mobileKtx2.width, height: asset.variants.mobileKtx2.height },
  },
  presentationOnly: true,
}));
const unsignedOverlay = {
  version: "v591-venus-asset-overlay-v1",
  generatedAt,
  status: "venus-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  sourceReceiptSha256s: [acquisition.receiptSha256],
  metadataReceiptSha256: acquisition.asset.metadataReceiptSha256,
  decodeReceiptSha256: decodeReceipt.receiptSha256,
  noNetworkRequestsPerformed: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  surfaceCoverage: {
    projection: "equirectangular",
    longitudeEastDeg: [-180, 180],
    latitudeDeg: [-90, 90],
    sourcePixels: [5761, 2880],
    reprojectionPerformed: false,
    exactLongitudeSeam: true,
    measuredTopographyClaim: false,
    opticalColorClaim: false,
  },
  cloudModel: {
    id: "venus-physical-inspired-cloud-primary-v591",
    observationTextureClaim: false,
    resourceMissingFallback: false,
    presentationOnly: true,
  },
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
  },
  assets,
  blockers: [],
};
const overlay = { ...unsignedOverlay, receiptSha256: canonicalSha(unsignedOverlay) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
const generatedSource = readFileSync(generatedConstantsPath, "utf8");
const generatedConstant = `export const CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`;
const nextGeneratedSource = generatedSource.replace(
  /export const CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591 = "[a-f0-9]{64}" as const;/,
  generatedConstant,
);
assert(nextGeneratedSource.includes(generatedConstant), "v591-venus-isis-generated-constant-replacement");
if (nextGeneratedSource !== generatedSource) atomicWrite(generatedConstantsPath, Buffer.from(nextGeneratedSource, "utf8"));
const unsignedBuildReceipt = {
  version: "v591-venus-isis-asset-build-receipt-v1",
  generatedAt,
  status: "assets-derived-awaiting-runtime-and-browser-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  decodeReceiptSha256: decodeReceipt.receiptSha256,
  overlayReceiptSha256: overlay.receiptSha256,
  noNetworkRequestsPerformed: true,
  deterministicSingleThreadCompression: true,
  assets: assets.map((asset) => ({
    id: asset.id,
    role: asset.role,
    variants: Object.values(asset.variants).map((variant) => ({ url: variant.url, bytes: variant.bytes, sha256: variant.sha256 })),
  })),
  authorityState: overlay.authorityState,
};
const buildReceipt = { ...unsignedBuildReceipt, receiptSha256: canonicalSha(unsignedBuildReceipt) };
atomicWrite(buildReceiptPath, Buffer.from(`${JSON.stringify(buildReceipt, null, 2)}\n`, "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  status: buildReceipt.status,
  overlayReceiptSha256: overlay.receiptSha256,
  decodeReceiptSha256: decodeReceipt.receiptSha256,
  luminancePercentiles: derived.range,
  assets: assets.map((asset) => ({ id: asset.id, role: asset.role, desktopBytes: asset.variants.desktopKtx2.bytes, fallbackBytes: asset.variants.desktopFallback.bytes })),
  buildReceiptSha256: buildReceipt.receiptSha256,
}, null, 2));
