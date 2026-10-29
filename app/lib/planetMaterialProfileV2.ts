export const PLANET_MATERIAL_PROFILE_V2_VERSION = "v143-planet-material-render-graph-v2" as const;

export type PlanetMaterialClassV2 = "earth" | "airless" | "gas-giant" | "ringed-gas-giant" | "generic";
export type PlanetMaterialProfileV2 = {
  version: typeof PLANET_MATERIAL_PROFILE_V2_VERSION;
  bodyId: string;
  materialClass: PlanetMaterialClassV2;
  layers: readonly string[];
  maxDrawCalls: number;
  hdTexturePolicy: "ktx2-on-demand-with-jpg-png-fallback";
  boundary: "presentation-only-never-mutates-physics";
};

export function createPlanetMaterialProfileV2(bodyId: string): PlanetMaterialProfileV2 {
  const normalized = bodyId.toLowerCase();
  const materialClass: PlanetMaterialClassV2 = normalized === "earth"
    ? "earth"
    : normalized === "jupiter"
      ? "gas-giant"
      : normalized === "saturn"
        ? "ringed-gas-giant"
        : ["moon", "mercury", "mars"].includes(normalized)
          ? "airless"
          : "generic";
  const layers = materialClass === "earth"
    ? ["pbr-surface", "clouds", "night-lights", "atmosphere"]
    : materialClass === "airless"
      ? ["pbr-surface", "relief-normal", "limb-depth"]
      : materialClass === "gas-giant"
        ? ["banded-surface", "key-fill", "band-detail", "soft-atmosphere"]
        : materialClass === "ringed-gas-giant"
          ? ["banded-surface", "key-fill", "band-detail", "soft-atmosphere", "rings", "ring-shadow"]
          : ["pbr-surface", "limb-depth"];
  return {
    version: PLANET_MATERIAL_PROFILE_V2_VERSION,
    bodyId: normalized,
    materialClass,
    layers,
    maxDrawCalls: Math.min(8, layers.length),
    hdTexturePolicy: "ktx2-on-demand-with-jpg-png-fallback",
    boundary: "presentation-only-never-mutates-physics",
  };
}
