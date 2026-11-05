import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-jupiter.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/jupiter-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/jupiter");
const temporaryRoot = resolve(root, "tmp/v591-jupiter-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
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
  assert(canonicalSha(unsigned) === document[field], `v591-jupiter-${label}-seal`);
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
function duplicateSeam(raw, width, height, channels) {
  for (let y = 0; y < height; y += 1) {
    const left = y * width * channels;
    const right = (y * width + width - 1) * channels;
    for (let channel = 0; channel < channels; channel += 1) raw[right + channel] = raw[left + channel];
  }
}
async function writeSeamSafePng(input, width, height, output) {
  const { data, info } = await sharp(input, { limitInputPixels: false }).resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 }).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  duplicateSeam(data, info.width, info.height, info.channels);
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
async function resizeSeamSafe(input, width, height, output) {
  const { data, info } = await sharp(input, { limitInputPixels: false }).resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 }).raw().toBuffer({ resolveWithObject: true });
  duplicateSeam(data, info.width, info.height, info.channels);
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}
async function encodeAsset({ id, role, desktopPng, desktopWidth, desktopHeight, colorSpace, lossless, rdoLambda }) {
  const mobileWidth = 2048;
  const mobileHeight = 1024;
  const paths = {
    desktopKtx2: resolve(outputRoot, `full/desktop/${id}.ktx2`), desktopFallback: resolve(outputRoot, `full/desktop/${id}.webp`),
    mobileKtx2: resolve(outputRoot, `full/mobile/${id}.ktx2`), mobileFallback: resolve(outputRoot, `full/mobile/${id}.webp`),
    liteDesktop: resolve(outputRoot, `lite/desktop/${id}.webp`), liteMobile: resolve(outputRoot, `lite/mobile/${id}.webp`),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const mobilePng = resolve(temporaryRoot, `${id}-mobile.png`);
  const liteDesktopPng = resolve(temporaryRoot, `${id}-lite-desktop.png`);
  const liteMobilePng = resolve(temporaryRoot, `${id}-lite-mobile.png`);
  await resizeSeamSafe(desktopPng, mobileWidth, mobileHeight, mobilePng);
  await resizeSeamSafe(desktopPng, 1024, 512, liteDesktopPng);
  await resizeSeamSafe(desktopPng, 512, 256, liteMobilePng);
  const ktxArgs = (output, input) => ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda), "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none", output, input];
  for (const [path, input, label] of [[paths.desktopKtx2, desktopPng, "desktop"], [paths.mobileKtx2, mobilePng, "mobile"]]) {
    const partial = `${path}.${process.pid}.part`;
    runTool(toktx, ktxArgs(partial, input), `v591-${id}-${label}-ktx2`);
    rmSync(path, { force: true });
    renameSync(partial, path);
  }
  const encodeWebp = async (input, output, quality) => atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp(lossless ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true }).toBuffer());
  await encodeWebp(desktopPng, paths.desktopFallback, 94);
  await encodeWebp(mobilePng, paths.mobileFallback, 92);
  await encodeWebp(liteDesktopPng, paths.liteDesktop, 88);
  await encodeWebp(liteMobilePng, paths.liteMobile, 86);
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id, body: "jupiter", role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/jupiter/full/desktop/${id}.ktx2`, desktopWidth, desktopHeight, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/jupiter/full/desktop/${id}.webp`, desktopWidth, desktopHeight, "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-94"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/jupiter/full/mobile/${id}.ktx2`, mobileWidth, mobileHeight, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/jupiter/full/mobile/${id}.webp`, mobileWidth, mobileHeight, "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-92"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/jupiter/lite/desktop/${id}.webp`, 1024, 512, "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-88"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/jupiter/lite/mobile/${id}.webp`, 512, 256, "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-86"),
    },
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
assert(acquisition.status === "acquired-single-request-no-retry" && acquisition.automaticRetryPerformed === false && acquisition.asset?.id === "jupiter-cassini-albedo-source-v591", "v591-jupiter-acquisition-contract");
const source = acquisition.asset;
const sourcePath = resolve(root, source.outputPath);
const sourceBytes = readFileSync(sourcePath);
assert(sourceBytes.byteLength === source.bytes && sha256(sourceBytes) === source.sha256, "v591-jupiter-source-drift");
assert(new URL(source.finalUrl).hostname === "assets.science.nasa.gov" && source.license?.id === "NASA-JPL-public-domain", "v591-jupiter-source-provenance");

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const albedoPng = resolve(temporaryRoot, "jupiter-albedo.png");
await writeSeamSafePng(sourcePath, 4096, 2048, albedoPng);
const maskWidth = 2048;
const maskHeight = 1024;
const { data: color } = await sharp(sourcePath, { limitInputPixels: false }).resize(maskWidth, maskHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 }).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
const rowMean = new Float64Array(maskHeight);
let globalMean = 0;
for (let y = 0; y < maskHeight; y += 1) {
  let sum = 0;
  for (let x = 0; x < maskWidth; x += 1) {
    const offset = (y * maskWidth + x) * 3;
    sum += color[offset] * 0.2126 + color[offset + 1] * 0.7152 + color[offset + 2] * 0.0722;
  }
  rowMean[y] = sum / maskWidth;
  globalMean += rowMean[y];
}
globalMean /= maskHeight;
const bandMask = Buffer.allocUnsafe(maskWidth * maskHeight);
const stormMask = Buffer.allocUnsafe(maskWidth * maskHeight);
let stormMaximum = 0;
let stormSum = 0;
for (let y = 0; y < maskHeight; y += 1) {
  const latitudeDeg = 90 - y / (maskHeight - 1) * 180;
  const stormLatitude = Math.exp(-(((latitudeDeg + 22) / 12) ** 2));
  const rowBand = Math.max(-1, Math.min(1, (rowMean[y] - globalMean) / 42));
  for (let x = 0; x < maskWidth; x += 1) {
    const offset = (y * maskWidth + x) * 3;
    const r = color[offset];
    const g = color[offset + 1];
    const b = color[offset + 2];
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const local = Math.max(-1, Math.min(1, (luminance - rowMean[y]) / 54));
    bandMask[y * maskWidth + x] = Math.round((0.5 + rowBand * 0.32 + local * 0.18) * 255);
    const redExcess = Math.max(0, r - g * 0.72 - b * 0.28 - 8);
    const storm = Math.max(0, Math.min(255, redExcess * 7.5 * stormLatitude));
    stormMask[y * maskWidth + x] = Math.round(storm);
    stormMaximum = Math.max(stormMaximum, storm);
    stormSum += storm;
  }
}
duplicateSeam(bandMask, maskWidth, maskHeight, 1);
duplicateSeam(stormMask, maskWidth, maskHeight, 1);
assert(stormMaximum >= 160 && stormSum / stormMask.length >= 0.5 && stormSum / stormMask.length <= 40, `v591-jupiter-storm-mask-range:${stormMaximum}:${stormSum / stormMask.length}`);
const bandPng = resolve(temporaryRoot, "jupiter-band-mask.png");
const stormPng = resolve(temporaryRoot, "jupiter-storm-mask.png");
await sharp(bandMask, { raw: { width: maskWidth, height: maskHeight, channels: 1 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(bandPng);
await sharp(stormMask, { raw: { width: maskWidth, height: maskHeight, channels: 1 }, limitInputPixels: false }).blur(1.2).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(stormPng);
const encoded = [
  await encodeAsset({ id: "jupiter-albedo", role: "cassini-global-albedo", desktopPng: albedoPng, desktopWidth: 4096, desktopHeight: 2048, colorSpace: "srgb", lossless: false, rdoLambda: 0.75 }),
  await encodeAsset({ id: "jupiter-band-mask", role: "cassini-derived-latitudinal-flow-mask", desktopPng: bandPng, desktopWidth: 2048, desktopHeight: 1024, colorSpace: "linear", lossless: true, rdoLambda: 0.5 }),
  await encodeAsset({ id: "jupiter-storm-mask", role: "cassini-derived-great-red-spot-mask", desktopPng: stormPng, desktopWidth: 2048, desktopHeight: 1024, colorSpace: "linear", lossless: true, rdoLambda: 0.45 }),
];
const sourceRecord = {
  acquisitionReceiptSha256: acquisition.receiptSha256,
  path: source.outputPath,
  url: source.sourceUrl,
  finalUrl: source.finalUrl,
  host: new URL(source.finalUrl).hostname,
  license: source.license,
  bytes: source.bytes,
  sha256: source.sha256,
  width: source.width,
  height: source.height,
  bitDepth: source.bitDepth,
  observationIdentity: source.observationIdentity,
  observationLimit: source.observationLimit,
};
const assets = encoded.map((asset) => ({
  ...asset,
  source: sourceRecord,
  derivation: {
    tool: "sharp+KTX-Software",
    version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
    parameters: asset.id === "jupiter-albedo" ? "Cassini PIA07782 3601x1801 to seam-safe 4096x2048 delivery resampling; no added observation detail" : "deterministic source-derived latitude/local-contrast mask; fixed GRS latitude prior; seam-safe; no random noise",
    sourceDetailCeiling: `${source.width}x${source.height}`,
    stormMaskMaximum: stormMaximum,
    stormMaskMean: stormSum / stormMask.length,
  },
  fullQualityMinimum: { desktop: { width: asset.variants.desktopKtx2.width, height: asset.variants.desktopKtx2.height }, mobile: { width: asset.variants.mobileKtx2.width, height: asset.variants.mobileKtx2.height } },
  presentationOnly: true,
}));
const unsigned = {
  version: "v591-jupiter-asset-overlay-v1",
  generatedAt,
  status: "jupiter-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  noNetworkRequestsPerformed: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  authorityState: { presentationOnly: true, scientificAuthorityChanged: false, scientificPayloadWriteback: false, measuredAuthorityGranted: false },
  assets,
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
const overlays = {
  SUN: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/sun-asset-overlay.json"), "utf8")),
  EARTH: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/earth-asset-overlay.json"), "utf8")),
  MOON: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/moon-asset-overlay.json"), "utf8")),
  MARS: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/mars-asset-overlay.json"), "utf8")),
  JUPITER: overlay,
};
for (const [name, value] of Object.entries(overlays)) verifySealed(value, "receiptSha256", `${name.toLowerCase()}-overlay`);
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Sun, Earth, Moon, Mars, and Jupiter asset overlays.",
  ...Object.entries(overlays).map(([name, value]) => `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = \"${value.receiptSha256}\" as const;`),
  "",
].join("\n"), "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: overlay.status, source: `${source.width}x${source.height}`, stormMask: { maximum: stormMaximum, mean: stormSum / stormMask.length }, assets: assets.map((asset) => ({ id: asset.id, desktopBytes: asset.variants.desktopKtx2.bytes, mobileBytes: asset.variants.mobileKtx2.bytes })), receiptSha256: overlay.receiptSha256 }, null, 2));
