import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-secondary-probes.json"), "utf8"));
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-secondary-existing-seal:${path}`);
  return document;
}

assert(definitions.version === "v592-major-moon-secondary-probes-v1", "v592-major-moon-secondary-definition-version");
assert(
  definitions.policy.singleRequestPerUrl === true
  && definitions.policy.automaticRetryAllowed === false
  && definitions.policy.automaticReplacementAllowed === false
  && definitions.policy.payloadDownloadAllowed === false
  && definitions.policy.selectionDoesNotGrantVisualAssetAdmission === true,
  "v592-major-moon-secondary-policy",
);

const probe = definitions.probes.find((entry) => entry.id === probeId);
assert(probe, `v592-major-moon-secondary-probe:${probeId}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-secondary/${probe.id}.json`);
const blockedPath = resolve(root, `docs/release/v592/metadata-probe-major-moon-secondary/${probe.id}-blocked.json`);

if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  console.log(JSON.stringify({
    status: "existing-receipt-verified-no-network",
    probeId,
    candidateCount: existing.candidates.length,
    receiptSha256: existing.receiptSha256,
  }, null, 2));
  process.exit(0);
}

assert(!existsSync(blockedPath), `v592-major-moon-secondary-terminal-block:${probeId}`);
const allowedHosts = new Set(definitions.policy.allowedHosts);
const queryUrl = new URL(`https://images-api.nasa.gov/search?q=${encodeURIComponent(probe.query)}&media_type=image&page_size=100`);
assert(queryUrl.protocol === "https:" && allowedHosts.has(queryUrl.hostname), `v592-major-moon-secondary-host:${queryUrl.hostname}`);
assert(!queryUrl.username && !queryUrl.password && !queryUrl.port && !queryUrl.hash, "v592-major-moon-secondary-url-policy");

try {
  const response = await fetch(queryUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${probe.id}-secondary-metadata-probe/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === queryUrl.href, `v592-major-moon-secondary-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const responseDocument = JSON.parse(bytes.toString("utf8"));
  const items = responseDocument.collection?.items;
  assert(Array.isArray(items), "v592-major-moon-secondary-items");

  const candidates = items.map((item) => {
    const data = Array.isArray(item.data) ? item.data[0] : null;
    assert(typeof data?.nasa_id === "string" && data.nasa_id.length > 0, "v592-major-moon-secondary-nasa-id");
    const identityText = `${data.title ?? ""} ${data.description ?? ""} ${(data.keywords ?? []).join(" ")}`.toLowerCase();
    const assetManifestUrl = new URL(item.href);
    assert(assetManifestUrl.protocol === "https:" && allowedHosts.has(assetManifestUrl.hostname), `v592-major-moon-secondary-asset-host:${assetManifestUrl.hostname}`);
    const previewValue = (item.links ?? []).find((link) => link.rel === "preview" && typeof link.href === "string")?.href ?? null;
    if (previewValue) {
      const previewUrl = new URL(previewValue);
      assert(previewUrl.protocol === "https:" && allowedHosts.has(previewUrl.hostname), `v592-major-moon-secondary-preview-host:${previewUrl.hostname}`);
    }
    return {
      nasaId: data.nasa_id,
      title: String(data.title ?? "").slice(0, 240),
      description: String(data.description ?? "").replaceAll(/\s+/g, " ").slice(0, 1200),
      dateCreated: data.date_created ?? null,
      center: data.center ?? null,
      keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 32) : [],
      requiredTermsMatched: probe.requiredTerms.every((term) => identityText.includes(term.toLowerCase())),
      preferredTermsMatched: probe.preferredTerms.filter((term) => identityText.includes(term.toLowerCase())),
      assetManifestUrl: assetManifestUrl.href,
      previewUrl: previewValue,
    };
  });

  const receipt = writeSealed(outputPath, {
    version: "v592-major-moon-secondary-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: "secondary-metadata-probe-complete-no-payload",
    probeId: probe.id,
    target: probe.target,
    query: probe.query,
    requiredTerms: probe.requiredTerms,
    preferredTerms: probe.preferredTerms,
    policy: {
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      payloadDownloaded: false,
      redirectPolicy: "manual-no-redirect-accepted",
      itemLevelLicenseReviewRequired: true,
      selectionDoesNotGrantVisualAssetAdmission: true
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
    totalHits: responseDocument.collection?.metadata?.total_hits ?? null,
    candidates,
    matchedCandidateCount: candidates.filter((candidate) => candidate.requiredTermsMatched).length,
    preferredCandidateCount: candidates.filter((candidate) => candidate.requiredTermsMatched && candidate.preferredTermsMatched.length > 0).length,
    payloadAdmission: "not-attempted-metadata-only",
    visualAssetAdmission: false
  });

  console.log(JSON.stringify({
    status: receipt.status,
    probeId,
    target: probe.target,
    totalHits: receipt.totalHits,
    preferredCandidates: receipt.candidates
      .filter((candidate) => candidate.requiredTermsMatched && candidate.preferredTermsMatched.length > 0)
      .map(({ nasaId, title, preferredTermsMatched }) => ({ nasaId, title, preferredTermsMatched })),
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v592-major-moon-secondary-metadata-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    probeId: probe.id,
    target: probe.target,
    metadataUrl: queryUrl.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    visualAssetAdmission: false,
    error: error instanceof Error ? error.message : String(error)
  });
  console.error(JSON.stringify({ status: blocked.status, probeId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
