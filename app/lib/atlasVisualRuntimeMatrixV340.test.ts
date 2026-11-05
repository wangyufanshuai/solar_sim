import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_RUNTIME_GROUPS_V300 } from "./atlasVisualRuntimeConsumptionV300";
import { ATLAS_VISUAL_PROFILES_V340, createAtlasVisualRuntimeMatrixV340 } from "./atlasVisualRuntimeMatrixV340";

describe("v340 V5/V6/V7 visual runtime matrix", () => {
  it("proves three profiles across all eight real runtime groups", () => {
    const matrix = createAtlasVisualRuntimeMatrixV340();
    expect(matrix).toMatchObject({ version: "v340-v5-v6-v7-runtime-consumption-matrix-v1", rowCount: 24, allGroupsCovered: true, allProfilesCovered: true, resolverReferenceStable: true, scienceFieldsEquivalent: true, cinematicFieldsPairwiseDistinct: true, v7Direction: "deep-space-precision-observatory" });
    for (const profile of ATLAS_VISUAL_PROFILES_V340) expect(matrix.rows.filter((row) => row.profile === profile)).toHaveLength(8);
    for (const group of ATLAS_VISUAL_RUNTIME_GROUPS_V300) expect(matrix.rows.filter((row) => row.group === group)).toHaveLength(3);
    expect(matrix.rows.every((row) => row.signatureMatches && row.resolverReferenceStable)).toBe(true);
  });

  it("keeps the eight existing consumers and exposes later profiles only through local-shadow A/B", () => {
    const consumers = [
      ["app/components/GalaxyEnvironmentSphere.tsx", "sky"], ["app/components/Planet.tsx", "solar"], ["app/components/GaiaStarField.tsx", "catalog"],
      ["app/components/UniversePmndrsPostProcessing.tsx", "postFx"], ["app/components/KerrBlackHole.tsx", "strongGravity"], ["app/components/LaunchSceneView.tsx", "launch"],
      ["app/components/ExoplanetSystemScene.tsx", "exoplanet"], ["app/components/ScienceCinematicVisualSurfaceV261.tsx", "hud"],
    ] as const;
    for (const [path, group] of consumers) {
      const source = readFileSync(resolve(process.cwd(), path), "utf8");
      expect(source).toContain("useAtlasVisualRuntimeConsumerV300");
      expect(source).toContain(`group: "${group}"`);
    }
    const ab = readFileSync(resolve(process.cwd(), "app/components/AtlasVisualABControlV261.tsx"), "utf8");
    expect(ab).toContain('const localShadow = deliveryProfile === "local-shadow"');
    expect(ab).toContain("V7 Observatory");
    expect(ab).toContain('data-atlas-visual-ab="v405-fourteen-way-local-shadow"');
    expect(ab).toContain("ATLAS_VISUAL_PROFILE_CANDIDATE_V349 || localShadow");
    expect(ab).toContain("ATLAS_VISUAL_PROFILE_CANDIDATE_V362 || localShadow");
    expect(ab).toContain("ATLAS_VISUAL_PROFILE_CANDIDATE_V370 || localShadow");
    expect(ab).toContain("ATLAS_VISUAL_PROFILE_CANDIDATE_V377 || localShadow");
    expect(ab).toContain("ATLAS_VISUAL_PROFILE_CANDIDATE_V400 || localShadow");
    expect(ab).toContain('data-atlas-v12-observation-hub-default-applied="false"');
  });
});
