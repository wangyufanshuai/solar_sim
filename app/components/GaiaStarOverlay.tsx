"use client";

import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { AtlasGaiaStarfieldEnhancementQualityTier } from "../lib/simulationDiagnosticsTypes";
import { ATLAS_GAIA_STARFIELD_RENDER_BUDGET } from "../lib/atlasGaiaStarfieldEnhancement";
import { ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177 } from "../lib/atlasArtPolishRuntimeCompatibilityV177";
import GaiaStarField from "./GaiaStarField";

export default function GaiaStarOverlay({
  floatingOriginRef,
  enabled,
  qualityTier,
  closeupSuppressed,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled: boolean;
  qualityTier: AtlasGaiaStarfieldEnhancementQualityTier;
  closeupSuppressed: boolean;
}) {
  const maxInstances = ATLAS_GAIA_STARFIELD_RENDER_BUDGET[qualityTier];
  const opacityScale = closeupSuppressed
    ? ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177.closeup
    : ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177[qualityTier];

  return (
    <GaiaStarField
      floatingOriginRef={floatingOriginRef}
      renderEnabled={enabled}
      maxInstances={maxInstances}
      opacityScale={opacityScale}
      allowSolarTier={qualityTier === "dense" && !closeupSuppressed}
    />
  );
}
