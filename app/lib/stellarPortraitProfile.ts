import type { StellarMaterialProfile } from "./stellarMaterialProfile";

export type StellarPortraitProfile = {
  seed: number;
  temperatureK: number;
  granulationScale: number;
  activity: number;
  spotCoverage: number;
  limbDarkening: number;
  coronaStrength: number;
  derivation: "gaia-derived-presentation-not-resolved-surface";
};

export function createStellarPortraitProfile(args: {
  material: StellarMaterialProfile;
  logg?: number | null;
  radiusSolar?: number | null;
  variable?: boolean;
}): StellarPortraitProfile {
  const logg = finite(args.logg, 4.35);
  const radius = finite(args.radiusSolar, 1);
  const gravityScale = clamp((5.1 - logg) / 3.2, 0, 1);
  const giantScale = clamp(Math.log2(Math.max(1, radius)) / 6, 0, 1);
  const variability = args.variable ? 1 : 0;
  return {
    seed: args.material.twinkleSeed,
    temperatureK: args.material.colorTemperatureK,
    granulationScale: round(7 + gravityScale * 8 - giantScale * 3),
    activity: round(clamp(0.22 + variability * 0.42 + gravityScale * 0.2, 0, 1)),
    spotCoverage: round(clamp(0.04 + variability * 0.12 + giantScale * 0.08, 0, 0.28)),
    limbDarkening: round(clamp(0.46 + (args.material.colorTemperatureK - 4500) / 18000, 0.38, 0.78)),
    coronaStrength: round(clamp(0.45 + args.material.haloScale * 0.18 + variability * 0.15, 0, 1)),
    derivation: "gaia-derived-presentation-not-resolved-surface",
  };
}

function finite(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
