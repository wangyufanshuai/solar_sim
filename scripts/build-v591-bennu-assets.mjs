import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-bennu.json");
const v589ManifestPath = resolve(root, "public/data/celestial-art-v589/manifest.json");
const v589LodReceiptPath = resolve(root, "docs/release/v589/bennu-lod-receipt-v589.json");
const overlayPath = resolve(root, "public/data/celestial-convergence-v591/bennu-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const outputRoot = resolve(root, "public/textures/candidate-v591/bennu");
const temporaryRoot = resolve(root, "tmp/v591-bennu-assets");
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

function verifySealed(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === document[field], `v591-bennu-${label}-seal`);
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

function outputRecord(path, url, width, height, format, colorSpace, compression) {
  const bytes = readFileSync(path);
  return { url, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression };
}

async function writePng(input, width, height, output, colorSpace) {
  let pipeline = sharp(input, { limitInputPixels: false })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha();
  if (colorSpace === "srgb") pipeline = pipeline.toColourspace("srgb");
  await pipeline.png({ compressionLevel: 8, adaptiveFiltering: true }).toFile(output);
}

async function encodeAsset(source, specification) {
  const { id, role, colorSpace, rdoLambda } = specification;
  const desktopWidth = 4096;
  const desktopHeight = 4096;
  const mobileWidth = 2048;
  const mobileHeight = 2048;
  const desktopPng = resolve(temporaryRoot, `${id}-desktop.png`);
  const mobilePng = resolve(temporaryRoot, `${id}-mobile.png`);
  const liteDesktopPng = resolve(temporaryRoot, `${id}-lite-desktop.png`);
  const liteMobilePng = resolve(temporaryRoot, `${id}-lite-mobile.png`);
  const sourcePath = resolve(root, source.outputPath);
  await writePng(sourcePath, desktopWidth, desktopHeight, desktopPng, colorSpace);
  await writePng(desktopPng, mobileWidth, mobileHeight, mobilePng, colorSpace);
  await writePng(desktopPng, 1024, 1024, liteDesktopPng, colorSpace);
  await writePng(desktopPng, 512, 512, liteMobilePng, colorSpace);
  const paths = {
    desktopKtx2: resolve(outputRoot, `full/desktop/${id}.ktx2`),
    desktopFallback: resolve(outputRoot, `full/desktop/${id}.webp`),
    mobileKtx2: resolve(outputRoot, `full/mobile/${id}.ktx2`),
    mobileFallback: resolve(outputRoot, `full/mobile/${id}.webp`),
    liteDesktop: resolve(outputRoot, `lite/desktop/${id}.webp`),
    liteMobile: resolve(outputRoot, `lite/mobile/${id}.webp`),
  };
  Object.values(paths).forEach((path) => mkdirSync(dirname(path), { recursive: true }));
  const ktxArgs = (output, input) => [
    "--t2", "--encode", "uastc", "--uastc_quality", "2",
    "--uastc_rdo_l", String(rdoLambda), "--uastc_rdo_m", "--threads", "1",
    "--zcmp", "10", "--genmipmap", "--assign_oetf", colorSpace,
    "--assign_primaries", colorSpace === "srgb" ? "srgb" : "none",
    output, input,
  ];
  for (const [path, input, label] of [
    [paths.desktopKtx2, desktopPng, "desktop"],
    [paths.mobileKtx2, mobilePng, "mobile"],
  ]) {
    const partial = `${path}.${process.pid}.part`;
    runTool(toktx, ktxArgs(partial, input), `v591-bennu-${id}-${label}-ktx2`);
    rmSync(path, { force: true });
    renameSync(partial, path);
  }
  const isDiffuse = colorSpace === "srgb";
  const fullWebpOptions = (quality) => isDiffuse
    ? { quality, effort: 6, smartSubsample: true }
    : { lossless: true, effort: 6 };
  const liteWebpOptions = (quality) => ({ quality, effort: 6, smartSubsample: isDiffuse });
  atomicWrite(paths.desktopFallback, await sharp(desktopPng).webp(fullWebpOptions(94)).toBuffer());
  atomicWrite(paths.mobileFallback, await sharp(mobilePng).webp(fullWebpOptions(92)).toBuffer());
  atomicWrite(paths.liteDesktop, await sharp(liteDesktopPng).webp(isDiffuse ? liteWebpOptions(88) : liteWebpOptions(90)).toBuffer());
  atomicWrite(paths.liteMobile, await sharp(liteMobilePng).webp(isDiffuse ? liteWebpOptions(86) : liteWebpOptions(90)).toBuffer());
  const compression = `uastc-q2-rdo-${rdoLambda}-single-thread-zstd10-mipmapped`;
  return {
    id,
    body: "bennu",
    role,
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
      observationLimit: source.observationLimit,
    },
    derivation: {
      tool: "sharp+KTX-Software",
      version: `node-${process.versions.node};sharp-${sharp.versions.sharp};ktx-4.4.2`,
      parameters: `exact 4K source or deterministic Lanczos3 2K/1K/512 derivatives; UASTC-RDO q2 lambda ${rdoLambda}; single thread; zstd10; mipmapped`,
      physicalPolicy: "CC0 texture contributes bounded microvariation only; NASA Bennu geometry and calibrated dark carbonaceous substrate remain independent.",
    },
    fullQualityMinimum: {
      desktop: { width: desktopWidth, height: desktopHeight },
      mobile: { width: mobileWidth, height: mobileHeight },
    },
    variants: {
      desktopKtx2: outputRecord(paths.desktopKtx2, `/textures/candidate-v591/bennu/full/desktop/${id}.ktx2`, desktopWidth, desktopHeight, "ktx2", colorSpace, compression),
      desktopFallback: outputRecord(paths.desktopFallback, `/textures/candidate-v591/bennu/full/desktop/${id}.webp`, desktopWidth, desktopHeight, "webp", colorSpace, isDiffuse ? "webp-quality-94" : "webp-lossless"),
      mobileKtx2: outputRecord(paths.mobileKtx2, `/textures/candidate-v591/bennu/full/mobile/${id}.ktx2`, mobileWidth, mobileHeight, "ktx2", colorSpace, compression),
      mobileFallback: outputRecord(paths.mobileFallback, `/textures/candidate-v591/bennu/full/mobile/${id}.webp`, mobileWidth, mobileHeight, "webp", colorSpace, isDiffuse ? "webp-quality-92" : "webp-lossless"),
      liteDesktop: outputRecord(paths.liteDesktop, `/textures/candidate-v591/bennu/lite/desktop/${id}.webp`, 1024, 1024, "webp", colorSpace, isDiffuse ? "webp-quality-88" : "webp-quality-90-linear-lite"),
      liteMobile: outputRecord(paths.liteMobile, `/textures/candidate-v591/bennu/lite/mobile/${id}.webp`, 512, 512, "webp", colorSpace, isDiffuse ? "webp-quality-86" : "webp-quality-90-linear-lite"),
    },
    presentationOnly: true,
  };
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
assert(
  acquisition.status === "acquired-single-request-no-retry"
    && acquisition.requestedUrlCount === 3
    && acquisition.automaticRetryPerformed === false
    && acquisition.automaticReplacementPerformed === false
    && acquisition.assets?.length === 3,
  "v591-bennu-acquisition-contract",
);
for (const source of acquisition.assets) {
  const bytes = readFileSync(resolve(root, source.outputPath));
  assert(bytes.byteLength === source.bytes && sha256(bytes) === source.sha256, `v591-bennu-source-drift:${source.id}`);
  assert(new URL(source.finalUrl).hostname === "dl.polyhaven.org" && source.license?.id === "Poly-Haven-CC0", `v591-bennu-source-provenance:${source.id}`);
  assert(source.width >= 4096 && source.height >= 4096, `v591-bennu-source-dimensions:${source.id}`);
}

const v589Manifest = JSON.parse(readFileSync(v589ManifestPath, "utf8"));
verifySealed(v589Manifest, "manifestSha256", "v589-manifest");
const modelAsset = v589Manifest.assets.find((asset) => asset.id === "bennu-model");
assert(modelAsset?.body === "bennu" && modelAsset.license?.id === "NASA-public-domain", "v591-bennu-model-asset");
const lodReceipt = JSON.parse(readFileSync(v589LodReceiptPath, "utf8"));
verifySealed(lodReceipt, "receiptSha256", "v589-lod");
assert(lodReceipt.body === "bennu" && lodReceipt.lods?.length === 3, "v591-bennu-model-lods");
for (const lod of lodReceipt.lods) {
  const bytes = readFileSync(resolve(root, lod.path));
  assert(bytes.byteLength === lod.bytes && sha256(bytes) === lod.sha256, `v591-bennu-model-lod-drift:${lod.lod}`);
  assert(lod.normals === true && lod.meshopt === true && lod.pivot === "bounds-midpoint", `v591-bennu-model-lod-contract:${lod.lod}`);
}

rmSync(temporaryRoot, { recursive: true, force: true });
mkdirSync(temporaryRoot, { recursive: true });
const sources = new Map(acquisition.assets.map((asset) => [asset.id, asset]));
const assets = [
  await encodeAsset(sources.get("bennu-regolith-diffuse-source"), { id: "bennu-regolith-albedo", role: "cc0-regolith-micro-albedo", colorSpace: "srgb", rdoLambda: 0.75 }),
  await encodeAsset(sources.get("bennu-regolith-normal-source"), { id: "bennu-regolith-normal", role: "cc0-regolith-micro-normal", colorSpace: "linear", rdoLambda: 0.55 }),
  await encodeAsset(sources.get("bennu-regolith-roughness-source"), { id: "bennu-regolith-roughness", role: "cc0-regolith-micro-roughness", colorSpace: "linear", rdoLambda: 0.7 }),
];
const unsigned = {
  version: "v591-bennu-asset-overlay-v1",
  generatedAt,
  status: "bennu-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  noNetworkRequestsPerformedDuringDerivation: true,
  noModelBytesCopied: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  inheritedModel: {
    candidate: "v589-readonly",
    manifestPath: "public/data/celestial-art-v589/manifest.json",
    manifestSha256: v589Manifest.manifestSha256,
    assetId: "bennu-model",
    sourceUrl: modelAsset.sourceUrl,
    sourceBytes: modelAsset.sourceBytes,
    sourceSha256: modelAsset.sourceSha256,
    license: modelAsset.license,
    lodReceiptPath: "docs/release/v589/bennu-lod-receipt-v589.json",
    lodReceiptSha256: lodReceipt.receiptSha256,
    lods: lodReceipt.lods.map(({ lod, path, bytes, sha256: digest, triangleCount, normals, meshopt, pivot, units, rotationAxis }) => ({
      lod, path, bytes, sha256: digest, triangleCount, normals, meshopt, pivot, units, rotationAxis,
    })),
  },
  materialPolicy: {
    substrate: "bounded-low-albedo-carbonaceous-reference",
    microtexture: "poly-haven-cc0-presentation-only-not-bennu-observation",
    reflectance: "oren-nayar-plus-bounded-opposition-no-glossy-specular",
  },
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
  },
  assets,
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(overlayPath, Buffer.from(`${JSON.stringify(overlay, null, 2)}\n`, "utf8"));

const overlayNames = ["SUN", "EARTH", "MOON", "MARS", "JUPITER", "SATURN"];
const overlays = Object.fromEntries(overlayNames.map((name) => {
  const value = JSON.parse(readFileSync(resolve(root, `public/data/celestial-convergence-v591/${name.toLowerCase()}-asset-overlay.json`), "utf8"));
  verifySealed(value, "receiptSha256", `${name.toLowerCase()}-overlay`);
  return [name, value];
}));
overlays.BENNU = overlay;
atomicWrite(generatedConstantsPath, Buffer.from([
  "// Generated from the sealed v591 Sun, Earth, Moon, Mars, Jupiter, Saturn, and Bennu asset overlays.",
  ...Object.entries(overlays).map(([name, value]) => `export const CELESTIAL_CONVERGENCE_${name}_ASSET_OVERLAY_SHA256_V591 = "${value.receiptSha256}" as const;`),
  "",
].join("\n"), "utf8"));
rmSync(temporaryRoot, { recursive: true, force: true });

console.log(JSON.stringify({
  status: overlay.status,
  model: { lods: lodReceipt.lods.length, receiptSha256: lodReceipt.receiptSha256 },
  assets: assets.map((asset) => ({ id: asset.id, desktopBytes: asset.variants.desktopKtx2.bytes, mobileBytes: asset.variants.mobileKtx2.bytes, liteDesktopBytes: asset.variants.liteDesktop.bytes })),
  receiptSha256: overlay.receiptSha256,
}, null, 2));
