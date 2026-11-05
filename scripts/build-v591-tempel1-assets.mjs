import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-14T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-asset-tempel-1-pds-shape-v2.json");
const modelReceiptPath = resolve(root, "docs/release/v591/tempel-1-model-lod-receipt-v591.json");
const bennuOverlayPath = resolve(root, "public/data/celestial-convergence-v591/bennu-asset-overlay.json");
const sourceRoot = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/pds-shape-v2/dif-c-hriv_its_mri-5-tempel1-shape-v2.0");
const sourcePath = resolve(sourceRoot, "document/tempel1_8ppd_imagemosaic.png");
const sourceLabelPath = resolve(sourceRoot, "document/tempel1_mosaic.lbl");
const sourceDescriptionPath = resolve(sourceRoot, "document/tempel1_shape_description.asc");
const outputRoot = resolve(root, "public/textures/candidate-v591/tempel-1");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/tempel-1-asset-overlay.json");
const receiptPath = resolve(root, "docs/release/v591/tempel-1-asset-build-receipt-v591.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const qaRoot = resolve(root, "docs/release/v591/screenshots");
const temporaryRoot = resolve(root, "tmp/v591-tempel-1-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");

const DESKTOP = Object.freeze({ width: 2880, height: 1440 });
const MOBILE = Object.freeze({ width: 1440, height: 720 });
const LITE_DESKTOP = Object.freeze({ width: 1024, height: 512 });
const LITE_MOBILE = Object.freeze({ width: 512, height: 256 });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function fileSha(path) { return sha256(readFileSync(path)); }
function verifySealed(path, key = "receiptSha256") {
  const value = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...value };
  delete unsigned[key];
  assert(value[key] === canonicalSha(unsigned), `v591-tempel1-assets-seal:${path}`);
  return value;
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
}
function runTool(executable, args, label) {
  const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  assert(result.status === 0, `${label}:${result.status}:${result.stderr || result.stdout}`);
}
function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}
async function encodeAsset({ id, role, desktopPng, colorSpace, rdoLambda, losslessFallback }) {
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
  await sharp(desktopPng, { limitInputPixels: false }).resize(MOBILE.width, MOBILE.height, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(mobilePng);
  await sharp(desktopPng, { limitInputPixels: false }).resize(LITE_DESKTOP.width, LITE_DESKTOP.height, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(liteDesktopPng);
  await sharp(desktopPng, { limitInputPixels: false }).resize(LITE_MOBILE.width, LITE_MOBILE.height, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(liteMobilePng);
  const ktxArgs = (output, input) => [
    "--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda),
    "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap",
    "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none",
    output, input,
  ];
  for (const [target, input, suffix] of [
    [paths.desktopKtx2, desktopPng, "desktop"],
    [paths.mobileKtx2, mobilePng, "mobile"],
  ]) {
    const part = `${target}.${process.pid}.part`;
    rmSync(part, { force: true });
    runTool(toktx, ktxArgs(part, input), `v591-tempel1-${id}-${suffix}-ktx2`);
    rmSync(target, { force: true });
    renameSync(part, target);
  }
  const encodeWebp = async (input, output, quality, lossless = losslessFallback) => atomicWrite(
    output,
    await sharp(input, { limitInputPixels: false }).webp(lossless ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true }).toBuffer(),
  );
  await encodeWebp(desktopPng, paths.desktopFallback, 94);
  await encodeWebp(mobilePng, paths.mobileFallback, 91);
  await encodeWebp(liteDesktopPng, paths.liteDesktop, role === "pds-observed-coverage-mask" ? 85 : 80, role === "pds-observed-coverage-mask");
  await encodeWebp(liteMobilePng, paths.liteMobile, role === "pds-observed-coverage-mask" ? 82 : 76, role === "pds-observed-coverage-mask");
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id,
    body: "tempel-1",
    role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/tempel-1/full/desktop/${id}.ktx2`, DESKTOP.width, DESKTOP.height, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/tempel-1/full/desktop/${id}.webp`, DESKTOP.width, DESKTOP.height, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-94"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/tempel-1/full/mobile/${id}.ktx2`, MOBILE.width, MOBILE.height, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/tempel-1/full/mobile/${id}.webp`, MOBILE.width, MOBILE.height, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-91"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/tempel-1/lite/desktop/${id}.webp`, LITE_DESKTOP.width, LITE_DESKTOP.height, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-80-presentation-lite"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/tempel-1/lite/mobile/${id}.webp`, LITE_MOBILE.width, LITE_MOBILE.height, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-76-presentation-lite"),
    },
  };
}

const acquisition = verifySealed(acquisitionPath);
const modelReceipt = verifySealed(modelReceiptPath);
const bennuOverlay = verifySealed(bennuOverlayPath);
assert(acquisition.status === "committed-single-request-no-retry" && acquisition.target === "tempel-1" && acquisition.requestCount === 1, "v591-tempel1-assets-acquisition");
assert(acquisition.automaticRetryPerformed === false && acquisition.automaticReplacementPerformed === false, "v591-tempel1-assets-network-policy");
assert(modelReceipt.status === "tempel-1-three-lod-model-ready-for-runtime-admission" && modelReceipt.acquisitionReceiptSha256 === acquisition.receiptSha256, "v591-tempel1-assets-model-chain");
assert(modelReceipt.mosaic.path.replaceAll("/", "\\") === sourcePath.slice(root.length + 1) && modelReceipt.mosaic.sha256 === fileSha(sourcePath), "v591-tempel1-assets-mosaic-chain");
assert(bennuOverlay.version === "v591-bennu-asset-overlay-v1" && bennuOverlay.assets?.length === 3 && bennuOverlay.proceduralFallback === false, "v591-tempel1-assets-cc0-chain");

const sourceMetadata = await sharp(sourcePath).metadata();
assert(sourceMetadata.width === DESKTOP.width && sourceMetadata.height === DESKTOP.height, `v591-tempel1-assets-source-dimensions:${sourceMetadata.width}x${sourceMetadata.height}`);
const { data: sourceGray, info } = await sharp(sourcePath, { limitInputPixels: false }).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
assert(info.width === DESKTOP.width && info.height === DESKTOP.height && info.channels === 1, "v591-tempel1-assets-source-layout");
let observedPixels = 0;
const observationRgb = Buffer.allocUnsafe(sourceGray.length * 3);
const mask = Buffer.allocUnsafe(sourceGray.length);
for (let pixel = 0; pixel < sourceGray.length; pixel += 1) {
  const observed = sourceGray[pixel] > 0;
  if (observed) observedPixels += 1;
  const display = observed ? sourceGray[pixel] : 112;
  observationRgb[pixel * 3] = display;
  observationRgb[pixel * 3 + 1] = display;
  observationRgb[pixel * 3 + 2] = display;
  mask[pixel] = observed ? 255 : 0;
}
const observedFraction = observedPixels / sourceGray.length;
assert(observedFraction > 0.80 && observedFraction < 0.81, `v591-tempel1-assets-observed-fraction:${observedFraction}`);
rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
mkdirSync(qaRoot, { recursive: true });
const observationPng = resolve(temporaryRoot, "tempel-1-observation-native.png");
const maskPng = resolve(temporaryRoot, "tempel-1-observation-mask-native.png");
await sharp(observationRgb, { raw: { width: DESKTOP.width, height: DESKTOP.height, channels: 3 }, limitInputPixels: false }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(observationPng);
await sharp(mask, { raw: { width: DESKTOP.width, height: DESKTOP.height, channels: 1 }, limitInputPixels: false }).blur(0.72).png({ compressionLevel: 9 }).toFile(maskPng);
await sharp(sourcePath, { limitInputPixels: false }).resize(2048, 1024, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(resolve(qaRoot, "tempel-1-pds-observation-mosaic-v591.png"));
await sharp(maskPng, { limitInputPixels: false }).resize(2048, 1024, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(resolve(qaRoot, "tempel-1-pds-observation-mask-v591.png"));

const observation = await encodeAsset({ id: "tempel-1-observation", role: "pds-simple-cylindrical-surface-mosaic", desktopPng: observationPng, colorSpace: "srgb", rdoLambda: 0.72, losslessFallback: false });
const coverageMask = await encodeAsset({ id: "tempel-1-observation-mask", role: "pds-observed-coverage-mask", desktopPng: maskPng, colorSpace: "linear", rdoLambda: 0.42, losslessFallback: true });
const sourceRelative = sourcePath.slice(root.length + 1).replaceAll("\\", "/");
const source = {
  acquisitionReceiptSha256: acquisition.receiptSha256,
  datasetId: acquisition.asset.datasetId,
  packageSha256: acquisition.asset.sha256,
  path: sourceRelative,
  sha256: fileSha(sourcePath),
  bytes: statSync(sourcePath).size,
  width: DESKTOP.width,
  height: DESKTOP.height,
  sourceUrl: acquisition.asset.sourceUrl,
  license: acquisition.asset.license,
  observationIdentity: "Deep Impact MRI/ITS + Stardust-NExT Navcam map-projected Tempel 1 surface mosaic",
  observationLimit: "PDS documentation states the mosaic was moderately high-pass filtered and manually stretched. Exact-zero pixels are unobserved coverage and never presented as measured dark terrain.",
};
const assets = [observation, coverageMask].map((asset) => ({
  ...asset,
  source,
  derivation: {
    tool: `sharp-${sharp.versions.sharp}+KTX-Software-4.4.2`,
    parameters: asset.id === "tempel-1-observation"
      ? "native 2880x1440 simple-cylindrical grayscale; exact-zero texels neutralized only beneath independently sealed coverage mask to prevent mip-edge black bleed; UASTC RDO single-thread"
      : "exact source value > 0 coverage; 0.72px presentation feather; UASTC RDO single-thread",
    projection: "simple-cylindrical",
    longitudeEastDeg: [-180, 180],
    latitudeDeg: [90, -90],
    observedPixelFraction: observedFraction,
    unobservedPixelFraction: 1 - observedFraction,
    sourceDocumentationPath: sourceDescriptionPath.slice(root.length + 1).replaceAll("\\", "/"),
    sourceDocumentationSha256: fileSha(sourceDescriptionPath),
    sourceLabelPath: sourceLabelPath.slice(root.length + 1).replaceAll("\\", "/"),
    sourceLabelSha256: fileSha(sourceLabelPath),
  },
  fullQualityMinimum: { desktop: DESKTOP, mobile: MOBILE },
  presentationOnly: true,
}));
const microtextureAssets = bennuOverlay.assets.map((asset) => ({
  id: `tempel-1-${asset.id.replace("bennu-", "")}`,
  inheritedAssetId: asset.id,
  body: "tempel-1",
  sourceSha256: asset.source.sha256,
  sourceOverlaySha256: bennuOverlay.receiptSha256,
  variants: asset.variants,
  exactByteReuse: true,
  presentationOnly: true,
  observationLimit: "Poly Haven CC0 regolith supplies bounded presentation microstructure and unobserved-area substrate only; it is not Tempel 1 observation data.",
}));
const modelLods = modelReceipt.lods.map((lod) => ({
  ...lod,
  pivot: modelReceipt.normalized.pivot,
  units: modelReceipt.normalized.units,
  rotationAxis: modelReceipt.normalized.rotationAxis,
}));
const unsignedOverlay = {
  version: "v591-tempel-1-asset-overlay-v1",
  generatedAt,
  status: "tempel-1-assets-derived-awaiting-runtime-admission",
  body: "tempel-1",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  modelLodReceiptSha256: modelReceipt.receiptSha256,
  noNetworkRequestsPerformedDuringDerivation: true,
  noTextureBytesCopiedForCc0Reuse: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  model: {
    candidate: "v591-owned",
    sourcePath: modelReceipt.source.path,
    sourceSha256: modelReceipt.source.sha256,
    sourceUrl: acquisition.asset.sourceUrl,
    sourceDatasetId: acquisition.asset.datasetId,
    sourceDetailCeiling: modelReceipt.sourceDetailCeiling,
    license: acquisition.asset.license,
    units: modelReceipt.normalized.units,
    sourceUnits: modelReceipt.normalized.sourceUnits,
    pivot: modelReceipt.normalized.pivot,
    rotationAxis: modelReceipt.normalized.rotationAxis,
    normals: true,
    watertight: modelReceipt.normalized.watertight,
    lods: modelLods,
  },
  observationMapping: {
    projection: "simple-cylindrical",
    sourceLongitudeDomain: "minus-180-to-plus-180-east",
    sourceLatitudeDomain: "plus-90-to-minus-90",
    runtimePositiveYSpinAxis: true,
    shaderUv: "u=atan(localZ,localX)/(2*pi)+0.5;v=asin(clamp(localY/r,-1,1))/pi+0.5",
    observedPixelFraction: observedFraction,
    unobservedPixelsAreMeasuredDarkTerrain: false,
  },
  assets,
  microtextureReuse: {
    candidate: "v591-readonly-exact-byte-reuse",
    sourceOverlayPath: "public/data/celestial-convergence-v591/bennu-asset-overlay.json",
    sourceOverlaySha256: bennuOverlay.receiptSha256,
    noTextureBytesCopied: true,
    assets: microtextureAssets,
  },
  materialPolicy: {
    observedSurface: "pds-filtered-manually-stretched-grayscale-mosaic",
    unobservedSurface: "poly-haven-cc0-regolith-presentation-substrate-never-observation",
    reflectance: "rough-oren-nayar-plus-bounded-opposition-no-glossy-specular",
    tails: "fixed-seed-presentation-only-dust-anti-solar-ion-velocity",
  },
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredPhotometryClaim: false,
    measuredAuthorityGranted: false,
  },
  blockers: [],
};
const overlay = { ...unsignedOverlay, receiptSha256: canonicalSha(unsignedOverlay) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
const unsignedReceipt = {
  version: "v591-tempel-1-asset-build-receipt-v1",
  generatedAt,
  status: "assets-derived-awaiting-runtime-and-browser-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  modelLodReceiptSha256: modelReceipt.receiptSha256,
  overlayReceiptSha256: overlay.receiptSha256,
  sourceMosaicSha256: source.sha256,
  observedPixelFraction: observedFraction,
  deterministicSingleThreadCompression: true,
  noNetworkRequestsPerformed: true,
  assets: assets.map((asset) => ({ id: asset.id, role: asset.role, variants: Object.values(asset.variants).map(({ url, bytes, sha256: digest }) => ({ url, bytes, sha256: digest })) })),
  authorityState: overlay.authorityState,
};
const receipt = { ...unsignedReceipt, receiptSha256: canonicalSha(unsignedReceipt) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
const generatedSource = readFileSync(generatedConstantsPath, "utf8");
const overlayConstant = `export const CELESTIAL_CONVERGENCE_TEMPEL1_ASSET_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`;
const modelConstant = `export const CELESTIAL_CONVERGENCE_TEMPEL1_MODEL_LOD_RECEIPT_SHA256_V591 = "${modelReceipt.receiptSha256}" as const;`;
let nextGeneratedSource = generatedSource;
for (const constant of [overlayConstant, modelConstant]) {
  const name = constant.split(" = ")[0].replace("export const ", "");
  const pattern = new RegExp(`export const ${name} = "[a-f0-9]{64}" as const;`);
  nextGeneratedSource = pattern.test(nextGeneratedSource)
    ? nextGeneratedSource.replace(pattern, constant)
    : `${nextGeneratedSource.trimEnd()}\n${constant}\n`;
}
if (nextGeneratedSource !== generatedSource) atomicWrite(generatedConstantsPath, Buffer.from(nextGeneratedSource, "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({
  status: receipt.status,
  observedPixelFraction: observedFraction,
  overlayReceiptSha256: overlay.receiptSha256,
  modelLodReceiptSha256: modelReceipt.receiptSha256,
  assets: assets.map((asset) => ({ id: asset.id, desktopBytes: asset.variants.desktopKtx2.bytes, fallbackBytes: asset.variants.desktopFallback.bytes })),
  receiptSha256: receipt.receiptSha256,
}, null, 2));
