import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const outputPath = "docs/release/v592/major-moon-secondary-visual-evidence-v592.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function readSealed(relative, field = "receiptSha256") {
  const document = JSON.parse(readFileSync(resolve(root, relative), "utf8"));
  const unsigned = { ...document };
  delete unsigned[field];
  if (canonicalSha(unsigned) !== document[field]) throw new Error(`secondary-evidence-seal:${relative}`);
  return document;
}
function seal(relative, body) {
  const absolute = resolve(root, relative);
  const document = { ...body, receiptSha256: canonicalSha(body) };
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, `${JSON.stringify(document, null, 2)}\n`, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
  return document;
}
const pia03456 = readSealed("docs/release/v592/acquisition-receipt-callisto-photojournal-tif-v592.json");
const pia03876 = readSealed("docs/release/v592/acquisition-receipt-callisto-hemispherical-tif-v592.json");
const projection = readSealed("docs/release/v592/major-moon-secondary-visual-projection-review-v592.json");
const usgs = readSealed("docs/release/v592/acquisition-receipt-major-moon-usgs-visual-sources-v592.json");
const secondaryMetadata = readSealed("docs/release/v592/acquisition-receipt-major-moon-secondary-item-metadata-v592.json");
if (pia03456.requestCount !== 1 || pia03456.automaticRetryPerformed !== false || pia03456.automaticReplacementPerformed !== false) throw new Error("secondary-evidence-pia03456-policy");
if (pia03876.requestCount !== 1 || pia03876.automaticRetryPerformed !== false || pia03876.automaticReplacementPerformed !== false) throw new Error("secondary-evidence-pia03876-policy");
if (projection.status !== "blocked-non-equirectangular-hemispherical-globe-composite" || projection.admission.globalTexture !== false || projection.policy.noInpainting !== true) throw new Error("secondary-evidence-projection-policy");
if (usgs.policy.automaticRetryPerformed !== false || usgs.policy.automaticReplacementPerformed !== false || usgs.policy.visualAssetAdmissionGrantedByAcquisition !== false) throw new Error("secondary-evidence-usgs-policy");
if (secondaryMetadata.policy.automaticRetryPerformed !== false || secondaryMetadata.policy.automaticReplacementPerformed !== false || secondaryMetadata.policy.visualPayloadDownloaded !== false) throw new Error("secondary-evidence-metadata-policy");
const evidence = seal(outputPath, {
  version: "v592-major-moon-secondary-visual-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "callisto-official-secondary-lane-blocked-no-qualified-global-texture",
  target: "callisto",
  policy: {
    sourceHosts: ["assets.science.nasa.gov", "science.nasa.gov", "planetarymaps.usgs.gov"],
    singleRequestPerUrl: true,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    redirectFollowed: false,
    noInpainting: true,
    noAnnotationRemoval: true,
    noSyntheticCoverageFill: true,
    visualAssetAdmissionGranted: false,
    heroAdmissionGranted: false,
    scientificAuthorityGranted: false,
    scientificPayloadWriteback: false,
  },
  lanes: {
    nasaPhotojournalPia03456: {
      acquisitionStatus: pia03456.status,
      receiptSha256: pia03456.receiptSha256,
      reason: "single request returned content-length zero; terminal blocked; no retry",
    },
    nasaPhotojournalPia03876: {
      acquisitionStatus: pia03876.status,
      receiptSha256: pia03876.receiptSha256,
      projectionReviewStatus: projection.status,
      projectionReceiptSha256: projection.receiptSha256,
      reason: "official raster is a labeled white-page hemispherical globe composite, not a 2:1 equirectangular map",
    },
    usgsGlobalMosaic: {
      acquisitionStatus: usgs.status,
      receiptSha256: usgs.receiptSha256,
      reason: "direct USGS TIFF URLs returned redirects under single-request policy; no payload committed",
    },
    nasaSecondaryMetadata: {
      acquisitionStatus: secondaryMetadata.status,
      receiptSha256: secondaryMetadata.receiptSha256,
      reason: "metadata-only secondary candidates; no visual payload downloaded",
    },
  },
  admission: {
    metadataCandidateCount: secondaryMetadata.assets?.length ?? 0,
    payloadAcquiredCount: [pia03456, pia03876].filter((entry) => entry.bytes > 0).length,
    qualifiedGlobalTextureCount: 0,
    blockedSourceCount: 4,
    runtimeHeroCandidateCount: 0,
    blockedBody: "callisto",
  },
  nextAction: "Remain asset-blocked; require a directly published global mosaic or registered 3D model with complete coverage and item-level license review.",
});
console.log(JSON.stringify({ status: evidence.status, receiptSha256: evidence.receiptSha256, qualifiedGlobalTextureCount: evidence.admission.qualifiedGlobalTextureCount }, null, 2));
