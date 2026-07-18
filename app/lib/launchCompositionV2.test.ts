import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { LAUNCH_ASSET_TRANSFORMS_V2, solveLaunchFrameV2 } from "./launchCompositionV2";

describe("v158 launch composition", () => {
  it("keeps the full prelaunch stack in a centered safe composition", () => {
    const frame = solveLaunchFrameV2({
      phase: "prelaunch",
      qualityTier: "launch-cinematic",
      vehicleHeightScene: 0.18,
    });
    expect(frame.desiredSubjectCoverage).toBe(0.5);
    expect(frame.sideDistance).toBeGreaterThan(frame.elevationDistance);
    expect(frame.lookAheadDistance).toBeGreaterThan(0);
  });

  it("backs mobile and separation cameras away without changing launch physics", () => {
    const desktop = solveLaunchFrameV2({ phase: "stage-separation", qualityTier: "launch-cinematic", vehicleHeightScene: 0.18 });
    const mobile = solveLaunchFrameV2({ phase: "stage-separation", qualityTier: "mobile-safe", vehicleHeightScene: 0.18 });
    expect(mobile.sideDistance).toBeGreaterThan(desktop.sideDistance);
    expect(mobile.desiredSubjectCoverage).toBeLessThan(desktop.desiredSubjectCoverage);
    expect(LAUNCH_ASSET_TRANSFORMS_V2["sls-block-1"].path).toContain("sls-block-1.glb");
  });

  it("leaves DPR and WebGL viewport ownership with React Three Fiber", () => {
    const source = readFileSync("app/components/UniverseCanvas.tsx", "utf8");
    expect(source).not.toContain("gl.setPixelRatio(");
    expect(source).toContain("dpr={simulation.visualEnhance ? [1, 1.5] : 1}");
  });
});
