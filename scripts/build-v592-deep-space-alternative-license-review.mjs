import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const selections = JSON.parse(readFileSync(resolve(root, "scripts/v592-deep-space-alternative-asset-selections.json"), "utf8"));
const outputPath = resolve(root, "docs/release/v592/deep-space-alternative-item-license-review-v592.json");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-alternative-license-input-seal:${path}`);
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
function inferBands(description, title) {
  const text = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  const bands = [];
  if (/infrared|micron|spitzer|wise/.test(text)) bands.push("infrared");
  if (/x-ray|chandra|nustar/.test(text)) bands.push("x-ray");
  if (/ultraviolet|galex/.test(text)) bands.push("ultraviolet");
  if (/visible|optical|hubble/.test(text)) bands.push("visible");
  return [...new Set(bands)];
}

assert(selections.version === "v592-deep-space-alternative-asset-selections-v1", "v592-deep-space-alternative-license-selections");
assert(selections.selections.length === 21, "v592-deep-space-alternative-license-selection-count");
const reviews = selections.selections.map((selection) => {
  const acquisition = verifySealed(resolve(root, `docs/release/v592/acquisition-receipt-deep-space-alternative-item-metadata/${selection.id}.json`));
  const manifest = verifySealed(resolve(root, `docs/release/v592/metadata-probe-deep-space-alternative-assets/${selection.id}.json`));
  assert(acquisition.status === "committed-single-metadata-file-single-request-no-retry", `v592-deep-space-alternative-license-acquisition:${selection.id}`);
  assert(acquisition.selectionId === selection.id && acquisition.nasaId === selection.nasaId, `v592-deep-space-alternative-license-acquisition-identity:${selection.id}`);
  assert(acquisition.assetManifestReceiptSha256 === manifest.receiptSha256, `v592-deep-space-alternative-license-manifest:${selection.id}`);
  const metadataBytes = readFileSync(resolve(root, acquisition.output.path));
  assert(metadataBytes.byteLength === acquisition.output.bytes && sha256(metadataBytes) === acquisition.output.sha256, `v592-deep-space-alternative-license-metadata-drift:${selection.id}`);
  const metadata = JSON.parse(metadataBytes.toString("utf8"));
  const original = manifest.files.find((file) => file.candidateRole === "original");
  assert(original?.httpsCandidate?.startsWith("https://"), `v592-deep-space-alternative-license-original:${selection.id}`);
  const nasaId = metadata["AVAIL:NASAID"] ?? null;
  const center = metadata["AVAIL:Center"] ?? null;
  const title = metadata["AVAIL:Title"] ?? null;
  const description = metadata["AVAIL:Description"] ?? null;
  const creator = metadata["AVAIL:Creator"] ?? null;
  const secondaryCreator = metadata["AVAIL:SecondaryCreator"] ?? null;
  const creditText = `${creator ?? ""} ${secondaryCreator ?? ""} ${description ?? ""}`;
  const identityText = `${title ?? ""} ${description ?? ""}`.toLowerCase();
  const width = Number(metadata["File:ImageWidth"]);
  const height = Number(metadata["File:ImageHeight"]);
  const fileType = metadata["File:FileType"] ?? null;
  const identityPassed = nasaId === selection.nasaId && manifest.selection.nasaId === selection.nasaId && typeof title === "string" && title.length > 0;
  const archiveIdentityPassed = center === "JPL" || center === "GSFC";
  const nasaCreditPresent = /(NASA|JPL|GSFC|Goddard|Chandra X-ray Center|CXC)/i.test(creditText);
  const restrictedPartnerFlag = /(\bESA\b|European Space Agency|\bCSA\b|Canadian Space Agency|all rights reserved|commercial license|copyright)/i.test(creditText);
  const resolutionPassed = Number.isFinite(width) && Number.isFinite(height) && width >= 2_048 && height >= 1_536;
  const formatPassed = fileType === "JPEG" && original.httpsCandidate.endsWith(".jpg");
  const targetIdentityPassed = selection.identityTerms.every((term) => identityText.includes(term.toLowerCase()));
  const eligible = identityPassed && archiveIdentityPassed && nasaCreditPresent && !restrictedPartnerFlag && resolutionPassed && formatPassed && targetIdentityPassed;
  const bands = inferBands(description, title);
  return {
    selectionId: selection.id,
    target: selection.target,
    category: selection.category,
    nasaId: selection.nasaId,
    title,
    description: typeof description === "string" ? description.replaceAll(/\s+/g, " ").slice(0, 900) : null,
    center,
    creator,
    secondaryCreator,
    sourceMetadataPath: acquisition.output.path,
    sourceMetadataSha256: acquisition.output.sha256,
    metadataAcquisitionReceiptSha256: acquisition.receiptSha256,
    assetManifestReceiptSha256: manifest.receiptSha256,
    sourceImage: {
      url: original.httpsCandidate,
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
      scienceModePolicy: "catalog-marker-coordinate-angular-extent-and-source-state-only",
      cinematicModePolicy: "presentation-only-observation-image-with-band-label",
    },
    checks: { identityPassed, archiveIdentityPassed, nasaCreditPresent, restrictedPartnerFlag, resolutionPassed, formatPassed, targetIdentityPassed },
    status: eligible ? "eligible-for-explicit-single-request-visual-source-acquisition" : "blocked-item-license-identity-or-texture-suitability-review",
    blocker: eligible ? null : [
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
  version: "v592-deep-space-alternative-item-license-review-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: `${eligible.length}-alternative-visual-sources-eligible-${blocked.length}-blocked`,
  policy: {
    licenseBasis: "NASA media usage guidelines plus item-level NASA/JPL/GSFC credit and restricted-partner scan",
    licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    explicitlyBlockedPartnerTokens: ["ESA", "European Space Agency", "CSA", "Canadian Space Agency"],
    legalOpinionClaimed: false,
    explicitSingleRequestAcquisitionRequired: true,
    automaticRetryAllowed: false,
    automaticReplacementAllowed: false,
    mappedColorMustRemainLabeled: true,
    visualAssetAdmissionGranted: false,
    derivedRuntimeAssetAdmissionGranted: false,
    scientificPayloadWriteback: false,
  },
  selectionManifestPath: "scripts/v592-deep-space-alternative-asset-selections.json",
  selectionManifestSha256: sha256(readFileSync(resolve(root, "scripts/v592-deep-space-alternative-asset-selections.json"))),
  summary: {
    reviewedCount: reviews.length,
    eligibleForAcquisitionCount: eligible.length,
    eligibleUniqueTargetCount: new Set(eligible.map((review) => review.target)).size,
    blockedCount: blocked.length,
    restrictedPartnerBlockedCount: blocked.filter((review) => review.checks.restrictedPartnerFlag).length,
    sourceImageDownloadedCount: 0,
    visualAssetAdmittedCount: 0,
  },
  eligibleSelectionIds: eligible.map((review) => review.selectionId),
  blockedSelectionIds: blocked.map((review) => review.selectionId),
  reviews,
});
console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, eligibleSelectionIds: receipt.eligibleSelectionIds, blockedSelectionIds: receipt.blockedSelectionIds, receiptSha256: receipt.receiptSha256 }, null, 2));
