import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v486 photon metrology runtime integration", () => {
  it("uses a third-level lazy boundary behind local-shadow campaign intent", () => {
    const wrapper = readFileSync(
      "app/components/KerrPhotonMetrologyCockpitIntentV486.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(wrapper).toContain('lazy(\n  () => import("./KerrPhotonMetrologyCockpitV485")');
    expect(wrapper).toContain("if (!decision.componentImportAuthorized) return null");
    expect(wrapper).toContain("<Suspense");
    expect(workbench).toContain('from "./KerrPhotonMetrologyCockpitIntentV486"');
    expect(workbench).toContain('<KerrPhotonMetrologyCockpitIntentV486 active={tab === "campaign-evidence"} />');
    expect(workbench).not.toContain('from "./KerrPhotonMetrologyCockpitV485"');
    expect(workbench).not.toContain("/api/atlas/relativity-evidence/v485/photon-metrology-cockpit");
  });

  it("retains the outer lazy surfaces and introduces no runtime mutation primitive", () => {
    const section = readFileSync("app/components/RelativityResearchWorkspaceSection.tsx", "utf8");
    const surfaces = readFileSync("app/components/AtlasRuntimeWorkbenchLazySurfaces.tsx", "utf8");
    const wrapper = readFileSync(
      "app/components/KerrPhotonMetrologyCockpitIntentV486.tsx",
      "utf8",
    );
    expect(section).toContain('lazy(() => import("./RelativityResearchWorkbenchV280"))');
    expect(surfaces).toContain('lazy(() => import("./RelativityObservableAtlasPanel"))');
    expect(wrapper).not.toContain("Math.random");
    expect(wrapper).not.toContain("<canvas");
    expect(wrapper).not.toContain("physicsEngine");
    expect(wrapper).not.toContain("setSceneRevision");
  });
});
