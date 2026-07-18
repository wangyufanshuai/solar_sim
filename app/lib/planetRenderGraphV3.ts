export const PLANET_RENDER_GRAPH_V3_VERSION =
  "v162-planet-render-graph-v3" as const;

export type PlanetRenderGraphV3 = {
  version: typeof PLANET_RENDER_GRAPH_V3_VERSION;
  bodyId: string;
  materialClass: "earth" | "airless" | "gas-giant" | "ringed-gas-giant" | "generic";
  layers: readonly string[];
  maxDrawCalls: number;
  texturePolicy: "ktx2-scene-lru-jpeg-fallback";
  gpuResidencyLimitBytes: number;
  boundary: "presentation-only-never-mutates-physics";
};

export function createPlanetRenderGraphV3(bodyId: string): PlanetRenderGraphV3 {
  const id = bodyId.toLowerCase();
  const materialClass = id === "earth"
    ? "earth"
    : id === "jupiter"
      ? "gas-giant"
      : id === "saturn"
        ? "ringed-gas-giant"
        : ["moon", "mercury", "mars"].includes(id)
          ? "airless"
          : "generic";
  const layers = materialClass === "earth"
    ? ["pbr-surface", "combined-depth-grade", "clouds", "night-lights", "atmosphere"]
    : materialClass === "airless"
      ? ["pbr-surface", "combined-depth-grade", "limb"]
      : materialClass === "gas-giant"
        ? ["banded-surface", "band-detail", "soft-atmosphere", "combined-key-grade"]
        : materialClass === "ringed-gas-giant"
          ? ["banded-surface", "band-detail", "soft-atmosphere", "rings", "ring-shadow", "combined-key-grade"]
          : ["pbr-surface", "limb"];
  return {
    version: PLANET_RENDER_GRAPH_V3_VERSION,
    bodyId: id,
    materialClass,
    layers,
    maxDrawCalls: Math.min(6, layers.length),
    texturePolicy: "ktx2-scene-lru-jpeg-fallback",
    gpuResidencyLimitBytes: 2.2 * 1024 ** 3,
    boundary: "presentation-only-never-mutates-physics",
  };
}
