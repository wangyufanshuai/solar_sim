import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-visual-sources-v592.json");
const outputPath = resolve(root, "docs/release/v592/major-moon-source-visual-analysis-v592.json");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-major-moon-analysis-input-seal:${path}`);
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
function longestRun(values, predicate) {
  let bestStart = 0;
  let bestLength = 0;
  let start = 0;
  let length = 0;
  for (let index = 0; index < values.length; index += 1) {
    if (predicate(values[index])) {
      if (length === 0) start = index;
      length += 1;
      if (length > bestLength) {
        bestStart = start;
        bestLength = length;
      }
    } else {
      length = 0;
    }
  }
  return { start: bestStart, length: bestLength };
}
function exactTwoToOne(rectangle) {
  let { left, top, width, height } = rectangle;
  if (width / height > 2) {
    const targetWidth = Math.floor(height * 2);
    left += Math.floor((width - targetWidth) / 2);
    width = targetWidth;
  } else {
    const targetHeight = Math.floor(width / 2);
    top += Math.floor((height - targetHeight) / 2);
    height = targetHeight;
  }
  return { left, top, width, height };
}
async function detectMapPanel(path) {
  const { data, info } = await sharp(path, { limitInputPixels: false })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rowCoverage = new Float64Array(info.height);
  for (let y = 0; y < info.height; y += 1) {
    let visible = 0;
    for (let x = 0; x < info.width; x += 1) if (data[y * info.width + x] > 20) visible += 1;
    rowCoverage[y] = visible / info.width;
  }
  const rowRun = longestRun(rowCoverage, (coverage) => coverage >= 0.78);
  assert(rowRun.length >= info.height * 0.35, `v592-major-moon-analysis-row-panel:${path}`);
  const columnCoverage = new Float64Array(info.width);
  for (let x = 0; x < info.width; x += 1) {
    let visible = 0;
    for (let y = rowRun.start; y < rowRun.start + rowRun.length; y += 1) if (data[y * info.width + x] > 20) visible += 1;
    columnCoverage[x] = visible / rowRun.length;
  }
  const columnRun = longestRun(columnCoverage, (coverage) => coverage >= 0.78);
  assert(columnRun.length >= info.width * 0.5, `v592-major-moon-analysis-column-panel:${path}`);
  return exactTwoToOne({ left: columnRun.start, top: rowRun.start, width: columnRun.length, height: rowRun.length });
}
async function analyzeCrop(path, crop) {
  const { data, info } = await sharp(path, { limitInputPixels: false })
    .extract(crop)
    .resize(1024, 512, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let dark = 0;
  let nearBlack = 0;
  let seamAbsolute = 0;
  let mean = 0;
  for (const value of data) {
    mean += value;
    if (value < 20) dark += 1;
    if (value < 5) nearBlack += 1;
  }
  for (let y = 0; y < info.height; y += 1) seamAbsolute += Math.abs(data[y * info.width] - data[y * info.width + info.width - 1]);
  return {
    analysisWidth: info.width,
    analysisHeight: info.height,
    meanLuma: mean / data.length,
    darkPixelFraction: dark / data.length,
    nearBlackPixelFraction: nearBlack / data.length,
    meanSeamAbsoluteLuma: seamAbsolute / info.height,
  };
}

const acquisition = verifySealed(acquisitionPath);
assert(acquisition.status === "committed-six-visual-sources-single-request-each-no-retry" && acquisition.assets.length === 6, "v592-major-moon-analysis-acquisition-status");
const explicitPolicy = Object.freeze({
  titan: { crop: "detected-map-panel", decision: "derive-runtime-candidate", note: "remove title, axes and scale bar; Cassini 938nm albedo map" },
  enceladus: { crop: "detected-map-panel", decision: "derive-runtime-candidate", note: "remove title, axes and scale bar; global Cassini mosaic" },
  rhea: { crop: "full-frame", decision: "derive-runtime-candidate", note: "source is already a clean 2:1 global map" },
  iapetus: { crop: "detected-map-panel", decision: "blocked-source-coverage-gap", note: "large black unobserved regions are unsuitable for a 3A spherical hero" },
  triton: { crop: "full-frame", decision: "blocked-non-equirectangular-coverage", note: "source contains a partial projected mosaic on a black field, not a complete 2:1 surface map" },
  charon: { crop: "full-frame", decision: "blocked-source-coverage-gap", note: "large black unobserved regions cover much of the southern hemisphere; no inpainting or synthetic fill is permitted" },
});

const analyses = [];
for (const asset of acquisition.assets) {
  const path = resolve(root, asset.outputPath);
  const bytes = readFileSync(path);
  assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-major-moon-analysis-source-drift:${asset.target}`);
  const policy = explicitPolicy[asset.target];
  assert(policy, `v592-major-moon-analysis-policy:${asset.target}`);
  const crop = policy.crop === "detected-map-panel"
    ? await detectMapPanel(path)
    : exactTwoToOne({ left: 0, top: 0, width: asset.width, height: asset.height });
  const metrics = await analyzeCrop(path, crop);
  analyses.push({
    target: asset.target,
    nasaId: asset.nasaId,
    sourcePath: asset.outputPath,
    sourceSha256: asset.sha256,
    sourceDimensions: [asset.width, asset.height],
    cropPolicy: policy.crop,
    crop,
    metrics,
    visualInspectionDecision: policy.decision,
    visualInspectionNote: policy.note,
    runtimeAssetAdmitted: false,
  });
}

const derivable = analyses.filter((analysis) => analysis.visualInspectionDecision === "derive-runtime-candidate");
const blocked = analyses.filter((analysis) => analysis.visualInspectionDecision.startsWith("blocked"));
const receipt = writeSealed(outputPath, {
  version: "v592-major-moon-source-visual-analysis-v1",
  generatedAt: "2026-08-15T00:00:00Z",
  status: "three-runtime-derivation-candidates-three-source-coverage-blocked",
  policy: {
    automatedPanelDetection: "longest high-coverage row/column run followed by exact 2:1 center crop",
    panelLumaThreshold: 20,
    panelCoverageThreshold: 0.78,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noObservationDataClaimForMissingPixels: true,
    runtimeAssetAdmissionGranted: false,
  },
  sourceAcquisitionReceiptSha256: acquisition.receiptSha256,
  summary: {
    analyzedCount: analyses.length,
    runtimeDerivationCandidateCount: derivable.length,
    sourceCoverageBlockedCount: blocked.length,
    runtimeAssetAdmittedCount: 0,
  },
  derivableTargets: derivable.map((analysis) => analysis.target),
  blockedTargets: blocked.map((analysis) => analysis.target),
  analyses,
});
console.log(JSON.stringify({ status: receipt.status, summary: receipt.summary, derivableTargets: receipt.derivableTargets, blockedTargets: receipt.blockedTargets, cropMetrics: receipt.analyses.map(({ target, crop, metrics }) => ({ target, crop, metrics })), receiptSha256: receipt.receiptSha256 }, null, 2));
