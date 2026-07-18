import type { StellarMaterialProfile } from "./stellarMaterialProfile";
import {
  createStellarPortraitProfileV5,
  type StellarPortraitProfileV5,
} from "./stellarPortraitProfileV5";

export const STELLAR_PORTRAIT_PROFILE_V6_VERSION =
  "v157-stellar-portrait-material-v6" as const;

export type StellarPortraitProfileV6 = Omit<
  StellarPortraitProfileV5,
  "version" | "drawCallBudget" | "derivation"
> & {
  version: typeof STELLAR_PORTRAIT_PROFILE_V6_VERSION;
  drawCallBudget: 3;
  colorSeparation: number;
  haloStrength: number;
  derivation: "parameter-derived-display-not-resolved-surface";
};

export type CreateStellarPortraitProfileV6Args = {
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
};

export function createStellarPortraitProfileV6(
  args: CreateStellarPortraitProfileV6Args,
): StellarPortraitProfileV6 {
  const base = createStellarPortraitProfileV5(args);
  const hot = base.temperatureK >= 7_500;
  const cool = base.temperatureK <= 4_200;
  const colorSeparation = hot ? 1.22 : cool ? 1.18 : 1.1;
  const luminance = base.sceneLinearColor[0] * 0.2126
    + base.sceneLinearColor[1] * 0.7152
    + base.sceneLinearColor[2] * 0.0722;
  const sceneLinearColor = base.sceneLinearColor.map((channel) =>
    Math.max(0.035, Math.min(0.96, luminance + (channel - luminance) * colorSeparation)),
  ) as [number, number, number];
  const granulationScale = hot
    ? Math.max(7.2, base.granulationScale * 1.55)
    : cool
      ? Math.max(4.4, base.granulationScale * 0.92)
      : Math.max(5.2, base.granulationScale);
  const granulationContrast = hot
    ? Math.max(0.17, base.granulationContrast * 1.8)
    : Math.max(0.12, base.granulationContrast * 1.24);

  return {
    ...base,
    version: STELLAR_PORTRAIT_PROFILE_V6_VERSION,
    sceneLinearColor,
    colorSeparation,
    surfaceRadiance: Math.min(0.82, base.surfaceRadiance * (hot ? 0.8 : 0.92)),
    toneMapShoulder: Math.max(hot ? 0.9 : 0.78, base.toneMapShoulder),
    granulationScale,
    granulationContrast: Math.min(0.72, granulationContrast),
    limbDarkening: Math.max(hot ? 0.5 : 0.42, base.limbDarkening),
    coronaStrength: Math.min(hot ? 0.42 : 0.64, base.coronaStrength * 0.6),
    coronaSoftness: Math.max(0.84, base.coronaSoftness),
    haloStrength: 0.62 + Math.min(0.24, base.activity * 0.18),
    drawCallBudget: 3,
    derivation: "parameter-derived-display-not-resolved-surface",
  };
}
