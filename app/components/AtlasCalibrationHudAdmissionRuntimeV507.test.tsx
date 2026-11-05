import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = [
  "app/components/KerrTopologyDetectorAdmissionV501.tsx",
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
] as const;
const sources = files.map((file) => readFileSync(file, "utf8"));
const combined = sources.join("\n");

describe("v507 three-stage detector HUD runtime", () => {
  it("binds admission, readiness and preflight to one external mode store", () => {
    for (const source of sources) {
      expect(source).toContain("bindAtlasCalibrationHudV505(");
      expect(source).toContain("useSyncExternalStore(");
      expect(source).toContain("subscribeAtlasCalibrationHudModeV506");
      expect(source).toContain("setAtlasCalibrationHudModeV506(entry)");
    }
  });

  it("gives the admission surface every stable presentation token", () => {
    const admission = sources[0];
    for (const token of [
      "panel",
      "panelRaised",
      "ink",
      "mutedInk",
      "accent",
      "accentWash",
      "warning",
      "blocked",
      "grid",
      "gridOpacity",
      "glowOpacity",
      "transitionMs",
    ]) {
      expect(admission).toContain(`profile.tokens.${token}`);
    }
  });

  it("preserves the blocked science boundary across all three surfaces", () => {
    expect(combined).toContain('data-atlas-v501-admitted="false"');
    expect(combined).toContain('data-atlas-v503-authority-admitted="false"');
    expect(combined).toContain('data-atlas-v504-authority-granted="false"');
    expect(combined).toContain('data-atlas-v507-scientific-field-mutation="false"');
    for (const forbidden of ["Math.random", "<canvas", "physicsEngine", "setSceneRevision"]) {
      expect(combined).not.toContain(forbidden);
    }
    expect(combined).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
  });
});
