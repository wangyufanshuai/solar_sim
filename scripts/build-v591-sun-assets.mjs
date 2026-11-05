import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-sun.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/sun-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/sun");
const temporaryRoot = resolve(root, "tmp/v591-sun-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function verifySealed(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v591-sun-${label}-seal`);
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

function luminance(data, offset) {
  return data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
}

function detectDisk(data, width, height, id) {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const centerLuma = luminance(data, (centerY * width + centerX) * 3);
  const threshold = Math.max(10, centerLuma * 0.16);
  const sample = (x, y) => {
    let total = 0;
    let count = 0;
    for (let offset = -4; offset <= 4; offset += 1) {
      const px = Math.max(0, Math.min(width - 1, x + (y === centerY ? offset : 0)));
      const py = Math.max(0, Math.min(height - 1, y + (x === centerX ? offset : 0)));
      total += luminance(data, (py * width + px) * 3);
      count += 1;
    }
    return total / count;
  };
  const scan = (dx, dy) => {
    let x = centerX;
    let y = centerY;
    let lastInside = { x, y };
    let below = 0;
    for (let step = 0; step < Math.max(width, height); step += 1) {
      x += dx;
      y += dy;
      if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) break;
      if (sample(x, y) >= threshold) {
        lastInside = { x, y };
        below = 0;
      } else if ((below += 1) >= 12) {
        break;
      }
    }
    return lastInside;
  };
  const left = scan(-1, 0).x;
  const right = scan(1, 0).x;
  const top = scan(0, -1).y;
  const bottom = scan(0, 1).y;
  const detectedCenterX = (left + right) / 2;
  const detectedCenterY = (top + bottom) / 2;
  const radius = Math.min((right - left) / 2, (bottom - top) / 2);
  if (
    radius < 1600
    || radius > 2050
    || Math.abs(detectedCenterX - centerX) > 120
    || Math.abs(detectedCenterY - centerY) > 120
  ) throw new Error(`v591-sun-disk-detection:${id}:${detectedCenterX},${detectedCenterY},${radius}`);
  return { centerX: detectedCenterX, centerY: detectedCenterY, radius, threshold };
}

function bilinear(data, width, height, x, y, channel) {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const a = data[(y0 * width + x0) * 3 + channel];
  const b = data[(y0 * width + x1) * 3 + channel];
  const c = data[(y1 * width + x0) * 3 + channel];
  const d = data[(y1 * width + x1) * 3 + channel];
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
}

async function unwrapSolarDisk(sourceBytes, id, outputWidth, outputHeight, normalizeLimb) {
  const { data, info } = await sharp(sourceBytes, { limitInputPixels: false })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 3 || info.width !== 4096 || info.height !== 4096) {
    throw new Error(`v591-sun-source-layout:${id}:${info.width}x${info.height}x${info.channels}`);
  }
  const detection = detectDisk(data, info.width, info.height, id);
  // Three continuously weighted orthographic projections reuse only the
  // admitted observed disk, stay well inside its black border, and avoid the
  // single-axis mirror caustic that the first v591 derivation exposed.
  const radius = detection.radius * (id === "sun-photosphere" ? 0.84 : 0.80);
  const output = Buffer.allocUnsafe(outputWidth * outputHeight * 3);
  const sinLongitude = new Float64Array(outputWidth);
  const cosLongitude = new Float64Array(outputWidth);
  for (let x = 0; x < outputWidth; x += 1) {
    // Duplicate the exact -PI/+PI meridian at the two texture edges. This is
    // deliberate wrap padding, not a relaxed seam threshold.
    const longitude = x === outputWidth - 1 ? -Math.PI : (x / (outputWidth - 1) * 2 - 1) * Math.PI;
    sinLongitude[x] = Math.sin(longitude);
    cosLongitude[x] = Math.cos(longitude);
  }
  const c0 = Math.cos(0.37); const s0 = Math.sin(0.37);
  const c1 = Math.cos(2.11); const s1 = Math.sin(2.11);
  const c2 = Math.cos(-1.17); const s2 = Math.sin(-1.17);
  const projectionScale = id === "sun-photosphere" ? 0.84 : 0.80;
  for (let y = 0; y < outputHeight; y += 1) {
    const latitude = (0.5 - (y + 0.5) / outputHeight) * Math.PI;
    const sinLatitude = Math.sin(latitude);
    const cosLatitude = Math.cos(latitude);
    for (let x = 0; x < outputWidth; x += 1) {
      const nx = cosLatitude * cosLongitude[x];
      const ny = sinLatitude;
      const nz = cosLatitude * sinLongitude[x];
      const rw0 = Math.pow(Math.abs(nx), 6);
      const rw1 = Math.pow(Math.abs(ny), 6);
      const rw2 = Math.pow(Math.abs(nz), 6);
      const inverseWeight = 1 / (rw0 + rw1 + rw2);
      const w0 = rw0 * inverseWeight;
      const w1 = rw1 * inverseWeight;
      const w2 = rw2 * inverseWeight;
      const u0 = nz * c0 - ny * s0; const v0 = nz * s0 + ny * c0;
      const u1 = nx * c1 - nz * s1; const v1 = nx * s1 + nz * c1;
      const u2 = nx * c2 - ny * s2; const v2 = nx * s2 + ny * c2;
      const x0 = detection.centerX + u0 * radius; const y0 = detection.centerY - v0 * radius;
      const x1 = detection.centerX + u1 * radius; const y1 = detection.centerY - v1 * radius;
      const x2 = detection.centerX + u2 * radius; const y2 = detection.centerY - v2 * radius;
      const mu0 = Math.sqrt(Math.max(0.001, 1 - Math.min(0.998, (u0 * u0 + v0 * v0) * projectionScale * projectionScale)));
      const mu1 = Math.sqrt(Math.max(0.001, 1 - Math.min(0.998, (u1 * u1 + v1 * v1) * projectionScale * projectionScale)));
      const mu2 = Math.sqrt(Math.max(0.001, 1 - Math.min(0.998, (u2 * u2 + v2 * v2) * projectionScale * projectionScale)));
      const gain0 = normalizeLimb ? Math.min(1.72, 1 / (0.52 + 0.48 * Math.pow(mu0, 0.58))) : 1;
      const gain1 = normalizeLimb ? Math.min(1.72, 1 / (0.52 + 0.48 * Math.pow(mu1, 0.58))) : 1;
      const gain2 = normalizeLimb ? Math.min(1.72, 1 / (0.52 + 0.48 * Math.pow(mu2, 0.58))) : 1;
      const offset = (y * outputWidth + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const value = bilinear(data, info.width, info.height, x0, y0, channel) * gain0 * w0
          + bilinear(data, info.width, info.height, x1, y1, channel) * gain1 * w1
          + bilinear(data, info.width, info.height, x2, y2, channel) * gain2 * w2;
        output[offset + channel] = Math.max(0, Math.min(255, Math.round(value)));
      }
    }
  }
  const edgeSampleRows = [0, Math.floor(outputHeight / 4), Math.floor(outputHeight / 2), outputHeight - 1];
  let edgeDelta = 0;
  let edgeCount = 0;
  for (const y of edgeSampleRows) {
    for (let channel = 0; channel < 3; channel += 1) {
      edgeDelta += Math.abs(output[(y * outputWidth) * 3 + channel] - output[(y * outputWidth + outputWidth - 1) * 3 + channel]);
      edgeCount += 1;
    }
  }
  const seamMeanAbsoluteDelta = edgeDelta / edgeCount;
  if (seamMeanAbsoluteDelta > 2) throw new Error(`v591-sun-seam:${id}:${seamMeanAbsoluteDelta}`);
  return { output, detection, seamMeanAbsoluteDelta };
}

function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}

async function writeWebp(raw, width, height, path, quality) {
  const bytes = await sharp(raw, { raw: { width, height, channels: 3 }, limitInputPixels: false })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toBuffer();
  atomicWrite(path, bytes);
}

async function buildAsset({ id, source, desktopWidth, desktopHeight, normalizeLimb }) {
  const sourcePath = resolve(root, source.outputPath);
  const sourceBytes = readFileSync(sourcePath);
  if (sha256(sourceBytes) !== source.sha256) throw new Error(`v591-sun-source-drift:${id}`);
  const { output, detection, seamMeanAbsoluteDelta } = await unwrapSolarDisk(
    sourceBytes,
    id,
    desktopWidth,
    desktopHeight,
    normalizeLimb,
  );
  mkdirSync(temporaryRoot, { recursive: true });
  const desktopPng = resolve(temporaryRoot, `${id}-${desktopWidth}x${desktopHeight}.png`);
  await sharp(output, { raw: { width: desktopWidth, height: desktopHeight, channels: 3 }, limitInputPixels: false })
    .png({ compressionLevel: 8, adaptiveFiltering: true })
    .toFile(desktopPng);

  const paths = {
    desktopKtx2: resolve(outputRoot, `full/desktop/${id}.ktx2`),
    desktopFallback: resolve(outputRoot, `full/desktop/${id}.webp`),
    mobileKtx2: resolve(outputRoot, `full/mobile/${id}.ktx2`),
    mobileFallback: resolve(outputRoot, `full/mobile/${id}.webp`),
    liteDesktop: resolve(outputRoot, `lite/desktop/${id}.webp`),
    liteMobile: resolve(outputRoot, `lite/mobile/${id}.webp`),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const desktopKtx2Partial = `${paths.desktopKtx2}.${process.pid}.part`;
  runTool(toktx, [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--zcmp", "10",
    "--genmipmap", "--assign_oetf", "srgb", desktopKtx2Partial, desktopPng,
  ], `v591-${id}-desktop-ktx2`);
  rmSync(paths.desktopKtx2, { force: true });
  renameSync(desktopKtx2Partial, paths.desktopKtx2);
  await writeWebp(output, desktopWidth, desktopHeight, paths.desktopFallback, 92);

  const mobileWidth = 2048;
  const mobileHeight = 1024;
  const mobilePng = resolve(temporaryRoot, `${id}-${mobileWidth}x${mobileHeight}.png`);
  await sharp(desktopPng).resize(mobileWidth, mobileHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 8 }).toFile(mobilePng);
  const mobileKtx2Partial = `${paths.mobileKtx2}.${process.pid}.part`;
  runTool(toktx, [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--zcmp", "10",
    "--genmipmap", "--assign_oetf", "srgb", mobileKtx2Partial, mobilePng,
  ], `v591-${id}-mobile-ktx2`);
  rmSync(paths.mobileKtx2, { force: true });
  renameSync(mobileKtx2Partial, paths.mobileKtx2);
  atomicWrite(paths.mobileFallback, await sharp(mobilePng).webp({ quality: 91, effort: 6, smartSubsample: true }).toBuffer());
  atomicWrite(paths.liteDesktop, await sharp(mobilePng).resize(1024, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 }).webp({ quality: 88, effort: 6, smartSubsample: true }).toBuffer());
  atomicWrite(paths.liteMobile, await sharp(mobilePng).resize(512, 256, { fit: "fill", kernel: sharp.kernel.lanczos3 }).webp({ quality: 86, effort: 6, smartSubsample: true }).toBuffer());

  return {
    id,
    body: "sun",
    role: id === "sun-photosphere" ? "photosphere" : "chromosphere",
    source: {
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
      observationIdentity: source.observationIdentity,
    },
    derivation: {
      tool: "sharp+v591-orthographic-to-equirectangular+KTX-Software",
      version: `sharp-${sharp.versions.sharp};ktx-4.4.2`,
      parameters: `${desktopWidth}x${desktopHeight}; detected disk ${detection.centerX.toFixed(3)},${detection.centerY.toFixed(3)},r=${detection.radius.toFixed(3)}; deterministic tri-axis spherical blend; seam-safe J2000-independent presentation map; ${normalizeLimb ? "HMI bounded limb normalization" : "AIA radiance preserved"}; UASTC q2 zstd10 mipmapped`,
      observationLimit: "A single visible SDO hemisphere is reused through three continuous projections for complete presentation coverage; the result is not a synoptic scientific map.",
      seamMeanAbsoluteDelta,
    },
    fullQualityMinimum: {
      desktop: { width: desktopWidth, height: desktopHeight },
      mobile: { width: 2048, height: 1024 },
    },
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/sun/full/desktop/${id}.ktx2`, desktopWidth, desktopHeight, "ktx2", "srgb", "uastc-q2-zstd10-mipmapped"),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/sun/full/desktop/${id}.webp`, desktopWidth, desktopHeight, "webp", "srgb", "webp-quality-92"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/sun/full/mobile/${id}.ktx2`, 2048, 1024, "ktx2", "srgb", "uastc-q2-zstd10-mipmapped"),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/sun/full/mobile/${id}.webp`, 2048, 1024, "webp", "srgb", "webp-quality-91"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/sun/lite/desktop/${id}.webp`, 1024, 512, "webp", "srgb", "webp-quality-88"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/sun/lite/mobile/${id}.webp`, 512, 256, "webp", "srgb", "webp-quality-86"),
    },
    presentationOnly: true,
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
if (acquisition.status !== "acquired-single-request-no-retry" || acquisition.automaticRetryPerformed !== false) {
  throw new Error("v591-sun-acquisition-policy");
}
const byId = new Map(acquisition.assets.map((asset) => [asset.id, asset]));
const photosphereSource = byId.get("sun-photosphere-source");
const chromosphereSource = byId.get("sun-chromosphere-source");
if (!photosphereSource || !chromosphereSource) throw new Error("v591-sun-acquisition-channels");

rmSync(temporaryRoot, { recursive: true, force: true });
const assets = [];
assets.push(await buildAsset({ id: "sun-photosphere", source: photosphereSource, desktopWidth: 8192, desktopHeight: 4096, normalizeLimb: true }));
assets.push(await buildAsset({ id: "sun-chromosphere", source: chromosphereSource, desktopWidth: 4096, desktopHeight: 2048, normalizeLimb: false }));
const unsigned = {
  version: "v591-sun-asset-overlay-v1",
  generatedAt,
  status: "sun-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  noNetworkRequestsPerformed: true,
  mirroredHemisphereDisclosure: true,
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    measuredAuthorityGranted: false,
  },
  assets,
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
atomicWrite(generatedConstantsPath, Buffer.from(`// Generated from public/data/celestial-convergence-v591/sun-asset-overlay.json.\nexport const CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591 =\n  "${overlay.receiptSha256}" as const;\n`, "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  status: overlay.status,
  assets: assets.map((asset) => ({
    id: asset.id,
    desktop: `${asset.variants.desktopKtx2.width}x${asset.variants.desktopKtx2.height}`,
    desktopBytes: asset.variants.desktopKtx2.bytes,
    fallbackBytes: asset.variants.desktopFallback.bytes,
    seamMeanAbsoluteDelta: asset.derivation.seamMeanAbsoluteDelta,
  })),
  receiptSha256: overlay.receiptSha256,
}, null, 2));
