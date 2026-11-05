import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import sharp from "sharp";

const root = process.cwd();
const requestedId = process.argv[2];
const ASSETS = Object.freeze({
  "ceres-global-map": {
    target: "ceres",
    nasaId: "PIA20351",
    sourceUrl: "https://images-assets.nasa.gov/image/PIA20351/PIA20351~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/ceres/PIA20351~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-ceres-dawn-global-map.json",
    minimumWidth: 1600,
    minimumHeight: 800,
    fieldCoverage: "global-elliptical-map",
    observationIdentity: "NASA Dawn enhanced-color global elliptical map of Ceres",
  },
  "venus-global-clouds": {
    target: "venus",
    nasaId: "PIA23791",
    sourceUrl: "https://images-assets.nasa.gov/image/PIA23791/PIA23791~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/venus/PIA23791~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-venus-global-clouds-independent.json",
    minimumWidth: 1200,
    minimumHeight: 1200,
    fieldCoverage: "global-disk-cloud-reference",
    observationIdentity: "NASA Mariner 10 reprocessed global Venus cloud disk",
  },
  "venus-magellan-0e": {
    target: "venus",
    nasaId: "PIA00257",
    sourceUrl: "https://images-assets.nasa.gov/image/PIA00257/PIA00257~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/venus/PIA00257~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-venus-magellan-global-map-independent.json",
    minimumWidth: 1200,
    minimumHeight: 1200,
    fieldCoverage: "computer-projected-global-hemisphere-centered-0-east",
    observationIdentity: "NASA/JPL Magellan radar-mosaic global Venus view centered at 0 degrees east",
  },
  "venus-magellan-90e": {
    target: "venus",
    nasaId: "PIA00270",
    sourceUrl: "https://images-assets.nasa.gov/image/PIA00270/PIA00270~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/venus/PIA00270~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-venus-magellan-90e-independent.json",
    minimumWidth: 1200,
    minimumHeight: 1200,
    fieldCoverage: "computer-projected-global-hemisphere-centered-90-east",
    observationIdentity: "NASA/JPL Magellan radar-mosaic global Venus view centered at 90 degrees east",
  },
  "venus-magellan-180e": {
    target: "venus",
    nasaId: "PIA00478",
    sourceUrl: "https://images-assets.nasa.gov/image/PIA00478/PIA00478~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/venus/PIA00478~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-venus-magellan-global-map-independent.json",
    minimumWidth: 1200,
    minimumHeight: 1200,
    fieldCoverage: "computer-projected-global-hemisphere-centered-180-east",
    observationIdentity: "NASA/JPL Magellan radar-mosaic global Venus view centered at 180 degrees east",
  },
  "venus-magellan-270e": {
    target: "venus",
    nasaId: "S91-50688",
    sourceUrl: "https://images-assets.nasa.gov/image/S91-50688/S91-50688~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/venus/S91-50688~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-venus-magellan-global-map-independent.json",
    minimumWidth: 1200,
    minimumHeight: 1200,
    fieldCoverage: "computer-projected-global-hemisphere-centered-270-east",
    observationIdentity: "NASA/JPL Magellan-Pioneer-Venus-Venera composite global Venus view centered at 270 degrees east",
  },
  "venus-magellan-polar-hemispheres": {
    target: "venus",
    nasaId: "PIA03151",
    sourceUrl: "https://images-assets.nasa.gov/image/PIA03151/PIA03151~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/venus/PIA03151~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-venus-south-broad-independent.json",
    minimumWidth: 1200,
    minimumHeight: 600,
    fieldCoverage: "north-and-south-polar-hemisphere-pair",
    observationIdentity: "NASA/JPL Magellan radar hemispherical globes of Venus without place-name overlays",
  },
  "veil-cygnus-loop": {
    target: "veil-nebula",
    nasaId: "PIA15415",
    sourceUrl: "https://images-assets.nasa.gov/image/PIA15415/PIA15415~orig.jpg",
    outputPath: "source-cache/celestial-convergence-v591/nebulae/veil/PIA15415~orig.jpg",
    metadataReceiptPath: "docs/release/v591/metadata-probe-nebula-veil-cygnus-loop-simple.json",
    minimumWidth: 1600,
    minimumHeight: 900,
    fieldCoverage: "wide-same-remnant-field",
    observationIdentity: "NASA GALEX ultraviolet Cygnus Loop nebula wide field (same supernova remnant as the Veil Nebula)",
  },
});
const asset = ASSETS[requestedId];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function writeSealed(path, unsigned) {
  const sealed = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, `${JSON.stringify(sealed, null, 2)}\n`, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
  return sealed;
}
function readSealed(path) {
  const value = JSON.parse(readFileSync(path, "utf8"));
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-nasa-image-acquisition-seal:${path}`);
  return value;
}
async function shaFile(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

assert(asset && typeof requestedId === "string", "v591-nasa-image-acquisition-id");
const receiptPath = resolve(root, `docs/release/v591/acquisition-asset-${requestedId}.json`);
const blockedPath = resolve(root, `docs/release/v591/acquisition-blocked-${requestedId}.json`);
const ledgerPath = resolve(root, "docs/release/v591/acquisition-url-ledger-nasa-image-visuals.json");
const finalPath = resolve(root, asset.outputPath);
const partPath = `${finalPath}.part`;
const metadata = readSealed(resolve(root, asset.metadataReceiptPath));
const candidate = metadata.candidates?.find((entry) => entry.nasaId === asset.nasaId);
assert(candidate && candidate.requiredTermsMatched === true && metadata.target === asset.target, "v591-nasa-image-acquisition-metadata-identity");
const ledger = existsSync(ledgerPath)
  ? readSealed(ledgerPath)
  : { version: "v591-nasa-image-visual-url-ledger-v1", entries: [] };
assert(ledger.version === "v591-nasa-image-visual-url-ledger-v1" && Array.isArray(ledger.entries), "v591-nasa-image-acquisition-ledger");
if (existsSync(receiptPath)) {
  const existing = readSealed(receiptPath);
  assert(existsSync(finalPath) && statSync(finalPath).size === existing.asset.bytes && await shaFile(finalPath) === existing.asset.sha256, "v591-nasa-image-acquisition-existing");
  console.log(JSON.stringify({ status: "existing-receipt-verified-no-network", id: requestedId, receiptSha256: existing.receiptSha256 }, null, 2));
  process.exit(0);
}
assert(!existsSync(blockedPath), "v591-nasa-image-acquisition-terminal-block-exists");
assert(!existsSync(finalPath) && !existsSync(partPath), "v591-nasa-image-acquisition-output-exists");
assert(!ledger.entries.some((entry) => entry.url === asset.sourceUrl), "v591-nasa-image-acquisition-repeat-url");
const url = new URL(asset.sourceUrl);
assert(url.protocol === "https:" && url.hostname === "images-assets.nasa.gov" && !url.username && !url.password && !url.port, "v591-nasa-image-acquisition-url");

try {
  const response = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { "user-agent": `Orbit-Atlas-v591-${requestedId}/1.0` },
    signal: AbortSignal.timeout(20 * 60_000),
  });
  const mediaType = (response.headers.get("content-type") ?? "unreported").split(";")[0].trim().toLowerCase();
  const announcedBytes = Number(response.headers.get("content-length"));
  const nextLedger = writeSealed(ledgerPath, {
    version: ledger.version,
    entries: [...ledger.entries, {
      id: requestedId,
      url: url.href,
      requestedAt: new Date().toISOString(),
      status: response.status,
      finalUrl: response.url,
      contentLength: Number.isFinite(announcedBytes) ? announcedBytes : null,
      mediaType,
      outcome: response.ok ? "response-received" : "http-error-no-retry",
    }],
  });
  assert(response.status === 200 && response.url === url.href && !response.headers.get("location") && response.body, `v591-nasa-image-acquisition-http:${response.status}:${response.url}`);
  assert(mediaType === "image/jpeg", `v591-nasa-image-acquisition-media:${mediaType}`);
  assert(!Number.isFinite(announcedBytes) || (announcedBytes > 0 && announcedBytes <= 134_217_728), "v591-nasa-image-acquisition-announced-size");
  mkdirSync(dirname(finalPath), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(partPath, { flags: "wx" }));
  const bytes = statSync(partPath).size;
  assert(bytes > 0 && bytes <= 134_217_728 && (!Number.isFinite(announcedBytes) || bytes === announcedBytes), `v591-nasa-image-acquisition-bytes:${bytes}`);
  const image = await sharp(partPath, { limitInputPixels: false }).metadata();
  assert(image.format === "jpeg" && (image.width ?? 0) >= asset.minimumWidth && (image.height ?? 0) >= asset.minimumHeight, `v591-nasa-image-acquisition-dimensions:${image.width ?? 0}x${image.height ?? 0}`);
  const record = {
    id: requestedId,
    target: asset.target,
    nasaId: asset.nasaId,
    sourceUrl: url.href,
    finalUrl: response.url,
    outputPath: asset.outputPath,
    bytes,
    sha256: await shaFile(partPath),
    width: image.width,
    height: image.height,
    format: image.format,
    colorSpace: "srgb",
    fieldCoverage: asset.fieldCoverage,
    observationIdentity: asset.observationIdentity,
    observationColorPolicy: "observation-derived-presentation-only-not-naked-eye",
    license: { id: "NASA-public-domain", url: "https://www.nasa.gov/nasa-brand-center/images-and-media/" },
    presentationOnly: true,
    scientificAuthority: false,
    metadataReceiptSha256: metadata.receiptSha256,
    urlLedgerReceiptSha256: nextLedger.receiptSha256,
  };
  renameSync(partPath, finalPath);
  const receipt = writeSealed(receiptPath, {
    version: "v591-nasa-image-visual-asset-acquisition-v1",
    status: "committed-single-request-no-retry",
    acquiredAt: new Date().toISOString(),
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    asset: record,
  });
  console.log(JSON.stringify({ status: receipt.status, asset: { id: record.id, bytes, sha256: record.sha256, width: record.width, height: record.height }, receiptSha256: receipt.receiptSha256 }, null, 2));
} catch (error) {
  rmSync(partPath, { force: true });
  const blocked = writeSealed(blockedPath, {
    version: "v591-nasa-image-visual-asset-acquisition-blocked-v1",
    status: "blocked-no-automatic-retry",
    failedAt: new Date().toISOString(),
    id: requestedId,
    target: asset.target,
    url: asset.sourceUrl,
    requestCount: 1,
    automaticRetryPerformed: false,
    automaticReplacementPerformed: false,
    error: error instanceof Error ? error.message : String(error),
  });
  console.error(JSON.stringify({ status: blocked.status, id: requestedId, error: blocked.error, receiptSha256: blocked.receiptSha256 }, null, 2));
  throw error;
}
