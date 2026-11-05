import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "docs/release/v592/nebula-asset-metadata-admission-v592.json");
const selections = JSON.parse(readFileSync(resolve(root, "scripts/v592-nebula-asset-selections.json"), "utf8"));
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nebula-asset-admission-input-seal:${path}`);
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

assert(selections.version === "v592-nebula-asset-selections-v1", "v592-nebula-asset-admission-selection-version");
assert(selections.selections.length === 18, "v592-nebula-asset-admission-selection-count");

const targets = selections.selections.map((selection) => {
  const metadataPath = resolve(root, `docs/release/v592/metadata-probe-nebulae/${selection.metadataProbe}.json`);
  const completePath = resolve(root, `docs/release/v592/metadata-probe-nebula-assets/${selection.target}.json`);
  const blockedPath = resolve(root, `docs/release/v592/metadata-probe-nebula-assets/${selection.target}-blocked.json`);
  const metadata = verifySealed(metadataPath);
  const candidate = metadata.candidates.find((entry) => entry.nasaId === selection.nasaId);
  assert(candidate, `v592-nebula-asset-admission-candidate:${selection.target}`);
  assert(existsSync(completePath) !== existsSync(blockedPath), `v592-nebula-asset-admission-terminal-state:${selection.target}`);

  if (existsSync(blockedPath)) {
    const blocked = verifySealed(blockedPath);
    assert(blocked.status === "blocked-no-automatic-retry", `v592-nebula-asset-admission-blocked-status:${selection.target}`);
    assert(blocked.requestCount === 1, `v592-nebula-asset-admission-blocked-request-count:${selection.target}`);
    assert(blocked.payloadDownloaded === false, `v592-nebula-asset-admission-blocked-payload:${selection.target}`);
    return {
      target: selection.target,
      nasaId: selection.nasaId,
      title: candidate.title,
      metadataProbeReceiptSha256: metadata.receiptSha256,
      assetManifestReceiptSha256: blocked.receiptSha256,
      assetManifestUrl: candidate.assetManifestUrl,
      state: "blocked-prior-terminal-no-retry",
      blocker: blocked.error,
      requestCount: 1,
      payloadDownloaded: false,
      assetAdmitted: false,
      acquisitionCandidate: null,
    };
  }

  const complete = verifySealed(completePath);
  assert(complete.version === "v592-nebula-asset-manifest-probe-v2", `v592-nebula-asset-admission-probe-version:${selection.target}`);
  assert(complete.status === "asset-manifest-probe-complete-no-payload", `v592-nebula-asset-admission-probe-status:${selection.target}`);
  assert(complete.policy.requestCount === 1 && complete.policy.automaticRetryPerformed === false, `v592-nebula-asset-admission-request-policy:${selection.target}`);
  assert(complete.policy.payloadDownloaded === false, `v592-nebula-asset-admission-payload:${selection.target}`);
  assert(complete.payloadAdmission === "requires-explicit-https-acquisition", `v592-nebula-asset-admission-policy:${selection.target}`);
  const acquisitionCandidate = complete.files.find((file) => file.candidateRole === "original")
    ?? complete.files.find((file) => file.candidateRole === "large")
    ?? null;
  assert(acquisitionCandidate?.httpsCandidate?.startsWith("https://"), `v592-nebula-asset-admission-https-candidate:${selection.target}`);
  assert(acquisitionCandidate.httpsCandidateRequested === false, `v592-nebula-asset-admission-not-requested:${selection.target}`);

  return {
    target: selection.target,
    nasaId: selection.nasaId,
    title: candidate.title,
    center: candidate.center,
    metadataProbeReceiptSha256: metadata.receiptSha256,
    assetManifestReceiptSha256: complete.receiptSha256,
    assetManifestUrl: candidate.assetManifestUrl,
    state: "candidate-explicit-https-acquisition-required",
    requestCount: 1,
    payloadDownloaded: false,
    assetAdmitted: false,
    acquisitionCandidate: {
      role: acquisitionCandidate.candidateRole,
      extension: acquisitionCandidate.extension,
      metadataUrl: acquisitionCandidate.url,
      metadataTransport: acquisitionCandidate.metadataTransport,
      httpsUrl: acquisitionCandidate.httpsCandidate,
      requested: false,
      bytes: null,
      sha256: null,
      licenseReview: "required-before-acquisition",
    },
  };
});

const candidateCount = targets.filter((entry) => entry.state === "candidate-explicit-https-acquisition-required").length;
const blockedCount = targets.filter((entry) => entry.state === "blocked-prior-terminal-no-retry").length;
const receipt = writeSealed(outputPath, {
  version: "v592-nebula-asset-metadata-admission-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "metadata-candidates-assembled-payload-not-acquired",
  policy: {
    metadataOnly: true,
    payloadDownloadAllowedByThisReceipt: false,
    explicitHttpsAcquisitionManifestRequired: true,
    itemLevelLicenseReviewRequired: true,
    automaticRetryAllowed: false,
    automaticReplacementAllowed: false,
    blockedReceiptsPreserved: true,
    measuredAuthorityGranted: false,
    visualAssetAdmissionGranted: false,
  },
  summary: {
    selectedTargetCount: targets.length,
    metadataProbeCompleteCount: targets.length,
    assetManifestCompleteCount: candidateCount,
    terminalBlockedCount: blockedCount,
    explicitHttpsAcquisitionCandidateCount: candidateCount,
    payloadDownloadedCount: 0,
    assetAdmittedCount: 0,
  },
  targets,
});

console.log(JSON.stringify({
  status: receipt.status,
  summary: receipt.summary,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
