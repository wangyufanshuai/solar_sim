import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const acquisitionPath = "docs/release/v591/acquisition-assets-nasa-small-bodies/vesta-nasa-shape-source.json";
const modelReceiptPath = "docs/release/v591/vesta-model-lod-receipt-v591.json";
const microtextureOverlayPath = "public/data/celestial-convergence-v591/bennu-asset-overlay.json";
const outputPath = resolve(root, "public/data/celestial-convergence-v591/vesta-asset-overlay.json");

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
function readSealed(path) {
  const value = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-vesta-overlay-seal:${path}`);
  return value;
}
function fileIdentity(path) {
  const bytes = readFileSync(resolve(root, path));
  return { bytes: bytes.byteLength, sha256: sha256(bytes) };
}
function writeJsonAtomically(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

const acquisition = readSealed(acquisitionPath);
const modelReceipt = readSealed(modelReceiptPath);
const microtextureOverlay = readSealed(microtextureOverlayPath);
assert(acquisition.status === "committed-single-request-no-retry" && acquisition.asset?.body === "vesta", "v591-vesta-overlay-acquisition");
assert(modelReceipt.status === "three-lod-nasa-shape-model-ready-for-runtime-admission" && modelReceipt.body === "vesta", "v591-vesta-overlay-model");
assert(modelReceipt.source.acquisitionReceiptSha256 === acquisition.receiptSha256, "v591-vesta-overlay-model-source-chain");
assert(modelReceipt.lods?.length === 3, "v591-vesta-overlay-model-lods");
for (const [index, lod] of modelReceipt.lods.entries()) {
  const identity = fileIdentity(lod.path);
  assert(lod.lod === index && identity.bytes === lod.bytes && identity.sha256 === lod.sha256, `v591-vesta-overlay-model-lod:${index}`);
  assert(lod.extensionsUsed.includes("EXT_meshopt_compression"), `v591-vesta-overlay-model-meshopt:${index}`);
}
assert(microtextureOverlay.version === "v591-bennu-asset-overlay-v1" && microtextureOverlay.assets?.length === 3, "v591-vesta-overlay-microtexture-source");
assert(microtextureOverlay.proceduralFallback === false, "v591-vesta-overlay-microtexture-fallback");

const microtextureReuse = microtextureOverlay.assets.map((asset) => ({
  id: asset.id.replace("bennu-", "vesta-"),
  inheritedAssetId: asset.id,
  body: "vesta",
  role: asset.role,
  sourcePath: asset.source.path,
  sourceSha256: asset.source.sha256,
  license: asset.source.license,
  observationLimit: `Exact-byte CC0 microtexture reuse for bounded presentation variation only; it is not Vesta observation data. Inherited policy: ${asset.source.observationLimit}`,
  variants: Object.fromEntries(Object.entries(asset.variants).map(([variant, file]) => [variant, {
    url: file.url,
    bytes: file.bytes,
    sha256: file.sha256,
    width: file.width,
    height: file.height,
    format: file.format,
    colorSpace: file.colorSpace,
    compression: file.compression,
  }])),
  exactByteReuse: true,
  presentationOnly: true,
}));

const unsigned = {
  version: "v591-vesta-asset-overlay-v1",
  generatedAt: "2026-08-12T00:00:00Z",
  status: "vesta-assets-derived-awaiting-runtime-admission",
  acquisitionReceiptPath: acquisitionPath,
  acquisitionReceiptSha256: acquisition.receiptSha256,
  modelLodReceiptPath: modelReceiptPath,
  modelLodReceiptSha256: modelReceipt.receiptSha256,
  noNetworkRequestsPerformedDuringDerivation: true,
  noTextureBytesCopied: true,
  derivationDeterministic: true,
  proceduralFallback: false,
  model: {
    candidate: "v591-owned",
    sourcePath: modelReceipt.source.path,
    sourceBytes: modelReceipt.source.bytes,
    sourceSha256: modelReceipt.source.sha256,
    sourceUrl: acquisition.asset.sourceUrl,
    sourceFinalUrl: acquisition.asset.finalUrl,
    sourceRepositoryPath: acquisition.asset.repositoryPath,
    sourceGitBlobSha1: acquisition.asset.gitBlobSha1,
    license: acquisition.asset.license,
    observationIdentity: acquisition.asset.observationIdentity,
    observationLimit: acquisition.asset.observationLimit,
    units: modelReceipt.normalized.units,
    pivot: modelReceipt.normalized.pivot,
    rotationAxis: modelReceipt.normalized.rotationAxis,
    normals: true,
    watertight: modelReceipt.normalized.watertight,
    lods: modelReceipt.lods.map((lod) => ({
      lod: lod.lod,
      path: lod.path,
      bytes: lod.bytes,
      sha256: lod.sha256,
      triangleCount: lod.triangleCount,
      vertexCount: lod.vertexCount,
      normals: true,
      meshopt: true,
      pivot: modelReceipt.normalized.pivot,
      units: modelReceipt.normalized.units,
      rotationAxis: modelReceipt.normalized.rotationAxis,
    })),
  },
  microtextureReuse: {
    candidate: "v591-readonly-exact-byte-reuse",
    sourceOverlayPath: microtextureOverlayPath,
    sourceOverlaySha256: microtextureOverlay.receiptSha256,
    noTextureBytesCopied: true,
    assets: microtextureReuse,
  },
  materialPolicy: {
    substrate: "bounded-basaltic-achondrite-reference",
    microtexture: "poly-haven-cc0-presentation-only-not-vesta-observation",
    reflectance: "oren-nayar-plus-bounded-opposition-no-glossy-specular",
  },
  authorityState: {
    presentationOnly: true,
    scientificAuthorityChanged: false,
    scientificPayloadWriteback: false,
    measuredPhotometryClaim: false,
    measuredAuthorityGranted: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
writeJsonAtomically(outputPath, receipt);
console.log(JSON.stringify({
  status: receipt.status,
  modelLods: receipt.model.lods.map(({ lod, bytes, sha256: digest, triangleCount }) => ({ lod, bytes, sha256: digest, triangleCount })),
  microtextureAssets: receipt.microtextureReuse.assets.map(({ id, inheritedAssetId, exactByteReuse }) => ({ id, inheritedAssetId, exactByteReuse })),
  receiptSha256: receipt.receiptSha256,
}, null, 2));
