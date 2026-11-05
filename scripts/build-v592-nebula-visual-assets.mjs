import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json");
const reviewPath = resolve(root, "docs/release/v592/nebula-item-license-review-v592.json");
const analysisPath = resolve(root, "docs/release/v592/nebula-source-visual-analysis-v592.json");
const manifestPath = resolve(root, "public/data/living-universe-v592/nebula-visual-assets.json");
const receiptPath = resolve(root, "docs/release/v592/nebula-visual-assets-receipt-v592.json");
const generatedPath = resolve(root, "app/data/nebulaVisualAssetsV592.generated.ts");
const candidateRoot = resolve(root, "public/textures/candidate-v592");
const outputRoot = resolve(root, "public/textures/candidate-v592/nebulae-v592");
const temporaryRoot = resolve(root, "tmp/v592-nebula-assets");
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
function verifySealed(path, field = "receiptSha256") {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), `v592-nebula-assets-input-seal:${path}`);
  return document;
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeSealed(path, unsigned, field = "receiptSha256") {
  const document = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(document, null, 2)}\n`, "utf8"));
  return document;
}
function assertInside(parent, child, label) {
  const relativePath = relative(parent, child);
  assert(relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath), label);
}
function runTool(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}
function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
const ALPHA_PROFILES_V592 = Object.freeze({
  desktop4: Object.freeze({
    low: Object.freeze([2, 12, 32, 72]),
    high: Object.freeze([84, 150, 218, 255]),
    opacity: Object.freeze([0.28, 0.38, 0.5, 0.64]),
  }),
  mobile2: Object.freeze({
    low: Object.freeze([2, 34]),
    high: Object.freeze([132, 235]),
    opacity: Object.freeze([0.48, 0.68]),
  }),
  lite1: Object.freeze({
    low: Object.freeze([4]),
    high: Object.freeze([176]),
    opacity: Object.freeze([0.82]),
  }),
});
function alphaProfileV592(depthCount) {
  if (depthCount === 4) return ALPHA_PROFILES_V592.desktop4;
  if (depthCount === 2) return ALPHA_PROFILES_V592.mobile2;
  if (depthCount === 1) return ALPHA_PROFILES_V592.lite1;
  throw new Error(`v592-nebula-assets-alpha-profile:${depthCount}`);
}
function blockAlignedDimensionV592(value) {
  return Math.max(4, Math.round(value / 4) * 4);
}
function outputRecord(path, url, width, height, format, compression, role, depthIndex) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "srgb", compression, role, depthIndex };
}
function runtimeUrl(path) {
  return `/${path.slice(resolve(root, "public").length + 1).replaceAll("\\", "/")}`;
}
async function writePresentationLayer(sourcePath, crop, width, height, depthIndex, depthCount, outputPath) {
  const { data, info } = await sharp(sourcePath, { limitInputPixels: false })
    .extract(crop)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(width * height * 4);
  const alphaProfile = alphaProfileV592(depthCount);
  const low = alphaProfile.low[depthIndex];
  const high = alphaProfile.high[depthIndex];
  const opacity = alphaProfile.opacity[depthIndex];
  assert(Number.isFinite(low) && Number.isFinite(high) && Number.isFinite(opacity), `v592-nebula-assets-alpha-layer:${depthCount}:${depthIndex}`);
  const depthBias = depthCount > 1 ? depthIndex / (depthCount - 1) : 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIndex = (y * info.width + x) * info.channels;
      const targetIndex = (y * width + x) * 4;
      const red = data[sourceIndex] ?? 0;
      const green = data[sourceIndex + 1] ?? 0;
      const blue = data[sourceIndex + 2] ?? 0;
      const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const edgeDistance = Math.min(x / width, 1 - x / width, y / height, 1 - y / height);
      const edge = smoothstep(0, 0.08, edgeDistance);
      const alpha = Math.round(Math.max(0, Math.min(255, smoothstep(low, high, luma) * opacity * (0.86 + depthBias * 0.14) * edge * 255)));
      output[targetIndex] = red;
      output[targetIndex + 1] = green;
      output[targetIndex + 2] = blue;
      output[targetIndex + 3] = alpha;
    }
  }
  await sharp(output, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(outputPath);
}
function encodeKtx(input, output, label) {
  const partial = `${output}.${process.pid}.part`;
  runTool(toktx, [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "1.0", "--uastc_rdo_m",
    "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", "srgb", "--assign_primaries", "srgb",
    partial, input,
  ], label);
  rmSync(output, { force: true });
  renameSync(partial, output);
}
async function encodeWebp(input, output, quality) {
  atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer());
}

assert(existsSync(toktx), "v592-nebula-assets-toktx-missing");
const acquisition = verifySealed(acquisitionPath);
const review = verifySealed(reviewPath);
const analysis = verifySealed(analysisPath);
assert(acquisition.status === "committed-seven-visual-sources-single-request-each-no-retry", "v592-nebula-assets-acquisition-status");
assert(review.status === "7-visual-source-acquisitions-eligible-5-license-identity-or-suitability-blocked", "v592-nebula-assets-review-status");
assert(analysis.status === "six-runtime-derivation-candidates-one-visual-coverage-blocked", "v592-nebula-assets-analysis-status");
assertInside(candidateRoot, outputRoot, "v592-nebula-assets-output-root");
rmSync(outputRoot, { recursive: true, force: true });
rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });

const assets = [];
for (const target of analysis.derivableTargets) {
  const source = acquisition.assets.find((asset) => asset.target === target);
  const decision = analysis.analyses.find((entry) => entry.target === target);
  const reviewEntry = review.reviews.find((entry) => entry.target === target);
  assert(source && decision && reviewEntry, `v592-nebula-assets-source:${target}`);
  const sourcePath = resolve(root, source.outputPath);
  const sourceBytes = readFileSync(sourcePath);
  assert(sourceBytes.byteLength === source.bytes && sha256(sourceBytes) === source.sha256, `v592-nebula-assets-source-drift:${target}`);
  const crop = decision.crop;
  const aspect = crop.width / crop.height;
  const sizes = {
    desktop: aspect >= 1 ? [2048, blockAlignedDimensionV592(2048 / aspect)] : [blockAlignedDimensionV592(2048 * aspect), 2048],
    mobile: aspect >= 1 ? [1024, blockAlignedDimensionV592(1024 / aspect)] : [blockAlignedDimensionV592(1024 * aspect), 1024],
    lite: aspect >= 1 ? [512, Math.max(1, Math.round(512 / aspect))] : [Math.max(1, Math.round(512 * aspect)), 512],
  };
  const depthCounts = { desktop: 4, mobile: 2, lite: 1 };
  const tierRecords = {};
  for (const [tier, [width, height]] of Object.entries(sizes)) {
    const depthRecords = [];
    for (let depthIndex = 0; depthIndex < depthCounts[tier]; depthIndex += 1) {
      const stem = `${target}-depth-${depthIndex}`;
      const png = resolve(temporaryRoot, `${stem}-${tier}.png`);
      await writePresentationLayer(sourcePath, crop, width, height, depthIndex, depthCounts[tier], png);
      const paths = tier === "lite"
        ? {
            fallback: resolve(outputRoot, "lite", "shared", `${stem}.webp`),
          }
        : {
            ktx2: resolve(outputRoot, "full", tier, `${stem}.ktx2`),
            fallback: resolve(outputRoot, "full", tier, `${stem}.webp`),
          };
      Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
      if (tier === "lite") {
        await encodeWebp(png, paths.fallback, 78);
        const shared = outputRecord(paths.fallback, runtimeUrl(paths.fallback), width, height, "webp", "webp-q78-shared", "lite-shared", depthIndex);
        depthRecords.push({
          depthIndex,
          desktopFallback: shared,
          mobileFallback: shared,
        });
      } else {
        encodeKtx(png, paths.ktx2, `v592-nebula-${target}-${tier}-${depthIndex}-ktx2`);
        await encodeWebp(png, paths.fallback, tier === "desktop" ? 88 : 82);
        depthRecords.push({
          depthIndex,
          ktx2: outputRecord(paths.ktx2, runtimeUrl(paths.ktx2), width, height, "ktx2", "uastc-rdo-zstd10-mipmap-srgb", `${tier}-ktx2`, depthIndex),
          fallback: outputRecord(paths.fallback, runtimeUrl(paths.fallback), width, height, "webp", tier === "desktop" ? "webp-q88" : "webp-q82", `${tier}-fallback`, depthIndex),
        });
      }
    }
    tierRecords[tier] = { width, height, aspect, depthSliceCount: depthCounts[tier], slices: depthRecords };
  }
  assets.push({
    target,
    nasaId: source.nasaId,
    catalogName: target === "heart-nebula" ? "IC 1805" : target === "soul-nebula" ? "IC 1848" : target === "witch-head-nebula" ? "IC 2118" : target === "flame-nebula" ? "NGC 2024" : target === "pacman-nebula" ? "NGC 281" : "IC 2944",
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
      acquisitionReceiptSha256: acquisition.receiptSha256,
      licenseReviewReceiptSha256: review.receiptSha256,
      visualAnalysisReceiptSha256: analysis.receiptSha256,
    },
    coordinates: {
      coordinateFrame: "ICRS/J2000-equatorial-derived-from-existing-curated-galactic-catalog",
      derivation: "IAU-1958/J2000 galactic-to-equatorial rotation; source catalog remains read-only",
      raDeg: {
        "heart-nebula": 37.719103,
        "soul-nebula": 38.688815,
        "witch-head-nebula": 76.269028,
        "flame-nebula": 85.286466,
        "pacman-nebula": 14.605743,
        "running-chicken-nebula": 159.584219,
      }[target],
      decDeg: {
        "heart-nebula": 60.979204,
        "soul-nebula": 61.327212,
        "witch-head-nebula": -9.007,
        "flame-nebula": -1.94346,
        "pacman-nebula": 56.55862,
        "running-chicken-nebula": -59.98874,
      }[target],
      angularSizeDeg: {
        "heart-nebula": 1.0,
        "soul-nebula": 1.0,
        "witch-head-nebula": 3.0,
        "flame-nebula": 0.5,
        "pacman-nebula": 0.583333,
        "running-chicken-nebula": 1.0,
      }[target],
      galacticCatalogReference: {
        "heart-nebula": { lDeg: 134.7, bDeg: 0.4, distancePc: 2400 },
        "soul-nebula": { lDeg: 135, bDeg: 0.9, distancePc: 2400 },
        "witch-head-nebula": { lDeg: 208.9, bDeg: -27.7, distancePc: 300 },
        "flame-nebula": { lDeg: 206.5, bDeg: -16.5, distancePc: 412 },
        "pacman-nebula": { lDeg: 123.9, bDeg: -6.3, distancePc: 2800 },
        "running-chicken-nebula": { lDeg: 287, bDeg: -1.3, distancePc: 1900 },
      }[target],
    },
    observationEncoding: reviewEntry.observationEncoding,
    derivation: {
      tool: `sharp-${sharp.versions.sharp}+KTX-Software-4.4.2`,
      parameters: {
        alphaPolicy: "luma-thresholded-presentation-mask-with-edge-feather-and-tier-normalized-visibility",
        depthSlicePolicy: "pre-registered-alpha-profiles-4-desktop-2-mobile-1-lite",
        alphaProfiles: ALPHA_PROFILES_V592,
        ktx2BlockAlignment: "4x4-all-full-tiers",
        inpainting: false,
        syntheticCoverageFill: false,
        scientificDataClaim: false,
      },
    },
    tiers: tierRecords,
    presentationOnly: true,
    scientificAuthority: false,
    scientificPayloadWriteback: false,
  });
}

const manifest = writeSealed(manifestPath, {
  version: "v592-nebula-visual-assets-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "six-of-seven-source-reviewed-nebula-runtime-assets-admitted",
  policy: {
    requiredNewSourceCount: 7,
    runtimeAssetAdmittedCount: assets.length,
    proceduralFallbackAllowed: false,
    coloredPlaceholderAllowed: false,
    scienceImagePayloadAllowed: false,
    cinematicPresentationOnly: true,
    fixedJ2000Direction: true,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    maxConcurrentHighOrderDepthSlices: 3,
  },
  sourceReceipts: {
    acquisitionReceiptSha256: acquisition.receiptSha256,
    licenseReviewReceiptSha256: review.receiptSha256,
    visualAnalysisReceiptSha256: analysis.receiptSha256,
  },
  admission: {
    sourceReviewedCount: analysis.summary.analyzedCount,
    sourceCoverageBlockedCount: analysis.summary.visualCoverageBlockedCount,
    runtimeAssetAdmittedCount: assets.length,
    heroAdmissionCount: 0,
    admittedTargets: assets.map((asset) => asset.target),
    blockedTargets: [...analysis.blockedTargets, ...review.blockedTargets],
  },
  assets,
}, "manifestSha256");

const generated = [
  "// Generated by scripts/build-v592-nebula-visual-assets.mjs. Do not edit.",
  `export const NEBULA_VISUAL_MANIFEST_SHA256_V592 = ${JSON.stringify(manifest.manifestSha256)} as const;`,
  `export const NEBULA_VISUAL_ASSET_COUNT_V592 = ${manifest.admission.runtimeAssetAdmittedCount} as const;`,
  `export const NEBULA_VISUAL_ASSETS_V592 = Object.freeze(${JSON.stringify(assets, null, 2)} as const);`,
  "",
].join("\n");
atomicWrite(generatedPath, Buffer.from(generated, "utf8"));
const fullRuntimeBytes = assets.reduce((sum, asset) => sum + Object.values(asset.tiers).reduce((tierSum, tier) => tierSum + tier.slices.reduce((sliceSum, slice) => sliceSum + (slice.ktx2?.bytes ?? 0) + (slice.fallback?.bytes ?? 0), 0), 0), 0);
const liteIncrementBytes = [...new Map(assets.flatMap((asset) => asset.tiers.lite.slices.flatMap((slice) => [slice.desktopFallback, slice.mobileFallback])).map((file) => [file.url, file.bytes])).values()]
  .reduce((sum, bytes) => sum + bytes, 0);
const receipt = writeSealed(receiptPath, {
  version: "v592-nebula-visual-assets-receipt-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: manifest.status,
  manifestPath: "public/data/living-universe-v592/nebula-visual-assets.json",
  manifestSha256: manifest.manifestSha256,
  generatedModulePath: "app/data/nebulaVisualAssetsV592.generated.ts",
  generatedModuleSha256: sha256(Buffer.from(generated, "utf8")),
  admission: manifest.admission,
  fullRuntimeBytes,
  liteIncrementBytes,
  depthSlicePolicy: { desktop: 4, mobile: 2, lite: 1 },
  alphaProfiles: ALPHA_PROFILES_V592,
  heroAdmissionGranted: false,
  browserQualification: "not-run",
  scientificPayloadWriteback: false,
});
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: manifest.status, admittedTargets: manifest.admission.admittedTargets, blockedTargets: manifest.admission.blockedTargets, fullRuntimeBytes, liteIncrementBytes, manifestSha256: manifest.manifestSha256, receiptSha256: receipt.receiptSha256 }, null, 2));
