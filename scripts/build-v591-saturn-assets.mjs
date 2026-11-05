import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-saturn.json");
const supplementPath = resolve(root, "docs/release/v591/acquisition-receipt-saturn-atmosphere-supplement.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/saturn-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/saturn");
const temporaryRoot = resolve(root, "tmp/v591-saturn-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const NORTH_POLAR_EXTRAPOLATION_LATITUDE_RAD = Math.PI * (68 / 180);
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
  assert(canonicalSha(unsigned) === document[field], `v591-saturn-${label}-seal`);
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
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(edge0, edge1, value) {
  const unit = clamp((value - edge0) / Math.max(1e-12, edge1 - edge0));
  return unit * unit * (3 - 2 * unit);
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) * 0.5 : sorted[middle];
}

function duplicateSeam(raw, width, height, channels) {
  for (let y = 0; y < height; y += 1) {
    const left = y * width * channels;
    const right = (y * width + width - 1) * channels;
    for (let channel = 0; channel < channels; channel += 1) raw[right + channel] = raw[left + channel];
  }
}

function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}

async function resizePng(input, width, height, output, seamSafe) {
  const { data, info } = await sharp(input, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (seamSafe) duplicateSeam(data, info.width, info.height, info.channels);
  await sharp(data, { raw: info, limitInputPixels: false })
    .png({ compressionLevel: 8, adaptiveFiltering: true })
    .toFile(output);
}

async function encodeAsset({ id, role, desktopPng, desktop, mobile, liteDesktop, liteMobile, colorSpace, lossless, rdoLambda, seamSafe }) {
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
  await resizePng(desktopPng, mobile[0], mobile[1], mobilePng, seamSafe);
  await resizePng(desktopPng, liteDesktop[0], liteDesktop[1], liteDesktopPng, seamSafe);
  await resizePng(desktopPng, liteMobile[0], liteMobile[1], liteMobilePng, seamSafe);
  const ktxArgs = (output, input) => [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda),
    "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap",
    "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none",
    output, input,
  ];
  for (const [path, input, label] of [
    [paths.desktopKtx2, desktopPng, "desktop"],
    [paths.mobileKtx2, mobilePng, "mobile"],
  ]) {
    const partial = `${path}.${process.pid}.part`;
    runTool(toktx, ktxArgs(partial, input), `v591-saturn-${id}-${label}-ktx2`);
    rmSync(path, { force: true });
    renameSync(partial, path);
  }
  const encodeWebp = async (input, output, quality) => atomicWrite(
    output,
    await sharp(input, { limitInputPixels: false }).webp(
      lossless ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true },
    ).toBuffer(),
  );
  await encodeWebp(desktopPng, paths.desktopFallback, 94);
  await encodeWebp(mobilePng, paths.mobileFallback, 92);
  await encodeWebp(liteDesktopPng, paths.liteDesktop, 88);
  await encodeWebp(liteMobilePng, paths.liteMobile, 86);
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id,
    body: "saturn",
    role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/saturn/full/desktop/${id}.ktx2`, desktop[0], desktop[1], "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/saturn/full/desktop/${id}.webp`, desktop[0], desktop[1], "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-94"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/saturn/full/mobile/${id}.ktx2`, mobile[0], mobile[1], "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/saturn/full/mobile/${id}.webp`, mobile[0], mobile[1], "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-92"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/saturn/lite/desktop/${id}.webp`, liteDesktop[0], liteDesktop[1], "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-88"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/saturn/lite/mobile/${id}.webp`, liteMobile[0], liteMobile[1], "webp", colorSpace, lossless ? "webp-lossless" : "webp-quality-86"),
    },
  };
}

function sourceRecord(asset, receiptSha256) {
  return {
    acquisitionReceiptSha256: receiptSha256,
    path: asset.outputPath,
    url: asset.sourceUrl,
    finalUrl: asset.finalUrl,
    host: new URL(asset.finalUrl).hostname,
    license: asset.license,
    bytes: asset.bytes,
    sha256: asset.sha256,
    width: asset.width,
    height: asset.height,
    bitDepth: asset.bitDepth,
    observationIdentity: asset.observationIdentity,
    observationLimit: asset.observationLimit,
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
const supplement = JSON.parse(readFileSync(supplementPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
verifySealed(supplement, "receiptSha256", "atmosphere-supplement");
assert(acquisition.status === "acquired-two-urls-single-request-each-no-retry" && acquisition.assets?.length === 2, "v591-saturn-acquisition-contract");
assert(supplement.status === "acquired-explicit-supplement-single-request-no-retry" && supplement.policy?.explicitSupplement === true, "v591-saturn-supplement-contract");
const polarSource = acquisition.assets.find((asset) => asset.id === "saturn-cassini-atmosphere-source-v591");
const ringSource = acquisition.assets.find((asset) => asset.id === "saturn-cassini-rings-source-v591");
const globalSource = supplement.asset;
assert(polarSource && ringSource && globalSource?.id === "saturn-cassini-global-atmosphere-source-v591", "v591-saturn-source-identities");
for (const [asset, receipt] of [[polarSource, acquisition], [ringSource, acquisition], [globalSource, supplement]]) {
  const bytes = readFileSync(resolve(root, asset.outputPath));
  assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v591-saturn-source-drift:${asset.id}`);
  assert(new URL(asset.finalUrl).hostname === "images-assets.nasa.gov" && asset.license?.id === "NASA-JPL-public-domain", `v591-saturn-source-provenance:${asset.id}`);
  assert(receipt.automaticRetryPerformed === false && receipt.automaticReplacementPerformed === false, `v591-saturn-source-policy:${asset.id}`);
}

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });

const globalPath = resolve(root, globalSource.outputPath);
const { data: globalPixels, info: globalInfo } = await sharp(globalPath, { limitInputPixels: false })
  .removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
assert(globalInfo.width === 8888 && globalInfo.height === 4544 && globalInfo.channels === 3, "v591-saturn-global-source-layout");
const sphereRegistration = Object.freeze({ centerX: 4590, centerY: 2600, radiusX: 1630, radiusY: 1510, ringOcclusionY: [1320, 2020] });
const sampleGlobal = (x, y) => {
  const sx = Math.max(0, Math.min(globalInfo.width - 1, Math.round(x)));
  const sy = Math.max(0, Math.min(globalInfo.height - 1, Math.round(y)));
  const offset = (sy * globalInfo.width + sx) * 3;
  return [globalPixels[offset], globalPixels[offset + 1], globalPixels[offset + 2]];
};
const atmosphereWidth = 8192;
const atmosphereHeight = 4096;
const rowProfiles = new Array(atmosphereHeight);
const rowCoordinates = new Float64Array(atmosphereHeight);
const validRow = new Uint8Array(atmosphereHeight);
for (let y = 0; y < atmosphereHeight; y += 1) {
  const latitude = Math.PI * (0.5 - (y + 0.5) / atmosphereHeight);
  const sourceY = sphereRegistration.centerY - Math.sin(latitude) * sphereRegistration.radiusY;
  rowCoordinates[y] = sourceY;
  const sourceHalfWidth = Math.max(4, Math.cos(latitude) * sphereRegistration.radiusX);
  const red = [];
  const green = [];
  const blue = [];
  for (let sample = 0; sample < 96; sample += 1) {
    const factor = 0.19 + 0.52 * (sample + 0.5) / 96;
    const rgb = sampleGlobal(sphereRegistration.centerX + sourceHalfWidth * factor, sourceY);
    const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    if (luminance > 28 && luminance < 248) {
      red.push(rgb[0]); green.push(rgb[1]); blue.push(rgb[2]);
    }
  }
  const occluded = sourceY >= sphereRegistration.ringOcclusionY[0] && sourceY <= sphereRegistration.ringOcclusionY[1];
  const polarExtrapolation = latitude > NORTH_POLAR_EXTRAPOLATION_LATITUDE_RAD;
  if (red.length >= 48 && !occluded && !polarExtrapolation) {
    rowProfiles[y] = [median(red), median(green), median(blue)];
    validRow[y] = 1;
  }
}
function nearestValidRow(start, direction) {
  for (let y = start; y >= 0 && y < atmosphereHeight; y += direction) if (validRow[y]) return y;
  return null;
}
for (let y = 0; y < atmosphereHeight; y += 1) {
  if (validRow[y]) continue;
  const before = nearestValidRow(y - 1, -1);
  const after = nearestValidRow(y + 1, 1);
  assert(before !== null || after !== null, `v591-saturn-atmosphere-row-unresolved:${y}`);
  if (before === null) rowProfiles[y] = [...rowProfiles[after]];
  else if (after === null) rowProfiles[y] = [...rowProfiles[before]];
  else {
    const blend = (y - before) / (after - before);
    rowProfiles[y] = rowProfiles[before].map((value, channel) => value * (1 - blend) + rowProfiles[after][channel] * blend);
  }
}
const rawProfileLuminance = Float64Array.from(rowProfiles, (profile) => profile[0] * 0.2126 + profile[1] * 0.7152 + profile[2] * 0.0722);
const illuminationNeutralProfileLuminance = new Float64Array(atmosphereHeight);
for (let y = 0; y < atmosphereHeight; y += 1) {
  let localBaseline = 0;
  let localSamples = 0;
  for (let row = Math.max(0, y - 96); row <= Math.min(atmosphereHeight - 1, y + 96); row += 1) {
    localBaseline += rawProfileLuminance[row];
    localSamples += 1;
  }
  localBaseline /= localSamples;
  const sourceBandResidual = clamp((rawProfileLuminance[y] - localBaseline) * 0.42, -18, 18);
  const targetLuminance = 184 + sourceBandResidual;
  const scale = targetLuminance / Math.max(1, rawProfileLuminance[y]);
  rowProfiles[y] = rowProfiles[y].map((value) => clamp(value * scale, 0, 238));
  illuminationNeutralProfileLuminance[y] = rowProfiles[y][0] * 0.2126 + rowProfiles[y][1] * 0.7152 + rowProfiles[y][2] * 0.0722;
}
const atmosphere = Buffer.allocUnsafe(atmosphereWidth * atmosphereHeight * 3);
const bandRows = new Float64Array(atmosphereHeight);
for (let y = 0; y < atmosphereHeight; y += 1) {
  const profile = rowProfiles[y];
  bandRows[y] = illuminationNeutralProfileLuminance[y];
  for (let x = 0; x < atmosphereWidth; x += 1) {
    const offset = (y * atmosphereWidth + x) * 3;
    for (let channel = 0; channel < 3; channel += 1) {
      atmosphere[offset + channel] = Math.round(clamp(profile[channel], 0, 255));
    }
  }
}
duplicateSeam(atmosphere, atmosphereWidth, atmosphereHeight, 3);
const atmospherePng = resolve(temporaryRoot, "saturn-atmosphere-albedo.png");
await sharp(atmosphere, { raw: { width: atmosphereWidth, height: atmosphereHeight, channels: 3 }, limitInputPixels: false })
  .png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(atmospherePng);

const bandWidth = 4096;
const bandHeight = 2048;
const bandMask = Buffer.allocUnsafe(bandWidth * bandHeight);
for (let y = 0; y < bandHeight; y += 1) {
  const sourceRow = Math.min(atmosphereHeight - 1, Math.floor((y + 0.5) / bandHeight * atmosphereHeight));
  let smooth = 0;
  let count = 0;
  for (let row = Math.max(0, sourceRow - 48); row <= Math.min(atmosphereHeight - 1, sourceRow + 48); row += 1) {
    smooth += bandRows[row]; count += 1;
  }
  smooth /= count;
  const signal = clamp(0.5 + (bandRows[sourceRow] - smooth) / 28);
  for (let x = 0; x < bandWidth; x += 1) bandMask[y * bandWidth + x] = Math.round(signal * 255);
}
duplicateSeam(bandMask, bandWidth, bandHeight, 1);
const bandPng = resolve(temporaryRoot, "saturn-band-mask.png");
await sharp(bandMask, { raw: { width: bandWidth, height: bandHeight, channels: 1 }, limitInputPixels: false })
  .png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(bandPng);

const polarPng = resolve(temporaryRoot, "saturn-polar-detail.png");
await sharp(resolve(root, polarSource.outputPath), { limitInputPixels: false })
  .extract({ left: 100, top: 330, width: 760, height: 760 })
  .greyscale().normalize().resize(1024, 1024, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .blur(0.35).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(polarPng);

const ringPath = resolve(root, ringSource.outputPath);
const { data: ringPixels, info: ringInfo } = await sharp(ringPath, { limitInputPixels: false })
  .removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
assert(ringInfo.width === 1959 && ringInfo.height === 1000 && ringInfo.channels === 3, "v591-saturn-ring-source-layout");
const gradientAngleDeg = 24.601021407481408;
const gradientAngle = gradientAngleDeg * Math.PI / 180;
const gradientCos = Math.cos(gradientAngle);
const gradientSin = Math.sin(gradientAngle);
const cornerCoordinates = [
  [0, 0], [ringInfo.width - 1, 0], [0, ringInfo.height - 1], [ringInfo.width - 1, ringInfo.height - 1],
].map(([x, y]) => x * gradientCos + y * gradientSin);
const coordinateMinimum = Math.min(...cornerCoordinates);
const coordinateMaximum = Math.max(...cornerCoordinates);
const binCount = 4096;
const redBins = new Float64Array(binCount);
const greenBins = new Float64Array(binCount);
const blueBins = new Float64Array(binCount);
const binSamples = new Uint32Array(binCount);
for (let y = 4; y < ringInfo.height - 4; y += 1) {
  for (let x = 4; x < ringInfo.width - 4; x += 1) {
    const coordinate = (x * gradientCos + y * gradientSin - coordinateMinimum) / (coordinateMaximum - coordinateMinimum);
    const bin = Math.max(0, Math.min(binCount - 1, Math.floor(coordinate * binCount)));
    const offset = (y * ringInfo.width + x) * 3;
    redBins[bin] += ringPixels[offset];
    greenBins[bin] += ringPixels[offset + 1];
    blueBins[bin] += ringPixels[offset + 2];
    binSamples[bin] += 1;
  }
}
let maximumBinSamples = 0;
for (const value of binSamples) maximumBinSamples = Math.max(maximumBinSamples, value);
const validBins = [];
for (let bin = 0; bin < binCount; bin += 1) if (binSamples[bin] >= maximumBinSamples * 0.55) validBins.push(bin);
assert(validBins.length > binCount * 0.60, "v591-saturn-ring-profile-coverage");
const firstValidBin = validBins[0];
const lastValidBin = validBins.at(-1);
const profile = new Array(binCount);
for (let bin = firstValidBin; bin <= lastValidBin; bin += 1) {
  if (binSamples[bin] > 0) profile[bin] = [redBins[bin] / binSamples[bin], greenBins[bin] / binSamples[bin], blueBins[bin] / binSamples[bin]];
}
let previous = firstValidBin;
for (let bin = firstValidBin; bin <= lastValidBin; bin += 1) {
  if (profile[bin]) { previous = bin; continue; }
  let next = bin + 1;
  while (next <= lastValidBin && !profile[next]) next += 1;
  profile[bin] = next <= lastValidBin
    ? profile[previous].map((value, channel) => value + (profile[next][channel] - value) * ((bin - previous) / (next - previous)))
    : [...profile[previous]];
}
const ringWidth = 4096;
const ringHeight = 64;
const ringColor = Buffer.allocUnsafe(ringWidth * ringHeight * 3);
const ringDepth = Buffer.allocUnsafe(ringWidth * ringHeight);
const ringLuminance = new Float64Array(ringWidth);
for (let x = 0; x < ringWidth; x += 1) {
  const unit = x / (ringWidth - 1);
  const sourceBin = Math.round(firstValidBin + unit * (lastValidBin - firstValidBin));
  const color = profile[sourceBin];
  ringLuminance[x] = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
  for (let y = 0; y < ringHeight; y += 1) {
    const offset = (y * ringWidth + x) * 3;
    ringColor[offset] = Math.round(color[0]);
    ringColor[offset + 1] = Math.round(color[1]);
    ringColor[offset + 2] = Math.round(color[2]);
  }
}
const luminanceMinimum = Math.min(...ringLuminance);
const luminanceMaximum = Math.max(...ringLuminance);
const ringKilometers = Object.freeze({ inner: 66_900, outer: 140_220, saturnEquatorialRadius: 60_268, cassiniStart: 117_580, cassiniEnd: 122_170, enckeCenter: 133_589, enckeWidth: 325 });
const ringRange = ringKilometers.outer - ringKilometers.inner;
const cassiniStart = (ringKilometers.cassiniStart - ringKilometers.inner) / ringRange;
const cassiniEnd = (ringKilometers.cassiniEnd - ringKilometers.inner) / ringRange;
const enckeCenter = (ringKilometers.enckeCenter - ringKilometers.inner) / ringRange;
const enckeHalfWidth = ringKilometers.enckeWidth * 0.5 / ringRange;
for (let x = 0; x < ringWidth; x += 1) {
  const unit = x / (ringWidth - 1);
  const sourceDepth = 0.055 + 0.90 * Math.pow(clamp((ringLuminance[x] - luminanceMinimum) / Math.max(1, luminanceMaximum - luminanceMinimum)), 0.72);
  const innerFade = smoothstep(0, 0.018, unit);
  const outerFade = 1 - smoothstep(0.985, 1, unit);
  const dRing = unit < 0.105 ? 0.18 : 1;
  const cRing = unit >= 0.105 && unit < 0.31 ? 0.52 : 1;
  const cassini = 1 - 0.985 * smoothstep(cassiniStart - 0.006, cassiniStart + 0.003, unit) * (1 - smoothstep(cassiniEnd - 0.003, cassiniEnd + 0.006, unit));
  const encke = 1 - 0.94 * (1 - smoothstep(enckeHalfWidth * 0.35, enckeHalfWidth * 1.8, Math.abs(unit - enckeCenter)));
  const fRing = 0.30 + 0.70 * Math.exp(-(((unit - 0.979) / 0.0065) ** 2));
  const outerZone = unit > 0.955 ? fRing : 1;
  const depth = clamp(sourceDepth * innerFade * outerFade * dRing * cRing * cassini * encke * outerZone);
  for (let y = 0; y < ringHeight; y += 1) ringDepth[y * ringWidth + x] = Math.round(depth * 255);
}
const ringColorPng = resolve(temporaryRoot, "saturn-ring-color.png");
const ringDepthPng = resolve(temporaryRoot, "saturn-ring-optical-depth.png");
await sharp(ringColor, { raw: { width: ringWidth, height: ringHeight, channels: 3 }, limitInputPixels: false })
  .png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(ringColorPng);
await sharp(ringDepth, { raw: { width: ringWidth, height: ringHeight, channels: 1 }, limitInputPixels: false })
  .png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(ringDepthPng);

const encoded = [
  await encodeAsset({ id: "saturn-atmosphere-albedo", role: "cassini-global-atmosphere-albedo", desktopPng: atmospherePng, desktop: [8192, 4096], mobile: [2048, 1024], liteDesktop: [1024, 512], liteMobile: [512, 256], colorSpace: "srgb", lossless: false, rdoLambda: 0.78, seamSafe: true }),
  await encodeAsset({ id: "saturn-band-mask", role: "cassini-derived-latitudinal-band-mask", desktopPng: bandPng, desktop: [4096, 2048], mobile: [2048, 1024], liteDesktop: [1024, 512], liteMobile: [512, 256], colorSpace: "linear", lossless: true, rdoLambda: 0.52, seamSafe: true }),
  await encodeAsset({ id: "saturn-polar-detail", role: "cassini-north-polar-morphology", desktopPng: polarPng, desktop: [1024, 1024], mobile: [1024, 1024], liteDesktop: [512, 512], liteMobile: [256, 256], colorSpace: "linear", lossless: true, rdoLambda: 0.50, seamSafe: false }),
  await encodeAsset({ id: "saturn-ring-color", role: "cassini-derived-radial-ring-color", desktopPng: ringColorPng, desktop: [4096, 64], mobile: [2048, 64], liteDesktop: [1024, 32], liteMobile: [512, 16], colorSpace: "srgb", lossless: false, rdoLambda: 0.72, seamSafe: false }),
  await encodeAsset({ id: "saturn-ring-optical-depth", role: "cassini-derived-radial-ring-optical-depth", desktopPng: ringDepthPng, desktop: [4096, 64], mobile: [2048, 64], liteDesktop: [1024, 32], liteMobile: [512, 16], colorSpace: "linear", lossless: true, rdoLambda: 0.42, seamSafe: false }),
];

const globalSourceRecord = sourceRecord(globalSource, supplement.receiptSha256);
const polarSourceRecord = sourceRecord(polarSource, acquisition.receiptSha256);
const ringSourceRecord = sourceRecord(ringSource, acquisition.receiptSha256);
const assets = encoded.map((asset) => {
  const source = asset.id === "saturn-polar-detail" ? polarSourceRecord
    : asset.id.startsWith("saturn-ring-") ? ringSourceRecord
      : globalSourceRecord;
  const parameters = asset.id === "saturn-atmosphere-albedo"
    ? "PIA06193 registered Saturn disk; illumination-neutral source-derived latitude profile repeated axisymmetrically to a seam-safe 8192x4096 presentation map; ring-occluded rows interpolated; no unseen-longitude observation claim"
    : asset.id === "saturn-band-mask"
      ? "PIA06193 source-derived latitude profile minus fixed 97-row low-pass baseline; no random signal"
      : asset.id === "saturn-polar-detail"
        ? "PIA21617 fixed 760x760 north-polar crop, grayscale normalization and 0.35px blur; shader-gated to the north polar cap"
        : "PIA21628 structure-tensor radial gradient 24.601021407481408deg; 55%-coverage bins; registered D/C/B/A/F zones, Cassini Division and Encke gap";
  return {
    ...asset,
    source,
    derivation: {
      tool: "sharp+KTX-Software",
      version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
      parameters,
      sourceDetailCeiling: `${source.width}x${source.height}`,
      seamMeanAbsoluteDelta: asset.id === "saturn-atmosphere-albedo" || asset.id === "saturn-band-mask" ? 0 : undefined,
      sphereRegistration: asset.id.startsWith("saturn-atmosphere") || asset.id === "saturn-band-mask" ? sphereRegistration : undefined,
      radialGradientAngleDeg: asset.id.startsWith("saturn-ring-") ? gradientAngleDeg : undefined,
      radialValidBinRange: asset.id.startsWith("saturn-ring-") ? [firstValidBin, lastValidBin] : undefined,
      ringKilometers: asset.id.startsWith("saturn-ring-") ? ringKilometers : undefined,
      cassiniNormalizedRange: asset.id.startsWith("saturn-ring-") ? [cassiniStart, cassiniEnd] : undefined,
      enckeNormalizedCenter: asset.id.startsWith("saturn-ring-") ? enckeCenter : undefined,
      enckeNormalizedHalfWidth: asset.id.startsWith("saturn-ring-") ? enckeHalfWidth : undefined,
    },
    fullQualityMinimum: {
      desktop: { width: asset.variants.desktopKtx2.width, height: asset.variants.desktopKtx2.height },
      mobile: { width: asset.variants.mobileKtx2.width, height: asset.variants.mobileKtx2.height },
    },
    presentationOnly: true,
  };
});
const unsigned = {
  version: "v591-saturn-asset-overlay-v1",
  generatedAt,
  status: "saturn-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  atmosphereSupplementReceiptSha256: supplement.receiptSha256,
  noNetworkRequestsPerformed: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  mirroredObservedSectorDisclosure: true,
  ringGeometry: {
    innerRadiusSaturnEquatorial: ringKilometers.inner / ringKilometers.saturnEquatorialRadius,
    outerRadiusSaturnEquatorial: ringKilometers.outer / ringKilometers.saturnEquatorialRadius,
    cassiniNormalizedRange: [cassiniStart, cassiniEnd],
    enckeNormalizedCenter: enckeCenter,
    enckeNormalizedHalfWidth: enckeHalfWidth,
    radialUv: true,
    premultipliedAlpha: true,
    depthWrite: false,
    depthTest: true,
  },
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
  JUPITER: JSON.parse(readFileSync(resolve(root, "public/data/celestial-convergence-v591/jupiter-asset-overlay.json"), "utf8")),
  SATURN: overlay,
};
for (const [name, value] of Object.entries(overlays)) verifySealed(value, "receiptSha256", `${name.toLowerCase()}-overlay`);
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Sun, Earth, Moon, Mars, Jupiter, and Saturn asset overlays.",
  ...Object.entries(overlays).map(([name, value]) => `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = "${value.receiptSha256}" as const;`),
  "",
].join("\n"), "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({
  status: overlay.status,
  sources: { global: `${globalSource.width}x${globalSource.height}`, polar: `${polarSource.width}x${polarSource.height}`, rings: `${ringSource.width}x${ringSource.height}` },
  ringProfile: { gradientAngleDeg, validBinRange: [firstValidBin, lastValidBin], cassiniNormalizedRange: [cassiniStart, cassiniEnd], enckeNormalizedCenter: enckeCenter },
  assets: assets.map((asset) => ({ id: asset.id, desktopBytes: asset.variants.desktopKtx2.bytes, mobileBytes: asset.variants.mobileKtx2.bytes })),
  receiptSha256: overlay.receiptSha256,
}, null, 2));
