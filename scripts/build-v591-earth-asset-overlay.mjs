import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";
const baselineManifestPath = resolve(root, "public/data/celestial-rendering-v590/manifest.json");
const sunOverlayPath = resolve(root, "public/data/celestial-convergence-v591/sun-asset-overlay.json");
const earthOverlayPath = resolve(root, "public/data/celestial-convergence-v591/earth-asset-overlay.json");
const generatedConstantsPath = resolve(root, "app/data/celestialConvergenceAssetsV591.generated.ts");
const requiredAssetIds = Object.freeze([
  "earth-albedo",
  "earth-normal",
  "earth-roughness",
  "earth-clouds",
  "earth-cloud-alpha",
  "earth-night",
  "earth-night-mask",
]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function verifySealed(path, field) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`v591-earth-overlay-seal:${path}`);
  return document;
}
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.part`;
  writeFileSync(temporary, text);
  rmSync(path, { force: true });
  renameSync(temporary, path);
}
function publicPathFromUrl(url) {
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("\\")) throw new Error(`v591-earth-overlay-url:${url}`);
  const decoded = decodeURIComponent(url.split("?")[0]);
  if (decoded.split("/").includes("..")) throw new Error(`v591-earth-overlay-traversal:${url}`);
  return resolve(root, "public", decoded.replace(/^\/+/, ""));
}

const baseline = verifySealed(baselineManifestPath, "manifestSha256");
const sunOverlay = verifySealed(sunOverlayPath, "receiptSha256");
if (
  baseline.version !== "v590-celestial-rendering-candidate-v1"
  || baseline.heroBodies?.earth !== "admitted"
  || baseline.boundaries?.formalProductPointer !== "v263"
  || baseline.boundaries?.scientificPayloadWriteback !== false
  || sunOverlay.version !== "v591-sun-asset-overlay-v1"
) throw new Error("v591-earth-overlay-baseline-identity");

const assets = requiredAssetIds.map((id) => {
  const asset = baseline.assets.find((entry) => entry.id === id);
  if (!asset || asset.body !== "earth" || asset.presentationOnly !== true || !asset.fullQualityMinimum) {
    throw new Error(`v591-earth-overlay-required-asset:${id}`);
  }
  for (const [variant, file] of Object.entries(asset.variants)) {
    if (!file) throw new Error(`v591-earth-overlay-variant-missing:${id}:${variant}`);
    const path = publicPathFromUrl(file.url);
    if (!existsSync(path)) throw new Error(`v591-earth-overlay-file-missing:${id}:${variant}`);
    const bytes = readFileSync(path);
    if (bytes.byteLength !== file.bytes || sha256(bytes) !== file.sha256) {
      throw new Error(`v591-earth-overlay-file-drift:${id}:${variant}`);
    }
  }
  return {
    id: asset.id,
    body: "earth",
    role: asset.role,
    inheritedIdentity: {
      candidate: "v590-readonly",
      manifestSha256: baseline.manifestSha256,
      sourceUrl: asset.sourceUrl,
      sourceHost: asset.sourceHost,
      license: asset.license,
      sourceBytes: asset.sourceBytes,
      sourceSha256: asset.sourceSha256,
    },
    fullQualityMinimum: asset.fullQualityMinimum,
    variants: asset.variants,
    presentationOnly: true,
  };
});

const unsigned = {
  version: "v591-earth-asset-overlay-v1",
  generatedAt,
  status: "earth-runtime-admitted-inherited-exact-bytes",
  baseline: {
    candidate: "v590-readonly",
    manifestPath: "public/data/celestial-rendering-v590/manifest.json",
    manifestSha256: baseline.manifestSha256,
  },
  noNetworkRequestsPerformed: true,
  noAssetBytesCopied: true,
  reusePolicy: "exact-v590-sealed-asset-bytes-readonly",
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredAuthorityGranted: false,
  },
  assets,
};
const overlay = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(earthOverlayPath, `${JSON.stringify(overlay, null, 2)}\n`);
atomicWrite(generatedConstantsPath, [
  "// Generated from the sealed v591 Sun and Earth asset overlays.",
  `export const CELESTIAL_CONVERGENCE_SUN_ASSET_OVERLAY_SHA256_V591 = "${sunOverlay.receiptSha256}" as const;`,
  `export const CELESTIAL_CONVERGENCE_EARTH_ASSET_OVERLAY_SHA256_V591 = "${overlay.receiptSha256}" as const;`,
  "",
].join("\n"));

console.log(JSON.stringify({
  status: overlay.status,
  assetCount: assets.length,
  baselineManifestSha256: baseline.manifestSha256,
  earthAssetOverlaySha256: overlay.receiptSha256,
  networkRequestsPerformed: 0,
  copiedAssetBytes: 0,
}, null, 2));
