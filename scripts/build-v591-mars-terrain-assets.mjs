import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-mars.json");
const identityAuditPath = resolve(root, "docs/release/v591/mars-albedo-identity-audit.json");
const fullSourceBlockPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-usgs-full.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/mars-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/mars");
const temporaryRoot = resolve(root, "tmp/v591-mars-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const MARS_RADIUS_METERS = 3_396_000;
const NORMAL_RELIEF_GAIN = 1.6;

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
  assert(canonicalSha(unsigned) === document[field], `v591-mars-${label}-seal`);
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
function readMolaInt16(path) {
  const bytes = readFileSync(path);
  const width = 5760;
  const height = 2880;
  assert(bytes.byteLength === width * height * 2, "v591-mars-mola-byte-count");
  const values = new Int16Array(width * height);
  let minimum = 32767;
  let maximum = -32768;
  let sum = 0;
  for (let index = 0, offset = 0; index < values.length; index += 1, offset += 2) {
    const value = bytes.readInt16BE(offset);
    values[index] = value;
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
    sum += value;
  }
  return { values, width, height, minimum, maximum, mean: sum / values.length };
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
function deriveTerrain(height, width, rows, range) {
  const normal = Buffer.allocUnsafe(width * rows * 3);
  const roughness = Buffer.allocUnsafe(width * rows);
  const heightMap = Buffer.allocUnsafe(width * rows);
  const activeWidth = width - 1;
  const longitudeStep = Math.PI * 2 / activeWidth;
  const latitudeStep = Math.PI / (rows - 1);
  const inverseRange = 1 / (range.maximum - range.minimum);
  for (let y = 0; y < rows; y += 1) {
    const latitude = Math.PI / 2 - y * latitudeStep;
    const eastWestMeters = Math.max(0.035, Math.cos(latitude)) * MARS_RADIUS_METERS * longitudeStep * 2;
    const northSouthMeters = MARS_RADIUS_METERS * latitudeStep * 2;
    const row = y * width;
    const up = Math.max(0, y - 1) * width;
    const down = Math.min(rows - 1, y + 1) * width;
    for (let x = 0; x < activeWidth; x += 1) {
      const left = x === 0 ? activeWidth - 1 : x - 1;
      const right = x === activeWidth - 1 ? 0 : x + 1;
      const center = height[row + x];
      const slopeEast = (height[row + right] - height[row + left]) / eastWestMeters;
      const slopeNorth = (height[up + x] - height[down + x]) / northSouthMeters;
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
      const localRelief = Math.abs(height[row + left] + height[row + right] + height[up + x] + height[down + x] - center * 4);
      const slope = Math.hypot(slopeEast, slopeNorth);
      roughness[row + x] = Math.round(Math.min(0.985, 0.86 + Math.min(0.08, slope * 2.4) + Math.min(0.045, localRelief / 2200)) * 255);
    }
    const firstNormal = row * 3;
    const seamNormal = (row + activeWidth) * 3;
    normal.copy(normal, seamNormal, firstNormal, firstNormal + 3);
    roughness[row + activeWidth] = roughness[row];
    heightMap[row + activeWidth] = heightMap[row];
  }
  return { normal, roughness, heightMap };
}
async function resizeSeamSafe(input, width, height, output) {
  const { data, info } = await sharp(input, { limitInputPixels: false }).resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 }).raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    for (let channel = 0; channel < info.channels; channel += 1) data[(y * info.width + info.width - 1) * info.channels + channel] = data[y * info.width * info.channels + channel];
  }
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
function outputRecord(path, url, width, height, format, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "linear", compression };
}
async function encodeAsset({ id, role, desktopPng, desktopWidth, desktopHeight, mobileWidth = 2048, mobileHeight = 1024, rdoLambda }) {
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
  const ktxArgs = (output, input) => ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda), "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", "linear", "--assign_primaries", "none", output, input];
  for (const [path, input, label] of [[paths.desktopKtx2, desktopPng, "desktop"], [paths.mobileKtx2, mobilePng, "mobile"]]) {
    const partial = `${path}.${process.pid}.part`;
    runTool(toktx, ktxArgs(partial, input), `v591-${id}-${label}-ktx2`);
    rmSync(path, { force: true });
    renameSync(partial, path);
  }
  for (const [input, output] of [[desktopPng, paths.desktopFallback], [mobilePng, paths.mobileFallback], [liteDesktopPng, paths.liteDesktop], [liteMobilePng, paths.liteMobile]]) {
    atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp({ lossless: true, effort: 6 }).toBuffer());
  }
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id, body: "mars", role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/mars/full/desktop/${id}.ktx2`, desktopWidth, desktopHeight, "ktx2", compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/mars/full/desktop/${id}.webp`, desktopWidth, desktopHeight, "webp", "webp-lossless"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/mars/full/mobile/${id}.ktx2`, mobileWidth, mobileHeight, "ktx2", compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/mars/full/mobile/${id}.webp`, mobileWidth, mobileHeight, "webp", "webp-lossless"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/mars/lite/desktop/${id}.webp`, 1024, 512, "webp", "webp-lossless"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/mars/lite/mobile/${id}.webp`, 512, 256, "webp", "webp-lossless"),
    },
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
const identityAudit = JSON.parse(readFileSync(identityAuditPath, "utf8"));
const fullSourceBlock = JSON.parse(readFileSync(fullSourceBlockPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
verifySealed(identityAudit, "receiptSha256", "identity-audit");
verifySealed(fullSourceBlock, "receiptSha256", "full-source-block");
assert(acquisition.status === "acquired-single-request-no-retry" && acquisition.assets.length === 3, "v591-mars-acquisition-contract");
assert(identityAudit.status === "blocked-identity-mismatch" && fullSourceBlock.status === "blocked-resource-throughput", "v591-mars-albedo-block-contract");
const heightSource = acquisition.assets.find((asset) => asset.id === "mars-mola-height-source-v591");
assert(heightSource && new URL(heightSource.finalUrl).hostname === "pds-geosciences.wustl.edu", "v591-mars-height-source");
const sourceBytes = readFileSync(resolve(root, heightSource.outputPath));
assert(sourceBytes.byteLength === heightSource.bytes && sha256(sourceBytes) === heightSource.sha256, "v591-mars-height-source-drift");

const mola = readMolaInt16(resolve(root, heightSource.outputPath));
assert(mola.minimum === -8177 && mola.maximum === 21171 && Math.abs(mola.mean - -721.1070361930941) < 1e-9, "v591-mars-mola-range");
rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const width = 4096;
const height = 2048;
const resampled = resamplePeriodic(mola, width, height);
const derived = deriveTerrain(resampled, width, height, mola);
const normalPng = resolve(temporaryRoot, "mars-normal.png");
const roughnessPng = resolve(temporaryRoot, "mars-roughness.png");
const heightPng = resolve(temporaryRoot, "mars-height.png");
await sharp(derived.normal, { raw: { width, height, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(normalPng);
await sharp(derived.roughness, { raw: { width, height, channels: 1 }, limitInputPixels: false }).resize(2048, 1024, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(roughnessPng);
await sharp(derived.heightMap, { raw: { width, height, channels: 1 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(heightPng);
const encoded = [
  await encodeAsset({ id: "mars-normal", role: "mola-height-derived-normal", desktopPng: normalPng, desktopWidth: 4096, desktopHeight: 2048, rdoLambda: 0.45 }),
  await encodeAsset({ id: "mars-roughness", role: "mola-height-derived-dust-roughness", desktopPng: roughnessPng, desktopWidth: 2048, desktopHeight: 1024, rdoLambda: 0.55 }),
  await encodeAsset({ id: "mars-height", role: "mola-height-presentation-relief", desktopPng: heightPng, desktopWidth: 4096, desktopHeight: 2048, rdoLambda: 0.35 }),
];
const source = {
  acquisitionReceiptSha256: acquisition.receiptSha256,
  path: heightSource.outputPath,
  url: heightSource.sourceUrl,
  finalUrl: heightSource.finalUrl,
  host: new URL(heightSource.finalUrl).hostname,
  license: heightSource.license,
  bytes: heightSource.bytes,
  sha256: heightSource.sha256,
  width: heightSource.width,
  height: heightSource.height,
  bitDepth: heightSource.bitDepth,
  units: "meter",
  observationIdentity: heightSource.observationIdentity,
  observationLimit: heightSource.observationLimit,
};
const assets = encoded.map((asset) => ({
  ...asset,
  source,
  derivation: {
    tool: "v591-pds3-msb-int16-reader+sharp+KTX-Software",
    version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
    parameters: `MOLA signed MSB int16 meters; source range ${mola.minimum}..${mola.maximum}; mean ${mola.mean}; spherical gradient gain ${NORMAL_RELIEF_GAIN}; exact duplicated longitude seam`,
    sourceRangeMeters: { minimum: mola.minimum, maximum: mola.maximum, mean: mola.mean },
    marsRadiusMeters: MARS_RADIUS_METERS,
    normalReliefGain: NORMAL_RELIEF_GAIN,
  },
  fullQualityMinimum: { desktop: { width: asset.variants.desktopKtx2.width, height: asset.variants.desktopKtx2.height }, mobile: { width: asset.variants.mobileKtx2.width, height: asset.variants.mobileKtx2.height } },
  presentationOnly: true,
}));
const unsigned = {
  version: "v591-mars-asset-overlay-v1",
  generatedAt,
  status: "mars-mola-terrain-derived-albedo-blocked",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  albedoIdentityAuditReceiptSha256: identityAudit.receiptSha256,
  fullAlbedoBlockedReceiptSha256: fullSourceBlock.receiptSha256,
  noNetworkRequestsPerformed: true,
  derivationDeterministic: true,
  authorityState: { presentationOnly: true, scientificAuthorityChanged: false, scientificPayloadWriteback: false, measuredAuthorityGranted: false },
  blockers: ["full-albedo-source-blocked", "frozen-v588-albedo-identity-threshold-not-met"],
  assets,
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
const overlays = {
  SUN: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/sun-asset-overlay.json"), "utf8")),
  EARTH: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/earth-asset-overlay.json"), "utf8")),
  MOON: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/moon-asset-overlay.json"), "utf8")),
  MARS: overlay,
};
for (const [name, value] of Object.entries(overlays)) verifySealed(value, "receiptSha256", `${name.toLowerCase()}-overlay`);
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Sun, Earth, Moon, and Mars asset overlays.",
  ...Object.entries(overlays).map(([name, value]) => `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = \"${value.receiptSha256}\" as const;`),
  "",
].join("\n"), "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: overlay.status, sourceRangeMeters: { minimum: mola.minimum, maximum: mola.maximum, mean: mola.mean }, assets: assets.map((asset) => ({ id: asset.id, desktopBytes: asset.variants.desktopKtx2.bytes, mobileBytes: asset.variants.mobileKtx2.bytes })), receiptSha256: overlay.receiptSha256 }, null, 2));
