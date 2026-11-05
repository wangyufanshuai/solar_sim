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

describe("v506 shared calibration HUD mode runtime", () => {
  it("uses one external store in both mutually exclusive detail surfaces", () => {
    for (const source of [readiness, preflight]) {
      expect(source).toContain("useSyncExternalStore(");
      expect(source).toContain("subscribeAtlasCalibrationHudModeV506");
      expect(source).toContain("getAtlasCalibrationHudModeSnapshotV506");
      expect(source).toContain("setAtlasCalibrationHudModeV506(entry)");
      expect(source).toContain('data-atlas-v506-hud-mode-store="external"');
      expect(source).not.toContain('useState<AtlasCalibrationHudModeV505>');
    }
    expect(wrapper).toContain('data-atlas-v506-hud-mode-store="external-persistent"');
  });

  it("keeps store wiring outside AppShell, Canvas and scientific mutation paths", () => {
    const combined = `${readiness}\n${preflight}\n${wrapper}`;
    for (const forbidden of [
      "AtlasAppShell",
      "<canvas",
      "physicsEngine",
      "setSceneRevision",
      "Math.random",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
    expect(combined).toContain('data-atlas-v505-scientific-field-mutation="false"');
  });
});
