import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const requestUrl = new URL("https://pds.mcp.nasa.gov/api/search/1/products");
requestUrl.searchParams.set("limit", "1001");
requestUrl.searchParams.set("q", 'pds:Target_Identification.pds:name eq "(1) Ceres"');
const outputPath = resolve(root, "docs/release/v591/metadata-probe-ceres-pds-target-products.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-registry-target-products.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(unsigned) { const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(outputPath, `${JSON.stringify(receipt, null, 2)}\n`); return receipt; }
function readSealed() { const value = JSON.parse(readFileSync(outputPath, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), "v591-ceres-pds-target-existing-seal"); return value; }

assert(requestUrl.protocol === "https:" && requestUrl.hostname === "pds.mcp.nasa.gov" && !requestUrl.username && !requestUrl.password && !requestUrl.port, "v591-ceres-pds-target-url");
if (existsSync(outputPath)) {
  const existing = readSealed();
  assert(existing.request.url === requestUrl.href && existing.requestCount === 1, "v591-ceres-pds-target-existing-identity");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

let response = null;
try {
  response = await fetch(requestUrl, { method: "GET", redirect: "manual", headers: { accept: "application/json", "user-agent": "Orbit-Atlas-v591-ceres-pds-target-products/1.0" }, signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  assert(![301, 302, 303, 307, 308].includes(response.status) && !location && response.url === requestUrl.href, `v591-ceres-pds-target-redirect:${response.status}:${location ?? "none"}`);
  atomicWrite(rawPath, bytes);
  const payload = JSON.parse(bytes.toString("utf8"));
  const records = Array.isArray(payload?.data) ? payload.data : [];
  const relevant = records.filter((record) => /dwarf_planet-ceres\.dawn\.shape-models-maps|hst\.ast-ceres\.images-albedo-shape/i.test(JSON.stringify(record)));
  const candidates = relevant.map((record) => {
    const properties = record.properties ?? {};
    return {
      id: record.id ?? null,
      type: record.type ?? null,
      title: Array.isArray(record.title) ? record.title[0] : record.title ?? null,
      labelUrl: record.metadata?.label_url ?? null,
      description: Array.isArray(properties.description) ? properties.description[0] : properties.description ?? null,
      dataFileRefs: properties["ops:Data_File_Info.ops:file_ref"] ?? [],
      dataFileNames: properties["ops:Data_File_Info.ops:file_name"] ?? [],
      dataFileSizes: properties["ops:Data_File_Info.ops:file_size"] ?? [],
      dataFileMd5: properties["ops:Data_File_Info.ops:md5_checksum"] ?? [],
      parentBundle: properties["ops:Provenance.ops:parent_bundle_identifier"] ?? [],
      parentCollection: properties["ops:Provenance.ops:parent_collection_identifier"] ?? [],
    };
  });
  const requiredIds = [
    "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:global_ceres_128_p_tab::1.0",
    "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:global_ceres_512_i_tab::1.0",
    "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:global_ceres_albedo_c_cub::1.0",
    "urn:nasa:pds:dwarf_planet-ceres.dawn.shape-models-maps:data:ceres_radius_g::1.0",
  ];
  const foundRequiredIds = requiredIds.filter((id) => candidates.some((candidate) => candidate.id === id));
  const receipt = writeSealed({
    version: "v591-ceres-pds-target-products-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: response.ok && foundRequiredIds.length === requiredIds.length ? "required-shape-map-products-present-no-payload" : response.ok ? "partial-shape-map-products-present-no-payload" : "blocked-pds-registry-http-response",
    target: "ceres",
    requestCount: 1,
    request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/ceres/pds-registry-target-products.json" },
    registryHitCount: payload.summary?.hits ?? null,
    returnedCount: records.length,
    relevantCount: candidates.length,
    requiredIds,
    foundRequiredIds,
    candidates,
    payloadDownloaded: false,
    sciencePayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
  });
  console.log(JSON.stringify({ status: receipt.status, returnedCount: records.length, relevantCount: candidates.length, foundRequiredIds, candidates: candidates.filter((candidate) => requiredIds.includes(candidate.id)), receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (response === null) {
    const receipt = writeSealed({ version: "v591-ceres-pds-target-products-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-network-no-retry", target: "ceres", requestCount: 1, request: { url: requestUrl.href, finalUrl: null, httpStatus: null, mediaType: null, bytes: 0, sha256: null, rawPath: null }, registryHitCount: null, returnedCount: 0, relevantCount: 0, requiredIds: [], foundRequiredIds: [], candidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error), license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" } });
    console.error(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}
