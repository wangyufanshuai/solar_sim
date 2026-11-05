import { createHash } from "node:crypto";

const INTEGER_PATTERN = "(-?\\d+)";
const DECIMAL_PATTERN = "(-?\\d+(?:\\.\\d+)?)";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function scalar(header, key, pattern = INTEGER_PATTERN) {
  const match = header.match(new RegExp(`(?:^|\\n)\\s*${key}\\s*=\\s*${pattern}(?:\\s|$)`, "i"));
  assert(match, `v591-isis-header-${key.toLowerCase()}`);
  return Number(match[1]);
}

function textScalar(header, key) {
  const match = header.match(new RegExp(`(?:^|\\n)\\s*${key}\\s*=\\s*([^\\r\\n]+)`, "i"));
  assert(match, `v591-isis-header-${key.toLowerCase()}`);
  return match[1].trim().replace(/^"|"$/g, "");
}

export function parseIsisTiledCubeLayout(header) {
  assert(typeof header === "string" && header.length > 0, "v591-isis-header-empty");
  assert(/Object\s*=\s*IsisCube/i.test(header), "v591-isis-object");
  assert(/TargetName\s*=\s*Venus/i.test(header), "v591-isis-target");

  const layout = Object.freeze({
    startByte: scalar(header, "StartByte"),
    format: textScalar(header, "Format"),
    tileSamples: scalar(header, "TileSamples"),
    tileLines: scalar(header, "TileLines"),
    samples: scalar(header, "Samples"),
    lines: scalar(header, "Lines"),
    bands: scalar(header, "Bands"),
    type: textScalar(header, "Type"),
    byteOrder: textScalar(header, "ByteOrder"),
    base: scalar(header, "Base", DECIMAL_PATTERN),
    multiplier: scalar(header, "Multiplier", DECIMAL_PATTERN),
    projectionName: textScalar(header, "ProjectionName"),
    longitudeDirection: textScalar(header, "LongitudeDirection"),
    longitudeDomain: scalar(header, "LongitudeDomain"),
    minimumLatitude: scalar(header, "MinimumLatitude", DECIMAL_PATTERN),
    maximumLatitude: scalar(header, "MaximumLatitude", DECIMAL_PATTERN),
    minimumLongitude: scalar(header, "MinimumLongitude", DECIMAL_PATTERN),
    maximumLongitude: scalar(header, "MaximumLongitude", DECIMAL_PATTERN),
  });

  assert(layout.startByte > 0, "v591-isis-start-byte");
  assert(/^tile$/i.test(layout.format), `v591-isis-format:${layout.format}`);
  assert(/^unsignedbyte$/i.test(layout.type), `v591-isis-type:${layout.type}`);
  assert(/^lsb$/i.test(layout.byteOrder), `v591-isis-byte-order:${layout.byteOrder}`);
  assert(layout.base === 0 && layout.multiplier === 1, "v591-isis-byte-scaling");
  assert(layout.samples > 0 && layout.lines > 0 && layout.bands > 0, "v591-isis-dimensions");
  assert(layout.tileSamples > 0 && layout.tileLines > 0, "v591-isis-tile-dimensions");
  assert(/^equirectangular$/i.test(layout.projectionName), `v591-isis-projection:${layout.projectionName}`);
  assert(/^positiveeast$/i.test(layout.longitudeDirection), `v591-isis-longitude-direction:${layout.longitudeDirection}`);
  assert(layout.longitudeDomain === 180, `v591-isis-longitude-domain:${layout.longitudeDomain}`);
  assert(layout.minimumLatitude === -90 && layout.maximumLatitude === 90, "v591-isis-latitude-coverage");
  assert(layout.minimumLongitude === -180 && layout.maximumLongitude === 180, "v591-isis-longitude-coverage");
  return layout;
}

export function decodeUnsignedByteTiledCube(cubeBytes, layout) {
  assert(Buffer.isBuffer(cubeBytes) || cubeBytes instanceof Uint8Array, "v591-isis-buffer");
  const source = Buffer.isBuffer(cubeBytes)
    ? cubeBytes
    : Buffer.from(cubeBytes.buffer, cubeBytes.byteOffset, cubeBytes.byteLength);
  const tilesX = Math.ceil(layout.samples / layout.tileSamples);
  const tilesY = Math.ceil(layout.lines / layout.tileLines);
  const tileByteLength = layout.tileSamples * layout.tileLines;
  const coreOffset = layout.startByte - 1;
  const coreByteLength = tilesX * tilesY * layout.bands * tileByteLength;
  assert(coreOffset >= 0 && coreOffset + coreByteLength <= source.byteLength, "v591-isis-core-bounds");

  const decoded = Buffer.allocUnsafe(layout.samples * layout.lines * layout.bands);
  for (let band = 0; band < layout.bands; band += 1) {
    for (let tileY = 0; tileY < tilesY; tileY += 1) {
      for (let tileX = 0; tileX < tilesX; tileX += 1) {
        const tileIndex = (band * tilesY + tileY) * tilesX + tileX;
        const tileOffset = coreOffset + tileIndex * tileByteLength;
        const copyWidth = Math.min(layout.tileSamples, layout.samples - tileX * layout.tileSamples);
        const copyHeight = Math.min(layout.tileLines, layout.lines - tileY * layout.tileLines);
        for (let row = 0; row < copyHeight; row += 1) {
          const sourceRow = tileOffset + row * layout.tileSamples;
          const pixelRow = (tileY * layout.tileLines + row) * layout.samples + tileX * layout.tileSamples;
          for (let column = 0; column < copyWidth; column += 1) {
            decoded[(pixelRow + column) * layout.bands + band] = source[sourceRow + column];
          }
        }
      }
    }
  }

  return Object.freeze({
    pixels: decoded,
    coreOffset,
    coreByteLength,
    coreEndOffset: coreOffset + coreByteLength,
    tilesX,
    tilesY,
    tileByteLength,
  });
}

export function analyzeDecodedCube(pixels, layout) {
  assert(Buffer.isBuffer(pixels) && pixels.byteLength === layout.samples * layout.lines * layout.bands, "v591-isis-analysis-buffer");
  const channelMinimum = Array(layout.bands).fill(255);
  const channelMaximum = Array(layout.bands).fill(0);
  const channelSum = Array(layout.bands).fill(0);
  let blackPixels = 0;
  let whitePixels = 0;
  let seamAbsoluteDifference = 0;
  let seamSamples = 0;
  let ordinaryGradient = 0;
  let ordinaryGradientSamples = 0;
  let tileBoundaryGradient = 0;
  let tileBoundaryGradientSamples = 0;

  for (let y = 0; y < layout.lines; y += 1) {
    const rowOffset = y * layout.samples * layout.bands;
    let black = true;
    let white = true;
    for (let x = 0; x < layout.samples; x += 1) {
      const pixelOffset = rowOffset + x * layout.bands;
      black = true;
      white = true;
      for (let band = 0; band < layout.bands; band += 1) {
        const value = pixels[pixelOffset + band];
        channelMinimum[band] = Math.min(channelMinimum[band], value);
        channelMaximum[band] = Math.max(channelMaximum[band], value);
        channelSum[band] += value;
        if (value > 2) black = false;
        if (value < 253) white = false;
      }
      if (black) blackPixels += 1;
      if (white) whitePixels += 1;
      if (x > 0) {
        let gradient = 0;
        for (let band = 0; band < layout.bands; band += 1) {
          gradient += Math.abs(pixels[pixelOffset + band] - pixels[pixelOffset - layout.bands + band]);
        }
        gradient /= layout.bands;
        if (x % layout.tileSamples === 0) {
          tileBoundaryGradient += gradient;
          tileBoundaryGradientSamples += 1;
        } else {
          ordinaryGradient += gradient;
          ordinaryGradientSamples += 1;
        }
      }
    }
    const first = rowOffset;
    const last = rowOffset + (layout.samples - 1) * layout.bands;
    for (let band = 0; band < layout.bands; band += 1) {
      seamAbsoluteDifference += Math.abs(pixels[first + band] - pixels[last + band]);
      seamSamples += 1;
    }
  }

  const pixelCount = layout.samples * layout.lines;
  const ordinaryMean = ordinaryGradient / Math.max(1, ordinaryGradientSamples);
  const tileBoundaryMean = tileBoundaryGradient / Math.max(1, tileBoundaryGradientSamples);
  return Object.freeze({
    channelMinimum,
    channelMaximum,
    channelMean: channelSum.map((sum) => sum / pixelCount),
    blackPixelFraction: blackPixels / pixelCount,
    whitePixelFraction: whitePixels / pixelCount,
    longitudeSeamMeanAbsoluteDifference: seamAbsoluteDifference / Math.max(1, seamSamples),
    ordinaryHorizontalGradientMean: ordinaryMean,
    tileBoundaryHorizontalGradientMean: tileBoundaryMean,
    tileBoundaryGradientRatio: tileBoundaryMean / Math.max(1e-9, ordinaryMean),
    decodedPixelSha256: createHash("sha256").update(pixels).digest("hex"),
  });
}

