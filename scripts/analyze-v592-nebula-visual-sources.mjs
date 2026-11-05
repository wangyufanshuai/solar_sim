import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json");
const reviewPath = resolve(root, "docs/release/v592/nebula-item-license-review-v592.json");
const outputPath = resolve(root, "docs/release/v592/nebula-source-visual-analysis-v592.json");
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
function verifySealed(path, field = "receiptSha256") {
  const document = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  assert(document[field] === canonicalSha(unsigned), `v592-nebula-analysis-input-seal:${path}`);
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
function exactSquareCrop(width, height, inset = 0) {
  const size = Math.min(width, height) - inset * 2;
  return { left: Math.floor((width - size) / 2), top: Math.floor((height - size) / 2), width: size, height: size };
}
async function analyzeCrop(path, crop) {
  const { data, info } = await sharp(path, { limitInputPixels: false })
    .extract(crop)
    .resize(1024, 1024, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  let dark = 0;
  let nearBlack = 0;
  let mean = 0;
  for (let index = 0; index < data.length; index += info.channels) {
    const luma = 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2];
    mean += luma;
    if (luma < 20) dark += 1;
    if (luma < 5) nearBlack += 1;
  }
  return {
    analysisWidth: info.width,
    analysisHeight: info.height,
    meanLuma: mean / (data.length / info.channels),
    darkPixelFraction: dark / (data.length / info.channels),
    nearBlackPixelFraction: nearBlack / (data.length / info.channels),
  };
}

const acquisition = verifySealed(acquisitionPath);
const review = verifySealed(reviewPath);
assert(acquisition.status === "committed-seven-visual-sources-single-request-each-no-retry", "v592-nebula-analysis-acquisition-status");
assert(review.status === "7-visual-source-acquisitions-eligible-5-license-identity-or-suitability-blocked", "v592-nebula-analysis-review-status");
assert(acquisition.assets.length === 7 && review.summary.eligibleForAcquisitionCount === 7, "v592-nebula-analysis-count");

const cropPolicies = Object.freeze({
  "california-nebula": { decision: "blocked-multi-panel-observation-plate", cropPolicy: "no-runtime-crop", note: "source is a three-panel infrared observation plate with black margins; no panel may be silently promoted to a global sky impostor" },
  "heart-nebula": { decision: "derive-runtime-candidate", cropPolicy: "full-frame", note: "single WISE Heart and Soul mosaic frame; mapped infrared color remains labeled" },
  "soul-nebula": { decision: "derive-runtime-candidate", cropPolicy: "full-frame", note: "single WISE Soul mosaic frame; mapped infrared color remains labeled" },
  "witch-head-nebula": { decision: "derive-runtime-candidate", cropPolicy: "center-square-inset-192", note: "remove a small black edge artifact while preserving the WISE field; no inpainting" },
  "flame-nebula": { decision: "derive-runtime-candidate", cropPolicy: "center-square", note: "near-square WISE field, center crop only" },
  "pacman-nebula": { decision: "derive-runtime-candidate", cropPolicy: "full-frame", note: "single Chandra/Spitzer composite; mapped X-ray/infrared color remains labeled" },
  "running-chicken-nebula": { decision: "derive-runtime-candidate", cropPolicy: "full-frame", note: "single WISE Lambda Centauri field; mapped infrared color remains labeled" },
});

const analyses = [];
for (const asset of acquisition.assets) {
  const path = resolve(root, asset.outputPath);
  const bytes = readFileSync(path);
  assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-nebula-analysis-source-drift:${asset.target}`);
  const policy = cropPolicies[asset.target];
  assert(policy, `v592-nebula-analysis-policy:${asset.target}`);
  const crop = policy.cropPolicy === "full-frame"
    ? { left: 0, top: 0, width: asset.width, height: asset.height }
    : policy.cropPolicy === "center-square"
      ? exactSquareCrop(asset.width, asset.height)
      : policy.cropPolicy === "center-square-inset-192"
        ? exactSquareCrop(asset.width, asset.height, 192)
        : { left: 0, top: 0, width: asset.width, height: asset.height };
  const metrics = await analyzeCrop(path, crop);
  analyses.push({
    target: asset.target,
    nasaId: asset.nasaId,
    sourcePath: asset.outputPath,
    sourceSha256: asset.sha256,
    sourceDimensions: [asset.width, asset.height],
    cropPolicy: policy.cropPolicy,
    crop,
    metrics,
    visualInspectionDecision: policy.decision,
    visualInspectionNote: policy.note,
    runtimeAssetAdmitted: false,
    depthImpostorPolicy: policy.decision === "derive-runtime-candidate"
      ? { fullDesktopDepthSlices: 4, fullMobileDepthSlices: 2, liteDepthSlices: 1, presentationOnly: true, syntheticScientificData: false }
      : null,
  });
}

const derivable = analyses.filter((analysis) => analysis.visualInspectionDecision === "derive-runtime-candidate");
const blocked = analyses.filter((analysis) => analysis.visualInspectionDecision.startsWith("blocked"));
const receipt = writeSealed(outputPath, {
  version: "v592-nebula-source-visual-analysis-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "six-runtime-derivation-candidates-one-visual-coverage-blocked",
  policy: {
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noObservationDataClaimForMissingPixels: true,
    mappedColorMustRemainLabeled: true,
    scienceNeverLoadsImagePayload: true,
    runtimeAssetAdmissionGranted: false,
  },
  sourceAcquisitionReceiptSha256: acquisition.receiptSha256,
  licenseReviewReceiptSha256: review.receiptSha256,
  summary: {
    analyzedCount: analyses.length,
    runtimeDerivationCandidateCount: derivable.length,
    visualCoverageBlockedCount: blocked.length,
    runtimeAssetAdmittedCount: 0,
  },
  derivableTargets: derivable.map((analysis) => analysis.target),
  blockedTargets: blocked.map((analysis) => analysis.target),
  analyses,
});
console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, derivableTargets: receipt.derivableTargets, blockedTargets: receipt.blockedTargets, receiptSha256: receipt.receiptSha256 }, null, 2));
