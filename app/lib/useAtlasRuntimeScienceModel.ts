import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import type { KerrBlackHoleUiState } from "../components/KerrBlackHolePanel";
import type { SimulationDiagnostics } from "./simulationDiagnosticsTypes";
import { createAtlasGaiaStarfieldEnhancementSummary } from "./atlasGaiaStarfieldEnhancement";
import { STATIC_LEGACY_RELEASE_SUMMARIES_V177 } from "./atlasLegacyEvidenceCompatibilityV177";
import { ATLAS_RUNTIME_SCIENCE_FALLBACK_V198 } from "./atlasRuntimeScienceCompatibilityV198";
import {
  createKerrGeodesicTrackSet,
} from "./kerrGeodesicVisualization";
import { createKerrRelativityStudioSummary } from "./kerrRelativityStudio";

export type AtlasRuntimeScienceModelOptions = {
  kerrBlackHole: KerrBlackHoleUiState;
  diagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  mobile: boolean;
  renderBudget: "balanced" | "dense";
  detailedEvidenceRequested?: boolean;
};

type ScienceDetailsFactory = typeof import(
  "./atlasRuntimeScienceModelDetailsV198"
)["createAtlasRuntimeScienceModelDetailsV198"];

/**
 * Keeps the render-critical Kerr/Gaia state synchronous while the report-grade
 * relativity matrices stay out of navigation-to-Canvas JavaScript. The compact
 * pending values are exact root-contract values; declaring a science-panel
 * intent loads the canonical builders and resumes diagnostics-backed updates.
 */
export function useAtlasRuntimeScienceModel({
  kerrBlackHole,
  diagnosticsRef,
  mobile,
  renderBudget,
  detailedEvidenceRequested = false,
}: AtlasRuntimeScienceModelOptions) {
  const [detailsFactory, setDetailsFactory] = useState<ScienceDetailsFactory | null>(null);

  useEffect(() => {
    if (!detailedEvidenceRequested || detailsFactory) return;
    let active = true;
    void import("./atlasRuntimeScienceModelDetailsV198").then((module) => {
      if (active) setDetailsFactory(() => module.createAtlasRuntimeScienceModelDetailsV198);
    });
    return () => {
      active = false;
    };
  }, [detailedEvidenceRequested, detailsFactory]);

  const kerrTrackSet = useMemo(
    () =>
      createKerrGeodesicTrackSet({
        spinA: kerrBlackHole.aOverM,
        impactParameterM: kerrBlackHole.impactParameterM,
        presetId: kerrBlackHole.orbitPresetId,
      }),
    [kerrBlackHole.aOverM, kerrBlackHole.impactParameterM, kerrBlackHole.orbitPresetId],
  );
  const kerrStudioSummary = useMemo(
    () =>
      createKerrRelativityStudioSummary({
        spinA: kerrBlackHole.aOverM,
        impactParameterM: kerrBlackHole.impactParameterM,
        presetId: kerrBlackHole.orbitPresetId,
        renderMode: kerrBlackHole.renderMode,
        mode: kerrBlackHole.studioMode ?? "overview",
        trackSet: kerrTrackSet,
      }),
    [
      kerrBlackHole.aOverM,
      kerrBlackHole.impactParameterM,
      kerrBlackHole.orbitPresetId,
      kerrBlackHole.renderMode,
      kerrBlackHole.studioMode,
      kerrTrackSet,
    ],
  );
  const atlasGaiaStarfieldEnhancementSummary = useMemo(
    () => createAtlasGaiaStarfieldEnhancementSummary({
      qualityTier: mobile ? "mobile" : renderBudget,
    }),
    [mobile, renderBudget],
  );
  const diagnostics = diagnosticsRef.current;
  const details = useMemo(
    () => detailsFactory
      ? detailsFactory({ diagnostics, kerrStudioSummary })
      : ATLAS_RUNTIME_SCIENCE_FALLBACK_V198,
    [detailsFactory, diagnostics, kerrStudioSummary],
  );

  return useMemo(
    () => ({
      kerrTrackSet,
      kerrStudioSummary,
      ...details,
      atlasGaiaStarfieldEnhancementSummary,
      ...STATIC_LEGACY_RELEASE_SUMMARIES_V177,
    }),
    [atlasGaiaStarfieldEnhancementSummary, details, kerrStudioSummary, kerrTrackSet],
  );
}
