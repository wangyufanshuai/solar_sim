import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const pageMatch = /^page([1-9][0-9]*)$/.exec(process.argv[2] ?? "page1");
const page = pageMatch ? Number(pageMatch[1]) : 1;
assertPage(page);
const suffix = page === 1 ? "" : `-page${page}`;
const outputPath = resolve(root, `docs/release/v592/metadata-probe-nebula-broad${suffix}-v592.json`);
const blockedPath = resolve(root, `docs/release/v592/metadata-probe-nebula-broad${suffix}-blocked-v592.json`);
const queryUrl = new URL(page === 1
  ? "https://images-api.nasa.gov/search?q=nebula&media_type=image&page_size=100"
  : `https://images-api.nasa.gov/search?q=nebula&media_type=image&page_size=100&page=${page}`);
const allowedHosts = new Set(["images-api.nasa.gov", "images-assets.nasa.gov"]);

function assertPage(value) {
  if (!Number.isInteger(value) || value < 1 || value > 20) throw new Error(`v592-nebula-broad-page:${value}`);
}

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
function validateUrl(raw, requiredHost = null) {
  const url = new URL(raw);
  assert(url.protocol === "https:" && allowedHosts.has(url.hostname), `v592-nebula-broad-host:${url.hostname}`);
  assert(!requiredHost || url.hostname === requiredHost, `v592-nebula-broad-required-host:${url.hostname}`);
  assert(!url.username && !url.password && !url.port && !url.hash, "v592-nebula-broad-url-policy");
  return url;
}
function atomicWrite(path, document) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(path, document);
  return document;
}
function verifyExisting(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nebula-broad-existing-seal:${path}`);
  return document;
}

validateUrl(queryUrl.href, "images-api.nasa.gov");
if (existsSync(outputPath)) {
  const existing = verifyExisting(outputPath);
  console.log(JSON.stringify({
    status: "existing-receipt-verified-no-network",
    candidateCount: existing.candidates.length,
    receiptSha256: existing.receiptSha256,
  }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), "v592-nebula-broad-terminal-block-no-retry");

try {
  const response = await fetch(queryUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v592-nebula-broad-metadata-probe/1.0" },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === queryUrl.href, `v592-nebula-broad-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.byteLength <= 8 * 1024 * 1024, `v592-nebula-broad-response-size:${bytes.byteLength}`);
  const payload = JSON.parse(bytes.toString("utf8"));
  const items = payload.collection?.items;
  assert(Array.isArray(items), "v592-nebula-broad-items");
  const candidates = items.map((item) => {
    const data = Array.isArray(item.data) ? item.data[0] : null;
    assert(typeof data?.nasa_id === "string" && data.nasa_id.length > 0, "v592-nebula-broad-nasa-id");
    const assetManifestUrl = validateUrl(item.href, "images-assets.nasa.gov").href;
    const previewValue = (item.links ?? []).find((link) => link.rel === "preview" && typeof link.href === "string")?.href ?? null;
    return {
      nasaId: data.nasa_id,
      title: String(data.title ?? "").slice(0, 300),
      description: String(data.description ?? "").replaceAll(/\s+/g, " ").slice(0, 2400),
      keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 48) : [],
      center: data.center ?? null,
      creator: data.photographer ?? data.secondary_creator ?? null,
      dateCreated: data.date_created ?? null,
      assetManifestUrl,
      previewUrl: previewValue ? validateUrl(previewValue).href : null,
    };
  });
  const receipt = writeSealed(outputPath, {
    version: "v592-nebula-broad-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: "metadata-probe-complete-no-payload",
    query: "nebula",
    page,
    policy: {
      requestCount: 1,
      requestCountPerUrl: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      payloadDownloaded: false,
      redirectPolicy: "manual-no-redirect-accepted",
      itemLevelIdentityLicenseAndCleanFrameReviewRequired: true,
    },
    provenance: {
      archive: "NASA Image and Video Library API",
      host: queryUrl.hostname,
      licensePolicy: "NASA media usage guidelines; item-level public-domain review required before payload admission",
    },
    metadataRequest: {
      url: queryUrl.href,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "unreported",
      responseBytes: bytes.byteLength,
      responseSha256: sha256(bytes),
    },
    totalHits: payload.collection?.metadata?.total_hits ?? null,
    candidateCount: candidates.length,
    candidates,
    visualAssetAdmissionGranted: false,
  });
  console.log(JSON.stringify({
    status: receipt.status,
    totalHits: receipt.totalHits,
    candidateCount: receipt.candidateCount,
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v592-nebula-broad-metadata-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    metadataUrl: queryUrl.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({
    status: blocked.status,
    error: blocked.error,
    receiptSha256: blocked.receiptSha256,
  }, null, 2));
  process.exitCode = 1;
}
