import { describe, expect, it } from "vitest";
import { createPlanetMaterialProfileV2 } from "./planetMaterialProfileV2";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import { createStellarPortraitProfileV5 } from "./stellarPortraitProfileV5";

describe("v143 material and camera V5", () => {
  it("keeps planet graphs under eight draws", () => {
    for (const body of ["earth", "moon", "mars", "jupiter", "saturn"]) {
      expect(createPlanetMaterialProfileV2(body).maxDrawCalls).toBeLessThanOrEqual(8);
    }
  });
  it("preserves hot/cool chromatic separation without white clipping", () => {
    const hot = createStellarPortraitProfileV5({ material: stellarMaterialProfile({ id: "hot", colorBpRp: -0.25, mag: 1, parallaxMas: 5 }), teffK: 18_000, logg: 4, radiusSolar: 5, spectralType: "B2V" });
    const cool = createStellarPortraitProfileV5({ material: stellarMaterialProfile({ id: "cool", colorBpRp: 2.4, mag: 8, parallaxMas: 20 }), teffK: 3_200, logg: 4.8, radiusSolar: 0.3, spectralType: "M4V" });
    expect(hot.sceneLinearColor[2]).toBeGreaterThan(hot.sceneLinearColor[0]);
    expect(cool.sceneLinearColor[0]).toBeGreaterThan(cool.sceneLinearColor[2]);
    expect(Math.max(...hot.sceneLinearColor)).toBeLessThan(1);
    expect(hot.drawCallBudget).toBe(6);
  });
  it("uses V7 metallicity and uncertainty as bounded presentation inputs", () => {
    const material = stellarMaterialProfile({ id: "gaia-v7", colorBpRp: 0.64, mag: 7, parallaxMas: 3 });
    const rich = createStellarPortraitProfileV5({
      material,
      teffK: 6_200,
      teffLowerK: 6_100,
      teffUpperK: 6_300,
      logg: 4.2,
      radiusSolar: 1.2,
      metallicityDex: 0.35,
      dataTier: "parameter-rich",
    });
    const repeated = createStellarPortraitProfileV5({
      material,
      teffK: 6_200,
      teffLowerK: 6_100,
      teffUpperK: 6_300,
      logg: 4.2,
      radiusSolar: 1.2,
      metallicityDex: 0.35,
      dataTier: "parameter-rich",
    });
    expect(rich).toEqual(repeated);
    expect(rich.metallicityBlend).toBeGreaterThan(0);
    expect(rich.parameterConfidence).toBeGreaterThan(0.9);
    expect(rich.sceneLinearColor.every((channel) => channel > 0 && channel < 1)).toBe(true);
    expect(rich.derivation).toContain("not-resolved-surface");
  });
});
