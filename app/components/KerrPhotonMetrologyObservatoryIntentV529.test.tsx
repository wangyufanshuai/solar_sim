import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPhotonMetrologyObservatoryIntentV529.tsx",
  "utf8",
);
const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
describe("v529 historical shared-catalog observatory", () => {
  it("uses one extended thirty-one-detail catalog", () => {
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAILS_V529");
    expect(source).toContain("KERR_PHOTON_METROLOGY_DETAIL_IDS_V529");
    expect(source).not.toContain('"coordinate-atlas": lazy');
  });
  it("keeps requests behind explicit selection while Workbench advances", () => {
    expect(source).toContain('data-atlas-v529-robustness-request-before-detail="false"');
    expect(source).not.toContain("fetch(");
    expect(workbench).not.toContain('from "./KerrPhotonMetrologyObservatoryIntentV529"');
  });
  it("keeps scene boundaries", () => {
    expect(source).toContain('data-atlas-v529-canvas-created="false"');
    expect(source).toContain('data-atlas-v529-scene-revision-delta="0"');
    expect(source).toContain('data-atlas-v529-physics-mutation="false"');
  });
});
