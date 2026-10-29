import {
  KERR_CLASSIFICATION_V299,
  encodeKerrSciencePixelV299,
  validateKerrScienceTransferPayloadV299,
  type KerrSciencePixelV299,
  type KerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";

export const KERR_SCIENCE_RASTER_VERSION_V307 = "v307-kerr-sparse-science-raster-v1" as const;
export const KERR_SCIENCE_RASTER_SIZE_V307 = 256 as const;

export type KerrScienceGlyphPixelV307 = Readonly<{
  dx: number;
  dy: number;
  color: KerrSciencePixelV299;
  channel: "classification" | "image-order" | "evpa";
}>;

export type KerrScienceGlyphV307 = Readonly<{
  pixels: readonly KerrScienceGlyphPixelV307[];
  imageOrderRadius: number | null;
  imageOrderCapped: boolean;
  evpaDirection: readonly [number, number] | null;
}>;

export type KerrScienceRasterV307 = Readonly<{
  version: typeof KERR_SCIENCE_RASTER_VERSION_V307;
  width: typeof KERR_SCIENCE_RASTER_SIZE_V307;
  height: typeof KERR_SCIENCE_RASTER_SIZE_V307;
  rgba: Uint8Array<ArrayBuffer>;
  summary: Readonly<{
    sampleCount: 16;
    captureCount: 6;
    escapeCount: 6;
    diskHitCount: 4;
    evpaGlyphCount: 4;
    imageOrderGlyphCount: 4;
    imageOrderCappedCount: number;
  }>;
  encoding: Readonly<{
    classification: "fixed-shape-and-v299-color";
    redshift: "fixed-v299-disk-color";
    evpa: "zamo-screen-180deg-line";
    imageOrder: "square-radius-min-11-exact-value-in-v306-workbench";
    intensity: "exact-v306-workbench-only-not-rasterized";
    sourcePayloadMutationAllowed: false;
    cinematicBufferShared: false;
  }>;
  boundary: "sparse-authority-visualization-not-dense-transfer-map";
}>;

const EVPA_COLOR = [222, 250, 255, 255] as const;
const IMAGE_ORDER_COLOR = [255, 204, 102, 210] as const;
const VALID_CLASSIFICATIONS = new Set<number>([
  KERR_CLASSIFICATION_V299.capture,
  KERR_CLASSIFICATION_V299.escape,
  KERR_CLASSIFICATION_V299["disk-hit"],
]);

function put(
  pixels: Map<string, KerrScienceGlyphPixelV307>,
  dx: number,
  dy: number,
  color: KerrSciencePixelV299,
  channel: KerrScienceGlyphPixelV307["channel"],
): void {
  pixels.set(`${dx}:${dy}`, Object.freeze({ dx, dy, color, channel }));
}

function drawLine(
  pixels: Map<string, KerrScienceGlyphPixelV307>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: KerrSciencePixelV299,
  channel: KerrScienceGlyphPixelV307["channel"],
): void {
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  while (true) {
    put(pixels, x, y, color, channel);
    if (x === x1 && y === y1) break;
    const twice = 2 * error;
    if (twice >= dy) {
      error += dy;
      x += sx;
    }
    if (twice <= dx) {
      error += dx;
      y += sy;
    }
  }
}

export function createKerrScienceGlyphV307(args: Readonly<{
  classification: number;
  redshiftFactor: number;
  redshiftApplicable: boolean;
  imageOrder: number | null;
  evpaDeg: number | null;
}>): KerrScienceGlyphV307 {
  const diskHit = args.classification === KERR_CLASSIFICATION_V299["disk-hit"];
  if (!VALID_CLASSIFICATIONS.has(args.classification)) {
    throw new Error("v307-classification-invalid");
  }
  if (diskHit) {
    if (!args.redshiftApplicable || !Number.isFinite(args.redshiftFactor) || args.redshiftFactor <= 0
      || !Number.isSafeInteger(args.imageOrder) || Number(args.imageOrder) < 0
      || !Number.isFinite(args.evpaDeg)) throw new Error("v307-disk-observable-invalid");
  } else if (args.redshiftApplicable || Number.isFinite(args.redshiftFactor) || args.imageOrder !== null || args.evpaDeg !== null) {
    throw new Error("v307-nondisk-observable-must-be-unavailable");
  }
  const pixels = new Map<string, KerrScienceGlyphPixelV307>();
  const baseColor = encodeKerrSciencePixelV299(args.classification, args.redshiftFactor, args.redshiftApplicable);
  if (args.classification === KERR_CLASSIFICATION_V299.capture) {
    for (let dy = -3; dy <= 3; dy += 1) {
      for (let dx = -3; dx <= 3; dx += 1) if (Math.abs(dx) + Math.abs(dy) <= 3) put(pixels, dx, dy, baseColor, "classification");
    }
  } else if (args.classification === KERR_CLASSIFICATION_V299.escape) {
    for (let offset = -3; offset <= 3; offset += 1) {
      put(pixels, offset, -3, baseColor, "classification");
      put(pixels, offset, 3, baseColor, "classification");
      put(pixels, -3, offset, baseColor, "classification");
      put(pixels, 3, offset, baseColor, "classification");
    }
  } else {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) put(pixels, dx, dy, baseColor, "classification");
    }
  }

  let imageOrderRadius: number | null = null;
  let imageOrderCapped = false;
  let evpaDirection: readonly [number, number] | null = null;
  if (diskHit) {
    imageOrderRadius = Math.min(11, 3 + Number(args.imageOrder));
    imageOrderCapped = 3 + Number(args.imageOrder) > 11;
    for (let offset = -imageOrderRadius; offset <= imageOrderRadius; offset += 1) {
      put(pixels, offset, -imageOrderRadius, IMAGE_ORDER_COLOR, "image-order");
      put(pixels, offset, imageOrderRadius, IMAGE_ORDER_COLOR, "image-order");
      put(pixels, -imageOrderRadius, offset, IMAGE_ORDER_COLOR, "image-order");
      put(pixels, imageOrderRadius, offset, IMAGE_ORDER_COLOR, "image-order");
    }
    const angle = Number(args.evpaDeg) * Math.PI / 180;
    const directionX = Math.round(Math.cos(angle) * 6);
    const directionYRaw = -Math.round(Math.sin(angle) * 6);
    const directionY = Object.is(directionYRaw, -0) ? 0 : directionYRaw;
    evpaDirection = Object.freeze([directionX, directionY]);
    drawLine(pixels, -directionX, -directionY, directionX, directionY, EVPA_COLOR, "evpa");
  }
  return Object.freeze({
    pixels: Object.freeze([...pixels.values()]),
    imageOrderRadius,
    imageOrderCapped,
    evpaDirection,
  });
}

function writePixel(data: Uint8Array<ArrayBuffer>, x: number, y: number, color: KerrSciencePixelV299): void {
  if (x < 0 || x >= KERR_SCIENCE_RASTER_SIZE_V307 || y < 0 || y >= KERR_SCIENCE_RASTER_SIZE_V307) return;
  data.set(color, (y * KERR_SCIENCE_RASTER_SIZE_V307 + x) * 4);
}

export function createKerrScienceRasterV307(payload: KerrScienceTransferPayloadV299): KerrScienceRasterV307 {
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`v307-payload-invalid:${validation.failures.join(",")}`);
  if ((payload.authorityKind !== "v296-v297-short-gate-sparse" && payload.authorityKind !== "v312-v313-short-gate-sparse")
    || payload.denseCampaignComplete || payload.sampleCount !== 16) {
    throw new Error("v307-sparse-authority-boundary");
  }
  const rgba = new Uint8Array(new ArrayBuffer(KERR_SCIENCE_RASTER_SIZE_V307 ** 2 * 4));
  let captureCount = 0;
  let escapeCount = 0;
  let diskHitCount = 0;
  let evpaGlyphCount = 0;
  let imageOrderGlyphCount = 0;
  let imageOrderCappedCount = 0;
  for (let index = 0; index < payload.sampleCount; index += 1) {
    const classification = payload.classification[index];
    if (classification === KERR_CLASSIFICATION_V299.capture) captureCount += 1;
    else if (classification === KERR_CLASSIFICATION_V299.escape) escapeCount += 1;
    else diskHitCount += 1;
    const glyph = createKerrScienceGlyphV307({
      classification,
      redshiftFactor: payload.redshiftFactor[index],
      redshiftApplicable: payload.redshiftApplicable[index] === 1,
      imageOrder: payload.imageOrderApplicable[index] === 1 ? payload.imageOrder[index] : null,
      evpaDeg: payload.evpaApplicable[index] === 1 ? payload.evpaDeg[index] : null,
    });
    if (glyph.evpaDirection) evpaGlyphCount += 1;
    if (glyph.imageOrderRadius !== null) imageOrderGlyphCount += 1;
    if (glyph.imageOrderCapped) imageOrderCappedCount += 1;
    const centerX = Math.round((payload.alphaM[index] / 44 + 0.5) * (KERR_SCIENCE_RASTER_SIZE_V307 - 1));
    const centerY = Math.round((0.5 - payload.betaM[index] / 32) * (KERR_SCIENCE_RASTER_SIZE_V307 - 1));
    for (const pixel of glyph.pixels) writePixel(rgba, centerX + pixel.dx, centerY + pixel.dy, pixel.color);
  }
  if (captureCount !== 6 || escapeCount !== 6 || diskHitCount !== 4 || evpaGlyphCount !== 4 || imageOrderGlyphCount !== 4) {
    throw new Error("v307-glyph-count-conservation");
  }
  return Object.freeze({
    version: KERR_SCIENCE_RASTER_VERSION_V307,
    width: KERR_SCIENCE_RASTER_SIZE_V307,
    height: KERR_SCIENCE_RASTER_SIZE_V307,
    rgba,
    summary: Object.freeze({
      sampleCount: 16,
      captureCount: 6,
      escapeCount: 6,
      diskHitCount: 4,
      evpaGlyphCount: 4,
      imageOrderGlyphCount: 4,
      imageOrderCappedCount,
    }),
    encoding: Object.freeze({
      classification: "fixed-shape-and-v299-color",
      redshift: "fixed-v299-disk-color",
      evpa: "zamo-screen-180deg-line",
      imageOrder: "square-radius-min-11-exact-value-in-v306-workbench",
      intensity: "exact-v306-workbench-only-not-rasterized",
      sourcePayloadMutationAllowed: false,
      cinematicBufferShared: false,
    }),
    boundary: "sparse-authority-visualization-not-dense-transfer-map",
  });
}
