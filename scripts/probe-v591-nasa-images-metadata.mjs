import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitionPath = resolve(root, "scripts/v591-nasa-images-metadata-probes.json");
const definitions = JSON.parse(readFileSync(definitionPath, "utf8"));
const requestedId = process.argv[2];

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
function readSealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-nasa-images-metadata-seal:${path}`);
  return document;
}
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
  return sealed;
}

assert(definitions.version === "v591-nasa-images-metadata-probes-v1", "v591-nasa-images-metadata-definition-version");
assert(definitions.policy?.singleRequestPerUrl === true && definitions.policy?.automaticRetryAllowed === false, "v591-nasa-images-metadata-policy");
assert(typeof requestedId === "string" && requestedId.length > 0, "v591-nasa-images-metadata-probe-id-required");
const probe = definitions.probes.find((entry) => entry.id === requestedId);
assert(probe, `v591-nasa-images-metadata-probe-id:${requestedId}`);
const outputPath = resolve(root, probe.outputPath);
const blockedPath = resolve(root, probe.blockedPath);
const allowedHosts = new Set(definitions.policy.allowedHosts);
function validateUrl(rawUrl, expectedHost = null) {
  const url = new URL(rawUrl);
  assert(url.protocol === "https:" && allowedHosts.has(url.hostname) && (!expectedHost || url.hostname === expectedHost), `v591-nasa-images-metadata-url:${url.hostname}`);
  assert(!url.username && !url.password && !url.port, "v591-nasa-images-metadata-url-credentials");
  return url;
}

if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.status === "metadata-probe-complete-no-payload", "v591-nasa-images-metadata-existing-status");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", probe: requestedId, candidateCount: existing.candidates.length, receiptSha256: existing.receiptSha256 }, null, 2));
} else {
  assert(!existsSync(blockedPath), "v591-nasa-images-metadata-terminal-block-exists");
  const queryUrl = validateUrl(probe.queryUrl, "images-api.nasa.gov");
  try {
    const response = await fetch(queryUrl, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": `Orbit-Atlas-v591-${requestedId}-metadata-probe/1.0` },
      signal: AbortSignal.timeout(60_000),
    });
    assert(response.status === 200 && response.url === probe.queryUrl, `v591-nasa-images-metadata-http:${response.status}:${response.url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const document = JSON.parse(bytes.toString("utf8"));
    const items = document.collection?.items;
    assert(Array.isArray(items), "v591-nasa-images-metadata-items");
    const candidates = items.map((item) => {
      const data = Array.isArray(item.data) ? item.data[0] : null;
      const nasaId = data?.nasa_id;
      const assetManifestUrl = item.href;
      assert(typeof nasaId === "string" && nasaId.length > 0, "v591-nasa-images-metadata-nasa-id");
      validateUrl(assetManifestUrl);
      const preview = (item.links ?? []).find((link) => link.rel === "preview" && typeof link.href === "string")?.href ?? null;
      if (preview) validateUrl(preview);
      const identityText = `${data?.title ?? ""} ${data?.description ?? ""} ${(data?.keywords ?? []).join(" ")}`.toLowerCase();
      return {
        nasaId,
        title: String(data?.title ?? "").slice(0, 240),
        description: String(data?.description ?? "").replaceAll(/\s+/g, " ").slice(0, 800),
        dateCreated: data?.date_created ?? null,
        center: data?.center ?? null,
        photographer: data?.photographer ?? null,
        keywords: Array.isArray(data?.keywords) ? data.keywords.slice(0, 24) : [],
        requiredTermsMatched: probe.requiredTerms.every((term) => identityText.includes(term.toLowerCase())),
        assetManifestUrl,
        previewUrl: preview,
      };
    });
    const receipt = writeSealed(outputPath, {
      version: "v591-nasa-images-metadata-probe-v1",
      probeId: requestedId,
      probedAt: new Date().toISOString(),
      status: "metadata-probe-complete-no-payload",
      target: probe.target,
      role: probe.role,
      policy: {
        requestCount: 1,
        automaticRetryPerformed: false,
        automaticReplacementPerformed: false,
        payloadDownloaded: false,
        redirectPolicy: "manual-no-redirect-accepted",
      },
      provenance: { archive: "NASA Image and Video Library API", host: "images-api.nasa.gov", license: probe.license },
      metadataRequest: {
        url: probe.queryUrl,
        finalUrl: response.url,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "unreported",
        responseBytes: bytes.byteLength,
        responseSha256: sha256(bytes),
      },
      totalHits: document.collection?.metadata?.total_hits ?? null,
      candidates,
      payloadAdmission: "not-attempted-metadata-only",
    });
    console.log(JSON.stringify({ status: receipt.status, probe: requestedId, totalHits: receipt.totalHits, candidates, receiptSha256: receipt.receiptSha256 }, null, 2));
  } catch (error) {
    const blocked = writeSealed(blockedPath, {
      version: "v591-nasa-images-metadata-probe-blocked-v1",
      probeId: requestedId,
      failedAt: new Date().toISOString(),
      status: "blocked-no-automatic-retry",
      metadataUrl: probe.queryUrl,
      requestCount: 1,
      payloadDownloaded: false,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(JSON.stringify({ status: blocked.status, probe: requestedId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
    throw error;
  }
}
