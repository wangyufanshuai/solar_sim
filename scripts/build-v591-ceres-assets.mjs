import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-15T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-asset-ceres-pds-radius-albedo.json");
const modelReceiptPath = resolve(root, "docs/release/v591/ceres-model-lod-receipt-v591.json");
const bennuOverlayPath = resolve(root, "public/data/celestial-convergence-v591/bennu-asset-overlay.json");
const albedoPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/ceres_albedo_c.cub");
const albedoLabelPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/albedo.xml");
const radiusPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/ceres_radius_g.tif");
const radiusLabelPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/radius.xml");
const outputRoot = resolve(root, "public/textures/candidate-v591/ceres");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/ceres-asset-overlay.json");
const receiptPath = resolve(root, "docs/release/v591/ceres-asset-build-receipt-v591.json");
const derivationReceiptPath = resolve(root, "docs/release/v591/ceres-texture-derivation-receipt-v591.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const qaRoot = resolve(root, "docs/release/v591/screenshots");
const temporaryRoot = resolve(root, "tmp/v591-ceres-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const NATIVE = Object.freeze({ width: 2222, height: 1111 });
const DESKTOP = Object.freeze({ width: 4096, height: 2048 });
const MOBILE = Object.freeze({ width: 2048, height: 1024 });
const LITE_DESKTOP = Object.freeze({ width: 1024, height: 512 });
const LITE_MOBILE = Object.freeze({ width: 512, height: 256 });
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function verifySealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-ceres-assets-seal:${path}`); return value; }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.${process.pid}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function runTool(executable, args, label) { const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 }); assert(result.status === 0, `${label}:${result.status}:${result.stderr || result.stdout}`); }
function outputRecord(path, url, width, height, format, colorSpace, compression) { const bytes = readFileSync(path); return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression }; }

async function encodeAsset({ id, role, nativePng, colorSpace, rdoLambda, losslessFallback }) {
  const paths = {
    desktopKtx2: resolve(outputRoot, `full/desktop/${id}.ktx2`), desktopFallback: resolve(outputRoot, `full/desktop/${id}.webp`),
    mobileKtx2: resolve(outputRoot, `full/mobile/${id}.ktx2`), mobileFallback: resolve(outputRoot, `full/mobile/${id}.webp`),
    liteDesktop: resolve(outputRoot, `lite/desktop/${id}.webp`), liteMobile: resolve(outputRoot, `lite/mobile/${id}.webp`),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const desktopPng = resolve(temporaryRoot, `${id}-desktop.png`);
  const mobilePng = resolve(temporaryRoot, `${id}-mobile.png`);
  const liteDesktopPng = resolve(temporaryRoot, `${id}-lite-desktop.png`);
  const liteMobilePng = resolve(temporaryRoot, `${id}-lite-mobile.png`);
  for (const [width, height, target] of [[DESKTOP.width, DESKTOP.height, desktopPng], [MOBILE.width, MOBILE.height, mobilePng], [LITE_DESKTOP.width, LITE_DESKTOP.height, liteDesktopPng], [LITE_MOBILE.width, LITE_MOBILE.height, liteMobilePng]]) {
    await sharp(nativePng, { limitInputPixels: false }).resize(width, height, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(target);
  }
  const ktxArgs = (output, input) => ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", String(rdoLambda), "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", colorSpace, "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none", output, input];
  for (const [target, input, suffix] of [[paths.desktopKtx2, desktopPng, "desktop"], [paths.mobileKtx2, mobilePng, "mobile"]]) {
    const partial = `${target}.${process.pid}.part`;
    rmSync(partial, { force: true });
    runTool(toktx, ktxArgs(partial, input), `v591-ceres-${id}-${suffix}-ktx2`);
    rmSync(target, { force: true });
    renameSync(partial, target);
  }
  const fullWebp = async (input, output, quality) => atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp(losslessFallback ? { lossless: true, effort: 6 } : { quality, effort: 6, smartSubsample: true }).toBuffer());
  const liteWebp = async (input, output, quality) => atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: !losslessFallback }).toBuffer());
  await fullWebp(desktopPng, paths.desktopFallback, 94);
  await fullWebp(mobilePng, paths.mobileFallback, 92);
  await liteWebp(liteDesktopPng, paths.liteDesktop, losslessFallback ? 90 : 88);
  await liteWebp(liteMobilePng, paths.liteMobile, losslessFallback ? 90 : 86);
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id, body: "ceres", role,
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/ceres/full/desktop/${id}.ktx2`, DESKTOP.width, DESKTOP.height, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/ceres/full/desktop/${id}.webp`, DESKTOP.width, DESKTOP.height, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-94"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/ceres/full/mobile/${id}.ktx2`, MOBILE.width, MOBILE.height, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/ceres/full/mobile/${id}.webp`, MOBILE.width, MOBILE.height, "webp", colorSpace, losslessFallback ? "webp-lossless" : "webp-quality-92"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/ceres/lite/desktop/${id}.webp`, LITE_DESKTOP.width, LITE_DESKTOP.height, "webp", colorSpace, losslessFallback ? "webp-quality-90-linear-lite" : "webp-quality-88"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/ceres/lite/mobile/${id}.webp`, LITE_MOBILE.width, LITE_MOBILE.height, "webp", colorSpace, losslessFallback ? "webp-quality-90-linear-lite" : "webp-quality-86"),
    },
  };
}

const acquisition = verifySealed(acquisitionPath);
const modelReceipt = verifySealed(modelReceiptPath);
const bennuOverlay = verifySealed(bennuOverlayPath);
assert(acquisition.status === "four-assets-committed-single-request-each-no-retry" && acquisition.automaticRetryPerformed === false && acquisition.automaticReplacementPerformed === false, "v591-ceres-assets-acquisition");
assert(modelReceipt.status === "ceres-three-lod-radius-derived-model-ready-for-runtime-admission" && modelReceipt.acquisitionReceiptSha256 === acquisition.receiptSha256, "v591-ceres-assets-model-chain");
assert(bennuOverlay.version === "v591-bennu-asset-overlay-v1" && bennuOverlay.assets?.length === 3 && bennuOverlay.proceduralFallback === false, "v591-ceres-assets-cc0-chain");
rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
mkdirSync(qaRoot, { recursive: true });
runTool("python", ["scripts/prepare-v591-ceres-textures.py", "--albedo", albedoPath, "--albedo-label", albedoLabelPath, "--radius", radiusPath, "--radius-label", radiusLabelPath, "--output", temporaryRoot, "--receipt", derivationReceiptPath], "v591-ceres-texture-derivation");
const derivation = verifySealed(derivationReceiptPath);
assert(derivation.outputs?.length === 4 && derivation.outputs.every((output) => output.width === NATIVE.width && output.height === NATIVE.height), "v591-ceres-assets-derived-layout");
assert(derivation.derivation.syntheticDetailAdded === false && derivation.authorityState.scientificPayloadWriteback === false, "v591-ceres-assets-derivation-authority");
const nativePath = (id) => resolve(temporaryRoot, `${id}.png`);
const encoded = [
  await encodeAsset({ id: "ceres-albedo", role: "pds-dawn-spc-global-relative-albedo", nativePng: nativePath("ceres-albedo"), colorSpace: "srgb", rdoLambda: 0.72, losslessFallback: false }),
  await encodeAsset({ id: "ceres-normal", role: "pds-global-radius-derived-tangent-normal", nativePng: nativePath("ceres-normal"), colorSpace: "linear", rdoLambda: 0.52, losslessFallback: true }),
  await encodeAsset({ id: "ceres-roughness", role: "pds-radius-slope-derived-bounded-roughness", nativePng: nativePath("ceres-roughness"), colorSpace: "linear", rdoLambda: 0.68, losslessFallback: true }),
  await encodeAsset({ id: "ceres-height", role: "pds-global-radius-normalized-presentation-height", nativePng: nativePath("ceres-height"), colorSpace: "linear", rdoLambda: 0.58, losslessFallback: true }),
];
await sharp(nativePath("ceres-albedo"), { limitInputPixels: false }).resize(2048, 1024, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(resolve(qaRoot, "ceres-pds-relative-albedo-v591.png"));
await sharp(nativePath("ceres-height"), { limitInputPixels: false }).resize(2048, 1024, { kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9 }).toFile(resolve(qaRoot, "ceres-pds-radius-height-v591.png"));
const albedoSource = acquisition.assets.find((asset) => asset.id === "ceres-albedo-data");
const radiusSource = acquisition.assets.find((asset) => asset.id === "ceres-radius-data");
assert(albedoSource && radiusSource, "v591-ceres-assets-source-records");
const assets = encoded.map((asset) => {
  const source = asset.id === "ceres-albedo" ? albedoSource : radiusSource;
  return {
    ...asset,
    source: { acquisitionReceiptSha256: source.acquisitionReceiptSha256, productId: source.productId, path: source.outputPath, bytes: source.bytes, sha256: source.sha256, md5: source.md5, width: NATIVE.width, height: NATIVE.height, sourceUrl: source.sourceUrl, license: source.license, observationIdentity: asset.id === "ceres-albedo" ? "Dawn SPC global relative albedo" : "Dawn SPC global radius from body center", observationLimit: asset.id === "ceres-albedo" ? "Neutral presentation color transfer is not measured optical color; source detail ceiling remains 2222x1111." : "Derived presentation channel from the PDS radius field; no synthetic terrain detail is added." },
    derivation: { receiptSha256: derivation.receiptSha256, tool: derivation.derivation.tool, parameters: derivation.derivation.parameters, sourceDetailCeiling: "2222x1111", deliveryUpscaleAddsObservationDetail: false, syntheticDetailAdded: false },
    fullQualityMinimum: { desktop: DESKTOP, mobile: MOBILE },
    presentationOnly: true,
  };
});
const microtextureAssets = bennuOverlay.assets.map((asset) => ({ id: `ceres-${asset.id.replace("bennu-", "")}`, inheritedAssetId: asset.id, body: "ceres", sourceSha256: asset.source.sha256, sourceOverlaySha256: bennuOverlay.receiptSha256, variants: asset.variants, exactByteReuse: true, presentationOnly: true, observationLimit: "Poly Haven CC0 regolith supplies bounded microstructure only; it is not Ceres observation data." }));
const unsignedOverlay = {
  version: "v591-ceres-asset-overlay-v1", generatedAt, status: "ceres-assets-derived-awaiting-runtime-admission", body: "ceres",
  metadataReceiptSha256: acquisition.metadataReceiptSha256, acquisitionReceiptSha256: acquisition.receiptSha256, modelLodReceiptSha256: modelReceipt.receiptSha256,
  shapeBlockedReceiptSha256: acquisition.shapeBlockedReceiptSha256, centralMirrorBlockedReceiptSha256: acquisition.centralMirrorBlockedReceiptSha256,
  noNetworkRequestsPerformedDuringDerivation: true, noTextureBytesCopiedForCc0Reuse: true, derivationDeterministic: true, proceduralFallback: false,
  model: { candidate: "v591-owned", sourcePath: modelReceipt.source.path, sourceSha256: modelReceipt.source.sha256, sourceUrl: radiusSource.sourceUrl, sourceProductId: radiusSource.productId, sourceDetailCeiling: modelReceipt.sourceDetailCeiling, license: radiusSource.license, units: modelReceipt.normalized.units, sourceUnits: modelReceipt.normalized.sourceUnits, pivot: modelReceipt.normalized.pivot, rotationAxis: modelReceipt.normalized.rotationAxis, normals: true, watertight: modelReceipt.normalized.watertight, lods: modelReceipt.lods },
  assets,
  microtextureReuse: { candidate: "v591-readonly-exact-byte-reuse", sourceOverlayPath: "public/data/celestial-convergence-v591/bennu-asset-overlay.json", sourceOverlaySha256: bennuOverlay.receiptSha256, noTextureBytesCopied: true, assets: microtextureAssets },
  materialPolicy: { macroSurface: "pds-dawn-spc-relative-albedo-and-global-radius", microSurface: "poly-haven-cc0-regolith-presentation-only-not-ceres-observation", reflectance: "rough-oren-nayar-plus-bounded-opposition-no-glossy-specular", opticalColorClaim: false, syntheticDetailAdded: false },
  authorityState: { presentationOnly: true, scientificAuthorityChanged: false, scientificPayloadWriteback: false, measuredPhotometryClaim: false, measuredAuthorityGranted: false },
  blockers: [],
};
const overlay = { ...unsignedOverlay, receiptSha256: canonicalSha(unsignedOverlay) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));
const unsignedReceipt = { version: "v591-ceres-asset-build-receipt-v1", generatedAt, status: "assets-derived-awaiting-runtime-and-browser-admission", metadataReceiptSha256: acquisition.metadataReceiptSha256, acquisitionReceiptSha256: acquisition.receiptSha256, modelLodReceiptSha256: modelReceipt.receiptSha256, derivationReceiptSha256: derivation.receiptSha256, overlayReceiptSha256: overlay.receiptSha256, deterministicSingleThreadCompression: true, noNetworkRequestsPerformed: true, assets: assets.map((asset) => ({ id: asset.id, role: asset.role, variants: Object.values(asset.variants).map(({ url, bytes, sha256: digest }) => ({ url, bytes, sha256: digest })) })), authorityState: overlay.authorityState };
const receipt = { ...unsignedReceipt, receiptSha256: canonicalSha(unsignedReceipt) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));
let generated = readFileSync(generatedConstantsPath, "utf8");
const constants = [
  `export const CELESTIAL_CONVERGENCE_CERES_ASSET_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_CERES_MODEL_LOD_RECEIPT_SHA256_V591 = "${modelReceipt.receiptSha256}" as const;`,
];
for (const constant of constants) {
  const name = constant.split(" = ")[0].replace("export const ", "");
  const pattern = new RegExp(`export const ${name} = "[a-f0-9]{64}" as const;`);
  generated = pattern.test(generated) ? generated.replace(pattern, constant) : `${generated.trimEnd()}\n${constant}\n`;
}
atomicWrite(generatedConstantsPath, Buffer.from(generated, "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: receipt.status, overlayReceiptSha256: overlay.receiptSha256, modelLodReceiptSha256: modelReceipt.receiptSha256, assets: assets.map((asset) => ({ id: asset.id, desktopKtx2Bytes: asset.variants.desktopKtx2.bytes, desktopFallbackBytes: asset.variants.desktopFallback.bytes })), receiptSha256: receipt.receiptSha256 }, null, 2));
