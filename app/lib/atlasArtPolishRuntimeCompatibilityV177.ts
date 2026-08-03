import type { AtlasArtPolishOpacityCaps } from "./simulationDiagnosticsTypes";

/**
 * Runtime-only copy of the frozen v99 opacity contract. Keeping this tiny
 * value outside the historical evidence graph prevents the Gaia renderer from
 * pulling release runners into the cold WebGL path. Values remain locked by a
 * focused compatibility test against ATLAS_ART_POLISH_OPACITY_CAPS.
 */
export const ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177: AtlasArtPolishOpacityCaps = {
  mobile: 0.62,
  balanced: 1.05,
  dense: 1.2,
  closeup: 0.18,
} as const;

// Compatibility alias for the frozen closeup cap used by presentation-only
// surfaces. This module stays outside the historical evidence graph.
export const ATLAS_ART_POLISH_OPACITY_CAPS = ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177;
