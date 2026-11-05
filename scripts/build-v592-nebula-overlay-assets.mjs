import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

// Additive v592 overlay builder.  The inherited six nebula assets keep their
// sealed manifest; this script owns only the new presentation namespace.
const root = process.cwd();
const toktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const temporaryRoot = resolve(root, "tmp/v592-nebula-overlay-assets");
const publicRoot = resolve(root, "public");

const SOURCES = Object.freeze({
  extended: Object.freeze({
    metadata: "docs/release/v592/nebula-extended-item-metadata-v592.json",
    acquisition: "docs/release/v592/nebula-extended-visual-acquisition-v592.json",
    outputRoot: "public/textures/candidate-v592/nebulae-extended-v592",
    manifest: "public/data/living-universe-v592/nebula-extended-visual-assets.json",
    receipt: "docs/release/v592/nebula-extended-visual-assets-receipt-v592.json",
    generated: "app/data/nebulaExtendedVisualAssetsV592.generated.ts",
    targets: ["jellyfish-nebula", "cocoon-nebula", "rho-ophiuchi-cloud", "cepheus-c-nebula", "dragon-lair-nebula"],
  }),
  closure: Object.freeze({
    metadata: "docs/release/v592/nebula-final-item-metadata-v592.json",
    acquisition: "docs/release/v592/nebula-final-visual-acquisition-v592.json",
    outputRoot: "public/textures/candidate-v592/nebulae-closure-v592",
    manifest: "public/data/living-universe-v592/nebula-closure-visual-assets.json",
    receipt: "docs/release/v592/nebula-closure-visual-assets-receipt-v592.json",
    generated: "app/data/nebulaClosureVisualAssetsV592.generated.ts",
    targets: ["monkey-head-nebula", "w40-nebula", "sh2-235-nebula", "flaming-star-nebula", "spider-nebula", "tarantula-nebula", "tadpole-nebula"],
  }),
});

const EXTRA_ACQUISITIONS = [
  "docs/release/v592/nebula-closure-visual-acquisition-v592.json",
  "docs/release/v592/nebula-closure2-visual-acquisition-v592.json",
];
const EXTRA_METADATA = [
  "docs/release/v592/nebula-closure-item-metadata-v592.json",
  "docs/release/v592/nebula-closure2-item-metadata-v592.json",
];

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
function sealed(path, unsigned, field) {
  const document = { ...unsigned, [field]: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(document, null, 2)}\n`, "utf8"));
  return document;
}
function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${label}:${result.status ?? "signal"}:${result.stderr || result.stdout}`);
}
function runtimeUrl(path) {
  return `/${path.slice(publicRoot.length + 1).replaceAll("\\", "/")}`;
}
function record(path, width, height, format, compression, role, depthIndex) {
  const bytes = readFileSync(path);
  return { url: runtimeUrl(path), bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace: "srgb", compression, role, depthIndex };
}
function blockAligned(value) { return Math.max(4, Math.round(value / 4) * 4); }
function dimensions(width, height, longSide, align = true) {
  const aspect = width / height;
  const round = align ? blockAligned : (value) => Math.max(1, Math.round(value));
  return aspect >= 1
    ? [longSide, round(longSide / aspect)]
    : [round(longSide * aspect), longSide];
}
function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(1e-9, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
async function rasterize(sourcePath, width, height, profile, depthIndex, outputPath) {
  const { data, info } = await sharp(sourcePath, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(width * height * 4);
  const [low, high] = profile.thresholds[depthIndex];
  const opacity = profile.opacities[depthIndex];
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const si = (y * info.width + x) * info.channels;
    const ti = (y * width + x) * 4;
    const red = data[si] ?? 0;
    const green = data[si + 1] ?? 0;
    const blue = data[si + 2] ?? 0;
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const edgeDistance = Math.min((x + 0.5) / width, 1 - (x + 0.5) / width, (y + 0.5) / height, 1 - (y + 0.5) / height);
    const edge = smoothstep(0, 0.065, edgeDistance);
    const alpha = Math.round(Math.max(0, Math.min(255, smoothstep(low, high, luma) * opacity * edge * 255)));
    output[ti] = red; output[ti + 1] = green; output[ti + 2] = blue; output[ti + 3] = alpha;
  }
  await sharp(output, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(outputPath);
}
function encodeKtx(input, output, label, encoding) {
  const partial = `${output}.${process.pid}.part`;
  const codec = encoding === "uastc"
    ? ["--encode", "uastc", "--uastc_quality", "1", "--uastc_rdo_l", "2.0", "--uastc_rdo_m", "--zcmp", "10"]
    : ["--encode", "etc1s", "--clevel", "5", "--qlevel", "128"];
  run(toktx, ["--t2", ...codec, "--threads", "1", "--genmipmap", "--assign_oetf", "srgb", "--assign_primaries", "srgb", partial, input], label);
  rmSync(output, { force: true });
  renameSync(partial, output);
}
async function encodeWebp(input, output, quality) {
  atomicWrite(output, await sharp(input, { limitInputPixels: false }).webp({ quality, effort: 6, smartSubsample: true, alphaQuality: 100 }).toBuffer());
}

const TARGETS = Object.freeze({
  "jellyfish-nebula": { namespace: "extended", catalogName: "IC 443", raDeg: 94.263, decDeg: 6.08, angularSizeDeg: 0.833333, galactic: { lDeg: 189.1, bDeg: 3, distancePc: 490 } },
  "cocoon-nebula": { namespace: "extended", catalogName: "IC 5146", raDeg: 325.473, decDeg: 47.27, angularSizeDeg: 0.2, galactic: { lDeg: 94.4, bDeg: -5.5, distancePc: 800 } },
  "rho-ophiuchi-cloud": { namespace: "extended", catalogName: "Rho Ophiuchi", raDeg: 246.75, decDeg: -24.5, angularSizeDeg: 1, galactic: { lDeg: 353, bDeg: 17, distancePc: 131 } },
  "cepheus-c-nebula": { namespace: "extended", catalogName: "Cepheus C", raDeg: 344.47, decDeg: 62.55, angularSizeDeg: 0.5, galactic: { lDeg: 110, bDeg: 2, distancePc: 1000 } },
  "dragon-lair-nebula": { namespace: "extended", catalogName: "M17 / NGC 6618", raDeg: 275.195, decDeg: -16.171, angularSizeDeg: 0.766667, galactic: { lDeg: 15, bDeg: -0.7, distancePc: 1600 } },
  "monkey-head-nebula": { namespace: "closure", catalogName: "NGC 2174", raDeg: 88.75, decDeg: 20.27, angularSizeDeg: 0.666667, galactic: { lDeg: 192.1, bDeg: -0.4, distancePc: 2100 } },
  "w40-nebula": { namespace: "closure", catalogName: "W40", raDeg: 277.8, decDeg: -2.07, angularSizeDeg: 0.833333, galactic: { lDeg: 29.9, bDeg: -0.9, distancePc: 430 } },
  "sh2-235-nebula": { namespace: "closure", catalogName: "Sh2-235", raDeg: 86.6, decDeg: 35.8, angularSizeDeg: 1, galactic: { lDeg: 173.6, bDeg: 2.8, distancePc: 1800 } },
  "flaming-star-nebula": { namespace: "closure", catalogName: "IC 405", raDeg: 80.45, decDeg: 34.27, angularSizeDeg: 1, galactic: { lDeg: 172.1, bDeg: -2.3, distancePc: 450 } },
  "spider-nebula": { namespace: "closure", catalogName: "IC 417", raDeg: 82, decDeg: 34.4, angularSizeDeg: 1, galactic: { lDeg: 173.7, bDeg: -0.3, distancePc: 2300 } },
  "tarantula-nebula": { namespace: "closure", sourceTarget: "tarantula-nebula-closure", catalogName: "NGC 2070", raDeg: 84.675, decDeg: -69.1, angularSizeDeg: 0.666667, galactic: { lDeg: 279.5, bDeg: -31.7, distancePc: 50000 } },
  "tadpole-nebula": { namespace: "closure", catalogName: "IC 410", raDeg: 80.7, decDeg: 33.5, angularSizeDeg: 0.833333, galactic: { lDeg: 173.6, bDeg: -1.7, distancePc: 3700 } },
});

const PROFILE = Object.freeze({
  desktop: Object.freeze({ longSides: [1024, 512, 256, 128], thresholds: [[2, 18], [18, 96], [56, 180], [96, 230]], opacities: [0.72, 0.46, 0.3, 0.18] }),
  mobile: Object.freeze({ longSides: [1024, 512], thresholds: [[2, 18], [18, 96]], opacities: [0.72, 0.46] }),
  lite: Object.freeze({ longSides: [96], thresholds: [[2, 18]], opacities: [0.72] }),
});

function loadJson(path) { return JSON.parse(readFileSync(resolve(root, path), "utf8")); }
const acquisitionDocs = Object.values(SOURCES).map((source) => loadJson(source.acquisition));
for (const path of EXTRA_ACQUISITIONS) acquisitionDocs.push(loadJson(path));
const metadataDocs = Object.values(SOURCES).map((source) => loadJson(source.metadata));
for (const path of EXTRA_METADATA) metadataDocs.push(loadJson(path));
const acquisitionAssets = acquisitionDocs.flatMap((doc) => doc.assets ?? []);
const metadataTargets = metadataDocs.flatMap((doc) => doc.targets ?? []);
const allTargetIds = [...SOURCES.extended.targets, ...SOURCES.closure.targets];
assert(existsSync(toktx), "v592-nebula-overlay-toktx-missing");
assert(new Set(allTargetIds).size === 12, "v592-nebula-overlay-target-cardinality");
rmSync(temporaryRoot, { recursive: true, force: true });
for (const config of Object.values(SOURCES)) rmSync(resolve(root, config.outputRoot), { recursive: true, force: true });

function findSource(targetId) {
  const sourceTarget = TARGETS[targetId].sourceTarget ?? targetId;
  const source = acquisitionAssets.find((candidate) => candidate.target === sourceTarget);
  const metadata = metadataTargets.find((candidate) => candidate.target === sourceTarget);
  assert(source && metadata, `v592-nebula-overlay-source:${targetId}`);
  assert(source.requestCount === 1 && source.automaticRetryPerformed === false, `v592-nebula-overlay-request-policy:${targetId}`);
  assert(source.presentationOnly === true && source.scienceLoadsImagePayload === false, `v592-nebula-overlay-science-policy:${targetId}`);
  assert(metadata.status === "metadata-candidate-clean-frame-review-required", `v592-nebula-overlay-metadata-status:${targetId}`);
  const sourcePath = resolve(root, source.outputPath);
  const sourceBytes = readFileSync(sourcePath);
  assert(sourceBytes.byteLength === source.bytes && sha256(sourceBytes) === source.sha256, `v592-nebula-overlay-source-drift:${targetId}`);
  return { source, metadata, sourcePath };
}

async function buildAsset(targetId) {
  const spec = TARGETS[targetId];
  const { source, metadata, sourcePath } = findSource(targetId);
  const outputRoot = resolve(root, SOURCES[spec.namespace].outputRoot);
  const variants = {};
  mkdirSync(temporaryRoot, { recursive: true });
  const desktopRecords = [];
  for (let depthIndex = 0; depthIndex < PROFILE.desktop.longSides.length; depthIndex += 1) {
    const [width, height] = dimensions(source.width, source.height, PROFILE.desktop.longSides[depthIndex], true);
    const png = resolve(temporaryRoot, `${targetId}-desktop-${depthIndex}.png`);
    await rasterize(sourcePath, width, height, PROFILE.desktop, depthIndex, png);
    const ktxPath = resolve(outputRoot, "full", "desktop", `${targetId}-depth-${depthIndex}.ktx2`);
    const webpPath = resolve(outputRoot, "full", "desktop", `${targetId}-depth-${depthIndex}.webp`);
    mkdirSync(dirname(ktxPath), { recursive: true });
    const encoding = depthIndex === 0 ? "uastc" : "etc1s";
    encodeKtx(png, ktxPath, `v592-nebula-overlay-${targetId}-desktop-${depthIndex}`, encoding);
    await encodeWebp(png, webpPath, depthIndex === 0 ? 74 : 62);
    desktopRecords.push({
      depthIndex,
      ktx2: record(ktxPath, width, height, "ktx2", encoding === "uastc" ? "uastc-q1-rdo2-zstd10-mipmapped" : "etc1s-clevel5-q128-mipmapped", "full-desktop-ktx2", depthIndex),
      fallback: record(webpPath, width, height, "webp", `webp-q${depthIndex === 0 ? 74 : 62}-alpha`, "full-desktop-fallback", depthIndex),
    });
  }
  variants.desktop = { width: desktopRecords[0].ktx2.width, height: desktopRecords[0].ktx2.height, aspect: Number((desktopRecords[0].ktx2.width / desktopRecords[0].ktx2.height).toFixed(9)), depthSliceCount: 4, slices: desktopRecords };
  variants.mobile = { width: desktopRecords[0].ktx2.width, height: desktopRecords[0].ktx2.height, aspect: variants.desktop.aspect, depthSliceCount: 2, slices: desktopRecords.slice(0, 2).map((slice) => ({ ...slice, ktx2: { ...slice.ktx2, role: "full-mobile-shared-ktx2" }, fallback: { ...slice.fallback, role: "full-mobile-shared-fallback" } })) };
  const [liteWidth, liteHeight] = dimensions(source.width, source.height, PROFILE.lite.longSides[0], false);
  const litePng = resolve(temporaryRoot, `${targetId}-lite.png`);
  await rasterize(sourcePath, liteWidth, liteHeight, PROFILE.lite, 0, litePng);
  const litePath = resolve(outputRoot, "lite", "shared", `${targetId}-depth-0.webp`);
  mkdirSync(dirname(litePath), { recursive: true });
  await encodeWebp(litePng, litePath, 54);
  const liteRecord = record(litePath, liteWidth, liteHeight, "webp", "webp-q54-alpha-shared", "lite-shared", 0);
  variants.lite = { width: liteWidth, height: liteHeight, aspect: Number((liteWidth / liteHeight).toFixed(9)), depthSliceCount: 1, slices: [{ depthIndex: 0, desktopFallback: liteRecord, mobileFallback: liteRecord }] };
  return {
    target: targetId,
    nasaId: source.nasaId,
    catalogName: spec.catalogName,
    source: {
      url: source.sourceUrl,
      path: source.outputPath,
      bytes: source.bytes,
      sha256: source.sha256,
      width: source.width,
      height: source.height,
      colorSpace: source.colorSpace,
      license: "NASA-media-guidelines-public-use-candidate-item-credit",
      licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
      credit: metadata.identity.credit,
      acquisitionReceiptSha256: acquisitionDocs.find((doc) => (doc.assets ?? []).some((item) => item.target === (spec.sourceTarget ?? targetId)))?.receiptSha256 ?? "",
      metadataReceiptSha256: metadataDocs.find((doc) => (doc.targets ?? []).some((item) => item.target === (spec.sourceTarget ?? targetId)))?.receiptSha256 ?? "",
    },
    coordinates: { coordinateFrame: "ICRS/J2000", raDeg: spec.raDeg, decDeg: spec.decDeg, angularSizeDeg: spec.angularSizeDeg, galacticCatalogReference: spec.galactic },
    observationEncoding: { bands: ["infrared"], colorPolicy: "mapped-observation-color-not-naked-eye", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-coordinate-angular-extent-and-band-only", cinematicModePolicy: "presentation-only-observation-image-with-band-label" },
    derivation: {
      tool: `sharp-${sharp.versions.sharp}+KTX-Software-4.4.2`,
      parameters: {
        alphaPolicy: "luma-thresholded-presentation-mask-with-tier-normalized-visibility",
        depthSlicePolicy: "desktop-1024-512-256-128-mobile-shared-1024-512-lite-96",
        alphaProfiles: { desktop4: { low: [2, 18, 56, 96], high: [18, 96, 180, 230], opacity: [0.72, 0.46, 0.3, 0.18] }, mobile2: { low: [2, 18], high: [18, 96], opacity: [0.72, 0.46] }, lite1: { low: [2], high: [18], opacity: [0.72] } },
        ktx2BlockAlignment: "4x4-all-full-tiers",
        depth0Encoding: "uastc-q1-rdo2-zstd10",
        depth1To3Encoding: "etc1s-clevel5-q128",
        inpainting: false,
        syntheticCoverageFill: false,
        scientificDataClaim: false,
      },
    },
    tiers: variants,
    presentationOnly: true,
    scientificAuthority: false,
    scientificPayloadWriteback: false,
  };
}

const byNamespace = { extended: [], closure: [] };
for (const targetId of allTargetIds) byNamespace[TARGETS[targetId].namespace].push(await buildAsset(targetId));

function emitNamespace(namespace, assets) {
  const config = SOURCES[namespace];
  const acquisitionReceiptSha256 = acquisitionDocs.filter((doc) => (doc.assets ?? []).some((entry) => assets.some((asset) => asset.target === (entry.target === "tarantula-nebula-closure" ? "tarantula-nebula" : entry.target)))).map((doc) => doc.receiptSha256);
  const metadataReceiptSha256 = metadataDocs.filter((doc) => (doc.targets ?? []).some((entry) => assets.some((asset) => asset.target === (entry.target === "tarantula-nebula-closure" ? "tarantula-nebula" : entry.target)))).map((doc) => doc.receiptSha256);
  const unsignedManifest = {
    version: `v592-nebula-${namespace}-visual-assets-v2`,
    generatedAt: "2026-08-20T00:00:00Z",
    status: "additive-presentation-assets-admitted-signoff-pending",
    policy: { sourceCount: assets.length, runtimeAssetAdmittedCount: assets.length, proceduralFallbackAllowed: false, scienceImagePayloadAllowed: false, presentationOnly: true, fixedJ2000Direction: true, noInpainting: true, noSyntheticCoverageFill: true, mobileSharesDesktopCore: true },
    sourceReceipts: { acquisitionReceiptSha256, metadataReceiptSha256 },
    admission: { metadataCandidateCount: assets.length, runtimeAssetAdmittedCount: assets.length, visualSignoffGranted: false, admittedTargets: assets.map((asset) => asset.target), blockedTargets: [] },
    assets,
  };
  const manifest = sealed(resolve(root, config.manifest), unsignedManifest, "manifestSha256");
  const generated = [
    `// Generated by scripts/build-v592-nebula-overlay-assets.mjs. Do not edit.`,
    `export const NEBULA_${namespace.toUpperCase()}_VISUAL_MANIFEST_SHA256_V592 = ${JSON.stringify(manifest.manifestSha256)} as const;`,
    `export const NEBULA_${namespace.toUpperCase()}_VISUAL_ASSETS_V592 = Object.freeze(${JSON.stringify(assets, null, 2)} as const);`,
    "",
  ].join("\n");
  atomicWrite(resolve(root, config.generated), Buffer.from(generated, "utf8"));
  const fullFiles = new Map();
  const liteFiles = new Map();
  for (const asset of assets) {
    for (const tier of ["desktop", "mobile"]) for (const slice of asset.tiers[tier].slices) {
      fullFiles.set(slice.ktx2.url, slice.ktx2.bytes);
      fullFiles.set(slice.fallback.url, slice.fallback.bytes);
    }
    for (const slice of asset.tiers.lite.slices) {
      liteFiles.set(slice.desktopFallback.url, slice.desktopFallback.bytes);
      liteFiles.set(slice.mobileFallback.url, slice.mobileFallback.bytes);
    }
  }
  const fullRuntimeBytes = [...fullFiles.values()].reduce((sum, bytes) => sum + bytes, 0);
  const liteIncrementBytes = [...liteFiles.values()].reduce((sum, bytes) => sum + bytes, 0);
  const receipt = sealed(resolve(root, config.receipt), { version: `v592-nebula-${namespace}-visual-assets-receipt-v2`, generatedAt: "2026-08-20T00:00:00Z", status: "additive-presentation-assets-built-signoff-pending", manifestSha256: manifest.manifestSha256, generatedModuleSha256: sha256(Buffer.from(generated, "utf8")), admittedTargets: assets.map((asset) => asset.target), uniqueFullFileCount: fullFiles.size, uniqueLiteFileCount: liteFiles.size, fullRuntimeBytes, liteIncrementBytes, visualSignoffGranted: false, scientificPayloadWriteback: false }, "receiptSha256");
  return { manifest, receipt };
}

const emitted = { extended: emitNamespace("extended", byNamespace.extended), closure: emitNamespace("closure", byNamespace.closure) };
rmSync(temporaryRoot, { recursive: true, force: true });
console.log(JSON.stringify({
  status: "v592-nebula-overlay-assets-built-signoff-pending",
  extended: { count: emitted.extended.manifest.assets.length, fullRuntimeBytes: emitted.extended.receipt.fullRuntimeBytes, liteIncrementBytes: emitted.extended.receipt.liteIncrementBytes, manifestSha256: emitted.extended.manifest.manifestSha256, receiptSha256: emitted.extended.receipt.receiptSha256 },
  closure: { count: emitted.closure.manifest.assets.length, fullRuntimeBytes: emitted.closure.receipt.fullRuntimeBytes, liteIncrementBytes: emitted.closure.receipt.liteIncrementBytes, manifestSha256: emitted.closure.manifest.manifestSha256, receiptSha256: emitted.closure.receipt.receiptSha256 },
}, null, 2));
