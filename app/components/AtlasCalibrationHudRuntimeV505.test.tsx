import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readiness = readFileSync(
  "app/components/KerrMeasuredCalibrationReadinessV503.tsx",
  "utf8",
);
const preflight = readFileSync(
  "app/components/KerrMeasuredCalibrationPreflightV504.tsx",
  "utf8",
);
const wrapper = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  "utf8",
);
const all = `${readiness}\n${preflight}\n${wrapper}`;

describe("v505 calibration HUD runtime", () => {
  it("consumes every shared token across two real surfaces", () => {
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
      expect(all).toContain(`profile.tokens.${token}`);
    }
  });

  it("keeps both modes presentation-only and free of mojibake", () => {
    expect(readiness).toContain("subscribeAtlasCalibrationHudModeV506");
    expect(preflight).toContain("subscribeAtlasCalibrationHudModeV506");
    expect(wrapper).toContain('data-atlas-v505-scientific-field-mutation="false"');
    expect(all).not.toMatch(/\uFFFD|锟斤拷|鈥|銆|姝ｅ湪|涓嶅彲|缁熶竴/);
    for (const forbidden of ["Math.random", "<canvas", "physicsEngine", "setSceneRevision"]) {
      expect(all).not.toContain(forbidden);
    }
  });
});
