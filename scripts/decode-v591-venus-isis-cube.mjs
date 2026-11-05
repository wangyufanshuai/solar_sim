import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import sharp from "sharp";

import {
  analyzeDecodedCube,
  decodeUnsignedByteTiledCube,
  parseIsisTiledCubeLayout,
} from "./lib/v591-isis-tile-cube.mjs";

const root = process.cwd();
const cubePath = resolve(root, "source-cache/celestial-convergence-v591/venus/Venus_Magellan_C3-MDIR_ClrTopo_Global_Mosaic_6600m-path-alias.cub");
const acquisitionReceiptPath = resolve(root, "docs/release/v591/acquisition-assets-venus-alternative/venus-clrtopo-6600m-cube-path-alias-v591.json");
const decodedPath = resolve(root, "source-cache/celestial-convergence-v591/venus/derived/Venus_Magellan_C3-MDIR_ClrTopo_Global_Mosaic_6600m-decoded.png");
const qaPath = resolve(root, "docs/release/v591/screenshots/venus-source-global-equirectangular-2048x1024-v591.png");
const receiptPath = resolve(root, "docs/release/v591/venus-isis-decode-receipt-v591.json");
const generatedAt = process.env.ATLAS_V591_GENERATED_AT ?? "2026-08-10T00:00:00Z";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) { if (!condition) throw new Error(message); }
function atomicWrite(path, bytes) {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  rmSync(part, { force: true });
  writeFileSync(part, bytes, { flag: "wx" });
  rmSync(path, { force: true });
  renameSync(part, path);
}
function verifySealed(value, label) {
  const unsigned = { ...value };
  delete unsigned.receiptSha256;
  assert(value.receiptSha256 === canonicalSha(unsigned), `v591-venus-isis-${label}-seal`);
}
async function shaFile(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
async function atomicSharpPng(path, operation) {
  mkdirSync(dirname(path), { recursive: true });
  const part = `${path}.${process.pid}.part`;
  rmSync(part, { force: true });
  await operation.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(part);
  rmSync(path, { force: true });
  renameSync(part, path);
}

assert(existsSync(cubePath), "v591-venus-isis-final-cube-missing");
assert(existsSync(acquisitionReceiptPath), "v591-venus-isis-acquisition-receipt-missing");
const acquisition = JSON.parse(readFileSync(acquisitionReceiptPath, "utf8"));
verifySealed(acquisition, "acquisition");
assert(acquisition.status === "committed-single-request-no-retry", "v591-venus-isis-acquisition-status");
assert(acquisition.requestCount === 1 && acquisition.automaticRetryPerformed === false && acquisition.automaticReplacementPerformed === false, "v591-venus-isis-acquisition-policy");
assert(acquisition.asset?.id === "venus-clrtopo-6600m-cube-path-alias-v591" && acquisition.asset?.role === "isis-cube", "v591-venus-isis-acquisition-identity");
assert(statSync(cubePath).size === acquisition.asset.bytes, "v591-venus-isis-source-bytes");
assert(await shaFile(cubePath) === acquisition.asset.sha256, "v591-venus-isis-source-sha");

const cube = readFileSync(cubePath);
const header = cube.subarray(0, Math.min(65536, cube.byteLength)).toString("ascii");
const layout = parseIsisTiledCubeLayout(header);
assert(layout.startByte === 65537, `v591-venus-isis-start-byte:${layout.startByte}`);
assert(layout.samples === 5761 && layout.lines === 2880 && layout.bands === 3, `v591-venus-isis-layout:${layout.samples}x${layout.lines}x${layout.bands}`);
assert(layout.tileSamples === 823 && layout.tileLines === 1440, `v591-venus-isis-tiles:${layout.tileSamples}x${layout.tileLines}`);

const decoded = decodeUnsignedByteTiledCube(cube, layout);
const analysis = analyzeDecodedCube(decoded.pixels, layout);
assert(decoded.tilesX === 7 && decoded.tilesY === 2, "v591-venus-isis-tile-grid");
assert(decoded.coreEndOffset <= cube.byteLength, "v591-venus-isis-core-end");
assert(analysis.channelMinimum.every(Number.isFinite) && analysis.channelMaximum.every(Number.isFinite), "v591-venus-isis-channel-range");
assert(analysis.blackPixelFraction < 0.08, `v591-venus-isis-black-border:${analysis.blackPixelFraction}`);
assert(analysis.tileBoundaryGradientRatio < 8, `v591-venus-isis-tile-order:${analysis.tileBoundaryGradientRatio}`);

const raw = { width: layout.samples, height: layout.lines, channels: layout.bands };
await atomicSharpPng(decodedPath, sharp(decoded.pixels, { raw, limitInputPixels: false }));
await atomicSharpPng(
  qaPath,
  sharp(decoded.pixels, { raw, limitInputPixels: false }).resize(2048, 1024, { fit: "fill", kernel: sharp.kernel.lanczos3 }),
);
const decodedBytes = readFileSync(decodedPath);
const qaBytes = readFileSync(qaPath);
const decodedMetadata = await sharp(decodedPath, { limitInputPixels: false }).metadata();
assert(decodedMetadata.width === layout.samples && decodedMetadata.height === layout.lines && decodedMetadata.channels === layout.bands, "v591-venus-isis-decoded-png");

const unsigned = {
  version: "v591-venus-isis-tile-decode-receipt-v1",
  generatedAt,
  status: "decoded-equirectangular-awaiting-visual-qa",
  acquisitionReceiptSha256: acquisition.receiptSha256,
  source: {
    path: acquisition.asset.outputPath,
    bytes: acquisition.asset.bytes,
    sha256: acquisition.asset.sha256,
    host: new URL(acquisition.asset.finalUrl).hostname,
    license: acquisition.asset.license,
    observationIdentity: acquisition.asset.observationIdentity,
    observationLimit: acquisition.asset.observationLimit,
  },
  layout: {
    ...layout,
    coreOffset: decoded.coreOffset,
    coreByteLength: decoded.coreByteLength,
    coreEndOffset: decoded.coreEndOffset,
    historyBytes: cube.byteLength - decoded.coreEndOffset,
    tilesX: decoded.tilesX,
    tilesY: decoded.tilesY,
    tileByteLength: decoded.tileByteLength,
    channelOrder: "source-band-order-rgb-pending-visual-confirmation",
    lineOrder: "north-to-south-from-equirectangular-upper-left",
  },
  analysis,
  outputs: {
    decoded: {
      path: "source-cache/celestial-convergence-v591/venus/derived/Venus_Magellan_C3-MDIR_ClrTopo_Global_Mosaic_6600m-decoded.png",
      bytes: decodedBytes.byteLength,
      sha256: sha256(decodedBytes),
      width: layout.samples,
      height: layout.lines,
      channels: layout.bands,
      colorSpace: "source-encoded-rgb-presentation-only",
    },
    qa: {
      path: "docs/release/v591/screenshots/venus-source-global-equirectangular-2048x1024-v591.png",
      bytes: qaBytes.byteLength,
      sha256: sha256(qaBytes),
      width: 2048,
      height: 1024,
      colorSpace: "source-encoded-rgb-presentation-only",
    },
  },
  policies: {
    noNetworkRequestsPerformed: true,
    deterministicTileOrder: "band-major;tile-row-major;tile-column-major;row-major-samples",
    reprojectionPerformed: false,
    labelsOrGridInjected: false,
    measuredTopographyClaim: false,
    scientificPayloadWriteback: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(receiptPath, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8"));

console.log(JSON.stringify({
  status: receipt.status,
  layout: `${layout.samples}x${layout.lines}x${layout.bands}`,
  tiles: `${decoded.tilesX}x${decoded.tilesY} per band`,
  decodedSha256: receipt.outputs.decoded.sha256,
  qaSha256: receipt.outputs.qa.sha256,
  blackPixelFraction: analysis.blackPixelFraction,
  seamMeanAbsoluteDifference: analysis.longitudeSeamMeanAbsoluteDifference,
  tileBoundaryGradientRatio: analysis.tileBoundaryGradientRatio,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
