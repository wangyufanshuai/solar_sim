import { describe, expect, it } from "vitest";
import {
  ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION,
  createAtlasChineseDeepSpaceFidelitySummary,
} from "./atlasChineseDeepSpaceFidelity";

describe("Atlas Chinese Deep-Space Fidelity v45", () => {
  it("creates deterministic zh-CN interface and deep-space presentation metadata", () => {
    const first = createAtlasChineseDeepSpaceFidelitySummary();
    const second = createAtlasChineseDeepSpaceFidelitySummary();

    expect(first).toEqual(second);
    expect(first.version).toBe(ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION);
    expect(first.status).toBe("informational");
    expect(first.uiLanguage).toBe("zh-CN");
    expect(first.localizationMode).toBe("zh-cn-primary-scientific-ids-preserved");
    expect(first.visualProfile).toBe("milky-way-constellation-nebula-balanced");
    expect(first.assetPolicy).toBe("local-runtime-assets");
    expect(first.runtimeAssetSource).toBe("public-textures-and-curated-local-catalogs");
    expect(first.featuredLayerCount).toBe(4);
    expect(first.featuredLayers).toEqual([
      "milky-way",
      "constellations",
      "nebulae",
      "planetary-closeups",
    ]);
  });

  it("preserves v41-v44, certification, online, and physics boundaries", () => {
    const summary = createAtlasChineseDeepSpaceFidelitySummary();
    const serialized = JSON.stringify(summary).toLowerCase();

    expect(summary.aaBoundaryPreserved).toBe("v41-aa-boundary-preserved");
    expect(summary.cinematicBoundaryPreserved).toBe("v42-cinematic-boundary-preserved");
    expect(summary.planetaryBoundaryPreserved).toBe("v43-planetary-visual-fidelity-preserved");
    expect(summary.lightingBoundaryPreserved).toBe("v44-cinematic-lighting-preserved");
    expect(summary.runtimeCertificationStatus).toBe("not-claimed-in-app");
    expect(summary.artisticCertificationStatus).toBe("not-claimed");
    expect(summary.scientificCertificationStatus).toBe("not-claimed");
    expect(summary.onlineValidationStatus).toBe("not-claimed");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.trustedBoundary).toContain("curated local catalogs");
    expect(summary.trustedBoundary).toContain("v41 accessibility");
    expect(summary.trustedBoundary).toContain("v42 cinematic workbench");
    expect(summary.trustedBoundary).toContain("v43 planetary visual fidelity");
    expect(summary.trustedBoundary).toContain("v44 cinematic lighting");
    expect(summary.trustedBoundary).toContain("online validation");
    expect(summary.trustedBoundary).toContain("physics mutation");
    expect(serialized).not.toContain("trustscore");
    expect(serialized).not.toContain("runtime command passed");
    expect(serialized).not.toContain("online-source");
    expect(serialized).not.toContain("physics mutation applied");
    expect(serialized).not.toContain("certified");
  });
});
