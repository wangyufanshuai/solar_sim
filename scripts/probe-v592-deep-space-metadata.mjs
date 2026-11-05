import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-deep-space-metadata-probes.json"), "utf8"));
const requestedId = process.argv[2];
const supplemental = process.argv.includes("--supplement");
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
function atomicWrite(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  writeFileSync(partial, text);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(path, `${JSON.stringify(sealed, null, 2)}\n`);
  return sealed;
}
function verifyExisting(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-probe-existing-seal:${path}`);
  return document;
}

assert(definitions.version === "v592-deep-space-metadata-probes-v1", "v592-deep-space-probe-definition-version");
assert(
  definitions.policy?.singleRequestPerUrl === true
  && definitions.policy?.automaticRetryAllowed === false
  && definitions.policy?.automaticReplacementAllowed === false
  && definitions.policy?.payloadDownloadAllowed === false,
  "v592-deep-space-probe-policy",
);
assert(typeof requestedId === "string" && requestedId.length > 0, "v592-deep-space-probe-id-required");
const probe = definitions.probes.find((entry) => entry.id === requestedId);
assert(probe, `v592-deep-space-probe-id:${requestedId}`);
assert(probe.category === "galaxy" || probe.category === "cluster", `v592-deep-space-probe-category:${requestedId}`);
assert(Array.isArray(probe.requiredTermGroups) && probe.requiredTermGroups.length > 0, `v592-deep-space-probe-terms:${requestedId}`);
const baseOutputPath = resolve(root, `docs/release/v592/metadata-probe-deep-space/${requestedId}.json`);
const baseReceipt = supplemental ? verifyExisting(baseOutputPath) : null;
if (supplemental) {
  assert(typeof probe.supplementalQuery === "string" && probe.supplementalQuery.length > 0, `v592-deep-space-probe-supplement-query:${requestedId}`);
  assert(baseReceipt.status === "metadata-probe-complete-no-payload", `v592-deep-space-probe-supplement-base:${requestedId}`);
}
const outputPath = supplemental
  ? resolve(root, `docs/release/v592/metadata-probe-deep-space/${requestedId}-supplement.json`)
  : baseOutputPath;
const blockedPath = supplemental
  ? resolve(root, `docs/release/v592/metadata-probe-deep-space/${requestedId}-supplement-blocked.json`)
  : resolve(root, `docs/release/v592/metadata-probe-deep-space/${requestedId}-blocked.json`);
if (existsSync(outputPath)) {
  const existing = verifyExisting(outputPath);
  console.log(JSON.stringify({
    status: "existing-receipt-verified-no-network",
    id: requestedId,
    candidates: existing.candidates.length,
    matchedCandidateCount: existing.matchedCandidateCount,
    receiptSha256: existing.receiptSha256,
  }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), `v592-deep-space-probe-terminal-block:${requestedId}`);
const allowedHosts = new Set(definitions.policy.allowedHosts);
function validateUrl(raw, requiredHost = null) {
  const url = new URL(raw);
  assert(url.protocol === "https:" && allowedHosts.has(url.hostname), `v592-deep-space-probe-host:${url.hostname}`);
  assert(!requiredHost || url.hostname === requiredHost, `v592-deep-space-probe-required-host:${url.hostname}`);
  assert(!url.username && !url.password && !url.port && !url.hash, "v592-deep-space-probe-url-credentials-or-fragment");
  return url;
}
const selectedQuery = supplemental ? probe.supplementalQuery : probe.query;
const queryUrl = validateUrl(`https://images-api.nasa.gov/search?q=${encodeURIComponent(selectedQuery)}&media_type=image&page_size=30`, "images-api.nasa.gov");

try {
  const response = await fetch(queryUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${requestedId}-${supplemental ? "metadata-supplement" : "metadata-probe"}/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === queryUrl.href, `v592-deep-space-probe-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.byteLength > 0 && bytes.byteLength <= 16 * 1024 * 1024, `v592-deep-space-probe-response-size:${bytes.byteLength}`);
  const document = JSON.parse(bytes.toString("utf8"));
  const items = document.collection?.items;
  assert(Array.isArray(items), "v592-deep-space-probe-items");
  const candidates = items.map((item) => {
    const data = Array.isArray(item.data) ? item.data[0] : null;
    assert(typeof data?.nasa_id === "string" && data.nasa_id.length > 0, "v592-deep-space-probe-nasa-id");
    const assetManifestUrl = validateUrl(item.href).href;
    const previewValue = (item.links ?? []).find((link) => link.rel === "preview" && typeof link.href === "string")?.href ?? null;
    const previewUrl = previewValue ? validateUrl(previewValue).href : null;
    const identityText = `${data.title ?? ""} ${data.description ?? ""} ${(data.keywords ?? []).join(" ")}`.toLowerCase();
    const requiredTermsMatched = probe.requiredTermGroups.every((group) => group.some((term) => identityText.includes(term.toLowerCase())));
    return {
      nasaId: data.nasa_id,
      title: String(data.title ?? "").slice(0, 240),
      description: String(data.description ?? "").replaceAll(/\s+/g, " ").slice(0, 1_200),
      dateCreated: data.date_created ?? null,
      center: data.center ?? null,
      keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 32) : [],
      requiredTermsMatched,
      assetManifestUrl,
      previewUrl,
    };
  });
  const receipt = writeSealed(outputPath, {
    version: supplemental ? "v592-deep-space-metadata-supplement-v1" : "v592-deep-space-metadata-probe-v1",
    probedAt: new Date().toISOString(),
    status: supplemental ? "metadata-supplement-complete-no-payload" : "metadata-probe-complete-no-payload",
    target: requestedId,
    category: probe.category,
    query: selectedQuery,
    requiredTermGroups: probe.requiredTermGroups,
    priorProbe: supplemental ? {
      path: `docs/release/v592/metadata-probe-deep-space/${requestedId}.json`,
      receiptSha256: baseReceipt.receiptSha256,
      priorUrl: baseReceipt.metadataRequest.url,
      priorMatchedCandidateCount: baseReceipt.matchedCandidateCount,
    } : null,
    policy: {
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      payloadDownloaded: false,
      redirectPolicy: "manual-no-redirect-accepted",
      explicitOperatorInvokedQueryRefinement: supplemental,
      requestUrlDistinctFromPriorProbe: supplemental ? queryUrl.href !== baseReceipt.metadataRequest.url : null,
    },
    provenance: {
      archive: "NASA Image and Video Library API",
      host: "images-api.nasa.gov",
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
    totalHits: document.collection?.metadata?.total_hits ?? null,
    candidates,
    matchedCandidateCount: candidates.filter((candidate) => candidate.requiredTermsMatched).length,
    payloadAdmission: "not-attempted-metadata-only",
    scientificPayloadWriteback: false,
  });
  console.log(JSON.stringify({
    status: receipt.status,
    target: requestedId,
    category: probe.category,
    totalHits: receipt.totalHits,
    matchedCandidateCount: receipt.matchedCandidateCount,
    candidates: candidates.map(({ nasaId, title, requiredTermsMatched }) => ({ nasaId, title, requiredTermsMatched })),
    receiptSha256: receipt.receiptSha256,
  }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: supplemental ? "v592-deep-space-metadata-supplement-blocked-v1" : "v592-deep-space-metadata-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    target: requestedId,
    category: probe.category,
    priorProbeReceiptSha256: baseReceipt?.receiptSha256 ?? null,
    metadataUrl: queryUrl.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    scientificPayloadWriteback: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, target: requestedId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
