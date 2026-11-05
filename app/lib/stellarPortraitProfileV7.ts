import type { StellarMaterialProfile } from "./stellarMaterialProfile";
import {
  createStellarPortraitProfileV6,
  type CreateStellarPortraitProfileV6Args,
  type StellarPortraitProfileV6,
} from "./stellarPortraitProfileV6";

export const STELLAR_PORTRAIT_PROFILE_V7_VERSION =
  "v162-stellar-portrait-material-v7" as const;

export type StellarPortraitProfileV7 = Omit<StellarPortraitProfileV6, "version"> & {
  version: typeof STELLAR_PORTRAIT_PROFILE_V7_VERSION;
  surfaceDetailOctaves: 3;
  granuleBoundaryStrength: number;
  differentialRotationShear: number;
  activeLatitudeWidth: number;
  coronaFalloff: number;
  photosphereWhiteBalance: readonly [number, number, number];
};

export type CreateStellarPortraitProfileV7Args = CreateStellarPortraitProfileV6Args & {
  material: StellarMaterialProfile;
};

export function createStellarPortraitProfileV7(
  args: CreateStellarPortraitProfileV7Args,
): StellarPortraitProfileV7 {
  const base = createStellarPortraitProfileV6(args);
  const hot = base.temperatureK >= 7_500;
  const cool = base.temperatureK <= 4_200;
  const giant = (args.logg ?? 4.4) < 3.2 || (args.radiusSolar ?? 1) > 5;
  const uncertainty = Math.max(0, (args.teffUpperK ?? base.temperatureK) - (args.teffLowerK ?? base.temperatureK));
  const confidence = Math.max(0.72, 1 - uncertainty / Math.max(1, base.temperatureK) * 0.8);
  return {
    ...base,
    version: STELLAR_PORTRAIT_PROFILE_V7_VERSION,
    surfaceDetailOctaves: 3,
    granuleBoundaryStrength: giant ? 0.22 : hot ? 0.17 : cool ? 0.28 : 0.24,
    differentialRotationShear: Math.min(0.42, 0.12 + base.activity * 0.18 + (giant ? 0.08 : 0)),
    activeLatitudeWidth: Math.max(0.16, Math.min(0.42, 0.32 - base.activity * 0.08)),
    coronaFalloff: hot ? 3.45 : cool ? 2.55 : 2.9,
    photosphereWhiteBalance: [
      Math.min(1, base.sceneLinearColor[0] * confidence),
      Math.min(1, base.sceneLinearColor[1] * confidence),
      Math.min(1, base.sceneLinearColor[2] * confidence),
    ],
  };
}
