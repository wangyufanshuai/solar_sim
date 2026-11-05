import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json");
const admissionPath = resolve(root, "docs/release/v592/nebula-asset-metadata-admission-v592.json");
const outputPath = resolve(root, "docs/release/v592/nebula-item-license-review-v592.json");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nebula-license-input-seal:${path}`);
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
function inferBand(description, title) {
  const text = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  const bands = [];
  if (/infrared|micron|spitzer|wise|herschel/.test(text)) bands.push("infrared");
  if (/x-ray|chandra/.test(text)) bands.push("x-ray");
  if (/ultraviolet/.test(text)) bands.push("ultraviolet");
  if (/visible|optical|hubble/.test(text)) bands.push("visible");
  return [...new Set(bands)];
}

const acquisition = verifySealed(acquisitionPath);
const admission = verifySealed(admissionPath);
assert(acquisition.status === "committed-twelve-metadata-files-single-request-each-no-retry", "v592-nebula-license-acquisition-status");
assert(acquisition.assets.length === 12 && acquisition.failures.length === 0, "v592-nebula-license-acquisition-count");
assert(admission.summary.explicitHttpsAcquisitionCandidateCount === 12, "v592-nebula-license-admission-count");

const reviews = acquisition.assets.map((asset) => {
  const metadataBytes = readFileSync(resolve(root, asset.outputPath));
  assert(metadataBytes.byteLength === asset.bytes && sha256(metadataBytes) === asset.sha256, `v592-nebula-license-metadata-drift:${asset.target}`);
  const metadata = JSON.parse(metadataBytes.toString("utf8"));
  const aggregate = admission.targets.find((entry) => entry.target === asset.target);
  assert(aggregate?.acquisitionCandidate, `v592-nebula-license-aggregate:${asset.target}`);
  const nasaId = metadata["AVAIL:NASAID"] ?? null;
  const center = metadata["AVAIL:Center"] ?? null;
  const title = metadata["AVAIL:Title"] ?? null;
  const description = metadata["AVAIL:Description"] ?? null;
  const creator = metadata["AVAIL:Creator"] ?? null;
  const secondaryCreator = metadata["AVAIL:SecondaryCreator"] ?? null;
  const creditText = `${creator ?? ""} ${secondaryCreator ?? ""} ${description ?? ""}`;
  const width = Number(metadata["File:ImageWidth"]);
  const height = Number(metadata["File:ImageHeight"]);
  const fileType = metadata["File:FileType"] ?? null;
  const identityPassed = nasaId === asset.nasaId && aggregate.nasaId === asset.nasaId && typeof title === "string" && title.length > 0;
  const archiveIdentityPassed = center === "JPL" || center === "GSFC";
  const nasaCreditPresent = /(NASA|JPL|GSFC|Goddard|Chandra X-ray Center|CXC)/i.test(creditText);
  const restrictedPartnerFlag = /(\bESA\b|European Space Agency|\bCSA\b|Canadian Space Agency|all rights reserved|commercial license|copyright)/i.test(creditText);
  const resolutionPassed = Number.isFinite(width) && Number.isFinite(height) && width >= 2_048 && height >= 1_600;
  const formatPassed = fileType === "JPEG" && aggregate.acquisitionCandidate.httpsUrl.endsWith(".jpg");
  const targetTerms = asset.target.replace(/-nebula$/, "").split("-");
  const targetIdentityPassed = targetTerms.every((term) => `${title} ${description}`.toLowerCase().includes(term));
  const eligible = identityPassed && archiveIdentityPassed && nasaCreditPresent && !restrictedPartnerFlag && resolutionPassed && formatPassed && targetIdentityPassed;
  const bands = inferBand(description, title);
  return {
    target: asset.target,
    nasaId: asset.nasaId,
    title,
    center,
    creator,
    secondaryCreator,
    sourceMetadataPath: asset.outputPath,
    sourceMetadataSha256: asset.sha256,
    sourceImage: {
      url: aggregate.acquisitionCandidate.httpsUrl,
      requested: false,
      expectedFormat: fileType,
      metadataWidth: Number.isFinite(width) ? width : null,
      metadataHeight: Number.isFinite(height) ? height : null,
      metadataFileSize: metadata["File:FileSize"] ?? null,
    },
    observationEncoding: {
      bands,
      colorPolicy: bands.some((band) => band !== "visible") ? "mapped-or-composite-color-not-naked-eye" : "visible-or-line-mapped-color-review-required",
      nakedEyeRepresentationClaimed: false,
      scienceModePolicy: "catalog-marker-coordinate-angular-extent-and-band-only",
      cinematicModePolicy: "presentation-only-observation-image-with-band-label",
    },
    checks: {
      identityPassed,
      archiveIdentityPassed,
      nasaCreditPresent,
      restrictedPartnerFlag,
      resolutionPassed,
      formatPassed,
      targetIdentityPassed,
    },
    status: eligible
      ? "eligible-for-explicit-single-request-visual-source-acquisition"
      : "blocked-item-license-identity-or-texture-suitability-review",
    blocker: eligible
      ? null
      : [
          !identityPassed ? "identity" : null,
          !archiveIdentityPassed ? "archive-identity" : null,
          !nasaCreditPresent ? "nasa-credit" : null,
          restrictedPartnerFlag ? "restricted-partner-or-copyright-flag" : null,
          !resolutionPassed ? "source-resolution" : null,
          !formatPassed ? "source-format" : null,
          !targetIdentityPassed ? "target-identity" : null,
        ].filter(Boolean),
    visualAssetAdmitted: false,
  };
});

const eligible = reviews.filter((review) => review.status.startsWith("eligible"));
const blocked = reviews.filter((review) => review.status.startsWith("blocked"));
const receipt = writeSealed(outputPath, {
  version: "v592-nebula-item-license-review-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: `${eligible.length}-visual-source-acquisitions-eligible-${blocked.length}-license-identity-or-suitability-blocked`,
  policy: {
    licenseBasis: "NASA media usage guidelines plus item-level NASA/JPL/GSFC credit and restricted-partner scan",
    licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    explicitlyBlockedPartnerTokens: ["ESA", "European Space Agency", "CSA", "Canadian Space Agency"],
    legalOpinionClaimed: false,
    publicDomainAssetIdentityClaimedBeforeDownload: false,
    explicitSingleRequestAcquisitionRequired: true,
    automaticRetryAllowed: false,
    automaticReplacementAllowed: false,
    mappedColorMustRemainLabeled: true,
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
    restrictedPartnerBlockedCount: blocked.filter((review) => review.checks.restrictedPartnerFlag).length,
    sourceImageDownloadedCount: 0,
    visualAssetAdmittedCount: 0,
  },
  eligibleTargets: eligible.map((review) => review.target),
  blockedTargets: blocked.map((review) => review.target),
  reviews,
});
console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, eligibleTargets: receipt.eligibleTargets, blockedTargets: receipt.blockedTargets, receiptSha256: receipt.receiptSha256 }, null, 2));
