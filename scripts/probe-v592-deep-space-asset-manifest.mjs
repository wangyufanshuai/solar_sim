import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  classifyDeepSpaceAssetMetadataUrlV592,
  summarizeDeepSpaceAssetMetadataV592,
  validateDeepSpaceAssetManifestUrlV592,
} from "./lib/v592-deep-space-asset-metadata.mjs";

const root = process.cwd();
const selections = JSON.parse(readFileSync(resolve(root, "scripts/v592-deep-space-asset-selections.json"), "utf8"));
const target = process.argv[2];
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
function verifySealed(path) {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned.receiptSha256;
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-asset-probe-input-seal:${path}`);
  return document;
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

assert(selections.version === "v592-deep-space-asset-selections-v1", "v592-deep-space-asset-selection-version");
assert(selections.policy?.selectionIsManualTechnicalJudgement === true && selections.policy?.automaticReplacementAllowed === false && selections.policy?.payloadDownloadAllowed === false, "v592-deep-space-asset-selection-policy");
const selection = selections.selections.find((entry) => entry.target === target);
assert(selection, `v592-deep-space-asset-selection-target:${target}`);
const metadataPath = resolve(root, `docs/release/v592/metadata-probe-deep-space/${selection.metadataProbeFile}`);
const metadata = verifySealed(metadataPath);
const candidate = metadata.candidates.find((entry) => entry.nasaId === selection.nasaId);
assert(candidate, `v592-deep-space-asset-selection-candidate:${target}:${selection.nasaId}`);
const identityText = `${candidate.title ?? ""} ${candidate.description ?? ""} ${(candidate.keywords ?? []).join(" ")}`.toLowerCase();
assert(selection.identityTerms.every((term) => identityText.includes(term.toLowerCase())), `v592-deep-space-asset-selection-identity:${target}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-deep-space-assets/${target}.json`);
const blockedPath = resolve(root, `docs/release/v592/metadata-probe-deep-space-assets/${target}-blocked.json`);
if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", target, fileCount: existing.files.length, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), `v592-deep-space-asset-probe-terminal-block:${target}`);
const manifestUrl = validateDeepSpaceAssetManifestUrlV592(candidate.assetManifestUrl);

try {
  const response = await fetch(manifestUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${target}-asset-manifest-probe/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === manifestUrl.href, `v592-deep-space-asset-probe-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.byteLength > 0 && bytes.byteLength <= 2 * 1024 * 1024, `v592-deep-space-asset-probe-size:${bytes.byteLength}`);
  const values = JSON.parse(bytes.toString("utf8"));
  assert(Array.isArray(values) && values.length > 0, "v592-deep-space-asset-probe-files");
  const files = values.map(classifyDeepSpaceAssetMetadataUrlV592);
  const summary = summarizeDeepSpaceAssetMetadataV592(files);
  const receipt = writeSealed(outputPath, {
    version: "v592-deep-space-asset-manifest-probe-v1",
    probedAt: new Date().toISOString(),
    status: "asset-manifest-probe-complete-no-payload",
    target,
    category: selection.category,
    selection: {
      metadataProbeFile: selection.metadataProbeFile,
      metadataReceiptSha256: metadata.receiptSha256,
      nasaId: candidate.nasaId,
      title: candidate.title,
      description: candidate.description,
      center: candidate.center,
      identityTerms: selection.identityTerms,
      assetManifestUrl: manifestUrl.href,
    },
    policy: {
      requestCount: 1,
      automaticRetryPerformed: false,
      automaticReplacementPerformed: false,
      payloadDownloaded: false,
      redirectPolicy: "manual-no-redirect-accepted",
      itemLevelLicenseReviewRequired: true,
      returnedHttpUrlsAreMetadataOnly: true,
      explicitHttpsAcquisitionRequired: true,
      scientificPayloadWriteback: false,
    },
    metadataRequest: {
      url: manifestUrl.href,
      finalUrl: response.url,
      status: response.status,
      responseBytes: bytes.byteLength,
      responseSha256: sha256(bytes),
    },
    files,
    summary,
    payloadAdmission: summary.payloadAdmission,
  });
  console.log(JSON.stringify({ status: receipt.status, target, nasaId: candidate.nasaId, summary, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v592-deep-space-asset-manifest-probe-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    target,
    category: selection.category,
    nasaId: selection.nasaId,
    metadataUrl: manifestUrl.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    scientificPayloadWriteback: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, target, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
