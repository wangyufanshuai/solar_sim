import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV512.tsx", "utf8");

describe("v512 fourteen-detail science product observatory", () => {
  it("keeps fourteen details mutually exclusive", () => {
    for (const id of [
      "coordinate-atlas", "contrast-lattice", "gauge-reconstruction", "edge-redundancy",
      "double-edge-identifiability", "minimum-cut", "connectivity-lattice", "detector-admission",
      "calibration-readiness", "candidate-preflight", "detector-timeline", "detector-provenance",
      "instrument-authority", "science-product-eligibility",
    ]) expect(source).toContain(`"${id}"`);
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV512>("none")');
    expect(source).toContain('lazy(() => import("./KerrScienceProductEligibilityGraphV512"))');
    expect(source).toContain("SelectedDetail ? <SelectedDetail /> : null");
  });

  it("keeps graph loading behind local-shadow and explicit detail intent", () => {
    expect(source).toContain('data-atlas-v512-static-network-budget="0"');
    expect(source).toContain('data-atlas-v512-product-graph-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("keeps product promotion, Canvas, physics, and scene boundaries closed", () => {
    expect(source).toContain('data-atlas-v512-product-promotion="false"');
    expect(source).toContain('data-atlas-v512-canvas-created="false"');
    expect(source).toContain('data-atlas-v512-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v512-physics-mutation="false"');
  });
});
