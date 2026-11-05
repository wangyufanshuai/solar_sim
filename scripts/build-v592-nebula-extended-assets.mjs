import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const metadataPath = resolve(root, "docs/release/v592/nebula-extended-item-metadata-v592.json");
const acquisitionPath = resolve(root, "docs/release/v592/nebula-extended-visual-acquisition-v592.json");
const outputRoot = resolve(root, "public/textures/candidate-v592/nebulae-extended-v592");
const manifestPath = resolve(root, "public/data/living-universe-v592/nebula-extended-visual-assets.json");
const receiptPath = resolve(root, "docs/release/v592/nebula-extended-visual-assets-receipt-v592.json");
const generatedPath = resolve(root, "app/data/nebulaExtendedVisualAssetsV592.generated.ts");
const tempRoot = resolve(root, "tmp/v592-nebula-extended-assets");
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
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
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function sealed(path, unsigned, field = "manifestSha256") {
  const document = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(document, null, 2)}\n`, "utf8"));
  return document;
}
function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}
function runtimeUrl(path) { return `/${path.slice(resolve(root, "public").length + 1).replaceAll("\\", "/")}`; }
function fileRecord(path, width, height, format, compression, role, depthIndex) {
  const bytes = readFileSync(path);
  return { url: runtimeUrl(path), bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "srgb", compression, role, depthIndex };
}
async function rasterize(sourcePath, crop, width, height, depthIndex, depthCount, outputPath) {
  const { data, info } = await sharp(sourcePath, { limitInputPixels: false }).extract(crop).resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 }).removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(width * height * 4);
  const low = depthCount === 4 ? [2, 12, 32, 72][depthIndex] : depthCount === 2 ? [2, 34][depthIndex] : 4;
  const high = depthCount === 4 ? [84, 150, 218, 255][depthIndex] : depthCount === 2 ? [132, 235][depthIndex] : 176;
  const opacity = depthCount === 4 ? [0.28, 0.38, 0.5, 0.64][depthIndex] : depthCount === 2 ? [0.48, 0.68][depthIndex] : 0.82;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const si = (y * info.width + x) * info.channels;
    const ti = (y * width + x) * 4;
    const r = data[si] ?? 0; const g = data[si + 1] ?? 0; const b = data[si + 2] ?? 0;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const edge = Math.min(x / width, 1 - x / width, y / height, 1 - y / height);
    const edgeFade = Math.max(0, Math.min(1, edge / 0.08));
    const t = Math.max(0, Math.min(1, (luma - low) / Math.max(1, high - low)));
    const smooth = t * t * (3 - 2 * t);
    out[ti] = r; out[ti + 1] = g; out[ti + 2] = b; out[ti + 3] = Math.round(Math.max(0, Math.min(255, smooth * opacity * edgeFade * 255)));
  }
  await sharp(out, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(outputPath);
}
async function webp(input, output, quality) { atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: true }).toBuffer()); }
function ktx(input, output, label) {
  const partial = `${output}.${process.pid}.part`;
  run(toktx, ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "1.0", "--uastc_rdo_m", "--threads", "1", "--zcmp", "10", "--genmipmap", "--assign_oetf", "srgb", "--assign_primaries", "srgb", partial, input], label);
  rmSync(output, { force: true }); renameSync(partial, output);
}

assert(existsSync(toktx), "v592-nebula-extended-toktx-missing");
const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
const targets = metadata.targets.filter((entry) => entry.status === "metadata-candidate-clean-frame-review-required");
assert(metadata.receiptSha256 && acquisition.receiptSha256 && targets.length === 5, "v592-nebula-extended-inputs");
assert(acquisition.status === "five-presentation-images-acquired-single-request-each", "v592-nebula-extended-acquisition-status");
rmSync(outputRoot, { recursive: true, force: true }); rmSync(tempRoot, { recursive: true, force: true }); mkdirSync(tempRoot, { recursive: true });

const coordinateMap = {
  "jellyfish-nebula": { catalogName: "IC 443", raDeg: 94.263, decDeg: 6.08, angularSizeDeg: 0.833333, lDeg: 189.1, bDeg: 3.0, distancePc: 490 },
  "cocoon-nebula": { catalogName: "IC 5146", raDeg: 325.473, decDeg: 47.27, angularSizeDeg: 0.2, lDeg: 94.4, bDeg: -5.5, distancePc: 800 },
  "rho-ophiuchi-cloud": { catalogName: "Rho Ophiuchi", raDeg: 246.75, decDeg: -24.5, angularSizeDeg: 1.0, lDeg: 353.0, bDeg: 17.0, distancePc: 131 },
  "cepheus-c-nebula": { catalogName: "Cepheus C", raDeg: 344.47, decDeg: 62.55, angularSizeDeg: 0.5, lDeg: 110.0, bDeg: 2.0, distancePc: 1000 },
  "dragon-lair-nebula": { catalogName: "M17 / NGC 6618", raDeg: 275.195, decDeg: -16.171, angularSizeDeg: 0.766667, lDeg: 15.0, bDeg: -0.7, distancePc: 1600 },
};
const assets = [];
for (const target of targets) {
  const source = acquisition.assets.find((entry) => entry.target === target.target);
  const coords = coordinateMap[target.target];
  assert(source && coords, `v592-nebula-extended-source:${target.target}`);
  const sourcePath = resolve(root, source.outputPath);
  const aspect = source.width / source.height;
  const tiers = {};
  for (const [tier, maxSize, depthCount] of [["desktop", 2048, 4], ["mobile", 1024, 2], ["lite", 512, 1]]) {
    const width = aspect >= 1 ? maxSize : Math.max(4, Math.round(maxSize * aspect / 4) * 4);
    const height = aspect >= 1 ? Math.max(4, Math.round(maxSize / aspect / 4) * 4) : maxSize;
    const slices = [];
    for (let depthIndex = 0; depthIndex < depthCount; depthIndex += 1) {
      const png = resolve(tempRoot, `${target.target}-${tier}-${depthIndex}.png`);
      await rasterize(sourcePath, { left: 0, top: 0, width: source.width, height: source.height }, width, height, depthIndex, depthCount, png);
      if (tier === "lite") {
        const out = resolve(outputRoot, "lite", "shared", `${target.target}-depth-${depthIndex}.webp`); mkdirSync(dirname(out), { recursive: true }); await webp(png, out, 78);
        const record = fileRecord(out, width, height, "webp", "webp-q78-shared", "lite-shared", depthIndex);
        slices.push({ depthIndex, desktopFallback: record, mobileFallback: record });
      } else {
        const ktxPath = resolve(outputRoot, "full", tier, `${target.target}-depth-${depthIndex}.ktx2`);
        const webpPath = resolve(outputRoot, "full", tier, `${target.target}-depth-${depthIndex}.webp`);
        mkdirSync(dirname(ktxPath), { recursive: true }); ktx(png, ktxPath, `v592-nebula-extended-${target.target}-${tier}-${depthIndex}`); await webp(png, webpPath, tier === "desktop" ? 88 : 82);
        slices.push({ depthIndex, ktx2: fileRecord(ktxPath, width, height, "ktx2", "uastc-rdo-zstd10-mipmap-srgb", `${tier}-ktx2`, depthIndex), fallback: fileRecord(webpPath, width, height, "webp", tier === "desktop" ? "webp-q88" : "webp-q82", `${tier}-fallback`, depthIndex) });
      }
    }
    tiers[tier] = { width, height, aspect: width / height, depthSliceCount: depthCount, slices };
  }
  assets.push({
    target: target.target, nasaId: target.nasaId, catalogName: coords.catalogName,
    source: { url: source.sourceUrl, path: source.outputPath, bytes: source.bytes, sha256: source.sha256, width: source.width, height: source.height, colorSpace: "srgb", license: "NASA-media-guidelines-public-use-candidate-item-credit", licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/", credit: source.target === "dragon-lair-nebula" ? "NASA/JPL-Caltech/Penn State/DSS" : target.identity.credit, acquisitionReceiptSha256: acquisition.receiptSha256, metadataReceiptSha256: metadata.receiptSha256 },
    coordinates: { coordinateFrame: "ICRS/J2000", raDeg: coords.raDeg, decDeg: coords.decDeg, angularSizeDeg: coords.angularSizeDeg, galacticCatalogReference: { lDeg: coords.lDeg, bDeg: coords.bDeg, distancePc: coords.distancePc } },
    observationEncoding: { bands: ["infrared"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-coordinate-angular-extent-and-band-only", cinematicModePolicy: "presentation-only-observation-image-with-band-label" },
    derivation: { tool: `sharp-${sharp.versions.sharp}+KTX-Software-4.4.2`, parameters: { alphaPolicy: "luma-thresholded-presentation-mask-with-edge-feather", depthSlicePolicy: "4-desktop-2-mobile-1-lite", inpainting: false, syntheticCoverageFill: false, scientificDataClaim: false } },
    tiers, presentationOnly: true, scientificAuthority: false, scientificPayloadWriteback: false,
  });
}
const unsignedManifest = { version: "v592-nebula-extended-visual-assets-v1", generatedAt: "2026-08-20T00:00:00Z", status: "five-extended-presentation-assets-candidate", policy: { sourceCount: 5, runtimeAssetAdmittedCount: assets.length, proceduralFallbackAllowed: false, scienceImagePayloadAllowed: false, presentationOnly: true, fixedJ2000Direction: true, noInpainting: true, noSyntheticCoverageFill: true, visualSignoff: "pending" }, sourceReceipts: { metadataReceiptSha256: metadata.receiptSha256, acquisitionReceiptSha256: acquisition.receiptSha256 }, admission: { metadataCandidateCount: targets.length, runtimeAssetAdmittedCount: assets.length, visualSignoffGranted: false, admittedTargets: assets.map((asset) => asset.target) }, assets };
const manifest = sealed(manifestPath, unsignedManifest);
const generated = ["// Generated by scripts/build-v592-nebula-extended-assets.mjs. Do not edit.", `export const NEBULA_EXTENDED_VISUAL_MANIFEST_SHA256_V592 = ${JSON.stringify(manifest.manifestSha256)} as const;`, `export const NEBULA_EXTENDED_VISUAL_ASSETS_V592 = Object.freeze(${JSON.stringify(assets, null, 2)} as const);`, ""].join("\n");
atomicWrite(generatedPath, Buffer.from(generated, "utf8"));
const fullRuntimeBytes = assets.reduce((sum, asset) => sum + ["desktop", "mobile"].reduce((s, tier) => s + asset.tiers[tier].slices.reduce((z, slice) => z + slice.ktx2.bytes + slice.fallback.bytes, 0), 0), 0);
const liteIncrementBytes = assets.reduce((sum, asset) => sum + asset.tiers.lite.slices[0].desktopFallback.bytes, 0);
const receipt = sealed(receiptPath, { version: "v592-nebula-extended-visual-assets-receipt-v1", generatedAt: "2026-08-20T00:00:00Z", status: "five-extended-presentation-assets-built-signoff-pending", manifestSha256: manifest.manifestSha256, generatedModuleSha256: sha256(Buffer.from(generated, "utf8")), admittedTargets: assets.map((asset) => asset.target), fullRuntimeBytes, liteIncrementBytes, visualSignoffGranted: false, scientificPayloadWriteback: false });
rmSync(tempRoot, { recursive: true, force: true });
console.log(JSON.stringify({ status: receipt.status, admittedTargets: receipt.admittedTargets, fullRuntimeBytes, liteIncrementBytes, manifestSha256: manifest.manifestSha256, receiptSha256: receipt.receiptSha256 }, null, 2));
