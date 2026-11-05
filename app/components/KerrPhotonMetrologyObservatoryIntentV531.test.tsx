import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const source = readFileSync("app/components/KerrPhotonMetrologyObservatoryIntentV531.tsx", "utf8"), workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
describe("v531 historical shared-catalog observatory", () => {
  it("uses one extended thirty-three-detail catalog", () => { expect(source).toContain("KERR_PHOTON_METROLOGY_DETAILS_V531"); expect(source).toContain("KERR_PHOTON_METROLOGY_DETAIL_IDS_V531"); expect(source).not.toContain('"coordinate-atlas": lazy'); });
  it("keeps requests behind explicit selection while Workbench advances", () => { expect(source).toContain('data-atlas-v531-ranking-request-before-detail="false"'); expect(source).not.toContain("fetch("); expect(workbench).not.toContain('from "./KerrPhotonMetrologyObservatoryIntentV531"'); });
  it("keeps scene boundaries", () => { expect(source).toContain('data-atlas-v531-canvas-created="false"'); expect(source).toContain('data-atlas-v531-scene-revision-delta="0"'); expect(source).toContain('data-atlas-v531-physics-mutation="false"'); });
});
