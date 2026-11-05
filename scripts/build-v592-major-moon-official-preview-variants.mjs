import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-20T00:00:00Z";
const manifestPath = resolve(root, "public/data/living-universe-v592/major-moon-visual-assets.json");
const receiptPath = resolve(root, "docs/release/v592/major-moon-visual-assets-receipt-v592.json");
const generatedPath = resolve(root, "app/data/majorMoonVisualAssetsV592.generated.ts");
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-official-preview-assets-v592.json");
const outputRoot = resolve(root, "public/textures/candidate-v592/major-moons/official-preview");
const tempRoot = resolve(root, "tmp/v592-major-moon-official-preview");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sourceTargets = Object.freeze(["io", "europa", "ganymede", "callisto", "iapetus", "charon"]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = path + "." + process.pid + ".part";
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function verifySealed(path, field) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), "v592-major-moon-preview-seal:" + path);
  return document;
}
function runTool(args, label) {
  const result = spawnSync(toktx, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(label + ":" + (result.stderr || result.stdout));
}
function duplicateSeam(raw, width, height, channels) {
  for (let y = 0; y < height; y += 1) {
    const left = y * width * channels;
    const right = (y * width + width - 1) * channels;
    for (let channel = 0; channel < channels; channel += 1) raw[right + channel] = raw[left + channel];
  }
}
async function makePng(source, width, height, output) {
  const { data, info } = await sharp(source, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  duplicateSeam(data, info.width, info.height, info.channels);
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
async function makeWebp(input, output, quality) {
  const bytes = await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
  atomicWrite(output, bytes);
}
function outputRecord(path, url, width, height, format, compression, role) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "srgb", compression, role };
}
assert(existsSync(toktx), "v592-major-moon-preview-toktx-missing");
const oldManifest = verifySealed(manifestPath, "manifestSha256");
const oldReceipt = verifySealed(receiptPath, "receiptSha256");
const acquisition = verifySealed(acquisitionPath, "receiptSha256");
assert(acquisition.status === "six-official-preview-assets-acquired-single-request-each", "v592-major-moon-preview-acquisition-status");
assert(acquisition.assets.length === sourceTargets.length, "v592-major-moon-preview-acquisition-count");
assert(oldManifest.assets.every((asset) => !sourceTargets.includes(asset.target)), "v592-major-moon-preview-duplicate-target");
rmSync(outputRoot, { recursive: true, force: true });
rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(tempRoot, { recursive: true });

const additions = [];
for (const target of sourceTargets) {
  const source = acquisition.assets.find((asset) => asset.target === target);
  assert(source, "v592-major-moon-preview-source:" + target);
  const sourcePath = resolve(root, source.outputPath);
  const sourceBytes = readFileSync(sourcePath);
  assert(sourceBytes.byteLength === source.bytes && sha256(sourceBytes) === source.sha256, "v592-major-moon-preview-source-drift:" + target);
  const sizes = { desktop: [2048, 1024], mobile: [1024, 512], liteDesktop: [512, 256], liteMobile: [512, 256] };
  const pngs = {};
  for (const [tier, [width, height]] of Object.entries(sizes)) {
    pngs[tier] = resolve(tempRoot, target + "-" + tier + ".png");
    await makePng(sourcePath, width, height, pngs[tier]);
  }
  const paths = {
    desktopKtx2: resolve(outputRoot, "full/desktop", target + "-albedo.ktx2"),
    desktopFallback: resolve(outputRoot, "full/desktop", target + "-albedo.webp"),
    mobileKtx2: resolve(outputRoot, "full/mobile", target + "-albedo.ktx2"),
    mobileFallback: resolve(outputRoot, "full/mobile", target + "-albedo.webp"),
    liteDesktop: resolve(outputRoot, "lite/desktop", target + "-albedo.webp"),
    liteMobile: resolve(outputRoot, "lite/mobile", target + "-albedo.webp"),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const encode = (input, output, label) => {
    const partial = output + "." + process.pid + ".part";
    runTool(["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "1.0", "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", "srgb", "--assign_primaries", "srgb", partial, input], label);
    rmSync(output, { force: true });
    renameSync(partial, output);
  };
  encode(pngs.desktop, paths.desktopKtx2, "v592-major-moon-preview-" + target + "-desktop-ktx2");
  encode(pngs.mobile, paths.mobileKtx2, "v592-major-moon-preview-" + target + "-mobile-ktx2");
  await makeWebp(pngs.desktop, paths.desktopFallback, 93);
  await makeWebp(pngs.mobile, paths.mobileFallback, 91);
  await makeWebp(pngs.liteDesktop, paths.liteDesktop, 86);
  await makeWebp(pngs.liteMobile, paths.liteMobile, 82);
  const sourceUrl = source.url;
  additions.push({
    target,
    nasaId: source.nasaId,
    status: "official-usgs-pds-preview-source-and-derived-variants-admitted-resolution-limited",
    heroAdmission: false,
    source: {
      url: sourceUrl,
      path: source.outputPath,
      bytes: source.bytes,
      sha256: source.sha256,
      width: source.width,
      height: source.height,
      license: source.license,
      licenseUrl: source.licenseUrl,
      credit: "USGS Astrogeology / NASA PDS mission mosaic; source-resolution-limited preview",
      acquisitionReceiptSha256: acquisition.receiptSha256,
    },
    derivation: {
      crop: { left: 0, top: 0, width: source.width, height: source.height },
      cropPolicy: "full-frame-2-to-1-official-preview",
      tool: "sharp-" + sharp.versions.sharp + "+KTX-Software-4.4.2",
      parameters: {
        resampling: "lanczos3-upsample-from-1024px-preview",
        seamPolicy: "rightmost-column-duplicates-leftmost-column",
        fullCompression: "UASTC quality=2 RDO=1.0 single-thread zstd=10 mipmapped sRGB",
        fallbackCompression: "WebP q93/q91",
        liteCompression: "WebP q86/q82",
        sourceResolutionLimited: true,
        inpainting: false,
        syntheticCoverageFill: false,
      },
    },
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, "/textures/candidate-v592/major-moons/official-preview/full/desktop/" + target + "-albedo.ktx2", 2048, 1024, "ktx2", "uastc-rdo-zstd10-mipmap", "full-desktop"),
      desktopFallback: outputRecord(paths.desktopFallback, "/textures/candidate-v592/major-moons/official-preview/full/desktop/" + target + "-albedo.webp", 2048, 1024, "webp", "webp-q93", "full-desktop-fallback"),
      mobileKtx2: outputRecord(paths.mobileKtx2, "/textures/candidate-v592/major-moons/official-preview/full/mobile/" + target + "-albedo.ktx2", 1024, 512, "ktx2", "uastc-rdo-zstd10-mipmap", "full-mobile"),
      mobileFallback: outputRecord(paths.mobileFallback, "/textures/candidate-v592/major-moons/official-preview/full/mobile/" + target + "-albedo.webp", 1024, 512, "webp", "webp-q91", "full-mobile-fallback"),
      liteDesktop: outputRecord(paths.liteDesktop, "/textures/candidate-v592/major-moons/official-preview/lite/desktop/" + target + "-albedo.webp", 512, 256, "webp", "webp-q86", "lite-desktop"),
      liteMobile: outputRecord(paths.liteMobile, "/textures/candidate-v592/major-moons/official-preview/lite/mobile/" + target + "-albedo.webp", 512, 256, "webp", "webp-q82", "lite-mobile"),
    },
    observationColorPolicy: "USGS-NASA-PDS-global-mosaic-source-color-preserved-resolution-limited",
    scientificAuthority: false,
    presentationOnly: true,
    scientificPayloadWriteback: false,
  });
}

const assets = [...oldManifest.assets, ...additions];
const blockedBodies = ["triton", "miranda", "titania"];
const manifest = {
  ...oldManifest,
  generatedAt,
  status: assets.length + "-of-12-albedo-assets-admitted-0-of-12-heroes-admitted",
  sourceReceipts: {
    ...oldManifest.sourceReceipts,
    officialPreviewAcquisitionReceiptSha256: acquisition.receiptSha256,
  },
  admission: {
    ...oldManifest.admission,
    albedoAssetAdmittedCount: assets.length,
    blockedCount: blockedBodies.length,
    admittedBodies: assets.map((asset) => asset.target),
    blockedBodies,
  },
  assets,
};
delete manifest.manifestSha256;
manifest.manifestSha256 = canonicalSha(manifest);
atomicWrite(manifestPath, Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8"));

const generated = "// Generated by scripts/build-v592-major-moon-official-preview-variants.mjs. Do not edit.\n"
  + "export const MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592 = " + JSON.stringify(manifest.manifestSha256) + " as const;\n"
  + "export const MAJOR_MOON_VISUAL_ASSET_COUNT_V592 = " + manifest.admission.albedoAssetAdmittedCount + " as const;\n"
  + "export const MAJOR_MOON_VISUAL_ASSETS_V592 = Object.freeze(" + JSON.stringify(assets, null, 2) + " as const);\n";
atomicWrite(generatedPath, Buffer.from(generated, "utf8"));

const fullRuntimeBytes = assets.reduce((sum, asset) => sum + asset.variants.desktopKtx2.bytes + asset.variants.desktopFallback.bytes + asset.variants.mobileKtx2.bytes + asset.variants.mobileFallback.bytes, 0);
const liteIncrementBytes = assets.reduce((sum, asset) => sum + asset.variants.liteDesktop.bytes + asset.variants.liteMobile.bytes, 0);
const receiptUnsigned = {
  ...oldReceipt,
  generatedAt,
  status: manifest.status,
  manifestSha256: manifest.manifestSha256,
  generatedModuleSha256: sha256(Buffer.from(generated, "utf8")),
  admission: manifest.admission,
  fullRuntimeBytes,
  liteIncrementBytes,
  officialPreviewAssetCount: additions.length,
  officialPreviewSourceResolutionLimited: true,
  officialPreviewAcquisitionReceiptSha256: acquisition.receiptSha256,
};
delete receiptUnsigned.receiptSha256;
const receipt = { ...receiptUnsigned, receiptSha256: canonicalSha(receiptUnsigned) };
atomicWrite(receiptPath, Buffer.from(JSON.stringify(receipt, null, 2) + "\n", "utf8"));
rmSync(tempRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: manifest.status, admittedBodies: manifest.admission.admittedBodies, blockedBodies, officialPreviewAssetCount: additions.length, fullRuntimeBytes, liteIncrementBytes, manifestSha256: manifest.manifestSha256, receiptSha256: receipt.receiptSha256 }, null, 2));
