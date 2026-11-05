import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const query = '((lidvid like "*tempel*"))';
const requestUrl = new URL("https://pds.mcp.nasa.gov/api/search/1/products");
requestUrl.searchParams.set("limit", "100");
requestUrl.searchParams.set("q", query);
const outputPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-mcp-lidvid.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/pds-mcp-lidvid-tempel-1.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) { mkdirSync(dirname(path), { recursive: true }); const part = `${path}.part`; rmSync(part, { force: true }); writeFileSync(part, bytes, { flag: "wx" }); rmSync(path, { force: true }); renameSync(part, path); }
function writeSealed(path, unsigned) { const value = { ...unsigned, receiptSha256: canonicalSha(unsigned) }; atomicWrite(path, `${JSON.stringify(value, null, 2)}\n`); return value; }
function readSealed(path) { const value = JSON.parse(readFileSync(path, "utf8")); const unsigned = { ...value }; delete unsigned.receiptSha256; assert(value.receiptSha256 === canonicalSha(unsigned), `v591-tempel1-pds-lidvid-seal:${path}`); return value; }

assert(requestUrl.protocol === "https:" && requestUrl.hostname === "pds.mcp.nasa.gov" && !requestUrl.username && !requestUrl.password && !requestUrl.port, "v591-tempel1-pds-lidvid-url");
if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.request.url === requestUrl.href && existing.requestCount === 1, "v591-tempel1-pds-lidvid-existing");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

let response = null;
try {
  response = await fetch(requestUrl, { method: "GET", redirect: "manual", headers: { accept: "application/json", "user-agent": "Orbit-Atlas-v591-tempel1-pds-lidvid/1.0" }, signal: AbortSignal.timeout(120_000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const location = response.headers.get("location");
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  assert(![301, 302, 303, 307, 308].includes(response.status) && !location && response.url === requestUrl.href, `v591-tempel1-pds-lidvid-redirect:${response.status}:${location ?? "none"}`);
  atomicWrite(rawPath, bytes);
  let payload = null;
  try { payload = JSON.parse(bytes.toString("utf8")); } catch { /* preserve response SHA */ }
  const records = Array.isArray(payload?.data) ? payload.data : [];
  const candidates = records.map((record) => {
    const properties = record?.properties ?? record?._source ?? record ?? {};
    return {
      title: properties.title ?? properties["pds:Identification_Area.pds:title"] ?? null,
      lidvid: properties.lidvid ?? properties["pds:Identification_Area.pds:logical_identifier"] ?? record?.id ?? null,
      productClass: properties.product_class ?? properties["pds:Identification_Area.pds:product_class"] ?? null,
    };
  });
  const receipt = writeSealed(outputPath, {
    version: "v591-tempel-1-pds-mcp-lidvid-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: response.ok ? candidates.length > 0 ? "metadata-candidates-present-no-payload" : "metadata-complete-no-matching-product" : "blocked-pds-mcp-http-response",
    target: "tempel-1",
    requestCount: 1,
    request: { url: requestUrl.href, finalUrl: response.url, httpStatus: response.status, mediaType, bytes: bytes.length, sha256: sha256(bytes), rawPath: "source-cache/celestial-convergence-v591/tempel-1/pds-mcp-lidvid-tempel-1.json" },
    query,
    candidates,
    responseMessage: typeof payload?.message === "string" ? payload.message : typeof payload?.detail === "string" ? payload.detail : null,
    payloadDownloaded: false,
    sciencePayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
  });
  console.log(JSON.stringify({ status: receipt.status, httpStatus: response.status, hitCount: candidates.length, candidates: candidates.slice(0, 20), responseMessage: receipt.responseMessage, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (response === null) {
    const receipt = writeSealed(outputPath, { version: "v591-tempel-1-pds-mcp-lidvid-metadata-probe-v1", probedAt: new Date().toISOString(), status: "blocked-network-no-retry", target: "tempel-1", requestCount: 1, request: { url: requestUrl.href, finalUrl: null, httpStatus: null, mediaType: null, bytes: 0, sha256: null, rawPath: null }, query, candidates: [], payloadDownloaded: false, sciencePayloadDownloaded: false, automaticRetryPerformed: false, automaticReplacementPerformed: false, error: error instanceof Error ? error.message : String(error), license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" } });
    console.error(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}
