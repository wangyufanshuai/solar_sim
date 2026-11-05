import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV509.tsx",
  "utf8",
);
describe("v509 eleven-detail timeline observatory", () => {
  it("keeps eleven details mutually exclusive", () => {
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
    ]) {
      expect(source).toContain(`"${id}"`);
    }
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV509>("none")');
    expect(source).toContain("SelectedDetail ? <SelectedDetail /> : null");
    expect(source).toContain('lazy(() => import("./KerrDetectorEvidenceTimelineV509"))');
  });

  it("keeps timeline loading behind second explicit intent", () => {
    expect(source).toContain('data-atlas-v509-static-network-budget="0"');
    expect(source).toContain('data-atlas-v509-detail-data-request-by-wrapper="false"');
    expect(source).toContain('data-atlas-v509-detector-timeline-automatic-request="false"');
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("useEffect");
  });
});
