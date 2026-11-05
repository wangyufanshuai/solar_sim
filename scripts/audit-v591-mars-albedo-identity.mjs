import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const acquisitionPath = resolve(root, "docs/release/v591/acquisition-receipt-mars.json");
const sourceDefinitionPath = resolve(root, "scripts/v591-mars-visual-sources.json");
const outputPath = resolve(root, "docs/release/v591/mars-albedo-identity-audit.json");
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
function verifySealed(document, field, label) {
  const unsigned = { ...document };
  delete unsigned[field];
  assert(canonicalSha(unsigned) === document[field], `v591-mars-albedo-${label}-seal`);
}
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const partial = `${path}.${process.pid}.part`;
  writeFileSync(partial, bytes);
  rmSync(path, { force: true });
  renameSync(partial, path);
}
function pearson(left, right, width, height, shift, flipped) {
  let count = 0;
  let sumLeft = 0;
  let sumRight = 0;
  let sumLeft2 = 0;
  let sumRight2 = 0;
  let sumProduct = 0;
  for (let y = 2; y < height - 2; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const mapped = (flipped ? width - 1 - x + shift : x + shift) % width;
      const a = left[row + x];
      const b = right[row + mapped];
      count += 1;
      sumLeft += a;
      sumRight += b;
      sumLeft2 += a * a;
      sumRight2 += b * b;
      sumProduct += a * b;
    }
  }
  const covariance = sumProduct - sumLeft * sumRight / count;
  const varianceLeft = sumLeft2 - sumLeft * sumLeft / count;
  const varianceRight = sumRight2 - sumRight * sumRight / count;
  return covariance / Math.sqrt(Math.max(1e-12, varianceLeft * varianceRight));
}
function gradientMagnitude(luminance, width, height) {
  const gradient = new Float32Array(luminance.length);
  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const left = luminance[row + (x === 0 ? width - 1 : x - 1)];
      const right = luminance[row + (x === width - 1 ? 0 : x + 1)];
      const up = luminance[row - width + x];
      const down = luminance[row + width + x];
      gradient[row + x] = Math.hypot(right - left, down - up);
    }
  }
  return gradient;
}

const acquisition = JSON.parse(readFileSync(acquisitionPath, "utf8"));
verifySealed(acquisition, "receiptSha256", "acquisition");
const definitions = JSON.parse(readFileSync(sourceDefinitionPath, "utf8"));
const definition = definitions.assets.find((asset) => asset.id === "mars-albedo-source-v591");
const source = acquisition.assets.find((asset) => asset.id === "mars-albedo-source-v591");
assert(definition && source, "v591-mars-albedo-audit-source");
const previewPath = resolve(root, source.outputPath);
const runtimePath = resolve(root, definition.runtimeReadOnlyAsset.fallbackPath);
const previewBytes = readFileSync(previewPath);
const runtimeBytes = readFileSync(runtimePath);
assert(previewBytes.byteLength === source.bytes && sha256(previewBytes) === source.sha256, "v591-mars-albedo-preview-drift");
assert(sha256(runtimeBytes) === definition.runtimeReadOnlyAsset.fallbackSha256, "v591-mars-albedo-runtime-drift");

const width = 256;
const height = 128;
const reference = await sharp(previewBytes, { limitInputPixels: false })
  .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .greyscale()
  .raw()
  .toBuffer();
const candidate = await sharp(runtimeBytes, { limitInputPixels: false })
  .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
  .greyscale()
  .raw()
  .toBuffer();
const referenceGradient = gradientMagnitude(reference, width, height);
const candidateGradient = gradientMagnitude(candidate, width, height);
let best = { luminanceCorrelation: -1, gradientCorrelation: -1, shiftPixels: 0, flipped: false };
for (const flipped of [false, true]) {
  for (let shiftPixels = 0; shiftPixels < width; shiftPixels += 1) {
    const luminanceCorrelation = pearson(reference, candidate, width, height, shiftPixels, flipped);
    if (luminanceCorrelation <= best.luminanceCorrelation) continue;
    best = {
      luminanceCorrelation,
      gradientCorrelation: pearson(referenceGradient, candidateGradient, width, height, shiftPixels, flipped),
      shiftPixels,
      flipped,
    };
  }
}
const thresholds = { luminanceCorrelationMinimum: 0.8, gradientCorrelationMinimum: 0.5 };
const passed = best.luminanceCorrelation >= thresholds.luminanceCorrelationMinimum
  && best.gradientCorrelation >= thresholds.gradientCorrelationMinimum;
const unsigned = {
  version: "v591-mars-albedo-identity-audit-v1",
  status: passed ? "passed" : "blocked-identity-mismatch",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  reference: {
    path: source.outputPath,
    sha256: source.sha256,
    width: source.width,
    height: source.height,
    identity: source.observationIdentity,
    role: "official-usgs-product-identity-and-color-reference",
  },
  candidate: {
    path: definition.runtimeReadOnlyAsset.fallbackPath,
    sha256: definition.runtimeReadOnlyAsset.fallbackSha256,
    fullKtx2Path: definition.runtimeReadOnlyAsset.path,
    fullKtx2Sha256: definition.runtimeReadOnlyAsset.sha256,
    role: "exact-byte-frozen-v588-runtime-albedo",
  },
  comparison: {
    width,
    height,
    longitudeShiftPixels: best.shiftPixels,
    longitudeShiftDegrees: best.shiftPixels / width * 360,
    longitudeFlipRequired: best.flipped,
    luminanceCorrelation: best.luminanceCorrelation,
    gradientCorrelation: best.gradientCorrelation,
    thresholds,
  },
  policy: {
    previewUpscaleAllowed: false,
    runtimeAssetMutationAllowed: false,
    scientificPayloadWriteback: false,
    admissionRequiresPass: true,
  },
};
const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, Buffer.from(`${JSON.stringify(sealed, null, 2)}\n`, "utf8"));
console.log(JSON.stringify({ status: sealed.status, comparison: sealed.comparison, receiptSha256: sealed.receiptSha256 }, null, 2));
