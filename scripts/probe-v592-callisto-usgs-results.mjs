import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v592/metadata-probe-major-moon-usgs/callisto-correct-search-protocol.json");
const rawPath = resolve(root, "source-cache/v592/major-moons/usgs-search/callisto-correct-search-protocol.json");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`);
  rmSync(path, { force: true });
  renameSync(partial, path);
  return document;
}
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-callisto-usgs-results-existing-seal:${path}`);
  return document;
}

if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  const bytes = readFileSync(rawPath);
  assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, "v592-callisto-usgs-results-existing-drift");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(rawPath), "v592-callisto-usgs-results-untracked-existing");
const url = new URL("https://astrogeology.usgs.gov/search/results?target=Callisto&system=&p=1&accscope=&searchBar=global+mosaic");
assert(url.protocol === "https:" && url.hostname === "astrogeology.usgs.gov", "v592-callisto-usgs-results-url");

let response;
let bytes = Buffer.alloc(0);
let networkError = null;
try {
  response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": "Orbit-Atlas-v592-callisto-usgs-results-metadata-probe/1.0" },
    signal: AbortSignal.timeout(60_000),
  });
  bytes = Buffer.from(await response.arrayBuffer());
} catch (error) {
  networkError = error instanceof Error ? error.message : String(error);
}
const redirectLocation = response?.headers.get("location") ?? null;
const passed = !networkError && response?.status === 200 && response.url === url.href && !redirectLocation;
let document = null;
if (passed) {
  document = JSON.parse(bytes.toString("utf8"));
  assert(Array.isArray(document.results) && Number.isFinite(Number(document.total)), "v592-callisto-usgs-results-shape");
}
if (bytes.byteLength > 0) {
  mkdirSync(dirname(rawPath), { recursive: true });
  const partial = `${rawPath}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, rawPath);
}
const results = passed ? document.results.map((entry) => ({
  id: entry.id ?? null,
  title: entry.title ?? entry.name ?? null,
  slug: entry.slug ?? entry.url ?? entry.link ?? null,
  target: entry.target ?? entry.Target ?? null,
  description: String(entry.description ?? entry.abstract ?? "").replaceAll(/\s+/g, " ").slice(0, 1200),
  rawKeys: Object.keys(entry).sort()
})) : [];
const receipt = writeSealed(outputPath, {
  version: "v592-callisto-usgs-results-probe-v1",
  probedAt: new Date().toISOString(),
  status: passed ? "usgs-results-metadata-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
  target: "callisto",
  query: "global mosaic",
  policy: {
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualPayloadDownloaded: false,
    redirectFollowed: false,
    itemLevelLicenseReviewRequired: true,
    metadataDoesNotGrantVisualAssetAdmission: true
  },
  metadataRequest: {
    url: url.href,
    finalUrl: response?.url ?? null,
    status: response?.status ?? null,
    contentType: response?.headers.get("content-type") ?? "unreported",
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    outputPath: bytes.byteLength > 0 ? "source-cache/v592/major-moons/usgs-search/callisto-correct-search-protocol.json" : null,
    redirectLocation,
    networkError
  },
  total: passed ? Number(document.total) : 0,
  results,
  visualAssetAdmission: false
});
console.log(JSON.stringify({ status: receipt.status, total: receipt.total, results: receipt.results, receiptSha256: receipt.receiptSha256 }, null, 2));
