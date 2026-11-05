import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-deep-space-visual-sources-v592.json");
const reviewPath = resolve(root, "docs/release/v592/deep-space-item-license-review-v592.json");
const outputPath = resolve(root, "docs/release/v592/deep-space-source-visual-analysis-v592.json");
const previewRoot = resolve(root, "tmp/v592-deep-space-analysis-previews");

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
  assert(document[field] === canonicalSha(unsigned), `v592-deep-space-analysis-input-seal:${path}`);
  return document;
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}

function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(document, null, 2)}\n`, "utf8"));
  return document;
}

function assertCrop(crop, width, height, target) {
  assert(Number.isInteger(crop.left) && Number.isInteger(crop.top), `v592-deep-space-analysis-crop-origin:${target}`);
  assert(Number.isInteger(crop.width) && Number.isInteger(crop.height), `v592-deep-space-analysis-crop-size:${target}`);
  assert(crop.left >= 0 && crop.top >= 0 && crop.width > 0 && crop.height > 0, `v592-deep-space-analysis-crop-positive:${target}`);
  assert(crop.left + crop.width <= width && crop.top + crop.height <= height, `v592-deep-space-analysis-crop-bounds:${target}`);
}

function largestConnectedFraction(mask, width, height) {
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  let largest = 0;
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    let head = 0;
    let tail = 1;
    let count = 0;
    queue[0] = start;
    visited[start] = 1;
    while (head < tail) {
      const index = queue[head++];
      count += 1;
      const x = index % width;
      const y = Math.floor(index / width);
      const left = index - 1;
      const right = index + 1;
      const up = index - width;
      const down = index + width;
      if (x > 0 && mask[left] && !visited[left]) { visited[left] = 1; queue[tail++] = left; }
      if (x + 1 < width && mask[right] && !visited[right]) { visited[right] = 1; queue[tail++] = right; }
      if (y > 0 && mask[up] && !visited[up]) { visited[up] = 1; queue[tail++] = up; }
      if (y + 1 < height && mask[down] && !visited[down]) { visited[down] = 1; queue[tail++] = down; }
    }
    largest = Math.max(largest, count);
  }
  return largest / mask.length;
}

async function analyzeCrop(path, crop, previewPath) {
  const aspect = crop.width / crop.height;
  const width = aspect >= 1 ? 1024 : Math.max(256, Math.round(1024 * aspect));
  const height = aspect >= 1 ? Math.max(256, Math.round(1024 / aspect)) : 1024;
  const image = sharp(path, { limitInputPixels: false })
    .extract(crop)
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb");
  const { data, info } = await image.clone().raw().toBuffer({ resolveWithObject: true });
  atomicWrite(previewPath, await image.clone().webp({ quality: 90, effort: 6, smartSubsample: true }).toBuffer());
  const pixelCount = info.width * info.height;
  const nearBlackMask = new Uint8Array(pixelCount);
  let meanLuma = 0;
  let nearBlack = 0;
  let black = 0;
  let brightNeutral = 0;
  let edgeNearBlack = 0;
  let edgeBrightNeutral = 0;
  let edgeCount = 0;
  const edgeInsetX = Math.max(2, Math.floor(info.width * 0.035));
  const edgeInsetY = Math.max(2, Math.floor(info.height * 0.035));
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const sourceIndex = pixel * info.channels;
    const red = data[sourceIndex] ?? 0;
    const green = data[sourceIndex + 1] ?? 0;
    const blue = data[sourceIndex + 2] ?? 0;
    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    const isBlack = luma < 2.5;
    const isNearBlack = luma < 5.5;
    const isBrightNeutral = luma > 225 && Math.max(red, green, blue) - Math.min(red, green, blue) < 18;
    const x = pixel % info.width;
    const y = Math.floor(pixel / info.width);
    const isEdge = x < edgeInsetX || y < edgeInsetY || x >= info.width - edgeInsetX || y >= info.height - edgeInsetY;
    meanLuma += luma;
    if (isBlack) black += 1;
    if (isNearBlack) { nearBlack += 1; nearBlackMask[pixel] = 1; }
    if (isBrightNeutral) brightNeutral += 1;
    if (isEdge) {
      edgeCount += 1;
      if (isNearBlack) edgeNearBlack += 1;
      if (isBrightNeutral) edgeBrightNeutral += 1;
    }
  }
  return {
    analysisDimensions: [info.width, info.height],
    meanLuma: Number((meanLuma / pixelCount).toFixed(6)),
    blackPixelFraction: Number((black / pixelCount).toFixed(9)),
    nearBlackPixelFraction: Number((nearBlack / pixelCount).toFixed(9)),
    largestNearBlackConnectedFraction: Number(largestConnectedFraction(nearBlackMask, info.width, info.height).toFixed(9)),
    brightNeutralPixelFraction: Number((brightNeutral / pixelCount).toFixed(9)),
    edgeNearBlackFraction: Number((edgeNearBlack / edgeCount).toFixed(9)),
    edgeBrightNeutralFraction: Number((edgeBrightNeutral / edgeCount).toFixed(9)),
  };
}

const policies = Object.freeze({
  "andromeda-galaxy": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "manual-clean-observation-crop",
    crop: Object.freeze({ left: 1800, top: 1900, width: 6500, height: 3900 }),
    visualInspection: Object.freeze({
      sourceCondition: "ultraviolet survey mosaic with circular footprint boundaries and uncovered black regions outside the target field",
      cropRationale: "rectangular crop retains the M31 core and principal disk while excluding uncovered survey holes; no pixel repair or fill",
      prohibitedOperations: Object.freeze(["inpainting", "content-aware-fill", "synthetic-coverage-fill", "annotation-removal"]),
    }),
  }),
  "triangulum-galaxy": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "manual-inside-published-footprint",
    crop: Object.freeze({ left: 700, top: 620, width: 2800, height: 1480 }),
    visualInspection: Object.freeze({
      sourceCondition: "infrared mosaic surrounded by a published white elliptical footprint boundary",
      cropRationale: "crop remains wholly inside the ellipse and excludes the white boundary and black exterior; no pixel repair or fill",
      prohibitedOperations: Object.freeze(["inpainting", "content-aware-fill", "synthetic-coverage-fill", "boundary-removal"]),
    }),
  }),
  "cigar-galaxy": Object.freeze({
    decision: "blocked-infographic-overlay",
    cropPolicy: "no-runtime-crop",
    crop: Object.freeze({ left: 0, top: 0, width: 3900, height: 2400 }),
    visualInspection: Object.freeze({
      sourceCondition: "dated comparison infographic with title, credit block, callout rectangles and three inset panels",
      cropRationale: "no crop preserves a clean, sufficiently resolved M82 observation without silently discarding source context",
      prohibitedOperations: Object.freeze(["annotation-removal", "inpainting", "reconstruction-from-inset", "synthetic-upscale-as-observation"]),
    }),
  }),
  "virgo-a-galaxy": Object.freeze({
    decision: "blocked-infographic-overlay",
    cropPolicy: "no-runtime-crop",
    crop: Object.freeze({ left: 0, top: 0, width: 3226, height: 1814 }),
    visualInspection: Object.freeze({
      sourceCondition: "M87 infographic containing source rectangle, connector lines and enlarged inset",
      cropRationale: "the clean source region is too small for the declared runtime tiers and the inset is not a coordinate-preserving full-field image",
      prohibitedOperations: Object.freeze(["annotation-removal", "inpainting", "reconstruction-from-inset", "synthetic-upscale-as-observation"]),
    }),
  }),
  "omega-centauri": Object.freeze({
    decision: "derive-runtime-candidate",
    cropPolicy: "full-frame",
    crop: Object.freeze({ left: 0, top: 0, width: 3906, height: 3084 }),
    visualInspection: Object.freeze({
      sourceCondition: "single mapped-infrared cluster field without captions, callouts, frames or uncovered survey holes",
      cropRationale: "retain the full observed frame; mapped color remains explicitly labeled in Cinematic",
      prohibitedOperations: Object.freeze(["inpainting", "content-aware-fill", "synthetic-star-generation"]),
    }),
  }),
});

const acquisition = verifySealed(acquisitionPath);
const review = verifySealed(reviewPath);
assert(acquisition.status === "committed-five-visual-sources-single-request-each-no-retry", "v592-deep-space-analysis-acquisition-status");
assert(review.status === "5-visual-source-acquisitions-eligible-13-license-identity-or-suitability-blocked", "v592-deep-space-analysis-review-status");
assert(acquisition.assets.length === 5 && review.summary.eligibleForAcquisitionCount === 5, "v592-deep-space-analysis-count");

rmSync(previewRoot, { recursive: true, force: true });
mkdirSync(previewRoot, { recursive: true });
const analyses = [];
for (const asset of acquisition.assets) {
  const policy = policies[asset.target];
  assert(policy, `v592-deep-space-analysis-policy:${asset.target}`);
  const sourcePath = resolve(root, asset.outputPath);
  const bytes = readFileSync(sourcePath);
  assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-deep-space-analysis-source-drift:${asset.target}`);
  assertCrop(policy.crop, asset.width, asset.height, asset.target);
  const previewPath = resolve(previewRoot, `${asset.target}.webp`);
  const metrics = await analyzeCrop(sourcePath, policy.crop, previewPath);
  const derivable = policy.decision === "derive-runtime-candidate";
  analyses.push({
    target: asset.target,
    category: asset.category,
    nasaId: asset.nasaId,
    sourcePath: asset.outputPath,
    sourceSha256: asset.sha256,
    sourceDimensions: [asset.width, asset.height],
    sourceColorSpace: asset.colorSpace,
    sourceObservationEncoding: asset.observationEncoding,
    cropPolicy: policy.cropPolicy,
    crop: policy.crop,
    retainedSourcePixelFraction: Number((policy.crop.width * policy.crop.height / (asset.width * asset.height)).toFixed(9)),
    metrics,
    visualInspectionDecision: policy.decision,
    visualInspection: policy.visualInspection,
    previewPath: `tmp/v592-deep-space-analysis-previews/${asset.target}.webp`,
    runtimeDerivationCandidate: derivable,
    runtimeAssetAdmitted: false,
    depthImpostorPolicy: derivable ? {
      fullDesktopDepthSlices: 3,
      fullMobileDepthSlices: 2,
      liteDepthSlices: 1,
      presentationOnly: true,
      scienceImagePayload: false,
      syntheticScientificData: false,
    } : null,
  });
}

const derivable = analyses.filter((entry) => entry.runtimeDerivationCandidate);
const blocked = analyses.filter((entry) => !entry.runtimeDerivationCandidate);
const receipt = writeSealed(outputPath, {
  version: "v592-deep-space-source-visual-analysis-v1",
  generatedAt: "2026-08-19T00:00:00Z",
  status: "three-runtime-derivation-candidates-two-infographic-sources-blocked",
  policy: {
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noAnnotationRemoval: true,
    noObservationClaimForMissingPixels: true,
    noNakedEyeColorClaim: true,
    mappedColorMustRemainLabeled: true,
    scienceNeverLoadsImagePayload: true,
    onlyCurrentFocusMayLoadCinematicImage: true,
    runtimeAssetAdmissionGranted: false,
    scientificPayloadWriteback: false,
  },
  sourceAcquisitionReceiptSha256: acquisition.receiptSha256,
  licenseReviewReceiptSha256: review.receiptSha256,
  summary: {
    analyzedCount: analyses.length,
    runtimeDerivationCandidateCount: derivable.length,
    infographicBlockedCount: blocked.length,
    runtimeAssetAdmittedCount: 0,
  },
  derivableTargets: derivable.map((entry) => entry.target),
  blockedTargets: blocked.map((entry) => entry.target),
  analyses,
});

console.log(JSON.stringify({
  status: receipt.status,
  summary: receipt.summary,
  derivableTargets: receipt.derivableTargets,
  blockedTargets: receipt.blockedTargets,
  metrics: Object.fromEntries(receipt.analyses.map((entry) => [entry.target, entry.metrics])),
  receiptSha256: receipt.receiptSha256,
}, null, 2));
