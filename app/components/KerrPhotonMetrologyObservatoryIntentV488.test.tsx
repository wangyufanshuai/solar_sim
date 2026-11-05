import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v488 photon metrology observatory integration", () => {
  it("lazy-loads v485 and v487 only behind the campaign-evidence intent", () => {
    const source = readFileSync(
      "app/components/KerrPhotonMetrologyObservatoryIntentV488.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain('() => import("./KerrPhotonMetrologyCockpitV485")');
    expect(source).toContain('() => import("./KerrDimensionlessPhotonAtlasV487")');
    expect(source).toContain("if (!decision.observatoryImportAuthorized) return null");
    expect(workbench).toContain('from "./KerrPhotonMetrologyObservatoryIntentV488"');
    expect(workbench).toContain('<KerrPhotonMetrologyObservatoryIntentV488 active={tab === "campaign-evidence"} />');
    expect(workbench).not.toContain('from "./KerrPhotonMetrologyCockpitV485"');
    expect(workbench).not.toContain('from "./KerrDimensionlessPhotonAtlasV487"');
  });

  it("does not trigger the v487 data request or mutate scene state", () => {
    const source = readFileSync(
      "app/components/KerrPhotonMetrologyObservatoryIntentV488.tsx",
      "utf8",
    );
    expect(source).not.toContain("loadKerrDimensionlessPhotonAtlasSummaryV487");
    expect(source).not.toContain("/api/atlas/relativity-evidence/v487");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("physicsEngine");
    expect(source).not.toContain("setSceneRevision");
    expect(source).toContain('data-atlas-v488-coordinate-data-request-authorized-by-wrapper="false"');
  });
});
