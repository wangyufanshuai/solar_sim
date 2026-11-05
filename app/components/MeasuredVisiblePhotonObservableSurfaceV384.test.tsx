import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v384 visible photon observable surface", () => {
  it("renders four photon rows without electron or cinematic promotion", () => {
    const source = readFileSync(
      "app/components/MeasuredVisiblePhotonObservableSurfaceV384.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v384/visible-photon-observable",
    );
    expect(source).toContain("Photons weighted. Electrons withheld.");
    expect(source).toContain('data-atlas-v384-photon-observable="true"');
    expect(source).toContain('data-atlas-v384-electron-expectation="false"');
    expect(source).toContain('data-atlas-v384-observed-counts="false"');
    expect(source).toContain('data-atlas-v384-science-image="false"');
    expect(source).toContain('data-atlas-v384-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain(
      "<MeasuredVisiblePhotonObservableSurfaceV384 />",
    );
  });
});
