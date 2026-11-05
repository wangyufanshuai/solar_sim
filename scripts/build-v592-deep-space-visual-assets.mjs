import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-deep-space-visual-sources-v592.json");
const reviewPath = resolve(root, "docs/release/v592/deep-space-item-license-review-v592.json");
const analysisPath = resolve(root, "docs/release/v592/deep-space-source-visual-analysis-v592.json");
const alternativeReviewPath = resolve(root, "docs/release/v592/deep-space-alternative-item-license-review-v592.json");
const alternativeAnalysisPath = resolve(root, "docs/release/v592/deep-space-alternative-source-visual-analysis-v592.json");
const alternativeContactSheetReceiptPath = resolve(root, "docs/release/v592/deep-space-alternative-contact-sheet-receipt-v592.json");
const referencePath = resolve(root, "public/data/living-universe-v592/deep-space-reference.json");
const gaiaManifestPath = resolve(root, "public/data/gaia-dr3-presentation-10000000-v9/manifest.json");
const gaiaCatalogPath = resolve(root, "public/data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin");
const openNgcManifestPath = resolve(root, "public/data/openngc-v260/manifest.json");
const openNgcCatalogPath = resolve(root, "public/data/openngc-v260/openngc-v260.json.gz");
const openNgcLicensePath = resolve(root, "public/data/openngc-v260/CC-BY-SA-4.0.txt");
const manifestPath = resolve(root, "public/data/living-universe-v592/deep-space-visual-assets.json");
const receiptPath = resolve(root, "docs/release/v592/deep-space-visual-assets-receipt-v592.json");
const generatedPath = resolve(root, "app/data/deepSpaceVisualAssetsV592.generated.ts");
const candidateRoot = resolve(root, "public/textures/candidate-v592");
const outputRoot = resolve(candidateRoot, "deep-space-v592");
const temporaryRoot = resolve(root, "tmp/v592-deep-space-assets");
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

function verifySealed(path, field) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), `v592-deep-space-assets-input-seal:${path}`);
  return document;
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

function writeSealed(path, unsigned, field) {
  const document = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(document, null, 2)}\n`, "utf8"));
  return document;
}

function assertInside(parent, child, label) {
  const relativePath = relative(parent, child);
  assert(relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath), label);
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

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function blockAligned(value) {
  return Math.max(4, Math.round(value / 4) * 4);
}

function tierDimensions(crop, longSide, requireBlockAlignment) {
  const aspect = crop.width / crop.height;
  const align = requireBlockAlignment ? blockAligned : (value) => Math.max(1, Math.round(value));
  return aspect >= 1
    ? [longSide, align(longSide / aspect)]
    : [align(longSide * aspect), longSide];
}

function runtimeUrl(path) {
  return `/${path.slice(resolve(root, "public").length + 1).replaceAll("\\", "/")}`;
}

function outputRecord(path, width, height, format, compression, role, depthIndex) {
  const bytes = readFileSync(path);
  return {
    url: runtimeUrl(path),
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    width,
    height,
    format,
    colorSpace: "srgb",
    compression,
    role,
    depthIndex,
  };
}

const TIER_PROFILE = Object.freeze({
  desktop: Object.freeze({ longSide: 2048, depthCount: 3, depthScales: Object.freeze([1, 0.5, 0.5]), opacities: Object.freeze([0.88, 0.24, 0.18]), thresholds: Object.freeze([[1.5, 10], [18, 88], [72, 210]]), depthOffsets: Object.freeze([-0.095, 0, 0.095]) }),
  mobile: Object.freeze({ longSide: 1024, depthCount: 2, depthScales: Object.freeze([1, 0.5]), opacities: Object.freeze([0.9, 0.2]), thresholds: Object.freeze([[1.5, 10], [52, 185]]), depthOffsets: Object.freeze([-0.05, 0.05]) }),
  lite: Object.freeze({ longSide: 192, depthCount: 1, depthScales: Object.freeze([1]), opacities: Object.freeze([0.92]), thresholds: Object.freeze([[1.5, 10]]), depthOffsets: Object.freeze([0]) }),
});

const COMPACT_TIER_PROFILE = Object.freeze({
  desktop: Object.freeze({ longSide: 1536, depthCount: 2, depthScales: Object.freeze([1, 0.5]), opacities: Object.freeze([0.9, 0.2]), thresholds: Object.freeze([[1.5, 10], [42, 182]]), depthOffsets: Object.freeze([-0.05, 0.05]) }),
  mobile: Object.freeze({ longSide: 768, depthCount: 1, depthScales: Object.freeze([1]), opacities: Object.freeze([0.9]), thresholds: Object.freeze([[1.5, 10]]), depthOffsets: Object.freeze([0]) }),
  lite: Object.freeze({ longSide: 128, depthCount: 1, depthScales: Object.freeze([1]), opacities: Object.freeze([0.92]), thresholds: Object.freeze([[1.5, 10]]), depthOffsets: Object.freeze([0]) }),
});

const GAIA_CLUSTER_TIER_PROFILE = Object.freeze({
  desktop: Object.freeze({ longSide: 1024, depthCount: 3, depthScales: Object.freeze([1, 0.5, 0.5]), pointLimit: 2048, depthOffsets: Object.freeze([-0.075, 0, 0.075]) }),
  mobile: Object.freeze({ longSide: 512, depthCount: 2, depthScales: Object.freeze([1, 0.5]), pointLimit: 1024, depthOffsets: Object.freeze([-0.04, 0.04]) }),
  lite: Object.freeze({ longSide: 160, depthCount: 1, depthScales: Object.freeze([1]), pointLimit: 256, depthOffsets: Object.freeze([0]) }),
});

const OPEN_NGC_ANALYTIC_GALAXY_PROFILES_V592 = Object.freeze({
  "centaurus-a": Object.freeze({
    profileKind: "lenticular-dust-lane",
    armCount: 0,
    pitchAngleDeg: 0,
    bulgeFraction: 0.72,
    dustStrength: 0.9,
    starFormingStrength: 0.12,
    turbulenceStrength: 0.12,
  }),
  "cigar-galaxy": Object.freeze({
    profileKind: "edge-on-starburst",
    armCount: 0,
    pitchAngleDeg: 0,
    bulgeFraction: 0.28,
    dustStrength: 0.48,
    starFormingStrength: 0.92,
    turbulenceStrength: 0.74,
  }),
  "pinwheel-galaxy": Object.freeze({
    profileKind: "grand-design-spiral",
    armCount: 4,
    pitchAngleDeg: 23,
    bulgeFraction: 0.18,
    dustStrength: 0.42,
    starFormingStrength: 0.74,
    turbulenceStrength: 0.24,
  }),
  "virgo-a-galaxy": Object.freeze({
    profileKind: "elliptical-sersic",
    armCount: 0,
    pitchAngleDeg: 0,
    bulgeFraction: 0.96,
    dustStrength: 0.02,
    starFormingStrength: 0.02,
    turbulenceStrength: 0.04,
  }),
  "black-eye-galaxy": Object.freeze({
    profileKind: "early-spiral-dust-eye",
    armCount: 2,
    pitchAngleDeg: 12,
    bulgeFraction: 0.46,
    dustStrength: 0.88,
    starFormingStrength: 0.24,
    turbulenceStrength: 0.12,
  }),
  "sunflower-galaxy": Object.freeze({
    profileKind: "flocculent-spiral",
    armCount: 5,
    pitchAngleDeg: 20,
    bulgeFraction: 0.26,
    dustStrength: 0.56,
    starFormingStrength: 0.58,
    turbulenceStrength: 0.58,
  }),
});

function deterministicSeedV592(value) {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return Number((hash / 0xffff_ffff).toFixed(9));
}

async function writePresentationLayer(sourcePath, crop, width, height, profile, depthIndex, outputPath) {
  const { data, info } = await sharp(sourcePath, { limitInputPixels: false })
    .extract(crop)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(width * height * 4);
  const [low, high] = profile.thresholds[depthIndex];
  const opacity = profile.opacities[depthIndex];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (y * info.width + x) * info.channels;
      const targetIndex = (y * width + x) * 4;
      const red = data[sourceIndex] ?? 0;
      const green = data[sourceIndex + 1] ?? 0;
      const blue = data[sourceIndex + 2] ?? 0;
      const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const edgeDistance = Math.min(
        (x + 0.5) / width,
        1 - (x + 0.5) / width,
        (y + 0.5) / height,
        1 - (y + 0.5) / height,
      );
      const edge = smoothstep(0, 0.065, edgeDistance);
      const visibility = smoothstep(low, high, luma);
      const alpha = Math.round(Math.max(0, Math.min(255, visibility * opacity * edge * 255)));
      output[targetIndex] = red;
      output[targetIndex + 1] = green;
      output[targetIndex + 2] = blue;
      output[targetIndex + 3] = alpha;
    }
  }
  await sharp(output, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 8, adaptiveFiltering: true })
    .toFile(outputPath);
}

function encodeKtx(input, output, label, encoding) {
  const partial = `${output}.${process.pid}.part`;
  const codec = encoding === "uastc"
    ? ["--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "1.0", "--uastc_rdo_m", "--zcmp", "10"]
    : ["--encode", "etc1s", "--clevel", "5", "--qlevel", "192"];
  runTool(toktx, [
    "--t2", ...codec, "--threads", "1", "--genmipmap", "--assign_oetf", "srgb", "--assign_primaries", "srgb",
    partial, input,
  ], label);
  rmSync(output, { force: true });
  renameSync(partial, output);
}

async function encodeWebp(input, output, quality, lossless = false) {
  atomicWrite(output, await sharp(input, { limitInputPixels: false })
    .webp(lossless
      ? { lossless: true, effort: 6, smartSubsample: false, alphaQuality: 100 }
      : { quality, effort: 6, smartSubsample: true, alphaQuality: 100 })
    .toBuffer());
}

function linearToSrgbV592(channel) {
  const value = Math.max(0, Math.min(1, channel));
  return value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

function bpRpToLinearRgbV592(bpRp) {
  const color = Number.isFinite(bpRp) ? Math.max(-0.5, Math.min(4, bpRp)) : 0.82;
  const temperature = Math.max(2400, Math.min(12000, 4600 * (
    1 / (0.92 * color + 1.7) + 1 / (0.92 * color + 0.62)
  )));
  const scaled = temperature / 100;
  let red;
  let green;
  let blue;
  if (scaled <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(scaled) - 161.1195681661;
    blue = scaled <= 19 ? 0 : 138.5177312231 * Math.log(scaled - 10) - 305.0447927307;
  } else {
    red = 329.698727446 * Math.pow(scaled - 60, -0.1332047592);
    green = 288.1221695283 * Math.pow(scaled - 60, -0.0755148492);
    blue = 255;
  }
  const toLinear = (channel) => {
    const srgb = Math.max(0, Math.min(255, channel)) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };
  return [toLinear(red), toLinear(green), toLinear(blue)];
}

function angularDistanceDegV592(raDeg, decDeg, centerRaDeg, centerDecDeg) {
  let deltaRaDeg = Math.abs(raDeg - centerRaDeg);
  if (deltaRaDeg > 180) deltaRaDeg = 360 - deltaRaDeg;
  const deltaDecHalf = (decDeg - centerDecDeg) * Math.PI / 360;
  const deltaRaHalf = deltaRaDeg * Math.PI / 360;
  const a = Math.sin(deltaDecHalf) ** 2
    + Math.cos(decDeg * Math.PI / 180) * Math.cos(centerDecDeg * Math.PI / 180) * Math.sin(deltaRaHalf) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a))) * 180 / Math.PI;
}

function selectGaiaClusterRecordsV592(catalogBytes, clusters) {
  const selected = new Map(clusters.map((cluster) => [cluster.id, []]));
  for (let offset = 0; offset < catalogBytes.byteLength; offset += 24) {
    const raDeg = catalogBytes.readUInt32LE(offset + 8) / 2 ** 32 * 360;
    const decDeg = catalogBytes.readUInt32LE(offset + 12) / 0xffff_ffff * 180 - 90;
    for (const cluster of clusters) {
      if (Math.abs(decDeg - cluster.decDeg) > cluster.selectionRadiusDeg) continue;
      let deltaRaDeg = Math.abs(raDeg - cluster.raDeg);
      if (deltaRaDeg > 180) deltaRaDeg = 360 - deltaRaDeg;
      if (deltaRaDeg * Math.cos(cluster.decDeg * Math.PI / 180) > cluster.selectionRadiusDeg) continue;
      if (angularDistanceDegV592(raDeg, decDeg, cluster.raDeg, cluster.decDeg) > cluster.selectionRadiusDeg) continue;
      const colorQuant = catalogBytes.readInt16LE(offset + 18);
      selected.get(cluster.id).push({
        sourceId: catalogBytes.readBigUInt64LE(offset),
        raDeg,
        decDeg,
        magG: catalogBytes.readUInt16LE(offset + 16) / 1000 - 5,
        bpRp: colorQuant === -32768 ? null : colorQuant / 1000,
      });
    }
  }
  for (const records of selected.values()) {
    records.sort((left, right) => left.magG - right.magG || (left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0));
  }
  return selected;
}

async function writeGaiaClusterLayerV592(records, cluster, width, height, depthCount, depthIndex, pointLimit, outputPath) {
  const renderScale = Math.min(width, height) >= 512 ? 2 : 3;
  const renderWidth = width * renderScale;
  const renderHeight = height * renderScale;
  const accumulator = new Float32Array(renderWidth * renderHeight * 4);
  const limited = records.slice(0, pointLimit);
  const centerCos = Math.cos(cluster.decDeg * Math.PI / 180);
  for (let rank = depthIndex; rank < limited.length; rank += depthCount) {
    const record = limited[rank];
    let deltaRaDeg = record.raDeg - cluster.raDeg;
    if (deltaRaDeg > 180) deltaRaDeg -= 360;
    if (deltaRaDeg < -180) deltaRaDeg += 360;
    const normalizedX = deltaRaDeg * centerCos / cluster.selectionRadiusDeg;
    const normalizedY = (record.decDeg - cluster.decDeg) / cluster.selectionRadiusDeg;
    if (Math.abs(normalizedX) > 1 || Math.abs(normalizedY) > 1) continue;
    const centerX = (0.5 + normalizedX * 0.44) * renderWidth;
    const centerY = (0.5 - normalizedY * 0.44) * renderHeight;
    const brightness = Math.max(0, Math.min(1, (22 - record.magG) / 16));
    const radius = Math.max(0.82, Math.min(3.9, 0.82 + Math.pow(brightness, 1.65) * 3.1)) * width / 1024 * renderScale;
    const kernelRadius = Math.max(2, Math.ceil(radius * 4));
    const amplitude = 0.014 + Math.pow(brightness, 2.7) * 1.65;
    const physicalColor = bpRpToLinearRgbV592(record.bpRp);
    const color = physicalColor.map((channel) => channel * 0.42 + 0.58);
    for (let y = Math.max(0, Math.floor(centerY - kernelRadius)); y <= Math.min(renderHeight - 1, Math.ceil(centerY + kernelRadius)); y += 1) {
      for (let x = Math.max(0, Math.floor(centerX - kernelRadius)); x <= Math.min(renderWidth - 1, Math.ceil(centerX + kernelRadius)); x += 1) {
        const dx = x + 0.5 - centerX;
        const dy = y + 0.5 - centerY;
        const distanceSq = dx * dx + dy * dy;
        const core = Math.pow(1 + distanceSq / Math.max(0.3, radius * radius * 0.7), -2.6);
        const weight = amplitude * core;
        if (weight <= 0.001) continue;
        const pixel = (y * renderWidth + x) * 4;
        accumulator[pixel] += color[0] * weight;
        accumulator[pixel + 1] += color[1] * weight;
        accumulator[pixel + 2] += color[2] * weight;
        accumulator[pixel + 3] += weight;
      }
    }
  }
  const output = Buffer.alloc(renderWidth * renderHeight * 4);
  for (let y = 0; y < renderHeight; y += 1) {
    for (let x = 0; x < renderWidth; x += 1) {
      const pixel = (y * renderWidth + x) * 4;
      const energy = accumulator[pixel + 3];
      if (energy <= 0) continue;
      const edgeDistance = Math.min((x + 0.5) / renderWidth, 1 - (x + 0.5) / renderWidth, (y + 0.5) / renderHeight, 1 - (y + 0.5) / renderHeight);
      const edge = smoothstep(0, 0.065, edgeDistance);
      output[pixel] = Math.round(linearToSrgbV592(accumulator[pixel] / energy) * 255);
      output[pixel + 1] = Math.round(linearToSrgbV592(accumulator[pixel + 1] / energy) * 255);
      output[pixel + 2] = Math.round(linearToSrgbV592(accumulator[pixel + 2] / energy) * 255);
      output[pixel + 3] = Math.round((1 - Math.exp(-energy * 1.8)) * edge * 255);
    }
  }
  await sharp(output, { raw: { width: renderWidth, height: renderHeight, channels: 4 } })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 8, adaptiveFiltering: true })
    .toFile(outputPath);
}

assert(existsSync(toktx), "v592-deep-space-assets-toktx-missing");
assertInside(candidateRoot, outputRoot, "v592-deep-space-assets-output-root");
const acquisition = verifySealed(acquisitionPath, "receiptSha256");
const review = verifySealed(reviewPath, "receiptSha256");
const analysis = verifySealed(analysisPath, "receiptSha256");
const alternativeReview = verifySealed(alternativeReviewPath, "receiptSha256");
const alternativeAnalysis = verifySealed(alternativeAnalysisPath, "receiptSha256");
const alternativeContactSheet = verifySealed(alternativeContactSheetReceiptPath, "receiptSha256");
const reference = verifySealed(referencePath, "packetSha256");
const gaiaManifestBytes = readFileSync(gaiaManifestPath);
const gaiaManifest = JSON.parse(gaiaManifestBytes.toString("utf8"));
const gaiaCatalogBytes = readFileSync(gaiaCatalogPath);
const openNgcManifestBytes = readFileSync(openNgcManifestPath);
const openNgcManifest = JSON.parse(openNgcManifestBytes.toString("utf8"));
const openNgcCatalogBytes = readFileSync(openNgcCatalogPath);
const openNgcLicenseBytes = readFileSync(openNgcLicensePath);
const openNgcRows = JSON.parse(gunzipSync(openNgcCatalogBytes).toString("utf8"));
const openNgcById = new Map(openNgcRows.map((row) => [row.id, row]));
assert(acquisition.status === "committed-five-visual-sources-single-request-each-no-retry", "v592-deep-space-assets-acquisition-status");
assert(review.status === "5-visual-source-acquisitions-eligible-13-license-identity-or-suitability-blocked", "v592-deep-space-assets-review-status");
assert(analysis.status === "three-runtime-derivation-candidates-two-infographic-sources-blocked", "v592-deep-space-assets-analysis-status");
assert(alternativeReview.status === "9-alternative-visual-sources-eligible-12-blocked", "v592-deep-space-assets-alternative-review-status");
assert(alternativeAnalysis.status === "five-runtime-derivation-candidates-three-clean-redundant-alternates-held-one-scientific-overlay-blocked", "v592-deep-space-assets-alternative-analysis-status");
assert(alternativeContactSheet.status === "contact-sheet-generated-manual-visual-analysis-required", "v592-deep-space-assets-alternative-contact-sheet-status");
assert(reference.admission.admittedGalaxyReferenceCount === 12 && reference.admission.admittedClusterReferenceCount === 12, "v592-deep-space-assets-reference-count");
assert(sha256(gaiaManifestBytes) === "c5b8ed92ae72e404ab8c1a9a6be71a214869d8a2de6ee948dfcc276d7199b371", "v592-deep-space-assets-gaia-manifest-file-drift");
assert(gaiaManifest.version === "v272-gaia-dr3-presentation-10000000-v10m-v1", "v592-deep-space-assets-gaia-version");
assert(gaiaManifest.archive.recordBytes === 24 && gaiaManifest.archive.byteLength === 240_000_000, "v592-deep-space-assets-gaia-layout");
assert(gaiaCatalogBytes.byteLength === gaiaManifest.archive.byteLength && sha256(gaiaCatalogBytes) === gaiaManifest.archive.sha256, "v592-deep-space-assets-gaia-drift");
assert(openNgcManifest.output.path === "data/openngc-v260/openngc-v260.json.gz", "v592-deep-space-assets-openngc-path");
assert(openNgcCatalogBytes.byteLength === openNgcManifest.output.bytes && sha256(openNgcCatalogBytes) === openNgcManifest.output.sha256, "v592-deep-space-assets-openngc-data-drift");
assert(sha256(openNgcLicenseBytes) === openNgcManifest.license.sha256, "v592-deep-space-assets-openngc-license-drift");
assert(reference.sources.openNgc.dataSha256 === openNgcManifest.output.sha256, "v592-deep-space-assets-openngc-reference-data");
assert(reference.sources.openNgc.licenseSha256 === openNgcManifest.license.sha256, "v592-deep-space-assets-openngc-reference-license");

const debugClusterTarget = process.env.ATLAS_V592_DEBUG_GAIA_CLUSTER;
if (debugClusterTarget) {
  const debugCatalog = reference.objects.find((entry) => entry.id === debugClusterTarget && entry.category === "cluster");
  assert(debugCatalog, `v592-deep-space-assets-debug-cluster:${debugClusterTarget}`);
  const debugCluster = {
    ...debugCatalog,
    selectionRadiusDeg: Math.max(1, Math.min(6, debugCatalog.angularSize.majorArcmin / 60 * 1.5)),
  };
  const debugRecords = selectGaiaClusterRecordsV592(gaiaCatalogBytes, [debugCluster]).get(debugClusterTarget) ?? [];
  const debugRoot = resolve(root, "tmp/v592-gaia-cluster-visual-debug");
  rmSync(debugRoot, { recursive: true, force: true });
  mkdirSync(debugRoot, { recursive: true });
  const debugPath = resolve(debugRoot, `${debugClusterTarget}-depth-0.png`);
  await writeGaiaClusterLayerV592(debugRecords, debugCluster, 1024, 1024, 3, 0, 2048, debugPath);
  console.log(JSON.stringify({ status: "debug-gaia-cluster-rendered", target: debugClusterTarget, recordCount: debugRecords.length, outputPath: relative(root, debugPath).replaceAll("\\", "/"), outputSha256: sha256(readFileSync(debugPath)) }, null, 2));
  process.exit(0);
}

rmSync(outputRoot, { recursive: true, force: true });
rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });

const assets = [];
const buildInputs = [
  ...analysis.derivableTargets.map((target) => ({
    target,
    sourceKind: "primary-chain",
    source: acquisition.assets.find((entry) => entry.target === target),
    decision: analysis.analyses.find((entry) => entry.target === target),
    visualAnalysisReceiptSha256: analysis.receiptSha256,
  })),
  ...alternativeAnalysis.derivableSelectionIds.map((selectionId) => {
    const decision = alternativeAnalysis.analyses.find((entry) => entry.selectionId === selectionId);
    assert(decision, `v592-deep-space-assets-alternative-decision:${selectionId}`);
    return {
      target: decision.target,
      sourceKind: "alternative-chain",
      source: {
        category: decision.category,
        nasaId: decision.nasaId,
        sourceUrl: decision.sourceUrl,
        outputPath: decision.sourcePath,
        bytes: decision.sourceBytes,
        sha256: decision.sourceSha256,
        width: decision.sourceDimensions[0],
        height: decision.sourceDimensions[1],
        colorSpace: decision.sourceColorSpace,
        license: decision.sourceLicense,
        licenseUrl: decision.sourceLicenseUrl,
        credit: decision.sourceCredit,
        observationEncoding: decision.sourceObservationEncoding,
      },
      decision,
      visualAnalysisReceiptSha256: alternativeAnalysis.receiptSha256,
    };
  }),
];
assert(buildInputs.length === 8 && new Set(buildInputs.map((entry) => entry.target)).size === 8, "v592-deep-space-assets-build-input-cardinality");
for (const input of buildInputs) {
  const { target, source, decision } = input;
  const catalog = reference.objects.find((entry) => entry.id === target);
  assert(source && decision && catalog, `v592-deep-space-assets-source:${target}`);
  const sourcePath = resolve(root, source.outputPath);
  const sourceBytes = readFileSync(sourcePath);
  assert(sourceBytes.byteLength === source.bytes && sha256(sourceBytes) === source.sha256, `v592-deep-space-assets-source-drift:${target}`);
  const variants = {};
  const tierProfiles = decision.runtimeProfile === "compact-1536-768" ? COMPACT_TIER_PROFILE : TIER_PROFILE;
  for (const tier of ["desktop", "mobile", "lite"]) {
    const profile = tierProfiles[tier];
    const [width, height] = tierDimensions(decision.crop, profile.longSide, tier !== "lite");
    const slices = [];
    for (let depthIndex = 0; depthIndex < profile.depthCount; depthIndex += 1) {
      const sliceLongSide = Math.max(4, Math.round(profile.longSide * profile.depthScales[depthIndex]));
      const [sliceWidth, sliceHeight] = tierDimensions(decision.crop, sliceLongSide, tier !== "lite");
      const stem = `${target}-depth-${depthIndex}`;
      const temporaryPng = resolve(temporaryRoot, `${stem}-${tier}.png`);
      await writePresentationLayer(sourcePath, decision.crop, sliceWidth, sliceHeight, profile, depthIndex, temporaryPng);
      if (tier === "lite") {
        const fallbackPath = resolve(outputRoot, "lite", "shared", `${stem}.webp`);
        mkdirSync(dirname(fallbackPath), { recursive: true });
        const liteQuality = 56;
        await encodeWebp(temporaryPng, fallbackPath, liteQuality);
        slices.push({
          depthIndex,
          depthOffset: profile.depthOffsets[depthIndex],
          opacityPolicy: `straight-alpha-luma-${profile.thresholds[depthIndex].join("-")}-opacity-${profile.opacities[depthIndex]}`,
          fallback: outputRecord(fallbackPath, sliceWidth, sliceHeight, "webp", `webp-q${liteQuality}-alpha`, "lite-shared", depthIndex),
        });
      } else {
        const ktx2Path = resolve(outputRoot, "full", tier, `${stem}.ktx2`);
        const fallbackPath = resolve(outputRoot, "full", tier, `${stem}.webp`);
        mkdirSync(dirname(ktx2Path), { recursive: true });
        const encoding = depthIndex === 0 ? "uastc" : "etc1s";
        const webpQuality = tier === "desktop" ? depthIndex === 0 ? 86 : 76 : depthIndex === 0 ? 80 : 70;
        encodeKtx(temporaryPng, ktx2Path, `v592-deep-space-${target}-${tier}-${depthIndex}-ktx2`, encoding);
        await encodeWebp(temporaryPng, fallbackPath, webpQuality, true);
        slices.push({
          depthIndex,
          depthOffset: profile.depthOffsets[depthIndex],
          opacityPolicy: `straight-alpha-luma-${profile.thresholds[depthIndex].join("-")}-opacity-${profile.opacities[depthIndex]}`,
          ktx2: outputRecord(
            ktx2Path,
            sliceWidth,
            sliceHeight,
            "ktx2",
            encoding === "uastc" ? "uastc-q2-rdo1-single-thread-zstd10-mipmapped" : "etc1s-clevel5-q192-single-thread-mipmapped",
            `full-${tier}`,
            depthIndex,
          ),
          fallback: outputRecord(fallbackPath, sliceWidth, sliceHeight, "webp", `webp-q${webpQuality}-alpha`, `full-${tier}-fallback`, depthIndex),
        });
      }
    }
    variants[tier] = {
      width,
      height,
      aspect: Number((width / height).toFixed(9)),
      depthSliceCount: profile.depthCount,
      slices,
    };
  }
  assets.push({
    target,
    category: source.category,
    nasaId: source.nasaId,
    status: "source-crop-and-runtime-variants-admitted",
    visualModelKind: "source-observation-depth-impostor",
    source: {
      url: source.sourceUrl,
      path: source.outputPath,
      bytes: source.bytes,
      sha256: source.sha256,
      width: source.width,
      height: source.height,
      colorSpace: source.colorSpace,
      license: source.license,
      licenseUrl: source.licenseUrl,
      credit: source.credit,
      observationEncoding: source.observationEncoding,
    },
    crop: {
      policy: decision.cropPolicy,
      ...decision.crop,
      retainedSourcePixelFraction: decision.retainedSourcePixelFraction,
      visualAnalysisReceiptSha256: input.visualAnalysisReceiptSha256,
    },
    reference: {
      coordinateFrame: catalog.coordinateFrame,
      raDeg: catalog.raDeg,
      decDeg: catalog.decDeg,
      angularSize: catalog.angularSize,
      distancePc: catalog.distancePc,
      referencePacketSha256: reference.packetSha256,
    },
    derivation: {
      tool: "sharp+KTX-Software",
      sharpVersion: sharp.versions.sharp,
      ktxSoftwareVersion: "4.4.2",
      parameters: decision.runtimeProfile === "compact-1536-768"
        ? "manual sealed crop; Lanczos3; deterministic straight-alpha luma depth bands; 6.5% edge feather; desktop 1536/768; mobile 768; lite 128; hybrid UASTC-core/ETC1S-depth; single-thread mipmaps; SHA-verified WebP fallbacks"
        : "manual sealed crop; Lanczos3; deterministic straight-alpha luma depth bands; 6.5% edge feather; desktop 2048/1024/1024; mobile 1024/512; lite 192; hybrid UASTC-core/ETC1S-depth; single-thread mipmaps; SHA-verified WebP fallbacks",
      sourceChain: input.sourceKind,
      noInpainting: true,
      noSyntheticCoverageFill: true,
      noAnnotationRemoval: true,
    },
    variants,
    mappedColorLabelRequired: true,
    observationImageClaim: true,
    catalogDerivedVisualModel: false,
    nakedEyeRepresentationClaimed: false,
    scienceImagePayload: false,
    presentationOnly: true,
    scientificAuthority: false,
    scientificPayloadWriteback: false,
  });
}

const gaiaClusterCatalogs = reference.objects
  .filter((entry) => entry.category === "cluster" && !assets.some((asset) => asset.target === entry.id))
  .map((entry) => ({
    ...entry,
    selectionRadiusDeg: Math.max(1, Math.min(6, entry.angularSize.majorArcmin / 60 * 1.5)),
  }));
assert(gaiaClusterCatalogs.length === 10, "v592-deep-space-assets-gaia-cluster-cardinality");
const gaiaClusterRecords = selectGaiaClusterRecordsV592(gaiaCatalogBytes, gaiaClusterCatalogs);

for (const catalog of gaiaClusterCatalogs) {
  const records = gaiaClusterRecords.get(catalog.id) ?? [];
  assert(records.length >= 128, `v592-deep-space-assets-gaia-cluster-coverage:${catalog.id}:${records.length}`);
  const variants = {};
  for (const tier of ["desktop", "mobile", "lite"]) {
    const profile = GAIA_CLUSTER_TIER_PROFILE[tier];
    const slices = [];
    for (let depthIndex = 0; depthIndex < profile.depthCount; depthIndex += 1) {
      const size = blockAligned(profile.longSide * profile.depthScales[depthIndex]);
      const stem = `${catalog.id}-depth-${depthIndex}`;
      const temporaryPng = resolve(temporaryRoot, `${stem}-${tier}.png`);
      await writeGaiaClusterLayerV592(
        records,
        catalog,
        size,
        size,
        profile.depthCount,
        depthIndex,
        profile.pointLimit,
        temporaryPng,
      );
      if (tier === "lite") {
        const fallbackPath = resolve(outputRoot, "lite", "shared", `${stem}.webp`);
        mkdirSync(dirname(fallbackPath), { recursive: true });
        const webpQuality = 52;
        await encodeWebp(temporaryPng, fallbackPath, webpQuality);
        slices.push({
          depthIndex,
          depthOffset: profile.depthOffsets[depthIndex],
          opacityPolicy: "gaia-apparent-flux-moffat-airy-catalog-derived",
          fallback: outputRecord(fallbackPath, size, size, "webp", "webp-lossless-alpha", "lite-shared-gaia-cluster", depthIndex),
        });
      } else {
        const ktx2Path = resolve(outputRoot, "full", tier, `${stem}.ktx2`);
        const fallbackPath = resolve(outputRoot, "full", tier, `${stem}.webp`);
        mkdirSync(dirname(ktx2Path), { recursive: true });
        const encoding = depthIndex === 0 ? "uastc" : "etc1s";
        const webpQuality = tier === "desktop" ? depthIndex === 0 ? 82 : 72 : depthIndex === 0 ? 76 : 66;
        encodeKtx(temporaryPng, ktx2Path, `v592-deep-space-${catalog.id}-${tier}-${depthIndex}-ktx2`, encoding);
        await encodeWebp(temporaryPng, fallbackPath, webpQuality, true);
        slices.push({
          depthIndex,
          depthOffset: profile.depthOffsets[depthIndex],
          opacityPolicy: "gaia-apparent-flux-moffat-airy-catalog-derived",
          ktx2: outputRecord(
            ktx2Path,
            size,
            size,
            "ktx2",
            encoding === "uastc" ? "uastc-q2-rdo1-single-thread-zstd10-mipmapped" : "etc1s-clevel5-q192-single-thread-mipmapped",
            `full-${tier}-gaia-cluster`,
            depthIndex,
          ),
          fallback: outputRecord(fallbackPath, size, size, "webp", "webp-lossless-alpha", `full-${tier}-gaia-cluster-fallback`, depthIndex),
        });
      }
    }
    variants[tier] = {
      width: profile.longSide,
      height: profile.longSide,
      aspect: 1,
      depthSliceCount: profile.depthCount,
      slices,
    };
  }
  assets.push({
    target: catalog.id,
    category: "cluster",
    nasaId: "gaia-dr3-presentation-10000000-v9",
    status: "gaia-catalog-derived-runtime-variants-admitted",
    visualModelKind: "gaia-catalog-derived-star-field-impostor",
    source: {
      url: gaiaManifest.source.endpoint,
      path: "public/data/gaia-dr3-presentation-10000000-v9/catalog-v9.bin",
      bytes: gaiaCatalogBytes.byteLength,
      sha256: gaiaManifest.archive.sha256,
      width: gaiaManifest.counts.presentation,
      height: 1,
      colorSpace: "not-applicable",
      license: "Gaia DR3 existing admitted provenance reuse",
      licenseUrl: "https://www.cosmos.esa.int/web/gaia-users/archive/acknowledgements",
      credit: "ESA/Gaia/DPAC; Orbit Atlas deterministic catalog-derived presentation",
      observationEncoding: {
        bands: ["Gaia G", "Gaia BP-RP"],
        colorPolicy: "Gaia apparent-G flux and BP-RP catalog-derived mapped color",
        nakedEyeRepresentationClaimed: false,
        scienceModePolicy: "catalog-marker-coordinate-angular-extent-and-source-state-only",
        cinematicModePolicy: "presentation-only-deterministic-gaia-catalog-star-field",
      },
    },
    catalogSelection: {
      coordinateFrame: "ICRS/J2000",
      selectionRadiusDeg: catalog.selectionRadiusDeg,
      candidateRecordCount: records.length,
      desktopRecordCount: Math.min(records.length, GAIA_CLUSTER_TIER_PROFILE.desktop.pointLimit),
      mobileRecordCount: Math.min(records.length, GAIA_CLUSTER_TIER_PROFILE.mobile.pointLimit),
      liteRecordCount: Math.min(records.length, GAIA_CLUSTER_TIER_PROFILE.lite.pointLimit),
      sort: "apparent-g-ascending-then-source-id",
      sourceIdentityControlsBrightness: false,
      noSyntheticCoverageFill: true,
    },
    reference: {
      coordinateFrame: catalog.coordinateFrame,
      raDeg: catalog.raDeg,
      decDeg: catalog.decDeg,
      angularSize: catalog.angularSize,
      distancePc: catalog.distancePc,
      referencePacketSha256: reference.packetSha256,
    },
    derivation: {
      tool: "node-buffer+sharp+KTX-Software",
      sharpVersion: sharp.versions.sharp,
      ktxSoftwareVersion: "4.4.2",
      parameters: "Gaia 24-byte records; ICRS angular aperture; apparent-G sort; BP-RP color; deterministic Moffat/Airy raster; no random stars; desktop 1024/512/512; mobile 512/256; lite 160; hybrid UASTC/ETC1S; SHA-verified WebP fallback",
      sourceChain: "gaia-10m-derived-chain",
      noInpainting: true,
      noSyntheticCoverageFill: true,
      noAnnotationRemoval: true,
    },
    variants,
    mappedColorLabelRequired: true,
    observationImageClaim: false,
    catalogDerivedVisualModel: true,
    nakedEyeRepresentationClaimed: false,
    scienceImagePayload: false,
    presentationOnly: true,
    scientificAuthority: false,
    scientificPayloadWriteback: false,
  });
}

const analyticGalaxyCatalogs = reference.objects
  .filter((entry) => entry.category === "galaxy" && !assets.some((asset) => asset.target === entry.id));
assert(analyticGalaxyCatalogs.length === 6, "v592-deep-space-assets-openngc-galaxy-cardinality");
assert(
  analyticGalaxyCatalogs.every((entry) => Object.hasOwn(OPEN_NGC_ANALYTIC_GALAXY_PROFILES_V592, entry.id)),
  "v592-deep-space-assets-openngc-galaxy-profile-coverage",
);

for (const catalog of analyticGalaxyCatalogs) {
  assert(catalog.openNgcIds.length === 1, `v592-deep-space-assets-openngc-galaxy-id:${catalog.id}`);
  const openNgc = openNgcById.get(catalog.openNgcIds[0]);
  const profile = OPEN_NGC_ANALYTIC_GALAXY_PROFILES_V592[catalog.id];
  assert(openNgc?.type === "G" && typeof openNgc.hubble === "string" && openNgc.hubble.length > 0, `v592-deep-space-assets-openngc-galaxy-row:${catalog.id}`);
  assert(Number.isFinite(openNgc.bMag) && Number.isFinite(openNgc.vMag), `v592-deep-space-assets-openngc-galaxy-photometry:${catalog.id}`);
  const axisRatio = catalog.angularSize.minorArcmin / catalog.angularSize.majorArcmin;
  const colorIndexBV = openNgc.bMag - openNgc.vMag;
  assets.push({
    target: catalog.id,
    category: "galaxy",
    nasaId: `openngc-v260-${openNgc.id}`,
    status: "openngc-catalog-derived-analytic-model-admitted",
    visualModelKind: "openngc-catalog-derived-galaxy-analytic",
    source: {
      url: openNgcManifest.sourceUrl,
      path: "public/data/openngc-v260/openngc-v260.json.gz",
      bytes: openNgcCatalogBytes.byteLength,
      sha256: openNgcManifest.output.sha256,
      width: openNgcRows.length,
      height: 1,
      colorSpace: "not-applicable",
      license: openNgcManifest.license.id,
      licenseUrl: "https://github.com/mattiaverga/OpenNGC/blob/master/LICENSE",
      credit: "OpenNGC CC BY-SA 4.0; Orbit Atlas deterministic catalog-derived analytic presentation",
      observationEncoding: {
        bands: ["OpenNGC B", "OpenNGC V"],
        colorPolicy: "catalog B-V color index mapped to a deterministic analytic emissive model; not an observation image",
        nakedEyeRepresentationClaimed: false,
        scienceModePolicy: "catalog-marker-coordinate-angular-extent-and-source-state-only",
        cinematicModePolicy: "presentation-only-deterministic-openngc-morphology-model",
      },
    },
    catalogSelection: {
      coordinateFrame: "ICRS/J2000",
      openNgcId: openNgc.id,
      hubbleType: openNgc.hubble,
      bMag: Number(openNgc.bMag.toFixed(6)),
      vMag: Number(openNgc.vMag.toFixed(6)),
      colorIndexBV: Number(colorIndexBV.toFixed(6)),
      axisRatio: Number(axisRatio.toFixed(9)),
      positionAngleDeg: catalog.angularSize.positionAngleDeg,
      sourceIdentityControlsBrightness: false,
      noSyntheticCoverageFill: true,
    },
    analyticModel: {
      ...profile,
      deterministicSeed: deterministicSeedV592(`${openNgc.id}:${openNgc.hubble}`),
      shaderVersion: "v592-openngc-galaxy-analytic-v1",
      modelBasis: "OpenNGC Hubble type, B/V apparent magnitudes, axis ratio and position angle",
      observationImageClaim: false,
      explicitPrimaryModel: true,
    },
    reference: {
      coordinateFrame: catalog.coordinateFrame,
      raDeg: catalog.raDeg,
      decDeg: catalog.decDeg,
      angularSize: catalog.angularSize,
      distancePc: catalog.distancePc,
      referencePacketSha256: reference.packetSha256,
    },
    derivation: {
      tool: "deterministic-webgl2-analytic-shader",
      sharpVersion: sharp.versions.sharp,
      ktxSoftwareVersion: "4.4.2",
      parameters: "OpenNGC Hubble morphology and B/V photometry; analytic Sersic bulge, disk, spiral/dust/star-forming components; target-keyed deterministic microstructure; zero raster payload; no random runtime sampling",
      sourceChain: "openngc-catalog-derived-chain",
      noInpainting: true,
      noSyntheticCoverageFill: true,
      noAnnotationRemoval: true,
    },
    mappedColorLabelRequired: true,
    observationImageClaim: false,
    catalogDerivedVisualModel: true,
    nakedEyeRepresentationClaimed: false,
    scienceImagePayload: false,
    presentationOnly: true,
    scientificAuthority: false,
    scientificPayloadWriteback: false,
  });
}

const admittedGalaxies = assets.filter((entry) => entry.category === "galaxy").map((entry) => entry.target);
const admittedClusters = assets.filter((entry) => entry.category === "cluster").map((entry) => entry.target);
const blockedObjects = reference.objects.filter((entry) => !assets.some((asset) => asset.target === entry.id)).map((entry) => entry.id);
const manifest = writeSealed(manifestPath, {
  version: "v592-deep-space-visual-assets-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: "24-of-24-deep-space-visual-models-admitted",
  policy: {
    requiredGalaxyCount: 12,
    requiredClusterCount: 12,
    fixedCoordinateFrame: "ICRS/J2000",
    ktx2FirstFull: true,
    shaVerifiedFallback: true,
    onlyFocusedCinematicObjectLoadsImage: true,
    scienceModeMarkerOnly: true,
    mappedColorMustRemainLabeled: true,
    nakedEyeRepresentationClaimed: false,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noProceduralObservationFallback: true,
    gaiaCatalogDerivedPrimaryModelsAllowed: true,
    openNgcCatalogDerivedPrimaryModelsAllowed: true,
    missingAssetBehavior: "asset-blocked",
    maximumConcurrentHighOrderImages: 1,
    presentationOnly: true,
    scientificPayloadWriteback: false,
  },
  sourceReceipts: {
    referencePacketSha256: reference.packetSha256,
    acquisitionReceiptSha256: acquisition.receiptSha256,
    licenseReviewReceiptSha256: review.receiptSha256,
    visualAnalysisReceiptSha256: analysis.receiptSha256,
    alternativeLicenseReviewReceiptSha256: alternativeReview.receiptSha256,
    alternativeVisualAnalysisReceiptSha256: alternativeAnalysis.receiptSha256,
    alternativeContactSheetReceiptSha256: alternativeContactSheet.receiptSha256,
    gaiaCatalogManifestSha256: gaiaManifest.manifestSha256,
    openNgcCatalogManifestSha256: sha256(openNgcManifestBytes),
    openNgcCatalogArchiveSha256: openNgcManifest.output.sha256,
    openNgcCatalogLicenseSha256: openNgcManifest.license.sha256,
  },
  admission: {
    requiredGalaxyCount: 12,
    admittedGalaxyAssetCount: admittedGalaxies.length,
    requiredClusterCount: 12,
    admittedClusterAssetCount: admittedClusters.length,
    totalAssetAdmittedCount: assets.length,
    blockedCount: blockedObjects.length,
    admittedGalaxies,
    admittedClusters,
    blockedObjects,
  },
  assets,
}, "manifestSha256");

const allFiles = assets.flatMap((asset) => asset.variants
  ? Object.values(asset.variants).flatMap((tier) => tier.slices.flatMap((slice) => [slice.ktx2, slice.fallback].filter(Boolean)))
  : []);
const fullFiles = allFiles.filter((file) => file.url.includes("/full/"));
const liteFiles = allFiles.filter((file) => file.url.includes("/lite/"));
const receipt = writeSealed(receiptPath, {
  version: "v592-deep-space-visual-assets-receipt-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: "committed-twenty-four-deep-space-visual-models-twelve-galaxies-twelve-clusters",
  manifestPath: "public/data/living-universe-v592/deep-space-visual-assets.json",
  manifestSha256: manifest.manifestSha256,
  sourceAcquisitionReceiptSha256: acquisition.receiptSha256,
  licenseReviewReceiptSha256: review.receiptSha256,
  visualAnalysisReceiptSha256: analysis.receiptSha256,
  alternativeLicenseReviewReceiptSha256: alternativeReview.receiptSha256,
  alternativeVisualAnalysisReceiptSha256: alternativeAnalysis.receiptSha256,
  alternativeContactSheetReceiptSha256: alternativeContactSheet.receiptSha256,
  gaiaCatalogManifestSha256: gaiaManifest.manifestSha256,
  gaiaCatalogArchiveSha256: gaiaManifest.archive.sha256,
  openNgcCatalogManifestSha256: sha256(openNgcManifestBytes),
  openNgcCatalogArchiveSha256: openNgcManifest.output.sha256,
  openNgcCatalogLicenseSha256: openNgcManifest.license.sha256,
  referencePacketSha256: reference.packetSha256,
  admittedTargets: assets.map((entry) => entry.target),
  assetCount: assets.length,
  ktx2FileCount: allFiles.filter((file) => file.format === "ktx2").length,
  webpFileCount: allFiles.filter((file) => file.format === "webp").length,
  fullRuntimeBytes: fullFiles.reduce((sum, file) => sum + file.bytes, 0),
  liteIncrementBytes: liteFiles.reduce((sum, file) => sum + file.bytes, 0),
  sourcePayloadBytes: acquisition.assets.reduce((sum, entry) => sum + entry.bytes, 0)
    + alternativeAnalysis.analyses.reduce((sum, entry) => sum + entry.sourceBytes, 0),
  gaiaCatalogDerivedVisualModelCount: assets.filter((entry) => entry.visualModelKind === "gaia-catalog-derived-star-field-impostor").length,
  openNgcCatalogDerivedGalaxyVisualModelCount: assets.filter((entry) => entry.visualModelKind === "openngc-catalog-derived-galaxy-analytic").length,
  gaiaCatalogPayloadReusedFromExistingAdmission: true,
  deterministicSingleThreadKtx2: true,
  atomicOutputWrites: true,
  scienceImagePayload: false,
  presentationOnly: true,
  scientificPayloadWriteback: false,
}, "receiptSha256");

const generated = `// Generated by scripts/build-v592-deep-space-visual-assets.mjs. Do not edit.\n`
  + `export const DEEP_SPACE_VISUAL_MANIFEST_SHA256_V592 = ${JSON.stringify(manifest.manifestSha256)} as const;\n`
  + `export const DEEP_SPACE_VISUAL_ASSET_COUNT_V592 = ${assets.length} as const;\n`
  + `export const DEEP_SPACE_VISUAL_ASSETS_V592 = Object.freeze(${JSON.stringify(assets, null, 2)});\n`;
atomicWrite(generatedPath, Buffer.from(generated, "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  status: receipt.status,
  manifestSha256: manifest.manifestSha256,
  receiptSha256: receipt.receiptSha256,
  admittedTargets: receipt.admittedTargets,
  ktx2FileCount: receipt.ktx2FileCount,
  webpFileCount: receipt.webpFileCount,
  fullRuntimeBytes: receipt.fullRuntimeBytes,
  liteIncrementBytes: receipt.liteIncrementBytes,
}, null, 2));
