import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV528.tsx",
  "utf8",
);
const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
describe("v528 historical shared-catalog observatory", () => {
  it("keeps its frozen thirty-detail catalog", () => {
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAILS_V528");
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAIL_IDS_V528");
    expect(source).not.toContain('"coordinate-atlas":lazy');
  });
  it("keeps requests behind explicit selection while Workbench advances", () => {
    expect(source).toContain('data-atlas-v528-cost-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(workbench).not.toContain('from "./KerrPhotonMetrologyObservatoryIntentV528"');
  });
  it("keeps scene boundaries", () => {
    expect(source).toContain('data-atlas-v528-canvas-created="false"');
    expect(source).toContain('data-atlas-v528-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v528-physics-mutation="false"');
  });
});
