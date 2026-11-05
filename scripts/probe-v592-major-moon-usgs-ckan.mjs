import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-usgs-ckan-probes.json"), "utf8"));
const probeId = process.argv[2];
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-usgs-ckan-existing-seal:${path}`);
  return document;
}

assert(definitions.version === "v592-major-moon-usgs-ckan-probes-v1", "v592-major-moon-usgs-ckan-definition-version");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.visualPayloadDownloadAllowed === false,
  "v592-major-moon-usgs-ckan-policy",
);
const probe = definitions.probes.find((entry) => entry.id === probeId);
assert(probe, `v592-major-moon-usgs-ckan-probe:${probeId}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-usgs-ckan/${probe.id}.json`);
const rawPath = resolve(root, `source-cache/v592/major-moons/usgs-ckan/${probe.id}.json`);
if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  const bytes = readFileSync(rawPath);
  assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, `v592-major-moon-usgs-ckan-existing-drift:${probeId}`);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", probeId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(rawPath), `v592-major-moon-usgs-ckan-untracked-existing:${probeId}`);
const url = new URL(`https://astrogeology.usgs.gov/ckan/api/3/action/package_search?q=${encodeURIComponent(probe.query)}&rows=100`);
assert(url.protocol === "https:" && definitions.policy.allowedHosts.includes(url.hostname), `v592-major-moon-usgs-ckan-host:${url.hostname}`);

let response;
let bytes = Buffer.alloc(0);
let networkError = null;
try {
  response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${probe.id}-usgs-ckan-metadata-probe/1.0` },
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
  assert(document.success === true && Array.isArray(document.result?.results), `v592-major-moon-usgs-ckan-response:${probeId}`);
}
if (bytes.byteLength > 0) {
  mkdirSync(dirname(rawPath), { recursive: true });
  const partial = `${rawPath}.part`;
  writeFileSync(partial, bytes);
  renameSync(partial, rawPath);
}
const packages = passed ? document.result.results.map((entry) => ({
  id: entry.id,
  name: entry.name,
  title: entry.title,
  notes: String(entry.notes ?? "").replaceAll(/\s+/g, " ").slice(0, 1200),
  metadataCreated: entry.metadata_created ?? null,
  metadataModified: entry.metadata_modified ?? null,
  organization: entry.organization?.title ?? null,
  licenseId: entry.license_id ?? null,
  licenseTitle: entry.license_title ?? null,
  resources: Array.isArray(entry.resources) ? entry.resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    format: resource.format,
    url: resource.url,
    urlType: resource.url_type ?? null,
    size: resource.size ?? null,
    hash: resource.hash ?? null,
    created: resource.created ?? null,
    lastModified: resource.last_modified ?? null
  })) : []
})) : [];
const receipt = writeSealed(outputPath, {
  version: "v592-major-moon-usgs-ckan-probe-v1",
  probedAt: new Date().toISOString(),
  status: passed ? "usgs-ckan-metadata-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
  probeId: probe.id,
  target: probe.target,
  query: probe.query,
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
    outputPath: bytes.byteLength > 0 ? `source-cache/v592/major-moons/usgs-ckan/${probe.id}.json` : null,
    redirectLocation,
    networkError
  },
  totalMatches: passed ? document.result.count : 0,
  packages,
  visualAssetAdmission: false
});
console.log(JSON.stringify({
  status: receipt.status,
  probeId,
  target: probe.target,
  totalMatches: receipt.totalMatches,
  packagePreview: packages.slice(0, 20).map(({ id, name, title, licenseId, licenseTitle, resources }) => ({ id, name, title, licenseId, licenseTitle, resources: resources.map(({ name, format, url, size }) => ({ name, format, url, size })) })),
  receiptSha256: receipt.receiptSha256,
}, null, 2));
