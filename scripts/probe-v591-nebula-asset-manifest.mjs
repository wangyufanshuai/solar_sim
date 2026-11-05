import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definition = JSON.parse(readFileSync(resolve(root, "scripts/v591-nebula-asset-manifest-probes.json"), "utf8"));
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v591-nebula-manifest-seal:${path}`);
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
function validatedUrl(raw) {
  const url = new URL(raw);
  assert(url.protocol === "https:", `v591-nebula-manifest-protocol:${url.protocol}`);
  assert(definition.policy.allowedHosts.includes(url.hostname), `v591-nebula-manifest-host:${url.hostname}`);
  assert(!url.username && !url.password && !url.port, "v591-nebula-manifest-credentials");
  return url;
}

assert(definition.version === "v591-nebula-asset-manifest-probes-v1", "v591-nebula-manifest-definition");
assert(definition.policy.singleRequestPerUrl === true && definition.policy.automaticRetryAllowed === false && definition.policy.payloadDownloaded === false, "v591-nebula-manifest-policy");
assert(typeof requestedId === "string" && requestedId.length > 0, "v591-nebula-manifest-id-required");
const probe = definition.probes.find((entry) => entry.id === requestedId);
assert(probe, `v591-nebula-manifest-id:${requestedId}`);
const outputPath = resolve(root, probe.outputPath);
const blockedPath = resolve(root, probe.blockedPath);
if (existsSync(outputPath)) {
  const existing = readSealed(outputPath);
  assert(existing.status === "asset-manifest-metadata-complete-no-payload", "v591-nebula-manifest-existing-status");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", id: requestedId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), "v591-nebula-manifest-terminal-block-exists");
const metadata = readSealed(resolve(root, probe.metadataReceiptPath));
assert(metadata.status === "metadata-probe-complete-no-payload" && metadata.target === probe.target, "v591-nebula-manifest-metadata-identity");
const candidate = metadata.candidates.find((entry) => entry.nasaId === probe.nasaId);
assert(candidate && candidate.requiredTermsMatched === true && candidate.assetManifestUrl === probe.assetManifestUrl, "v591-nebula-manifest-candidate");
const identity = `${candidate.title} ${candidate.description} ${(candidate.keywords ?? []).join(" ")}`.toLowerCase();
assert(probe.identityTerms.every((term) => identity.includes(term)), "v591-nebula-manifest-identity-terms");
assert(!identity.includes("artist concept"), "v591-nebula-manifest-artist-concept");
const url = validatedUrl(probe.assetManifestUrl);
try {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v591-nebula-${requestedId}-asset-manifest/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === url.href && !response.headers.get("location"), `v591-nebula-manifest-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const document = JSON.parse(bytes.toString("utf8"));
  assert(Array.isArray(document) && document.length > 0, "v591-nebula-manifest-document");
  const rawAssets = document.map((raw) => {
    const assetUrl = new URL(raw);
    const path = assetUrl.pathname.toLowerCase();
    const extension = path.includes(".") ? path.slice(path.lastIndexOf(".")) : "";
    return {
      url: assetUrl.href,
      protocol: assetUrl.protocol,
      host: assetUrl.hostname,
      allowed: assetUrl.protocol === "https:" && definition.policy.allowedHosts.includes(assetUrl.hostname),
      extension,
      role: [".jpg", ".jpeg", ".png", ".tif", ".tiff"].includes(extension) ? "image-candidate" : "non-image",
    };
  });
  const manifestMetadataPath = resolve(root, `docs/release/v591/metadata-probe-nebula-asset-manifest-${requestedId}-response.json`);
  writeSealed(manifestMetadataPath, {
    version: "v591-nebula-asset-manifest-response-v1",
    target: probe.target,
    nasaId: probe.nasaId,
    request: { url: url.href, finalUrl: response.url, status: response.status, bytes: bytes.byteLength, sha256: sha256(bytes), count: 1 },
    assets: rawAssets,
    allAssetsAllowed: rawAssets.every((asset) => asset.allowed),
    payloadDownloaded: false,
  });
  const disallowed = rawAssets.filter((asset) => !asset.allowed);
  assert(disallowed.length === 0, `v591-nebula-manifest-disallowed-assets:${disallowed.map((asset) => `${asset.protocol}//${asset.host}`).join(",")}`);
  const assets = rawAssets;
  const imageAssets = assets.filter((asset) => asset.role === "image-candidate");
  assert(imageAssets.length > 0, "v591-nebula-manifest-no-image-assets");
  const receipt = writeSealed(outputPath, {
    version: "v591-nebula-asset-manifest-probe-v1",
    probedAt: new Date().toISOString(),
    status: "asset-manifest-metadata-complete-no-payload",
    target: probe.target,
    nasaId: probe.nasaId,
    title: candidate.title,
    center: candidate.center,
    fieldCoverage: probe.fieldCoverage,
    identityTerms: probe.identityTerms,
    metadataReceiptSha256: metadata.receiptSha256,
    request: {
      url: url.href,
      finalUrl: response.url,
      status: response.status,
      contentType: response.headers.get("content-type") ?? "unreported",
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
      count: 1,
    },
    assets,
    imageAssetCount: imageAssets.length,
    license: definition.policy.license,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    admission: "metadata-only-not-admitted",
  });
  console.log(JSON.stringify({ status: receipt.status, id: requestedId, nasaId: probe.nasaId, imageAssets, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v591-nebula-asset-manifest-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    target: probe.target,
    nasaId: probe.nasaId,
    url: url.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, id: requestedId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
