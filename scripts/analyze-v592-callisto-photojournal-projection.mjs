import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = "source-cache/v592/major-moons/jpl-photojournal/PIA03876.tif";
const acquisitionPath = "docs/release/v592/acquisition-receipt-callisto-hemispherical-tif-v592.json";
const detailPath = "docs/release/v592/metadata-probe-major-moon-jpl/details/callisto-hemispherical-globes.json";
const outputPath = "docs/release/v592/major-moon-secondary-visual-projection-review-v592.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function sealed(relative, field) {
  const document = JSON.parse(readFileSync(resolve(root, relative), "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`projection-review-seal:${relative}`);
  return document;
}
function writeSealed(relative, body) {
  const absolute = resolve(root, relative);
  const document = { ...body, receiptSha256: canonicalSha(body) };
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
  return document;
}

const acquisition = sealed(acquisitionPath, "receiptSha256");
const detail = sealed(detailPath, "receiptSha256");
const source = resolve(root, sourcePath);
if (!existsSync(source)) throw new Error("projection-review-source-missing");
if (acquisition.status !== "acquired-single-request-pending-projection-review" || acquisition.bytes <= 0) throw new Error("projection-review-acquisition-not-available");
const sourceBytes = readFileSync(source);
if (sourceBytes.byteLength !== acquisition.bytes || sha256(sourceBytes) !== acquisition.sha256) throw new Error("projection-review-source-drift");
const metadata = await sharp(source, { limitInputPixels: false }).metadata();
const small = await sharp(source, { limitInputPixels: false }).resize({ width: 886, height: 449, fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
let white = 0;
let pixels = 0;
for (let i = 0; i < small.data.length; i += small.info.channels) {
  if (small.data[i] > 245 && small.data[i + 1] > 245 && small.data[i + 2] > 245) white += 1;
  pixels += 1;
}
const whiteFraction = white / pixels;
const aspectRatio = metadata.width / metadata.height;
const review = writeSealed(outputPath, {
  version: "v592-major-moon-secondary-visual-projection-review-v1",
  generatedAt: new Date().toISOString(),
  status: "blocked-non-equirectangular-hemispherical-globe-composite",
  target: "callisto",
  nasaId: "PIA03876",
  source: {
    path: sourcePath,
    bytes: sourceBytes.byteLength,
    sha256: acquisition.sha256,
    acquisitionReceiptSha256: acquisition.receiptSha256,
    metadataReceiptSha256: detail.receiptSha256,
  },
  image: {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    aspectRatio,
    channels: metadata.channels,
    colorSpace: metadata.space ?? null,
    hasAlpha: metadata.hasAlpha ?? false,
    pages: metadata.pages ?? 1,
    whiteBackgroundFractionAtReviewScale: Number(whiteFraction.toFixed(9)),
  },
  findings: [
    "The raster contains two polar/hemispherical globe panels laid out on a white page, with wedge-shaped map sectors and cartographic labels.",
    "The white page background and panel gaps are not valid planetary surface coverage.",
    "The image is not a 2:1 equirectangular global albedo map and cannot be sampled as a seamless sphere texture.",
    "Reverse projection, gap removal, label removal, inpainting, or synthetic coverage generation is prohibited by the v592 policy.",
  ],
  admission: {
    globalTexture: false,
    heroAdmission: false,
    runtimeAssetAdmission: false,
    presentationOnly: true,
    scientificAuthorityGranted: false,
    proceduralFallbackAllowed: false,
    syntheticCoverageFill: false,
  },
  nextAction: "Keep Callisto asset-blocked and continue searching only for a directly published global mosaic or registered 3D model; do not retry PIA03876.tif.",
  policy: {
    singleRequestPerUrl: true,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    noInpainting: true,
    noAnnotationRemoval: true,
    noSyntheticCoverageFill: true,
    scientificPayloadWriteback: false,
  },
});
console.log(JSON.stringify({ status: review.status, sourceSha256: acquisition.sha256, whiteBackgroundFractionAtReviewScale: review.image.whiteBackgroundFractionAtReviewScale, receiptSha256: review.receiptSha256 }, null, 2));
