import { describe, expect, it } from "vitest";
import {
  ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION,
  createAtlasCinematicLightingCompositionSummary,
} from "./atlasCinematicLightingComposition";

describe("Atlas Cinematic Lighting Composition v44", () => {
  it("creates deterministic local lighting and post-FX metadata", () => {
    const first = createAtlasCinematicLightingCompositionSummary();
    const second = createAtlasCinematicLightingCompositionSummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_CINEMATIC_LIGHTING_COMPOSITION_VERSION);
    expect(first.status).toBe("informational");
    expect(first.visualTarget).toBe("closeup-cinematic-lighting-composition");
    expect(first.lightingProfile).toBe("filmic-closeup-balanced");
    expect(first.postFxProfile).toBe("aces-vignette-restrained-bloom");
    expect(first.assetPolicy).toBe("dev-prepared-local-runtime");
    expect(first.runtimeAssetSource).toBe("local-public-textures-only");
    expect(first.skyCloseupProfile).toBe("deep-space-filmic-dim");
    expect(first.supportedLightingProfiles).toEqual([
      "overview",
      "earth-night-closeup",
      "terrestrial-closeup",
      "lunar-mars-closeup",
      "gas-giant-closeup",
      "solar-closeup",
    ]);
  });

  it("preserves visual, accessibility, certification, online, and physics boundaries", () => {
    const summary = createAtlasCinematicLightingCompositionSummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBoundaryPreserved).toBe("v42-cinematic-boundary-preserved");
    expect(summary.planetaryBoundaryPreserved).toBe("v43-planetary-visual-fidelity-preserved");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.trustedBoundary).toContain("developer-prepared local assets at runtime");
    expect(summary.trustedBoundary).toContain("v41 AA workbench boundary");
    expect(summary.trustedBoundary).toContain("v42 cinematic visual boundary");
    expect(summary.trustedBoundary).toContain("v43 planetary visual fidelity boundary");
    expect(summary.trustedBoundary).toContain("online validation");
    expect(summary.trustedBoundary).toContain("physics mutation");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("runtime command passed");
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toContain("certified");
  });
});
