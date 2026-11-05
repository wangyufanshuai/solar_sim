import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-moon.json");
const sunOverlayPath = resolve(root, "public/data/celestial-convergence-v591/sun-asset-overlay.json");
const earthOverlayPath = resolve(root, "public/data/celestial-convergence-v591/earth-asset-overlay.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/moon-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/moon");
const temporaryRoot = resolve(root, "tmp/v591-moon-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const LUNAR_RADIUS_METERS = 1_737_400;
const HEIGHT_METERS_PER_RAW_UNIT = 0.5;
const NORMAL_RELIEF_GAIN = 1.35;
const VERTEX_RELIEF_GAIN = 1.0;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function verifySealed(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v591-moon-${label}-seal`);
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

function runTool(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}

function readTiffValues(bytes, type, count, valueOffset, littleEndian) {
  const typeBytes = type === 3 ? 2 : type === 4 ? 4 : 0;
  if (!typeBytes) throw new Error(`v591-moon-tiff-type:${type}`);
  const byteLength = typeBytes * count;
  const start = byteLength <= 4
    ? valueOffset
    : littleEndian ? bytes.readUInt32LE(valueOffset) : bytes.readUInt32BE(valueOffset);
  if (start < 0 || start + byteLength > bytes.byteLength) throw new Error("v591-moon-tiff-value-range");
  const output = [];
  for (let index = 0; index < count; index += 1) {
    const offset = start + index * typeBytes;
    output.push(type === 3
      ? littleEndian ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset)
      : littleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset));
  }
  return output;
}

/** Read the admitted uncompressed uint16 LOLA strip product without an 8-bit colorspace conversion. */
function readUncompressedMonoUint16Tiff(path) {
  const bytes = readFileSync(path);
  const signature = bytes.subarray(0, 2).toString("ascii");
  const littleEndian = signature === "II";
  if (!littleEndian && signature !== "MM") throw new Error("v591-moon-tiff-byte-order");
  const readU16 = (offset) => littleEndian ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset);
  const readU32 = (offset) => littleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset);
  if (readU16(2) !== 42) throw new Error("v591-moon-tiff-magic");
  const ifdOffset = readU32(4);
  const entryCount = readU16(ifdOffset);
  const tags = new Map();
  const requiredTags = new Set([256, 257, 258, 259, 273, 277, 278, 279]);
  for (let index = 0; index < entryCount; index += 1) {
    const offset = ifdOffset + 2 + index * 12;
    const tag = readU16(offset);
    if (!requiredTags.has(tag)) continue;
    const type = readU16(offset + 2);
    const count = readU32(offset + 4);
    tags.set(tag, readTiffValues(bytes, type, count, offset + 8, littleEndian));
  }
  const scalar = (tag) => tags.get(tag)?.[0];
  const width = scalar(256);
  const height = scalar(257);
  const bitsPerSample = scalar(258);
  const compression = scalar(259);
  const samplesPerPixel = scalar(277);
  const rowsPerStrip = scalar(278);
  const stripOffsets = tags.get(273);
  const stripByteCounts = tags.get(279);
  if (
    width !== 5760
    || height !== 2880
    || bitsPerSample !== 16
    || compression !== 1
    || samplesPerPixel !== 1
    || rowsPerStrip !== 1
    || !stripOffsets
    || !stripByteCounts
    || stripOffsets.length !== height
    || stripByteCounts.length !== height
  ) throw new Error("v591-moon-tiff-layout");
  const raster = Buffer.allocUnsafe(width * height * 2);
  for (let row = 0; row < height; row += 1) {
    if (stripByteCounts[row] !== width * 2) throw new Error(`v591-moon-tiff-strip:${row}`);
    const sourceStart = stripOffsets[row];
    const sourceEnd = sourceStart + stripByteCounts[row];
    if (sourceEnd > bytes.byteLength) throw new Error(`v591-moon-tiff-strip-range:${row}`);
    bytes.copy(raster, row * width * 2, sourceStart, sourceEnd);
  }
  if (!littleEndian) {
    for (let offset = 0; offset < raster.byteLength; offset += 2) {
      const first = raster[offset];
      raster[offset] = raster[offset + 1];
      raster[offset + 1] = first;
    }
  }
  const values = new Uint16Array(raster.buffer, raster.byteOffset, width * height);
  let minimum = 65535;
  let maximum = 0;
  let sum = 0;
  for (const value of values) {
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
    sum += value;
  }
  return { values, width, height, minimum, maximum, mean: sum / values.length };
}

function resamplePeriodicHeight(source, targetWidth, targetHeight) {
  const output = new Float32Array(targetWidth * targetHeight);
  const activeWidth = targetWidth - 1;
  const x0 = new Uint32Array(activeWidth);
  const x1 = new Uint32Array(activeWidth);
  const tx = new Float32Array(activeWidth);
  for (let x = 0; x < activeWidth; x += 1) {
    const sourceX = x / activeWidth * source.width;
    const left = Math.floor(sourceX) % source.width;
    x0[x] = left;
    x1[x] = (left + 1) % source.width;
    tx[x] = sourceX - Math.floor(sourceX);
  }
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = y / (targetHeight - 1) * (source.height - 1);
    const top = Math.floor(sourceY);
    const bottom = Math.min(source.height - 1, top + 1);
    const ty = sourceY - top;
    const targetRow = y * targetWidth;
    const topRow = top * source.width;
    const bottomRow = bottom * source.width;
    for (let x = 0; x < activeWidth; x += 1) {
      const topValue = source.values[topRow + x0[x]] * (1 - tx[x]) + source.values[topRow + x1[x]] * tx[x];
      const bottomValue = source.values[bottomRow + x0[x]] * (1 - tx[x]) + source.values[bottomRow + x1[x]] * tx[x];
      output[targetRow + x] = topValue * (1 - ty) + bottomValue * ty;
    }
    output[targetRow + activeWidth] = output[targetRow];
  }
  return output;
}

function deriveLunarChannels(height, width, heightPixels, range) {
  const normal = Buffer.allocUnsafe(width * heightPixels * 3);
  const heightMap = Buffer.allocUnsafe(width * heightPixels);
  const roughness = Buffer.allocUnsafe(width * heightPixels);
  const activeWidth = width - 1;
  const longitudeStep = Math.PI * 2 / activeWidth;
  const latitudeStep = Math.PI / (heightPixels - 1);
  const inverseRange = 1 / Math.max(1, range.maximum - range.minimum);
  for (let y = 0; y < heightPixels; y += 1) {
    const latitude = Math.PI / 2 - y * latitudeStep;
    const longitudeMeters = Math.max(0.035, Math.cos(latitude)) * LUNAR_RADIUS_METERS * longitudeStep * 2;
    const latitudeMeters = LUNAR_RADIUS_METERS * latitudeStep * 2;
    const upRow = Math.max(0, y - 1) * width;
    const row = y * width;
    const downRow = Math.min(heightPixels - 1, y + 1) * width;
    for (let x = 0; x < activeWidth; x += 1) {
      const left = x === 0 ? activeWidth - 1 : x - 1;
      const right = x === activeWidth - 1 ? 0 : x + 1;
      const center = height[row + x];
      const slopeEast = (height[row + right] - height[row + left]) * HEIGHT_METERS_PER_RAW_UNIT / longitudeMeters;
      const slopeNorth = (height[upRow + x] - height[downRow + x]) * HEIGHT_METERS_PER_RAW_UNIT / latitudeMeters;
      let nx = -slopeEast * NORMAL_RELIEF_GAIN;
      let ny = -slopeNorth * NORMAL_RELIEF_GAIN;
      let nz = 1;
      const inverseLength = 1 / Math.hypot(nx, ny, nz);
      nx *= inverseLength;
      ny *= inverseLength;
      nz *= inverseLength;
      const normalOffset = (row + x) * 3;
      normal[normalOffset] = Math.round((nx * 0.5 + 0.5) * 255);
      normal[normalOffset + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normal[normalOffset + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      heightMap[row + x] = Math.round((center - range.minimum) * inverseRange * 255);
      const laplacian = Math.abs(
        height[row + left] + height[row + right] + height[upRow + x] + height[downRow + x] - center * 4
      ) * HEIGHT_METERS_PER_RAW_UNIT;
      const slope = Math.hypot(slopeEast, slopeNorth);
      const roughnessValue = Math.min(0.985, 0.84 + Math.min(0.10, slope * 1.8) + Math.min(0.045, laplacian / 2600));
      roughness[row + x] = Math.round(roughnessValue * 255);
    }
    const normalStart = row * 3;
    const normalEnd = (row + activeWidth) * 3;
    normal[normalEnd] = normal[normalStart];
    normal[normalEnd + 1] = normal[normalStart + 1];
    normal[normalEnd + 2] = normal[normalStart + 2];
    heightMap[row + activeWidth] = heightMap[row];
    roughness[row + activeWidth] = roughness[row];
  }
  return { normal, heightMap, roughness };
}

function seamMeanAbsoluteDelta(raw, width, height, channels) {
  let total = 0;
  for (let y = 0; y < height; y += 1) {
    const left = y * width * channels;
    const right = (y * width + width - 1) * channels;
    for (let channel = 0; channel < channels; channel += 1) total += Math.abs(raw[left + channel] - raw[right + channel]);
  }
  return total / (height * channels);
}

function duplicateFirstColumn(raw, width, height, channels) {
  for (let y = 0; y < height; y += 1) {
    const left = y * width * channels;
    const right = (y * width + width - 1) * channels;
    for (let channel = 0; channel < channels; channel += 1) raw[right + channel] = raw[left + channel];
  }
}

async function writeSeamSafePngFromImage(input, width, height, output) {
  const { data, info } = await sharp(input, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  duplicateFirstColumn(data, info.width, info.height, info.channels);
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}

async function writeSeamSafeResizedPng(input, width, height, output) {
  const { data, info } = await sharp(input, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  duplicateFirstColumn(data, info.width, info.height, info.channels);
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}

function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}

async function encodeAsset({ id, role, desktopPng, desktopWidth, desktopHeight, mobileWidth, mobileHeight, colorSpace, losslessFallback, rdoLambda }) {
  const paths = {
    desktopKtx2: resolve(outputRoot, `full/desktop/${id}.ktx2`),
    desktopFallback: resolve(outputRoot, `full/desktop/${id}.webp`),
    mobileKtx2: resolve(outputRoot, `full/mobile/${id}.ktx2`),
    mobileFallback: resolve(outputRoot, `full/mobile/${id}.webp`),
    liteDesktop: resolve(outputRoot, `lite/desktop/${id}.webp`),
    liteMobile: resolve(outputRoot, `lite/mobile/${id}.webp`),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const mobilePng = resolve(temporaryRoot, `${id}-${mobileWidth}x${mobileHeight}.png`);
  const liteDesktopPng = resolve(temporaryRoot, `${id}-1024x512.png`);
  const liteMobilePng = resolve(temporaryRoot, `${id}-512x256.png`);
  await writeSeamSafeResizedPng(desktopPng, mobileWidth, mobileHeight, mobilePng);
  await writeSeamSafeResizedPng(desktopPng, 1024, 512, liteDesktopPng);
  await writeSeamSafeResizedPng(desktopPng, 512, 256, liteMobilePng);
  const ktxArgs = (output, input) => [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda),
    "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap",
    "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none",
    output, input,
  ];
  const desktopPartial = `${paths.desktopKtx2}.${process.pid}.part`;
  runTool(toktx, ktxArgs(desktopPartial, desktopPng), `v591-${id}-desktop-ktx2`);
  rmSync(paths.desktopKtx2, { force: true });
  renameSync(desktopPartial, paths.desktopKtx2);
  const mobilePartial = `${paths.mobileKtx2}.${process.pid}.part`;
  runTool(toktx, ktxArgs(mobilePartial, mobilePng), `v591-${id}-mobile-ktx2`);
  rmSync(paths.mobileKtx2, { force: true });
  renameSync(mobilePartial, paths.mobileKtx2);
  const encodeWebp = async (input, output, quality) => atomicWrite(output, await sharp(input, { limitInputPixels: false })
    .webp(losslessFallback ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true })
    .toBuffer());
  await encodeWebp(desktopPng, paths.desktopFallback, 93);
  await encodeWebp(mobilePng, paths.mobileFallback, 91);
  await encodeWebp(liteDesktopPng, paths.liteDesktop, 88);
  await encodeWebp(liteMobilePng, paths.liteMobile, 86);
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id,
    body: "moon",
    role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/moon/full/desktop/${id}.ktx2`, desktopWidth, desktopHeight, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/moon/full/desktop/${id}.webp`, desktopWidth, desktopHeight, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-93"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/moon/full/mobile/${id}.ktx2`, mobileWidth, mobileHeight, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/moon/full/mobile/${id}.webp`, mobileWidth, mobileHeight, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-91"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/moon/lite/desktop/${id}.webp`, 1024, 512, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-88"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/moon/lite/mobile/${id}.webp`, 512, 256, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-86"),
    },
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
if (
  acquisition.status !== "acquired-single-request-no-retry"
  || acquisition.automaticRetryPerformed !== false
  || acquisition.automaticReplacementPerformed !== false
  || acquisition.requestedUrlCount !== 2
) throw new Error("v591-moon-acquisition-policy");
const byId = new Map(acquisition.assets.map((asset) => [asset.id, asset]));
const albedoSource = byId.get("moon-albedo-source-v591");
const heightSource = byId.get("moon-height-source-v591");
if (!albedoSource || !heightSource) throw new Error("v591-moon-acquisition-channels");
for (const source of [albedoSource, heightSource]) {
  const bytes = readFileSync(resolve(root, source.outputPath));
  if (bytes.byteLength !== source.bytes || sha256(bytes) !== source.sha256) throw new Error(`v591-moon-source-drift:${source.id}`);
  if (new URL(source.finalUrl).hostname !== "svs.gsfc.nasa.gov" || source.license?.id !== "NASA-public-domain") {
    throw new Error(`v591-moon-source-provenance:${source.id}`);
  }
}

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const albedoPng = resolve(temporaryRoot, "moon-albedo-8192x4096.png");
await writeSeamSafePngFromImage(resolve(root, albedoSource.outputPath), 8192, 4096, albedoPng);
const ldem = readUncompressedMonoUint16Tiff(resolve(root, heightSource.outputPath));
if (ldem.minimum !== 2037 || ldem.maximum !== 41371 || Math.abs(ldem.mean - 18961.595629099153) > 1e-9) {
  throw new Error(`v591-moon-ldem-range:${ldem.minimum}:${ldem.maximum}:${ldem.mean}`);
}
const derivedWidth = 4096;
const derivedHeight = 2048;
const resampledHeight = resamplePeriodicHeight(ldem, derivedWidth, derivedHeight);
const derived = deriveLunarChannels(resampledHeight, derivedWidth, derivedHeight, ldem);
const normalPng = resolve(temporaryRoot, "moon-normal-4096x2048.png");
const heightPng = resolve(temporaryRoot, "moon-height-4096x2048.png");
const roughnessPng = resolve(temporaryRoot, "moon-roughness-4096x2048.png");
await sharp(derived.normal, { raw: { width: derivedWidth, height: derivedHeight, channels: 3 }, limitInputPixels: false })
  .png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(normalPng);
await sharp(derived.heightMap, { raw: { width: derivedWidth, height: derivedHeight, channels: 1 }, limitInputPixels: false })
  .png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(heightPng);
await sharp(derived.roughness, { raw: { width: derivedWidth, height: derivedHeight, channels: 1 }, limitInputPixels: false })
  .resize(2048, 1024, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(roughnessPng);

const encoded = [];
encoded.push(await encodeAsset({ id: "moon-albedo", role: "albedo", desktopPng: albedoPng, desktopWidth: 8192, desktopHeight: 4096, mobileWidth: 2048, mobileHeight: 1024, colorSpace: "srgb", losslessFallback: false, rdoLambda: 0.75 }));
encoded.push(await encodeAsset({ id: "moon-normal", role: "height-derived-normal", desktopPng: normalPng, desktopWidth: 4096, desktopHeight: 2048, mobileWidth: 2048, mobileHeight: 1024, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.45 }));
encoded.push(await encodeAsset({ id: "moon-roughness", role: "height-derived-roughness", desktopPng: roughnessPng, desktopWidth: 2048, desktopHeight: 1024, mobileWidth: 2048, mobileHeight: 1024, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.55 }));
encoded.push(await encodeAsset({ id: "moon-height", role: "height-displacement", desktopPng: heightPng, desktopWidth: 4096, desktopHeight: 2048, mobileWidth: 2048, mobileHeight: 1024, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.35 }));

const sourceRecord = (source) => ({
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
});
const assets = encoded.map((asset) => {
  const source = asset.id === "moon-albedo" ? albedoSource : heightSource;
  const seamDelta = asset.id === "moon-albedo"
    ? 0
    : asset.id === "moon-normal"
      ? seamMeanAbsoluteDelta(derived.normal, derivedWidth, derivedHeight, 3)
      : asset.id === "moon-height"
        ? seamMeanAbsoluteDelta(derived.heightMap, derivedWidth, derivedHeight, 1)
        : 0;
  return {
    ...asset,
    source: sourceRecord(source),
    derivation: {
      tool: "v591-lossless-tiff-strip-reader+sharp+KTX-Software",
      version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
      parameters: asset.id === "moon-albedo"
        ? "direct NASA 16-bit sRGB mosaic conversion; exact duplicated longitude seam; 8K/2K/1K/512 LOD; UASTC RDO single-thread"
        : `LOLA uint16 half-meter elevation; source range ${ldem.minimum}-${ldem.maximum}; mean datum ${ldem.mean}; spherical-gradient normal relief gain ${NORMAL_RELIEF_GAIN}; vertex relief gain ${VERTEX_RELIEF_GAIN}; exact duplicated longitude seam; UASTC RDO single-thread`,
      sourceRangeRaw: { minimum: ldem.minimum, maximum: ldem.maximum, mean: ldem.mean },
      heightMetersPerRawUnit: HEIGHT_METERS_PER_RAW_UNIT,
      lunarRadiusMeters: LUNAR_RADIUS_METERS,
      normalReliefGain: NORMAL_RELIEF_GAIN,
      vertexReliefGain: VERTEX_RELIEF_GAIN,
      seamMeanAbsoluteDelta: seamDelta,
      observationLimit: source.observationLimit,
    },
    fullQualityMinimum: {
      desktop: { width: asset.variants.desktopKtx2.width, height: asset.variants.desktopKtx2.height },
      mobile: { width: asset.variants.mobileKtx2.width, height: asset.variants.mobileKtx2.height },
    },
    presentationOnly: true,
  };
});

const unsigned = {
  version: "v591-moon-asset-overlay-v1",
  generatedAt,
  status: "moon-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  noNetworkRequestsPerformed: true,
  derivationDeterministic: true,
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
  },
  assets,
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
const sunOverlay = JSON.parse(readFileSync(sunOverlayPath, "utf8"));
const earthOverlay = JSON.parse(readFileSync(earthOverlayPath, "utf8"));
verifySealed(sunOverlay, "receiptSha256", "sun-overlay");
verifySealed(earthOverlay, "receiptSha256", "earth-overlay");
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Sun, Earth, and Moon asset overlays.",
  `export const CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591 = "${sunOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591 = "${earthOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_MOON_ASSET_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`,
  "",
].join("\n"), "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  status: overlay.status,
  acquisitionReceiptSha256: acquisition.receiptSha256,
  sourceRangeRaw: { minimum: ldem.minimum, maximum: ldem.maximum, mean: ldem.mean },
  assets: assets.map((asset) => ({
    id: asset.id,
    desktop: `${asset.variants.desktopKtx2.width}x${asset.variants.desktopKtx2.height}`,
    desktopBytes: asset.variants.desktopKtx2.bytes,
    mobileBytes: asset.variants.mobileKtx2.bytes,
    seamMeanAbsoluteDelta: asset.derivation.seamMeanAbsoluteDelta,
  })),
  receiptSha256: overlay.receiptSha256,
}, null, 2));
