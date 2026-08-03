"use client";

import { useMemo } from "react";
import { createAtlasLaunchSceneOpenRocketReplaySummary } from "./atlasLaunchSceneOpenRocketReplay";
import { createAtlasOfflineStellarSearchCatalogV2Summary } from "./atlasOfflineStellarSearchCatalogV2";
import { createAtlasRuntimeSceneFocusSummary, type AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import { createAtlasScientificCinematicArtSummary } from "./atlasScientificCinematicArt";
import { createAtlasScientificPromotionV2Summary } from "./atlasScientificPromotionV2";
import { createAtlasVisualIntegrationReleaseSummary } from "./atlasVisualIntegrationRelease";
import { createAtlasVisualIntegrationV2Summary } from "./atlasVisualIntegrationV2";
import { createAtlasVisualLaunchPerformanceSummary } from "./atlasVisualLaunchPerformanceLock";
import type { AtlasRuntimeQualityTier } from "./simulationDiagnosticsTypes";

export function useAtlasWorkbenchStaticSummaries() {
  const atlasOfflineStellarSearchCatalogV2Summary = useMemo(
    () => createAtlasOfflineStellarSearchCatalogV2Summary(), [],
  );
  const atlasScientificCinematicArtSummary = useMemo(
    () => createAtlasScientificCinematicArtSummary(), [],
  );
  const atlasLaunchSceneOpenRocketReplaySummary = useMemo(
    () => createAtlasLaunchSceneOpenRocketReplaySummary(), [],
  );
  const atlasVisualIntegrationReleaseSummary = useMemo(
    () => createAtlasVisualIntegrationReleaseSummary(), [],
  );
  return {
    atlasOfflineStellarSearchCatalogV2Summary, atlasScientificCinematicArtSummary,
    atlasLaunchSceneOpenRocketReplaySummary, atlasVisualIntegrationReleaseSummary,
  };
}

export function selectAtlasWorkbenchOpenState({
  leftPanelCollapsed,
  atlasToolsOpen,
  managedPanels,
}: {
  leftPanelCollapsed: boolean;
  atlasToolsOpen: boolean;
  managedPanels: readonly boolean[];
}) {
  const managedPanelOpen = managedPanels.some(Boolean);
  return {
    managedPanelOpen,
    atlasWorkbenchOpen: managedPanelOpen || atlasToolsOpen || !leftPanelCollapsed,
  };
}

export function useAtlasWorkbenchSceneSummaries(
  qualityTier: AtlasRuntimeQualityTier,
  sceneMode: AtlasSceneMode,
) {
  const atlasVisualLaunchPerformanceSummary = useMemo(
    () => createAtlasVisualLaunchPerformanceSummary({ qualityTier }),
    [qualityTier],
  );
  const atlasRuntimeSceneFocusSummary = useMemo(
    () => createAtlasRuntimeSceneFocusSummary({ sceneMode }),
    [sceneMode],
  );
  const atlasVisualIntegrationV2Summary = useMemo(
    () => createAtlasVisualIntegrationV2Summary(), [],
  );
  const atlasScientificPromotionV2Summary = useMemo(
    () => createAtlasScientificPromotionV2Summary({
      catalogDocumentCount: 224_361,
      exoplanetSystemCount: 4_735,
      ktx2AssetCount: 35,
    }),
    [],
  );
  return {
    atlasVisualLaunchPerformanceSummary, atlasRuntimeSceneFocusSummary,
    atlasVisualIntegrationV2Summary, atlasScientificPromotionV2Summary,
  };
}
