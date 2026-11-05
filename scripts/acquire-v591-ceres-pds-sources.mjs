import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const metadataPath = "docs/release/v591/metadata-probe-ceres-pds-target-products.json";
const aggregatePath = resolve(root, "docs/release/v591/acquisition-asset-ceres-pds-shape-maps.json");
const receiptRoot = resolve(root, "docs/release/v591/acquisition-assets-ceres-pds");
const cacheRoot = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const md5 = (bytes) => createHash("md5").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }
function readSealed(path, field = "receiptSha256") { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned[field]; assert(value[field] === canonicalSha(unsigned), `v591-ceres-pds-seal:${path}`); return value; }

const metadata = readSealed(resolve(root, metadataPath));
assert(metadata.status === "required-shape-map-products-present-no-payload" && metadata.requestCount === 1 && metadata.automaticRetryPerformed === false && metadata.automaticReplacementPerformed === false, "v591-ceres-pds-metadata-policy");
const productIds = Object.freeze({
  shape: "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:global_ceres_128_p_tab::1.0",
  albedo: "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:global_ceres_albedo_c_cub::1.0",
  radius: "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:ceres_radius_g::1.0",
});
const definitions = [];
for (const [role, productId] of Object.entries(productIds)) {
  const product = metadata.candidates.find((candidate) => candidate.id === productId);
  assert(product && product.labelUrl && product.dataFileRefs?.length === 1 && product.dataFileNames?.length === 1 && product.dataFileSizes?.length === 1 && product.dataFileMd5?.length === 1, `v591-ceres-pds-product:${role}`);
  const dataName = product.dataFileNames[0];
  definitions.push({ id: `ceres-${role}-label`, role: `${role}-pds4-label`, sourceUrl: product.labelUrl, outputPath: resolve(cacheRoot, `${role}.xml`), relativeOutputPath: `source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/${role}.xml`, expectedBytes: null, expectedMd5: null, productId, media: "xml" });
  definitions.push({ id: `ceres-${role}-data`, role: role === "shape" ? "global-plt-shape" : role === "albedo" ? "global-relative-albedo-isis-cube" : "global-radius-geotiff", sourceUrl: product.dataFileRefs[0], outputPath: resolve(cacheRoot, dataName), relativeOutputPath: `source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/${dataName}`, expectedBytes: Number(product.dataFileSizes[0]), expectedMd5: product.dataFileMd5[0], productId, media: role === "shape" ? "tab" : role === "albedo" ? "isis-cube" : "geotiff" });
}

if (existsSync(aggregatePath)) {
  const aggregate = readSealed(aggregatePath);
  assert(aggregate.metadataReceiptSha256 === metadata.receiptSha256 && aggregate.assets?.length === definitions.length, "v591-ceres-pds-existing-aggregate");
  for (const asset of aggregate.assets) {
    const bytes = readFileSync(resolve(root, asset.outputPath));
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v591-ceres-pds-existing-file:${asset.id}`);
  }
  console.log(JSON.stringify({ status: "existing-acquisition-verified-no-network", receiptSha256: aggregate.receiptSha256 }, null, 2));
  process.exit(0);
}

const receipts = [];
for (const definition of definitions) {
  const successPath = resolve(receiptRoot, `${definition.id}.json`);
  const blockedPath = resolve(receiptRoot, `${definition.id}-blocked.json`);
  if (existsSync(blockedPath)) {
    const blocked = readSealed(blockedPath);
    throw new Error(`v591-ceres-pds-terminal-block:${definition.id}:${blocked.receiptSha256}`);
  }
  if (existsSync(successPath)) {
    const existing = readSealed(successPath);
    const bytes = readFileSync(definition.outputPath);
    assert(existing.asset.sourceUrl === definition.sourceUrl && existing.asset.outputPath === definition.relativeOutputPath && bytes.byteLength === existing.asset.bytes && sha256(bytes) === existing.asset.sha256, `v591-ceres-pds-existing-asset:${definition.id}`);
    receipts.push(existing);
    continue;
  }
  const sourceUrl = new URL(definition.sourceUrl);
  assert(sourceUrl.protocol === "https:" && sourceUrl.hostname === "sbnarchive.psi.edu" && !sourceUrl.username && !sourceUrl.password && !sourceUrl.port, `v591-ceres-pds-url:${definition.id}`);
  assert(!existsSync(definition.outputPath) && !existsSync(`${definition.outputPath}.part`), `v591-ceres-pds-output-exists:${definition.id}`);
  let response = null;
  try {
    response = await fetch(sourceUrl, { method: "GET", redirect: "manual", headers: { accept: "*/*", "user-agent": `Orbit-Atlas-v591-${definition.id}/1.0` }, signal: AbortSignal.timeout(180_000) });
    const bytes = Buffer.from(await response.arrayBuffer());
    const location = response.headers.get("location");
    const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
    assert(![301, 302, 303, 307, 308].includes(response.status) && !location && response.url === sourceUrl.href, `v591-ceres-pds-redirect:${definition.id}:${response.status}:${location ?? "none"}`);
    assert(response.ok, `v591-ceres-pds-http:${definition.id}:${response.status}`);
    assert(bytes.length > 0 && (definition.expectedBytes === null || bytes.length === definition.expectedBytes), `v591-ceres-pds-bytes:${definition.id}:${bytes.length}`);
    assert(definition.expectedMd5 === null || md5(bytes) === definition.expectedMd5, `v591-ceres-pds-md5:${definition.id}`);
    atomicWrite(definition.outputPath, bytes);
    const receipt = writeSealed(successPath, {
      version: "v591-ceres-pds-source-acquisition-v1",
      acquiredAt: new Date().toISOString(),
      status: "committed-single-request-no-retry",
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      metadataReceiptSha256: metadata.receiptSha256,
      asset: {
        id: definition.id,
        target: "ceres",
        role: definition.role,
        productId: definition.productId,
        sourceUrl: sourceUrl.href,
        finalUrl: response.url,
        outputPath: definition.relativeOutputPath,
        bytes: bytes.length,
        sha256: sha256(bytes),
        md5: md5(bytes),
        expectedMd5: definition.expectedMd5,
        mediaType,
        format: definition.media,
        license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
        observationIdentity: "NASA PDS4 dwarf_planet-ceres.dawn.shape-models-maps v2.0",
        presentationOnly: true,
        scientificAuthority: false,
      },
    });
    receipts.push(receipt);
  } catch (error) {
    rmSync(`${definition.outputPath}.part`, { force: true });
    const blocked = writeSealed(blockedPath, {
      version: "v591-ceres-pds-source-acquisition-blocked-v1",
      failedAt: new Date().toISOString(),
      status: "blocked-no-automatic-retry",
      target: "ceres",
      assetId: definition.id,
      sourceUrl: definition.sourceUrl,
      requestCount: 1,
      requestStarted: true,
      httpStatus: response?.status ?? null,
      payloadCommitted: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      metadataReceiptSha256: metadata.receiptSha256,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`v591-ceres-pds-acquisition-blocked:${definition.id}:${blocked.receiptSha256}`, { cause: error });
  }
}

const aggregate = writeSealed(aggregatePath, {
  version: "v591-ceres-pds-shape-maps-acquisition-v1",
  acquiredAt: new Date().toISOString(),
  status: "six-assets-committed-single-request-each-no-retry",
  target: "ceres",
  requestCount: definitions.length,
  automaticRetryPerformed: false,
  automaticReplacementPerformed: false,
  metadataReceiptSha256: metadata.receiptSha256,
  assets: receipts.map((receipt) => ({ ...receipt.asset, acquisitionReceiptSha256: receipt.receiptSha256 })),
  authorityState: { presentationOnly: true, scientificAuthorityChanged: false, scientificPayloadWriteback: false, measuredAuthorityGranted: false },
});
console.log(JSON.stringify({ status: aggregate.status, assets: aggregate.assets.map(({ id, bytes, sha256: assetSha256 }) => ({ id, bytes, sha256: assetSha256 })), receiptSha256: aggregate.receiptSha256 }, null, 2));
