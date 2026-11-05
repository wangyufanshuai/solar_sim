import type { AtlasScaleBand } from "./atlasRuntimeStateV256";
import type { GalacticLodTier } from "./floatingOrigin";

export const ATLAS_SCALE_BANDS_V260: Readonly<Record<AtlasScaleBand, {
  label: string;
  unit: "AU" | "pc" | "kpc" | "Mpc";
  referenceSpan: number;
  dataLayer: string;
  trust: "measured" | "catalog-angular" | "measured-plus-model";
  publicDeploymentBlocked: boolean;
}>> = {
  solar: { label: "太阳系", unit: "AU", referenceSpan: 100, dataLayer: "Horizons / live physics", trust: "measured", publicDeploymentBlocked: false },
  stellar: { label: "本地恒星", unit: "pc", referenceSpan: 2_000, dataLayer: "Gaia DR3 HEALPix", trust: "measured", publicDeploymentBlocked: false },
  galactic: { label: "银河系", unit: "kpc", referenceSpan: 60, dataLayer: "Gaia + explicit Milky Way structure model", trust: "measured-plus-model", publicDeploymentBlocked: false },
  "local-group": { label: "本星系群 / NGC", unit: "Mpc", referenceSpan: 20, dataLayer: "OpenNGC CC-BY-SA-4.0", trust: "catalog-angular", publicDeploymentBlocked: false },
  "near-universe": { label: "近邻宇宙", unit: "Mpc", referenceSpan: 500, dataLayer: "Cosmicflows-4 local candidate", trust: "measured", publicDeploymentBlocked: true },
};

export const ATLAS_SCALE_BAND_ORDER_V260 = [
  "solar", "stellar", "galactic", "local-group", "near-universe",
] as const satisfies readonly AtlasScaleBand[];

export type AtlasScaleHandoffV260 = {
  version: "v260-scale-handoff-v1";
  from: AtlasScaleBand;
  to: AtlasScaleBand;
  selectedObjectId: string;
  returnPath: readonly AtlasScaleBand[];
  transition: "continuous-logarithmic";
  localOriginPolicy: "independent-per-band";
};

export function createAtlasScaleHandoffV260(
  from: AtlasScaleBand,
  to: AtlasScaleBand,
  selectedObjectId: string,
  returnPath: readonly AtlasScaleBand[],
): AtlasScaleHandoffV260 {
  return {
    version: "v260-scale-handoff-v1",
    from,
    to,
    selectedObjectId,
    returnPath: [...returnPath, from].slice(-8),
    transition: "continuous-logarithmic",
    localOriginPolicy: "independent-per-band",
  };
}

export function atlasScaleLogProgressV260(band: AtlasScaleBand): number {
  const index = ATLAS_SCALE_BAND_ORDER_V260.indexOf(band);
  return index / (ATLAS_SCALE_BAND_ORDER_V260.length - 1);
}

export function atlasScaleBandFromLegacyLodV260(tier: GalacticLodTier): AtlasScaleBand {
  if (tier === "far") return "galactic";
  if (tier === "mid") return "stellar";
  return "solar";
}
