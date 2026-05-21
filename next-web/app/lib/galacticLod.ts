import type { GalacticLodTier } from "./floatingOrigin";

// ── LOD tier configuration ───────────────────────────────────────────

export type LodTierConfig = {
  /** How to render planet/asteroid bodies. */
  bodyRenderMode: "full_mesh" | "glow_point" | "hidden";
  /** How to render the sun. */
  sunRenderMode: "full_disk" | "bright_point" | "star_point";
  /** Whether to show orbit trails. */
  showOrbitTrails: boolean;
  /** Whether to show body labels. */
  showBodyLabels: boolean;
  /** Whether to show constellation stick-figure lines. */
  showConstellationLines: boolean;
  /** Whether to show nebula markers. */
  showNebulaMarkers: boolean;
  /** Whether to show star cluster markers. */
  showStarClusterMarkers: boolean;
  /** Whether to show pulsar field. */
  showPulsarField: boolean;
  /** Base point size for glow_point / star_point mode (screen pixels). */
  pointSizeBase: number;
  /** Whether the detailed mesh/sprite LOD (Planet.tsx sprite system) should be skipped. */
  skipDetailedRendering: boolean;
  /** Whether to show the orbit ellipses. */
  showOsculatingOrbits: boolean;
  /** OrbitControls maxDistance for this tier. */
  maxDistance: number;
};

const SOLAR_CONFIG: LodTierConfig = {
  bodyRenderMode: "full_mesh",
  sunRenderMode: "full_disk",
  showOrbitTrails: true,
  showBodyLabels: true,
  showConstellationLines: true,
  showNebulaMarkers: true,
  showStarClusterMarkers: true,
  showPulsarField: true,
  pointSizeBase: 0,
  skipDetailedRendering: false,
  showOsculatingOrbits: true,
  maxDistance: 50000,
};

const MID_CONFIG: LodTierConfig = {
  bodyRenderMode: "glow_point",
  sunRenderMode: "bright_point",
  showOrbitTrails: false,
  showBodyLabels: true,
  showConstellationLines: true,
  showNebulaMarkers: true,
  showStarClusterMarkers: true,
  showPulsarField: true,
  pointSizeBase: 4,
  skipDetailedRendering: true,
  showOsculatingOrbits: false,
  maxDistance: 5000000,
};

const FAR_CONFIG: LodTierConfig = {
  bodyRenderMode: "hidden",
  sunRenderMode: "star_point",
  showOrbitTrails: false,
  showBodyLabels: false,
  showConstellationLines: true,
  showNebulaMarkers: true,
  showStarClusterMarkers: true,
  showPulsarField: true,
  pointSizeBase: 3,
  skipDetailedRendering: true,
  showOsculatingOrbits: false,
  maxDistance: 50000000,
};

/**
 * Return the LOD configuration for the given tier.
 * In solar tier this is a no-op: full_mesh, full_disk, all features on.
 */
export function lodConfigForTier(tier: GalacticLodTier): LodTierConfig {
  switch (tier) {
    case "solar":
      return SOLAR_CONFIG;
    case "mid":
      return MID_CONFIG;
    case "far":
      return FAR_CONFIG;
  }
}
