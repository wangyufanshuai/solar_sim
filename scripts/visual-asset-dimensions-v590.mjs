const KTX2_IDENTIFIER_V590 = Buffer.from([
  0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb,
  0x0d, 0x0a, 0x1a, 0x0a,
]);

function assertDimensionV590(width, height, format) {
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`v590-${format}-dimensions`);
  }
  return Object.freeze({ width, height });
}

export function parseKtx2DimensionsV590(bytes) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (buffer.byteLength < 48 || !buffer.subarray(0, 12).equals(KTX2_IDENTIFIER_V590)) {
    throw new Error("v590-ktx2-header");
  }
  const width = buffer.readUInt32LE(20);
  const height = buffer.readUInt32LE(24);
  const faceCount = buffer.readUInt32LE(36);
  const levelCount = buffer.readUInt32LE(40);
  if (faceCount !== 1 || levelCount < 1) throw new Error("v590-ktx2-layout");
  return assertDimensionV590(width, height, "ktx2");
}

function parsePngDimensionsV590(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.byteLength < 24 || !buffer.subarray(0, 8).equals(signature) || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("v590-png-header");
  }
  return assertDimensionV590(buffer.readUInt32BE(16), buffer.readUInt32BE(20), "png");
}

function parseJpegDimensionsV590(buffer) {
  if (buffer.byteLength < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("v590-jpeg-header");
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 4 <= buffer.byteLength) {
    while (offset < buffer.byteLength && buffer[offset] !== 0xff) offset += 1;
    while (offset < buffer.byteLength && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.byteLength) break;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.byteLength) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.byteLength) throw new Error("v590-jpeg-segment");
    if (sofMarkers.has(marker)) {
      if (length < 7) throw new Error("v590-jpeg-sof");
      return assertDimensionV590(buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3), "jpeg");
    }
    offset += length;
  }
  throw new Error("v590-jpeg-sof-missing");
}

function readUInt24LEV590(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function parseWebpDimensionsV590(buffer) {
  if (buffer.byteLength < 20 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("v590-webp-header");
  }
  let offset = 12;
  while (offset + 8 <= buffer.byteLength) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > buffer.byteLength) throw new Error("v590-webp-chunk");
    if (type === "VP8X") {
      if (size < 10) throw new Error("v590-webp-vp8x");
      return assertDimensionV590(1 + readUInt24LEV590(buffer, data + 4), 1 + readUInt24LEV590(buffer, data + 7), "webp");
    }
    if (type === "VP8L") {
      if (size < 5 || buffer[data] !== 0x2f) throw new Error("v590-webp-vp8l");
      const b1 = buffer[data + 1];
      const b2 = buffer[data + 2];
      const b3 = buffer[data + 3];
      const b4 = buffer[data + 4];
      const width = 1 + (((b2 & 0x3f) << 8) | b1);
      const height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | (b2 >> 6));
      return assertDimensionV590(width, height, "webp");
    }
    if (type === "VP8 ") {
      if (size < 10 || buffer[data + 3] !== 0x9d || buffer[data + 4] !== 0x01 || buffer[data + 5] !== 0x2a) {
        throw new Error("v590-webp-vp8");
      }
      return assertDimensionV590(buffer.readUInt16LE(data + 6) & 0x3fff, buffer.readUInt16LE(data + 8) & 0x3fff, "webp");
    }
    offset = data + size + (size & 1);
  }
  throw new Error("v590-webp-image-chunk-missing");
}

export function parseRasterDimensionsV590(bytes, format) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (format === "png") return parsePngDimensionsV590(buffer);
  if (format === "jpeg") return parseJpegDimensionsV590(buffer);
  if (format === "webp") return parseWebpDimensionsV590(buffer);
  throw new Error(`v590-raster-format:${format}`);
}

export function parseVisualAssetDimensionsV590(bytes, format) {
  if (format === "ktx2") return parseKtx2DimensionsV590(bytes);
  if (["webp", "jpeg", "png"].includes(format)) return parseRasterDimensionsV590(bytes, format);
  return null;
}
