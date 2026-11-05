import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const definitions = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-metadata-probes.json"), "utf8"));
const selections = JSON.parse(readFileSync(resolve(root, "scripts/v592-major-moon-asset-selections.json"), "utf8"));
const outputPath = resolve(root, "docs/release/v592/major-moon-asset-metadata-admission-v592.json");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-admission-input-seal:${path}`);
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

assert(definitions.version === "v592-major-moon-metadata-probes-v1" && definitions.probes.length === 12, "v592-major-moon-admission-definition");
assert(selections.version === "v592-major-moon-asset-selections-v1", "v592-major-moon-admission-selection-version");
assert(selections.selections.length === 8 && selections.unresolved.length === 4, "v592-major-moon-admission-selection-counts");
const selectionByTarget = new Map(selections.selections.map((entry) => [entry.target, entry]));
const unresolvedByTarget = new Map(selections.unresolved.map((entry) => [entry.target, entry]));

const targets = definitions.probes.map((probe) => {
  const metadata = verifySealed(resolve(root, `docs/release/v592/metadata-probe-major-moons/${probe.id}.json`));
  assert(metadata.status === "metadata-probe-complete-no-payload", `v592-major-moon-admission-metadata-status:${probe.id}`);
  assert(metadata.policy.requestCount === 1 && metadata.policy.automaticRetryPerformed === false, `v592-major-moon-admission-request-policy:${probe.id}`);
  assert(metadata.policy.payloadDownloaded === false && metadata.visualAssetAdmission === false, `v592-major-moon-admission-metadata-boundary:${probe.id}`);
  const selection = selectionByTarget.get(probe.id);
  if (!selection) {
    const unresolved = unresolvedByTarget.get(probe.id);
    assert(unresolved, `v592-major-moon-admission-unresolved:${probe.id}`);
    return {
      target: probe.id,
      state: "blocked-no-qualified-selection",
      reason: unresolved.reason,
      metadataReceiptSha256: metadata.receiptSha256,
      metadataTotalHits: metadata.totalHits,
      metadataMatchedCandidateCount: metadata.matchedCandidateCount,
      requestCount: 1,
      payloadDownloaded: false,
      visualAssetAdmitted: false,
      acquisitionCandidate: null,
    };
  }
  const candidate = metadata.candidates.find((entry) => entry.nasaId === selection.nasaId);
  assert(candidate, `v592-major-moon-admission-selected-candidate:${probe.id}`);
  const asset = verifySealed(resolve(root, `docs/release/v592/metadata-probe-major-moon-assets/${probe.id}.json`));
  assert(asset.status === "asset-manifest-probe-complete-no-payload", `v592-major-moon-admission-asset-status:${probe.id}`);
  assert(asset.policy.requestCount === 1 && asset.policy.automaticRetryPerformed === false, `v592-major-moon-admission-asset-request:${probe.id}`);
  assert(asset.policy.payloadDownloaded === false && asset.policy.visualAssetAdmissionGranted === false, `v592-major-moon-admission-asset-boundary:${probe.id}`);
  const acquisitionCandidate = asset.files.find((file) => file.candidateRole === "original")
    ?? asset.files.find((file) => file.candidateRole === "large")
    ?? null;
  assert(acquisitionCandidate?.httpsCandidate?.startsWith("https://"), `v592-major-moon-admission-https-candidate:${probe.id}`);
  return {
    target: probe.id,
    nasaId: selection.nasaId,
    title: candidate.title,
    center: candidate.center,
    selectionReason: selection.selectionReason,
    state: "candidate-explicit-https-acquisition-and-license-review-required",
    metadataReceiptSha256: metadata.receiptSha256,
    assetManifestReceiptSha256: asset.receiptSha256,
    requestCount: 2,
    payloadDownloaded: false,
    visualAssetAdmitted: false,
    acquisitionCandidate: {
      role: acquisitionCandidate.candidateRole,
      extension: acquisitionCandidate.extension,
      metadataUrl: acquisitionCandidate.url,
      metadataTransport: acquisitionCandidate.metadataTransport,
      httpsUrl: acquisitionCandidate.httpsCandidate,
      requested: false,
      bytes: null,
      sha256: null,
      itemLevelLicenseReview: "required",
      textureSuitabilityReview: "required",
    },
  };
});

const selectedCount = targets.filter((entry) => entry.acquisitionCandidate !== null).length;
const unresolvedCount = targets.filter((entry) => entry.acquisitionCandidate === null).length;
const receipt = writeSealed(outputPath, {
  version: "v592-major-moon-asset-metadata-admission-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "8-of-12-explicit-https-candidates-0-payloads-0-visual-admissions",
  policy: {
    metadataOnly: true,
    payloadDownloadAllowedByThisReceipt: false,
    explicitHttpsAcquisitionManifestRequired: true,
    itemLevelLicenseReviewRequired: true,
    textureSuitabilityReviewRequired: true,
    automaticRetryAllowed: false,
    automaticReplacementAllowed: false,
    missingAssetBehavior: "asset-blocked",
    proceduralFallbackAllowed: false,
    coloredPlaceholderAllowed: false,
    visualAssetAdmissionGranted: false,
  },
  summary: {
    requiredTargetCount: targets.length,
    metadataProbeCompleteCount: targets.length,
    manuallySelectedCandidateCount: selectedCount,
    assetManifestCompleteCount: selectedCount,
    unresolvedTargetCount: unresolvedCount,
    explicitHttpsAcquisitionCandidateCount: selectedCount,
    payloadDownloadedCount: 0,
    visualAssetAdmittedCount: 0,
  },
  targets,
});

console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, receiptSha256: receipt.receiptSha256 }, null, 2));
