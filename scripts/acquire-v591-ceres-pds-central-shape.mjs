import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const sourceUrl = new URL("https://pds.nasa.gov/data/pds4/dawn/dwarf_planet-ceres.dawn.shape-models-maps_v2.0/data/global/ceres_128_p.tab");
const outputPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/ceres_128_p.tab");
const relativeOutputPath = "source-cache/celestial-convergence-v591/ceres/pds-shape-models-maps-v2/ceres_128_p.tab";
const receiptPath = resolve(root, "docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-central.json");
const blockedPath = resolve(root, "docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-central-blocked.json");
const metadataPath = resolve(root, "docs/release/v591/metadata-probe-ceres-pds-target-products.json");
const originalBlockedPath = resolve(root, "docs/release/v591/acquisition-assets-ceres-pds/ceres-shape-data-blocked.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const md5 = (bytes) => createHash("md5").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-ceres-central-shape-seal:${path}`); return value; }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }

const metadata = readSealed(metadataPath);
const originalBlocked = readSealed(originalBlockedPath);
const product = metadata.candidates.find((candidate) => candidate.id === "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:global_ceres_128_p_tab::1.0");
assert(product?.dataFileSizes?.[0] === "13948786" && product?.dataFileMd5?.[0] === "483bec4a22b8f2e34df631367ea6aced", "v591-ceres-central-shape-product");
assert(originalBlocked.status === "blocked-no-automatic-retry" && originalBlocked.sourceUrl === product.dataFileRefs[0] && originalBlocked.requestCount === 1 && originalBlocked.automaticRetryPerformed === false, "v591-ceres-central-shape-negative-chain");
assert(sourceUrl.protocol === "https:" && sourceUrl.hostname === "pds.nasa.gov" && !sourceUrl.username && !sourceUrl.password && !sourceUrl.port, "v591-ceres-central-shape-url");
if (existsSync(receiptPath)) {
  const existing = readSealed(receiptPath);
  const bytes = readFileSync(outputPath);
  assert(existing.asset.sourceUrl === sourceUrl.href && bytes.byteLength === existing.asset.bytes && sha256(bytes) === existing.asset.sha256, "v591-ceres-central-shape-existing");
  console.log(JSON.stringify({ status: "existing-acquisition-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
if (existsSync(blockedPath)) {
  const blocked = readSealed(blockedPath);
  throw new Error(`v591-ceres-central-shape-terminal-block:${blocked.receiptSha256}`);
}
assert(!existsSync(outputPath) && !existsSync(`${outputPath}.part`), "v591-ceres-central-shape-output-exists");
let response = null;
try {
  response = await fetch(sourceUrl, { method: "GET", redirect: "manual", headers: { accept: "text/plain,application/octet-stream", "user-agent": "Orbit-Atlas-v591-ceres-pds-central-shape/1.0" }, signal: AbortSignal.timeout(300_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  assert(![301, 302, 303, 307, 308].includes(response.status) && !location && response.url === sourceUrl.href, `v591-ceres-central-shape-redirect:${response.status}:${location ?? "none"}`);
  assert(response.ok && bytes.length === 13948786 && md5(bytes) === "483bec4a22b8f2e34df631367ea6aced", `v591-ceres-central-shape-payload:${response.status}:${bytes.length}`);
  atomicWrite(outputPath, bytes);
  const receipt = writeSealed(receiptPath, {
    version: "v591-ceres-pds-central-mirror-acquisition-v1",
    acquiredAt: new Date().toISOString(),
    status: "committed-explicit-central-mirror-single-request-no-retry",
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    sourceSelection: "explicit-pds-central-mirror-after-original-sbn-timeout-negative-evidence",
    metadataReceiptSha256: metadata.receiptSha256,
    originalBlockedReceiptSha256: originalBlocked.receiptSha256,
    asset: { id: "ceres-shape-data", target: "ceres", role: "global-plt-shape", productId: product.id, sourceUrl: sourceUrl.href, finalUrl: response.url, outputPath: relativeOutputPath, bytes: bytes.length, sha256: sha256(bytes), md5: md5(bytes), expectedMd5: product.dataFileMd5[0], mediaType: (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase(), format: "pds4-tab", license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" }, observationIdentity: "NASA PDS4 Ceres 100K-vector PLT shape at 5.3 km resolution", presentationOnly: true, scientificAuthority: false },
  });
  console.log(JSON.stringify({ status: receipt.status, asset: { bytes: receipt.asset.bytes, sha256: receipt.asset.sha256, md5: receipt.asset.md5 }, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(`${outputPath}.part`, { force: true });
  const blocked = writeSealed(blockedPath, { version: "v591-ceres-pds-central-mirror-acquisition-blocked-v1", failedAt: new Date().toISOString(), status: "blocked-no-automatic-retry", target: "ceres", assetId: "ceres-shape-data", sourceUrl: sourceUrl.href, requestCount: 1, requestStarted: true, httpStatus: response?.status ?? null, payloadCommitted: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, metadataReceiptSha256: metadata.receiptSha256, originalBlockedReceiptSha256: originalBlocked.receiptSha256, error: error instanceof Error ? error.message : String(error) });
  throw new Error(`v591-ceres-central-shape-blocked:${blocked.receiptSha256}`, { cause: error });
}
