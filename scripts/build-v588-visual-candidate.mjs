import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const generatedAt = process.env.V588_GENERATED_AT ?? "2026-08-09T00:00:00Z";
const candidateRoot = resolve(root, "public/textures/candidate-v588");
const manifestPath = resolve(root, "public/data/visual-restoration-v588/manifest.json");
const freezePath = resolve(root, "docs/release/v588/freeze-before-v588.json");
const ktxTool = resolve(root, "tools/ktx/4.4.2/bin/ktx.exe");
const toktxTool = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const tempRoot = resolve(root, "tmp/v588-asset-build");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalize(value[key])]),
    );
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, path);
}

function atomicCopy(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  const partial = `${destination}.${process.pid}.part`;
  copyFileSync(source, partial);
  renameSync(partial, destination);
}

function runTool(executable, args, label) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`${label}:${result.status}:${result.stderr || result.stdout}`);
  }
}

function ktx2Dimensions(bytes) {
  if (bytes.byteLength < 80 || bytes.subarray(0, 12).toString("hex") !== "ab4b5458203230bb0d0a1a0a") {
    throw new Error("v588-invalid-ktx2-header");
  }
  return { width: bytes.readUInt32LE(20), height: bytes.readUInt32LE(24) };
}

const PLANET_ASSETS = [
  ["earth-albedo", "earth", "albedo", "srgb", "planets_v49_earth-albedo.ktx2"],
  ["earth-clouds", "earth", "cloud-color", "srgb", "planets_v49_earth-clouds.ktx2"],
  ["earth-cloud-alpha", "earth", "cloud-alpha", "linear", "planets_v49_earth-cloud-alpha.ktx2"],
  ["earth-night", "earth", "night-emission", "srgb", "planets_v49_earth-night.ktx2"],
  ["earth-night-mask", "earth", "night-mask", "linear", "planets_v49_earth-night-mask.ktx2"],
  ["earth-roughness", "earth", "roughness", "linear", "planets_v49_earth-roughness.ktx2"],
  ["jupiter-albedo", "jupiter", "albedo", "srgb", "planets_v49_jupiter-albedo.ktx2"],
  ["jupiter-band-mask", "jupiter", "band-mask", "linear", "planets_v49_jupiter-band-mask.ktx2"],
  ["jupiter-roughness", "jupiter", "roughness", "linear", "planets_v49_jupiter-roughness.ktx2"],
  ["saturn-albedo", "saturn", "albedo", "srgb", "planets_v49_saturn-albedo.ktx2"],
  ["saturn-band-mask", "saturn", "band-mask", "linear", "planets_v49_saturn-band-mask.ktx2"],
  ["saturn-ring-color", "saturn", "ring-color", "srgb", "planets_v49_saturn-ring-color.ktx2"],
  ["saturn-ring-alpha", "saturn", "ring-alpha", "linear", "planets_v49_saturn-ring-alpha.ktx2"],
  ["saturn-roughness", "saturn", "roughness", "linear", "planets_v49_saturn-roughness.ktx2"],
  ["mars-albedo", "mars", "albedo", "srgb", "planets_v49_mars-albedo.ktx2"],
  ["mars-roughness", "mars", "roughness", "linear", "planets_v49_mars-roughness.ktx2"],
].map(([id, body, role, colorSpace, sourceName]) => ({ id, body, role, colorSpace, sourceName }));

function targetDimensions(source, variant) {
  const maxWidth = variant === "desktop" ? 2048 : 1024;
  const ratio = Math.min(1, maxWidth / source.width);
  return {
    width: Math.max(1, Math.round(source.width * ratio)),
    height: Math.max(1, Math.round(source.height * ratio)),
  };
}

async function buildPlanetAsset(spec) {
  const originalPath = resolve(root, "public/textures/ktx2", spec.sourceName);
  if (!existsSync(originalPath)) throw new Error(`v588-missing-admitted-source:${spec.id}`);
  const originalBytes = readFileSync(originalPath);
  const sourceDimensions = ktx2Dimensions(originalBytes);
  const candidateKtxPath = resolve(candidateRoot, "ktx2", `${spec.id}.ktx2`);
  atomicCopy(originalPath, candidateKtxPath);
  const candidateKtxBytes = readFileSync(candidateKtxPath);
  if (sha256(candidateKtxBytes) !== sha256(originalBytes)) throw new Error(`v588-ktx2-copy-drift:${spec.id}`);

  const extractedPath = resolve(tempRoot, `${spec.id}.png`);
  mkdirSync(dirname(extractedPath), { recursive: true });
  runTool(ktxTool, ["extract", "--transcode", "rgba8", originalPath, extractedPath], `v588-extract:${spec.id}`);

  const fallbacks = {};
  for (const variant of ["desktop", "mobile"]) {
    const dimensions = targetDimensions(sourceDimensions, variant);
    const outputPath = resolve(candidateRoot, "fallback", variant, `${spec.id}.webp`);
    mkdirSync(dirname(outputPath), { recursive: true });
    const image = sharp(extractedPath).resize(dimensions.width, dimensions.height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    });
    const outputBytes = spec.colorSpace === "linear"
      ? await image.webp({ lossless: true, effort: 6 }).toBuffer()
      : await image.webp({ quality: spec.role === "night-emission" ? 92 : 94, effort: 6, smartSubsample: true }).toBuffer();
    atomicWrite(outputPath, outputBytes);
    const observed = await sharp(outputBytes).metadata();
    if (observed.width !== dimensions.width || observed.height !== dimensions.height || observed.format !== "webp") {
      throw new Error(`v588-fallback-dimensions:${spec.id}:${variant}`);
    }
    fallbacks[variant] = {
      url: `/textures/candidate-v588/fallback/${variant}/${spec.id}.webp`,
      bytes: outputBytes.byteLength,
      sha256: sha256(outputBytes),
      dimensions,
      format: "webp",
      compression: spec.colorSpace === "linear" ? "webp-lossless" : "webp-quality-94",
    };
  }

  rmSync(extractedPath, { force: true });
  return {
    id: spec.id,
    body: spec.body,
    role: spec.role,
    colorSpace: spec.colorSpace,
    presentationOnly: true,
    primary: {
      url: `/textures/candidate-v588/ktx2/${spec.id}.ktx2`,
      bytes: candidateKtxBytes.byteLength,
      sha256: sha256(candidateKtxBytes),
      dimensions: sourceDimensions,
      format: "ktx2",
      compression: "byte-copy-from-admitted-v49-ktx2",
    },
    fallback: fallbacks,
    provenance: {
      originalPath: `public/textures/ktx2/${spec.sourceName}`,
      originalBytes: originalBytes.byteLength,
      originalSha256: sha256(originalBytes),
      relationship: "candidate-byte-copy-plus-deterministic-decoded-fallback",
      historicalV49IdentityInherited: false,
    },
    license: {
      id: "NASA-public-domain-and-project-source-manifests",
      url: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    },
  };
}

async function buildSkyAsset(variant, sourceRelativePath) {
  const sourcePath = resolve(root, sourceRelativePath);
  const sourceBytes = readFileSync(sourcePath);
  const fallbackPath = resolve(candidateRoot, "sky", `milky-way-${variant}.jpg`);
  const ktx2Path = resolve(candidateRoot, "sky", `milky-way-${variant}.ktx2`);
  atomicCopy(sourcePath, fallbackPath);
  mkdirSync(dirname(ktx2Path), { recursive: true });
  const partial = `${ktx2Path}.${process.pid}.part`;
  runTool(toktxTool, [
    "--t2",
    "--encode", "etc1s",
    "--genmipmap",
    "--assign_oetf", "srgb",
    partial,
    sourcePath,
  ], `v588-sky-ktx2:${variant}`);
  renameSync(partial, ktx2Path);
  const ktx2Bytes = readFileSync(ktx2Path);
  const fallbackBytes = readFileSync(fallbackPath);
  const metadata = await sharp(fallbackBytes).metadata();
  if (!metadata.width || !metadata.height || metadata.format !== "jpeg") throw new Error(`v588-sky-jpeg:${variant}`);
  return {
    id: `milky-way-${variant}`,
    body: "sky",
    role: "milky-way-background",
    variant,
    colorSpace: "srgb-assumed-untagged",
    presentationOnly: true,
    primary: {
      url: `/textures/candidate-v588/sky/milky-way-${variant}.ktx2`,
      bytes: ktx2Bytes.byteLength,
      sha256: sha256(ktx2Bytes),
      dimensions: ktx2Dimensions(ktx2Bytes),
      format: "ktx2",
      compression: "etc1s-mipmapped",
    },
    fallback: {
      [variant]: {
        url: `/textures/candidate-v588/sky/milky-way-${variant}.jpg`,
        bytes: fallbackBytes.byteLength,
        sha256: sha256(fallbackBytes),
        dimensions: { width: metadata.width, height: metadata.height },
        format: "jpeg",
        compression: "byte-copy-from-frozen-v9",
      },
    },
    provenance: {
      originalPath: sourceRelativePath.replaceAll("\\", "/"),
      originalBytes: sourceBytes.byteLength,
      originalSha256: sha256(sourceBytes),
      relationship: "candidate-etc1s-plus-byte-preserving-v9-fallback",
      historicalV9IdentityInherited: false,
    },
    license: {
      id: "NASA-public-domain",
      url: "https://svs.gsfc.nasa.gov/4851/",
    },
  };
}

function verifyFrozenBoundary() {
  const previous = JSON.parse(readFileSync(resolve(root, "docs/release/v587/freeze-audit-v587.json"), "utf8"));
  const frozenSnapshot = previous.frozenSnapshot.map((expected) => {
    const absolute = resolve(root, expected.path);
    const exists = existsSync(absolute);
    const bytes = exists ? statSync(absolute).size : 0;
    const observedSha256 = exists ? sha256(readFileSync(absolute)) : null;
    if (exists !== expected.exists || bytes !== expected.bytes || observedSha256 !== expected.sha256) {
      throw new Error(`v588-frozen-boundary-drift:${expected.path}`);
    }
    return { ...expected };
  });
  const unsigned = {
    version: "v588-frozen-boundary-before-snapshot-v1",
    generatedAt,
    status: "passed-v263-v9-v559-v560-v562-byte-identical-before-v588",
    priorSnapshotSha256: previous.snapshotSha256,
    formalProductPointer: "v263",
    defaultKernel: "legacy-eih-1pn",
    historicalEvidenceRewritten: false,
    frozenSnapshot,
  };
  const receipt = { ...unsigned, snapshotSha256: canonicalSha(unsigned) };
  atomicWrite(freezePath, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}

const freeze = verifyFrozenBoundary();
mkdirSync(tempRoot, { recursive: true });
const planetAssets = [];
for (const spec of PLANET_ASSETS) planetAssets.push(await buildPlanetAsset(spec));
const skyAssets = [
  await buildSkyAsset("desktop", "public/textures/sky/orbit-atlas-v9-base-8k.jpg"),
  await buildSkyAsset("mobile", "public/textures/sky/orbit-atlas-v9-base-4k.jpg"),
];
rmSync(tempRoot, { recursive: true, force: true });

const allAssets = [...skyAssets, ...planetAssets];
const sourceManifest = [...new Map(allAssets.map((asset) => [
  asset.provenance.originalPath,
  {
    path: asset.provenance.originalPath,
    bytes: asset.provenance.originalBytes,
    sha256: asset.provenance.originalSha256,
  },
])).values()].sort((left, right) => left.path.localeCompare(right.path));
const unsignedManifest = {
  version: "v588-visual-restoration-candidate-v1",
  generatedAt,
  status: "candidate-assets-admitted-no-procedural-hero-fallback",
  authorityNamespace: "candidate-v588",
  visualAuthority: "candidate-only-not-v263-not-v9-not-v562-not-v587",
  aestheticDirection: "deep-space-cinematic-restoration-with-linear-science-instrument-layer",
  assets: allAssets,
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  admission: {
    heroBodies: ["earth", "jupiter", "saturn", "mars"],
    heroProceduralFallbackAllowed: false,
    ktx2Primary: true,
    verifiedFallbackRequired: true,
    desktopFallbackMaxWidth: 2048,
    mobileFallbackMaxWidth: 1024,
    skyDesktopSource: "frozen-v9-8k-byte-copy",
    scienceFloatFieldsCompressed: false,
  },
  boundary: {
    formalProductPointer: "v263",
    frozenV9Rewritten: false,
    historicalEvidenceRewritten: false,
    v562Rewritten: false,
    v587ScientificPayloadWriteback: false,
    productionPromotionAllowed: false,
    singleCanvasRequired: true,
  },
  frozenBoundarySnapshotSha256: freeze.snapshotSha256,
};
const manifest = { ...unsignedManifest, manifestSha256: canonicalSha(unsignedManifest) };
atomicWrite(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(JSON.stringify({
  status: manifest.status,
  manifest: "public/data/visual-restoration-v588/manifest.json",
  manifestSha256: manifest.manifestSha256,
  frozenBoundarySnapshotSha256: freeze.snapshotSha256,
  assetCount: manifest.assets.length,
  heroBodies: manifest.admission.heroBodies,
  formalProductPointer: manifest.boundary.formalProductPointer,
}, null, 2));
