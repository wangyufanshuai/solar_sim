import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrCalibrationUncertaintyTransferV526.tsx", "utf8");
describe("v526 V7.5 uncertainty transfer HUD", () => {
  it("consumes visual tokens without numerical uncertainty styling", () => {
    for (const token of ["profile.panel", "profile.panelRaised", "profile.ink", "profile.muted", "profile.grid", "profile.scienceNoise", "profile.calibrationNoise", "profile.combined", "profile.unavailable", "profile.railOpacity", "profile.nodeGlowOpacity", "profile.scienceBoundary.linearDisplay", "profile.scienceBoundary.bloomIntensity", "profile.scienceBoundary.colorGradeIntensity", "profile.cinematicSeed"]) expect(source).toContain(token);
    expect(source).toContain("varianceDrivesStyle");
    expect(source).toContain("correlationDrivesStyle");
    expect(source).toContain("boundDrivesStyle");
  });
  it("keeps physical uncertainty unavailable and remains canvas neutral", () => {
    expect(source).toContain("numerical covariance");
    expect(source).toContain("physical uncertainty unavailable");
    expect(source).toContain('data-atlas-v526-canvas-created="false"');
    expect(source).toContain('data-atlas-v526-scene-revision-delta="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("锟");
  });
});
