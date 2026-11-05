import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/venus-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/venus");
const temporaryRoot = resolve(root, "tmp/v591-venus-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");

const SOURCE_DEFINITIONS = Object.freeze([
  {
    id: "venus-magellan-0e",
    receiptPath: "docs/release/v591/acquisition-asset-venus-magellan-0e.json",
    longitudeEastDeg: 0,
    centerX: 2047.5,
    centerY: 2047.5,
    radiusX: 1844,
    radiusY: 1844,
    gridReference: false,
  },
  {
    id: "venus-magellan-90e",
    receiptPath: "docs/release/v591/acquisition-asset-venus-magellan-90e.json",
    longitudeEastDeg: 90,
    centerX: 2047.5,
    centerY: 2047.5,
    radiusX: 1844,
    radiusY: 1844,
    gridReference: false,
  },
  {
    id: "venus-magellan-180e",
    receiptPath: "docs/release/v591/acquisition-asset-venus-magellan-180e.json",
    longitudeEastDeg: 180,
    centerX: 5120.5,
    centerY: 5120.5,
    radiusX: 4609,
    radiusY: 4609,
    gridReference: true,
  },
  {
    id: "venus-magellan-270e",
    receiptPath: "docs/release/v591/acquisition-asset-venus-magellan-270e.json",
    longitudeEastDeg: 270,
    centerX: 3003,
    centerY: 3006,
    radiusX: 2764.5,
    radiusY: 2771.5,
    gridReference: false,
  },
]);

const DESKTOP_WIDTH = 4096;
const DESKTOP_HEIGHT = 2048;
const MOBILE_WIDTH = 2048;
const MOBILE_HEIGHT = 1024;
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifySealed(document, label) {
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-venus-${label}-seal`);
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, bytes, { flag: "wx" });
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

function luma(r, g, b) {
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

function bilinearChannel(source, x, y, channel) {
  const x0 = Math.max(0, Math.min(source.width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(source.height - 1, Math.floor(y)));
  const x1 = Math.min(source.width - 1, x0 + 1);
  const y1 = Math.min(source.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const row0 = y0 * source.width;
  const row1 = y1 * source.width;
  const a = source.data[(row0 + x0) * 3 + channel];
  const b = source.data[(row0 + x1) * 3 + channel];
  const c = source.data[(row1 + x0) * 3 + channel];
  const d = source.data[(row1 + x1) * 3 + channel];
  const top = a + (b - a) * tx;
  const bottom = c + (d - c) * tx;
  return top + (bottom - top) * ty;
}

function bilinearLuma(source, x, y) {
  return luma(
    bilinearChannel(source, x, y, 0),
    bilinearChannel(source, x, y, 1),
    bilinearChannel(source, x, y, 2),
  );
}

async function loadSource(definition) {
  const receipt = JSON.parse(readFileSync(resolve(root, definition.receiptPath), "utf8"));
  verifySealed(receipt, `${definition.id}-receipt`);
  assert(
    receipt.status === "committed-single-request-no-retry"
    && receipt.requestCount === 1
    && receipt.automaticRetryPerformed === false
    && receipt.automaticReplacementPerformed === false
    && receipt.asset.id === definition.id
    && receipt.asset.target === "venus"
    && receipt.asset.license?.id === "NASA-public-domain",
    `v591-venus-${definition.id}-receipt-policy`,
  );
  const sourcePath = resolve(root, receipt.asset.outputPath);
  const bytes = readFileSync(sourcePath);
  assert(bytes.byteLength === receipt.asset.bytes && sha256(bytes) === receipt.asset.sha256, `v591-venus-${definition.id}-source-drift`);
  const { data, info } = await sharp(bytes, { limitInputPixels: false }).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  assert(
    info.channels === 3
    && info.width === receipt.asset.width
    && info.height === receipt.asset.height,
    `v591-venus-${definition.id}-layout`,
  );
  return {
    ...definition,
    data,
    width: info.width,
    height: info.height,
    receipt,
    longitudeRad: definition.longitudeEastDeg / 180 * Math.PI,
  };
}

function buildSourceDerivedPalette(sources) {
  const sums = Array.from({ length: 256 }, () => [0, 0, 0, 0]);
  for (const source of sources.filter((entry) => !entry.gridReference)) {
    const radiusSquared = 0.88 * 0.88;
    for (let y = 0; y < source.height; y += 8) {
      const ny = (y - source.centerY) / source.radiusY;
      for (let x = 0; x < source.width; x += 8) {
        const nx = (x - source.centerX) / source.radiusX;
        if (nx * nx + ny * ny > radiusSquared) continue;
        const offset = (y * source.width + x) * 3;
        const r = source.data[offset];
        const g = source.data[offset + 1];
        const b = source.data[offset + 2];
        const bin = Math.max(0, Math.min(255, Math.round(luma(r, g, b))));
        sums[bin][0] += r;
        sums[bin][1] += g;
        sums[bin][2] += b;
        sums[bin][3] += 1;
      }
    }
  }
  const known = sums.map((entry, index) => entry[3] > 0 ? index : -1).filter((index) => index >= 0);
  assert(known.length > 96, `v591-venus-palette-coverage:${known.length}`);
  const palette = Array.from({ length: 256 }, () => [0, 0, 0]);
  for (let bin = 0; bin < 256; bin += 1) {
    let lower = known[0];
    let upper = known.at(-1);
    for (const candidate of known) {
      if (candidate <= bin) lower = candidate;
      if (candidate >= bin) { upper = candidate; break; }
    }
    const low = sums[lower];
    const high = sums[upper];
    const t = upper === lower ? 0 : (bin - lower) / (upper - lower);
    for (let channel = 0; channel < 3; channel += 1) {
      const a = low[channel] / low[3];
      const b = high[channel] / high[3];
      palette[bin][channel] = a + (b - a) * t;
    }
  }
  const smoothed = palette.map((_, bin) => {
    const output = [0, 0, 0];
    let weight = 0;
    for (let offset = -4; offset <= 4; offset += 1) {
      const sample = palette[Math.max(0, Math.min(255, bin + offset))];
      const w = 5 - Math.abs(offset);
      for (let channel = 0; channel < 3; channel += 1) output[channel] += sample[channel] * w;
      weight += w;
    }
    return output.map((value) => value / weight);
  });
  return smoothed;
}

function buildProjectionTable(sources) {
  return Array.from({ length: DESKTOP_WIDTH }, (_, x) => {
    const longitude = x === DESKTOP_WIDTH - 1 ? -Math.PI : (x / (DESKTOP_WIDTH - 1) * 2 - 1) * Math.PI;
    return sources.filter((source) => !source.gridReference).map((source) => {
      let delta = longitude - source.longitudeRad;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      const facing = Math.cos(delta);
      return { source, sinDelta: Math.sin(delta), facing, weight: facing > 0.04 ? Math.pow(facing, 8) : 0 };
    }).filter((entry) => entry.weight > 0);
  });
}

function unwrapVenusSurface(sources, palette) {
  const output = Buffer.allocUnsafe(DESKTOP_WIDTH * DESKTOP_HEIGHT * 3);
  const luminance = Buffer.allocUnsafe(DESKTOP_WIDTH * DESKTOP_HEIGHT);
  const table = buildProjectionTable(sources);
  const source90 = sources.find((source) => source.longitudeEastDeg === 90);
  const source270 = sources.find((source) => source.longitudeEastDeg === 270);
  assert(source90 && source270, "v591-venus-dateline-fill-sources");
  const gapStart = 172 / 180 * Math.PI;
  const gapEnd = 188 / 180 * Math.PI;
  const edgeDelta = 82 / 180 * Math.PI;
  for (let y = 0; y < DESKTOP_HEIGHT; y += 1) {
    const targetLatitude = (0.5 - y / (DESKTOP_HEIGHT - 1)) * Math.PI;
    const latitude = Math.max(-84 / 180 * Math.PI, Math.min(84 / 180 * Math.PI, targetLatitude));
    const sinLatitude = Math.sin(latitude);
    const cosLatitude = Math.cos(latitude);
    for (let x = 0; x < DESKTOP_WIDTH; x += 1) {
      let longitude = x === DESKTOP_WIDTH - 1 ? -Math.PI : (x / (DESKTOP_WIDTH - 1) * 2 - 1) * Math.PI;
      if (longitude < 0) longitude += Math.PI * 2;
      let value = 0;
      let weight = 0;
      if (longitude >= gapStart && longitude <= gapEnd) {
        const blend = (longitude - gapStart) / (gapEnd - gapStart);
        const sampleY90 = source90.centerY - sinLatitude * source90.radiusY;
        const sampleY270 = source270.centerY - sinLatitude * source270.radiusY;
        const sample90 = bilinearLuma(source90, source90.centerX + cosLatitude * Math.sin(edgeDelta) * source90.radiusX, sampleY90);
        const sample270 = bilinearLuma(source270, source270.centerX - cosLatitude * Math.sin(edgeDelta) * source270.radiusX, sampleY270);
        value = sample90 * (1 - blend) + sample270 * blend;
        weight = 1;
      } else {
        for (const projection of table[x]) {
          const sampleX = projection.source.centerX + cosLatitude * projection.sinDelta * projection.source.radiusX;
          const sampleY = projection.source.centerY - sinLatitude * projection.source.radiusY;
          const radialX = (sampleX - projection.source.centerX) / projection.source.radiusX;
          const radialY = (sampleY - projection.source.centerY) / projection.source.radiusY;
          if (radialX * radialX + radialY * radialY > 0.995) continue;
          const sample = bilinearLuma(projection.source, sampleX, sampleY);
          value += sample * projection.weight;
          weight += projection.weight;
        }
      }
      const normalized = Math.max(0, Math.min(255, Math.round(weight > 0 ? value / weight : 96)));
      luminance[y * DESKTOP_WIDTH + x] = normalized;
      const color = palette[normalized];
      const outputOffset = (y * DESKTOP_WIDTH + x) * 3;
      output[outputOffset] = Math.max(0, Math.min(255, Math.round(color[0])));
      output[outputOffset + 1] = Math.max(0, Math.min(255, Math.round(color[1])));
      output[outputOffset + 2] = Math.max(0, Math.min(255, Math.round(color[2])));
    }
  }
  for (let y = 0; y < DESKTOP_HEIGHT; y += 1) {
    const first = y * DESKTOP_WIDTH;
    const last = first + DESKTOP_WIDTH - 1;
    luminance[last] = luminance[first];
    for (let channel = 0; channel < 3; channel += 1) output[last * 3 + channel] = output[first * 3 + channel];
  }
  return { output, luminance, gridReferenceWeightFraction: 0, datelineBlendWidthDeg: 16 };
}

function percentileBounds(values) {
  const histogram = new Uint32Array(256);
  for (const value of values) histogram[value] += 1;
  const total = values.length;
  const threshold = (ratio) => {
    const target = total * ratio;
    let cumulative = 0;
    for (let index = 0; index < histogram.length; index += 1) {
      cumulative += histogram[index];
      if (cumulative >= target) return index;
    }
    return 255;
  };
  return { low: threshold(0.02), high: threshold(0.98) };
}

function derivePresentationChannels(luminance) {
  const range = percentileBounds(luminance);
  const inverseRange = 1 / Math.max(1, range.high - range.low);
  const height = Buffer.allocUnsafe(DESKTOP_WIDTH * DESKTOP_HEIGHT);
  const normal = Buffer.allocUnsafe(DESKTOP_WIDTH * DESKTOP_HEIGHT * 3);
  const roughness = Buffer.allocUnsafe(DESKTOP_WIDTH * DESKTOP_HEIGHT);
  for (let y = 0; y < DESKTOP_HEIGHT; y += 1) {
    const latitude = (0.5 - y / (DESKTOP_HEIGHT - 1)) * Math.PI;
    const longitudeCompensation = 1 / Math.max(0.16, Math.cos(latitude));
    const upRow = Math.max(0, y - 1) * DESKTOP_WIDTH;
    const row = y * DESKTOP_WIDTH;
    const downRow = Math.min(DESKTOP_HEIGHT - 1, y + 1) * DESKTOP_WIDTH;
    for (let x = 0; x < DESKTOP_WIDTH - 1; x += 1) {
      const left = x === 0 ? DESKTOP_WIDTH - 2 : x - 1;
      const right = x === DESKTOP_WIDTH - 2 ? 0 : x + 1;
      const encoded = Math.max(0, Math.min(255, Math.round((luminance[row + x] - range.low) * inverseRange * 255)));
      height[row + x] = encoded;
      const dx = (luminance[row + right] - luminance[row + left]) / 255 * longitudeCompensation;
      const dy = (luminance[upRow + x] - luminance[downRow + x]) / 255;
      let nx = -dx * 1.15;
      let ny = -dy * 1.15;
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
      roughness[row + x] = Math.round((0.79 + gradient * 0.17) * 255);
    }
    const first = row;
    const last = row + DESKTOP_WIDTH - 1;
    height[last] = height[first];
    roughness[last] = roughness[first];
    for (let channel = 0; channel < 3; channel += 1) normal[last * 3 + channel] = normal[first * 3 + channel];
  }
  return { height, normal, roughness, range };
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
  const mobilePng = resolve(temporaryRoot, `${id}-mobile-${mobileWidth}x${mobileHeight}.png`);
  const liteDesktopPng = resolve(temporaryRoot, `${id}-lite-desktop-1024x512.png`);
  const liteMobilePng = resolve(temporaryRoot, `${id}-lite-mobile-512x256.png`);
  await sharp(desktopPng, { limitInputPixels: false }).resize(mobileWidth, mobileHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 8 }).toFile(mobilePng);
  await sharp(desktopPng, { limitInputPixels: false }).resize(1024, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 8 }).toFile(liteDesktopPng);
  await sharp(desktopPng, { limitInputPixels: false }).resize(512, 256, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 8 }).toFile(liteMobilePng);
  const ktxArgs = (output, input) => [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda),
    "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap",
    "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none",
    output, input,
  ];
  for (const [target, input, label] of [
    [paths.desktopKtx2, desktopPng, "desktop"],
    [paths.mobileKtx2, mobilePng, "mobile"],
  ]) {
    const partial = `${target}.${process.pid}.part`;
    runTool(toktx, ktxArgs(partial, input), `v591-venus-${id}-${label}-ktx2`);
    rmSync(target, { force: true });
    renameSync(partial, target);
  }
  const webp = async (input, output, quality) => atomicWrite(output, await sharp(input, { limitInputPixels: false })
    .webp(losslessFallback ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true }).toBuffer());
  await webp(desktopPng, paths.desktopFallback, 93);
  await webp(mobilePng, paths.mobileFallback, 91);
  await webp(liteDesktopPng, paths.liteDesktop, 88);
  await webp(liteMobilePng, paths.liteMobile, 86);
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id,
    body: "venus",
    role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/venus/full/desktop/${id}.ktx2`, desktopWidth, desktopHeight, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/venus/full/desktop/${id}.webp`, desktopWidth, desktopHeight, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-93"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/venus/full/mobile/${id}.ktx2`, mobileWidth, mobileHeight, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/venus/full/mobile/${id}.webp`, mobileWidth, mobileHeight, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-91"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/venus/lite/desktop/${id}.webp`, 1024, 512, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-88"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/venus/lite/mobile/${id}.webp`, 512, 256, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-86"),
    },
  };
}

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const sources = [];
for (const definition of SOURCE_DEFINITIONS) sources.push(await loadSource(definition));
const palette = buildSourceDerivedPalette(sources);
const unwrapped = unwrapVenusSurface(sources, palette);
const derived = derivePresentationChannels(unwrapped.luminance);
const surfacePng = resolve(temporaryRoot, "venus-surface-4096x2048.png");
const normalPng = resolve(temporaryRoot, "venus-normal-4096x2048.png");
const roughnessPng = resolve(temporaryRoot, "venus-roughness-2048x1024.png");
const heightPng = resolve(temporaryRoot, "venus-height-4096x2048.png");
await sharp(unwrapped.output, { raw: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(surfacePng);
await sharp(derived.normal, { raw: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(normalPng);
await sharp(derived.roughness, { raw: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, channels: 1 }, limitInputPixels: false }).resize(2048, 1024, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 8 }).toFile(roughnessPng);
await sharp(derived.height, { raw: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT, channels: 1 }, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(heightPng);

const encoded = [];
encoded.push(await encodeAsset({ id: "venus-surface", role: "magellan-multiview-radar-surface", desktopPng: surfacePng, desktopWidth: 4096, desktopHeight: 2048, mobileWidth: MOBILE_WIDTH, mobileHeight: MOBILE_HEIGHT, colorSpace: "srgb", losslessFallback: false, rdoLambda: 0.72 }));
encoded.push(await encodeAsset({ id: "venus-normal", role: "magellan-radar-derived-normal", desktopPng: normalPng, desktopWidth: 4096, desktopHeight: 2048, mobileWidth: MOBILE_WIDTH, mobileHeight: MOBILE_HEIGHT, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.45 }));
encoded.push(await encodeAsset({ id: "venus-roughness", role: "magellan-radar-derived-roughness", desktopPng: roughnessPng, desktopWidth: 2048, desktopHeight: 1024, mobileWidth: MOBILE_WIDTH, mobileHeight: MOBILE_HEIGHT, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.55 }));
encoded.push(await encodeAsset({ id: "venus-height", role: "magellan-radar-presentation-relief", desktopPng: heightPng, desktopWidth: 4096, desktopHeight: 2048, mobileWidth: MOBILE_WIDTH, mobileHeight: MOBILE_HEIGHT, colorSpace: "linear", losslessFallback: true, rdoLambda: 0.35 }));

const sourceComponents = sources.filter((source) => !source.gridReference).map((source) => ({
  id: source.id,
  acquisitionReceiptSha256: source.receipt.receiptSha256,
  path: source.receipt.asset.outputPath,
  url: source.receipt.asset.sourceUrl,
  finalUrl: source.receipt.asset.finalUrl,
  host: new URL(source.receipt.asset.finalUrl).hostname,
  license: source.receipt.asset.license,
  bytes: source.receipt.asset.bytes,
  sha256: source.receipt.asset.sha256,
  width: source.receipt.asset.width,
  height: source.receipt.asset.height,
  observationIdentity: source.receipt.asset.observationIdentity,
  fieldCoverage: source.receipt.asset.fieldCoverage,
  longitudeEastDeg: source.longitudeEastDeg,
  gridReference: source.gridReference,
}));
const sourceReceiptSha256s = sourceComponents.map((source) => source.acquisitionReceiptSha256);
const compositeAcquisitionReceiptSha256 = canonicalSha(sourceReceiptSha256s);
const primarySource = sourceComponents[0];
const assets = encoded.map((asset) => ({
  ...asset,
  source: primarySource,
  sourceComponents,
  derivation: {
    tool: "sharp+v591-clean-three-view-orthographic-to-equirectangular+KTX-Software",
    version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
    parameters: "NASA/JPL 0E,90E,270E clean orthographic Magellan views; fixed audited disk calibration; cos^8 overlap; 16deg 90E/270E observed-limb dateline crossfade; PIA00478 excluded after grid/label QA failure; source-derived luminance/color LUT; latitude bounded at 84deg; exact duplicated longitude seam; UASTC RDO single-thread",
    terrainMode: "radar-luminance-bounded-presentation-relief-not-measured-topography",
    sourceLuminancePercentiles: derived.range,
    reliefScaleRadiusFraction: 0.0014,
    normalReliefGain: 1.15,
    gridReferenceWeightFraction: unwrapped.gridReferenceWeightFraction,
    observationLimit: "The derived map is a presentation-only blend of three clean NASA/JPL computer-projected Magellan radar globes. A 16-degree band around 180E crossfades observed limb samples because the independent 180E source contains visible grid and labels and is excluded. Radar brightness is not physical elevation; derived normal, roughness and relief make no topography claim.",
  },
  fullQualityMinimum: {
    desktop: { width: asset.variants.desktopKtx2.width, height: asset.variants.desktopKtx2.height },
    mobile: { width: asset.variants.mobileKtx2.width, height: asset.variants.mobileKtx2.height },
  },
  presentationOnly: true,
}));

const unsigned = {
  version: "v591-venus-asset-overlay-v1",
  generatedAt,
  status: "venus-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: compositeAcquisitionReceiptSha256,
  sourceReceiptSha256s,
  metadataReceiptSha256: "911d9d3877c961f56e4630dafb3e32d0ab24dbdc5e4c7e8f4b65138f0b732dc8",
  noNetworkRequestsPerformed: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  surfaceCoverage: {
    projectionCentersEastDeg: [0, 90, 270],
    normalizedLongitudeCoverage: "three-clean-view-overlap-with-observed-limb-dateline-crossfade",
    polarPolicy: "observed-latitude-clamped-at-84deg-no-synthetic-feature-injection",
    gridReferencePolicy: "PIA00478-excluded-after-visual-qa-grid-and-label-contamination",
    datelineBlendWidthDeg: unwrapped.datelineBlendWidthDeg,
    measuredTopographyClaim: false,
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
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
const generatedSource = readFileSync(generatedConstantsPath, "utf8");
const nextGeneratedSource = generatedSource.replace(
  /export const CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591 = "[a-f0-9]{64}" as const;/,
  `export const CELESTIAL_CONVERGENCE_VENUS_ASSET_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`,
);
assert(nextGeneratedSource !== generatedSource, "v591-venus-generated-constant-replacement");
atomicWrite(generatedConstantsPath, Buffer.from(nextGeneratedSource, "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  status: overlay.status,
  projectionCentersEastDeg: overlay.surfaceCoverage.projectionCentersEastDeg,
  gridReferenceWeightFraction: unwrapped.gridReferenceWeightFraction,
  luminancePercentiles: derived.range,
  assets: assets.map((asset) => ({
    id: asset.id,
    role: asset.role,
    desktop: `${asset.variants.desktopKtx2.width}x${asset.variants.desktopKtx2.height}`,
    desktopBytes: asset.variants.desktopKtx2.bytes,
    fallbackBytes: asset.variants.desktopFallback.bytes,
  })),
  receiptSha256: overlay.receiptSha256,
}, null, 2));
