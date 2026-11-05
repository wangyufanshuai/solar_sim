import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v592/acquisition-receipt-major-moon-usgs-final-visual-sources-v592.json");
const outputPath = resolve(root, "docs/release/v592/major-moon-usgs-final-source-visual-analysis-v592.json");
const previewRoot = resolve(root, "docs/release/v592/screenshots/major-moon-usgs-source-analysis");
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
  assert(document.receiptSha256 === canonicalSha(unsigned), `v592-usgs-analysis-input-seal:${path}`);
  return document;
}

function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(partial, path);
}

function writeSealed(path, unsigned) {
  const document = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  atomicWrite(path, Buffer.from(`${JSON.stringify(document, null, 2)}\n`, "utf8"));
  return document;
}

async function fileSha(path) {
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
    bytes += chunk.byteLength;
  }
  return { bytes, sha256: hash.digest("hex") };
}

function round(value, digits = 8) {
  return Number(value.toFixed(digits));
}

async function analyzeRaster(path) {
  const metadata = await sharp(path, { limitInputPixels: false }).metadata();
  assert(metadata.format === "tiff", `v592-usgs-analysis-format:${path}:${metadata.format}`);
  assert(Number.isInteger(metadata.width) && metadata.width > 0, `v592-usgs-analysis-width:${path}`);
  assert(Number.isInteger(metadata.height) && metadata.height > 0, `v592-usgs-analysis-height:${path}`);
  const width = metadata.width;
  const height = metadata.height;
  const aspectRatio = width / height;
  const { data, info } = await sharp(path, { limitInputPixels: false })
    .resize(2048, 1024, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert(info.channels === 3, `v592-usgs-analysis-rgb:${path}:${info.channels}`);
  const pixelCount = info.width * info.height;
  let exactBlack = 0;
  let nearBlack = 0;
  let lumaSum = 0;
  let seamAbsoluteRgb = 0;
  for (let offset = 0; offset < data.length; offset += 3) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    if (red === 0 && green === 0 && blue === 0) exactBlack += 1;
    if (red <= 3 && green <= 3 && blue <= 3) nearBlack += 1;
    lumaSum += red * 0.2126 + green * 0.7152 + blue * 0.0722;
  }
  for (let y = 0; y < info.height; y += 1) {
    const left = y * info.width * 3;
    const right = (y * info.width + info.width - 1) * 3;
    seamAbsoluteRgb += (
      Math.abs(data[left] - data[right])
      + Math.abs(data[left + 1] - data[right + 1])
      + Math.abs(data[left + 2] - data[right + 2])
    ) / 3;
  }
  const exactBlackPixelFraction = exactBlack / pixelCount;
  const nearBlackPixelFraction = nearBlack / pixelCount;
  const aspectError = Math.abs(aspectRatio - 2) / 2;
  const automatedTextureSuitability = aspectError > 0.005
    ? "blocked-not-two-to-one-global-raster"
    : exactBlackPixelFraction > 0.02
      ? "blocked-exact-black-coverage-requires-no-fill"
      : "visual-inspection-required-before-derivation";
  return {
    metadata: {
      format: metadata.format,
      width,
      height,
      channels: metadata.channels ?? null,
      space: metadata.space ?? "unreported",
      depth: metadata.depth ?? "unreported",
      hasAlpha: metadata.hasAlpha ?? false,
      pages: metadata.pages ?? 1,
      orientation: metadata.orientation ?? null,
      density: metadata.density ?? null,
      isProgressive: metadata.isProgressive ?? false,
      isPalette: metadata.isPalette ?? false,
    },
    metrics: {
      analysisDimensions: [info.width, info.height],
      aspectRatio: round(aspectRatio),
      relativeAspectErrorFromTwoToOne: round(aspectError),
      meanLumaEncoded255: round(lumaSum / pixelCount, 6),
      exactBlackPixelFraction: round(exactBlackPixelFraction),
      nearBlackPixelFraction: round(nearBlackPixelFraction),
      meanSeamAbsoluteRgb255: round(seamAbsoluteRgb / info.height, 6),
    },
    automatedTextureSuitability,
  };
}

assert(existsSync(acquisitionPath), "v592-usgs-analysis-acquisition-missing");
const acquisition = verifySealed(acquisitionPath);
assert(
  acquisition.version === "v592-major-moon-usgs-final-visual-source-acquisition-v1"
  && acquisition.policy.requestCountPerUrl === 1
  && acquisition.policy.automaticRetryPerformed === false
  && acquisition.policy.automaticReplacementPerformed === false
  && acquisition.policy.visualAssetAdmissionGrantedByAcquisition === false
  && acquisition.policy.scientificAuthorityGranted === false,
  "v592-usgs-analysis-acquisition-policy",
);

rmSync(previewRoot, { recursive: true, force: true });
mkdirSync(previewRoot, { recursive: true });
const analyses = [];
for (const asset of acquisition.assets) {
  const sourcePath = resolve(root, asset.outputPath);
  const observed = await fileSha(sourcePath);
  assert(observed.bytes === asset.bytes && observed.sha256 === asset.sha256, `v592-usgs-analysis-source-drift:${asset.target}`);
  const raster = await analyzeRaster(sourcePath);
  const previewPath = resolve(previewRoot, `${asset.target}-2048x1024.png`);
  const previewBytes = await sharp(sourcePath, { limitInputPixels: false })
    .resize(2048, 1024, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .toColourspace("srgb")
    .png({ compressionLevel: 8, adaptiveFiltering: true })
    .toBuffer();
  atomicWrite(previewPath, previewBytes);
  analyses.push({
    target: asset.target,
    sourcePath: asset.outputPath,
    sourceBytes: asset.bytes,
    sourceSha256: asset.sha256,
    sourceUrl: asset.url,
    licenseBasis: asset.licenseBasis,
    expectedProjection: asset.expectedProjection,
    expectedBands: asset.expectedBands,
    expectedResolutionMetersPerPixel: asset.expectedResolutionMetersPerPixel,
    ...raster,
    preview: {
      path: `docs/release/v592/screenshots/major-moon-usgs-source-analysis/${asset.target}-2048x1024.png`,
      bytes: previewBytes.byteLength,
      sha256: sha256(previewBytes),
      dimensions: [2048, 1024],
      colorSpace: "srgb",
      role: "inspection-only-not-runtime",
    },
    visualInspectionDecision: "pending",
    runtimeAssetAdmissionGranted: false,
    heroAdmissionGranted: false,
    scientificAuthorityGranted: false,
    presentationOnly: true,
  });
}

const automatedBlocked = analyses.filter((analysis) => analysis.automatedTextureSuitability.startsWith("blocked"));
const receipt = writeSealed(outputPath, {
  version: "v592-major-moon-usgs-final-source-visual-analysis-v1",
  generatedAt: "2026-08-20T00:00:00Z",
  status: analyses.length === 0
    ? "no-acquired-usgs-tiffs-terminal-acquisition-blocked"
    : automatedBlocked.length > 0
      ? "partial-analysis-with-automated-coverage-or-projection-blocks"
      : "source-analysis-complete-visual-inspection-required",
  sourceAcquisitionReceiptSha256: acquisition.receiptSha256,
  policy: {
    sourceIdentity: "USGS-Astrogeology/NASA-PDS-official-S3",
    analysisOnly: true,
    noInpainting: true,
    noSyntheticCoverageFill: true,
    noAutomaticColorization: true,
    exactBlackCoverageBlockThreshold: 0.02,
    relativeAspectErrorBlockThreshold: 0.005,
    visualInspectionRequired: true,
    runtimeAssetAdmissionGranted: false,
    heroAdmissionGranted: false,
    scientificAuthorityGranted: false,
    presentationOnly: true,
  },
  summary: {
    requestedTargetCount: acquisition.requestedUrls.length,
    acquiredTargetCount: acquisition.assets.length,
    terminalFailureCount: acquisition.failures.length,
    analyzedTargetCount: analyses.length,
    automatedBlockedTargetCount: automatedBlocked.length,
    pendingVisualInspectionTargetCount: analyses.length - automatedBlocked.length,
  },
  acquiredTargets: acquisition.assets.map((asset) => asset.target),
  failedTargets: acquisition.failures.map((failure) => failure.target),
  automatedBlockedTargets: automatedBlocked.map((analysis) => analysis.target),
  analyses,
});

console.log(JSON.stringify({
  status: receipt.status,
  summary: receipt.summary,
  acquiredTargets: receipt.acquiredTargets,
  failedTargets: receipt.failedTargets,
  automatedBlockedTargets: receipt.automatedBlockedTargets,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
