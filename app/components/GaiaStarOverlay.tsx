"use client";

import { lazy, Suspense, type MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { AtlasGaiaStarfieldEnhancementQualityTier } from "../lib/simulationDiagnosticsTypes";
import { ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET } from "../lib/atlasGaiaStarfieldExpansionV255";
import { ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177 } from "../lib/atlasArtPolishRuntimeCompatibilityV177";
import { ATLAS_ART_POLISH_OPACITY_CAPS } from "../lib/atlasArtPolishRuntimeCompatibilityV177";
import GaiaStarField from "./GaiaStarField";

const CatalogFaintStarFieldV272 = lazy(() => import("./CatalogFaintStarFieldV272"));

export default function GaiaStarOverlay({
  floatingOriginRef,
  enabled,
  qualityTier,
  closeupSuppressed,
  catalogStreamEnabled,
  selectedSourceId = "",
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled: boolean;
  qualityTier: AtlasGaiaStarfieldEnhancementQualityTier;
  closeupSuppressed: boolean;
  catalogStreamEnabled: boolean;
  selectedSourceId?: string;
}) {
  const maxInstances = closeupSuppressed
    ? ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET.closeup
    : ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET[qualityTier];
  const opacityScale = closeupSuppressed
    ? Math.min(ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177.closeup, ATLAS_ART_POLISH_OPACITY_CAPS.closeup)
    : ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177[qualityTier];

  return (
    <>
      <GaiaStarField
        floatingOriginRef={floatingOriginRef}
        renderEnabled={enabled}
        maxInstances={maxInstances}
        opacityScale={opacityScale}
        allowSolarTier={qualityTier === "dense" && !closeupSuppressed}
        selectedSourceId={selectedSourceId}
      />
      {enabled && catalogStreamEnabled ? (
        <Suspense fallback={null}>
          <CatalogFaintStarFieldV272
            enabled={enabled && catalogStreamEnabled}
            qualityTier={qualityTier}
            closeupSuppressed={closeupSuppressed}
            selectedSourceId={selectedSourceId}
          />
        </Suspense>
      ) : null}
    </>
  );
}
