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
const nasa3dTiffBlockPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-nasa3d.json");
const nasa3dJpegBlockPath = resolve(root, "docs/release/v591/acquisition-blocked-mars-nasa3d-jpeg.json");
const experimentalCompositeAuditPath = resolve(root, "docs/release/v591/mars-albedo-composite-audit.json");
const v588ManifestPath = resolve(root, "public/data/visual-restoration-v588/manifest.json");
const terrainOverlayPath = resolve(root, "public/data/celestial-convergence-v591/mars-asset-overlay.json");
const resampleAuditPath = resolve(root, "docs/release/v591/mars-albedo-usgs-resample-audit.json");
const compositeRejectionPath = resolve(root, "docs/release/v591/mars-albedo-composite-rejection.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/mars");
const temporaryRoot = resolve(root, "tmp/v591-mars-usgs-albedo");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const DESKTOP_WIDTH = 8192;
const DESKTOP_HEIGHT = 4096;
const MOBILE_WIDTH = 2048;
const MOBILE_HEIGHT = 1024;

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
  assert(canonicalSha(unsigned) === document[field], `v591-mars-usgs-${label}-seal`);
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeSealed(path, unsigned, field) {
  const sealed = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8"));
  return sealed;
}
function runTool(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}
function pearson(left, right) {
  assert(left.length === right.length, "v591-mars-usgs-correlation-length");
  let sumLeft = 0;
  let sumRight = 0;
  let sumLeft2 = 0;
  let sumRight2 = 0;
  let sumProduct = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    sumLeft += a;
    sumRight += b;
    sumLeft2 += a * a;
    sumRight2 += b * b;
    sumProduct += a * b;
  }
  const count = left.length;
  const covariance = sumProduct - sumLeft * sumRight / count;
  const varianceLeft = sumLeft2 - sumLeft * sumLeft / count;
  const varianceRight = sumRight2 - sumRight * sumRight / count;
  return covariance / Math.sqrt(Math.max(1e-12, varianceLeft * varianceRight));
}
async function resizeSeamSafe(input, width, height, output) {
  const { data, info } = await sharp(input, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 1) {
    const first = y * info.width * info.channels;
    const seam = (y * info.width + info.width - 1) * info.channels;
    for (let channel = 0; channel < info.channels; channel += 1) data[seam + channel] = data[first + channel];
  }
  await sharp(data, { raw: info, limitInputPixels: false }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}
function outputRecord(path, url, width, height, format, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "srgb", compression };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
const identityAudit = JSON.parse(readFileSync(identityAuditPath, "utf8"));
const fullSourceBlock = JSON.parse(readFileSync(fullSourceBlockPath, "utf8"));
const nasa3dTiffBlock = JSON.parse(readFileSync(nasa3dTiffBlockPath, "utf8"));
const nasa3dJpegBlock = JSON.parse(readFileSync(nasa3dJpegBlockPath, "utf8"));
const experimentalCompositeAudit = JSON.parse(readFileSync(experimentalCompositeAuditPath, "utf8"));
const v588Manifest = JSON.parse(readFileSync(v588ManifestPath, "utf8"));
const terrainOverlay = JSON.parse(readFileSync(terrainOverlayPath, "utf8"));
for (const [document, field, label] of [
  [acquisition, "receiptSha256", "acquisition"],
  [identityAudit, "receiptSha256", "identity-audit"],
  [fullSourceBlock, "receiptSha256", "full-source-block"],
  [nasa3dTiffBlock, "receiptSha256", "nasa3d-tiff-block"],
  [nasa3dJpegBlock, "receiptSha256", "nasa3d-jpeg-block"],
  [experimentalCompositeAudit, "receiptSha256", "experimental-composite"],
  [v588Manifest, "manifestSha256", "v588-manifest"],
  [terrainOverlay, "receiptSha256", "terrain-overlay"],
]) verifySealed(document, field, label);

assert(acquisition.status === "acquired-single-request-no-retry", "v591-mars-usgs-acquisition-status");
assert(identityAudit.status === "blocked-identity-mismatch", "v591-mars-usgs-identity-negative");
assert(fullSourceBlock.status === "blocked-resource-throughput", "v591-mars-usgs-full-negative");
assert(nasa3dTiffBlock.status === "blocked-no-automatic-retry" && nasa3dJpegBlock.status === "blocked-no-automatic-retry", "v591-mars-usgs-nasa3d-negative");
assert(terrainOverlay.version === "v591-mars-asset-overlay-v1" && terrainOverlay.status === "mars-mola-terrain-derived-albedo-blocked" && terrainOverlay.assets.length === 3, "v591-mars-usgs-terrain-baseline");

const v588Mars = v588Manifest.assets.find((asset) => asset.id === "mars-albedo");
assert(v588Mars?.provenance?.historicalV49IdentityInherited === false, "v591-mars-usgs-v588-identity-gap");
const rejection = writeSealed(compositeRejectionPath, {
  version: "v591-mars-albedo-composite-rejection-v1",
  generatedAt,
  status: "rejected-upstream-license-and-product-identity-gap",
  experimentalCompositeAuditSha256: experimentalCompositeAudit.receiptSha256,
  v588ManifestSha256: v588Manifest.manifestSha256,
  rejectedInput: {
    path: `public/${v588Mars.primary.url.replace(/^\/+/, "")}`,
    sha256: v588Mars.primary.sha256,
    historicalV49IdentityInherited: v588Mars.provenance.historicalV49IdentityInherited,
  },
  reasons: [
    "the historical v49 source product identity is not inherited by v588",
    "the v49 generation path is compatible with the disallowed Solar System Scope CC-BY lane",
    "correlation with a USGS preview cannot establish source identity or relicensing",
  ],
  runtimeAdmission: false,
  scientificPayloadWriteback: false,
}, "receiptSha256");

const source = acquisition.assets.find((asset) => asset.id === "mars-albedo-source-v591");
assert(source?.width === 1024 && source?.height === 512, "v591-mars-usgs-source-dimensions");
assert(source.license?.id === "NASA-USGS-public-domain", "v591-mars-usgs-source-license");
assert(new URL(source.finalUrl).hostname === "astrogeology.usgs.gov", "v591-mars-usgs-source-host");
const sourcePath = resolve(root, source.outputPath);
const sourceBytes = readFileSync(sourcePath);
assert(sourceBytes.byteLength === source.bytes && sha256(sourceBytes) === source.sha256, "v591-mars-usgs-source-drift");

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const desktopPng = resolve(temporaryRoot, "mars-usgs-albedo-8192.png");
const desktopFallbackPng = resolve(temporaryRoot, "mars-usgs-albedo-4096.png");
const mobilePng = resolve(temporaryRoot, "mars-usgs-albedo-2048.png");
const liteDesktopPng = resolve(temporaryRoot, "mars-usgs-albedo-1024.png");
const liteMobilePng = resolve(temporaryRoot, "mars-usgs-albedo-512.png");
await resizeSeamSafe(sourceBytes, DESKTOP_WIDTH, DESKTOP_HEIGHT, desktopPng);
await resizeSeamSafe(sourceBytes, 4096, 2048, desktopFallbackPng);
await resizeSeamSafe(sourceBytes, MOBILE_WIDTH, MOBILE_HEIGHT, mobilePng);
await resizeSeamSafe(sourceBytes, 1024, 512, liteDesktopPng);
await resizeSeamSafe(sourceBytes, 512, 256, liteMobilePng);

const output = {
  desktopKtx2: resolve(outputRoot, "full/desktop/mars-albedo.ktx2"),
  desktopFallback: resolve(outputRoot, "full/desktop/mars-albedo.webp"),
  mobileKtx2: resolve(outputRoot, "full/mobile/mars-albedo.ktx2"),
  mobileFallback: resolve(outputRoot, "full/mobile/mars-albedo.webp"),
  liteDesktop: resolve(outputRoot, "lite/desktop/mars-albedo.webp"),
  liteMobile: resolve(outputRoot, "lite/mobile/mars-albedo.webp"),
};
Object.values(output).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
const ktxArgs = (target, input) => ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "0.75", "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", "srgb", target, input];
for (const [target, input, label] of [[output.desktopKtx2, desktopPng, "desktop"], [output.mobileKtx2, mobilePng, "mobile"]]) {
  const partial = `${target}.${process.pid}.part`;
  runTool(toktx, ktxArgs(partial, input), `v591-mars-usgs-${label}-ktx2`);
  rmSync(target, { force: true });
  renameSync(partial, target);
}
for (const [input, target, quality] of [
  [desktopFallbackPng, output.desktopFallback, 94],
  [mobilePng, output.mobileFallback, 94],
  [liteDesktopPng, output.liteDesktop, 90],
  [liteMobilePng, output.liteMobile, 90],
]) atomicWrite(target, await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer());

const variants = {
  desktopKtx2: outputRecord(output.desktopKtx2, "/textures/candidate-v591/mars/full/desktop/mars-albedo.ktx2", DESKTOP_WIDTH, DESKTOP_HEIGHT, "ktx2", "uastc-q2-rdo-0.75-single-thread-zstd10-mipmapped"),
  desktopFallback: outputRecord(output.desktopFallback, "/textures/candidate-v591/mars/full/desktop/mars-albedo.webp", 4096, 2048, "webp", "webp-quality-94"),
  mobileKtx2: outputRecord(output.mobileKtx2, "/textures/candidate-v591/mars/full/mobile/mars-albedo.ktx2", MOBILE_WIDTH, MOBILE_HEIGHT, "ktx2", "uastc-q2-rdo-0.75-single-thread-zstd10-mipmapped"),
  mobileFallback: outputRecord(output.mobileFallback, "/textures/candidate-v591/mars/full/mobile/mars-albedo.webp", MOBILE_WIDTH, MOBILE_HEIGHT, "webp", "webp-quality-94"),
  liteDesktop: outputRecord(output.liteDesktop, "/textures/candidate-v591/mars/lite/desktop/mars-albedo.webp", 1024, 512, "webp", "webp-quality-90"),
  liteMobile: outputRecord(output.liteMobile, "/textures/candidate-v591/mars/lite/mobile/mars-albedo.webp", 512, 256, "webp", "webp-quality-90"),
};

const sourceAudit = await sharp(sourceBytes, { limitInputPixels: false }).greyscale().raw().toBuffer();
const roundTripAudit = await sharp(desktopPng, { limitInputPixels: false })
  .resize(1024, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .greyscale()
  .raw()
  .toBuffer();
const luminanceCorrelation = pearson(sourceAudit, roundTripAudit);
assert(luminanceCorrelation >= 0.995, "v591-mars-usgs-roundtrip-correlation");
const resampleAudit = writeSealed(resampleAuditPath, {
  version: "v591-mars-albedo-usgs-resample-audit-v1",
  generatedAt,
  status: "passed-public-domain-source-bounded-resample",
  source: {
    path: source.outputPath,
    url: source.sourceUrl,
    finalUrl: source.finalUrl,
    host: "astrogeology.usgs.gov",
    bytes: source.bytes,
    sha256: source.sha256,
    width: source.width,
    height: source.height,
    license: source.license,
    observationIdentity: source.observationIdentity,
  },
  derivation: {
    tool: "sharp+KTX-Software",
    version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
    parameters: {
      resizeKernel: "lanczos3",
      longitudeSeam: "last-column-exact-copy-of-first-column",
      sourceDetailCeiling: "1024x512",
      desktopDeliveryContainer: "8192x4096",
      mobileDeliveryContainer: "2048x1024",
      highFrequencySourceAdded: false,
      generativeOrAiDetail: false,
    },
  },
  roundTrip: { width: 1024, height: 512, luminanceCorrelation, minimum: 0.995 },
  claims: {
    nativeEightKObservation: false,
    sourceDetailCeilingDisclosed: true,
    observationalColorAnchor: true,
    runtimeTopographicDetailFromMolaOnly: true,
    presentationOnly: true,
    scientificPayloadWriteback: false,
  },
  output: variants,
  rejectedCompositeReceiptSha256: rejection.receiptSha256,
}, "receiptSha256");

const albedoAsset = {
  id: "mars-albedo",
  body: "mars",
  role: "usgs-viking-color-bounded-resample",
  variants,
  source: {
    acquisitionReceiptSha256: acquisition.receiptSha256,
    path: source.outputPath,
    url: source.sourceUrl,
    finalUrl: source.finalUrl,
    host: "astrogeology.usgs.gov",
    license: source.license,
    bytes: source.bytes,
    sha256: source.sha256,
    width: source.width,
    height: source.height,
    observationIdentity: source.observationIdentity,
    observationLimit: "USGS color/albedo detail is bounded to 1024x512; MOLA supplies the independently observed topographic detail at runtime.",
  },
  derivation: resampleAudit.derivation,
  resampleAuditReceiptSha256: resampleAudit.receiptSha256,
  fullQualityMinimum: { desktop: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT }, mobile: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT } },
  observationDisclosure: "8K is a delivery container, not native 8K observation detail. Albedo detail ceiling is 1024x512; MOLA normal, height and roughness remain independent observed terrain channels.",
  presentationOnly: true,
};
const overlayUnsigned = {
  ...terrainOverlay,
  version: "v591-mars-asset-overlay-v3",
  status: "mars-usgs-viking-color-mola-terrain-admitted",
  noNetworkRequestsPerformed: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  blockers: [],
  assets: [albedoAsset, ...terrainOverlay.assets],
  albedoResampleAuditReceiptSha256: resampleAudit.receiptSha256,
  compositeRejectionReceiptSha256: rejection.receiptSha256,
  preservedNegativeEvidence: {
    directIdentityAuditReceiptSha256: identityAudit.receiptSha256,
    fullAlbedoBlockedReceiptSha256: fullSourceBlock.receiptSha256,
    nasa3dTiffBlockedReceiptSha256: nasa3dTiffBlock.receiptSha256,
    nasa3dJpegBlockedReceiptSha256: nasa3dJpegBlock.receiptSha256,
    experimentalCompositeAuditReceiptSha256: experimentalCompositeAudit.receiptSha256,
  },
};
delete overlayUnsigned.receiptSha256;
const overlay = { ...overlayUnsigned, receiptSha256: canonicalSha(overlayUnsigned) };
atomicWrite(terrainOverlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));

const overlays = Object.fromEntries([
  ["SUN", "sun"], ["EARTH", "earth"], ["MOON", "moon"], ["MARS", "mars"], ["JUPITER", "jupiter"], ["SATURN", "saturn"],
].map(([constant, body]) => [
  constant,
  JSON.parse(readFileSync(resolve(root, `public/data/celestial-convergence-v591/${body}-asset-overlay.json`), "utf8")),
]));
for (const [name, value] of Object.entries(overlays)) verifySealed(value, "receiptSha256", `${name.toLowerCase()}-overlay`);
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Sun, Earth, Moon, Mars, Jupiter, and Saturn asset overlays.",
  ...Object.entries(overlays).map(([name, value]) => `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = "${value.receiptSha256}" as const;`),
  "",
].join("\n"), "utf8"));

rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({
  status: overlay.status,
  sourceDetailCeiling: "1024x512",
  luminanceCorrelation,
  albedo: Object.fromEntries(Object.entries(variants).map(([name, variant]) => [name, { bytes: variant.bytes, sha256: variant.sha256, width: variant.width, height: variant.height }])),
  resampleAuditReceiptSha256: resampleAudit.receiptSha256,
  compositeRejectionReceiptSha256: rejection.receiptSha256,
  overlayReceiptSha256: overlay.receiptSha256,
}, null, 2));
