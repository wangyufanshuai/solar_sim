import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-nasa3d-textures-v592.json");
const outputPath = resolve(root, "docs/release/v592/major-moon-nasa3d-visual-analysis-v592.json");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-nasa3d-analysis-seal:${path}`);
  return document;
}
function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.part`;
  rmSync(partial, { force: true });
  writeFileSync(partial, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}
async function analyzeImage(path) {
  const metadata = await sharp(path, { pages: -1 }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const targetWidth = Math.min(1024, Math.max(256, width));
  const targetHeight = Math.max(128, Math.round(targetWidth * height / Math.max(width, 1)));
  const { data, info } = await sharp(path)
    .resize({ width: targetWidth, height: targetHeight, fit: "fill", kernel: "nearest" })
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let darkPixels = 0;
  let nearBlackPixels = 0;
  let sumLuma = 0;
  let seamDelta = 0;
  for (let y = 0; y < info.height; y += 1) {
    const left = y * info.width * info.channels;
    const right = y * info.width * info.channels + (info.width - 1) * info.channels;
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const r = data[offset] ?? 0;
      const g = data[offset + 1] ?? r;
      const b = data[offset + 2] ?? g;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumLuma += luma;
      if (luma < 4) nearBlackPixels += 1;
      if (luma < 20) darkPixels += 1;
    }
    for (let channel = 0; channel < info.channels; channel += 1) {
      seamDelta += Math.abs((data[left + channel] ?? 0) - (data[right + channel] ?? 0));
    }
  }
  const pixelCount = info.width * info.height;
  const seamMean = seamDelta / Math.max(info.height * info.channels, 1);
  const nearBlackFraction = nearBlackPixels / Math.max(pixelCount, 1);
  const darkFraction = darkPixels / Math.max(pixelCount, 1);
  const aspectRatio = width / Math.max(height, 1);
  return {
    format: metadata.format ?? "unknown",
    width,
    height,
    aspectRatio,
    pages: metadata.pages ?? 1,
    channels: metadata.channels ?? null,
    space: metadata.space ?? null,
    depth: metadata.depth ?? null,
    hasAlpha: metadata.hasAlpha ?? false,
    density: metadata.density ?? null,
    analysisWidth: info.width,
    analysisHeight: info.height,
    meanLuma8Bit: sumLuma / Math.max(pixelCount, 1),
    darkPixelFraction: darkFraction,
    nearBlackPixelFraction: nearBlackFraction,
    verticalSeamMeanAbsoluteDelta8Bit: seamMean,
    globalEquirectangularCandidate: Math.abs(aspectRatio - 2) <= 0.01 && width >= 1024 && height >= 512,
    coverageWarning: nearBlackFraction > 0.25 ? "large-near-black-or-unobserved-region" : "no-large-near-black-region-detected",
  };
}

assert(existsSync(acquisitionPath), "v592-nasa3d-analysis-acquisition-missing");
const acquisition = verifySealed(acquisitionPath);
const analyses = [];
const failures = [];
for (const asset of acquisition.assets) {
  const path = resolve(root, asset.outputPath);
  try {
    const bytes = readFileSync(path);
    assert(bytes.byteLength === asset.bytes && sha256(bytes) === asset.sha256, `v592-nasa3d-analysis-source-drift:${asset.target}`);
    const metrics = await analyzeImage(path);
    const qualified = metrics.globalEquirectangularCandidate && metrics.nearBlackPixelFraction <= 0.25;
    analyses.push({
      target: asset.target,
      sourcePath: asset.outputPath,
      sourceUrl: asset.sourceUrl,
      sourceSha256: asset.sha256,
      sourceGitBlobSha1: asset.gitBlobSha1,
      metrics,
      visualInspectionDecision: qualified ? "derive-runtime-candidate-license-review-required" : "asset-blocked-source-coverage-or-projection",
      visualReview: qualified
        ? "direct-image-review-required-before-runtime-derivation"
        : "direct-image-review-confirmed-large-unobserved-black-coverage-in-the-official-projection",
      textureSuitabilityReview: "required",
      runtimeAssetAdmitted: false,
      scientificAuthorityGranted: false,
      presentationOnly: true,
    });
  } catch (error) {
    failures.push({ target: asset.target, error: error instanceof Error ? error.message : String(error) });
  }
}
const candidates = analyses.filter((entry) => entry.visualInspectionDecision.startsWith("derive"));
const blocked = analyses.filter((entry) => entry.visualInspectionDecision.startsWith("asset-blocked"));
const unsigned = {
  version: "v592-major-moon-nasa3d-visual-analysis-v1",
  generatedAt: process.env.ATLAS_V592_GENERATED_AT ?? "2026-08-21T00:00:00Z",
  status: failures.length === 0 ? "three-nasa3d-tiffs-analyzed-runtime-candidates-license-review-required" : "partial-analysis-with-terminal-failures",
  policy: {
    sourceAcquisitionReceiptSha256: acquisition.receiptSha256,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noProceduralFallback: true,
    noScientificPayloadWriteback: true,
    runtimeAssetAdmissionGranted: false,
  },
  summary: {
    acquiredCount: acquisition.assets.length,
    analyzedCount: analyses.length,
    runtimeDerivationCandidateCount: candidates.length,
    sourceCoverageBlockedCount: blocked.length,
    runtimeAssetAdmittedCount: 0,
    failureCount: failures.length,
  },
  analyses,
  failures,
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, receipt);
console.log(JSON.stringify({
  status: receipt.status,
  summary: receipt.summary,
  decisions: analyses.map(({ target, visualInspectionDecision, metrics }) => ({ target, visualInspectionDecision, metrics })),
  failures,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
if (failures.length > 0) process.exitCode = 1;
