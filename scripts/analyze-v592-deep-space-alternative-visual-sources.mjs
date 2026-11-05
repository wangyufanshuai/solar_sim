import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const selectionsPath = resolve(root, "scripts/v592-deep-space-alternative-visual-source-selections.json");
const reviewPath = resolve(root, "docs/release/v592/deep-space-alternative-item-license-review-v592.json");
const contactSheetReceiptPath = resolve(root, "docs/release/v592/deep-space-alternative-contact-sheet-receipt-v592.json");
const outputPath = resolve(root, "docs/release/v592/deep-space-alternative-source-visual-analysis-v592.json");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-deep-space-alternative-analysis-input-seal:${path}`);
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
function assertCrop(crop, width, height, selectionId) {
  assert(Number.isInteger(crop.left) && Number.isInteger(crop.top), `v592-deep-space-alternative-analysis-crop-origin:${selectionId}`);
  assert(Number.isInteger(crop.width) && Number.isInteger(crop.height), `v592-deep-space-alternative-analysis-crop-size:${selectionId}`);
  assert(crop.left >= 0 && crop.top >= 0 && crop.width > 0 && crop.height > 0, `v592-deep-space-alternative-analysis-crop-positive:${selectionId}`);
  assert(crop.left + crop.width <= width && crop.top + crop.height <= height, `v592-deep-space-alternative-analysis-crop-bounds:${selectionId}`);
}
async function analyzeCrop(path, crop) {
  const aspect = crop.width / crop.height;
  const width = aspect >= 1 ? 768 : Math.max(256, Math.round(768 * aspect));
  const height = aspect >= 1 ? Math.max(256, Math.round(768 / aspect)) : 768;
  const { data, info } = await sharp(path, { limitInputPixels: false })
    .extract(crop)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  let meanLuma = 0;
  let black = 0;
  let brightNeutral = 0;
  const pixelCount = info.width * info.height;
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const index = pixel * info.channels;
    const red = data[index] ?? 0;
    const green = data[index + 1] ?? 0;
    const blue = data[index + 2] ?? 0;
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    meanLuma += luma;
    if (luma < 2.5) black += 1;
    if (luma > 225 && Math.max(red, green, blue) - Math.min(red, green, blue) < 18) brightNeutral += 1;
  }
  return {
    analysisDimensions: [info.width, info.height],
    meanLuma: Number((meanLuma / pixelCount).toFixed(6)),
    blackPixelFraction: Number((black / pixelCount).toFixed(9)),
    brightNeutralPixelFraction: Number((brightNeutral / pixelCount).toFixed(9)),
  };
}

const policies = Object.freeze({
  "sombrero-galaxy--PIA07899": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "full-clean-observation-frame",
    crop: Object.freeze({ left: 0, top: 0, width: 3000, height: 1681 }),
    rationale: "clean centered Spitzer/Hubble Sombrero field without captions, callouts, inset panels or uncovered survey holes; mapped infrared/visible color remains labeled in Cinematic",
    runtimeProfile: "compact-1536-768",
  }),
  "cigar-galaxy--PIA23010": Object.freeze({
    decision: "blocked-scientific-vector-overlay",
    cropPolicy: "no-runtime-crop",
    crop: Object.freeze({ left: 0, top: 0, width: 2412, height: 1713 }),
    rationale: "source contains a dense polarization magnetic-field vector overlay across M82; retain the acquired source and metadata as negative evidence without annotation removal or runtime derivation",
  }),
  "whirlpool-galaxy--PIA23005": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "full-clean-observation-frame",
    crop: Object.freeze({ left: 0, top: 0, width: 2500, height: 2500 }),
    rationale: "clean M51 field without captions, callouts or inset panels; retain the full mapped X-ray/UV/optical/IR composition",
  }),
  "bodes-galaxy--PIA09337": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "full-clean-observation-frame",
    crop: Object.freeze({ left: 0, top: 0, width: 2250, height: 2550 }),
    rationale: "clean M81 field without publication borders or overlays; full frame preserves the disk and surrounding stellar field",
  }),
  "southern-pinwheel-galaxy--PIA10373": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "manual-inscribed-observation-crop",
    crop: Object.freeze({ left: 476, top: 476, width: 1900, height: 1900 }),
    rationale: "deterministic square wholly inside the circular GALEX footprint; removes uncovered black corners without repairing or inventing pixels",
  }),
  "southern-pinwheel-galaxy--PIA10374": Object.freeze({
    decision: "held-redundant-mapped-color-alternate",
    cropPolicy: "no-runtime-crop",
    crop: Object.freeze({ left: 0, top: 0, width: 2852, height: 2852 }),
    rationale: "clean ultraviolet alternate retained in source cache; PIA10373 is the single runtime representation for the target",
  }),
  "pleiades--PIA09262": Object.freeze({
    decision: "held-redundant-mapped-color-alternate",
    cropPolicy: "no-runtime-crop",
    crop: Object.freeze({ left: 0, top: 0, width: 2855, height: 2855 }),
    rationale: "clean infrared alternate retained; PIA09263 provides clearer multi-scale dust and bright-star structure for the single runtime representation",
  }),
  "pleiades--PIA09263": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "full-clean-observation-frame",
    crop: Object.freeze({ left: 0, top: 0, width: 2855, height: 2855 }),
    rationale: "clean centered Spitzer field with strong bright-star hierarchy and dust structure, without captions or inset panels",
  }),
  "pleiades--PIA13121": Object.freeze({
    decision: "held-redundant-mapped-color-alternate",
    cropPolicy: "no-runtime-crop",
    crop: Object.freeze({ left: 0, top: 0, width: 4007, height: 3061 }),
    rationale: "clean WISE alternate retained; not loaded concurrently with the selected Spitzer representation",
  }),
});

const selections = JSON.parse(readFileSync(selectionsPath, "utf8"));
const review = verifySealed(reviewPath);
const contactSheet = verifySealed(contactSheetReceiptPath);
const acceptedLicenseReviewReceiptSha256 = new Set([
  review.receiptSha256,
  "88bdfdc7162364b56c53dfd25d801c4625ba9adadaf6d969af45a369097132da",
]);
assert(selections.version === "v592-deep-space-alternative-visual-source-selections-v1", "v592-deep-space-alternative-analysis-selections");
assert(selections.selections.length === 9, "v592-deep-space-alternative-analysis-selection-count");
assert(review.status === "9-alternative-visual-sources-eligible-12-blocked", "v592-deep-space-alternative-analysis-review");
assert(contactSheet.status === "contact-sheet-generated-manual-visual-analysis-required" && contactSheet.entries.length === 9, "v592-deep-space-alternative-analysis-contact-sheet");

const analyses = [];
for (const selectionId of selections.selections) {
  const policy = policies[selectionId];
  assert(policy, `v592-deep-space-alternative-analysis-policy:${selectionId}`);
  const sourceReceiptPath = resolve(root, `docs/release/v592/acquisition-receipt-deep-space-alternative-visual-sources/${selectionId}.json`);
  const sourceReceipt = verifySealed(sourceReceiptPath);
  const reviewEntry = review.reviews.find((entry) => entry.selectionId === selectionId);
  assert(reviewEntry?.status === "eligible-for-explicit-single-request-visual-source-acquisition", `v592-deep-space-alternative-analysis-review-entry:${selectionId}`);
  assert(sourceReceipt.status === "committed-single-visual-source-single-request-no-retry", `v592-deep-space-alternative-analysis-source-receipt:${selectionId}`);
  assert(acceptedLicenseReviewReceiptSha256.has(sourceReceipt.licenseReviewReceiptSha256), `v592-deep-space-alternative-analysis-license-link:${selectionId}`);
  const sourcePath = resolve(root, sourceReceipt.output.path);
  const sourceBytes = readFileSync(sourcePath);
  assert(sourceBytes.byteLength === sourceReceipt.output.bytes && sha256(sourceBytes) === sourceReceipt.output.sha256, `v592-deep-space-alternative-analysis-source-drift:${selectionId}`);
  assertCrop(policy.crop, sourceReceipt.source.width, sourceReceipt.source.height, selectionId);
  const runtimeDerivationCandidate = policy.decision === "derive-runtime-candidate";
  analyses.push({
    selectionId,
    target: sourceReceipt.target,
    category: sourceReceipt.category,
    nasaId: sourceReceipt.nasaId,
    sourceUrl: sourceReceipt.source.url,
    sourcePath: sourceReceipt.output.path,
    sourceBytes: sourceReceipt.output.bytes,
    sourceSha256: sourceReceipt.output.sha256,
    sourceDimensions: [sourceReceipt.source.width, sourceReceipt.source.height],
    sourceColorSpace: "srgb",
    sourceLicense: "NASA-media-guidelines-public-use-candidate-with-item-credit-and-no-restricted-partner-flag",
    sourceLicenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    sourceCredit: sourceReceipt.source.credit,
    sourceObservationEncoding: sourceReceipt.source.observationEncoding,
    metadataAcquisitionReceiptSha256: sourceReceipt.metadataAcquisitionReceiptSha256,
    sourceAcquisitionReceiptSha256: sourceReceipt.receiptSha256,
    sourceLicenseReviewReceiptSha256: sourceReceipt.licenseReviewReceiptSha256,
    cropPolicy: policy.cropPolicy,
    crop: policy.crop,
    retainedSourcePixelFraction: Number((policy.crop.width * policy.crop.height / (sourceReceipt.source.width * sourceReceipt.source.height)).toFixed(9)),
    metrics: await analyzeCrop(sourcePath, policy.crop),
    visualInspectionDecision: policy.decision,
    visualInspection: {
      rationale: policy.rationale,
      contactSheetPath: contactSheet.output.path,
      contactSheetSha256: contactSheet.output.sha256,
      prohibitedOperations: ["annotation-removal", "inpainting", "content-aware-fill", "synthetic-coverage-fill", "synthetic-upscale-as-observation"],
    },
    runtimeDerivationCandidate,
    runtimeProfile: runtimeDerivationCandidate ? (policy.runtimeProfile ?? "standard-2048-1024") : null,
    runtimeAssetAdmitted: false,
    depthImpostorPolicy: runtimeDerivationCandidate ? {
      fullDesktopDepthSlices: policy.runtimeProfile === "compact-1536-768" ? 2 : 3,
      fullMobileDepthSlices: policy.runtimeProfile === "compact-1536-768" ? 1 : 2,
      liteDepthSlices: 1,
      presentationOnly: true,
      scienceImagePayload: false,
      syntheticScientificData: false,
    } : null,
  });
}

const derivable = analyses.filter((entry) => entry.runtimeDerivationCandidate);
const blocked = analyses.filter((entry) => entry.visualInspectionDecision.startsWith("blocked-"));
const held = analyses.filter((entry) => !entry.runtimeDerivationCandidate && !entry.visualInspectionDecision.startsWith("blocked-"));
assert(new Set(derivable.map((entry) => entry.target)).size === derivable.length, "v592-deep-space-alternative-analysis-one-runtime-source-per-target");
const receipt = writeSealed(outputPath, {
  version: "v592-deep-space-alternative-source-visual-analysis-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: "five-runtime-derivation-candidates-three-clean-redundant-alternates-held-one-scientific-overlay-blocked",
  policy: {
    manualTechnicalVisualJudgement: true,
    oneRuntimeRepresentationPerTarget: true,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noAnnotationRemoval: true,
    noObservationClaimForMissingPixels: true,
    noNakedEyeColorClaim: true,
    mappedColorMustRemainLabeled: true,
    scienceNeverLoadsImagePayload: true,
    onlyCurrentFocusMayLoadCinematicImage: true,
    sourceReceiptLicenseLineagePreserved: true,
    runtimeAssetAdmissionGranted: false,
    scientificPayloadWriteback: false,
  },
  sourceSelectionManifestPath: "scripts/v592-deep-space-alternative-visual-source-selections.json",
  sourceSelectionManifestSha256: sha256(readFileSync(selectionsPath)),
  licenseReviewReceiptSha256: review.receiptSha256,
  contactSheetReceiptSha256: contactSheet.receiptSha256,
  summary: {
    analyzedCount: analyses.length,
    runtimeDerivationCandidateCount: derivable.length,
    cleanRedundantAlternateHeldCount: held.length,
    scientificOverlayBlockedCount: blocked.length,
    runtimeAssetAdmittedCount: 0,
  },
  derivableSelectionIds: derivable.map((entry) => entry.selectionId),
  derivableTargets: derivable.map((entry) => entry.target),
  heldSelectionIds: held.map((entry) => entry.selectionId),
  blockedSelectionIds: blocked.map((entry) => entry.selectionId),
  analyses,
});
console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, derivableTargets: receipt.derivableTargets, heldSelectionIds: receipt.heldSelectionIds, receiptSha256: receipt.receiptSha256 }, null, 2));
