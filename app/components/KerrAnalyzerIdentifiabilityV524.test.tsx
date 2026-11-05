import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrAnalyzerIdentifiabilityV524.tsx",
  "utf8",
);

describe("v524 V7.3 instrument HUD", () => {
  it("consumes every visual profile group without scientific style inputs", () => {
    for (const token of [
      "profile.panel",
      "profile.panelRaised",
      "profile.ink",
      "profile.muted",
      "profile.grid",
      "profile.identifiable",
      "profile.nullspace",
      "profile.blocked",
      "profile.railOpacity",
      "profile.nodeGlowOpacity",
      "profile.scienceBoundary.linearDisplay",
      "profile.scienceBoundary.bloomIntensity",
      "profile.scienceBoundary.colorGradeIntensity",
      "profile.cinematicSeed",
    ]) expect(source).toContain(token);
    expect(source).toContain("numericScientificStyleInputCount");
    expect(source).toContain("rankDrivesStyle");
    expect(source).toContain("conditionNumberDrivesStyle");
    expect(source).toContain("nullityDrivesStyle");
  });

  it("keeps the component read-only and single-canvas neutral", () => {
    expect(source).toContain('data-atlas-v524-canvas-created="false"');
    expect(source).toContain('data-atlas-v524-scene-revision-delta="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("锟");
  });
});
