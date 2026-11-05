import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV510.tsx",
  "utf8",
);
describe("v510 twelve-detail portable provenance observatory", () => {
  it("keeps twelve detail surfaces mutually exclusive", () => {
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
    ]) {
      expect(source).toContain(`"${id}"`);
    }
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV510>("none")');
    expect(source).toContain("SelectedDetail ? <SelectedDetail /> : null");
    expect(source).toContain('lazy(() => import("./KerrDetectorProvenanceEnvelopeV510"))');
  });

  it("keeps provenance loading behind local-shadow and explicit detail intent", () => {
    expect(source).toContain('data-atlas-v510-static-network-budget="0"');
    expect(source).toContain('data-atlas-v510-detail-data-request-by-wrapper="false"');
    expect(source).toContain('data-atlas-v510-provenance-automatic-request="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });

  it("does not add public panel, Canvas, physics, or scene mutations", () => {
    expect(source).toContain('data-atlas-v510-canvas-created="false"');
    expect(source).toContain('data-atlas-v510-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v510-physics-mutation="false"');
    expect(source).toContain('data-atlas-v510-detector-authority="false"');
  });
});
