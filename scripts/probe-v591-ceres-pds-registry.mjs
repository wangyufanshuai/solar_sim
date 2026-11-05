import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const requestUrl = new URL("https://pds.mcp.nasa.gov/api/search/1/products");
requestUrl.searchParams.set("keywords", "ceres");
requestUrl.searchParams.set("limit", "100");
const outputPath = resolve(root, "docs/release/v591/metadata-probe-ceres-pds-registry.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/ceres/pds-registry-ceres.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(unsigned) { const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(outputPath, `${JSON.stringify(receipt, null, 2)}\n`); return receipt; }
function readSealed() { const value = JSON.parse(readFileSync(outputPath, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), "v591-ceres-pds-registry-existing-seal"); return value; }

assert(requestUrl.protocol === "https:" && requestUrl.hostname === "pds.mcp.nasa.gov" && !requestUrl.username && !requestUrl.password && !requestUrl.port, "v591-ceres-pds-registry-url");
if (existsSync(outputPath)) {
  const existing = readSealed();
  assert(existing.request.url === requestUrl.href && existing.requestCount === 1, "v591-ceres-pds-registry-existing-identity");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

let response = null;
try {
  response = await fetch(requestUrl, { method: "GET", redirect: "manual", headers: { accept: "application/json", "user-agent": "Orbit-Atlas-v591-ceres-pds-registry/1.0" }, signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  assert(![301, 302, 303, 307, 308].includes(response.status) && !location && response.url === requestUrl.href, `v591-ceres-pds-registry-redirect:${response.status}:${location ?? "none"}`);
  atomicWrite(rawPath, bytes);
  let payload = null;
  try { payload = JSON.parse(bytes.toString("utf8")); } catch { /* raw SHA remains authoritative */ }
  const records = Array.isArray(payload?.data) ? payload.data : [];
  const candidates = records.map((record) => {
    const properties = record?.properties ?? {};
    const text = JSON.stringify(record);
    return {
      title: properties.title ?? properties["pds:Identification_Area.pds:title"] ?? null,
      lidvid: properties.lidvid ?? properties["pds:Identification_Area.pds:logical_identifier"] ?? record?.id ?? null,
      productClass: properties.product_class ?? properties["pds:Identification_Area.pds:product_class"] ?? null,
      relevantToVisualShape: /shape|dsk|digital.?terrain|\bdtm\b|mosaic|global.?map|topograph/i.test(text),
      fileRefs: Object.entries(properties).filter(([key]) => /file_ref|file_name|url/i.test(key)).flatMap(([, value]) => Array.isArray(value) ? value : [value]).filter((value) => typeof value === "string"),
    };
  });
  const receipt = writeSealed({
    version: "v591-ceres-pds-registry-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: response.ok ? records.length > 0 ? "metadata-candidates-present-no-payload" : "metadata-complete-no-matching-product" : "blocked-pds-registry-http-response",
    target: "ceres",
    requestCount: 1,
    request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/ceres/pds-registry-ceres.json" },
    summary: payload?.summary ?? null,
    candidates,
    relevantCandidateCount: candidates.filter((candidate) => candidate.relevantToVisualShape).length,
    payloadDownloaded: false,
    sciencePayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
  });
  console.log(JSON.stringify({ status: receipt.status, httpStatus: response.status, hitCount: candidates.length, relevantCandidateCount: receipt.relevantCandidateCount, candidates: candidates.filter((candidate) => candidate.relevantToVisualShape), receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (response === null) {
    const receipt = writeSealed({ version: "v591-ceres-pds-registry-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-network-no-retry", target: "ceres", requestCount: 1, request: { url: requestUrl.href, finalUrl: null, httpStatus: null, mediaType: null, bytes: 0, sha256: null, rawPath: null }, summary: null, candidates: [], relevantCandidateCount: 0, payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error), license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" } });
    console.error(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}
