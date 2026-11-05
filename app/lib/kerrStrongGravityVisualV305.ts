import type { KerrInteractiveComputeResponseV299 } from "./kerrInteractiveComputeV299";
import { sampleAtlasCinematicDetailV299, type AtlasVisualRendererProfileV299 } from "./atlasVisualProfileV299";
import {
  encodeKerrSciencePixelV299,
  type KerrScienceTransferPayloadV299,
  type StrongGravityRenderModeV299,
} from "./strongGravityRenderingV299";

export const KERR_STRONG_GRAVITY_VISUAL_VERSION_V305 = "v305-kerr-strong-gravity-visual-boundary" as const;
export const KERR_SCIENCE_TEXTURE_SIZE_V305 = 256 as const;

export type KerrInteractiveVisualResponseV305 = Pick<KerrInteractiveComputeResponseV299, "rayCount" | "values">;

export type KerrScienceVisualContractV305 = Readonly<{
  version: typeof KERR_STRONG_GRAVITY_VISUAL_VERSION_V305;
  mode: "science";
  profileId: AtlasVisualRendererProfileV299["id"];
  displayTransform: "linear-no-grade";
  exposure: 1;
  bloom: 0;
  noise: 0;
  toneMapped: false;
  textureFilter: "nearest";
  source: "immutable-cpu-authority-payload";
  scienceBufferMutationAllowed: false;
}>;

export type KerrCinematicVisualContractV305 = Readonly<{
  version: typeof KERR_STRONG_GRAVITY_VISUAL_VERSION_V305;
  mode: "cinematic";
  profileId: AtlasVisualRendererProfileV299["id"];
  tokenSource: "v9" | "v8" | "v7" | "v6" | "v5" | "compatibility-fallback";
  exposure: number;
  bloom: number;
  bloomScale: number;
  detailSeed: number;
  redshiftColorStrength: number;
  dopplerColorStrength: number;
  spectralRibbonOpacity: number;
  reticleLuminance: number;
  channelSeparation: number;
  toneMapped: false;
  textureFilter: "linear";
  source: "interactive-shadow-copy";
  scienceBufferMutationAllowed: false;
}>;

export type KerrStrongGravityVisualContractV305 = KerrScienceVisualContractV305 | KerrCinematicVisualContractV305;

function finiteRange(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`v305-${label}-out-of-range`);
  return value;
}

export function resolveKerrStrongGravityVisualContractV305(
  profile: AtlasVisualRendererProfileV299,
  mode: "science",
): KerrScienceVisualContractV305;
export function resolveKerrStrongGravityVisualContractV305(
  profile: AtlasVisualRendererProfileV299,
  mode: "cinematic",
): KerrCinematicVisualContractV305;
export function resolveKerrStrongGravityVisualContractV305(
  profile: AtlasVisualRendererProfileV299,
  mode: StrongGravityRenderModeV299,
): KerrStrongGravityVisualContractV305;
export function resolveKerrStrongGravityVisualContractV305(
  profile: AtlasVisualRendererProfileV299,
  mode: StrongGravityRenderModeV299,
): KerrStrongGravityVisualContractV305 {
  const cinematic = profile.runtimeTokens.strongGravityV9 ?? profile.runtimeTokens.strongGravityV8 ?? profile.runtimeTokens.strongGravityV7 ?? profile.runtimeTokens.strongGravityV6 ?? profile.runtimeTokens.strongGravityV5;
  if (mode === "science") {
    const scienceExposure = cinematic?.scienceExposure ?? 1;
    const scienceBloom = cinematic?.scienceBloom ?? 0;
    const scienceNoise = cinematic?.scienceNoise ?? 0;
    if (profile.runtimeTokens.strongGravity.scienceDisplayTransform !== "linear-no-grade"
      || scienceExposure !== 1 || scienceBloom !== 0 || scienceNoise !== 0) {
      throw new Error("v305-science-display-boundary-violated");
    }
    return Object.freeze({
      version: KERR_STRONG_GRAVITY_VISUAL_VERSION_V305,
      mode: "science",
      profileId: profile.id,
      displayTransform: "linear-no-grade",
      exposure: 1,
      bloom: 0,
      noise: 0,
      toneMapped: false,
      textureFilter: "nearest",
      source: "immutable-cpu-authority-payload",
      scienceBufferMutationAllowed: false,
    });
  }
  const tokenSource = profile.runtimeTokens.strongGravityV9 ? "v9"
    : profile.runtimeTokens.strongGravityV8 ? "v8"
    : profile.runtimeTokens.strongGravityV7 ? "v7"
    : profile.runtimeTokens.strongGravityV6 ? "v6"
      : profile.runtimeTokens.strongGravityV5 ? "v5"
      : "compatibility-fallback";
  const exposure = finiteRange(cinematic?.cinematicExposure ?? profile.exposureMultiplier.kerr, 0, 2, "cinematic-exposure");
  const bloom = finiteRange(cinematic?.cinematicBloom ?? 0, 0, 2, "cinematic-bloom");
  const detailSeed = finiteRange(cinematic?.diskDetailSeed ?? 0, 0, 2 ** 31 - 1, "detail-seed");
  const redshiftColorStrength = finiteRange(cinematic?.redshiftColorStrength ?? 0, 0, 2, "redshift-strength");
  const dopplerColorStrength = finiteRange(cinematic?.dopplerColorStrength ?? 0, 0, 2, "doppler-strength");
  const observatory = profile.runtimeTokens.strongGravityV9 ?? profile.runtimeTokens.strongGravityV8;
  const spectralRibbonOpacity = finiteRange(observatory?.spectralRibbonOpacity ?? 0, 0, 1, "spectral-ribbon-opacity");
  const reticleLuminance = finiteRange(observatory?.reticleLuminance ?? 0, 0, 1, "reticle-luminance");
  const channelSeparation = finiteRange(observatory?.channelSeparation ?? 0, 0, 1, "channel-separation");
  return Object.freeze({
    version: KERR_STRONG_GRAVITY_VISUAL_VERSION_V305,
    mode: "cinematic",
    profileId: profile.id,
    tokenSource,
    exposure,
    bloom,
    bloomScale: 1.035 + bloom * 0.075,
    detailSeed,
    redshiftColorStrength,
    dopplerColorStrength,
    spectralRibbonOpacity,
    reticleLuminance,
    channelSeparation,
    toneMapped: false,
    textureFilter: "linear",
    source: "interactive-shadow-copy",
    scienceBufferMutationAllowed: false,
  });
}

function setSciencePixel(
  data: Uint8Array,
  size: number,
  x: number,
  y: number,
  color: readonly [number, number, number, number],
): void {
  for (let oy = -2; oy <= 2; oy += 1) {
    for (let ox = -2; ox <= 2; ox += 1) {
      const px = Math.max(0, Math.min(size - 1, x + ox));
      const py = Math.max(0, Math.min(size - 1, y + oy));
      const offset = (py * size + px) * 4;
      data.set(color, offset);
    }
  }
}

export function createKerrScienceRgbaV305(payload: KerrScienceTransferPayloadV299): Uint8Array<ArrayBuffer> {
  const size = KERR_SCIENCE_TEXTURE_SIZE_V305;
  const data = new Uint8Array(new ArrayBuffer(size * size * 4));
  for (let index = 0; index < payload.sampleCount; index += 1) {
    const x = Math.round((payload.alphaM[index] / 44 + 0.5) * (size - 1));
    const y = Math.round((0.5 - payload.betaM[index] / 32) * (size - 1));
    setSciencePixel(data, size, x, y, encodeKerrSciencePixelV299(
      payload.classification[index],
      payload.redshiftFactor[index],
      payload.redshiftApplicable[index] === 1,
    ));
  }
  return data;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function createKerrCinematicRgbaV305(
  response: KerrInteractiveVisualResponseV305,
  contract: KerrCinematicVisualContractV305,
): Uint8Array<ArrayBuffer> {
  const data = new Uint8Array(new ArrayBuffer(response.rayCount * 4));
  for (let index = 0; index < response.rayCount; index += 1) {
    const source = index * 4;
    const status = response.values[source];
    const redshift = response.values[source + 1];
    const detail = sampleAtlasCinematicDetailV299(contract.detailSeed, index, 0);
    const fineStructure = 0.9 + detail * 0.2;
    const intensity = clamp01(response.values[source + 3] * 120 * fineStructure);
    if (status === 1) {
      data[source] = 1;
      data[source + 1] = 2;
      data[source + 2] = 6;
      data[source + 3] = 255;
    } else if (status === 3) {
      const blue = clamp01((redshift - 1) * contract.dopplerColorStrength + 0.5);
      const red = clamp01((1 / Math.max(redshift, 0.15) - 0.5) * contract.redshiftColorStrength);
      const highlight = Math.max(0, detail - 0.72) * contract.bloom;
      const spectralDetail = sampleAtlasCinematicDetailV299(contract.detailSeed, index, 1);
      const ribbon = contract.spectralRibbonOpacity * Math.max(0, spectralDetail - 0.5) * 0.12;
      const reticle = contract.reticleLuminance * (index % 4 === 0 ? 0.025 : 0);
      const channel = contract.channelSeparation * (blue - red) * 0.08;
      data[source] = Math.round(255 * clamp01(0.43 + red * 0.54 + intensity * 0.34 + highlight * 0.12 + ribbon * 0.55 + reticle));
      data[source + 1] = Math.round(255 * clamp01(0.17 + intensity * 0.6 + highlight * 0.08 + ribbon * 0.22));
      data[source + 2] = Math.round(255 * clamp01(0.11 + blue * 0.7 + intensity * 0.22 + ribbon * 0.65 + reticle + channel));
      data[source + 3] = Math.round(255 * clamp01(0.34 + intensity));
    } else {
      data[source] = 3;
      data[source + 1] = 8;
      data[source + 2] = 18;
      data[source + 3] = 70;
    }
  }
  return data;
}
