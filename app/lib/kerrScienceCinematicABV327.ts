import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V299,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V300,
  resolveAtlasVisualProfileV299,
} from "./atlasVisualProfileV299";
import {
  createKerrCinematicRgbaV305,
  resolveKerrStrongGravityVisualContractV305,
} from "./kerrStrongGravityVisualV305";
import {
  KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320,
  parseKerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandImagingViewV320,
} from "./kerrThinDiskBandImagingV320";

export const KERR_SCIENCE_CINEMATIC_AB_VERSION_V327 = "v327-kerr-science-cinematic-ab-swatch-v1" as const;
export const KERR_SCIENCE_CINEMATIC_AB_ARTIFACT_SHA256_V327 = "414bc7cff8bea20b05cfc2d26b9303d6dd30dd8346edd404fe9f29f7b8ab0592" as const;

export type KerrScienceCinematicABSwatchV327 = Readonly<{
  rayIndex: number;
  spinA: number;
  redshiftFactor: number;
  scienceLinearRgb: readonly [number, number, number];
  scienceDisplayRgb8: readonly [number, number, number];
  v5CinematicRgba8: readonly [number, number, number, number];
  v6CinematicRgba8: readonly [number, number, number, number];
}>;

export type KerrScienceCinematicABViewV327 = Readonly<{
  version: typeof KERR_SCIENCE_CINEMATIC_AB_VERSION_V327;
  status: "qualified-deterministic-science-cinematic-ab";
  source: Readonly<{
    bandArtifactSha256: typeof KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320;
    denseAggregateSha256: null;
  }>;
  profiles: readonly ["science-cinematic-v5-v299", "science-cinematic-v6-v300"];
  tokens: Readonly<{
    v5: Readonly<{ exposure: number; bloom: number; detailSeed: number; redshiftColorStrength: number; dopplerColorStrength: number }>;
    v6: Readonly<{ exposure: number; bloom: number; detailSeed: number; redshiftColorStrength: number; dopplerColorStrength: number }>;
  }>;
  swatches: readonly KerrScienceCinematicABSwatchV327[];
  scienceValuesUnchanged: true;
  scienceBuffersDisjoint: true;
  cinematicBuffersDisjoint: true;
  profileOutputsDistinct: true;
  presentationMapping: "v305-production-cinematic-rgba-from-bounded-four-disk-ray-reference";
  scienceBoundary: "fixed-linear-rgb-no-grade-no-bloom-no-noise";
  cinematicBoundary: "seeded-presentation-copy-never-science-measurement";
  defaultBoundary: "manual-local-shadow-ab-only-default-legacy-v9";
}>;

function byte(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 255);
}

function rgbaAt(data: Uint8Array, index: number): readonly [number, number, number, number] {
  const offset = index * 4;
  return Object.freeze([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]) as readonly [number, number, number, number];
}

export function createKerrScienceCinematicABViewV327(
  value: KerrThinDiskBandImagingViewV320,
): KerrScienceCinematicABViewV327 {
  const source = parseKerrThinDiskBandImagingViewV320(value);
  const diskRays = source.samples.filter((sample) => sample.applicable);
  if (diskRays.length !== 4 || diskRays.some((sample) => sample.classification !== "disk-hit" || sample.falseColor == null || sample.redshiftFactor == null)) {
    throw new Error("v327-disk-ray-source-boundary");
  }
  const scienceBefore = JSON.stringify(diskRays.map((sample) => ({ rayIndex: sample.rayIndex, falseColor: sample.falseColor, redshiftFactor: sample.redshiftFactor })));
  const responseValues = new Float32Array(new ArrayBuffer(diskRays.length * 4 * Float32Array.BYTES_PER_ELEMENT));
  const scienceBytes = new Uint8Array(new ArrayBuffer(diskRays.length * 4));
  diskRays.forEach((sample, index) => {
    const falseColor = sample.falseColor;
    if (!falseColor || sample.redshiftFactor == null) throw new Error("v327-disk-ray-values-unavailable");
    const offset = index * 4;
    const meanLinearIntensity = falseColor.linearRgbClipped.reduce((sum, channel) => sum + channel, 0) / 3;
    responseValues[offset] = 3;
    responseValues[offset + 1] = sample.redshiftFactor;
    responseValues[offset + 2] = 0;
    responseValues[offset + 3] = meanLinearIntensity / 120;
    scienceBytes[offset] = byte(falseColor.linearRgbClipped[0]);
    scienceBytes[offset + 1] = byte(falseColor.linearRgbClipped[1]);
    scienceBytes[offset + 2] = byte(falseColor.linearRgbClipped[2]);
    scienceBytes[offset + 3] = 255;
  });
  const v5Contract = resolveKerrStrongGravityVisualContractV305(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V299), "cinematic");
  const v6Contract = resolveKerrStrongGravityVisualContractV305(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300), "cinematic");
  const v5Bytes = createKerrCinematicRgbaV305({ rayCount: diskRays.length, values: responseValues }, v5Contract);
  const v6Bytes = createKerrCinematicRgbaV305({ rayCount: diskRays.length, values: responseValues }, v6Contract);
  const scienceAfter = JSON.stringify(diskRays.map((sample) => ({ rayIndex: sample.rayIndex, falseColor: sample.falseColor, redshiftFactor: sample.redshiftFactor })));
  const swatches = diskRays.map((sample, index): KerrScienceCinematicABSwatchV327 => {
    if (!sample.falseColor || sample.redshiftFactor == null) throw new Error("v327-swatch-source-unavailable");
    const sourceOffset = index * 4;
    return Object.freeze({
      rayIndex: sample.rayIndex,
      spinA: sample.spinA,
      redshiftFactor: sample.redshiftFactor,
      scienceLinearRgb: Object.freeze([...sample.falseColor.linearRgbClipped]) as readonly [number, number, number],
      scienceDisplayRgb8: Object.freeze([scienceBytes[sourceOffset], scienceBytes[sourceOffset + 1], scienceBytes[sourceOffset + 2]]) as readonly [number, number, number],
      v5CinematicRgba8: rgbaAt(v5Bytes, index),
      v6CinematicRgba8: rgbaAt(v6Bytes, index),
    });
  });
  const profileOutputsDistinct = swatches.some((swatch) => swatch.v5CinematicRgba8.some((channel, index) => channel !== swatch.v6CinematicRgba8[index]));
  const scienceBuffersDisjoint = scienceBytes.buffer !== responseValues.buffer && scienceBytes.buffer !== v5Bytes.buffer && scienceBytes.buffer !== v6Bytes.buffer;
  const cinematicBuffersDisjoint = v5Bytes.buffer !== v6Bytes.buffer && v5Bytes.buffer !== responseValues.buffer && v6Bytes.buffer !== responseValues.buffer;
  if (scienceBefore !== scienceAfter || !scienceBuffersDisjoint || !cinematicBuffersDisjoint || !profileOutputsDistinct) {
    throw new Error("v327-science-cinematic-isolation");
  }
  return Object.freeze({
    version: KERR_SCIENCE_CINEMATIC_AB_VERSION_V327,
    status: "qualified-deterministic-science-cinematic-ab",
    source: Object.freeze({ bandArtifactSha256: KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320, denseAggregateSha256: null }),
    profiles: Object.freeze([ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300]) as readonly ["science-cinematic-v5-v299", "science-cinematic-v6-v300"],
    tokens: Object.freeze({
      v5: Object.freeze({ exposure: v5Contract.exposure, bloom: v5Contract.bloom, detailSeed: v5Contract.detailSeed, redshiftColorStrength: v5Contract.redshiftColorStrength, dopplerColorStrength: v5Contract.dopplerColorStrength }),
      v6: Object.freeze({ exposure: v6Contract.exposure, bloom: v6Contract.bloom, detailSeed: v6Contract.detailSeed, redshiftColorStrength: v6Contract.redshiftColorStrength, dopplerColorStrength: v6Contract.dopplerColorStrength }),
    }),
    swatches: Object.freeze(swatches),
    scienceValuesUnchanged: true,
    scienceBuffersDisjoint: true,
    cinematicBuffersDisjoint: true,
    profileOutputsDistinct: true,
    presentationMapping: "v305-production-cinematic-rgba-from-bounded-four-disk-ray-reference",
    scienceBoundary: "fixed-linear-rgb-no-grade-no-bloom-no-noise",
    cinematicBoundary: "seeded-presentation-copy-never-science-measurement",
    defaultBoundary: "manual-local-shadow-ab-only-default-legacy-v9",
  });
}

export function parseKerrScienceCinematicABViewV327(value: unknown): KerrScienceCinematicABViewV327 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceCinematicABViewV327> : null;
  if (!source || source.version !== KERR_SCIENCE_CINEMATIC_AB_VERSION_V327
    || source.status !== "qualified-deterministic-science-cinematic-ab"
    || source.source?.bandArtifactSha256 !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320 || source.source.denseAggregateSha256 !== null
    || source.profiles?.join(",") !== "science-cinematic-v5-v299,science-cinematic-v6-v300"
    || !Array.isArray(source.swatches) || source.swatches.length !== 4
    || source.scienceValuesUnchanged !== true || source.scienceBuffersDisjoint !== true || source.cinematicBuffersDisjoint !== true || source.profileOutputsDistinct !== true
    || source.presentationMapping !== "v305-production-cinematic-rgba-from-bounded-four-disk-ray-reference"
    || source.scienceBoundary !== "fixed-linear-rgb-no-grade-no-bloom-no-noise"
    || source.cinematicBoundary !== "seeded-presentation-copy-never-science-measurement"
    || source.defaultBoundary !== "manual-local-shadow-ab-only-default-legacy-v9") throw new Error("v327-ab-view-identity");
  return value as KerrScienceCinematicABViewV327;
}
