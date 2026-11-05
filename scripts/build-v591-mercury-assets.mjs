import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { endianness } from "node:os";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-mercury.json");
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-mercury-usgs-dem.json");
const v589ManifestPath = resolve(root, "public/data/celestial-art-v589/manifest.json");
const v589AcquisitionPath = resolve(root, "docs/release/v589/acquisition-receipt-v589.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/mercury-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/mercury");
const temporaryRoot = resolve(root, "tmp/v591-mercury-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const MERCURY_RADIUS_METERS = 2_439_700;
const NORMAL_RELIEF_GAIN = 1.7;
const VERTEX_RELIEF_GAIN = 1.0;

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
  assert(document[field] === canonicalSha(unsigned), `v591-mercury-${label}-seal`);
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
function readTiffValues(bytes, type, count, valueOffset, littleEndian) {
  const typeBytes = type === 3 ? 2 : type === 4 ? 4 : 0;
  assert(typeBytes > 0, `v591-mercury-tiff-type:${type}`);
  const byteLength = typeBytes * count;
  const start = byteLength <= 4 ? valueOffset : littleEndian ? bytes.readUInt32LE(valueOffset) : bytes.readUInt32BE(valueOffset);
  assert(start >= 0 && start + byteLength <= bytes.byteLength, "v591-mercury-tiff-value-range");
  const output = [];
  for (let index = 0; index < count; index += 1) {
    const offset = start + index * typeBytes;
    output.push(type === 3
      ? littleEndian ? bytes.readUInt16LE(offset) : bytes.readUInt16BE(offset)
      : littleEndian ? bytes.readUInt32LE(offset) : bytes.readUInt32BE(offset));
  }
  return output;
}
function readMercuryDem(path) {
  assert(endianness() === "LE", "v591-mercury-native-endian");
  const bytes = readFileSync(path);
  const signature = bytes.subarray(0, 2).toString("ascii");
  const littleEndian = signature === "II";
  assert(littleEndian, "v591-mercury-tiff-byte-order");
  const readU16 = (offset) => bytes.readUInt16LE(offset);
  const readU32 = (offset) => bytes.readUInt32LE(offset);
  assert(readU16(2) === 42, "v591-mercury-tiff-magic");
  const ifdOffset = readU32(4);
  const entryCount = readU16(ifdOffset);
  const tags = new Map();
  const required = new Set([256, 257, 258, 259, 273, 277, 278, 279, 339]);
  for (let index = 0; index < entryCount; index += 1) {
    const offset = ifdOffset + 2 + index * 12;
    const tag = readU16(offset);
    if (!required.has(tag)) continue;
    tags.set(tag, readTiffValues(bytes, readU16(offset + 2), readU32(offset + 4), offset + 8, littleEndian));
  }
  const scalar = (tag) => tags.get(tag)?.[0];
  const width = scalar(256);
  const height = scalar(257);
  const strips = tags.get(273);
  const counts = tags.get(279);
  assert(
    width === 23040
      && height === 11520
      && scalar(258) === 16
      && scalar(259) === 1
      && scalar(277) === 1
      && scalar(278) === 1
      && scalar(339) === 2
      && strips?.length === height
      && counts?.length === height,
    "v591-mercury-tiff-layout",
  );
  const raster = Buffer.allocUnsafe(width * height * 2);
  for (let row = 0; row < height; row += 1) {
    assert(counts[row] === width * 2, `v591-mercury-tiff-strip:${row}`);
    const start = strips[row];
    bytes.copy(raster, row * width * 2, start, start + counts[row]);
  }
  const values = new Int16Array(raster.buffer, raster.byteOffset, width * height);
  let minimum = 32767;
  let maximum = -32768;
  let sum = 0;
  let noDataCount = 0;
  for (const value of values) {
    if (value === -32768) {
      noDataCount += 1;
      continue;
    }
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    sum += value;
  }
  const validCount = values.length - noDataCount;
  return { values, width, height, minimum, maximum, mean: sum / validCount, noDataCount };
}
function resamplePeriodic(source, targetWidth, targetHeight) {
  const output = new Float32Array(targetWidth * targetHeight);
  const activeWidth = targetWidth - 1;
  for (let y = 0; y < targetHeight; y += 1) {
    const sy = y / (targetHeight - 1) * (source.height - 1);
    const y0 = Math.floor(sy);
    const y1 = Math.min(source.height - 1, y0 + 1);
    const ty = sy - y0;
    for (let x = 0; x < activeWidth; x += 1) {
      const sx = x / activeWidth * source.width;
      const x0 = Math.floor(sx) % source.width;
      const x1 = (x0 + 1) % source.width;
      const tx = sx - Math.floor(sx);
      const top = source.values[y0 * source.width + x0] * (1 - tx) + source.values[y0 * source.width + x1] * tx;
      const bottom = source.values[y1 * source.width + x0] * (1 - tx) + source.values[y1 * source.width + x1] * tx;
      output[y * targetWidth + x] = top * (1 - ty) + bottom * ty;
    }
    output[y * targetWidth + activeWidth] = output[y * targetWidth];
  }
  return output;
}
function deriveTerrain(heightValues, width, rows, range) {
  const normal = Buffer.allocUnsafe(width * rows * 3);
  const roughness = Buffer.allocUnsafe(width * rows);
  const heightMap = Buffer.allocUnsafe(width * rows);
  const activeWidth = width - 1;
  const longitudeStep = Math.PI * 2 / activeWidth;
  const latitudeStep = Math.PI / (rows - 1);
  const inverseRange = 1 / (range.maximum - range.minimum);
  for (let y = 0; y < rows; y += 1) {
    const latitude = Math.PI / 2 - y * latitudeStep;
    const eastWestMeters = Math.max(0.035, Math.cos(latitude)) * MERCURY_RADIUS_METERS * longitudeStep * 2;
    const northSouthMeters = MERCURY_RADIUS_METERS * latitudeStep * 2;
    const row = y * width;
    const up = Math.max(0, y - 1) * width;
    const down = Math.min(rows - 1, y + 1) * width;
    for (let x = 0; x < activeWidth; x += 1) {
      const left = x === 0 ? activeWidth - 1 : x - 1;
      const right = x === activeWidth - 1 ? 0 : x + 1;
      const center = heightValues[row + x];
      const slopeEast = (heightValues[row + right] - heightValues[row + left]) / eastWestMeters;
      const slopeNorth = (heightValues[up + x] - heightValues[down + x]) / northSouthMeters;
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
      const localRelief = Math.abs(heightValues[row + left] + heightValues[row + right] + heightValues[up + x] + heightValues[down + x] - center * 4);
      const slope = Math.hypot(slopeEast, slopeNorth);
      roughness[row + x] = Math.round(Math.min(0.99, 0.875 + Math.min(0.075, slope * 2.3) + Math.min(0.04, localRelief / 1800)) * 255);
    }
    normal.copy(normal, (row + activeWidth) * 3, row * 3, row * 3 + 3);
    roughness[row + activeWidth] = roughness[row];
    heightMap[row + activeWidth] = heightMap[row];
  }
  return { normal, roughness, heightMap };
}
async function resizeSeamSafe(input, width, height, output, srgb = false) {
  let pipeline = sharp(input, { limitInputPixels: false }).resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 }).removeAlpha();
  if (srgb) pipeline = pipeline.toColourspace("srgb");
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    const first = y * info.width * info.channels;
    const last = (y * info.width + info.width - 1) * info.channels;
    for (let channel = 0; channel < info.channels; channel += 1) data[last + channel] = data[first + channel];
  }
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
async function seamMeanAbsoluteDelta(path) {
  const { data, info } = await sharp(path, { limitInputPixels: false }).raw().toBuffer({ resolveWithObject: true });
  let total = 0;
  for (let y = 0; y < info.height; y += 1) {
    const first = y * info.width * info.channels;
    const last = (y * info.width + info.width - 1) * info.channels;
    for (let channel = 0; channel < info.channels; channel += 1) total += Math.abs(data[first + channel] - data[last + channel]);
  }
  return total / (info.height * info.channels);
}
function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}
async function encodeAsset({ id, role, desktopPng, desktopWidth, desktopHeight, colorSpace, losslessFallback, rdoLambda }) {
  const paths = {
    desktopKtx2: resolve(outputRoot, `full/desktop/${id}.ktx2`),
    desktopFallback: resolve(outputRoot, `full/desktop/${id}.webp`),
    mobileKtx2: resolve(outputRoot, `full/mobile/${id}.ktx2`),
    mobileFallback: resolve(outputRoot, `full/mobile/${id}.webp`),
    liteDesktop: resolve(outputRoot, `lite/desktop/${id}.webp`),
    liteMobile: resolve(outputRoot, `lite/mobile/${id}.webp`),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const mobilePng = resolve(temporaryRoot, `${id}-mobile.png`);
  const liteDesktopPng = resolve(temporaryRoot, `${id}-lite-desktop.png`);
  const liteMobilePng = resolve(temporaryRoot, `${id}-lite-mobile.png`);
  await resizeSeamSafe(desktopPng, 2048, 1024, mobilePng, colorSpace === "srgb");
  await resizeSeamSafe(desktopPng, 1024, 512, liteDesktopPng, colorSpace === "srgb");
  await resizeSeamSafe(desktopPng, 512, 256, liteMobilePng, colorSpace === "srgb");
  const ktxArgs = (output, input) => ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda), "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none", output, input];
  for (const [path, input, label] of [[paths.desktopKtx2, desktopPng, "desktop"], [paths.mobileKtx2, mobilePng, "mobile"]]) {
    const partial = `${path}.${process.pid}.part`;
    runTool(toktx, ktxArgs(partial, input), `v591-${id}-${label}-ktx2`);
    rmSync(path, { force: true });
    renameSync(partial, path);
  }
  const fullWebp = (input) => sharp(input, { limitInputPixels: false }).webp(losslessFallback ? { lossless: true, effort: 6 } : { quality: 93, effort: 6, smartSubsample: true }).toBuffer();
  atomicWrite(paths.desktopFallback, await fullWebp(desktopPng));
  atomicWrite(paths.mobileFallback, await fullWebp(mobilePng));
  atomicWrite(paths.liteDesktop, await sharp(liteDesktopPng, { limitInputPixels: false }).webp({ quality: colorSpace === "srgb" ? 89 : 86, effort: 6, smartSubsample: true }).toBuffer());
  atomicWrite(paths.liteMobile, await sharp(liteMobilePng, { limitInputPixels: false }).webp({ quality: colorSpace === "srgb" ? 87 : 84, effort: 6, smartSubsample: true }).toBuffer());
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id,
    body: "mercury",
    role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/mercury/full/desktop/${id}.ktx2`, desktopWidth, desktopHeight, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/mercury/full/desktop/${id}.webp`, desktopWidth, desktopHeight, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-93"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/mercury/full/mobile/${id}.ktx2`, 2048, 1024, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/mercury/full/mobile/${id}.webp`, 2048, 1024, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-93"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/mercury/lite/desktop/${id}.webp`, 1024, 512, "webp", colorSpace, `webp-quality-${colorSpace === "srgb" ? 89 : 86}`),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/mercury/lite/mobile/${id}.webp`, 512, 256, "webp", colorSpace, `webp-quality-${colorSpace === "srgb" ? 87 : 84}`),
    },
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
const v589Manifest = JSON.parse(readFileSync(v589ManifestPath, "utf8"));
const v589Acquisition = JSON.parse(readFileSync(v589AcquisitionPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
verifySealed(metadata, "receiptSha256", "metadata");
verifySealed(v589Manifest, "manifestSha256", "v589-manifest");
verifySealed(v589Acquisition, "receiptSha256", "v589-acquisition");
assert(acquisition.status === "acquired-single-request-no-retry" && acquisition.assets?.length === 1, "v591-mercury-acquisition-contract");
assert(acquisition.metadataReceiptSha256 === metadata.receiptSha256 && metadata.object?.bytes === 530934581, "v591-mercury-metadata-chain");
const albedo = acquisition.albedoReference;
const terrain = acquisition.assets[0];
for (const source of [albedo, terrain]) {
  const path = resolve(root, source.path ?? source.outputPath);
  const bytes = readFileSync(path);
  assert(bytes.byteLength === (source.actualBytes ?? source.bytes) && sha256(bytes) === (source.actualSha256 ?? source.sha256), `v591-mercury-source-drift:${source.id}`);
}
const v589Mercury = v589Manifest.assets.find((asset) => asset.id === "mercury-albedo");
const v589AcquisitionMercury = v589Acquisition.results.find((entry) => entry.id === "mercury-albedo-source");
assert(v589Mercury?.sourceSha256 === albedo.actualSha256 && v589Mercury.sourceBytes === albedo.actualBytes, "v591-mercury-v589-manifest-reference");
assert(v589AcquisitionMercury?.sha256 === albedo.actualSha256 && v589AcquisitionMercury.bytes === albedo.actualBytes, "v591-mercury-v589-acquisition-reference");

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const albedoPng = resolve(temporaryRoot, "mercury-albedo-4096x2048.png");
await resizeSeamSafe(resolve(root, albedo.path), 4096, 2048, albedoPng, true);
const dem = readMercuryDem(resolve(root, terrain.outputPath));
assert(dem.minimum === -10764 && dem.maximum === 8994 && dem.noDataCount === 0 && Math.abs(dem.mean - -478.08443944860386) < 1e-9, `v591-mercury-dem-range:${dem.minimum}:${dem.maximum}:${dem.mean}:${dem.noDataCount}`);
const terrainWidth = 4096;
const terrainHeight = 2048;
const resampled = resamplePeriodic(dem, terrainWidth, terrainHeight);
const derived = deriveTerrain(resampled, terrainWidth, terrainHeight, dem);
const normalPng = resolve(temporaryRoot, "mercury-normal-4096x2048.png");
const roughnessFullPng = resolve(temporaryRoot, "mercury-roughness-4096x2048.png");
const roughnessPng = resolve(temporaryRoot, "mercury-roughness-2048x1024.png");
const heightPng = resolve(temporaryRoot, "mercury-height-4096x2048.png");
await sharp(derived.normal, { raw: { width: terrainWidth, height: terrainHeight, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(normalPng);
await sharp(derived.roughness, { raw: { width: terrainWidth, height: terrainHeight, channels: 1 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(roughnessFullPng);
await resizeSeamSafe(roughnessFullPng, 2048, 1024, roughnessPng);
await sharp(derived.heightMap, { raw: { width: terrainWidth, height: terrainHeight, channels: 1 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(heightPng);
for (const path of [albedoPng, normalPng, roughnessPng, heightPng]) assert(await seamMeanAbsoluteDelta(path) === 0, `v591-mercury-seam:${path}`);

const encoded = [
  await encodeAsset({ id: "mercury-albedo", role: "nasa-photojournal-global-albedo", desktopPng: albedoPng, desktopWidth: 4096, desktopHeight: 2048, colorSpace: "srgb", losslessFallback: false, rdoLambda: 0.65 }),
  await encodeAsset({ id: "mercury-normal", role: "messenger-height-derived-normal", desktopPng: normalPng, desktopWidth: 4096, desktopHeight: 2048, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.42 }),
  await encodeAsset({ id: "mercury-roughness", role: "messenger-height-derived-regolith-roughness", desktopPng: roughnessPng, desktopWidth: 2048, desktopHeight: 1024, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.52 }),
  await encodeAsset({ id: "mercury-height", role: "messenger-height-presentation-relief", desktopPng: heightPng, desktopWidth: 4096, desktopHeight: 2048, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.34 }),
];
const albedoSource = {
  acquisitionReceiptSha256: acquisition.receiptSha256,
  inheritedManifestSha256: v589Manifest.manifestSha256,
  inheritedAcquisitionReceiptSha256: v589Acquisition.receiptSha256,
  path: albedo.path,
  url: albedo.sourceUrl,
  finalUrl: albedo.sourceUrl,
  host: new URL(albedo.sourceUrl).hostname,
  license: albedo.license,
  bytes: albedo.actualBytes,
  sha256: albedo.actualSha256,
  width: albedo.actualWidth,
  height: albedo.actualHeight,
  bitDepth: 8,
  observationIdentity: "NASA Photojournal PIA15063 global Mercury color mosaic",
  observationLimit: "6132x3066 source is the albedo detail ceiling; the 4K delivery derivative adds no observed detail",
  exactByteV589SourceReuse: true,
};
const terrainSource = {
  acquisitionReceiptSha256: acquisition.receiptSha256,
  metadataReceiptSha256: metadata.receiptSha256,
  path: terrain.outputPath,
  url: terrain.sourceUrl,
  finalUrl: terrain.finalUrl,
  host: new URL(terrain.finalUrl).hostname,
  license: terrain.license,
  bytes: terrain.bytes,
  sha256: terrain.sha256,
  width: terrain.width,
  height: terrain.height,
  bitDepth: terrain.bitDepth,
  units: "meter",
  observationIdentity: terrain.observationIdentity,
  observationLimit: terrain.observationLimit,
};
const assets = encoded.map((asset) => {
  const isAlbedo = asset.id === "mercury-albedo";
  return {
    ...asset,
    source: isAlbedo ? albedoSource : terrainSource,
    derivation: {
      tool: "v591-signed-int16-geotiff-reader+sharp+KTX-Software",
      version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
      parameters: isAlbedo
        ? "exact admitted PIA15063 bytes; Lanczos3 4096x2048 delivery resample; duplicated longitude seam"
        : `MESSENGER signed int16 metres; source range ${dem.minimum}..${dem.maximum}; mean ${dem.mean}; spherical gradient gain ${NORMAL_RELIEF_GAIN}; duplicated longitude seam`,
      seamMeanAbsoluteDelta: 0,
      sourceRangeMeters: isAlbedo ? undefined : { minimum: dem.minimum, maximum: dem.maximum, mean: dem.mean },
      mercuryRadiusMeters: isAlbedo ? undefined : MERCURY_RADIUS_METERS,
      normalReliefGain: isAlbedo ? undefined : NORMAL_RELIEF_GAIN,
      vertexReliefGain: isAlbedo ? undefined : VERTEX_RELIEF_GAIN,
    },
    fullQualityMinimum: {
      desktop: { width: asset.variants.desktopKtx2.width, height: asset.variants.desktopKtx2.height },
      mobile: { width: asset.variants.mobileKtx2.width, height: asset.variants.mobileKtx2.height },
    },
    presentationOnly: true,
  };
});
const unsigned = {
  version: "v591-mercury-asset-overlay-v1",
  generatedAt,
  status: "mercury-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  metadataReceiptSha256: metadata.receiptSha256,
  inheritedV589ManifestSha256: v589Manifest.manifestSha256,
  inheritedV589AcquisitionReceiptSha256: v589Acquisition.receiptSha256,
  noNetworkRequestsPerformed: true,
  exactByteV589AlbedoSourceReuse: true,
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
  MERCURY: overlay,
  MOON: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/moon-asset-overlay.json"), "utf8")),
  MARS: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/mars-asset-overlay.json"), "utf8")),
  JUPITER: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/jupiter-asset-overlay.json"), "utf8")),
  SATURN: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/saturn-asset-overlay.json"), "utf8")),
  BENNU: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/bennu-asset-overlay.json"), "utf8")),
  VESTA: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/vesta-asset-overlay.json"), "utf8")),
  ICE_GIANT_PRIMARY: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/ice-giant-primary-overlay.json"), "utf8")),
};
for (const [name, value] of Object.entries(overlays)) verifySealed(value, "receiptSha256", `${name.toLowerCase()}-overlay`);
const vestaModelReceipt = JSON.parse(readFileSync(resolve(root, "docs/release/v591/vesta-model-lod-receipt-v591.json"), "utf8"));
verifySealed(vestaModelReceipt, "receiptSha256", "vesta-model-receipt");
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Hero asset and registered-primary overlays.",
  ...Object.entries(overlays).map(([name, value]) => name === "ICE_GIANT_PRIMARY"
    ? `export const CELESTIAL_CONVERGENCE_ICE_GIANT_PRIMARY_OVERLAY_SHA256_V591 = "${value.receiptSha256}" as const;`
    : `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = "${value.receiptSha256}" as const;`),
  `export const CELESTIAL_CONVERGENCE_VESTA_MODEL_LOD_RECEIPT_SHA256_V591 = "${vestaModelReceipt.receiptSha256}" as const;`,
  "",
].join("\n"), "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({
  status: overlay.status,
  sourceRangeMeters: { minimum: dem.minimum, maximum: dem.maximum, mean: dem.mean },
  assets: assets.map((asset) => ({ id: asset.id, desktopBytes: asset.variants.desktopKtx2.bytes, mobileBytes: asset.variants.mobileKtx2.bytes, liteBytes: asset.variants.liteDesktop.bytes + asset.variants.liteMobile.bytes })),
  receiptSha256: overlay.receiptSha256,
}, null, 2));
