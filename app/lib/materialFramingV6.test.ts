import { describe, expect, it } from "vitest";
import { solveAtlasCameraFrameV5 } from "./atlasCameraFrameSolverV5";
import { stellarMaterialProfile } from "./stellarMaterialProfile";
import { createStellarPortraitProfileV6 } from "./stellarPortraitProfileV6";

describe("v157 scientific material and framing", () => {
  it("keeps hot and cool stars chromatically distinct within three draw calls", () => {
    const hot = createStellarPortraitProfileV6({
      material: stellarMaterialProfile({ id: "sirius", colorBpRp: 0.01, mag: -1.46, parallaxMas: 379 }),
      teffK: 9_940,
      logg: 4.3,
      radiusSolar: 1.71,
      spectralType: "A1V",
      dataTier: "parameter-rich",
    });
    const cool = createStellarPortraitProfileV6({
      material: stellarMaterialProfile({ id: "betelgeuse", colorBpRp: 2.3, mag: 0.42, parallaxMas: 5.95 }),
      teffK: 3_500,
      logg: -0.5,
      radiusSolar: 760,
      spectralType: "M1Ia",
      dataTier: "parameter-rich",
    });
    expect(hot.sceneLinearColor[2]).toBeGreaterThan(hot.sceneLinearColor[0]);
    expect(cool.sceneLinearColor[0]).toBeGreaterThan(cool.sceneLinearColor[2]);
    expect(hot.drawCallBudget).toBe(3);
    expect(cool.drawCallBudget).toBe(3);
    expect(hot.coronaStrength).toBeLessThanOrEqual(0.72);
    expect(hot.granulationScale).toBeGreaterThanOrEqual(7.2);
    expect(hot.granulationContrast).toBeGreaterThanOrEqual(0.17);
    expect(hot.limbDarkening).toBeGreaterThanOrEqual(0.5);
  });

  it("frames Saturn rings above the dock inside the safe region", () => {
    const frame = solveAtlasCameraFrameV5({
      subjectRadiusScene: 1,
      ringOuterRadiusScene: 2.35,
      verticalFovDeg: 45,
      viewportWidth: 1280,
      viewportHeight: 720,
      dockHeightPx: 82,
      safeRect: { left: 0, top: 0, right: 860, bottom: 720, viewportWidth: 1280, viewportHeight: 720 },
      desiredCoverage: 0.46,
    });
    expect(frame.framingRadiusScene).toBe(2.35);
    expect(frame.safeHeightPx).toBe(638);
    expect(frame.projectedDiameterPx / Math.min(frame.safeWidthPx, frame.safeHeightPx)).toBeCloseTo(0.46, 5);
  });
});
