import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV530.tsx",
  "utf8",
);
const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
describe("v530 historical shared-catalog observatory", () => {
  it("uses one extended thirty-two-detail catalog", () => {
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAILS_V530");
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAIL_IDS_V530");
    expect(source).not.toContain('"coordinate-atlas": lazy');
  });
  it("keeps requests behind explicit selection while Workbench advances", () => {
    expect(source).toContain('data-atlas-v530-regret-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(workbench).not.toContain('from "./KerrPhotonMetrologyObservatoryIntentV530"');
  });
  it("keeps scene boundaries", () => {
    expect(source).toContain('data-atlas-v530-canvas-created="false"');
    expect(source).toContain('data-atlas-v530-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v530-physics-mutation="false"');
  });
});
