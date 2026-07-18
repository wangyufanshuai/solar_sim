import type { StellarMaterialProfile } from "./stellarMaterialProfile";
import { createStellarPortraitProfileV3, type StellarPortraitProfileV3 } from "./stellarPortraitProfileV3";
import type { StellarDataTier } from "./atlasReleaseProgram";

export type StellarAtmosphereClass =
  | "o-b-radiative"
  | "a-f-shallow-convection"
  | "g-solar-convection"
  | "k-m-deep-convection"
  | "white-dwarf"
  | "giant"
  | "supergiant";

export type StellarPortraitProfileV4 = Omit<StellarPortraitProfileV3, "version" | "derivation"> & {
  version: "v134-stellar-portrait-material-v4";
  dataTier: StellarDataTier;
  surfaceRegime: StellarAtmosphereClass;
  convectiveWarp: number;
  spotClusterCount: number;
  coronaLayerCount: number;
  prominenceBudget: number;
  derivation: "parameter-derived-scientific-cinematic-portrait-not-resolved-surface";
};

function atmosphereClass(spectralType: string | null | undefined, radiusSolar: number | null | undefined, logg: number | null | undefined): StellarAtmosphereClass {
  const spectral = (spectralType ?? "G").trim().toUpperCase();
  if (spectral.startsWith("D")) return "white-dwarf";
  if ((radiusSolar ?? 0) >= 80 || (logg != null && logg < 1)) return "supergiant";
  if ((radiusSolar ?? 0) >= 8 || (logg != null && logg < 2.5)) return "giant";
  if (/^[OB]/.test(spectral)) return "o-b-radiative";
  if (/^[AF]/.test(spectral)) return "a-f-shallow-convection";
  if (/^[KM]/.test(spectral)) return "k-m-deep-convection";
  return "g-solar-convection";
}

export function createStellarPortraitProfileV4(args: {
  material: StellarMaterialProfile;
  teffK?: number | null;
  logg?: number | null;
  radiusSolar?: number | null;
  variable?: boolean;
  spectralType?: string | null;
  colorIndexAvailable?: boolean;
}): StellarPortraitProfileV4 {
  const base = createStellarPortraitProfileV3(args);
  const dataTier: StellarDataTier = base.parameterCompleteness === "full"
    ? "parameter-rich"
    : base.parameterCompleteness === "photometric"
      ? "photometric-derived"
      : "catalog-basic";
  const classification = atmosphereClass(args.spectralType, args.radiusSolar, args.logg);
  const convectiveWarp = classification === "o-b-radiative" ? 0.08 : classification === "a-f-shallow-convection" ? 0.18 : classification === "k-m-deep-convection" ? 0.58 : 0.38;
  return {
    ...base,
    version: "v134-stellar-portrait-material-v4",
    dataTier,
    surfaceRegime: classification,
    convectiveWarp,
    spotClusterCount: Math.max(1, Math.min(7, Math.round(1 + base.activity * 6))),
    coronaLayerCount: base.activity > 0.66 ? 3 : base.activity > 0.32 ? 2 : 1,
    prominenceBudget: Math.min(4, base.prominenceCount),
    derivation: "parameter-derived-scientific-cinematic-portrait-not-resolved-surface",
  };
}
