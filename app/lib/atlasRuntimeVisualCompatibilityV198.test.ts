import { describe, expect, it } from "vitest";
import { createAtlasBackgroundGuardSummary } from "./atlasBackgroundGuard";
import { createAtlasBrowserAcceptanceSummary } from "./atlasBrowserAcceptance";
import { createAtlasChineseDeepSpaceFidelitySummary } from "./atlasChineseDeepSpaceFidelity";
import { createAtlasCinematicCloseupDirectorSummary } from "./atlasCinematicCloseupDirector";
import { createAtlasCinematicDeepSpaceBackdropSummary } from "./atlasCinematicDeepSpaceBackdrop";
import { createAtlasCinematicDeepSpaceCameraSummary } from "./atlasCinematicDeepSpaceCamera";
import { createAtlasCinematicKeyLightDirectorSummary } from "./atlasCinematicKeyLightDirector";
import { createAtlasCinematicLightingCompositionSummary } from "./atlasCinematicLightingComposition";
import { createAtlasCinematicPlanetaryArtDirectionSummary } from "./atlasCinematicPlanetaryArtDirection";
import { createAtlasCinematicWorkbenchSummary } from "./atlasCinematicWorkbench";
import { createAtlasCloseupPresentationTruthSummary } from "./atlasCloseupPresentationTruth";
import { createAtlasCloseupVisualFidelitySummary } from "./atlasCloseupVisualFidelity";
import { createAtlasMaterialProfileSummary } from "./atlasMaterialProfileContract";
import { createAtlasPlanetaryColorGradingSummary } from "./atlasPlanetaryColorGrading";
import { createAtlasPlanetaryDepthLightingSummary } from "./atlasPlanetaryDepthLighting";
import { createAtlasPlanetaryMaterialCompositionSummary } from "./atlasPlanetaryMaterialComposition";
import { createAtlasPlanetaryVisualFidelitySummary } from "./atlasPlanetaryVisualFidelity";
import { createAtlasReferenceGradeSpaceArtSummary } from "./atlasReferenceGradeSpaceArt";
import { ATLAS_RUNTIME_VISUAL_STATIC_SUMMARIES_V198 } from "./atlasRuntimeVisualCompatibilityV198";
import { ATLAS_RUNTIME_VISUAL_COMPACT_SUMMARIES_V198 } from "./atlasRuntimeVisualCompactV198";
import { createAtlasSparseDeepSpaceDirectorSummary } from "./atlasSparseDeepSpaceDirector";
import { createAtlasUniverseSandboxReferenceBackdropSummary } from "./atlasUniverseSandboxReferenceBackdrop";
import { createAtlasVisualStabilitySummary } from "./atlasVisualStability";
import { createAtlasWorkbenchAccessibilitySummary } from "./atlasWorkbenchAccessibility";

describe("v198 runtime visual compatibility manifest", () => {
  it("is byte-for-value equivalent to every canonical static summary", () => {
    expect(ATLAS_RUNTIME_VISUAL_STATIC_SUMMARIES_V198).toEqual({
      atlasBrowserAcceptanceSummary: createAtlasBrowserAcceptanceSummary(),
      atlasWorkbenchAccessibilitySummary: createAtlasWorkbenchAccessibilitySummary(),
      atlasCinematicWorkbenchSummary: createAtlasCinematicWorkbenchSummary(),
      atlasPlanetaryVisualFidelitySummary: createAtlasPlanetaryVisualFidelitySummary(),
      atlasCinematicLightingSummary: createAtlasCinematicLightingCompositionSummary(),
      atlasChineseDeepSpaceFidelitySummary: createAtlasChineseDeepSpaceFidelitySummary(),
      atlasCinematicDeepSpaceCameraSummary: createAtlasCinematicDeepSpaceCameraSummary(),
      atlasUniverseSandboxReferenceBackdropSummary: createAtlasUniverseSandboxReferenceBackdropSummary(),
      atlasReferenceGradeSpaceArtSummary: createAtlasReferenceGradeSpaceArtSummary(),
      atlasPlanetaryMaterialCompositionSummary: createAtlasPlanetaryMaterialCompositionSummary(),
      atlasCinematicCloseupDirectorSummary: createAtlasCinematicCloseupDirectorSummary(),
      atlasCinematicKeyLightDirectorSummary: createAtlasCinematicKeyLightDirectorSummary(),
      atlasPlanetaryDepthLightingSummary: createAtlasPlanetaryDepthLightingSummary(),
      atlasPlanetaryColorGradingSummary: createAtlasPlanetaryColorGradingSummary(),
      atlasCinematicPlanetaryArtDirectionSummary: createAtlasCinematicPlanetaryArtDirectionSummary(),
      atlasCinematicDeepSpaceBackdropSummary: createAtlasCinematicDeepSpaceBackdropSummary(),
      atlasSparseDeepSpaceDirectorSummary: createAtlasSparseDeepSpaceDirectorSummary(),
      atlasCloseupPresentationTruthSummary: createAtlasCloseupPresentationTruthSummary(),
      atlasVisualStabilitySummary: createAtlasVisualStabilitySummary(),
      atlasBackgroundGuardSummary: createAtlasBackgroundGuardSummary(),
      atlasMaterialProfileSummary: createAtlasMaterialProfileSummary(),
      atlasCloseupVisualFidelitySummary: createAtlasCloseupVisualFidelitySummary(),
    });
  });

  it("keeps every root-facing scalar while pruning report-only collections", () => {
    const scalars = (value: unknown): unknown => {
      if (Array.isArray(value)) return [];
      if (value && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, entry]) => [key, scalars(entry)]),
        );
      }
      return value;
    };
    expect(ATLAS_RUNTIME_VISUAL_COMPACT_SUMMARIES_V198).toEqual(
      scalars(ATLAS_RUNTIME_VISUAL_STATIC_SUMMARIES_V198),
    );
  });
});
