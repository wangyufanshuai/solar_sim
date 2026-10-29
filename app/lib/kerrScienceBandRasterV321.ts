import { KERR_FULL_SHORT_AUTHORITY_SHA256_V314 } from "./kerrCampaignV314";
import {
  createKerrScienceBufferSnapshotV317,
  kerrScienceBuffersDisjointFromV317,
  type KerrScienceBufferSnapshotV317,
} from "./kerrScienceBufferIntegrityV317";
import {
  KERR_SCIENCE_RASTER_SIZE_V307,
  createKerrScienceGlyphV307,
  createKerrScienceRasterV307,
  type KerrScienceRasterV307,
} from "./kerrScienceRasterV307";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  KERR_THIN_DISK_BAND_IMAGING_VERSION_V320,
  parseKerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandImagingViewV320,
} from "./kerrThinDiskBandImagingV320";
import {
  KERR_CLASSIFICATION_V299,
  validateKerrScienceTransferPayloadV299,
  type KerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";

export const KERR_SCIENCE_BAND_RASTER_VERSION_V321 = "v321-kerr-fixed-band-sparse-science-raster-v1" as const;

export type KerrScienceBandRasterV321 = Readonly<{
  version: typeof KERR_SCIENCE_BAND_RASTER_VERSION_V321;
  width: typeof KERR_SCIENCE_RASTER_SIZE_V307;
  height: typeof KERR_SCIENCE_RASTER_SIZE_V307;
  rgba: Uint8Array<ArrayBuffer>;
  sourceRasterVersion: KerrScienceRasterV307["version"];
  sourceBandViewVersion: typeof KERR_THIN_DISK_BAND_IMAGING_VERSION_V320;
  sourceBandArtifactSha256: typeof KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320;
  sourceFullShortAuthoritySha256: typeof KERR_FULL_SHORT_AUTHORITY_SHA256_V314;
  summary: KerrScienceRasterV307["summary"] & Readonly<{
    fixedBandColoredDiskRayCount: 4;
    fixedBandCount: 3;
    explicitSaturationFlagCount: 12;
    saturatedChannelCount: number;
  }>;
  encoding: Readonly<{
    classification: "fixed-v307-shapes";
    diskHitColor: "v320-fixed-reference-linear-rgb";
    physicalBandRadiance: "exact-si-in-v320-artifact-not-encoded-as-scalar-raster";
    redshift: "included-in-v320-observer-band-integral";
    evpa: "zamo-screen-180deg-line";
    imageOrder: "v307-square-contour";
    normalization: "fixed-physical-reference-no-data-adaptive-rescale";
    transferFunction: "linear-rgb-clamp-per-channel-explicit-saturation";
    sourcePayloadMutationAllowed: false;
    sourceBandViewMutationAllowed: false;
    cinematicBufferShared: false;
  }>;
  boundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map";
}>;

export type KerrScienceBandRasterIntegrityV321 = Readonly<{
  version: "v321-kerr-science-band-raster-integrity-v1";
  payloadBefore: KerrScienceBufferSnapshotV317;
  payloadAfter: KerrScienceBufferSnapshotV317;
  payloadUnchanged: true;
  bandViewDigestBeforeSha256: string;
  bandViewDigestAfterSha256: string;
  bandViewUnchanged: true;
  bandArtifactSha256: typeof KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320;
  rasterDigestSha256: string;
  rasterBufferDisjoint: true;
  cinematicBufferShared: false;
  denseBoundary: "sparse-authority-dense-incomplete";
}>;

export type KerrScienceBandRasterWithIntegrityV321 = Readonly<{
  raster: KerrScienceBandRasterV321;
  integrity: KerrScienceBandRasterIntegrityV321;
}>;

const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(parts: readonly Uint8Array<ArrayBuffer>[]): Promise<string> {
  const byteLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const framed = new Uint8Array(new ArrayBuffer(byteLength));
  let offset = 0;
  for (const part of parts) {
    framed.set(part, offset);
    offset += part.byteLength;
  }
  return hex(await crypto.subtle.digest("SHA-256", framed));
}

function classificationLabel(code: number): "capture" | "escape" | "disk-hit" {
  return code === KERR_CLASSIFICATION_V299.capture ? "capture"
    : code === KERR_CLASSIFICATION_V299.escape ? "escape"
      : code === KERR_CLASSIFICATION_V299["disk-hit"] ? "disk-hit"
        : (() => { throw new Error("v321-classification-invalid"); })();
}

function putPixel(data: Uint8Array<ArrayBuffer>, x: number, y: number, color: readonly [number, number, number, number]): void {
  if (x < 0 || x >= KERR_SCIENCE_RASTER_SIZE_V307 || y < 0 || y >= KERR_SCIENCE_RASTER_SIZE_V307) return;
  data.set(color, (y * KERR_SCIENCE_RASTER_SIZE_V307 + x) * 4);
}

function bandViewDigestBytes(view: KerrThinDiskBandImagingViewV320): Uint8Array<ArrayBuffer> {
  return encoder.encode(JSON.stringify(view));
}

export function createKerrScienceBandRasterV321(
  payload: KerrScienceTransferPayloadV299,
  inputBandView: KerrThinDiskBandImagingViewV320,
): KerrScienceBandRasterV321 {
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`v321-payload-invalid:${validation.failures.join(",")}`);
  if (payload.authorityKind !== "v312-v313-short-gate-sparse" || payload.denseCampaignComplete
    || payload.denseAggregateSha256 !== null || payload.sampleCount !== 16) {
    throw new Error("v321-sparse-authority-boundary");
  }
  const bandView = parseKerrThinDiskBandImagingViewV320(inputBandView);
  if (bandView.source.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || bandView.source.denseAggregateSha256 !== null) throw new Error("v321-band-authority-boundary");
  const base = createKerrScienceRasterV307(payload);
  const rgba = Uint8Array.from(base.rgba);
  let fixedBandColoredDiskRayCount = 0;
  for (let index = 0; index < payload.sampleCount; index += 1) {
    const sample = bandView.samples[index];
    const classification = classificationLabel(payload.classification[index]);
    if (sample.rayIndex !== index || sample.classification !== classification
      || Math.abs(sample.spinA - payload.spinA[index]) > 1e-12) throw new Error("v321-ray-identity-mismatch");
    if (classification !== "disk-hit") {
      if (sample.applicable || sample.bands !== null || sample.falseColor !== null) throw new Error("v321-nondisk-band-applicability");
      continue;
    }
    if (!sample.applicable || !sample.falseColor || !sample.bands || sample.bands.length !== 3) {
      throw new Error("v321-disk-band-unavailable");
    }
    fixedBandColoredDiskRayCount += 1;
    const [red, green, blue] = sample.falseColor.linearRgbClipped;
    const color = Object.freeze([
      Math.round(red * 255),
      Math.round(green * 255),
      Math.round(blue * 255),
      255,
    ]) as readonly [number, number, number, number];
    const glyph = createKerrScienceGlyphV307({
      classification: payload.classification[index],
      redshiftFactor: payload.redshiftFactor[index],
      redshiftApplicable: payload.redshiftApplicable[index] === 1,
      imageOrder: payload.imageOrderApplicable[index] === 1 ? payload.imageOrder[index] : null,
      evpaDeg: payload.evpaApplicable[index] === 1 ? payload.evpaDeg[index] : null,
    });
    const centerX = Math.round((payload.alphaM[index] / 44 + 0.5) * (KERR_SCIENCE_RASTER_SIZE_V307 - 1));
    const centerY = Math.round((0.5 - payload.betaM[index] / 32) * (KERR_SCIENCE_RASTER_SIZE_V307 - 1));
    for (const pixel of glyph.pixels) {
      if (pixel.channel === "classification") putPixel(rgba, centerX + pixel.dx, centerY + pixel.dy, color);
    }
  }
  if (fixedBandColoredDiskRayCount !== 4) throw new Error("v321-fixed-band-disk-count");
  return Object.freeze({
    version: KERR_SCIENCE_BAND_RASTER_VERSION_V321,
    width: KERR_SCIENCE_RASTER_SIZE_V307,
    height: KERR_SCIENCE_RASTER_SIZE_V307,
    rgba,
    sourceRasterVersion: base.version,
    sourceBandViewVersion: bandView.version,
    sourceBandArtifactSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
    sourceFullShortAuthoritySha256: KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
    summary: Object.freeze({
      ...base.summary,
      fixedBandColoredDiskRayCount: 4,
      fixedBandCount: 3,
      explicitSaturationFlagCount: bandView.counts.explicitSaturationFlagCount,
      saturatedChannelCount: bandView.counts.saturatedChannelCount,
    }),
    encoding: Object.freeze({
      classification: "fixed-v307-shapes",
      diskHitColor: "v320-fixed-reference-linear-rgb",
      physicalBandRadiance: "exact-si-in-v320-artifact-not-encoded-as-scalar-raster",
      redshift: "included-in-v320-observer-band-integral",
      evpa: "zamo-screen-180deg-line",
      imageOrder: "v307-square-contour",
      normalization: "fixed-physical-reference-no-data-adaptive-rescale",
      transferFunction: "linear-rgb-clamp-per-channel-explicit-saturation",
      sourcePayloadMutationAllowed: false,
      sourceBandViewMutationAllowed: false,
      cinematicBufferShared: false,
    }),
    boundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map",
  });
}

export async function createKerrScienceBandRasterWithIntegrityV321(
  payload: KerrScienceTransferPayloadV299,
  bandView: KerrThinDiskBandImagingViewV320,
): Promise<KerrScienceBandRasterWithIntegrityV321> {
  const payloadBefore = await createKerrScienceBufferSnapshotV317(payload);
  const bandViewDigestBeforeSha256 = await sha256([bandViewDigestBytes(parseKerrThinDiskBandImagingViewV320(bandView))]);
  const raster = createKerrScienceBandRasterV321(payload, bandView);
  const payloadAfter = await createKerrScienceBufferSnapshotV317(payload);
  const bandViewDigestAfterSha256 = await sha256([bandViewDigestBytes(parseKerrThinDiskBandImagingViewV320(bandView))]);
  if (payloadBefore.digestSha256 !== payloadAfter.digestSha256) throw new Error("v321-science-payload-mutated-by-band-raster");
  if (bandViewDigestBeforeSha256 !== bandViewDigestAfterSha256) throw new Error("v321-band-view-mutated-by-raster");
  if (!kerrScienceBuffersDisjointFromV317(payload, [raster.rgba])) throw new Error("v321-band-raster-buffer-alias");
  const rasterDigestSha256 = await sha256([
    encoder.encode(`${raster.version}\0${raster.width}\0${raster.height}\0${raster.boundary}\0${raster.sourceBandArtifactSha256}\0`),
    Uint8Array.from(raster.rgba),
  ]);
  if (payloadBefore.denseBoundary !== "sparse-authority-dense-incomplete") throw new Error("v321-dense-boundary");
  return Object.freeze({
    raster,
    integrity: Object.freeze({
      version: "v321-kerr-science-band-raster-integrity-v1",
      payloadBefore,
      payloadAfter,
      payloadUnchanged: true,
      bandViewDigestBeforeSha256,
      bandViewDigestAfterSha256,
      bandViewUnchanged: true,
      bandArtifactSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
      rasterDigestSha256,
      rasterBufferDisjoint: true,
      cinematicBufferShared: false,
      denseBoundary: "sparse-authority-dense-incomplete",
    }),
  });
}
