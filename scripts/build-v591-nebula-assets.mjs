import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-13T00:00:00Z";
const outputRoot = resolve(root, "public/textures/candidate-v591/nebulae");
const docsRoot = resolve(root, "docs/release/v591");
const generatedConstantsPath = resolve(root, "app/data/celestialNebulaV591.generated.ts");
const ktx = resolve(root, "tools/ktx/4.4.2/bin/toktx.exe");
const ffmpeg = process.env.FFMPEG ?? "ffmpeg";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]))
    : value;
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.part`;
  writeFileSync(part, text);
  rmSync(path, { force: true });
  renameSync(part, path);
}

function receiptFor(id, receiptPath = `acquisition-assets-nebulae/${id}.json`) {
  const path = resolve(docsRoot, receiptPath);
  if (!existsSync(path)) throw new Error(`v591-nebula-receipt-missing:${path}`);
  const value = JSON.parse(readFileSync(path, "utf8"));
  if (value.status !== "committed-single-request-no-retry" || !value.asset?.outputPath) {
    throw new Error(`v591-nebula-receipt-blocked:${id}`);
  }
  return value;
}

const definitions = [
  { id: "orion-nebula", receipt: "orion-nebula-nasa-wise", sourceDir: "orion", sourceFile: "PIA16684~orig.jpg", nasaId: "PIA16684", instrument: "NASA WISE", target: "orion-nebula", raDeg: 83.8221, decDeg: -5.3911, angularSizeDeg: 1.1 },
  { id: "lagoon-nebula", receipt: "lagoon-nebula-nasa-wise", sourceDir: "lagoon", sourceFile: "PIA13453~orig.jpg", nasaId: "PIA13453", instrument: "NASA WISE", target: "lagoon-nebula", raDeg: 270.925, decDeg: -24.375, angularSizeDeg: 1.5 },
  { id: "eagle-nebula", receipt: "eagle-nebula-nasa-wise", sourceDir: "eagle", sourceFile: "PIA25433~orig.jpg", nasaId: "PIA25433", instrument: "NASA WISE", target: "eagle-nebula", raDeg: 274.7, decDeg: -13.8067, angularSizeDeg: 0.6 },
  { id: "helix-nebula", receipt: "helix-nebula-nasa-galex", sourceDir: "helix", sourceFile: "PIA15658~orig.jpg", nasaId: "PIA15658", instrument: "NASA GALEX", target: "helix-nebula", raDeg: 337.4108, decDeg: -20.8372, angularSizeDeg: 0.47 },
  { id: "veil-nebula", receipt: "veil-cygnus-loop", receiptPath: "acquisition-asset-veil-cygnus-loop.json", sourceDir: "veil", sourceFile: "PIA15415~orig.jpg", nasaId: "PIA15415", instrument: "NASA GALEX", target: "veil-nebula", raDeg: 312.75, decDeg: 30.7, angularSizeDeg: 3 },
  { id: "north-america-nebula", receipt: "north-america-nebula-nasa-spitzer", sourceDir: "north-america", sourceFile: "PIA13843~orig.jpg", nasaId: "PIA13843", instrument: "NASA Spitzer Space Telescope", target: "north-america-nebula", raDeg: 314.7, decDeg: 44.3, angularSizeDeg: 2 },
];

function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(`v591-nebula-derive:${label}:${result.stderr || result.stdout || result.status}`);
}

function fileVariant(path, width, height, format, colorSpace, compression, role) {
  const bytes = readFileSync(path);
  return { url: `/${path.slice(resolve(root, "public").length + 1).replaceAll("\\", "/")}`, bytes: bytes.byteLength, sha256: sha256(bytes), width, height, format, colorSpace, compression, role };
}

function deriveWebp(source, output, width, height, quality) {
  run(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-vf", `scale=${width}:${height}:flags=lanczos`, "-frames:v", "1", "-map_metadata", "-1", "-c:v", "libwebp", "-q:v", String(quality), output], `webp:${output}`);
}

function deriveKtx(source, output, width, height) {
  run(ktx, ["--t2", "--encode", "uastc", "--uastc_quality", "2", "--uastc_rdo_l", "1.0", "--zcmp", "3", "--genmipmap", "--assign_oetf", "srgb", "--resize", `${width}x${height}`, "--threads", "2", output, source], `ktx2:${output}`);
}

const assets = [];
for (const definition of definitions) {
  const receipt = receiptFor(definition.receipt, definition.receiptPath);
  const sourcePath = resolve(root, receipt.asset.outputPath);
  if (!existsSync(sourcePath)) throw new Error(`v591-nebula-source-missing:${definition.id}`);
  const sourceBytes = readFileSync(sourcePath);
  if (sourceBytes.byteLength !== receipt.asset.bytes || sha256(sourceBytes) !== receipt.asset.sha256) {
    throw new Error(`v591-nebula-source-drift:${definition.id}`);
  }
  const fullDesktopDir = resolve(outputRoot, "full/desktop");
  const fullMobileDir = resolve(outputRoot, "full/mobile");
  const liteDesktopDir = resolve(outputRoot, "lite/desktop");
  const liteMobileDir = resolve(outputRoot, "lite/mobile");
  for (const directory of [fullDesktopDir, fullMobileDir, liteDesktopDir, liteMobileDir]) mkdirSync(directory, { recursive: true });
  const desktopKtxPath = resolve(fullDesktopDir, `${definition.id}.ktx2`);
  const desktopFallbackPath = resolve(fullDesktopDir, `${definition.id}.webp`);
  const mobileKtxPath = resolve(fullMobileDir, `${definition.id}.ktx2`);
  const mobileFallbackPath = resolve(fullMobileDir, `${definition.id}.webp`);
  const liteDesktopPath = resolve(liteDesktopDir, `${definition.id}.webp`);
  const liteMobilePath = resolve(liteMobileDir, `${definition.id}.webp`);
  deriveKtx(sourcePath, desktopKtxPath, 2048, 2048);
  deriveKtx(sourcePath, mobileKtxPath, 1024, 1024);
  deriveWebp(sourcePath, desktopFallbackPath, 2048, 2048, 86);
  deriveWebp(sourcePath, mobileFallbackPath, 1024, 1024, 82);
  // Lite deliberately shares one small, deterministic image for both device tiers.
  deriveWebp(sourcePath, liteDesktopPath, 320, 320, 52);
  writeFileSync(liteMobilePath, readFileSync(liteDesktopPath));
  const source = {
    id: definition.nasaId,
    target: definition.target,
    instrument: definition.instrument,
    sourceUrl: receipt.asset.sourceUrl,
    finalUrl: receipt.asset.sourceUrl,
    host: new URL(receipt.asset.sourceUrl).hostname,
    license: receipt.asset.license,
    path: receipt.asset.outputPath,
    bytes: receipt.asset.bytes,
    sha256: receipt.asset.sha256,
    width: receipt.asset.width,
    height: receipt.asset.height,
    colorSpace: receipt.asset.colorSpace,
    fieldCoverage: receipt.asset.fieldCoverage,
    observationColorPolicy: receipt.asset.observationColorPolicy,
    acquisitionReceiptSha256: receipt.receiptSha256,
  };
  assets.push({
    id: definition.id,
    target: definition.target,
    nasaId: definition.nasaId,
    instrument: definition.instrument,
    raDeg: definition.raDeg,
    decDeg: definition.decDeg,
    angularSizeDeg: definition.angularSizeDeg,
    admission: "admitted",
    source,
    derivation: {
      tool: "toktx+ffmpeg",
      toktxVersion: "KTX-Software 4.4.2",
      ffmpegVersion: "ffmpeg-2026-02-09",
      parameters: {
        fullDesktop: "2048x2048 UASTC quality=2 RDO=1.0 zstd=3 mipmaps srgb",
        fullMobile: "1024x1024 UASTC quality=2 RDO=1.0 zstd=3 mipmaps srgb",
        lite: "320x320 WebP q=52 shared desktop/mobile",
      },
    },
    variants: {
      desktopKtx2: fileVariant(desktopKtxPath, 2048, 2048, "ktx2", "srgb", "uastc-rdo-zstd3-mipmap", "full-desktop"),
      desktopFallback: fileVariant(desktopFallbackPath, 2048, 2048, "webp", "srgb", "webp-q86", "full-desktop-fallback"),
      mobileKtx2: fileVariant(mobileKtxPath, 1024, 1024, "ktx2", "srgb", "uastc-rdo-zstd3-mipmap", "full-mobile"),
      mobileFallback: fileVariant(mobileFallbackPath, 1024, 1024, "webp", "srgb", "webp-q82", "full-mobile-fallback"),
      liteDesktop: fileVariant(liteDesktopPath, 320, 320, "webp", "srgb", "webp-q52", "lite-desktop"),
      liteMobile: fileVariant(liteMobilePath, 320, 320, "webp", "srgb", "webp-q52-shared", "lite-mobile"),
    },
    presentationOnly: true,
    scientificAuthority: false,
  });
}

const unsigned = {
  version: "v591-nebula-asset-overlay-v1",
  generatedAt,
  status: "6-of-6-runtime-admitted",
  policy: {
    science: "marker-only-no-image-payload",
    cinematic: "verified-nasa-presentation-impostor-only",
    maxConcurrentHighOrder: 3,
    fixedJ2000Directions: true,
    noSyntheticReplacement: true,
    presentationOnly: true,
  },
  assets,
  blocked: [],
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
  },
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(resolve(root, "public/data/celestial-convergence-v591/nebula-asset-overlay.json"), `${JSON.stringify(overlay, null, 2)}\n`);
atomicWrite(generatedConstantsPath, [
  "// Generated by scripts/build-v591-nebula-assets.mjs.",
  `export const CELESTIAL_NEBULA_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`,
  'export const CELESTIAL_NEBULA_OVERLAY_URL_V591 = "/data/celestial-convergence-v591/nebula-asset-overlay.json" as const;',
  "",
].join("\n"));
console.log(JSON.stringify({ status: overlay.status, admitted: assets.length, blocked: overlay.blocked.length, receiptSha256: overlay.receiptSha256 }, null, 2));
