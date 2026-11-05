import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const acquisition = JSON.parse(readFileSync(resolve(root, "docs/release/v592/acquisition-receipt-major-moon-item-metadata-v592.json"), "utf8"));
const admission = JSON.parse(readFileSync(resolve(root, "docs/release/v592/major-moon-asset-metadata-admission-v592.json"), "utf8"));
const outputPath = resolve(root, "docs/release/v592/major-moon-item-license-review-v592.json");
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
function verify(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), `v592-major-moon-license-input-seal:${label}`);
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

verify(acquisition, "receiptSha256", "metadata-acquisition");
verify(admission, "receiptSha256", "metadata-admission");
assert(acquisition.status === "committed-eight-metadata-files-single-request-each-no-retry", "v592-major-moon-license-acquisition-status");
assert(admission.summary.explicitHttpsAcquisitionCandidateCount === 8, "v592-major-moon-license-candidate-count");

const reviews = acquisition.assets.map((asset) => {
  const metadataBytes = readFileSync(resolve(root, asset.outputPath));
  assert(metadataBytes.byteLength === asset.bytes && sha256(metadataBytes) === asset.sha256, `v592-major-moon-license-metadata-drift:${asset.target}`);
  const metadata = JSON.parse(metadataBytes.toString("utf8"));
  const aggregate = admission.targets.find((entry) => entry.target === asset.target);
  assert(aggregate?.acquisitionCandidate, `v592-major-moon-license-aggregate:${asset.target}`);
  const nasaId = metadata["AVAIL:NASAID"] ?? null;
  const center = metadata["AVAIL:Center"] ?? null;
  const title = metadata["AVAIL:Title"] ?? null;
  const description = metadata["AVAIL:Description"] ?? null;
  const credit = metadata["AVAIL:SecondaryCreator"] ?? null;
  const width = Number(metadata["File:ImageWidth"]);
  const height = Number(metadata["File:ImageHeight"]);
  const fileType = metadata["File:FileType"] ?? null;
  const identityPassed = nasaId === asset.nasaId && center === "JPL" && typeof title === "string" && title.length > 0;
  const creditPassed = typeof credit === "string" && /(NASA|JPL|USGS)/i.test(credit) && !/copyright|all rights reserved|commercial license/i.test(credit);
  const mapIdentityPassed = typeof description === "string" && /global map|global digital map|global color map|global mosaic/i.test(description);
  const resolutionPassed = Number.isFinite(width) && Number.isFinite(height) && width >= 4_096 && height >= 2_000;
  const formatPassed = fileType === "JPEG" && aggregate.acquisitionCandidate.extension === "jpg";
  const eligible = identityPassed && creditPassed && mapIdentityPassed && resolutionPassed && formatPassed;
  return {
    target: asset.target,
    nasaId: asset.nasaId,
    title,
    center,
    credit,
    sourceMetadataPath: asset.outputPath,
    sourceMetadataSha256: asset.sha256,
    sourceImage: {
      url: aggregate.acquisitionCandidate.httpsUrl,
      requested: false,
      expectedFormat: fileType,
      metadataWidth: width,
      metadataHeight: height,
      metadataFileSize: metadata["File:FileSize"] ?? null,
    },
    checks: {
      identityPassed,
      creditPassed,
      mapIdentityPassed,
      resolutionPassed,
      formatPassed,
      noRestrictionFlagFound: creditPassed,
    },
    status: eligible
      ? "eligible-for-explicit-single-request-visual-source-acquisition"
      : "blocked-item-license-or-texture-suitability-review",
    blocker: eligible
      ? null
      : [
          !identityPassed ? "identity" : null,
          !creditPassed ? "credit-or-restriction" : null,
          !mapIdentityPassed ? "global-map-identity" : null,
          !resolutionPassed ? "source-resolution" : null,
          !formatPassed ? "source-format" : null,
        ].filter(Boolean),
    visualAssetAdmitted: false,
  };
});

const eligible = reviews.filter((review) => review.status.startsWith("eligible"));
const blocked = reviews.filter((review) => review.status.startsWith("blocked"));
const receipt = writeSealed(outputPath, {
  version: "v592-major-moon-item-license-review-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "six-visual-source-acquisitions-eligible-two-texture-suitability-blocked",
  policy: {
    licenseBasis: "NASA media usage guidelines with item-level NASA/JPL/USGS credit and restriction scan",
    licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    legalOpinionClaimed: false,
    publicDomainAssetIdentityClaimedBeforeDownload: false,
    explicitSingleRequestAcquisitionRequired: true,
    automaticRetryAllowed: false,
    automaticReplacementAllowed: false,
    visualAssetAdmissionGranted: false,
    derivedRuntimeAssetAdmissionGranted: false,
  },
  sourceReceipts: {
    metadataAcquisitionReceiptSha256: acquisition.receiptSha256,
    metadataAdmissionReceiptSha256: admission.receiptSha256,
  },
  summary: {
    reviewedCount: reviews.length,
    eligibleForAcquisitionCount: eligible.length,
    blockedCount: blocked.length,
    sourceImageDownloadedCount: 0,
    visualAssetAdmittedCount: 0,
  },
  eligibleTargets: eligible.map((review) => review.target),
  blockedTargets: blocked.map((review) => review.target),
  reviews,
});
console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, eligibleTargets: receipt.eligibleTargets, blockedTargets: receipt.blockedTargets, receiptSha256: receipt.receiptSha256 }, null, 2));
