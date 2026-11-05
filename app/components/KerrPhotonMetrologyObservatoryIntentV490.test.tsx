import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v490 unified metrology observatory", () => {
  it("loads three component chunks only through campaign-evidence", () => {
    const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV490.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain('lazy(() => import("./KerrPhotonMetrologyCockpitV485"))');
    expect(source).toContain('lazy(() => import("./KerrDimensionlessPhotonAtlasV487"))');
    expect(source).toContain('lazy(() => import("./KerrRedshiftContrastLatticeV489"))');
    expect(workbench).toContain('from "./KerrPhotonMetrologyObservatoryIntentV490"');
    expect(workbench).toContain('<KerrPhotonMetrologyObservatoryIntentV490 active={tab === "campaign-evidence"} />');
    expect(workbench).not.toContain('from "./KerrDimensionlessPhotonAtlasV487"');
    expect(workbench).not.toContain('from "./KerrRedshiftContrastLatticeV489"');
  });

  it("does not issue either detail request or mutate the scene", () => {
    const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV490.tsx", "utf8");
    expect(source).not.toContain("loadKerrDimensionlessPhotonAtlasSummaryV487");
    expect(source).not.toContain("loadKerrRedshiftContrastLatticeSummaryV489");
    expect(source).not.toContain("/api/atlas/relativity-evidence/v487");
    expect(source).not.toContain("/api/atlas/relativity-evidence/v489");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("physicsEngine");
    expect(source).not.toContain("setSceneRevision");
  });
});
