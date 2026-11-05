import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v492 five-level metrology observatory", () => {
  it("keeps detail components mutually exclusive and idle by default", () => {
    const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV492.tsx", "utf8");
    expect(source).toContain('useState<KerrPhotonMetrologyDetailSurfaceV492>("none")');
    expect(source).toContain('detail === "coordinate-atlas"');
    expect(source).toContain('detail === "contrast-lattice"');
    expect(source).toContain('detail === "gauge-reconstruction"');
    expect(source).toContain('current === id ? "none" : id');
    expect(source).toContain('lazy(() => import("./KerrPhotonMetrologyCockpitV485"))');
    expect(source).toContain('lazy(() => import("./KerrRedshiftGaugeReconstructionV491"))');
  });

  it("does not issue detail data requests or mutate scene state", () => {
    const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV492.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).not.toContain("loadKerrDimensionlessPhotonAtlasSummaryV487");
    expect(source).not.toContain("loadKerrRedshiftContrastLatticeSummaryV489");
    expect(source).not.toContain("loadKerrRedshiftGaugeReconstructionSummaryV491");
    expect(source).not.toContain("/api/atlas/relativity-evidence/");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("physicsEngine");
    expect(source).not.toContain("setSceneRevision");
    expect(workbench).toContain('from "./KerrPhotonMetrologyObservatoryIntentV492"');
    expect(workbench).toContain('<KerrPhotonMetrologyObservatoryIntentV492 active={tab === "campaign-evidence"} />');
  });
});
