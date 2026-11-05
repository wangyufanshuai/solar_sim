import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrCalibrationExcitationDesignV525.tsx",
  "utf8",
);
describe("v525 V7.4 calibration design HUD", () => {
  it("consumes every visual token without numerical scientific styling", () => {
    for (const token of [
      "profile.panel",
      "profile.panelRaised",
      "profile.ink",
      "profile.muted",
      "profile.grid",
      "profile.base",
      "profile.constraint",
      "profile.qualified",
      "profile.unavailable",
      "profile.railOpacity",
      "profile.nodeGlowOpacity",
      "profile.scienceBoundary.linearDisplay",
      "profile.scienceBoundary.bloomIntensity",
      "profile.scienceBoundary.colorGradeIntensity",
      "profile.cinematicSeed",
    ]) expect(source).toContain(token);
    expect(source).toContain("conditionNumberDrivesStyle");
    expect(source).toContain("determinantDrivesStyle");
  });

  it("states the 2-constraint versus 6-file boundary and remains canvas neutral", () => {
    expect(source).toContain("两者不是同一计数");
    expect(source).toContain("science recovery 仍不可执行");
    expect(source).toContain('data-atlas-v525-canvas-created="false"');
    expect(source).toContain('data-atlas-v525-scene-revision-delta="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("锟");
  });
});
