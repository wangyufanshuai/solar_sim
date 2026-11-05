import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_RUNTIME_GROUPS_V300 } from "./atlasVisualRuntimeConsumptionV300";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300 } from "./atlasVisualProfileV299";
import { createAtlasVisualRuntimeMatrixV334 } from "./atlasVisualRuntimeMatrixV334";

describe("v334 runtime visual consumption matrix", () => {
  it("proves V5/V6 x eight groups with stable resolver references and separated science/cinematic fields", () => {
    const matrix = createAtlasVisualRuntimeMatrixV334();
    expect(matrix).toMatchObject({ version: "v334-visual-runtime-consumption-matrix-v1", rowCount: 16, allGroupsCovered: true, allProfilesCovered: true, resolverReferenceStable: true, scienceFieldsEquivalent: true, cinematicFieldsDistinct: true });
    expect(matrix.rows.filter((row) => row.profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V299)).toHaveLength(8);
    expect(matrix.rows.filter((row) => row.profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V300)).toHaveLength(8);
    expect(matrix.rows.every((row) => row.signatureMatches && row.resolverReferenceStable)).toBe(true);
    for (const group of ATLAS_VISUAL_RUNTIME_GROUPS_V300) {
      expect(matrix.rows.filter((row) => row.group === group)).toHaveLength(2);
    }
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
  });
});
