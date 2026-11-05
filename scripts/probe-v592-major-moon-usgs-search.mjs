import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-usgs-search-probes.json"), "utf8"));
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-usgs-search-existing-seal:${path}`);
  return document;
}

assert(definitions.version === "v592-major-moon-usgs-search-probes-v1", "v592-major-moon-usgs-search-definition-version");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.visualPayloadDownloadAllowed === false,
  "v592-major-moon-usgs-search-policy",
);
const probe = definitions.probes.find((entry) => entry.id === probeId);
assert(probe, `v592-major-moon-usgs-search-probe:${probeId}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-usgs/${probe.id}.json`);
const blockedPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-usgs/${probe.id}-blocked.json`);
const rawPath = resolve(root, `source-cache/v592/major-moons/usgs-search/${probe.id}.html`);

if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  const bytes = readFileSync(rawPath);
  assert(bytes.byteLength === existing.metadataRequest.responseBytes && sha256(bytes) === existing.metadataRequest.responseSha256, `v592-major-moon-usgs-search-existing-drift:${probeId}`);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", probeId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}

assert(!existsSync(blockedPath), `v592-major-moon-usgs-search-terminal-block:${probeId}`);
assert(!existsSync(rawPath), `v592-major-moon-usgs-search-untracked-existing:${probeId}`);
const allowedHosts = new Set(definitions.policy.allowedHosts);
const url = new URL(probe.url);
assert(url.protocol === "https:" && allowedHosts.has(url.hostname), `v592-major-moon-usgs-search-host:${url.hostname}`);
assert(!url.username && !url.password && !url.port && !url.hash, "v592-major-moon-usgs-search-url-policy");

try {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${probe.id}-usgs-metadata-probe/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  const redirectLocation = response.headers.get("location");
  assert(!redirectLocation, `v592-major-moon-usgs-search-redirect:${response.status}:${redirectLocation}`);
  assert(response.status === 200 && response.url === url.href, `v592-major-moon-usgs-search-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const text = bytes.toString("utf8");
  assert(/<html|<!doctype/i.test(text), `v592-major-moon-usgs-search-content:${probeId}`);
  mkdirSync(dirname(rawPath), { recursive: true });
  const rawPartial = `${rawPath}.part`;
  writeFileSync(rawPartial, bytes);
  renameSync(rawPartial, rawPath);
  const hrefs = [...text.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);
  const candidateHrefs = [...new Set(hrefs.filter((href) => /search\/(map|details)\//i.test(href)))].slice(0, 100);
  const receipt = writeSealed(outputPath, {
    version: "v592-major-moon-usgs-search-probe-v1",
    probedAt: new Date().toISOString(),
    status: "usgs-search-metadata-probe-complete-no-visual-payload",
    probeId: probe.id,
    target: probe.target,
    policy: {
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      visualPayloadDownloaded: false,
      redirectPolicy: "manual-no-redirect-observed",
      selectionDoesNotGrantVisualAssetAdmission: true
    },
    provenance: {
      archive: definitions.policy.archive,
      host: url.hostname,
      licensePolicy: "USGS-authored data are generally public domain; item-level provenance review required"
    },
    metadataRequest: {
      url: url.href,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "unreported",
      responseBytes: bytes.byteLength,
      responseSha256: sha256(bytes),
      outputPath: `source-cache/v592/major-moons/usgs-search/${probe.id}.html`
    },
    candidateHrefs,
    candidateCount: candidateHrefs.length,
    visualAssetAdmission: false
  });
  console.log(JSON.stringify({ status: receipt.status, probeId, target: probe.target, candidateCount: receipt.candidateCount, candidateHrefs: receipt.candidateHrefs, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v592-major-moon-usgs-search-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    probeId: probe.id,
    target: probe.target,
    metadataUrl: url.href,
    requestCount: 1,
    visualPayloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualAssetAdmission: false,
    error: error instanceof Error ? error.message : String(error)
  });
  console.error(JSON.stringify({ status: blocked.status, probeId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
