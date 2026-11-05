import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-usgs-direct-probes.json"), "utf8"));
const probeId = process.argv[2];
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-usgs-direct-existing-seal:${path}`);
  return document;
}

assert(definitions.version === "v592-major-moon-usgs-direct-probes-v1", "v592-major-moon-usgs-direct-definition-version");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.visualPayloadDownloadAllowed === false
  && definitions.policy.guessedUrlsDoNotGrantAdmission === true,
  "v592-major-moon-usgs-direct-policy",
);
const probe = definitions.probes.find((entry) => entry.id === probeId);
assert(probe, `v592-major-moon-usgs-direct-probe:${probeId}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-usgs-direct/${probe.id}.json`);
const rawPath = resolve(root, `source-cache/v592/major-moons/usgs-direct/${probe.id}.response`);

if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  if (existing.metadataRequest.outputPath) {
    const bytes = readFileSync(resolve(root, existing.metadataRequest.outputPath));
    assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, `v592-major-moon-usgs-direct-existing-drift:${probeId}`);
  }
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", probeId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

assert(!existsSync(rawPath), `v592-major-moon-usgs-direct-untracked-existing:${probeId}`);
const allowedHosts = new Set(definitions.policy.allowedHosts);
const url = new URL(probe.url);
assert(url.protocol === "https:" && allowedHosts.has(url.hostname), `v592-major-moon-usgs-direct-host:${url.hostname}`);
assert(!url.username && !url.password && !url.port && !url.hash, "v592-major-moon-usgs-direct-url-policy");

let response;
let bytes = Buffer.alloc(0);
let networkError = null;
try {
  response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${probe.id}-usgs-direct-metadata-probe/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  bytes = Buffer.from(await response.arrayBuffer());
} catch (error) {
  networkError = error instanceof Error ? error.message : String(error);
}

if (bytes.byteLength > 0) {
  mkdirSync(dirname(rawPath), { recursive: true });
  const rawPartial = `${rawPath}.part`;
  writeFileSync(rawPartial, bytes);
  renameSync(rawPartial, rawPath);
}
const text = bytes.toString("utf8");
const hrefs = [...text.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
const candidateHrefs = [...new Set(hrefs.filter((href) => {
  const extension = extname(href.split("?")[0]).toLowerCase();
  return [".tif", ".tiff", ".cub", ".jp2", ".png", ".jpg", ".jpeg", ".zip"].includes(extension)
    || /download|asset|cache\/images|cloudfront/i.test(href);
}))].slice(0, 200);
const redirectLocation = response?.headers.get("location") ?? null;
let redirectHost = null;
let redirectAllowed = null;
if (redirectLocation) {
  const redirectUrl = new URL(redirectLocation, url);
  redirectHost = redirectUrl.hostname;
  redirectAllowed = redirectUrl.protocol === "https:" && allowedHosts.has(redirectUrl.hostname);
}
const passed = !networkError && response?.status === 200 && response.url === url.href && !redirectLocation;
const receipt = writeSealed(outputPath, {
  version: "v592-major-moon-usgs-direct-probe-v1",
  probedAt: new Date().toISOString(),
  status: passed ? "usgs-direct-metadata-probe-complete-no-visual-payload" : "blocked-no-automatic-retry",
  probeId: probe.id,
  target: probe.target,
  policy: {
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualPayloadDownloaded: false,
    redirectFollowed: false,
    guessedUrlDoesNotGrantAdmission: true
  },
  provenance: {
    archive: definitions.policy.archive,
    host: url.hostname,
    licensePolicy: "USGS-authored data are generally public domain; item-level provenance review required"
  },
  metadataRequest: {
    url: url.href,
    finalUrl: response?.url ?? null,
    status: response?.status ?? null,
    contentType: response?.headers.get("content-type") ?? "unreported",
    responseBytes: bytes.byteLength,
    responseSha256: sha256(bytes),
    outputPath: bytes.byteLength > 0 ? `source-cache/v592/major-moons/usgs-direct/${probe.id}.response` : null,
    redirectLocation,
    redirectHost,
    redirectAllowed,
    networkError
  },
  candidateHrefs,
  candidateCount: candidateHrefs.length,
  visualAssetAdmission: false
});
console.log(JSON.stringify({ status: receipt.status, probeId, target: probe.target, metadataRequest: receipt.metadataRequest, candidateCount: receipt.candidateCount, candidateHrefs: receipt.candidateHrefs, receiptSha256: receipt.receiptSha256 }, null, 2));
