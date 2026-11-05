import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const target = process.argv[2];
const phase = process.argv[3] ?? "v1";
assert(["v1", "v2", "v3", "v4", "v5"].includes(phase), `v592-deep-space-alternative-phase:${phase}`);
const definitionsPath = phase === "v1"
  ? "scripts/v592-deep-space-alternative-probes.json"
  : `scripts/v592-deep-space-alternative-probes-${phase}.json`;
const definitions = JSON.parse(readFileSync(resolve(root, definitionsPath), "utf8"));
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
  const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(path, `${JSON.stringify(receipt, null, 2)}\n`);
  return receipt;
}
function verifySealed(path) {
  const receipt = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...receipt };
  delete unsigned.receiptSha256;
  assert(receipt.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-alternative-existing-seal:${path}`);
  return receipt;
}

assert(definitions.version === `v592-deep-space-alternative-probes-${phase}`, "v592-deep-space-alternative-version");
assert(
  definitions.policy?.allowedHost === "images-api.nasa.gov"
  && definitions.policy?.metadataOnly === true
  && definitions.policy?.singleRequestPerUrl === true
  && definitions.policy?.automaticRetryAllowed === false
  && definitions.policy?.automaticReplacementAllowed === false
  && definitions.policy?.payloadDownloadAllowed === false,
  "v592-deep-space-alternative-policy",
);
assert(typeof target === "string" && target.length > 0, "v592-deep-space-alternative-target-required");
const probe = definitions.probes.find((entry) => entry.id === target);
assert(probe, `v592-deep-space-alternative-target:${target}`);
const outputDirectory = phase === "v1"
  ? "docs/release/v592/metadata-probe-deep-space-alternatives"
  : `docs/release/v592/metadata-probe-deep-space-alternatives-${phase}`;
const outputPath = resolve(root, `${outputDirectory}/${target}.json`);
const blockedPath = resolve(root, `${outputDirectory}/${target}-blocked.json`);
if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", target, matchedCandidateCount: existing.matchedCandidateCount, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), `v592-deep-space-alternative-terminal-block:${target}`);
const priorDirectory = phase === "v2"
  ? "docs/release/v592/metadata-probe-deep-space-alternatives"
  : phase === "v3"
    ? "docs/release/v592/metadata-probe-deep-space-alternatives-v2"
    : phase === "v4"
      ? "docs/release/v592/metadata-probe-deep-space-alternatives-v3"
      : phase === "v5"
        ? "docs/release/v592/metadata-probe-deep-space-alternatives-v4"
    : null;
const priorPath = priorDirectory
  ? [
      resolve(root, `${priorDirectory}/${target}.json`),
      resolve(root, `${priorDirectory}/${target}-blocked.json`),
    ].find((path) => existsSync(path))
  : null;
const priorProbe = priorPath ? verifySealed(priorPath) : null;
assert(phase === "v1" || priorProbe, `v592-deep-space-alternative-prior-probe:${target}`);

const queryUrl = new URL("https://images-api.nasa.gov/search");
queryUrl.searchParams.set("q", probe.query);
queryUrl.searchParams.set("media_type", "image");
queryUrl.searchParams.set("page_size", "100");
assert(queryUrl.protocol === "https:" && queryUrl.hostname === definitions.policy.allowedHost, "v592-deep-space-alternative-url");

try {
  const response = await fetch(queryUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${target}-alternative-metadata-${phase}/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === queryUrl.href, `v592-deep-space-alternative-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.byteLength > 0 && bytes.byteLength <= 24 * 1024 * 1024, `v592-deep-space-alternative-size:${bytes.byteLength}`);
  const document = JSON.parse(bytes.toString("utf8"));
  const items = document.collection?.items;
  assert(Array.isArray(items), "v592-deep-space-alternative-items");
  const candidates = items.map((item) => {
    const data = Array.isArray(item.data) ? item.data[0] : null;
    assert(typeof data?.nasa_id === "string" && data.nasa_id.length > 0, "v592-deep-space-alternative-nasa-id");
    const manifestUrl = new URL(item.href);
    assert(
      manifestUrl.protocol === "https:"
      && ["images-api.nasa.gov", "images-assets.nasa.gov"].includes(manifestUrl.hostname)
      && !manifestUrl.username
      && !manifestUrl.password
      && !manifestUrl.port
      && !manifestUrl.hash,
      `v592-deep-space-alternative-manifest-url:${manifestUrl.hostname}`,
    );
    const identityText = `${data.title ?? ""} ${data.description ?? ""} ${(data.keywords ?? []).join(" ")}`.toLowerCase();
    const requiredTermsMatched = probe.requiredTermGroups.every((group) => group.some((term) => identityText.includes(term.toLowerCase())));
    return {
      nasaId: data.nasa_id,
      title: String(data.title ?? "").slice(0, 240),
      description: String(data.description ?? "").replaceAll(/\s+/g, " ").slice(0, 1_500),
      center: data.center ?? null,
      creator: data.photographer ?? null,
      dateCreated: data.date_created ?? null,
      keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 40) : [],
      requiredTermsMatched,
      assetManifestUrl: manifestUrl.href,
    };
  });
  const receipt = writeSealed(outputPath, {
    version: `v592-deep-space-alternative-metadata-probe-${phase}`,
    probedAt: new Date().toISOString(),
    status: "alternative-metadata-probe-complete-no-payload",
    target,
    category: probe.category,
    query: probe.query,
    requiredTermGroups: probe.requiredTermGroups,
    priorProbe: priorProbe ? {
      path: priorPath.slice(root.length + 1).replaceAll("\\", "/"),
      receiptSha256: priorProbe.receiptSha256,
      status: priorProbe.status,
      priorUrl: priorProbe.metadataRequest?.url ?? priorProbe.metadataUrl ?? null,
    } : null,
    policy: {
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      payloadDownloaded: false,
      redirectPolicy: "manual-no-redirect-accepted",
      explicitOperatorInvokedQueryRefinement: phase !== "v1",
      manualTechnicalSelectionStillRequired: true,
      scientificPayloadWriteback: false
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
    scientificPayloadWriteback: false
  });
  console.log(JSON.stringify({ status: receipt.status, target, totalHits: receipt.totalHits, matchedCandidateCount: receipt.matchedCandidateCount, candidates: candidates.filter((candidate) => candidate.requiredTermsMatched).map(({ nasaId, center, title }) => ({ nasaId, center, title })), receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: `v592-deep-space-alternative-metadata-blocked-${phase}`,
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    target,
    category: probe.category,
    priorProbeReceiptSha256: priorProbe?.receiptSha256 ?? null,
    metadataUrl: queryUrl.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    scientificPayloadWriteback: false,
    error: error instanceof Error ? error.message : String(error)
  });
  console.error(JSON.stringify({ status: blocked.status, target, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  process.exitCode = 1;
}
