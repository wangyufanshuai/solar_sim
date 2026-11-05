import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v494 five-level metrology observatory", () => {
  it("keeps four detail components mutually exclusive and idle by default", () => {
    const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV494.tsx", "utf8");
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV494>("none")');
    expect(source).toContain('detail === "coordinate-atlas"');
    expect(source).toContain('detail === "contrast-lattice"');
    expect(source).toContain('detail === "gauge-reconstruction"');
    expect(source).toContain('detail === "edge-redundancy"');
    expect(source).toContain('current === id ? "none" : id');
    expect(source).toContain('lazy(() => import("./KerrPhotonMetrologyCockpitV485"))');
    expect(source).toContain('lazy(() => import("./KerrRedshiftEdgeRedundancyV493"))');
  });

  it("does not issue detail data requests or mutate scene state", () => {
    const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV494.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).not.toContain("loadKerrDimensionlessPhotonAtlasSummaryV487");
    expect(source).not.toContain("loadKerrRedshiftContrastLatticeSummaryV489");
    expect(source).not.toContain("loadKerrRedshiftGaugeReconstructionSummaryV491");
    expect(source).not.toContain("loadKerrRedshiftEdgeRedundancySummaryV493");
    expect(source).not.toContain("/api/atlas/relativity-evidence/");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("physicsEngine");
    expect(source).not.toContain("setSceneRevision");
    expect(workbench).toContain('from "./KerrPhotonMetrologyObservatoryIntentV494"');
    expect(workbench).toContain('<KerrPhotonMetrologyObservatoryIntentV494 active={tab === "campaign-evidence"} />');
  });

  it("preserves v492 implementation as an immutable historical source", () => {
    const legacy = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV492.tsx", "utf8");
    expect(legacy).toContain('detail === "gauge-reconstruction"');
    expect(legacy).not.toContain('detail === "edge-redundancy"');
  });
});
