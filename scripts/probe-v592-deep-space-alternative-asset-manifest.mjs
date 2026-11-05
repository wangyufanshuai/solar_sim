import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  classifyDeepSpaceAssetMetadataUrlV592,
  summarizeDeepSpaceAssetMetadataV592,
  validateDeepSpaceAssetManifestUrlV592,
} from "./lib/v592-deep-space-asset-metadata.mjs";

const root = process.cwd();
const selections = JSON.parse(readFileSync(resolve(root, "scripts/v592-deep-space-alternative-asset-selections.json"), "utf8"));
const selectionId = process.argv[2];
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-alternative-asset-input-seal:${path}`);
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

assert(selections.version === "v592-deep-space-alternative-asset-selections-v1", "v592-deep-space-alternative-asset-selection-version");
assert(
  selections.policy?.selectionIsManualTechnicalJudgement === true
  && selections.policy?.automaticReplacementAllowed === false
  && selections.policy?.payloadDownloadAllowed === false,
  "v592-deep-space-alternative-asset-selection-policy",
);
const selection = selections.selections.find((entry) => entry.id === selectionId);
assert(selection, `v592-deep-space-alternative-asset-selection:${selectionId}`);
const metadata = verifySealed(resolve(root, selection.metadataProbePath));
const candidate = metadata.candidates.find((entry) => entry.nasaId === selection.nasaId);
assert(candidate, `v592-deep-space-alternative-asset-candidate:${selectionId}`);
const identityText = `${candidate.title ?? ""} ${candidate.description ?? ""} ${(candidate.keywords ?? []).join(" ")}`.toLowerCase();
assert(selection.identityTerms.every((term) => identityText.includes(term.toLowerCase())), `v592-deep-space-alternative-asset-identity:${selectionId}`);
const outputPath = resolve(root, `docs/release/v592/metadata-probe-deep-space-alternative-assets/${selectionId}.json`);
const blockedPath = resolve(root, `docs/release/v592/metadata-probe-deep-space-alternative-assets/${selectionId}-blocked.json`);
if (existsSync(outputPath)) {
  const existing = verifySealed(outputPath);
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", selectionId, fileCount: existing.files.length, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), `v592-deep-space-alternative-asset-terminal-block:${selectionId}`);
const manifestUrl = validateDeepSpaceAssetManifestUrlV592(candidate.assetManifestUrl);

try {
  const response = await fetch(manifestUrl, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v592-${selectionId}-alternative-asset-manifest/1.0` },
    signal: AbortSignal.timeout(60_000),
  });
  assert(response.status === 200 && response.url === manifestUrl.href, `v592-deep-space-alternative-asset-http:${response.status}:${response.url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.byteLength > 0 && bytes.byteLength <= 2 * 1024 * 1024, `v592-deep-space-alternative-asset-size:${bytes.byteLength}`);
  const values = JSON.parse(bytes.toString("utf8"));
  assert(Array.isArray(values) && values.length > 0, "v592-deep-space-alternative-asset-files");
  const files = values.map(classifyDeepSpaceAssetMetadataUrlV592);
  const summary = summarizeDeepSpaceAssetMetadataV592(files);
  const receipt = writeSealed(outputPath, {
    version: "v592-deep-space-alternative-asset-manifest-probe-v1",
    probedAt: new Date().toISOString(),
    status: "alternative-asset-manifest-probe-complete-no-payload",
    selectionId,
    target: selection.target,
    category: selection.category,
    selection: {
      metadataProbePath: selection.metadataProbePath,
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
  console.log(JSON.stringify({ status: receipt.status, selectionId, target: selection.target, nasaId: selection.nasaId, summary, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  const blocked = writeSealed(blockedPath, {
    version: "v592-deep-space-alternative-asset-manifest-blocked-v1",
    failedAt: new Date().toISOString(),
    status: "blocked-no-automatic-retry",
    selectionId,
    target: selection.target,
    nasaId: selection.nasaId,
    metadataUrl: manifestUrl.href,
    requestCount: 1,
    payloadDownloaded: false,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    scientificPayloadWriteback: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, selectionId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  process.exitCode = 1;
}
