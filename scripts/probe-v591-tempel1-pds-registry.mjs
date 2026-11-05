import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-registry.json");
const redirectBlockedPath = resolve(root, "docs/release/v591/metadata-probe-tempel-1-pds-registry-redirect-blocked.json");
const rawPath = resolve(root, "source-cache/celestial-convergence-v591/tempel-1/pds-registry-tempel-1.json");
const query = '((title like "*Tempel*"))';
const requestUrl = new URL("https://pds.nasa.gov/api/search/1/products");
requestUrl.searchParams.set("q", query);
requestUrl.searchParams.set("limit", "100");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function writeAtomic(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  writeAtomic(path, `${JSON.stringify(sealed, null, 2)}\n`);
  return sealed;
}
function readSealed(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), "v591-tempel1-pds-registry-existing-seal");
  return value;
}

if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.request?.url === requestUrl.href && existing.requestCount === 1, "v591-tempel1-pds-registry-existing-identity");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

if (existsSync(redirectBlockedPath)) {
  const existing = readSealed(redirectBlockedPath);
  assert(existing.status === "blocked-whitelisted-redirect-not-followed" && existing.request?.url === requestUrl.href, "v591-tempel1-pds-registry-existing-redirect");
  console.log(JSON.stringify({ status: "existing-redirect-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

if (process.argv.includes("--reconcile-observed-redirect")) {
  const redirectUrl = "https://pds.mcp.nasa.gov/api/search/1/products?limit=100&q=%28%28title+like+%22*Tempel*%22%29%29";
  const receipt = writeSealed(redirectBlockedPath, {
    version: "v591-tempel-1-pds-registry-redirect-blocked-v1",
    reconciledAt: "2026-08-13T16:00:00.000Z",
    status: "blocked-whitelisted-redirect-not-followed",
    target: "tempel-1",
    requestCount: 1,
    request: {
      url: requestUrl.href,
      finalUrl: requestUrl.href,
      httpStatus: 307,
      location: redirectUrl,
      bodyBytesVerified: false,
      bodySha256: null,
    },
    query,
    payloadDownloaded: false,
    sciencePayloadDownloaded: false,
    automaticRedirectFollowed: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    reconciliationBasis: "captured-process-output-from-the-single-request;response-body-was-not-retained",
    nextAllowedAction: "explicit-new-single-request-to-whitelisted-pds.mcp.nasa.gov-url",
    license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
  });
  console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  process.exit(0);
}

assert(requestUrl.protocol === "https:" && requestUrl.hostname === "pds.nasa.gov" && !requestUrl.username && !requestUrl.password && !requestUrl.port, "v591-tempel1-pds-registry-url");
let response;
try {
  response = await fetch(requestUrl, {
    method: "GET",
    redirect: "manual",
    headers: { accept: "application/json", "user-agent": "Orbit-Atlas-v591-tempel1-pds-registry/1.0" },
    signal: AbortSignal.timeout(120_000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const noRedirect = ![301, 302, 303, 307, 308].includes(response.status) && !response.headers.get("location");
  if (!noRedirect || response.url !== requestUrl.href) {
    const receipt = writeSealed(redirectBlockedPath, {
      version: "v591-tempel-1-pds-registry-redirect-blocked-v1",
      observedAt: new Date().toISOString(),
      status: "blocked-whitelisted-redirect-not-followed",
      target: "tempel-1",
      requestCount: 1,
      request: {
        url: requestUrl.href,
        finalUrl: response.url,
        httpStatus: response.status,
        location: response.headers.get("location"),
        bodyBytesVerified: true,
        bodyBytes: bytes.length,
        bodySha256: sha256(bytes),
      },
      query,
      payloadDownloaded: false,
      sciencePayloadDownloaded: false,
      automaticRedirectFollowed: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      nextAllowedAction: "explicit-new-single-request-to-a-validated-whitelisted-redirect-url",
      license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
    });
    console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
    process.exit(0);
  }
  writeAtomic(rawPath, bytes);
  let payload = null;
  try { payload = JSON.parse(bytes.toString("utf8")); } catch { /* receipt preserves the raw response SHA */ }
  const records = Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.products) ? payload.products
      : Array.isArray(payload?.items) ? payload.items
        : [];
  const candidates = records
    .map((record) => {
      const properties = record?.properties ?? record?._source ?? record ?? {};
      const title = properties.title ?? properties["pds:Identification_Area.pds:title"] ?? null;
      const lidvid = properties.lidvid ?? properties["pds:Identification_Area.pds:logical_identifier"] ?? record?.id ?? null;
      const text = JSON.stringify(record);
      return { title, lidvid, tempelIdentity: /tempel\s*1|9p(?:\/|\b)|deep.?impact/i.test(text), record };
    })
    .filter((candidate) => candidate.tempelIdentity)
    .map(({ title, lidvid }) => ({ title, lidvid }));
  const receipt = writeSealed(outputPath, {
    version: "v591-tempel-1-pds-registry-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: response.ok
      ? candidates.length > 0 ? "metadata-candidates-present-no-payload" : "metadata-complete-no-matching-product"
      : "blocked-pds-registry-http-response",
    target: "tempel-1",
    requestCount: 1,
    request: {
      url: requestUrl.href,
      finalUrl: response.url,
      httpStatus: response.status,
      mediaType,
      bytes: bytes.length,
      sha256: sha256(bytes),
      rawPath: "source-cache/celestial-convergence-v591/tempel-1/pds-registry-tempel-1.json",
    },
    query,
    candidates,
    payloadDownloaded: false,
    sciencePayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
    responseMessage: typeof payload?.message === "string" ? payload.message : null,
  });
  console.log(JSON.stringify({ status: receipt.status, httpStatus: response.status, candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  if (!response) {
    const receipt = writeSealed(outputPath, {
      version: "v591-tempel-1-pds-registry-metadata-probe-v1",
      probedAt: new Date().toISOString(),
      status: "blocked-network-no-retry",
      target: "tempel-1",
      requestCount: 1,
      request: { url: requestUrl.href, finalUrl: null, httpStatus: null, mediaType: null, bytes: 0, sha256: null, rawPath: null },
      query,
      candidates: [],
      payloadDownloaded: false,
      sciencePayloadDownloaded: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
      license: { id: "NASA-PDS-public-data", url: "https://pds.nasa.gov/datastandards/documents/policy/" },
    });
    console.error(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256 }, null, 2));
  }
  throw error;
}
