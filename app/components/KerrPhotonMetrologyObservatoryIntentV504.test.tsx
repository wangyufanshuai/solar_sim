import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx",
  "utf8",
);

describe("v504 ten-detail preflight observatory", () => {
  it("keeps all ten details in one exclusive component map", () => {
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
      "candidate-preflight",
    ]) {
      expect(source).toContain(`"${id}"`);
    }
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV504>("none")');
    expect(source).toContain("const SelectedDetail = detail === \"none\" ? null : DETAIL_COMPONENTS[detail]");
    expect(source).toContain("SelectedDetail ? <SelectedDetail /> : null");
  });

  it("does not request detail data or mutate science from the wrapper", () => {
    expect(source).toContain('data-atlas-v504-static-network-budget="0"');
    expect(source).toContain('data-atlas-v504-detail-data-request-by-wrapper="false"');
    expect(source).toContain('data-atlas-v504-preflight-ready="false"');
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
