import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595,
  ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION,
  ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595,
  deriveAtlasProductSceneFamilyV595,
  resolveAtlasUnderlyingCanvasModeV595,
} from "./atlasProductSceneFamilyContractV595";

describe("v595 product scene family contract", () => {
  it("locks the six ordered product families and shared-canvas boundary", () => {
    expect(ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595_VERSION).toBe("v595-product-scene-family-contract-v1");
    expect(ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595).toEqual([
      "orbit-atlas-overview",
      "object-inspect",
      "stellar-exoplanet-systems",
      "mission-launch",
      "relativity-lab",
      "scene-lab",
    ]);
    expect(ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595.map(({ id }) => id)).toEqual(ATLAS_PRODUCT_SCENE_FAMILY_ORDER_V595);
    for (const family of ATLAS_PRODUCT_SCENE_FAMILY_CONTRACT_V595) {
      expect(family.journeyStages).toEqual(["entry", "hero", "exit"]);
      expect(family.sharedMainCanvas).toBe(true);
      expect(family.singleCanvasPolicy).toBe("one-shared-main-canvas");
      expect(family.exitPolicy).toBe("returns-to-orbit-atlas-overview");
      expect(family.lifecyclePolicy).toBe("release-temporary-resources-on-exit");
      expect(family.authority).toEqual({ scientific: false, measured: false, gpu: false });
    }
  });

  it("maps shell-only modes to their actual shared Canvas resource owner", () => {
    expect(resolveAtlasUnderlyingCanvasModeV595("scene-lab")).toBe("atlas");
    expect(resolveAtlasUnderlyingCanvasModeV595("relativity-lab")).toBe("kerr");
    for (const mode of ["atlas", "inspect", "launch", "kerr", "exoplanet-system"] as const) {
      expect(resolveAtlasUnderlyingCanvasModeV595(mode)).toBe(mode);
    }
  });

  it("maps shell modes and selections to a family without inventing a Canvas", () => {
    expect(deriveAtlasProductSceneFamilyV595("atlas")).toMatchObject({ familyId: "orbit-atlas-overview", underlyingCanvasMode: "atlas" });
    expect(deriveAtlasProductSceneFamilyV595("inspect", "earth")).toMatchObject({ familyId: "object-inspect", underlyingCanvasMode: "inspect" });
    expect(deriveAtlasProductSceneFamilyV595("inspect", "stellar-hero:sirius-a")).toMatchObject({ familyId: "stellar-exoplanet-systems", underlyingCanvasMode: "inspect" });
    expect(deriveAtlasProductSceneFamilyV595("inspect", "nearby-star:sirius")).toMatchObject({ familyId: "stellar-exoplanet-systems", underlyingCanvasMode: "inspect" });
    expect(deriveAtlasProductSceneFamilyV595("exoplanet-system", "trappist-1")).toMatchObject({ familyId: "stellar-exoplanet-systems", underlyingCanvasMode: "exoplanet-system" });
    expect(deriveAtlasProductSceneFamilyV595("launch")).toMatchObject({ familyId: "mission-launch", underlyingCanvasMode: "launch" });
    expect(deriveAtlasProductSceneFamilyV595("kerr")).toMatchObject({ familyId: "relativity-lab", underlyingCanvasMode: "kerr" });
    expect(deriveAtlasProductSceneFamilyV595("relativity-lab")).toMatchObject({ familyId: "relativity-lab", underlyingCanvasMode: "kerr" });
    expect(deriveAtlasProductSceneFamilyV595("scene-lab")).toMatchObject({ familyId: "scene-lab", underlyingCanvasMode: "atlas" });
  });

  it("exposes only observational DOM metadata and does not create a Canvas", () => {
    const shell = readFileSync(new URL("../components/AtlasAppShell.tsx", import.meta.url), "utf8");
    expect(shell).toContain("data-atlas-product-scene-family-v595");
    expect(shell).toContain("data-atlas-product-scene-family-version");
    expect(shell).toContain("data-atlas-product-scene-underlying-canvas-mode");
    expect(shell).toContain("data-atlas-product-scene-single-canvas-policy");
    expect(shell).not.toContain("<Canvas");
  });
});
