import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-visual-sources-v592.json");
const analysisPath = resolve(root, "docs/release/v592/major-moon-source-visual-analysis-v592.json");
const manifestPath = resolve(root, "public/data/living-universe-v592/major-moon-visual-assets.json");
const receiptPath = resolve(root, "docs/release/v592/major-moon-visual-assets-receipt-v592.json");
const generatedPath = resolve(root, "app/data/majorMoonVisualAssetsV592.generated.ts");
const candidateTextureRoot = resolve(root, "public/textures/candidate-v592");
const outputRoot = resolve(root, "public/textures/candidate-v592/major-moons");
const temporaryRoot = resolve(root, "tmp/v592-major-moon-assets");
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
function assertInside(parent, child, label) {
  const relativePath = relative(parent, child);
  assert(relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath), label);
}
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-assets-input-seal:${path}`);
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
async function createSeamSafePng(source, crop, width, height, output) {
  const { data, info } = await sharp(source, { limitInputPixels: false })
    .extract(crop)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  duplicateSeam(data, info.width, info.height, info.channels);
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
function outputRecord(path, url, width, height, format, compression, role) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "srgb", compression, role };
}
async function encodeWebp(input, output, quality) {
  atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer());
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

assert(existsSync(toktx), "v592-major-moon-assets-toktx-missing");
const acquisition = verifySealed(acquisitionPath);
const analysis = verifySealed(analysisPath);
assert(acquisition.status === "committed-six-visual-sources-single-request-each-no-retry", "v592-major-moon-assets-acquisition-status");
assert(analysis.status === "three-runtime-derivation-candidates-three-source-coverage-blocked", "v592-major-moon-assets-analysis-status");
assertInside(candidateTextureRoot, outputRoot, "v592-major-moon-assets-output-root");
rmSync(outputRoot, { recursive: true, force: true });
rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });

const assets = [];
for (const target of analysis.derivableTargets) {
  const source = acquisition.assets.find((asset) => asset.target === target);
  const decision = analysis.analyses.find((entry) => entry.target === target);
  assert(source && decision, `v592-major-moon-assets-source:${target}`);
  const sourcePath = resolve(root, source.outputPath);
  const sourceBytes = readFileSync(sourcePath);
  assert(sourceBytes.byteLength === source.bytes && sha256(sourceBytes) === source.sha256, `v592-major-moon-assets-source-drift:${target}`);
  const sizes = {
    desktop: [4096, 2048],
    mobile: [2048, 1024],
    liteDesktop: [1024, 512],
    liteMobile: [512, 256],
  };
  const pngs = Object.fromEntries(Object.entries(sizes).map(([tier]) => [tier, resolve(temporaryRoot, `${target}-${tier}.png`)]));
  for (const [tier, [width, height]] of Object.entries(sizes)) await createSeamSafePng(sourcePath, decision.crop, width, height, pngs[tier]);
  const paths = {
    desktopKtx2: resolve(outputRoot, "full/desktop", `${target}-albedo.ktx2`),
    desktopFallback: resolve(outputRoot, "full/desktop", `${target}-albedo.webp`),
    mobileKtx2: resolve(outputRoot, "full/mobile", `${target}-albedo.ktx2`),
    mobileFallback: resolve(outputRoot, "full/mobile", `${target}-albedo.webp`),
    liteDesktop: resolve(outputRoot, "lite/desktop", `${target}-albedo.webp`),
    liteMobile: resolve(outputRoot, "lite/mobile", `${target}-albedo.webp`),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  encodeKtx(pngs.desktop, paths.desktopKtx2, `v592-major-moon-${target}-desktop-ktx2`);
  encodeKtx(pngs.mobile, paths.mobileKtx2, `v592-major-moon-${target}-mobile-ktx2`);
  await encodeWebp(pngs.desktop, paths.desktopFallback, 93);
  await encodeWebp(pngs.mobile, paths.mobileFallback, 91);
  await encodeWebp(pngs.liteDesktop, paths.liteDesktop, 86);
  await encodeWebp(pngs.liteMobile, paths.liteMobile, 82);
  assets.push({
    target,
    nasaId: source.nasaId,
    status: "albedo-source-and-derived-variants-admitted",
    heroAdmission: false,
    source: {
      url: source.sourceUrl,
      path: source.outputPath,
      bytes: source.bytes,
      sha256: source.sha256,
      width: source.width,
      height: source.height,
      license: source.license,
      licenseUrl: source.licenseUrl,
      credit: source.credit,
      acquisitionReceiptSha256: acquisition.receiptSha256,
    },
    derivation: {
      crop: decision.crop,
      cropPolicy: decision.cropPolicy,
      sourceVisualAnalysisReceiptSha256: analysis.receiptSha256,
      tool: `sharp-${sharp.versions.sharp}+KTX-Software-4.4.2`,
      parameters: {
        resampling: "lanczos3",
        seamPolicy: "rightmost-column-duplicates-leftmost-column",
        fullCompression: "UASTC quality=2 RDO=1.0 single-thread zstd=10 mipmapped sRGB",
        fallbackCompression: "WebP q93/q91",
        liteCompression: "WebP q86/q82",
        inpainting: false,
        syntheticCoverageFill: false,
      },
    },
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v592/major-moons/full/desktop/${target}-albedo.ktx2`, 4096, 2048, "ktx2", "uastc-rdo-zstd10-mipmap", "full-desktop"),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v592/major-moons/full/desktop/${target}-albedo.webp`, 4096, 2048, "webp", "webp-q93", "full-desktop-fallback"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v592/major-moons/full/mobile/${target}-albedo.ktx2`, 2048, 1024, "ktx2", "uastc-rdo-zstd10-mipmap", "full-mobile"),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v592/major-moons/full/mobile/${target}-albedo.webp`, 2048, 1024, "webp", "webp-q91", "full-mobile-fallback"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v592/major-moons/lite/desktop/${target}-albedo.webp`, 1024, 512, "webp", "webp-q86", "lite-desktop"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v592/major-moons/lite/mobile/${target}-albedo.webp`, 512, 256, "webp", "webp-q82", "lite-mobile"),
    },
    observationColorPolicy: target === "titan" ? "Cassini-ISS-938nm-grayscale-not-true-color" : "NASA-global-map-source-color-or-grayscale-preserved",
    scientificAuthority: false,
    presentationOnly: true,
    scientificPayloadWriteback: false,
  });
}

const inheritedBlocked = ["io", "europa", "ganymede", "callisto", "iapetus", "triton", "miranda", "titania", "charon"];
const manifest = writeSealed(manifestPath, {
  version: "v592-major-moon-visual-assets-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "3-of-12-albedo-assets-admitted-0-of-12-heroes-admitted",
  policy: {
    requiredCount: 12,
    ktx2First: true,
    fallbackShaVerified: true,
    missingAssetBehavior: "asset-blocked",
    proceduralFallbackAllowed: false,
    coloredPlaceholderAllowed: false,
    albedoAdmissionDoesNotGrantHeroAdmission: true,
    presentationOnly: true,
    scientificPayloadWriteback: false,
  },
  sourceReceipts: {
    acquisitionReceiptSha256: acquisition.receiptSha256,
    visualAnalysisReceiptSha256: analysis.receiptSha256,
  },
  admission: {
    albedoAssetAdmittedCount: assets.length,
    heroAdmittedCount: 0,
    blockedCount: inheritedBlocked.length,
    admittedBodies: assets.map((asset) => asset.target),
    blockedBodies: inheritedBlocked,
  },
  assets,
}, "manifestSha256");

const generated = `// Generated by scripts/build-v592-major-moon-visual-assets.mjs. Do not edit.\n` +
  `export const MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592 = ${JSON.stringify(manifest.manifestSha256)} as const;\n` +
  `export const MAJOR_MOON_VISUAL_ASSET_COUNT_V592 = ${manifest.admission.albedoAssetAdmittedCount} as const;\n` +
  `export const MAJOR_MOON_VISUAL_ASSETS_V592 = Object.freeze(${JSON.stringify(assets, null, 2)} as const);\n`;
atomicWrite(generatedPath, Buffer.from(generated, "utf8"));

const receipt = writeSealed(receiptPath, {
  version: "v592-major-moon-visual-assets-receipt-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: manifest.status,
  manifestPath: "public/data/living-universe-v592/major-moon-visual-assets.json",
  manifestSha256: manifest.manifestSha256,
  generatedModulePath: "app/data/majorMoonVisualAssetsV592.generated.ts",
  generatedModuleSha256: sha256(Buffer.from(generated, "utf8")),
  admission: manifest.admission,
  fullRuntimeBytes: assets.reduce((sum, asset) => sum + asset.variants.desktopKtx2.bytes + asset.variants.desktopFallback.bytes + asset.variants.mobileKtx2.bytes + asset.variants.mobileFallback.bytes, 0),
  liteIncrementBytes: assets.reduce((sum, asset) => sum + asset.variants.liteDesktop.bytes + asset.variants.liteMobile.bytes, 0),
  heroAdmissionGranted: false,
  browserQualification: "not-run",
  scientificPayloadWriteback: false,
}, "receiptSha256");

rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: manifest.status, admittedBodies: manifest.admission.admittedBodies, blockedBodies: manifest.admission.blockedBodies, fullRuntimeBytes: receipt.fullRuntimeBytes, liteIncrementBytes: receipt.liteIncrementBytes, manifestSha256: manifest.manifestSha256, receiptSha256: receipt.receiptSha256 }, null, 2));
