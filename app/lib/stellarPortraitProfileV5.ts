import type { StellarMaterialProfile } from "./stellarMaterialProfile";
import { createStellarPortraitProfileV4, type StellarPortraitProfileV4 } from "./stellarPortraitProfileV4";

export const STELLAR_PORTRAIT_PROFILE_V5_VERSION = "v143-stellar-portrait-material-v5" as const;

export type StellarAstrophysicalParametersV1 = {
  sourceId: string;
  teffK: number | null;
  teffLowerK: number | null;
  teffUpperK: number | null;
  logg: number | null;
  radiusSolar: number | null;
  luminositySolar: number | null;
  extinctionAg: number | null;
  qualityFlags: readonly string[];
  provenance: "Gaia DR3 astrophysical_parameters" | "photometric-fallback" | "catalog-basic";
};

export type StellarPortraitProfileV5 = Omit<StellarPortraitProfileV4, "version" | "derivation"> & {
  version: typeof STELLAR_PORTRAIT_PROFILE_V5_VERSION;
  sceneLinearColor: readonly [number, number, number];
  surfaceRadiance: number;
  toneMapShoulder: number;
  coronaSoftness: number;
  metallicityDex: number | null;
  metallicityBlend: number;
  parameterConfidence: number;
  drawCallBudget: 6;
  derivation: "parameter-derived-scientific-cinematic-portrait-not-resolved-surface";
};

function blackbodyDisplayRgb(temperatureK: number): [number, number, number] {
  // Display anchors preserve blackbody ordering while retaining enough
  // separation to remain legible after bloom and tone mapping.
  const anchors: readonly [number, readonly [number, number, number]][] = [
    [1_800, [0.92, 0.16, 0.035]],
    [3_000, [0.92, 0.3, 0.09]],
    [4_200, [0.92, 0.49, 0.22]],
    [5_772, [0.92, 0.72, 0.48]],
    [7_500, [0.68, 0.76, 0.92]],
    [10_000, [0.43, 0.62, 0.92]],
    [20_000, [0.29, 0.48, 0.92]],
    [40_000, [0.24, 0.41, 0.92]],
  ];
  const temperature = Math.max(anchors[0][0], Math.min(anchors.at(-1)![0], temperatureK));
  for (let index = 1; index < anchors.length; index += 1) {
    const upper = anchors[index];
    if (temperature > upper[0]) continue;
    const lower = anchors[index - 1];
    const mix = (temperature - lower[0]) / (upper[0] - lower[0]);
    return lower[1].map((channel, channelIndex) => channel + (upper[1][channelIndex] - channel) * mix) as [number, number, number];
  }
  return [...anchors.at(-1)![1]];
}

export function createStellarPortraitProfileV5(args: {
  material: StellarMaterialProfile;
  teffK?: number | null;
  teffLowerK?: number | null;
  teffUpperK?: number | null;
  logg?: number | null;
  radiusSolar?: number | null;
  metallicityDex?: number | null;
  dataTier?: "parameter-rich" | "photometric-derived" | "catalog-basic" | null;
  variable?: boolean;
  spectralType?: string | null;
  colorIndexAvailable?: boolean;
}): StellarPortraitProfileV5 {
  const base = createStellarPortraitProfileV4(args);
  const metallicityDex = Number.isFinite(args.metallicityDex) ? Math.max(-2.5, Math.min(0.8, args.metallicityDex!)) : null;
  const metallicityBlend = metallicityDex == null ? 0 : metallicityDex / 2.5;
  const sceneLinearColor = blackbodyDisplayRgb(base.temperatureK).map((channel, index) => {
    const tint = index === 0 ? metallicityBlend * 0.045 : index === 2 ? -metallicityBlend * 0.028 : metallicityBlend * 0.008;
    return Math.max(0.08, Math.min(0.96, channel + tint));
  }) as [number, number, number];
  const intervalWidth = args.teffLowerK != null && args.teffUpperK != null
    ? Math.max(0, args.teffUpperK - args.teffLowerK)
    : null;
  const intervalConfidence = intervalWidth == null || args.teffK == null
    ? 0.72
    : Math.max(0.35, Math.min(1, 1 - intervalWidth / Math.max(500, args.teffK * 0.55)));
  const tierConfidence = args.dataTier === "parameter-rich" || base.dataTier === "parameter-rich"
    ? 1
    : args.dataTier === "catalog-basic" || base.dataTier === "catalog-basic"
      ? 0.48
      : 0.72;
  const giantScale = base.surfaceRegime === "supergiant" ? 0.76 : base.surfaceRegime === "giant" ? 0.84 : 1;
  const shallowConvection = base.surfaceRegime === "a-f-shallow-convection" || base.surfaceRegime === "o-b-radiative";
  return {
    ...base,
    version: STELLAR_PORTRAIT_PROFILE_V5_VERSION,
    sceneLinearColor,
    surfaceRadiance: shallowConvection ? 0.82 : Math.min(0.94, (0.68 + Math.log10(Math.max(2_000, base.temperatureK) / 2_000) * 0.16) * giantScale),
    toneMapShoulder: base.temperatureK > 9_000 ? 0.82 : 0.72,
    coronaSoftness: 0.72 + base.activity * 0.18,
    metallicityDex,
    metallicityBlend,
    parameterConfidence: Math.min(tierConfidence, intervalConfidence),
    granulationScale: shallowConvection ? Math.max(2.8, base.granulationScale * 0.48) : base.granulationScale,
    granulationContrast: (shallowConvection ? base.granulationContrast * 0.38 : base.granulationContrast) * (1 + Math.abs(metallicityBlend) * 0.08),
    spotCoverage: shallowConvection ? base.spotCoverage * 0.28 : base.spotCoverage,
    prominenceBudget: shallowConvection ? 0 : Math.min(3, base.prominenceBudget),
    drawCallBudget: 6,
    derivation: "parameter-derived-scientific-cinematic-portrait-not-resolved-surface",
  };
}
