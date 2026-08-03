"use client";

import { useMemo } from "react";
import type { AtlasRuntimeWorkbenchDomains } from "../components/atlasRuntimeWorkbenchDomains";
import { createAtlasRuntimeStateV256, type AtlasExperienceModeV256, type AtlasScaleBand } from "./atlasRuntimeStateV256";
import { ATLAS_VISUAL_PROFILE_LEGACY_V261 } from "./atlasVisualProfileV261";
import type { AtlasVisualProfileV299 } from "./atlasVisualProfileV299";

export function useAtlasRuntimeEvidenceSurfaceStateV256({
  domains,
  experienceMode,
  scaleBand,
  visualProfile,
  selectedObjectId,
}: {
  domains: AtlasRuntimeWorkbenchDomains;
  experienceMode: AtlasExperienceModeV256;
  scaleBand: AtlasScaleBand;
  visualProfile: AtlasVisualProfileV299;
  selectedObjectId: string;
}) {
  const { atlasRuntimeQualityTier } = domains.scene;
  return useMemo(
    () => createAtlasRuntimeStateV256({
      experienceMode,
      sceneMode: domains.scene.atlasSceneMode,
      legacyLodTier: domains.timelinePhysics.floatingOriginRef.current.lodTier,
      selectedObjectId,
      ready: domains.scene.atlasReady,
      gaiaCatalogSource: domains.evidenceMission.gaiaCatalogSource,
      qualityTier: atlasRuntimeQualityTier,
      activeCatalogBudget:
        atlasRuntimeQualityTier === "mobile-safe"
          ? 1_000
          : atlasRuntimeQualityTier === "closeup-inspect"
            ? 1_200
            : 4_000,
      scaleBand,
      visualCandidateApplied: visualProfile !== ATLAS_VISUAL_PROFILE_LEGACY_V261,
    }),
    [
      atlasRuntimeQualityTier, domains.evidenceMission.gaiaCatalogSource,
      domains.scene.atlasReady, domains.scene.atlasSceneMode,
      domains.timelinePhysics.floatingOriginRef, experienceMode,
      scaleBand, selectedObjectId, visualProfile,
    ],
  );
}
