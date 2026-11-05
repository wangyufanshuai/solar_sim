import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-alternative-metadata-probes.json"), "utf8"));
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-alternative-existing-seal:${path}`);
  return document;
}

assert(definitions.version === "v592-major-moon-alternative-metadata-probes-v1", "v592-major-moon-alternative-definition-version");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.payloadDownloadAllowed === false,
  "v592-major-moon-alternative-policy",
);
const probe = definitions.probes.find((entry) => entry.id === probeId);
assert(probe, `v592-major-moon-alternative-probe:${probeId}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-alternatives/${probeId}.json`);
const blockedPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-alternatives/${probeId}-blocked.json`);
if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", probeId, candidateCount: existing.candidates.length, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), `v592-major-moon-alternative-terminal-block:${probeId}`);
const allowedHosts = new Set(definitions.policy.allowedHosts);
function validateUrl(raw, requiredHost = null) {
  const url = new URL(raw);
  assert(url.protocol === "https:" && allowedHosts.has(url.hostname), `v592-major-moon-alternative-host:${url.hostname}`);
  assert(!requiredHost || url.hostname === requiredHost, `v592-major-moon-alternative-required-host:${url.hostname}`);
  assert(!url.username && !url.password && !url.port && !url.hash, "v592-major-moon-alternative-url-policy");
  return url;
}
const queryUrl = validateUrl(`https://images-api.nasa.gov/search?q=${encodeURIComponent(probe.query)}&media_type=image&page_size=100`, "images-api.nasa.gov");

try {
  const response = await fetch(queryUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${probeId}-metadata-probe/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === queryUrl.href, `v592-major-moon-alternative-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const document = JSON.parse(bytes.toString("utf8"));
  const items = document.collection?.items;
  assert(Array.isArray(items), "v592-major-moon-alternative-items");
  const candidates = items.map((item) => {
    const data = Array.isArray(item.data) ? item.data[0] : null;
    assert(typeof data?.nasa_id === "string" && data.nasa_id.length > 0, "v592-major-moon-alternative-nasa-id");
    const identityText = `${data.title ?? ""} ${data.description ?? ""} ${(data.keywords ?? []).join(" ")}`.toLowerCase();
    const previewValue = (item.links ?? []).find((link) => link.rel === "preview" && typeof link.href === "string")?.href ?? null;
    return {
      nasaId: data.nasa_id,
      title: String(data.title ?? "").slice(0, 240),
      description: String(data.description ?? "").replaceAll(/\s+/g, " ").slice(0, 900),
      dateCreated: data.date_created ?? null,
      center: data.center ?? null,
      keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 24) : [],
      requiredTermsMatched: probe.requiredTerms.every((term) => identityText.includes(term.toLowerCase())),
      assetManifestUrl: validateUrl(item.href).href,
      previewUrl: previewValue ? validateUrl(previewValue).href : null,
    };
  });
  const receipt = writeSealed(outputPath, {
    version: "v592-major-moon-alternative-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: "metadata-probe-complete-no-payload",
    probeId,
    target: probe.target,
    query: probe.query,
    requiredTerms: probe.requiredTerms,
    policy: {
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      payloadDownloaded: false,
      redirectPolicy: "manual-no-redirect-accepted",
      itemLevelLicenseReviewRequired: true
    },
    provenance: {
      archive: definitions.policy.archive,
      host: queryUrl.hostname,
      licensePolicy: "NASA media usage guidelines; item-level public-domain review required before payload admission"
    },
    metadataRequest: {
      url: queryUrl.href,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "unreported",
      responseBytes: bytes.byteLength,
      responseSha256: sha256(bytes)
    },
    totalHits: document.collection?.metadata?.total_hits ?? null,
    candidates,
    matchedCandidateCount: candidates.filter((candidate) => candidate.requiredTermsMatched).length,
    payloadAdmission: "not-attempted-metadata-only",
    visualAssetAdmission: false
  });
  console.log(JSON.stringify({
    status: receipt.status,
    probeId,
    target: probe.target,
    totalHits: receipt.totalHits,
    matchedCandidateCount: receipt.matchedCandidateCount,
    candidatePreview: receipt.candidates.filter((candidate) => candidate.requiredTermsMatched).slice(0, 12).map(({ nasaId, title }) => ({ nasaId, title })),
    receiptSha256: receipt.receiptSha256
  }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v592-major-moon-alternative-metadata-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    probeId,
    target: probe.target,
    metadataUrl: queryUrl.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error)
  });
  console.error(JSON.stringify({ status: blocked.status, probeId, target: probe.target, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
