import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV503.tsx",
  "utf8",
);

describe("v503 nine-detail calibration-readiness observatory", () => {
  it("keeps nine detail surfaces mutually exclusive and idle", () => {
    expect(source).toContain(
      'useState<KerrPhotonMetrologyDetailSurfaceV503>("none")',
    );
    for (const id of [
      "coordinate-atlas",
      "contrast-lattice",
      "gauge-reconstruction",
      "edge-redundancy",
      "double-edge-identifiability",
      "minimum-cut",
      "connectivity-lattice",
      "detector-admission",
      "calibration-readiness",
    ]) {
      expect(source).toContain(`detail === "${id}"`);
    }
    expect(source).toContain('current === id ? "none" : id');
    expect(source).toContain('lazy(\n  () => import("./KerrMeasuredCalibrationReadinessV503")');
  });

  it("keeps static readiness at zero network and zero science writeback", () => {
    expect(source).toContain('data-atlas-v503-static-network-budget="0"');
    expect(source).toContain('data-atlas-v503-calibration-pack-ready="false"');
    expect(source).toContain('data-atlas-v503-detail-data-request-by-wrapper="false"');
    for (const token of [
      "/api/atlas/relativity-evidence/",
      "Math.random",
      "<canvas",
      "physicsEngine",
      "setSceneRevision",
    ]) {
      expect(source).not.toContain(token);
    }
  });
});
