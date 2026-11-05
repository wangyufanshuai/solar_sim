import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const microtextureOverlayPath = "public/data/celestial-convergence-v591/bennu-asset-overlay.json";
const bodies = [
  {
    body: "eros",
    acquisitionPath: "docs/release/v591/acquisition-assets-nasa-git-blobs/eros-nasa-shape-source.json",
    modelReceiptPath: "docs/release/v591/eros-model-lod-receipt-v591.json",
    substrate: "bounded-s-type-silicate-reference",
    reflectance: "oren-nayar-plus-bounded-opposition-no-glossy-specular",
  },
  {
    body: "kleopatra",
    acquisitionPath: "docs/release/v591/acquisition-assets-nasa-git-blobs/kleopatra-nasa-shape-source.json",
    modelReceiptPath: "docs/release/v591/kleopatra-model-lod-receipt-v591.json",
    substrate: "bounded-metal-rich-m-type-reference",
    reflectance: "oren-nayar-plus-bounded-metallic-edge-response-no-glossy-specular",
  },
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function readSealed(path) {
  const value = JSON.parse(readFileSync(resolve(root, path), "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-small-body-overlay-seal:${path}`);
  return value;
}
function fileIdentity(path) {
  const bytes = readFileSync(resolve(root, path));
  return { bytes: bytes.byteLength, sha256: sha256(bytes) };
}
function atomicJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}
const microtextureOverlay = readSealed(microtextureOverlayPath);
assert(microtextureOverlay.version === "v591-bennu-asset-overlay-v1" && microtextureOverlay.assets?.length === 3, "v591-small-body-overlay-microtexture-source");
const summaries = [];
for (const definition of bodies) {
  const acquisition = readSealed(definition.acquisitionPath);
  const modelReceipt = readSealed(definition.modelReceiptPath);
  assert(acquisition.status === "committed-single-request-no-retry" && acquisition.asset?.body === definition.body, `v591-${definition.body}-overlay-acquisition`);
  assert(modelReceipt.status === "three-lod-nasa-shape-model-ready-for-runtime-admission" && modelReceipt.body === definition.body, `v591-${definition.body}-overlay-model`);
  assert(modelReceipt.source.acquisitionReceiptSha256 === acquisition.receiptSha256 && modelReceipt.lods?.length === 3, `v591-${definition.body}-overlay-model-chain`);
  for (const [index, lod] of modelReceipt.lods.entries()) {
    const current = fileIdentity(lod.path);
    assert(lod.lod === index && current.bytes === lod.bytes && current.sha256 === lod.sha256 && lod.extensionsUsed.includes("EXT_meshopt_compression"), `v591-${definition.body}-overlay-lod:${index}`);
  }
  const microtextureReuse = microtextureOverlay.assets.map((asset) => ({
    id: asset.id.replace("bennu-", `${definition.body}-`),
    inheritedAssetId: asset.id,
    body: definition.body,
    role: asset.role,
    sourcePath: asset.source.path,
    sourceSha256: asset.source.sha256,
    license: asset.source.license,
    observationLimit: `Exact-byte CC0 microtexture reuse for bounded presentation variation only; it is not ${definition.body} observation data.`,
    variants: asset.variants,
    exactByteReuse: true,
    presentationOnly: true,
  }));
  const unsigned = {
    version: "v591-nasa-small-body-asset-overlay-v1",
    generatedAt: "2026-08-13T00:00:00Z",
    status: `${definition.body}-assets-derived-awaiting-runtime-admission`,
    body: definition.body,
    acquisitionReceiptPath: definition.acquisitionPath,
    acquisitionReceiptSha256: acquisition.receiptSha256,
    modelLodReceiptPath: definition.modelReceiptPath,
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
      sourceDetailCeiling: modelReceipt.sourceDetailCeiling,
      printableSplitReconstruction: modelReceipt.normalized.printableSplitReconstruction ?? null,
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
      substrate: definition.substrate,
      microtexture: `poly-haven-cc0-presentation-only-not-${definition.body}-observation`,
      reflectance: definition.reflectance,
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
  const outputPath = resolve(root, `public/data/celestial-convergence-v591/${definition.body}-asset-overlay.json`);
  atomicJson(outputPath, receipt);
  summaries.push({ body: definition.body, lods: receipt.model.lods.map(({ lod, triangleCount, bytes }) => ({ lod, triangleCount, bytes })), receiptSha256: receipt.receiptSha256 });
}
console.log(JSON.stringify({ status: "eros-kleopatra-overlays-ready", bodies: summaries }, null, 2));
