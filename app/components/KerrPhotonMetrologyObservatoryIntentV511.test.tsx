import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV511.tsx",
  "utf8",
);
describe("v511 thirteen-detail instrument authority observatory", () => {
  it("keeps thirteen detail surfaces mutually exclusive", () => {
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
      "detector-timeline",
      "detector-provenance",
      "instrument-authority",
    ]) {
      expect(source).toContain(`"${id}"`);
    }
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV511>("none")');
    expect(source).toContain("SelectedDetail ? <SelectedDetail /> : null");
    expect(source).toContain('lazy(() => import("./KerrInstrumentAuthorityMatrixV511"))');
  });

  it("keeps matrix loading behind local-shadow and explicit detail intent", () => {
    expect(source).toContain('data-atlas-v511-static-network-budget="0"');
    expect(source).toContain('data-atlas-v511-detail-data-request-by-wrapper="false"');
    expect(source).toContain('data-atlas-v511-instrument-matrix-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("does not add public panel, Canvas, physics, or scene mutations", () => {
    expect(source).toContain('data-atlas-v511-canvas-created="false"');
    expect(source).toContain('data-atlas-v511-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v511-physics-mutation="false"');
    expect(source).toContain('data-atlas-v511-detector-authority="false"');
  });
});
