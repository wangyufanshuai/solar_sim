import { describe, expect, it } from "vitest";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import { createStellarPortraitProfileV7 } from "./stellarPortraitProfileV7";
import { createPlanetRenderGraphV3 } from "./planetRenderGraphV3";
import { createAtlasVisualDirectorV4 } from "./atlasVisualDirectorV4";

describe("v162 scientific visual material v7", () => {
  it("keeps hot and cool stars deterministic, chromatically distinct and within three draws", () => {
    const hotMaterial = stellarMaterialProfile({ id: "sirius", colorBpRp: 0.01, mag: -1.46, parallaxMas: 379 });
    const coolMaterial = stellarMaterialProfile({ id: "betelgeuse", colorBpRp: 2.2, mag: 0.5, parallaxMas: 5.9 });
    const hot = createStellarPortraitProfileV7({ material: hotMaterial, teffK: 9940, logg: 4.3, radiusSolar: 1.7, dataTier: "parameter-rich" });
    const cool = createStellarPortraitProfileV7({ material: coolMaterial, teffK: 3500, logg: 0.5, radiusSolar: 760, dataTier: "parameter-rich", variable: true });
    expect(hot.drawCallBudget).toBe(3);
    expect(cool.drawCallBudget).toBe(3);
    expect(hot.photosphereWhiteBalance).not.toEqual(cool.photosphereWhiteBalance);
    expect(createStellarPortraitProfileV7({ material: hotMaterial, teffK: 9940 })).toEqual(createStellarPortraitProfileV7({ material: hotMaterial, teffK: 9940 }));
  });

  it("caps every planet graph at six draws and applies bounded WebGL2 exposure", () => {
    for (const body of ["earth", "moon", "mars", "jupiter", "saturn", "neptune"]) {
      expect(createPlanetRenderGraphV3(body).maxDrawCalls).toBeLessThanOrEqual(6);
    }
    const profile = createAtlasVisualDirectorV4("inspect", "closeup-inspect");
    expect(profile.maxDevicePixelRatio).toBeLessThanOrEqual(1.5);
    expect(profile.totalGpuResidencyLimitBytes).toBeLessThanOrEqual(2.2 * 1024 ** 3);
  });
});
